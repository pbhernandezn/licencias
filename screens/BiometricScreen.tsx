import React, { useState, useEffect, useRef, useCallback } from 'react';
import Webcam from 'react-webcam'; // <--- IMPORTANTE

interface BiometricScreenProps {
  onBack: () => void;
  onComplete: (photoUrl: string) => void;
}

const BiometricScreen: React.FC<BiometricScreenProps> = ({ onBack, onComplete }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const webcamRef = useRef<Webcam>(null); // Referencia a la cámara

  // Configuración de video para móviles (usa la cámara frontal)
  const videoConstraints = {
    width: 720,
    height: 1280,
    facingMode: "user"
  };

  // Simulación del proceso de escaneo visual
  useEffect(() => {
    let interval: any;
    if (isScanning) {
      interval = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            finishScan(); // Al terminar, capturamos la foto
            return 100;
          }
          return prev + 2;
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isScanning]);

  const startScan = () => {
    setIsScanning(true);
    setScanProgress(0);
  };

  // Función para capturar la foto real y terminar
  const finishScan = useCallback(() => {
    setIsScanning(false);
    // Captura la imagen actual de la webcam en formato base64
    const imageSrc = webcamRef.current?.getScreenshot();
    
    if (imageSrc) {
        onComplete(imageSrc); // Enviamos la foto real tomada
    } else {
        // Fallback por si acaso falla la cámara
        onComplete('https://randomuser.me/api/portraits/men/32.jpg');
    }
  }, [webcamRef, onComplete]);

  return (
    // CONTENEDOR FLOTANTE A PANTALLA COMPLETA
    <div className="fixed inset-0 z-50 flex flex-col bg-black h-[100dvh] w-screen overflow-hidden">
      
      {/* 1. ENCABEZADO */}
      <div className="shrink-0 h-16 px-6 flex justify-between items-center bg-gradient-to-b from-black/90 to-transparent z-20 absolute top-0 left-0 right-0">
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

      {/* 2. ÁREA DE CÁMARA REAL */}
      <div className="flex-1 relative w-full h-full flex items-center justify-center bg-gray-900">
        
        {/* COMPONENTE DE CÁMARA REAL */}
        <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            className="absolute inset-0 w-full h-full object-cover"
            mirrored={true} // Efecto espejo como en los celulares
        />

        {/* MÁSCARA SVG (El óvalo negro) */}
        <div className="absolute inset-0 z-10 pointer-events-none">
            <svg className="w-full h-full" preserveAspectRatio="none">
                <defs>
                    <mask id="mask">
                        <rect width="100%" height="100%" fill="white" />
                        <ellipse cx="50%" cy="45%" rx="38%" ry="30%" fill="black" />
                    </mask>
                </defs>
                <rect width="100%" height="100%" fill="rgba(0,0,0,0.85)" mask="url(#mask)" />
            </svg>
            
            {/* Borde visual del óvalo */}
            <div className="absolute inset-0 flex items-center justify-center" style={{ paddingBottom: '10%' }}>
                <div className={`w-[76%] aspect-[3/4] max-h-[60%] rounded-[50%] border-2 border-dashed transition-all duration-500 ${isScanning ? 'border-primary shadow-[0_0_50px_rgba(59,130,246,0.6)]' : 'border-white/40'}`}></div>
            </div>

             {/* LÍNEA DE ESCANEO */}
            {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ paddingBottom: '10%' }}>
                     <div className="w-[76%] aspect-[3/4] max-h-[60%] rounded-[50%] overflow-hidden relative">
                         <div className="absolute top-0 left-0 right-0 h-1 bg-blue-400 shadow-[0_0_20px_rgba(59,130,246,1)] animate-scan"></div>
                     </div>
                </div>
            )}
        </div>

        {/* TEXTO DE ESTADO */}
        <div className="absolute bottom-32 left-0 right-0 z-20 text-center px-4">
             <p className="text-white font-medium drop-shadow-md bg-black/40 backdrop-blur-md inline-block px-6 py-2 rounded-full text-sm border border-white/10">
                 {isScanning ? `Validando identidad... ${scanProgress}%` : 'Coloca tu rostro dentro del marco'}
             </p>
        </div>
      </div>

      {/* 3. CONTROLES */}
      <div className="shrink-0 bg-black/90 backdrop-blur-xl p-8 pb-10 flex flex-col items-center justify-center z-20 border-t border-white/10 rounded-t-3xl absolute bottom-0 left-0 right-0">
          
          {!isScanning ? (
              <button 
                onClick={startScan}
                className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center p-1 hover:scale-105 active:scale-95 transition-transform shadow-lg shadow-white/20"
              >
                  <div className="w-full h-full bg-white rounded-full"></div>
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
              El sistema validará tus rasgos faciales con la base de datos oficial.
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