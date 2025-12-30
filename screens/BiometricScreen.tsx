import React, { useState, useEffect } from 'react';

interface BiometricScreenProps {
  onBack: () => void;
  onComplete: (photoUrl: string) => void;
}

const BiometricScreen: React.FC<BiometricScreenProps> = ({ onBack, onComplete }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // Simulación del proceso de escaneo
  useEffect(() => {
    let interval: any;
    if (isScanning) {
      interval = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsScanning(false);
            // Simular finalización y enviar foto
            onComplete('https://randomuser.me/api/portraits/men/32.jpg'); 
            return 100;
          }
          return prev + 2; // Velocidad de escaneo
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isScanning, onComplete]);

  const startScan = () => {
    setIsScanning(true);
    setScanProgress(0);
  };

  return (
    // CORRECCIÓN CLAVE: 'fixed inset-0 z-50'
    // Esto saca al componente del contenedor blanco y lo fuerza a pantalla completa
    <div className="fixed inset-0 z-50 flex flex-col bg-black h-[100dvh] w-screen overflow-hidden">
      
      {/* 1. ENCABEZADO (Fijo arriba) */}
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

      {/* 2. ÁREA DE CÁMARA (Ocupa toda la pantalla detrás) */}
      <div className="flex-1 relative w-full h-full flex items-center justify-center bg-gray-900">
        
        {/* IMAGEN DE FONDO (CÁMARA) - Ocupa el 100% real */}
        <img 
            src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1000&auto=format&fit=crop" 
            alt="Camera Feed" 
            className="absolute inset-0 w-full h-full object-cover opacity-90"
        />

        {/* MÁSCARA SVG (El óvalo negro) */}
        <div className="absolute inset-0 z-10 pointer-events-none">
            <svg className="w-full h-full" preserveAspectRatio="none">
                <defs>
                    <mask id="mask">
                        <rect width="100%" height="100%" fill="white" />
                        {/* El agujero del óvalo */}
                        <ellipse cx="50%" cy="45%" rx="38%" ry="30%" fill="black" />
                    </mask>
                </defs>
                {/* Capa oscura exterior */}
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

      {/* 3. CONTROLES (Fijo abajo) */}
      <div className="shrink-0 bg-black/90 backdrop-blur-xl p-8 pb-10 flex flex-col items-center justify-center z-20 border-t border-white/10 rounded-t-3xl absolute bottom-0 left-0 right-0">
          
          {!isScanning ? (
              // Botón de Captura
              <button 
                onClick={startScan}
                className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center p-1 hover:scale-105 active:scale-95 transition-transform shadow-lg shadow-white/20"
              >
                  <div className="w-full h-full bg-white rounded-full"></div>
              </button>
          ) : (
              // Barra de Progreso
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