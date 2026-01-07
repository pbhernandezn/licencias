import React, { useState, useEffect, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';

// ============================================================================
// ⬇️⬇️⬇️ LÓGICA DE CONEXIÓN CON AZURE (SOLUCIÓN HARDCODED) ⬇️⬇️⬇️
// ============================================================================

/**
 * Convierte el Base64 (texto) de la cámara a un BLOB (Binario).
 */
const dataURItoBlob = (dataURI: string) => {
    try {
        const byteString = atob(dataURI.split(',')[1]); 
        const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length); 
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i); 
        }
        return new Blob([ab], { type: mimeString }); 
    } catch (e) {
        console.error("Error convirtiendo imagen a binario", e);
        return null;
    }
};

// Función para consultar a Azure (VERSIÓN CORREGIDA Y DIRECTA)
const detectFaceInAzure = async (imageSrc: string) => {
    try {
        console.log("1. Iniciando proceso de Azure...");
        
        // --- 🔴 ZONA DE CONFIGURACIÓN DIRECTA 🔴 ---
        // Ponemos los datos aquí dentro para evitar errores de variables globales vacías
        
        const AZURE_ENDPOINT_URL = "https://dgofacerecognition.cognitiveservices.azure.com"; // Tu URL real
        const AZURE_API_KEY = "9ft2m6AfL9Lzr4F3UQ79dPmIaKofKOQzWDona84t8De3TzLtwuaEJQQJ99CAACYeBjFXJ3w3AAAKACOGbMLA"; // <--- ⚠️ PON TU LLAVE 1 AQUÍ (La larga)

      
        // 1. Convertir imagen
        const imageBlob = dataURItoBlob(imageSrc);
        if (!imageBlob) throw new Error("Error al procesar la imagen");

        // 2. Construir URL Completa
        const url = `${AZURE_ENDPOINT_URL}/face/v1.0/detect?returnFaceId=true&returnFaceAttributes=qualityForRecognition&detectionModel=detection_03&recognitionModel=recognition_04`;

        // 🔍 DEBUG: Mostrar la URL para asegurar que no es relativa
        // alert("CONECTANDO A:\n" + url); // Descomenta si quieres ver la URL en pantalla

        // 3. Petición Fetch
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/octet-stream', 
                'Ocp-Apim-Subscription-Key': AZURE_API_KEY
            },
            body: imageBlob
        });

        console.log("3. Estatus HTTP:", response.status);

        // 🔴 DEBUG ERROR
        if (!response.ok) {
            const errorText = await response.text(); 
            console.error("🔥 Error Azure:", errorText);
            
            // Si es error de HTML (lo que te pasaba antes), avisamos claro
            if (errorText.startsWith("<!DOCTYPE")) {
                alert("ERROR DE CONEXIÓN:\nEl celular no tiene salida a internet o la URL está bloqueada.");
            } else {
                alert("ERROR AZURE (" + response.status + "):\n" + errorText.substring(0, 150));
            }
            throw new Error(`Error ${response.status}`);
        }

        const data = await response.json();
        
        // 🟢 DEBUG ÉXITO
        // alert("✅ ÉXITO AZURE:\n" + JSON.stringify(data, null, 2)); // Comentar luego de probar

        if (data.length === 0) {
            return { success: false, message: "No se detectó rostro. Intenta de nuevo." };
        }

        // Validación de calidad
        const quality = data[0].faceAttributes?.qualityForRecognition;
        console.log("Calidad:", quality);

        if (quality === 'Low') {
            return { success: false, message: "Mala iluminación o foto borrosa." };
        }

        return { success: true, faceId: data[0].faceId };

    } catch (error: any) {
        console.error("Catch Error:", error);
        return { success: false, message: error.message || "Error de conexión desconocido." };
    }
};

// ============================================================================
// ⬆️⬆️⬆️ FIN LÓGICA AZURE ⬆️⬆️⬆️
// ============================================================================

interface BiometricScreenProps {
  onBack: () => void;
  onComplete: (photoUrl: string) => void;
}

