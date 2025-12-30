import React, { useState, useCallback } from 'react';
import { AppStep, UserData, LicenseRequest } from './types';

// Importamos todas las pantallas
import WelcomeScreen from './screens/WelcomeScreen';
import RegistrationScreen from './screens/RegistrationScreen';
import DocumentUploadScreen from './screens/DocumentUploadScreen';
import BiometricScreen from './screens/BiometricScreen';
import ReviewScreen from './screens/ReviewScreen';
import DashboardScreen from './screens/DashboardScreen';
import OperatorDashboardScreen from './screens/OperatorDashboardScreen';
import AdminDashboardScreen from './screens/AdminDashboardScreen';
import AppointmentScreen from './screens/AppointmentScreen';
import PaymentScreen from './screens/PaymentScreen'; 
import SuccessScreen from './screens/SuccessScreen';
import CompleteProfileScreen from './screens/CompleteProfileScreen';

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.WELCOME);
  
  // Estado inicial
  const [userData, setUserData] = useState<UserData>({
    firstName: '', lastName: '', idNumber: '', email: '', birthDate: '',
    licenseType: 'Automovilista Particular', validityDuration: '3 Años',
    bloodGroup: 'O+', organDonor: true, requests: [] 
  });

  // --- LOGICA DE NAVEGACION (Igual) ---
  const nextStep = useCallback(() => {
    const steps = Object.values(AppStep);
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) setCurrentStep(steps[currentIndex + 1]);
  }, [currentStep]);

  const prevStep = useCallback(() => {
    const steps = Object.values(AppStep);
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) setCurrentStep(steps[currentIndex - 1]);
  }, [currentStep]);

  const updateUserData = (data: Partial<UserData>) => setUserData(prev => ({ ...prev, ...data }));

  const addRequest = (req: LicenseRequest) => {
      setUserData(prev => ({ ...prev, requests: [...(prev.requests || []), req] }));
  };
  const updateRequestData = (id: string, updates: Partial<LicenseRequest>) => {
      setUserData(prev => ({ ...prev, requests: prev.requests?.map(req => req.id === id ? { ...req, ...updates } : req) }));
  };

  (window as any).tempAddRequest = addRequest;
  (window as any).tempUpdateRequestData = updateRequestData;

  // --- RENDERIZADO DE PANTALLAS ---
  const renderScreen = () => {
    switch (currentStep) {
      case AppStep.WELCOME:
        return <WelcomeScreen onStart={(loginData) => {
              if (loginData) {
                if (loginData.email === 'admin@gmail.com') setCurrentStep(AppStep.ADMIN_DASHBOARD);
                else if (loginData.email === 'operador@gmail.com') setCurrentStep(AppStep.OPERATOR_DASHBOARD);
                else if (loginData.email === 'existente@gmail.com') {
                  updateUserData({
                    ...loginData, firstName: 'Juan', lastName: 'Pérez García', idNumber: 'PEPJ880101HDFRXX05', birthDate: '1988-01-01', licenseType: 'Automovilista Particular', validityDuration: '3 Años', photo: 'photos/cara.jpeg', address: 'Calle Falsa 123', emergencyContact: 'Maria Perez',
                    requests: [{ id: '101', type: 'Automovilista', process: 'Refrendo', cost: 912, date: '26/12/2025', status: 'paid_pending_docs', folio: 'DGO-9988' }]
                  });
                  setCurrentStep(AppStep.DASHBOARD);
                } else {
                  updateUserData(loginData);
                  setCurrentStep(AppStep.REGISTRATION); 
                }
              } else {
                setCurrentStep(AppStep.REGISTRATION);
              }
            }} />;
      case AppStep.REGISTRATION: return <RegistrationScreen userData={userData} onBack={() => setCurrentStep(AppStep.WELCOME)} onContinue={(data) => { updateUserData(data); setCurrentStep(AppStep.DOCUMENTS); }} />;
      case AppStep.DOCUMENTS: return <DocumentUploadScreen onBack={() => setCurrentStep(AppStep.REGISTRATION)} onContinue={(data) => { updateUserData(data); setCurrentStep(AppStep.BIOMETRICS); }} />;
      case AppStep.BIOMETRICS: return <BiometricScreen onBack={() => setCurrentStep(AppStep.DOCUMENTS)} onComplete={(photoUrl) => { updateUserData({ photo: photoUrl }); setCurrentStep(AppStep.REVIEW); }} />;
      case AppStep.REVIEW: return <ReviewScreen userData={userData} onBack={() => setCurrentStep(AppStep.BIOMETRICS)} onSend={() => setCurrentStep(AppStep.DASHBOARD)} onEdit={updateUserData} />;
      case AppStep.DASHBOARD: return <DashboardScreen userData={userData} onGoToProfile={() => setCurrentStep(AppStep.COMPLETE_PROFILE)} onContinueRequest={(req) => { updateUserData({ licenseType: req.type === 'Motociclista' ? 'Motociclista' : 'Automovilista Particular' }); setCurrentStep(AppStep.APPOINTMENT); }} onLogout={() => { setUserData({ firstName: '', lastName: '', idNumber: '', email: '', birthDate: '', licenseType: 'Automovilista Particular', validityDuration: '3 Años', bloodGroup: 'O+', organDonor: true, requests: [] }); setCurrentStep(AppStep.WELCOME); }} />;
      case AppStep.COMPLETE_PROFILE: return <CompleteProfileScreen userData={userData} onBack={() => setCurrentStep(AppStep.DASHBOARD)} onSave={(data) => { updateUserData(data); setCurrentStep(AppStep.DASHBOARD); }} />;
      case AppStep.OPERATOR_DASHBOARD: return <OperatorDashboardScreen onLogout={() => setCurrentStep(AppStep.WELCOME)} />;
      case AppStep.ADMIN_DASHBOARD: return <AdminDashboardScreen onLogout={() => setCurrentStep(AppStep.WELCOME)} />;
      case AppStep.APPOINTMENT: return <AppointmentScreen userData={userData} onBack={() => setCurrentStep(AppStep.DASHBOARD)} onConfirm={(apptData) => { updateUserData({ appointment: apptData }); setCurrentStep(AppStep.PAYMENT); }} />;
      case AppStep.PAYMENT: return <PaymentScreen userData={userData} onBack={() => setCurrentStep(AppStep.APPOINTMENT)} onPaymentSuccess={(paymentData) => { updateUserData({ payment: paymentData }); setCurrentStep(AppStep.DASHBOARD); }} />;
      case AppStep.SUCCESS: return <SuccessScreen userData={userData} onBack={() => setCurrentStep(AppStep.WELCOME)} />;
      default: return <WelcomeScreen onStart={() => setCurrentStep(AppStep.REGISTRATION)} />;
    }
  };

  // --- DETECCIÓN DE LAYOUT ---
  const isDashboard = [AppStep.DASHBOARD, AppStep.ADMIN_DASHBOARD, AppStep.OPERATOR_DASHBOARD].includes(currentStep);

  return (
    <div className="min-h-screen w-full bg-white dark:bg-background-dark">
      
      {/* LAYOUT 1: DASHBOARD (FULL WIDTH)
         Si es Dashboard, ocupamos toda la pantalla sin restricciones.
      */}
      {isDashboard ? (
        <div className="w-full h-screen overflow-hidden flex flex-col animate-in fade-in">
             {renderScreen()}
        </div>
      ) : (
        
        /* LAYOUT 2: FORMULARIOS (SPLIT SCREEN)
           Diseño moderno de pantalla dividida para Desktop.
        */
        <div className="flex w-full h-screen">
            
            {/* LADO IZQUIERDO: Branding (Solo visible en Desktop lg:flex) */}
            <div className="hidden lg:flex w-1/2 bg-gray-900 relative items-center justify-center overflow-hidden">
                {/* Imagen de Fondo (Ejemplo: Paisaje de Durango o Abstracto) */}
                <img 
                    src="https://images.unsplash.com/photo-1518134714589-940735760233?q=80&w=2000&auto=format&fit=crop" 
                    alt="Background" 
                    className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent"></div>

                {/* Contenido de Marketing/Gobierno */}
                <div className="relative z-10 p-16 text-white max-w-xl">
                    <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 border border-white/20 shadow-2xl">
                        <span className="material-symbols-outlined text-5xl">verified_user</span>
                    </div>
                    <h1 className="text-5xl font-black mb-6 leading-tight">
                        Tu Identidad Digital, <span className="text-primary-light text-blue-400">Segura.</span>
                    </h1>
                    <p className="text-lg text-gray-300 leading-relaxed">
                        Bienvenido a la plataforma oficial de Licencias Digitales del Estado de Durango. Realiza tus trámites, renovaciones y citas de manera sencilla y protegida.
                    </p>
                    
                    <div className="mt-12 flex items-center gap-4 text-sm font-bold text-gray-400">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined">lock</span> Encriptación AES-256
                        </div>
                        <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined">gavel</span> Validez Oficial
                        </div>
                    </div>
                </div>
            </div>

            {/* LADO DERECHO: El Formulario (renderScreen) */}
            <div className="w-full lg:w-1/2 flex flex-col bg-white dark:bg-background-dark relative">
                {/* Contenedor escroleable para el formulario */}
                <div className="flex-1 overflow-y-auto">
                    {/* Centrador del contenido */}
                    <div className="min-h-full flex items-center justify-center p-4 sm:p-12 lg:p-16">
                        <div className="w-full max-w-md animate-in slide-in-from-right-8 duration-500">
                            {renderScreen()}
                        </div>
                    </div>
                </div>
                
                {/* Footer móvil opcional o detalles extra */}
                <div className="p-4 text-center text-[10px] text-gray-400 lg:hidden">
                    Gobierno del Estado de Durango &copy; 2025
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default App;