import React, { useState } from 'react';
import { UserData } from '../types';

interface DocumentUploadScreenProps {
  onBack: () => void;
  onContinue: (data: Partial<UserData>) => void;
}

const DocumentUploadScreen: React.FC<DocumentUploadScreenProps> = ({ onBack, onContinue }) => {
  
  // Límite de 5MB
  const MAX_FILE_SIZE = 5 * 1024 * 1024;

  // Estado para el Checkbox de discapacidad
  const [hasDisability, setHasDisability] = useState(false);

  // Estado para saber CUÁL campo tiene error (ej: 'ineFront')
  const [errorField, setErrorField] = useState<string | null>(null);

  // Estado para los archivos
  const [docs, setDocs] = useState<Record<string, string>>({
    ineFront: '',
    ineBack: '',
    addressProof: '',
    birthCertificate: '',
    disabilityProof: ''
  });

  // Manejador de carga
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    // 1. Limpiamos errores previos al intentar subir algo nuevo
    if (errorField === field) setErrorField(null);

    const file = e.target.files?.[0];

    if (file) {
      // 2. VALIDACIÓN DE PESO (Detectar Error)
      if (file.size > MAX_FILE_SIZE) {
        setErrorField(field); // Marcamos este campo específico con error
        
        // Limpiamos el valor del input para permitir reintentar
        e.target.value = ''; 
        
        // Opcional: Si quieres borrar la imagen anterior que estaba bien, descomenta esto:
        // setDocs(prev => ({ ...prev, [field]: '' })); 
        return;
      }

      // 3. PROCESAMIENTO (Éxito)
      const reader = new FileReader();
      reader.onloadend = () => {
        setDocs(prev => ({ ...prev, [field]: reader.result as string }));
        setErrorField(null); // Aseguramos que no haya error
      };
      reader.readAsDataURL(file);
    }
  };

  // Helper para renderizar la vista previa o el mensaje de error
  const renderThumbnail = (base64: string, isError: boolean) => {
    // CASO 1: Error (Prioridad Alta - Cuadro Rojo)
    if (isError) {
      return (
        <div className="flex flex-col items-center justify-center text-red-500 animate-in zoom-in duration-200 p-2 text-center">
           <span className="material-symbols-outlined text-4xl mb-1">error</span>
           <span className="text-xs font-bold uppercase">Archivo muy pesado</span>
           <span className="text-[10px] mt-1">El límite es de 5MB</span>
        </div>
      );
    }

    // CASO 2: Vacío (Estado Inicial)
    if (!base64) {
      return <span className="material-symbols-outlined text-4xl text-gray-300">cloud_upload</span>;
    }

    // CASO 3: PDF cargado
    if (base64.startsWith('data:application/pdf')) {
      return (
        <div className="flex flex-col items-center justify-center text-red-500">
           <span className="material-symbols-outlined text-4xl">picture_as_pdf</span>
           <span className="text-[10px] font-bold uppercase">PDF Listo</span>
        </div>
      );
    }
    
    // CASO 4: Imagen cargada
    return <img src={base64} alt="Preview" className="w-full h-full object-cover" />;
  };

  /**
   * Componente Helper para no repetir código en cada input.
   * Decide los colores del borde y el contenido.
   */
  const renderDocumentUpload = (label: string, fieldKey: string) => {
    const isError = errorField === fieldKey;
    const hasValue = !!docs[fieldKey];
    
    // Clases dinámicas para el borde y fondo
    let borderClass = "border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"; // Default
    
    if (isError) {
        borderClass = "border-red-500 bg-red-50 dark:bg-red-900/20"; // Error (Rojo)
    } else if (hasValue) {
        borderClass = "border-green-500 bg-green-50 dark:bg-green-900/10"; // Éxito (Verde)
    }

    return (
      <div>
        <label className={`text-xs font-bold uppercase mb-2 block ${isError ? 'text-red-500' : 'text-gray-400'}`}>
          {label}
        </label>
        
        <label className={`h-40 border-2 border-dashed rounded-2xl flex items-center justify-center cursor-pointer transition-all overflow-hidden relative ${borderClass}`}>
            <input 
              type="file" 
              accept="image/*,application/pdf" 
              className="hidden" 
              onChange={(e) => handleFileChange(e, fieldKey)}
            />
            {renderThumbnail(docs[fieldKey], isError)}
        </label>
      </div>
    );
  };

  // Validación para el botón continuar
  const isComplete = 
    docs.ineFront && 
    docs.ineBack && 
    docs.addressProof && 
    docs.birthCertificate &&
    (!hasDisability || docs.disabilityProof) &&
    !errorField; // No dejar continuar si hay un error activo visible

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark relative">
      
      {/* HEADER */}
      <header className="flex items-center p-4 justify-between sticky top-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md z-10">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <h2 className="text-lg font-bold">Documentación</h2>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 pb-24">
        <div className="py-4">
           <p className="text-sm text-gray-500 mb-6">
             Sube fotos claras o PDF. <br/>
             <span className="text-xs opacity-70">El tamaño máximo por archivo es de 5MB.</span>
           </p>
           
           <div className="space-y-6">
             
             {/* Usamos el helper para renderizar cada campo limpio y con lógica de error */}
             {renderDocumentUpload('INE (Frente)', 'ineFront')}
             {renderDocumentUpload('INE (Reverso)', 'ineBack')}
             {renderDocumentUpload('Comprobante de Domicilio', 'addressProof')}
             {renderDocumentUpload('Acta de Nacimiento', 'birthCertificate')}

             <hr className="border-gray-200 dark:border-gray-700 my-4" />

             {/* SECCIÓN DISCAPACIDAD */}
             <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 transition-all">
               <div className="flex items-center justify-between mb-4">
                 <div>
                   <h3 className="font-bold text-sm">¿Tienes alguna discapacidad?</h3>
                   <p className="text-xs text-gray-500">Habilita para adjuntar certificado.</p>
                 </div>
                 
                 <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={hasDisability}
                      onChange={(e) => setHasDisability(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black dark:peer-checked:bg-white/90"></div>
                 </label>
               </div>

               {hasDisability && (
                 <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                   {renderDocumentUpload('Certificado Médico', 'disabilityProof')}
                 </div>
               )}
             </div>

           </div>
        </div>
      </main>

      {/* FOOTER */}
      <div className="p-6 absolute bottom-0 left-0 right-0 bg-white/90 dark:bg-surface-dark/90 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 z-20">
        <button 
          onClick={() => onContinue({ documents: docs, hasDisability })}
          disabled={!isComplete}
          className="w-full h-14 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-black text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Guardar y Continuar
          <span className="material-symbols-outlined">save</span>
        </button>
      </div>
    </div>
  );
};

export default DocumentUploadScreen;