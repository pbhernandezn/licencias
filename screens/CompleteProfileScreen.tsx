import React, { useState, useEffect, useRef } from 'react';
import { UserData } from '../types';

interface CompleteProfileScreenProps {
  userData: UserData;
  onBack: () => void;
  onSave: (data: Partial<UserData>) => void;
}

// --- LISTA DE MUNICIPIOS ---
const DURANGO_MUNICIPIOS = [
  'CANATLÁN', 'CANELAS', 'CONETO DE COMONFORT', 'CUENCAMÉ', 'DURANGO', 
  'EL ORO', 'GENERAL SIMÓN BOLÍVAR', 'GÓMEZ PALACIO', 'GUADALUPE VICTORIA', 
  'GUANACEVÍ', 'HIDALGO', 'INDÉ', 'LERDO', 'MAPIMÍ', 'MEZQUITAL', 'NAZAS', 
  'NOMBRE DE DIOS', 'NUEVO IDEAL', 'OCAMPO', 'OTÁEZ', 'PÁNUCO DE CORONADO', 
  'PEÑÓN BLANCO', 'POANAS', 'PUEBLO NUEVO', 'RODEO', 'SAN BERNARDO', 'SAN DIMAS', 
  'SAN JUAN DE GUADALUPE', 'SAN JUAN DEL RÍO', 'SAN LUIS DEL CORDERO', 
  'SAN PEDRO DEL GALLO', 'SANTA CLARA', 'SANTIAGO PAPASQUIARO', 'SÚCHIL', 
  'TAMAZULA', 'TEPEHUANES', 'TLAHUALILO', 'TOPIA', 'VICENTE GUERRERO'
];

// --- DATA SIMULADA SEPOMEX ---
const SEPOMEX_DATA: Record<string, { municipality: string, state: string, colonies: string[] }> = {
    '34000': { municipality: 'DURANGO', state: 'DURANGO', colonies: ['ZONA CENTRO', 'TIERRA BLANCA', 'ANALCO'] },
    '34100': { municipality: 'DURANGO', state: 'DURANGO', colonies: ['CIÉNEGA', 'VALLE DEL SUR', 'SANTA MARÍA', 'EL REFUGIO'] },
    '34200': { municipality: 'DURANGO', state: 'DURANGO', colonies: ['JARDINES DE DURANGO', 'LOS REMEDIOS', 'LOMAS DEL PARQUE', 'HACIENDA'] },
    '34220': { municipality: 'DURANGO', state: 'DURANGO', colonies: ['REAL DEL MEZQUITAL', 'CAMPESTRE', 'LAS ALAMEDAS'] },
    '34138': { municipality: 'DURANGO', state: 'DURANGO', colonies: ['VILLAS DEL GUADIANA', 'FRACC. SAN ANTONIO', 'FIDEL VELÁZQUEZ'] },
    '34080': { municipality: 'DURANGO', state: 'DURANGO', colonies: ['BARRIO DE TIERRA BLANCA', 'SANTA FE', 'LA VIRGEN'] },
    '35000': { municipality: 'GÓMEZ PALACIO', state: 'DURANGO', colonies: ['ZONA CENTRO', 'SANTA ROSA', 'RUBÉN JARAMILLO'] },
    '35015': { municipality: 'GÓMEZ PALACIO', state: 'DURANGO', colonies: ['FILADELFIA', 'PARQUE INDUSTRIAL', 'HAMBURGO'] },
    '35020': { municipality: 'GÓMEZ PALACIO', state: 'DURANGO', colonies: ['CHAPALA', 'SAN ANTONIO', 'NUEVO GÓMEZ'] },
    '35150': { municipality: 'LERDO', state: 'DURANGO', colonies: ['ZONA CENTRO', 'SAN ISIDRO', 'VILLA JARDÍN', 'MAGISTERIO'] },
    '35158': { municipality: 'LERDO', state: 'DURANGO', colonies: ['LAS HUERTAS', 'SAN FERNANDO', 'EL HUEVARE'] },
    '34600': { municipality: 'SANTIAGO PAPASQUIARO', state: 'DURANGO', colonies: ['ZONA CENTRO', 'ALTAMIRA', 'CNOP', 'ESPAÑA'] },
    '34630': { municipality: 'SANTIAGO PAPASQUIARO', state: 'DURANGO', colonies: ['EL TAGARETE', 'LOMAS DE SAN JUAN', 'HERMANOS REVO'] },
    '34400': { municipality: 'CANATLÁN', state: 'DURANGO', colonies: ['ZONA CENTRO', 'PROGRESISTA', 'VALLE VERDE'] },
    '34700': { municipality: 'GUADALUPE VICTORIA', state: 'DURANGO', colonies: ['ZONA CENTRO', 'LA ESTACIÓN', 'LOMA BONITA'] },
    '34950': { municipality: 'PUEBLO NUEVO', state: 'DURANGO', colonies: ['EL SALTO CENTRO', 'LA VICTORIA', 'CHAPULTEPEC'] },
    '34890': { municipality: 'VICENTE GUERRERO', state: 'DURANGO', colonies: ['ZONA CENTRO', 'REVOLUCIÓN', 'CHICAGO'] },
};

