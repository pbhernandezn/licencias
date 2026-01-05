import React, { useState } from 'react';
import { LicenseRequest } from '../types';

interface OperatorDashboardScreenProps {
  onLogout: () => void;
}

// --- CONFIGURACIÓN DE RUTAS LOCALES (MOCK) ---
// Agregamos las nuevas rutas para Acta y Certificado
const DOC_PATHS: Record<string, string> = {
    ineFront: '/Photos/INEF.png',      
    ineBack: '/Photos/INET.png',      
    addressProof: '/Photos/Domicilio.png', 
    photo: '/Photos/cara.jpeg',
    birthCertificate: '/Photos/Acta.png',          // <--- NUEVO
    disabilityProof: '/Photos/CertificadoMedico.png' // <--- NUEVO (Solo si aplica)
};

const OperatorDashboardScreen: React.FC<OperatorDashboardScreenProps> = ({ onLogout }) => {
  
  // --- MOCK DATA ACTUALIZADO ---
  // Agregamos 'hasDisability' para simular casos
  const [requests, setRequests] = useState<(LicenseRequest & { userName: string, hasDisability?: boolean })[]>([
      { id: '101', userName: 'JUAN PÉREZ GARCÍA', type: 'Automovilista', process: 'Primera Vez', cost: 912, date: '2025-12-29', status: 'paid_pending_docs', folio: 'DGO-9988', rejectedDocuments: [], hasDisability: false },
      { id: '102', userName: 'MARÍA LÓPEZ', type: 'Motociclista', process: 'Primera Vez', cost: 608, date: '2025-12-29', status: 'paid_pending_docs', folio: 'DGO-7744', rejectedDocuments: [], hasDisability: true }, // <--- TIENE DISCAPACIDAD
      { id: '103', userName: 'PEDRO SÁNCHEZ', type: 'Automovilista', process: 'Renovación', cost: 912, date: '2025-12-28', status: 'rejected', folio: 'DGO-1122', rejectedDocuments: ['photo'], hasDisability: false },
      { id: '104', userName: 'ANA SOTO', type: 'Chofer', process: 'Renovación', cost: 912, date: '2025-12-20', status: 'completed', folio: 'DGO-3321', rejectedDocuments: [], hasDisability: false }
  ]);

  // --- ESTADOS DE UI ---
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Nota: El tipo ahora incluye hasDisability opcional
  const [selectedReq, setSelectedReq] = useState<(LicenseRequest & { userName: string, hasDisability?: boolean }) | null>(null);
  
  // Estados Validación
  const [docStatus, setDocStatus] = useState<Record<string, 'accepted' | 'rejected' | null>>({});
  const [docReasons, setDocReasons] = useState<Record<string, string>>({});
  const [previewDoc, setPreviewDoc] = useState<{ url: string; title: string } | null>(null);

  // --- ESTADOS FILTRO FECHA ---
  const todayISO = new Date().toISOString().split('T')[0];
  const [dateRange, setDateRange] = useState({ start: todayISO, end: todayISO });
  const [filterLabel, setFilterLabel] = useState('Hoy');

  // --- HELPER: GENERADOR DINÁMICO DE DOCUMENTOS ---
  // Esta función decide qué documentos pedir basándose en la solicitud
  const getRequiredDocs = (req: { hasDisability?: boolean }) => {
      const docs = [
          { key: 'ineFront', label: 'INE (Lado Frontal)' },
          { key: 'ineBack', label: 'INE (Lado Trasero)' },
          { key: 'addressProof', label: 'Comprobante de Domicilio' },
          { key: 'birthCertificate', label: 'Acta de Nacimiento' }, // <--- SIEMPRE VISIBLE
          { key: 'photo', label: 'Fotografía Biométrica' }
      ];

      // Solo agregamos este si el usuario marcó el check en la app
      if (req.hasDisability) {
          docs.push({ key: 'disabilityProof', label: 'Certificado de Discapacidad' });
      }

      return docs;
  };

  // --- HELPERS FECHA ---
  const formatDateMX = (isoDate: string) => {
      if (!isoDate) return '';
      const [year, month, day] = isoDate.split('-');
      return `${day}/${month}/${year}`;
  };

  // --- LÓGICA DE FILTRADO ---
  const filteredRequests = requests.filter(req => {
      const lowerTerm = searchTerm.toLowerCase();
      const matchesSearch = req.userName.toLowerCase().includes(lowerTerm) || req.folio.toLowerCase().includes(lowerTerm);

      if (activeTab === 'pending') {
          return req.status === 'paid_pending_docs' && matchesSearch;
      } else {
          const isHistoryStatus = req.status === 'completed' || req.status === 'rejected';
          const inDateRange = req.date >= dateRange.start && req.date <= dateRange.end;
          return isHistoryStatus && inDateRange && matchesSearch;
      }
  });

  const counts = {
      pending: requests.filter(r => r.status === 'paid_pending_docs').length,
      history: requests.filter(r => r.status === 'completed' || r.status === 'rejected').length
  };

  // --- HANDLERS ---
  const handleQuickDate = (type: 'today' | 'week' | 'month') => {
      const end = new Date();
      const start = new Date();
      if (type === 'today') { setFilterLabel('Hoy'); }
      else if (type === 'week') { start.setDate(end.getDate() - 7); setFilterLabel('Semana'); } 
      else if (type === 'month') { start.setDate(1); setFilterLabel('Mes'); }

      if(type === 'today') setDateRange({ start: todayISO, end: todayISO });
      else setDateRange({ start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] });
  };

  const handleOpenReview = (req: any) => {
      setSelectedReq(req);
      const initialStatus: any = {};
      const initialReasons: any = {};
      
      // Obtenemos los documentos específicos para ESTA solicitud
      const docsToReview = getRequiredDocs(req);
      
      docsToReview.forEach(doc => { 
          initialStatus[doc.key] = null; 
          initialReasons[doc.key] = ''; 
      });
      
      setDocStatus(initialStatus);
      setDocReasons(initialReasons);
  };

  const handleSetDocStatus = (key: string, status: 'accepted' | 'rejected') => {
      setDocStatus(prev => ({ ...prev, [key]: status }));
      if (status === 'accepted') setDocReasons(prev => ({ ...prev, [key]: '' }));
  };

  const handleReasonChange = (key: string, text: string) => {
      setDocReasons(prev => ({ ...prev, [key]: text }));
  };

  const handleViewDocument = (key: string, label: string) => {
      const fileUrl = DOC_PATHS[key] || 'https://via.placeholder.com/300?text=Archivo+No+Encontrado'; 
      setPreviewDoc({ url: fileUrl, title: label });
  };

  const handleSubmitReview = () => {
      if (!selectedReq) return;

      // Obtenemos la lista correcta para validar
      const currentDocs = getRequiredDocs(selectedReq);

      const pendingDocs = currentDocs.filter(d => docStatus[d.key] === null);
      if (pendingDocs.length > 0) { alert(`Falta revisar: ${pendingDocs.map(d => d.label).join(', ')}`); return; }
      
      const rejectedKeys = currentDocs.filter(d => docStatus[d.key] === 'rejected').map(d => d.key);
      const missingReasons = rejectedKeys.filter(key => !docReasons[key] || docReasons[key].trim() === '');
      
      if (missingReasons.length > 0) { alert("Debes ingresar el motivo de rechazo para documentos marcados con error."); return; }

      const finalStatus = rejectedKeys.length > 0 ? 'rejected' : 'completed';

      if ((window as any).tempUpdateRequestData) {
          (window as any).tempUpdateRequestData(selectedReq.id, { status: finalStatus, rejectedDocuments: rejectedKeys });
      }
      setRequests(prev => prev.map(r => r.id === selectedReq.id ? { ...r, status: finalStatus, rejectedDocuments: rejectedKeys, date: todayISO } : r));
      
      alert(`Solicitud ${finalStatus === 'completed' ? 'APROBADA' : 'RECHAZADA'} exitosamente.`);
      setSelectedReq(null);
  };

  return (
    <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900">
      
      {/* NAVBAR */}
      <header className="bg-[#2c3e50] text-white px-6 pb-4 flex justify-between items-center shadow-md sticky top-0 z-20 safe-top">
        <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined">admin_panel_settings</span>
             </div>
             <div>
                 <h1 className="font-bold text-lg leading-tight">Panel de Operador</h1>
                 <p className="text-[10px] opacity-70 uppercase tracking-wider">Secretaría de Seguridad Pública</p>
             </div>
        </div>
        <button onClick={onLogout} className="bg-red-500/20 hover:bg-red-600 hover:text-white text-red-200 px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">logout</span> Salir
        </button>
      </header>

      {/* TABS */}
      <div className="bg-white dark:bg-gray-800 px-6 pt-4 border-b border-gray-200 dark:border-gray-700 flex gap-6 sticky top-[72px] z-10">
          <button onClick={() => setActiveTab('pending')} className={`pb-3 text-sm font-bold border-b-4 transition-all flex items-center gap-2 ${activeTab === 'pending' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
              Por Revisar <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'pending' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>{counts.pending}</span>
          </button>
          <button onClick={() => setActiveTab('history')} className={`pb-3 text-sm font-bold border-b-4 transition-all flex items-center gap-2 ${activeTab === 'history' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
              Historial
          </button>
      </div>

      {/* BODY */}
      <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
        
        {/* BUSCADOR */}
        <div className="mb-4 relative">
            <input type="text" placeholder="Buscar por Nombre o Folio..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full h-12 pl-12 pr-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm focus:border-primary outline-none dark:bg-gray-800 dark:text-white transition-all" />
            <span className="material-symbols-outlined absolute left-4 top-3 text-gray-400">search</span>
            {searchTerm && (<button onClick={() => setSearchTerm('')} className="absolute right-4 top-3 text-gray-400 hover:text-gray-600"><span className="material-symbols-outlined">close</span></button>)}
        </div>

        {/* LISTA PENDIENTES */}
        {activeTab === 'pending' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-left-4">
                {filteredRequests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400 opacity-60">
                        <span className="material-symbols-outlined text-6xl mb-2">task_alt</span>
                        <p>No hay solicitudes pendientes.</p>
                    </div>
                ) : (
                    filteredRequests.map(req => (
                        <div key={req.id} className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border-l-4 border-yellow-400 flex justify-between items-center hover:shadow-md transition-shadow">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                     <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Pendiente</span>
                                     <span className="text-xs text-gray-400 font-mono">{req.folio}</span>
                                     {req.hasDisability && <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1"><span className="material-symbols-outlined text-[10px]">accessible</span> Discapacidad</span>}
                                </div>
                                <h4 className="font-bold text-gray-900 dark:text-white text-base">{req.userName}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{req.type}</span>
                                    <span className="text-xs text-gray-500">{req.process}</span>
                                </div>
                            </div>
                            <button onClick={() => handleOpenReview(req)} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-colors flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">rate_review</span> Validar
                            </button>
                        </div>
                    ))
                )}
            </div>
        )}

        {/* LISTA HISTORIAL */}
        {activeTab === 'history' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                {/* (Aquí va el mismo bloque de filtros que ya tenías, lo omito para ahorrar espacio pero está incluido en la lógica) */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-3">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1"><span className="material-symbols-outlined text-sm">filter_alt</span> Filtrar Periodo</h3>
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">{filterLabel}</span>
                    </div>
                    {/* ...Inputs de fecha... (Mismo código anterior) */}
                    <div className="flex gap-2 items-center">
                        <input type="date" value={dateRange.start} max={dateRange.end} onChange={(e) => { if(e.target.value <= dateRange.end) { setDateRange({...dateRange, start: e.target.value}); setFilterLabel('Personalizado'); }}} className="w-full bg-gray-50 h-10 pt-3 px-2 text-xs rounded border outline-none font-bold" />
                        <span className="text-gray-300">-</span>
                        <input type="date" value={dateRange.end} min={dateRange.start} max={todayISO} onChange={(e) => { if(e.target.value >= dateRange.start && e.target.value <= todayISO) { setDateRange({...dateRange, end: e.target.value}); setFilterLabel('Personalizado'); }}} className="w-full bg-gray-50 h-10 pt-3 px-2 text-xs rounded border outline-none font-bold" />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => handleQuickDate('today')} className="flex-1 py-1.5 rounded border text-xs font-bold hover:bg-gray-50">Hoy</button>
                        <button onClick={() => handleQuickDate('week')} className="flex-1 py-1.5 rounded border text-xs font-bold hover:bg-gray-50">Semana</button>
                        <button onClick={() => handleQuickDate('month')} className="flex-1 py-1.5 rounded border text-xs font-bold hover:bg-gray-50">Mes</button>
                    </div>
                </div>

                {filteredRequests.length === 0 ? (
                    <div className="text-center py-10 opacity-50 border-2 border-dashed border-gray-200 rounded-2xl">
                        <span className="material-symbols-outlined text-4xl mb-2 text-gray-400">history</span>
                        <p className="text-sm font-medium text-gray-500">No hay registros en este periodo.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredRequests.map(req => (
                            <div key={req.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${req.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        <span className="material-symbols-outlined text-xl">{req.status === 'completed' ? 'check' : 'block'}</span>
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">{req.userName}</h4>
                                        <p className="text-xs text-gray-500 truncate mt-0.5">{req.type} • {req.process}</p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0 pl-2">
                                    <div className="flex flex-col items-end">
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md mb-1 ${req.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                            {req.status === 'completed' ? 'Aprobado' : 'Rechazado'}
                                        </span>
                                        <p className="text-[10px] font-mono font-bold text-gray-400">{req.folio}</p>
                                        <p className="text-[10px] text-gray-400">{formatDateMX(req.date)}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}
      </main>

      {/* --- MODAL DE REVISIÓN DINÁMICO --- */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start bg-gray-50 dark:bg-gray-900 rounded-t-2xl">
                    <div>
                        <h2 className="text-xl font-black text-gray-800 dark:text-white">Validación Documental</h2>
                        <div className="flex items-center gap-2">
                             <p className="text-sm text-gray-500 font-bold">{selectedReq.userName}</p>
                             {selectedReq.hasDisability && <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border border-purple-200">Discapacidad</span>}
                        </div>
                        <p className="text-xs text-gray-400 font-mono">Folio: {selectedReq.folio}</p>
                    </div>
                    <button onClick={() => setSelectedReq(null)} className="text-gray-400 hover:text-gray-600"><span className="material-symbols-outlined">close</span></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* AQUÍ ITERAMOS SOBRE LA LISTA DINÁMICA */}
                    {getRequiredDocs(selectedReq).map((doc) => {
                        const status = docStatus[doc.key];
                        return (
                            <div key={doc.key} className={`p-4 rounded-xl border-2 transition-all ${status === 'rejected' ? 'border-red-100 bg-red-50/50' : status === 'accepted' ? 'border-green-100 bg-green-50/50' : 'border-gray-100 bg-white'}`}>
                                <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-50 p-2 rounded-lg text-blue-600"><span className="material-symbols-outlined">description</span></div>
                                        <div>
                                            <h4 className="font-bold text-sm text-gray-800">{doc.label}</h4>
                                            <button onClick={() => handleViewDocument(doc.key, doc.label)} className="text-xs text-primary font-bold hover:underline flex items-center gap-1 mt-0.5"><span className="material-symbols-outlined text-xs">visibility</span> Ver Archivo</button>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleSetDocStatus(doc.key, 'rejected')} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${status === 'rejected' ? 'bg-red-600 text-white shadow-lg scale-110' : 'bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-500'}`} title="Rechazar"><span className="material-symbols-outlined">close</span></button>
                                        <button onClick={() => handleSetDocStatus(doc.key, 'accepted')} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${status === 'accepted' ? 'bg-green-600 text-white shadow-lg scale-110' : 'bg-gray-100 text-gray-400 hover:bg-green-100 hover:text-green-500'}`} title="Aceptar"><span className="material-symbols-outlined">check</span></button>
                                    </div>
                                </div>
                                {status === 'rejected' && (
                                    <div className="animate-in fade-in slide-in-from-top-2">
                                        <label className="text-[10px] font-bold uppercase text-red-600 mb-1 block">Motivo de Rechazo (Obligatorio)</label>
                                        <textarea value={docReasons[doc.key]} onChange={(e) => handleReasonChange(doc.key, e.target.value)} placeholder={`Explica por qué rechazas ${doc.label}...`} className="w-full text-sm p-3 border border-red-200 rounded-lg focus:border-red-500 outline-none bg-white h-20 resize-none" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                <div className="p-6 border-t border-gray-100 bg-gray-50 dark:bg-gray-900 rounded-b-2xl flex justify-end gap-3">
                    <button onClick={() => setSelectedReq(null)} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-200 transition-colors">Cancelar</button>
                    <button onClick={handleSubmitReview} className="px-8 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold shadow-lg hover:opacity-90 transition-opacity flex items-center gap-2"><span className="material-symbols-outlined">save</span> Guardar Dictamen</button>
                </div>
            </div>
        </div>
      )}

      {/* --- PREVIEW MODAL --- */}
      {previewDoc && (
          <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col animate-in fade-in">
              <div className="flex justify-between items-center p-4 text-white"><h3 className="font-bold text-lg">{previewDoc.title}</h3><button onClick={() => setPreviewDoc(null)} className="bg-white/10 p-2 rounded-full hover:bg-white/20"><span className="material-symbols-outlined">close</span></button></div>
              <div className="flex-1 bg-gray-800 flex items-center justify-center p-4 overflow-hidden relative">
                  {previewDoc.url.endsWith('.pdf') ? <iframe src={previewDoc.url} className="w-full h-full rounded-lg bg-white" title="PDF" /> : <img src={previewDoc.url} alt="Doc" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />}
                  <a href={previewDoc.url} target="_blank" rel="noopener noreferrer" className="absolute bottom-8 right-8 bg-primary text-white px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-2 hover:scale-105 transition-transform"><span className="material-symbols-outlined">download</span> Descargar</a>
              </div>
          </div>
      )}

    </div>
  );
};

export default OperatorDashboardScreen;