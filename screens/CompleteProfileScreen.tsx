import React, { useState } from 'react';
import { UserData } from '../types';

interface CompleteProfileScreenProps {
  userData: UserData;
  onBack: () => void;
  onSave: (data: Partial<UserData>) => void;
}

// LISTA OFICIAL DE LOS 39 MUNICIPIOS DE DURANGO
const DURANGO_MUNICIPIOS = [
  'Canatlán', 'Canelas', 'Coneto de Comonfort', 'Cuencamé', 'Durango', 
  'El Oro', 'General Simón Bolívar', 'Gómez Palacio', 'Guadalupe Victoria', 
  'Guanaceví', 'Hidalgo', 'Indé', 'Lerdo', 'Mapimí', 'Mezquital', 'Nazas', 
  'Nombre de Dios', 'Nuevo Ideal', 'Ocampo', 'Otáez', 'Pánuco de Coronado', 
  'Peñón Blanco', 'Poanas', 'Pueblo Nuevo', 'Rodeo', 'San Bernardo', 'San Dimas', 
  'San Juan de Guadalupe', 'San Juan del Río', 'San Luis del Cordero', 
  'San Pedro del Gallo', 'Santa Clara', 'Santiago Papasquiaro', 'Súchil', 
  'Tamazula', 'Tepehuanes', 'Tlahualilo', 'Topia', 'Vicente Guerrero'
];