// --- COMPONENTES UI ---

// Agregamos `innerRef` para pasar la referencia
const InputField = ({ label, value, onChange, placeholder, width = 'full', numeric = false, max = 50, readOnly = false, error, innerRef }: any) => (
    <div className={`space-y-1 ${width === 'half' ? 'col-span-1' : 'col-span-2'}`}>
        <label className={`text-[10px] font-bold uppercase ml-1 ${error ? 'text-red-500' : 'text-gray-500'}`}>
            {label}
        </label>
        <div className="relative">
            <input 
                ref={innerRef} // Asignamos la referencia aquí
                value={value || ''} 
                onChange={(e) => {
                    if (readOnly) return;
                    onChange(e.target.value); 
                }}
                maxLength={max}
                placeholder={placeholder}
                inputMode={numeric ? 'numeric' : 'text'}
                readOnly={readOnly}
                className={`w-full h-12 px-4 rounded-xl border-2 outline-none font-bold transition-all uppercase 
                    ${readOnly 
                        ? 'bg-gray-100 dark:bg-gray-900 border-gray-200 text-gray-500 cursor-not-allowed' 
                        : error 
                            ? 'bg-white dark:bg-gray-800 border-red-500 text-red-900 focus:border-red-600'
                            : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 focus:border-primary text-gray-900 dark:text-white'
                    }`}
            />
            {readOnly && <span className="material-symbols-outlined absolute right-3 top-3 text-gray-400 text-sm">lock</span>}
            {!readOnly && error && <span className="material-symbols-outlined absolute right-3 top-3 text-red-500 text-sm">error</span>}
        </div>
        {error && <p className="text-[9px] text-red-500 font-bold ml-2 animate-in slide-in-from-top-1">{error}</p>}
    </div>
);

const PhoneInput = ({ ladaValue, phoneValue, onLadaChange, onPhoneChange, error, innerRef }: any) => (
    <div className="col-span-2 space-y-1">
        <label className={`text-[10px] font-bold uppercase ml-1 ${error ? 'text-red-500' : 'text-gray-500'}`}>Teléfono</label>
        <div className="flex gap-2 relative">
            <div className="relative w-24">
                <select 
                    value={ladaValue}
                    onChange={(e) => onLadaChange(e.target.value)}
                    className="w-full h-12 pl-3 pr-1 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 appearance-none font-bold outline-none"
                >
                    <option value="+52">🇲🇽 +52</option>
                    <option value="+1">🇺🇸 +1</option>
                </select>
                <span className="absolute right-2 top-4 text-[8px] text-gray-400">▼</span>
            </div>
            <input 
                ref={innerRef} // Referencia aquí
                value={phoneValue}
                onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, ''); 
                    if (val.length <= 10) onPhoneChange(val);
                }}
                placeholder="10 Dígitos"
                inputMode="tel"
                className={`flex-1 h-12 px-4 rounded-xl bg-white dark:bg-gray-800 border-2 outline-none font-bold transition-all ${error ? 'border-red-500 text-red-900 focus:border-red-600' : 'border-gray-100 dark:border-gray-700 focus:border-primary'}`}
            />
        </div>
        {error && <p className="text-[9px] text-red-500 font-bold ml-2">{error}</p>}
    </div>
);

