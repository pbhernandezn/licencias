import React, { useState } from 'react';
import { UserData } from '../types';

interface WelcomeScreenProps {
  onStart: (data?: Partial<UserData>) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Credenciales Demo
  const DEMO_PASS = 'demo';
  const ADMIN_PASS = 'admin'; // Contraseña exclusiva para admin

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      // 1. LÓGICA DE ADMINISTRADOR
      if (email === 'admin@gmail.com' && password === ADMIN_PASS) {
          onStart({ email: 'admin@gmail.com' }); // App.tsx redirigirá
          return;
      }

      // 2. LÓGICA DE USUARIOS NORMALES / OPERADOR
      const VALID_USERS = ['existente@gmail.com', 'operador@gmail.com'];
      
      if (VALID_USERS.includes(email.toLowerCase()) && password === DEMO_PASS) {
        onStart({ 
            email: email,
            firstName: email.includes('existente') ? 'Juan' : '',
            lastName: email.includes('existente') ? 'Pérez' : ''
        }); 
      } else {
        setError('Usuario no encontrado o contraseña incorrecta.');
        setIsLoading(false);
      }
    }, 1000);
  };

  // ... (El resto del handleSocialLogin y el return UI se mantienen IGUAL que tu versión anterior)
  // ... Solo asegúrate de copiar el return completo que ya tenías.

  // --- COPIA AQUÍ TU RETURN DEL WELCOME SCREEN QUE YA TIENES (CON LOS LOGOS SOCIALES) ---
  // (No lo repito para no hacer spam, solo cambia la función handleLogin de arriba)
  
  // AQUI ABAJO TE DEJO EL RETURN COMPLETO PARA QUE SOLO COPIES Y PEGUES EL ARCHIVO SI PREFIERES:
  return (
    <div className="flex flex-col h-full bg-white dark:bg-surface-dark relative">
      <div className="h-[35%] bg-primary relative overflow-hidden rounded-b-[3rem] shadow-xl">
        <div className="absolute inset-0 bg-[url('https://www.durango.gob.mx/wp-content/themes/durango/assets/img/logo-white.png')] bg-center bg-no-repeat bg-contain opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30"></div>
        <div className="absolute bottom-10 left-0 right-0 text-center text-white px-6">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/30 shadow-lg">
             <span className="material-symbols-outlined text-4xl">badge</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-1">Licencia Digital</h1>
          <p className="text-sm font-medium text-blue-100 uppercase tracking-widest">Durango Seguro</p>
        </div>
      </div>

      <main className="flex-1 px-8 pt-8 pb-4 overflow-y-auto">
        <div className="mb-6 text-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Bienvenido</h2>
            <p className="text-sm text-gray-500">Inicia sesión para gestionar tus trámites.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-4">
            <div className="relative">
              <input 
                type="email" 
                placeholder="Correo Electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-14 pl-12 pr-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:border-primary outline-none transition-all text-sm font-medium"
                required
              />
              <span className="material-symbols-outlined absolute left-4 top-4 text-gray-400">mail</span>
            </div>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-14 pl-12 pr-12 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:border-primary outline-none transition-all text-sm font-medium"
                required
              />
              <span className="material-symbols-outlined absolute left-4 top-4 text-gray-400">lock</span>
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </div>
          {error && (
            <div className="text-xs text-red-500 font-bold bg-red-50 p-3 rounded-xl flex items-center gap-2">
               <span className="material-symbols-outlined text-sm">error</span>
               {error}
            </div>
          )}
          <button type="submit" disabled={isLoading} className="w-full h-14 bg-primary text-white rounded-2xl font-black text-lg shadow-lg hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2">
            {isLoading ? 'Entrando...' : 'Iniciar Sesión'}
            {!isLoading && <span className="material-symbols-outlined">login</span>}
          </button>
        </form>

        <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-700"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-surface-dark px-2 text-gray-400 font-bold">O continúa con</span></div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
            <button type="button" onClick={() => onStart({ email: 'existente@gmail.com', firstName: 'Juan', lastName: 'Pérez' })} className="h-12 border border-gray-200 dark:border-gray-700 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors bg-white dark:bg-surface-dark">
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
              <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Google</span>
            </button>
            <button type="button" onClick={() => onStart({ email: 'operador@gmail.com' })} className="h-12 border border-gray-200 dark:border-gray-700 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors bg-white dark:bg-surface-dark">
              <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" className="w-5 h-5" alt="Facebook" />
              <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Facebook</span>
            </button>
        </div>

        <div className="mt-4 text-center pb-8">
           <p className="text-sm text-gray-500 mb-4">¿Es tu primera vez?</p>
           <button onClick={() => onStart()} className="w-full h-14 border-2 border-primary text-primary rounded-2xl font-black text-lg hover:bg-primary/5 active:scale-95 transition-all">Crear Cuenta Nueva</button>
        </div>
      </main>
    </div>
  );
};

export default WelcomeScreen;