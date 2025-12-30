import React, { useState, useEffect, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';

interface BiometricScreenProps {
  onBack: () => void;
  onComplete: (photoUrl: string) => void;
}

const BiometricScreen: React.FC<BiometricScreenProps> = ({ onBack, onComplete }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const webcamRef = useRef<Webcam>(null);

  // CORRECCIÓN 1: Quitamos width/height ideales. 
  // Dejamos que el navegador elija la resolución nativa del sensor (suele ser más angular).
  const videoConstraints = {
    facingMode: "user"
  };

  useEffect(() => {
    let interval: any;
    if (isScanning) {
      interval = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            finishScan();
            return 100;
          }
          return prev + 2;
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isScanning]);

  const startScan = () => {
    if (cameraError) {
        alert("No se puede iniciar: " + cameraError);
        return;
    }
    setIsScanning(true);
    setScanProgress(0);
  };

  const finishScan = useCallback(() => {
    setIsScanning(false);
    const imageSrc = webcamRef.current?.getScreenshot();
    
    if (imageSrc) {
        onComplete(imageSrc);
    } else {
        onComplete('https://randomuser.me/api/portraits/men/32.jpg');
    }
  }, [webcamRef, onComplete]);

  const handleUserMediaError = useCallback((error: string | DOMException) => {
      console.error("Error de cámara:", error);
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
          setCameraError("Requiere HTTPS. Sube a Vercel.");
      } else {
          setCameraError("Acceso denegado.");
      }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black h-[100dvh] w-screen overflow-hidden">
      
      {/* 1. ENCABEZADO */}
      <div className="shrink-0 h-16 px-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent z-20 absolute top-0 left-0 right-0">
        <button 
            onClick={onBack} 
            className="w-10 h-10 rounded-full bg-black/40 border border-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-all"
        >
            <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="text-right">
            <h2 className="text-white font-bold text-base drop-shadow-md">Biométricos</h2>
            <p className="text-white/80 text-xs drop-shadow-md">Rostro descubierto</p>
        </div>
      </div>

      {/* 2. ÁREA DE CÁMARA */}
      <div className="flex-1 relative w-full h-full flex items-center justify-center bg-gray-900">
        
        {!cameraError ? (
            <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                // Usamos object-cover para llenar, pero si sigue muy cerca, 
                // podrías probar 'object-contain' (aunque dejará bordes negros).
                className="absolute inset-0 w-full h-full object-cover" 
                mirrored={true}
                onUserMediaError={handleUserMediaError}
                onUserMedia={() => setCameraError(null)}
            />
        ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center z-10 bg-gray-900">
                <span className="material-symbols-outlined text-6xl text-red-500 mb-4">videocam_off</span>
                <p className="text-white font-bold text-lg">Cámara no disponible</p>
                <p className="text-gray-400 text-sm mt-2">{cameraError}</p>
            </div>
        )}

        {/* MÁSCARA SVG */}
        <div className="absolute inset-0 z-10 pointer-events-none">
            <svg className="w-full h-full" preserveAspectRatio="none">
                <defs>
                    <mask id="mask">
                        <rect width="100%" height="100%" fill="white" />
                        
                        {/* CORRECCIÓN 2: Óvalo MÁS PEQUEÑO */}
                        {/* Antes rx="38%" ry="30%" -> Ahora rx="28%" ry="22%" */}
                        {/* Esto obliga al usuario a alejar el teléfono para encajar su cara */}
                        <ellipse cx="50%" cy="45%" rx="28%" ry="22%" fill="black" />
                    </mask>
                </defs>
                <rect width="100%" height="100%" fill="rgba(0,0,0,0.85)" mask="url(#mask)" />
            </svg>
            
            {/* Borde visual del óvalo (Ajustado al nuevo tamaño) */}
            <div className="absolute inset-0 flex items-center justify-center" style={{ paddingBottom: '10%' }}>
                {/* Ajustamos width y max-h para coincidir con la elipse más pequeña */}
                <div className={`w-[56%] aspect-[3/4] max-h-[44%] rounded-[50%] border-2 border-dashed transition-all duration-500 ${isScanning ? 'border-primary shadow-[0_0_50px_rgba(59,130,246,0.6)]' : 'border-white/40'}`}></div>
            </div>

            {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ paddingBottom: '10%' }}>
                     <div className="w-[56%] aspect-[3/4] max-h-[44%] rounded-[50%] overflow-hidden relative">
                         <div className="absolute top-0 left-0 right-0 h-1 bg-blue-400 shadow-[0_0_20px_rgba(59,130,246,1)] animate-scan"></div>
                     </div>
                </div>
            )}
        </div>

        {/* TEXTO DE ESTADO */}
        {!cameraError && (
            <div className="absolute bottom-32 left-0 right-0 z-20 text-center px-4">
                <p className="text-white font-medium drop-shadow-md bg-black/40 backdrop-blur-md inline-block px-6 py-2 rounded-full text-sm border border-white/10">
                    {isScanning ? `Validando... ${scanProgress}%` : 'Aleja el teléfono hasta encajar tu rostro'}
                </p>
            </div>
        )}
      </div>

      {/* 3. CONTROLES */}
      <div className="shrink-0 bg-black/90 backdrop-blur-xl p-8 pb-10 flex flex-col items-center justify-center z-20 border-t border-white/10 rounded-t-3xl absolute bottom-0 left-0 right-0">
          
          {!isScanning ? (
              <button 
                onClick={startScan}
                disabled={!!cameraError}
                className={`w-16 h-16 rounded-full border-4 flex items-center justify-center p-1 transition-transform shadow-lg ${cameraError ? 'border-gray-600 opacity-50 cursor-not-allowed' : 'border-white hover:scale-105 active:scale-95 shadow-white/20'}`}
              >
                  <div className={`w-full h-full rounded-full ${cameraError ? 'bg-gray-600' : 'bg-white'}`}></div>
              </button>
          ) : (
              <div className="w-full max-w-xs h-2 bg-gray-800 rounded-full overflow-hidden mt-2">
                  <div 
                    className="h-full bg-primary transition-all duration-75 ease-linear"
                    style={{ width: `${scanProgress}%` }}
                  ></div>
              </div>
          )}
          
          <p className="text-gray-400 text-[11px] mt-4 text-center max-w-xs">
              Manten tu rostro quieto y con buena luz.
          </p>
      </div>

      <style>{`
        @keyframes scan {
            0% { top: 0%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
        }
        .animate-scan {
            animation: scan 2s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default BiometricScreen;