import React, { useState } from 'react';
import { UserData } from '../types';

interface DocumentUploadScreenProps {
  onBack: () => void;
  onContinue: (data: Partial<UserData>) => void; // Para guardar en App.tsx
}

const DocumentUploadScreen: React.FC<DocumentUploadScreenProps> = ({ onBack, onContinue }) => {
  
  // Estado local para los archivos
  const [docs, setDocs] = useState({
    ineFront: '',
    ineBack: '',
    addressProof: ''
  });

  // Función para leer archivo y convertir a Base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Guardamos el string base64 completo (incluye el mime type: data:application/pdf...)
        setDocs(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Helper para renderizar la vista previa PEQUEÑA en esta pantalla
  const renderThumbnail = (base64: string) => {
    if (!base64) return <span className="material-symbols-outlined text-4xl text-gray-300">cloud_upload</span>;

    // Detectar si es PDF
    if (base64.startsWith('data:application/pdf')) {
      return (
        <div className="flex flex-col items-center justify-center text-red-500">
           <span className="material-symbols-outlined text-4xl">picture_as_pdf</span>
           <span className="text-[10px] font-bold uppercase">PDF Cargado</span>
        </div>
      );
    }
    
    // Si es imagen
    return <img src={base64} alt="Preview" className="w-full h-full object-cover" />;
  };

  const isComplete = docs.ineFront && docs.ineBack && docs.addressProof;

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
      {/* HEADER */}
      <header className="flex items-center p-4 justify-between sticky top-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md z-10">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <h2 className="text-lg font-bold">Carga de Documentos</h2>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 pb-24">
        <div className="py-4">
           <p className="text-sm text-gray-500 mb-6">Sube fotos claras o archivos PDF de tus documentos oficiales.</p>
           
           <div className="space-y-6">
              
              {/* 1. INE FRENTE */}
              <div>
                  <label className="text-xs font-bold uppercase text-gray-400 mb-2 block">INE (Frente)</label>
                  <label className="h-40 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors overflow-hidden relative">
                      <input 
                        type="file" 
                        accept="image/*,application/pdf" 
                        className="hidden" 
                        onChange={(e) => handleFileChange(e, 'ineFront')}
                      />
                      {renderThumbnail(docs.ineFront)}
                  </label>
              </div>

              {/* 2. INE REVERSO */}
              <div>
                  <label className="text-xs font-bold uppercase text-gray-400 mb-2 block">INE (Reverso)</label>
                  <label className="h-40 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors overflow-hidden relative">
                      <input 
                        type="file" 
                        accept="image/*,application/pdf" 
                        className="hidden" 
                        onChange={(e) => handleFileChange(e, 'ineBack')}
                      />
                      {renderThumbnail(docs.ineBack)}
                  </label>
              </div>

              {/* 3. COMPROBANTE DOMICILIO */}
              <div>
                  <label className="text-xs font-bold uppercase text-gray-400 mb-2 block">Comprobante de Domicilio</label>
                  <label className="h-40 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors overflow-hidden relative">
                      <input 
                        type="file" 
                        accept="image/*,application/pdf" 
                        className="hidden" 
                        onChange={(e) => handleFileChange(e, 'addressProof')}
                      />
                      {renderThumbnail(docs.addressProof)}
                  </label>
                  <p className="text-[10px] text-gray-400 mt-1 text-right">Aceptamos PDF, JPG, PNG.</p>
              </div>

           </div>
        </div>
      </main>

      <div className="p-6 absolute bottom-0 left-0 right-0 bg-white/90 dark:bg-surface-dark/90 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 z-20">
        <button 
          onClick={() => onContinue({ documents: docs })}
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