// --- MAIN COMPONENT ---

const CompleteProfileScreen: React.FC<CompleteProfileScreenProps> = ({ userData, onBack, onSave }) => {
  
  const [currentStep, setCurrentStep] = useState(1);

  const [form, setForm] = useState({
    // Datos Personales
    firstName: userData.firstName || '',
    paternalName: userData.paternalName || userData.lastName?.split(' ')[0] || '',
    maternalName: userData.maternalName || userData.lastName?.split(' ').slice(1).join(' ') || '',
    rfc: '',
    curp: userData.idNumber || '',
    email: userData.email || '',
    nationality: 'MEXICANA',
    gender: 'M',
    bloodType: 'O+',
    isDonor: false,
    workplace: '',
    restrictions: '',
    medicalNotes: userData.medicalConditions || '',

    // Domicilio y Contacto
    address: userData.address || '',
    zipCode: userData.zipCode || '',
    colony: userData.colony || '',
    municipality: userData.municipality || '',
    locality: '',
    state: 'DURANGO',
    phoneLada: '+52',
    phone: userData.phone || '',

    // Emergencia
    emergFirstName: '',
    emergPaternal: '',
    emergMaternal: '',
    emergAddress: '',
    emergZipCode: '',
    emergColony: '',
    emergMunicipality: '',
    emergLocality: '',
    emergPhoneLada: '+52',
    emergPhone: userData.emergencyPhone || ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [coloniesList, setColoniesList] = useState<string[]>([]);
  const [emergColoniesList, setEmergColoniesList] = useState<string[]>([]);

  // REFERENCIAS PARA AUTO-FOCUS (SOLO DE CAMPOS EDITABLES)
  const inputRefs = {
      rfc: useRef<HTMLInputElement>(null),
      workplace: useRef<HTMLInputElement>(null),
      address: useRef<HTMLInputElement>(null),
      zipCode: useRef<HTMLInputElement>(null),
      colony: useRef<HTMLSelectElement | HTMLInputElement>(null), // Puede ser select o input
      municipality: useRef<HTMLSelectElement>(null),
      phone: useRef<HTMLInputElement>(null),
      
      emergFirstName: useRef<HTMLInputElement>(null),
      emergPaternal: useRef<HTMLInputElement>(null),
      emergAddress: useRef<HTMLInputElement>(null),
      emergZipCode: useRef<HTMLInputElement>(null),
      emergPhone: useRef<HTMLInputElement>(null),
  };

  const handleSafeInput = (field: string, rawValue: string, type: 'text' | 'alphanumeric' | 'numeric' | 'address' = 'alphanumeric') => {
      let value = rawValue.toUpperCase();
      value = value.replace(/['";\\]/g, "").replace(/--/g, "");

      let isValid = true;
      switch (type) {
          case 'text': if (!/^[A-ZÑ\s]*$/.test(value)) isValid = false; break;
          case 'numeric': if (!/^\d*$/.test(value)) isValid = false; break;
          case 'address': if (!/^[A-Z0-9Ñ\s#.\-\/]*$/.test(value)) isValid = false; break;
          case 'alphanumeric': if (!/^[A-Z0-9Ñ\s]*$/.test(value)) isValid = false; break;
      }

      if (isValid) {
          setForm(prev => ({ ...prev, [field]: value }));
          if (errors[field]) setErrors(prev => { const n = {...prev}; delete n[field]; return n; });
      }
  };

  // --- LÓGICA SEPOMEX ---
  useEffect(() => {
      if (form.zipCode.length === 5 && SEPOMEX_DATA[form.zipCode]) {
          const data = SEPOMEX_DATA[form.zipCode];
          setForm(prev => ({ ...prev, municipality: data.municipality, state: data.state, locality: data.municipality, colony: '' }));
          setColoniesList(data.colonies);
      } else {
          setColoniesList([]); 
      }
  }, [form.zipCode]);

  useEffect(() => {
      if (form.emergZipCode.length === 5 && SEPOMEX_DATA[form.emergZipCode]) {
          const data = SEPOMEX_DATA[form.emergZipCode];
          setForm(prev => ({ ...prev, emergMunicipality: data.municipality, emergLocality: data.municipality, emergColony: '' }));
          setEmergColoniesList(data.colonies);
      } else {
          setEmergColoniesList([]);
      }
  }, [form.emergZipCode]);

  // --- VALIDACIONES FINALES ---
  const validateRFC = (rfc: string) => {
      const rfcRegex = /^([A-ZÑ&]{3,4})(\d{2})(\d{2})(\d{2})([A-Z\d]{3})$/;
      if (!rfc) return "Requerido";
      if (rfc.length < 12) return "Longitud incompleta";
      if (!rfcRegex.test(rfc)) return "Formato inválido";
      return null;
  };

  // FUNCIÓN PARA HACER SCROLL AL PRIMER ERROR
  const scrollToFirstError = (errorList: any) => {
      const errorKey = Object.keys(errorList)[0]; // Obtiene el primer key con error (ej: 'rfc')
      if (errorKey) {
          // @ts-ignore - Accedemos dinámicamente a las refs
          const ref = inputRefs[errorKey];
          if (ref && ref.current) {
              ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
              ref.current.focus();
          }
      }
  };

  const validateStep = (step: number) => {
      const newErrors: any = {};
      let isValid = true;

      if (step === 1) {
          const rfcError = validateRFC(form.rfc);
          if (rfcError) newErrors.rfc = rfcError;
          if (!form.workplace.trim()) newErrors.workplace = 'Requerido';
      }
      
      if (step === 2) {
          if (!form.address.trim()) newErrors.address = 'Requerido';
          if (form.zipCode.length !== 5) newErrors.zipCode = '5 dígitos';
          if (!form.colony.trim()) newErrors.colony = 'Requerido';
          if (!form.municipality.trim()) newErrors.municipality = 'Requerido';
          if (form.phone.length !== 10) newErrors.phone = '10 dígitos';
      }

      if (step === 3) {
          if (!form.emergFirstName.trim()) newErrors.emergFirstName = 'Requerido';
          if (!form.emergPaternal.trim()) newErrors.emergPaternal = 'Requerido';
          if (!form.emergPhone.length || form.emergPhone.length !== 10) newErrors.emergPhone = '10 dígitos';
          if (!form.emergAddress.trim()) newErrors.emergAddress = 'Requerido';
          if (form.emergZipCode.length !== 5) newErrors.emergZipCode = '5 dígitos';
      }

      setErrors(newErrors);
      
      if (Object.keys(newErrors).length > 0) {
          isValid = false;
          scrollToFirstError(newErrors); // <-- AQUÍ LLAMAMOS AL SCROLL
      }
      return isValid;
  };

  const handleNext = () => {
      if (validateStep(currentStep)) {
          setErrors({});
          setCurrentStep(prev => prev + 1);
      }
  };

  const handleSave = () => {
      if (validateStep(3)) {
          const fullData = {
              ...form,
              lastName: `${form.paternalName} ${form.maternalName}`, 
              address: `${form.address}, ${form.colony}`,
              phone: `${form.phoneLada} ${form.phone}`,
              emergencyContact: `${form.emergFirstName} ${form.emergPaternal}`,
              emergencyPhone: `${form.emergPhoneLada} ${form.emergPhone}`
          };
          onSave(fullData);
      }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-background-dark">
      
      {/* HEADER */}
      <header className="px-6 pt-8 pb-4 bg-white dark:bg-surface-dark shadow-sm sticky top-0 z-10 safe-top">
        <div className="flex items-center gap-3 mb-4">
             <button onClick={currentStep > 1 ? () => setCurrentStep(prev => prev - 1) : onBack} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 hover:bg-gray-200">
                <span className="material-symbols-outlined text-sm">arrow_back</span>
             </button>
             <h1 className="text-lg font-black text-gray-900 dark:text-white">Completar Perfil</h1>
        </div>
        <div className="flex items-center justify-between px-2">
            {[1, 2, 3].map(step => (
                <div key={step} className="flex flex-col items-center gap-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${currentStep >= step ? 'bg-primary text-white shadow-lg shadow-blue-500/30' : 'bg-gray-200 text-gray-400'}`}>
                        {step}
                    </div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                        {step === 1 ? 'Personal' : step === 2 ? 'Domicilio' : 'Emergencia'}
                    </span>
                </div>
            ))}
        </div>
      </header>

      {/* BODY */}
      <main className="flex-1 overflow-y-auto px-6 py-6 pb-[calc(6rem+env(safe-area-inset-bottom))]">
        
        {/* --- PASO 1 --- */}
        {currentStep === 1 && (
            <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-right">
                <InputField label="Nombre(s)" value={form.firstName} readOnly={true} />
                <InputField label="Apellido Paterno" value={form.paternalName} readOnly={true} width="half" />
                <InputField label="Apellido Materno" value={form.maternalName} readOnly={true} width="half" />
                <InputField label="CURP" value={form.curp} readOnly={true} width="half" />
                <InputField label="Correo" value={form.email} readOnly={true} width="half" />

                <InputField 
                    innerRef={inputRefs.rfc} // Ref
                    label="RFC" 
                    value={form.rfc} 
                    onChange={(val: string) => handleSafeInput('rfc', val, 'alphanumeric')} 
                    placeholder="AAAA990101XXX" 
                    width="half" 
                    max={13} 
                    error={errors.rfc}
                />
                
                <div className="col-span-1 space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-500 ml-1">Sexo</label>
                    <select value={form.gender} onChange={(e) => setForm({...form, gender: e.target.value})} className="w-full h-12 px-3 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 outline-none font-bold">
                        <option value="F">FEMENINO</option><option value="M">MASCULINO</option>
                    </select>
                </div>
                <div className="col-span-1 space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-500 ml-1">Nacionalidad</label>
                    <select value={form.nationality} onChange={(e) => setForm({...form, nationality: e.target.value})} className="w-full h-12 px-3 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 outline-none font-bold">
                        <option value="MEXICANA">MEXICANA</option><option value="EXTRANJERA">EXTRANJERA</option>
                    </select>
                </div>

                <div className="col-span-1 space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-500 ml-1">Tipo Sangre</label>
                    <select value={form.bloodType} onChange={(e) => setForm({...form, bloodType: e.target.value})} className="w-full h-12 px-3 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 outline-none font-bold">
                        {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div className="col-span-1 flex items-center h-full pt-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form.isDonor} onChange={(e) => setForm({...form, isDonor: e.target.checked})} className="w-5 h-5 rounded text-primary" />
                        <span className="text-xs font-bold text-gray-600">Donador de Órganos</span>
                    </label>
                </div>

                <InputField 
                    innerRef={inputRefs.workplace} // Ref
                    label="Lugar de Trabajo" 
                    value={form.workplace} 
                    onChange={(val: string) => handleSafeInput('workplace', val, 'alphanumeric')} 
                    placeholder="Empresa o Institución" 
                    error={errors.workplace} 
                />
                <InputField label="Restricciones" value={form.restrictions} onChange={(val: string) => handleSafeInput('restrictions', val, 'text')} placeholder="USA LENTES" />
                <div className="col-span-2 space-y-1"><label className="text-[10px] font-bold uppercase text-gray-500 ml-1">Observaciones Médicas</label><textarea value={form.medicalNotes} onChange={(e) => handleSafeInput('medicalNotes', e.target.value, 'alphanumeric')} className="w-full h-20 p-3 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 outline-none font-bold uppercase resize-none" /></div>
            </div>
        )}

        {/* --- PASO 2: DOMICILIO --- */}
        {currentStep === 2 && (
            <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-right">
                <InputField 
                    innerRef={inputRefs.address} // Ref
                    label="Calle y Número" 
                    value={form.address} 
                    onChange={(val: string) => handleSafeInput('address', val, 'address')} 
                    placeholder="AV. 20 DE NOVIEMBRE #123" 
                    error={errors.address} 
                />
                
                <InputField 
                    innerRef={inputRefs.zipCode} // Ref
                    label="Código Postal" 
                    value={form.zipCode} 
                    onChange={(val: string) => handleSafeInput('zipCode', val, 'numeric')} 
                    placeholder="34000" 
                    numeric width="half" max={5} 
                    error={errors.zipCode} 
                />
                
                <div className="col-span-1 space-y-1">
                    <label className={`text-[10px] font-bold uppercase ml-1 ${errors.colony ? 'text-red-500' : 'text-gray-500'}`}>Colonia</label>
                    {coloniesList.length > 0 ? (
                        <select 
                            // @ts-ignore
                            ref={inputRefs.colony} // Ref Select
                            value={form.colony} 
                            onChange={(e) => setForm({...form, colony: e.target.value})} 
                            className={`w-full h-12 px-3 rounded-xl bg-white dark:bg-gray-800 border-2 outline-none font-bold uppercase ${errors.colony ? 'border-red-500' : 'border-gray-100 dark:border-gray-700'}`}
                        >
                            <option value="">Seleccione...</option>
                            {coloniesList.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    ) : (
                        <input 
                            // @ts-ignore
                            ref={inputRefs.colony} // Ref Input
                            value={form.colony} 
                            onChange={(e) => handleSafeInput('colony', e.target.value, 'address')} 
                            className={`w-full h-12 px-4 rounded-xl bg-white border-2 outline-none font-bold uppercase ${errors.colony ? 'border-red-500' : 'border-gray-100'}`} 
                            placeholder="ESCRIBE MANUALMENTE" 
                        />
                    )}
                    {errors.colony && <p className="text-[9px] text-red-500 font-bold ml-1">{errors.colony}</p>}
                </div>

                {coloniesList.length > 0 ? (
                     <InputField label="Municipio" value={form.municipality} readOnly={true} width="half" />
                ) : (
                    <div className="col-span-1 space-y-1">
                        <label className={`text-[10px] font-bold uppercase ml-1 ${errors.municipality ? 'text-red-500' : 'text-gray-500'}`}>Municipio</label>
                        <select 
                            ref={inputRefs.municipality} // Ref
                            value={form.municipality} 
                            onChange={(e) => setForm({...form, municipality: e.target.value})} 
                            className={`w-full h-12 px-3 rounded-xl bg-white dark:bg-gray-800 border-2 outline-none font-bold uppercase ${errors.municipality ? 'border-red-500' : 'border-gray-100 dark:border-gray-700'}`}
                        >
                            <option value="">Seleccione...</option>
                            {DURANGO_MUNICIPIOS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                )}

                <InputField label="Localidad" value={form.locality} onChange={(val: string) => handleSafeInput('locality', val, 'text')} width="half" />
                <InputField label="Entidad" value={form.state} readOnly={true} width="full" />
                
                <PhoneInput 
                    innerRef={inputRefs.phone} // Ref
                    ladaValue={form.phoneLada} 
                    phoneValue={form.phone} 
                    onLadaChange={(v: string) => setForm({...form, phoneLada: v})} 
                    onPhoneChange={(v: string) => setForm({...form, phone: v})} 
                    error={errors.phone} 
                />
            </div>
        )}

        {/* --- PASO 3: EMERGENCIA --- */}
        {currentStep === 3 && (
            <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-right">
                <div className="col-span-2 p-3 bg-red-50 rounded-xl mb-2 flex items-center gap-2 text-red-700"><span className="material-symbols-outlined">warning</span><p className="text-xs font-bold">En caso de accidente contactar a:</p></div>
                
                <InputField 
                    innerRef={inputRefs.emergFirstName} // Ref
                    label="Nombre(s)" 
                    value={form.emergFirstName} 
                    onChange={(val: string) => handleSafeInput('emergFirstName', val, 'text')} 
                    error={errors.emergFirstName} 
                />
                <InputField 
                    innerRef={inputRefs.emergPaternal} // Ref
                    label="Apellido Paterno" 
                    value={form.emergPaternal} 
                    onChange={(val: string) => handleSafeInput('emergPaternal', val, 'text')} 
                    width="half" 
                    error={errors.emergPaternal} 
                />
                <InputField label="Apellido Materno" value={form.emergMaternal} onChange={(val: string) => handleSafeInput('emergMaternal', val, 'text')} width="half" />
                
                <div className="col-span-2 border-t border-gray-100 my-2"></div>
                
                <InputField 
                    innerRef={inputRefs.emergAddress} // Ref
                    label="Calle y Número (Emergencia)" 
                    value={form.emergAddress} 
                    onChange={(val: string) => handleSafeInput('emergAddress', val, 'address')} 
                    error={errors.emergAddress} 
                />
                <InputField 
                    innerRef={inputRefs.emergZipCode} // Ref
                    label="C.P." 
                    value={form.emergZipCode} 
                    onChange={(val: string) => handleSafeInput('emergZipCode', val, 'numeric')} 
                    placeholder="34000" 
                    numeric width="half" max={5} 
                    error={errors.emergZipCode} 
                />
                
                <div className="col-span-1 space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-500 ml-1">Colonia</label>
                    {emergColoniesList.length > 0 ? (
                        <select value={form.emergColony} onChange={(e) => setForm({...form, emergColony: e.target.value})} className="w-full h-12 px-3 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 outline-none font-bold uppercase">
                            <option value="">Seleccione...</option>
                            {emergColoniesList.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    ) : (
                        <input value={form.emergColony} onChange={(e) => handleSafeInput('emergColony', e.target.value, 'address')} className="w-full h-12 px-4 rounded-xl bg-white border-2 border-gray-100 outline-none font-bold uppercase" />
                    )}
                </div>

                <InputField label="Municipio" value={form.emergMunicipality} onChange={(val: string) => handleSafeInput('emergMunicipality', val, 'text')} width="half" />
                <InputField label="Localidad" value={form.emergLocality} onChange={(val: string) => handleSafeInput('emergLocality', val, 'text')} width="half" />
                
                <PhoneInput 
                    innerRef={inputRefs.emergPhone} // Ref
                    ladaValue={form.emergPhoneLada} 
                    phoneValue={form.emergPhone} 
                    onLadaChange={(v: string) => setForm({...form, emergPhoneLada: v})} 
                    onPhoneChange={(v: string) => setForm({...form, emergPhone: v})} 
                    error={errors.emergPhone} 
                />
            </div>
        )}

      </main>

      <div className="p-6 bg-white/90 dark:bg-surface-dark/90 backdrop-blur-md border-t border-gray-100 dark:border-gray-800">
        <button onClick={currentStep === 3 ? handleSave : handleNext} className="w-full h-14 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-black text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
            {currentStep === 3 ? 'Guardar Todo' : 'Siguiente'}
            <span className="material-symbols-outlined">{currentStep === 3 ? 'save' : 'arrow_forward'}</span>
        </button>
      </div>

    </div>
  );
};

export default CompleteProfileScreen;