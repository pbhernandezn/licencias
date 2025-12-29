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
import AdminDashboardScreen from './screens/AdminDashboardScreen'; // <--- NUEVO IMPORT
import AppointmentScreen from './screens/AppointmentScreen';
import PaymentScreen from './screens/PaymentScreen'; 
import SuccessScreen from './screens/SuccessScreen';
import CompleteProfileScreen from './screens/CompleteProfileScreen';

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.WELCOME);
  
  // Estado inicial de los datos del usuario
  const [userData, setUserData] = useState<UserData>({
    firstName: '',
    lastName: '',
    idNumber: '',
    email: '',
    birthDate: '',
    licenseType: 'Automovilista Particular',
    validityDuration: '3 Años',
    bloodGroup: 'O+',
    organDonor: true,
    requests: [] // Lista de solicitudes vacía al inicio
  });

  // Función para avanzar al siguiente paso
  const nextStep = useCallback(() => {
    const steps = Object.values(AppStep);
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  }, [currentStep]);

  // Función para retroceder
  const prevStep = useCallback(() => {
    const steps = Object.values(AppStep);
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  }, [currentStep]);

  // Función para actualizar datos parciales
  const updateUserData = (data: Partial<UserData>) => {
    setUserData(prev => ({ ...prev, ...data }));
  };

  // --- LÓGICA DE GESTIÓN DE SOLICITUDES (CRUD) ---

  // 1. Agregar nueva solicitud (Cuando pagan derechos)
  const addRequest = (req: LicenseRequest) => {
      setUserData(prev => ({
          ...prev,
          requests: [...(prev.requests || []), req]
      }));
  };

  // 2. Actualizar DATOS de solicitud (Status + Documentos rechazados)
  const updateRequestData = (id: string, updates: Partial<LicenseRequest>) => {
      setUserData(prev => ({
          ...prev,
          requests: prev.requests?.map(req => 
              req.id === id ? { ...req, ...updates } : req
          )
      }));
  };

  // --- PUENTES DE COMUNICACIÓN (HACKS PARA DEMO) ---
  (window as any).tempAddRequest = addRequest;
  (window as any).tempUpdateRequestData = updateRequestData;


  const renderScreen = () => {
    switch (currentStep) {
      case AppStep.WELCOME:
        return (
          <WelcomeScreen 
            onStart={(loginData) => {
              if (loginData) {
                // A. ADMINISTRADOR (NUEVO)
                if (loginData.email === 'admin@gmail.com') {
                    setCurrentStep(AppStep.ADMIN_DASHBOARD);
                }
                // B. OPERADOR
                else if (loginData.email === 'operador@gmail.com') {
                    setCurrentStep(AppStep.OPERATOR_DASHBOARD);
                }
                // C. USUARIO EXISTENTE (Simulación)
                else if (loginData.email === 'existente@gmail.com') {
                  updateUserData({
                    ...loginData,
                    firstName: 'Juan',
                    lastName: 'Pérez García',
                    idNumber: 'PEPJ880101HDFRXX05',
                    birthDate: '1988-01-01',
                    licenseType: 'Automovilista Particular',
                    validityDuration: '3 Años',
                    photo: 'photos/cara.jpeg',//'https://randomuser.me/api/portraits/men/32.jpg',
                    address: 'Calle Falsa 123',
                    emergencyContact: 'Maria Perez',
                    // Simulamos una solicitud previa ya pagada (Amarilla)
                    requests: [{
                        id: '101', type: 'Automovilista', process: 'Refrendo', 
                        cost: 912, date: '26/12/2025', status: 'paid_pending_docs', folio: 'DGO-9988'
                    }]
                  });
                  setCurrentStep(AppStep.DASHBOARD);
                } 
                // D. USUARIO NUEVO
                else {
                  updateUserData(loginData);
                  setCurrentStep(AppStep.REGISTRATION); 
                }
              } else {
                setCurrentStep(AppStep.REGISTRATION);
              }
            }} 
          />
        );

      case AppStep.REGISTRATION:
        return (
          <RegistrationScreen 
            userData={userData} 
            onBack={() => setCurrentStep(AppStep.WELCOME)} 
            onContinue={(data) => { 
              updateUserData(data); 
              setCurrentStep(AppStep.DOCUMENTS); 
            }} 
          />
        );

      case AppStep.DOCUMENTS:
        return (
          <DocumentUploadScreen 
            onBack={() => setCurrentStep(AppStep.REGISTRATION)} 
            onContinue={(data) => { 
              updateUserData(data); 
              setCurrentStep(AppStep.BIOMETRICS); 
            }} 
          />
        );

      case AppStep.BIOMETRICS:
        return (
          <BiometricScreen 
            onBack={() => setCurrentStep(AppStep.DOCUMENTS)} 
            onComplete={(photoUrl) => { 
              updateUserData({ photo: photoUrl }); 
              setCurrentStep(AppStep.REVIEW); 
            }} 
          />
        );

      case AppStep.REVIEW:
        return (
          <ReviewScreen 
            userData={userData} 
            onBack={() => setCurrentStep(AppStep.BIOMETRICS)} 
            onSend={() => setCurrentStep(AppStep.DASHBOARD)} 
            onEdit={updateUserData} 
          />
        );

      case AppStep.DASHBOARD:
        return (
          <DashboardScreen 
             userData={userData}
             onGoToProfile={() => setCurrentStep(AppStep.COMPLETE_PROFILE)}
             onContinueRequest={(req) => {
                 updateUserData({ licenseType: req.type === 'Motociclista' ? 'Motociclista' : 'Automovilista Particular' });
                 setCurrentStep(AppStep.APPOINTMENT);
             }}
             onLogout={() => {
                setUserData({
                    firstName: '', lastName: '', idNumber: '', email: '', birthDate: '',
                    licenseType: 'Automovilista Particular', validityDuration: '3 Años',
                    bloodGroup: 'O+', organDonor: true, requests: []
                });
                setCurrentStep(AppStep.WELCOME);
             }}
          />
        );

      case AppStep.COMPLETE_PROFILE:
        return (
            <CompleteProfileScreen 
                userData={userData}
                onBack={() => setCurrentStep(AppStep.DASHBOARD)}
                onSave={(data) => {
                    updateUserData(data);
                    setCurrentStep(AppStep.DASHBOARD); 
                }}
            />
        );

      case AppStep.OPERATOR_DASHBOARD:
        return (
          <OperatorDashboardScreen 
            onLogout={() => setCurrentStep(AppStep.WELCOME)}
          />
        );

      // NUEVO CASO ADMIN
      case AppStep.ADMIN_DASHBOARD:
        return (
          <AdminDashboardScreen 
             onLogout={() => setCurrentStep(AppStep.WELCOME)}
          />
        );

      case AppStep.APPOINTMENT:
        return (
          <AppointmentScreen 
            userData={userData}
            onBack={() => setCurrentStep(AppStep.DASHBOARD)}
            onConfirm={(apptData) => {
              updateUserData({ appointment: apptData });
              setCurrentStep(AppStep.PAYMENT); 
            }}
          />
        );

      case AppStep.PAYMENT:
        return (
          <PaymentScreen 
             userData={userData}
             onBack={() => setCurrentStep(AppStep.APPOINTMENT)}
             onPaymentSuccess={(paymentData) => {
                updateUserData({ payment: paymentData });
                setCurrentStep(AppStep.DASHBOARD); 
             }}
          />
        );

      case AppStep.SUCCESS:
        return (
          <SuccessScreen 
            userData={userData} 
            onBack={() => setCurrentStep(AppStep.WELCOME)} 
          />
        );

      default:
        return <WelcomeScreen onStart={() => setCurrentStep(AppStep.REGISTRATION)} />;
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-md h-screen sm:h-[844px] bg-white dark:bg-surface-dark sm:rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col border border-gray-100 dark:border-gray-800 transition-colors">
        {renderScreen()}
      </div>
    </div>
  );
};

export default App;