const CompleteProfileScreen: React.FC<CompleteProfileScreenProps> = ({ userData, onBack, onSave }) => {
  
  const [form, setForm] = useState({
    address: userData.address || '',
    colony: userData.colony || '',
    zipCode: userData.zipCode || '',
    municipality: userData.municipality || 'Durango',
    phone: userData.phone || '',
    emergencyContact: userData.emergencyContact || '',
    emergencyPhone: userData.emergencyPhone || '',
    medicalConditions: userData.medicalConditions || ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // --- VALIDADORES EN TIEMPO REAL ---

  // 1. Solo Números (Para CP y Teléfonos)
  const handleNumericInput = (field: string, value: string, maxLength: number) => {
    if (/^\d*$/.test(value)) {
       if (value.length <= maxLength) {
           setForm(prev => ({ ...prev, [field]: value }));
           if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
       }
    }
  };

  // 2. Texto General a Mayúsculas (Dirección, Colonia, Alergias)
  // Permite números y símbolos comunes en direcciones (#, -)
  const handleUpperCaseInput = (field: string, value: string) => {
      setForm(prev => ({ ...prev, [field]: value.toUpperCase() }));
      if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  // 3. Solo Letras y Mayúsculas (Nombre Emergencia - Estricto)
  // Igual que en Registro: Solo A-Z y Ñ (Sin acentos, sin números)
  const handleNameInput = (value: string) => {
    const upper = value.toUpperCase();
    if (/^[A-ZÑ\s]*$/.test(upper)) {
        setForm(prev => ({ ...prev, emergencyContact: upper }));
        if (errors.emergencyContact) setErrors(prev => ({ ...prev, emergencyContact: '' }));
    }
  };

  // --- VALIDACIÓN FINAL AL GUARDAR ---
  const validateAndSave = () => {
    const newErrors: any = {};

    if (!form.address.trim()) newErrors.address = 'La calle y número son requeridos.';
    if (!form.colony.trim()) newErrors.colony = 'La colonia es requerida.';
    
    if (form.zipCode.length !== 5) newErrors.zipCode = 'El CP debe tener 5 dígitos.';
    if (form.phone.length !== 10) newErrors.phone = 'El teléfono debe tener 10 dígitos.';

    if (!form.emergencyContact.trim()) newErrors.emergencyContact = 'Nombre de contacto requerido.';
    if (form.emergencyPhone.length !== 10) newErrors.emergencyPhone = 'El teléfono debe tener 10 dígitos.';

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
        onSave(form);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-background-dark">
      
      {/* HEADER */}
      <header className="px-6 pt-10 pb-6 flex items-center justify-between bg-white dark:bg-surface-dark shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
             <button onClick={onBack} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition-colors">
                <span className="material-symbols-outlined">arrow_back</span>
             </button>
             <div>
                 <h1 className="text-xl font-black text-gray-900 dark:text-white">Completar Perfil</h1>
                 <p className="text-xs text-gray-500">Información para emergencias</p>
             </div>
        </div>
      </header>

      {/* BODY */}
      <main className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        
        {/* SECCIÓN 1: DOMICILIO */}
        <section className="space-y-4">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-2">Domicilio Actual</h3>
            
            <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-gray-500 ml-1">Calle y Número</label>
                <input 
                    value={form.address}
                    onChange={(e) => handleUpperCaseInput('address', e.target.value)}
                    placeholder="AV. 20 DE NOVIEMBRE #123"
                    className={`w-full h-12 px-4 rounded-xl bg-white dark:bg-gray-800 border-2 outline-none font-medium transition-all uppercase ${errors.address ? 'border-red-400' : 'border-gray-100 dark:border-gray-700 focus:border-primary'}`}
                />
                {errors.address && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.address}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-gray-500 ml-1">Código Postal</label>
                    <input 
                        inputMode="numeric"
                        value={form.zipCode}
                        onChange={(e) => handleNumericInput('zipCode', e.target.value, 5)}
                        placeholder="34000"
                        className={`w-full h-12 px-4 rounded-xl bg-white dark:bg-gray-800 border-2 outline-none font-medium transition-all ${errors.zipCode ? 'border-red-400' : 'border-gray-100 dark:border-gray-700 focus:border-primary'}`}
                    />
                    {errors.zipCode && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.zipCode}</p>}
                </div>
                
                <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-gray-500 ml-1">Colonia</label>
                    <input 
                        value={form.colony}
                        onChange={(e) => handleUpperCaseInput('colony', e.target.value)}
                        placeholder="CENTRO"
                        className={`w-full h-12 px-4 rounded-xl bg-white dark:bg-gray-800 border-2 outline-none font-medium transition-all uppercase ${errors.colony ? 'border-red-400' : 'border-gray-100 dark:border-gray-700 focus:border-primary'}`}
                    />
                     {errors.colony && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.colony}</p>}
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-gray-500 ml-1">Municipio</label>
                <div className="relative">
                    <select 
                        value={form.municipality}
                        onChange={(e) => setForm({...form, municipality: e.target.value})}
                        style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                        className="w-full h-12 px-4 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 focus:border-primary outline-none font-medium appearance-none"
                    >
                        {DURANGO_MUNICIPIOS.map(muni => (
                            <option key={muni} value={muni}>{muni}</option>
                        ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-3 text-gray-400 pointer-events-none bg-white dark:bg-gray-800 pl-2">expand_more</span>
                </div>
            </div>
        </section>

        {/* SECCIÓN 2: CONTACTO */}
        <section className="space-y-4">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-2">Contacto y Emergencia</h3>
            
            <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-gray-500 ml-1">Tu Teléfono Celular</label>
                <input 
                    inputMode="tel"
                    value={form.phone}
                    onChange={(e) => handleNumericInput('phone', e.target.value, 10)}
                    placeholder="618 123 4567"
                    className={`w-full h-12 px-4 rounded-xl bg-white dark:bg-gray-800 border-2 outline-none font-medium transition-all ${errors.phone ? 'border-red-400' : 'border-gray-100 dark:border-gray-700 focus:border-primary'}`}
                />
                 {errors.phone && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.phone}</p>}
            </div>

            <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl space-y-3 border border-red-100 dark:border-red-900/30">
                <div className="flex items-center gap-2 text-red-800 dark:text-red-400 mb-1">
                    <span className="material-symbols-outlined text-lg">medical_services</span>
                    <h4 className="font-black text-xs uppercase tracking-wider">En caso de accidente</h4>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-red-400 ml-1">Nombre Contacto Emergencia</label>
                    <input 
                        value={form.emergencyContact}
                        onChange={(e) => handleNameInput(e.target.value)}
                        placeholder="EJ. MARIA PEREZ (MADRE)"
                        className={`w-full h-12 px-4 rounded-xl bg-white dark:bg-gray-800 border-2 outline-none font-medium transition-all uppercase ${errors.emergencyContact ? 'border-red-400' : 'border-red-100 focus:border-red-400'}`}
                    />
                    {errors.emergencyContact && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.emergencyContact}</p>}
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-red-400 ml-1">Teléfono Emergencia</label>
                    <input 
                        inputMode="tel"
                        value={form.emergencyPhone}
                        onChange={(e) => handleNumericInput('emergencyPhone', e.target.value, 10)}
                        placeholder="618..."
                        className={`w-full h-12 px-4 rounded-xl bg-white dark:bg-gray-800 border-2 outline-none font-medium transition-all ${errors.emergencyPhone ? 'border-red-400' : 'border-red-100 focus:border-red-400'}`}
                    />
                    {errors.emergencyPhone && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.emergencyPhone}</p>}
                </div>
            </div>
            
            <div className="space-y-1">
                 <label className="text-xs font-bold uppercase text-gray-500 ml-1">Alergias o Condiciones Médicas</label>
                 <textarea 
                    value={form.medicalConditions}
                    onChange={(e) => handleUpperCaseInput('medicalConditions', e.target.value)}
                    placeholder="EJ. ALERGICO A PENICILINA, DIABETICO..."
                    className="w-full h-24 px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 focus:border-primary outline-none font-medium resize-none uppercase"
                 />
                 <p className="text-[10px] text-gray-400 text-right">Opcional</p>
            </div>

        </section>

      </main>

      {/* FOOTER */}
      <div className="p-6 bg-white/90 dark:bg-surface-dark/90 backdrop-blur-md border-t border-gray-100 dark:border-gray-800">
        <button 
            onClick={validateAndSave}
            className="w-full h-14 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-black text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
        >
            Guardar Información
            <span className="material-symbols-outlined">save</span>
        </button>
      </div>

    </div>
  );
};

export default CompleteProfileScreen;