const BiometricScreen: React.FC<BiometricScreenProps> = ({ onBack, onComplete }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const webcamRef = useRef<Webcam>(null);

  const videoConstraints = {
    facingMode: "user"
  };

  useEffect(() => {
    let interval: any;
    if (isScanning && !isValidating) {
      interval = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            finishScan(); 
            return 100;
          }
          return prev + 2;
        });
      }, 40);
    }
    return () => clearInterval(interval);
  }, [isScanning, isValidating]);

  const startScan = () => {
    if (cameraError) {
        alert("Resuelve el error de cámara antes de iniciar.");
        return;
    }
    setIsScanning(true);
    setIsValidating(false);
    setScanProgress(0);
    setCameraError(null);
  };

  const finishScan = useCallback(async () => {
    setIsValidating(true); 
    
    const imageSrc = webcamRef.current?.getScreenshot();
    
    if (imageSrc) {
        const result = await detectFaceInAzure(imageSrc);

        if (result.success) {
            setIsScanning(false);
            setIsValidating(false);
            onComplete(imageSrc); 
        } else {
            setIsScanning(false);
            setIsValidating(false);
            setCameraError(result.message);
        }
    } else {
        setIsScanning(false);
        setIsValidating(false);
        onComplete('https://randomuser.me/api/portraits/men/32.jpg');
    }
  }, [webcamRef, onComplete]);

  const handleUserMediaError = useCallback((error: string | DOMException) => {
      console.error("Error de cámara:", error);
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
          setCameraError("Requiere HTTPS.");
      } else {
          setCameraError("Acceso denegado.");
      }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black h-[100dvh] w-screen overflow-hidden">
      
      {/* 1. ENCABEZADO */}
      <div className="shrink-0 h-16 px-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent z-20 absolute top-0 left-0 right-0 safe-top">
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
                className="absolute inset-0 w-full h-full object-cover" 
                mirrored={true}
                onUserMediaError={handleUserMediaError}
                onUserMedia={() => setCameraError(null)}
                screenshotQuality={0.92}
                disablePictureInPicture={false}
                forceScreenshotSourceSize={false}
                imageSmoothing={true}
            />
        ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center z-10 bg-gray-900/90 backdrop-blur-sm">
                <span className="material-symbols-outlined text-6xl text-red-500 mb-4">warning</span>
                <p className="text-white font-bold text-lg">Validación Fallida</p>
                <p className="text-gray-300 text-sm mt-2 max-w-xs">{cameraError}</p>
                <button 
                    onClick={() => setCameraError(null)} 
                    className="mt-6 px-6 py-3 bg-white text-black rounded-full text-sm font-bold shadow-lg active:scale-95 transition-transform"
                >
                    Intentar de nuevo
                </button>
            </div>
        )}

        {/* MÁSCARA SVG */}
        <div className="absolute inset-0 z-10 pointer-events-none">
            <svg className="w-full h-full" preserveAspectRatio="none">
                <defs>
                    <mask id="mask">
                        <rect width="100%" height="100%" fill="white" />
                        <ellipse cx="50%" cy="45%" rx="28%" ry="22%" fill="black" />
                    </mask>
                </defs>
                <rect width="100%" height="100%" fill="rgba(0,0,0,0.85)" mask="url(#mask)" />
            </svg>
            
            <div className="absolute inset-0 flex items-center justify-center" style={{ paddingBottom: '10%' }}>
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
                <p className="text-white font-medium drop-shadow-md bg-black/40 backdrop-blur-md inline-block px-6 py-2 rounded-full text-sm border border-white/10 transition-all">
                    {isValidating 
                        ? <span className="flex items-center gap-2"><span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></span> Verificando rostro...</span> 
                        : isScanning 
                            ? `Escaneando... ${scanProgress}%` 
                            : 'Aleja el teléfono hasta encajar tu rostro'
                    }
                </p>
            </div>
        )}
      </div>

      {/* 3. CONTROLES */}
      <div className="shrink-0 bg-black/90 backdrop-blur-xl p-8 pb-10 flex flex-col items-center justify-center z-20 border-t border-white/10 rounded-t-3xl absolute bottom-0 left-0 right-0 safe-bottom">
          
          {!isScanning && !isValidating ? (
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
                    className={`h-full transition-all duration-300 ease-out ${isValidating ? 'bg-green-500 w-full animate-pulse' : 'bg-primary'}`}
                    style={{ width: isValidating ? '100%' : `${scanProgress}%` }}
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