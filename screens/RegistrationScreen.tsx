import React, { useState } from 'react';
import { UserData } from '../types';
import { fetchCurpData } from '../src/utils/curpHelpers';

interface RegistrationScreenProps {
  userData: UserData;
  onBack: () => void;
  onContinue: (data: Partial<UserData>) => void;
}

const RegistrationScreen: React.FC<RegistrationScreenProps> = ({ userData, onBack, onContinue }) => {
  const [form, setForm] = useState({
    email: userData.email || '',
    password: '',
    firstName: userData.firstName || '',
    paternalName: userData.paternalName || '', // Nuevo campo separado
    maternalName: userData.maternalName || '', // Nuevo campo separado
    idNumber: userData.idNumber || '',
    birthDate: userData.birthDate || '',
  });

  const [loadingCurp, setLoadingCurp] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const CURP_REGEX = /^[A-Z]{4}\d{6}[HMX][A-Z]{2}[B-DF-HJ-NP-TV-Z]{3}[A-Z0-9]\d$/;
  const NAME_REGEX = /^[A-ZÑ\s]*$/;

  // --- HANDLERS ---
  const handleNameInput = (field: 'firstName' | 'paternalName' | 'maternalName', value: string) => {
    const upperValue = value.toUpperCase();
    if (NAME_REGEX.test(upperValue)) {
        setForm(prev => ({ ...prev, [field]: upperValue }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleCurpInput = (value: string) => {
    const upperValue = value.toUpperCase();
    if (/^[A-Z0-9Ñ]*$/.test(upperValue) && upperValue.length <= 18) {
        setForm(prev => ({ ...prev, idNumber: upperValue }));
        if (errors.idNumber) setErrors(prev => ({ ...prev, idNumber: '' }));
    }
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!form.firstName.trim()) newErrors.firstName = 'Nombre requerido';
    if (!form.paternalName.trim()) newErrors.paternalName = 'Apellido P. requerido';
    // Materno puede ser opcional en algunos casos, pero para RENAPO usualmente se pide, lo dejamos requerido por ahora o validamos si es 'X' en CURP
    if (!form.maternalName.trim()) newErrors.maternalName = 'Apellido M. requerido';
    
    if (!form.birthDate) newErrors.birthDate = 'Fecha requerida';
    if (!form.email || !form.email.includes('@')) newErrors.email = 'Correo inválido';
    if (!form.password || form.password.length < 4) newErrors.password = 'Mínimo 4 caracteres';

    if (!form.idNumber) {
        newErrors.idNumber = 'La CURP es requerida';
    } else if (form.idNumber.length !== 18) {
        newErrors.idNumber = 'Debe tener 18 caracteres exactos';
    } else if (!CURP_REGEX.test(form.idNumber)) {
        if (!/^[A-Z]{4}/.test(form.idNumber)) newErrors.idNumber = 'Las primeras 4 posiciones deben ser LETRAS.';
        else if (!/\d{6}/.test(form.idNumber.substring(4, 10))) newErrors.idNumber = 'Fecha en CURP inválida.';
        else newErrors.idNumber = 'Formato inválido.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCurpBlur = async () => {
    if (CURP_REGEX.test(form.idNumber)) {
      setLoadingCurp(true);
      const result = await fetchCurpData(form.idNumber);
      setLoadingCurp(false);

      if (result.success && result.data) {
        setForm(prev => ({
          ...prev,
          firstName: result.data.firstName,
          paternalName: result.data.paternalName, // Asumiendo que tu helper ya devuelve esto separado
          maternalName: result.data.maternalName,
          birthDate: result.data.birthDate
        }));
        setErrors({});
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
      <header className="flex items-center p-4 justify-between sticky top-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md z-10">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full w-32 overflow-hidden">
          <div className="h-full bg-primary w-1/4"></div>
        </div>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 pb-24">
        <div className="py-4">
          <h1 className="text-2xl font-black mb-1 text-gray-900 dark:text-white">Crear Perfil</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Ingresa tus datos de acceso y personales.</p>
        </div>

        <div className="space-y-6">
            <section className="space-y-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Credenciales</h3>
                <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400 px-1">Correo Electrónico</label>
                    <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="ejemplo@correo.com" className={`w-full h-14 bg-white dark:bg-gray-800 border-2 rounded-2xl px-4 focus:border-primary outline-none transition-all ${errors.email ? 'border-red-400' : 'border-gray-100 dark:border-gray-700'}`} />
                    {errors.email && <p className="text-[10px] text-red-500 pl-1 font-bold">{errors.email}</p>}
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400 px-1">Contraseña</label>
                    <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="••••••••" className={`w-full h-14 bg-white dark:bg-gray-800 border-2 rounded-2xl px-4 focus:border-primary outline-none transition-all ${errors.password ? 'border-red-400' : 'border-gray-100 dark:border-gray-700'}`} />
                    {errors.password && <p className="text-[10px] text-red-500 pl-1 font-bold">{errors.password}</p>}
                </div>
            </section>

            <section className="space-y-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Datos Personales</h3>
                
                <div className="space-y-1.5 relative">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400 px-1">CURP</label>
                    <input value={form.idNumber} onChange={e => handleCurpInput(e.target.value)} onBlur={handleCurpBlur} maxLength={18} placeholder="ABCD990101H..." className={`w-full h-14 bg-white dark:bg-gray-800 border-2 rounded-2xl px-4 focus:border-primary outline-none transition-all uppercase font-mono ${errors.idNumber ? 'border-red-400' : 'border-gray-100 dark:border-gray-700'}`} />
                    {loadingCurp && <div className="absolute right-4 top-9 animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>}
                    {!errors.idNumber && CURP_REGEX.test(form.idNumber) && !loadingCurp && (<div className="absolute right-4 top-9 text-green-500"><span className="material-symbols-outlined">check_circle</span></div>)}
                    {errors.idNumber && <p className="text-[10px] text-red-500 pl-1 font-bold">{errors.idNumber}</p>}
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400 px-1">Nombre(s)</label>
                    <input value={form.firstName} onChange={e => handleNameInput('firstName', e.target.value)} placeholder="Ej. Juan Carlos" className={`w-full h-14 bg-white dark:bg-gray-800 border-2 rounded-2xl px-4 focus:border-primary outline-none transition-all ${errors.firstName ? 'border-red-400' : 'border-gray-100 dark:border-gray-700'}`} />
                    {errors.firstName && <p className="text-[10px] text-red-500 pl-1 font-bold">{errors.firstName}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-400 px-1">Apellido Paterno</label>
                        <input value={form.paternalName} onChange={e => handleNameInput('paternalName', e.target.value)} placeholder="Ej. Pérez" className={`w-full h-14 bg-white dark:bg-gray-800 border-2 rounded-2xl px-4 focus:border-primary outline-none transition-all ${errors.paternalName ? 'border-red-400' : 'border-gray-100 dark:border-gray-700'}`} />
                        {errors.paternalName && <p className="text-[10px] text-red-500 pl-1 font-bold">{errors.paternalName}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-400 px-1">Apellido Materno</label>
                        <input value={form.maternalName} onChange={e => handleNameInput('maternalName', e.target.value)} placeholder="Ej. García" className={`w-full h-14 bg-white dark:bg-gray-800 border-2 rounded-2xl px-4 focus:border-primary outline-none transition-all ${errors.maternalName ? 'border-red-400' : 'border-gray-100 dark:border-gray-700'}`} />
                        {errors.maternalName && <p className="text-[10px] text-red-500 pl-1 font-bold">{errors.maternalName}</p>}
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400 px-1">Fecha de Nacimiento</label>
                    <div className="relative">
                        <input type="date" value={form.birthDate} disabled readOnly className={`w-full h-14 bg-gray-100 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-2xl px-4 outline-none text-gray-500 font-bold cursor-not-allowed ${errors.birthDate ? 'border-red-400' : ''}`} />
                        <span className="material-symbols-outlined absolute right-4 top-4 text-gray-400 text-lg">lock</span>
                    </div>
                    {errors.birthDate ? <p className="text-[10px] text-red-500 pl-1 font-bold">{errors.birthDate}</p> : <p className="text-[10px] text-gray-400 pl-1">Se calcula automáticamente de tu CURP</p>}
                </div>
            </section>
        </div>
      </main>

      <div className="p-6 absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background-light dark:from-background-dark via-background-light dark:via-background-dark to-transparent pt-10">
        <button onClick={() => { if (validate()) onContinue({ ...form, lastName: `${form.paternalName} ${form.maternalName}` }); }} className="w-full h-14 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-black text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
          Continuar <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};

export default RegistrationScreen;