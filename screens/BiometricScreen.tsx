import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

interface BiometricScreenProps {
  onBack: () => void;
  onComplete: (photoUrl: string) => void;
}

const BiometricScreen: React.FC<BiometricScreenProps> = ({ onBack, onComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [progress, setProgress] = useState(0);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Cargar modelos de IA y encender cámara
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = '/models'; 
        
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        setModelsLoaded(true);
        startCamera();
      } catch (err) {
        // No mostramos error fatal para permitir el "Omitir"
        // setError("Error cargando IA."); 
      }
    };
    loadModels();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 900 } } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Cámara no disponible");
      // setError("No se pudo acceder a la cámara.");
    }
  };

  // 2. Loop de detección de rostro
  useEffect(() => {
    if (!modelsLoaded || !videoRef.current) return;

    const interval = setInterval(async () => {
      if (videoRef.current && !videoRef.current.paused && !videoRef.current.ended) {
        
        // Detectar rostro
        const detections = await faceapi.detectAllFaces(
          videoRef.current, 
          new faceapi.TinyFaceDetectorOptions()
        );

        const isFacePresent = detections.length > 0;
        setFaceDetected(isFacePresent);

        if (canvasRef.current) {
          const displaySize = { 
            width: videoRef.current.videoWidth, 
            height: videoRef.current.videoHeight 
          };
          faceapi.matchDimensions(canvasRef.current, displaySize);
          const resizedDetections = faceapi.resizeResults(detections, displaySize);
          
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, displaySize.width, displaySize.height);
            faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
          }
        }

        if (isFacePresent) {
          setProgress(prev => {
            if (prev >= 100) return 100;
            return prev + 2; 
          });
        }
      }
    }, 100); 

    return () => clearInterval(interval);
  }, [modelsLoaded]);

  // 3. Finalizar y Capturar Foto
  useEffect(() => {
    if (progress >= 100 && videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);
      const photoUrl = canvas.toDataURL('image/jpeg');
      
      onComplete(photoUrl);
    }
  }, [progress, onComplete]);

  // --- FUNCIÓN PARA EL BOTÓN DE OMITIR ---
  const handleSkip = () => {
    // Enviamos una imagen de placeholder (Avatar) como si fuera la foto capturada
    onComplete("https://api.dicebear.com/7.x/avataaars/svg?seed=SkipUser&backgroundColor=b6e3f4");
  };

  return (
    <div className="flex flex-col h-full bg-black text-white relative">
      <header className="flex items-center p-4 justify-between absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-colors">
          <span className="material-symbols-outlined">close</span>
        </button>
        
        <h2 className="text-lg font-bold">Verificación Facial</h2>
        
        {/* BOTÓN DE OMITIR (DEV) */}
        <button 
          onClick={handleSkip}
          className="px-3 py-1 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-xs font-bold transition-all border border-white/10"
        >
          Omitir ⏩
        </button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
        {error ? (
          <div className="text-center p-6 bg-red-900/50 rounded-xl space-y-4">
             <p>{error}</p>
             <button onClick={handleSkip} className="bg-white text-black px-4 py-2 rounded-lg text-sm font-bold">
               Saltar este paso
             </button>
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
             <video 
                ref={videoRef}
                autoPlay 
                playsInline 
                muted
                className="absolute w-full h-full object-cover"
              />
              
              <canvas 
                ref={canvasRef}
                className="absolute w-full h-full object-cover z-10 opacity-70"
              />

              <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                <div className={`w-[80%] aspect-[3/4] border-4 rounded-[3rem] relative transition-colors duration-300 ${faceDetected ? 'border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.5)]' : 'border-white/30'}`}>
                  
                  {faceDetected && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-green-400 shadow-[0_0_20px_#4ade80] animate-scan opacity-80"></div>
                  )}

                  {!faceDetected && modelsLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="bg-black/50 px-4 py-2 rounded-lg text-sm font-bold backdrop-blur-sm">
                        Coloca tu rostro aquí
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="absolute bottom-10 left-10 right-10 z-30">
                <div className="flex justify-between text-xs font-bold uppercase mb-2 tracking-widest">
                  <span>Analizando Biometría</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${faceDetected ? 'bg-green-500' : 'bg-yellow-500'}`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                {!modelsLoaded && <p className="text-center text-xs mt-2 text-gray-400">Coloca tu rostro frente a la cámara</p>}
              </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BiometricScreen;