import React, { useState, useEffect, useRef } from 'react';
import { UserData } from '../types';

interface CompleteProfileScreenProps {
  userData: UserData;
  onBack: () => void;
  onSave: (data: Partial<UserData>) => void;
}

// --- COMPONENTES UI (Helpers) ---
// (Los inputs se mantienen igual, solo pondré el código principal actualizado)

const InputField = ({ label, value, onChange, placeholder, width = 'full', numeric = false, max = 50, readOnly = false, error, innerRef }: any) => (
    <div className={`space-y-1 ${width === 'half' ? 'col-span-1' : 'col-span-2'}`}>
        <label className={`text-[10px] font-bold uppercase ml-1 ${error ? 'text-red-500' : 'text-gray-500'}`}>
            {label}
        </label>
        <div className="relative">
            <input 
                ref={innerRef} 
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
                        ? 'bg-red-50 dark:bg-red-900/10 border-red-500 text-red-900 focus:border-red-600'
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
                ref={innerRef} 
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados para las listas de localidades
  const [localitiesList, setLocalitiesList] = useState<{id: number, localidad: string, municipio: string}[]>([]);
  const [emergLocalitiesList, setEmergLocalitiesList] = useState<{id: number, localidad: string, municipio: string}[]>([]);

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
    locality: '',     // AHORA GUARDARÁ EL TEXTO: "COLONIA PRADO"
    localityId: 0,    // NUEVO: GUARDARÁ EL ID: 3
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
    emergLocality: '',   // AHORA GUARDARÁ EL TEXTO
    emergLocalityId: 0,  // NUEVO: GUARDARÁ EL ID
    emergPhoneLada: '+52',
    emergPhone: userData.emergencyPhone || ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  const inputRefs = {
      rfc: useRef<HTMLInputElement>(null),
      workplace: useRef<HTMLInputElement>(null),
      address: useRef<HTMLInputElement>(null),
      zipCode: useRef<HTMLInputElement>(null), 
      colony: useRef<HTMLInputElement>(null),
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

  // --- MANEJO DE SELECCIÓN DE LOCALIDAD (CORREGIDO) ---
  const handleLocalitySelect = (id: string, isEmergency: boolean) => {
      const selectedId = Number(id);
      
      if (isEmergency) {
          const item = emergLocalitiesList.find(i => i.id === selectedId);
          if (item) {
              setForm(prev => ({
                  ...prev,
                  emergLocality: item.localidad, // Guardamos Texto "EJIDO..."
                  emergLocalityId: item.id       // Guardamos ID 854
              }));
              setErrors(prev => { const n = {...prev}; delete n.emergLocality; return n; });
          }
      } else {
          const item = localitiesList.find(i => i.id === selectedId);
          if (item) {
              setForm(prev => ({
                  ...prev,
                  locality: item.localidad,      // Guardamos Texto "EJIDO..."
                  localityId: item.id            // Guardamos ID 854
              }));
              setErrors(prev => { const n = {...prev}; delete n.locality; return n; });
          }
      }
  };

  // --- FETCH CP ---
  const fetchZipData = async (cp: string, isEmergency: boolean) => {
      try {
          const response = await fetch('http://localhost:3001/api/catalogo/localidadByCP', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ cp })
          });

          if (response.status === 204) {
             if (isEmergency) {
                setErrors(prev => ({ ...prev, emergZipCode: "CP Inválido (204)" }));
                setEmergLocalitiesList([]);
             } else {
                setErrors(prev => ({ ...prev, zipCode: "CP Inválido (204)" }));
                setLocalitiesList([]);
             }
             return;
          }

          const data = await response.json();

          if (data.code === "204") {
              if (isEmergency) {
                  setErrors(prev => ({ ...prev, emergZipCode: "No es un código postal válido" }));
                  setEmergLocalitiesList([]);
                  setForm(prev => ({ ...prev, emergMunicipality: '', emergLocality: '', emergLocalityId: 0 }));
              } else {
                  setErrors(prev => ({ ...prev, zipCode: "No es un código postal válido" }));
                  setLocalitiesList([]);
                  setForm(prev => ({ ...prev, municipality: '', locality: '', localityId: 0 }));
              }
              return;
          }

          if (data.code === "200" && data.data && data.data.catCPs.length > 0) {
              const list = data.data.catCPs;
              const firstRecord = list[0]; 

              if (isEmergency) {
                  setEmergLocalitiesList(list);
                  setForm(prev => ({ 
                      ...prev, 
                      emergMunicipality: firstRecord.municipio.toUpperCase(),
                      emergLocality: '', 
                      emergLocalityId: 0,
                      emergState: 'DURANGO'
                  }));
                  setErrors(prev => { const n = {...prev}; delete n.emergZipCode; return n; });
              } else {
                  setLocalitiesList(list);
                  setForm(prev => ({ 
                      ...prev, 
                      municipality: firstRecord.municipio.toUpperCase(),
                      locality: '', 
                      localityId: 0,
                      state: 'DURANGO'
                  }));
                  setErrors(prev => { const n = {...prev}; delete n.zipCode; return n; });
              }
          }

      } catch (error) {
          console.error("Error fetching CP:", error);
      }
  };

  useEffect(() => {
      if (form.zipCode.length === 5) {
          fetchZipData(form.zipCode, false);
      } else {
          setLocalitiesList([]);
      }
  }, [form.zipCode]);

  useEffect(() => {
      if (form.emergZipCode.length === 5) {
          fetchZipData(form.emergZipCode, true);
      } else {
          setEmergLocalitiesList([]);
      }
  }, [form.emergZipCode]);


  // --- VALIDACIONES ---
  const validateRFC = (rfc: string) => {
      const rfcRegex = /^([A-ZÑ&]{3,4})(\d{2})(\d{2})(\d{2})([A-Z\d]{3})$/;
      if (!rfc) return "Requerido";
      if (rfc.length < 12) return "Longitud incompleta";
      if (!rfcRegex.test(rfc)) return "Formato inválido";
      return null;
  };

  const scrollToFirstError = (errorList: any) => {
      const errorKey = Object.keys(errorList)[0]; 
      if (errorKey) {
          // @ts-ignore
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
          if (!form.zipCode || form.zipCode.length !== 5) newErrors.zipCode = '5 dígitos';
          if (!form.colony.trim()) newErrors.colony = 'Requerido';
          if (!form.municipality.trim()) newErrors.municipality = 'Requerido';
          if (!form.locality) newErrors.locality = 'Requerido';
          if (form.phone.length !== 10) newErrors.phone = '10 dígitos';
      }

      if (step === 3) {
          if (!form.emergFirstName.trim()) newErrors.emergFirstName = 'Requerido';
          if (!form.emergPaternal.trim()) newErrors.emergPaternal = 'Requerido';
          if (!form.emergPhone.length || form.emergPhone.length !== 10) newErrors.emergPhone = '10 dígitos';
          if (!form.emergAddress.trim()) newErrors.emergAddress = 'Requerido';
          if (!form.emergZipCode || form.emergZipCode.length !== 5) newErrors.emergZipCode = '5 dígitos';
          if (!form.emergLocality) newErrors.emergLocality = 'Requerido';
      }

      setErrors(newErrors);
      
      if (Object.keys(newErrors).length > 0) {
          isValid = false;
          scrollToFirstError(newErrors);
      }
      return isValid;
  };

  const handleNext = () => {
      if (validateStep(currentStep)) {
          setErrors({});
          setCurrentStep(prev => prev + 1);
      }
  };

  // --- GUARDAR DATOS (PAYLOAD CORREGIDO) ---
  const handleSave = async () => {
      if (!validateStep(3)) return;

      setIsSubmitting(true);

      try {
          // AQUI ESTA LA CORRECCIÓN DE TU PAYLOAD
          const payload = {
              idUsuario: 9,
              // Datos Personales
              
              rfc: form.rfc,
              
              // Dirección
              domicilio: form.address,
              colonia: form.colony,
              cp: form.zipCode,          // "34000" (String visual)
              id_cp: form.localityId,    // 854 (El ID que pide el backend) <--- AQUÍ VA EL ID
              municipio: form.municipality,
              localidad: form.locality,  // "COLONIA PRADO" (Texto) <--- AQUÍ VA EL TEXTO
              entidad: "DURANGO", 
              
              // Otros Datos
              nacionalidad: form.nationality,
              sexo: form.gender === 'M' ? 'Masculino' : 'Femenino', 
              tipoSangre: form.bloodType,
              donador: form.isDonor ? "Si" : "No", 
              lugarTrabajo: form.workplace,
              restricciones: form.restrictions || "Ninguna",
              observaciones: form.medicalNotes || "Ninguna",
              
              // Contacto Emergencia
              conocidoNombre: form.emergFirstName,
              conocidoApellidoPaterno: form.emergPaternal,
              conocidoApellidoMaterno: form.emergMaternal,
              conocidoDomicilio: form.emergAddress,
              conocidoCp: form.emergZipCode,
              conocidoIdCp: form.emergLocalityId, // ID para emergencia también
              conocidoColonia: form.emergColony,
              conocidoMunicipio: form.emergMunicipality,
              conocidoLocalidad: form.emergLocality, // TEXTO para emergencia
              conocidoTelefono: `${form.emergPhoneLada} ${form.emergPhone}`
          };

          console.log("Enviando Update Correcto:", payload);

          const response = await fetch('http://localhost:3001/api/usuarios/updateUsuario', {
              method: 'POST', 
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });

          if (response.status === 204) {
             setErrors(prev => ({ ...prev, locality: "Error al guardar (204)", zipCode: "Verificar CP" }));
             throw new Error("Error 204: No se pudo actualizar.");
          }

          const data = await response.json();

          if (data.code === "204" || (data.data && data.data.actualizado === false)) {
              let errorMsg = data.message || "Error al actualizar.";
              if (data.data && data.data.errores) {
                  const detalles = Object.values(data.data.errores).join("\n- ");
                  if (detalles) errorMsg += `\nDetalles:\n- ${detalles}`;
              }
              throw new Error(errorMsg);
          }

          console.log("✅ Usuario actualizado correctamente:", data);
          onSave(form);

      } catch (error: any) {
          console.error("❌ Error Update:", error);
          alert(`${error.message}`);
      } finally {
          setIsSubmitting(false);
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
        
        {/* --- PASO 1 (Igual que antes) --- */}
        {currentStep === 1 && (
            <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-right">
                <InputField label="Nombre(s)" value={form.firstName} readOnly={true} />
                <InputField label="Apellido Paterno" value={form.paternalName} readOnly={true} width="half" />
                <InputField label="Apellido Materno" value={form.maternalName} readOnly={true} width="half" />
                <InputField label="CURP" value={form.curp} readOnly={true} width="half" />
                <InputField label="Correo" value={form.email} readOnly={true} width="half" />

                <InputField innerRef={inputRefs.rfc} label="RFC" value={form.rfc} onChange={(val: string) => handleSafeInput('rfc', val, 'alphanumeric')} placeholder="AAAA990101XXX" width="half" max={13} error={errors.rfc} />
                
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
                <InputField innerRef={inputRefs.workplace} label="Lugar de Trabajo" value={form.workplace} onChange={(val: string) => handleSafeInput('workplace', val, 'alphanumeric')} placeholder="Empresa o Institución" error={errors.workplace} />
                <InputField label="Restricciones" value={form.restrictions} onChange={(val: string) => handleSafeInput('restrictions', val, 'text')} placeholder="USA LENTES" />
                <div className="col-span-2 space-y-1"><label className="text-[10px] font-bold uppercase text-gray-500 ml-1">Observaciones Médicas</label><textarea value={form.medicalNotes} onChange={(e) => handleSafeInput('medicalNotes', e.target.value, 'alphanumeric')} className="w-full h-20 p-3 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 outline-none font-bold uppercase resize-none" /></div>
            </div>
        )}

        {/* --- PASO 2: DOMICILIO --- */}
        {currentStep === 2 && (
            <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-right">
                <InputField innerRef={inputRefs.address} label="Calle y Número" value={form.address} onChange={(val: string) => handleSafeInput('address', val, 'address')} placeholder="AV. 20 DE NOVIEMBRE #123" error={errors.address} />
                <InputField innerRef={inputRefs.zipCode} label="Código Postal" value={form.zipCode} onChange={(val: string) => handleSafeInput('zipCode', val, 'numeric')} placeholder="34000" numeric width="half" max={5} error={errors.zipCode} />
                <InputField innerRef={inputRefs.colony} label="Colonia" value={form.colony} onChange={(val: string) => handleSafeInput('colony', val, 'address')} placeholder="ESCRIBE MANUALMENTE" width="half" error={errors.colony} />
                <InputField label="Municipio" value={form.municipality} readOnly={true} width="half" />
                
                {/* --- LOCALIDAD (CORREGIDO) --- */}
                <div className="col-span-1 space-y-1">
                    <label className={`text-[10px] font-bold uppercase ml-1 ${errors.locality ? 'text-red-500' : 'text-gray-500'}`}>Localidad</label>
                    {localitiesList.length > 0 ? (
                        <select 
                            /* Usamos el ID interno para controlar el select, pero handleLocalitySelect guarda ID y Texto separados */
                            value={form.localityId || ""} 
                            onChange={(e) => handleLocalitySelect(e.target.value, false)} 
                            className={`w-full h-12 px-3 rounded-xl bg-white dark:bg-gray-800 border-2 outline-none font-bold uppercase ${errors.locality ? 'border-red-500' : 'border-gray-100 dark:border-gray-700'}`}
                        >
                            <option value="">Seleccione...</option>
                            {localitiesList.map(item => (
                                <option key={item.id} value={item.id}>{item.localidad}</option>
                            ))}
                        </select>
                    ) : (
                        <input readOnly value={form.locality} placeholder="Autocompletado..." className="w-full h-12 px-4 rounded-xl bg-gray-100 dark:bg-gray-900 border-2 border-gray-200 text-gray-500 font-bold uppercase cursor-not-allowed outline-none" />
                    )}
                    {errors.locality && <p className="text-[9px] text-red-500 font-bold ml-2">{errors.locality}</p>}
                </div>

                <InputField label="Entidad" value={form.state} readOnly={true} width="half" />
                <PhoneInput innerRef={inputRefs.phone} ladaValue={form.phoneLada} phoneValue={form.phone} onLadaChange={(v: string) => setForm({...form, phoneLada: v})} onPhoneChange={(v: string) => setForm({...form, phone: v})} error={errors.phone} />
            </div>
        )}

        {/* --- PASO 3: EMERGENCIA --- */}
        {currentStep === 3 && (
            <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-right">
                <div className="col-span-2 p-3 bg-red-50 rounded-xl mb-2 flex items-center gap-2 text-red-700"><span className="material-symbols-outlined">warning</span><p className="text-xs font-bold">En caso de accidente contactar a:</p></div>
                <InputField innerRef={inputRefs.emergFirstName} label="Nombre(s)" value={form.emergFirstName} onChange={(val: string) => handleSafeInput('emergFirstName', val, 'text')} error={errors.emergFirstName} />
                <InputField innerRef={inputRefs.emergPaternal} label="Apellido Paterno" value={form.emergPaternal} onChange={(val: string) => handleSafeInput('emergPaternal', val, 'text')} width="half" error={errors.emergPaternal} />
                <InputField label="Apellido Materno" value={form.emergMaternal} onChange={(val: string) => handleSafeInput('emergMaternal', val, 'text')} width="half" />
                <div className="col-span-2 border-t border-gray-100 my-2"></div>
                <InputField innerRef={inputRefs.emergAddress} label="Calle y Número (Emergencia)" value={form.emergAddress} onChange={(val: string) => handleSafeInput('emergAddress', val, 'address')} error={errors.emergAddress} />
                <InputField innerRef={inputRefs.emergZipCode} label="C.P." value={form.emergZipCode} onChange={(val: string) => handleSafeInput('emergZipCode', val, 'numeric')} placeholder="34000" numeric width="half" max={5} error={errors.emergZipCode} />
                <InputField label="Colonia" value={form.emergColony} onChange={(val: string) => handleSafeInput('emergColony', val, 'address')} width="half" placeholder="ESCRIBE MANUALMENTE" />
                <InputField label="Municipio" value={form.emergMunicipality} readOnly={true} width="half" />
                
                {/* --- LOCALIDAD EMERGENCIA (CORREGIDO) --- */}
                <div className="col-span-1 space-y-1">
                    <label className={`text-[10px] font-bold uppercase ml-1 ${errors.emergLocality ? 'text-red-500' : 'text-gray-500'}`}>Localidad</label>
                    {emergLocalitiesList.length > 0 ? (
                        <select 
                            value={form.emergLocalityId || ""} 
                            onChange={(e) => handleLocalitySelect(e.target.value, true)} 
                            className={`w-full h-12 px-3 rounded-xl bg-white dark:bg-gray-800 border-2 outline-none font-bold uppercase ${errors.emergLocality ? 'border-red-500' : 'border-gray-100 dark:border-gray-700'}`}
                        >
                            <option value="">Seleccione...</option>
                            {emergLocalitiesList.map(item => (
                                <option key={item.id} value={item.id}>{item.localidad}</option>
                            ))}
                        </select>
                    ) : (
                        <input readOnly value={form.emergLocality} placeholder="Autocompletado..." className="w-full h-12 px-4 rounded-xl bg-gray-100 dark:bg-gray-900 border-2 border-gray-200 text-gray-500 font-bold uppercase cursor-not-allowed outline-none" />
                    )}
                    {errors.emergLocality && <p className="text-[9px] text-red-500 font-bold ml-2">{errors.emergLocality}</p>}
                </div>
                
                <PhoneInput innerRef={inputRefs.emergPhone} ladaValue={form.emergPhoneLada} phoneValue={form.emergPhone} onLadaChange={(v: string) => setForm({...form, emergPhoneLada: v})} onPhoneChange={(v: string) => setForm({...form, emergPhone: v})} error={errors.emergPhone} />
            </div>
        )}

      </main>

      <div className="p-6 bg-white/90 dark:bg-surface-dark/90 backdrop-blur-md border-t border-gray-100 dark:border-gray-800">
        <button onClick={currentStep === 3 ? handleSave : handleNext} disabled={isSubmitting} className={`w-full h-14 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-black text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-70 cursor-wait' : ''}`}>
            {isSubmitting ? 'Guardando...' : (currentStep === 3 ? 'Guardar Todo' : 'Siguiente')}
            {!isSubmitting && <span className="material-symbols-outlined">{currentStep === 3 ? 'save' : 'arrow_forward'}</span>}
        </button>
      </div>

    </div>
  );
};

export default CompleteProfileScreen;