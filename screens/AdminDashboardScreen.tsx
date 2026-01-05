import React, { useState } from 'react';
// IMPORTACIONES NUEVAS PARA PDF
import html2pdf from 'html2pdf.js';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { FileOpener } from '@capacitor-community/file-opener';

interface AdminDashboardScreenProps {
  onLogout: () => void;
}

// LISTA OFICIAL DE LOS 39 MUNICIPIOS
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

// MOCK DATA: Operadores
const INITIAL_OPERATORS = [
    { id: 1, name: 'Roberto Gómez', email: 'roberto@durango.gob.mx', role: 'Supervisor', status: 'active', rejections: 12, approvals: 140 },
    { id: 2, name: 'Ana Martínez', email: 'ana@durango.gob.mx', role: 'Operador', status: 'active', rejections: 45, approvals: 80 },
    { id: 3, name: 'Carlos Ruiz', email: 'carlos@durango.gob.mx', role: 'Operador', status: 'inactive', rejections: 2, approvals: 15 },
    { id: 4, name: 'Daniela Soto', email: 'daniela@durango.gob.mx', role: 'Operador', status: 'active', rejections: 8, approvals: 95 },
];

const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'operators'>('overview');
  const [operators, setOperators] = useState(INITIAL_OPERATORS);
  
  // Filtros de Fecha
  const todayDate = new Date();
  const todayISO = todayDate.toISOString().split('T')[0]; 
  const firstDay = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 0).toISOString().split('T')[0];

  const [dateRange, setDateRange] = useState({ start: firstDay, end: lastDay });
  const [filterLabel, setFilterLabel] = useState('Mes Actual');
  
  // FILTROS DE OPERADORES
  const [searchOp, setSearchOp] = useState('');
  const [filterOpStatus, setFilterOpStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Estados Modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMuni, setSelectedMuni] = useState<string | null>(null);

  // PDF Preview
  const [pdfPreview, setPdfPreview] = useState<{ show: boolean, html: string, title: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false); // Para mostrar carga al descargar

  // Inputs Nuevo Operador
  const [newOpName, setNewOpName] = useState('');
  const [newOpEmail, setNewOpEmail] = useState('');
  const [formErrors, setFormErrors] = useState<{name?: string, email?: string}>({});

  // --- HELPERS ---
  const formatDateMX = (isoDate: string) => {
      if (!isoDate) return '';
      const [year, month, day] = isoDate.split('-');
      return `${day}/${month}/${year}`;
  };

  const getRangeText = () => {
      if (dateRange.start && dateRange.end) {
          return `${formatDateMX(dateRange.start)} al ${formatDateMX(dateRange.end)}`;
      }
      return "Periodo Histórico Completo";
  };

  const getMuniStats = (muniName: string) => {
      const seed = muniName.length * 10; 
      const total = Math.floor(Math.random() * 500) + seed;
      const autoPct = 65; 
      const motoPct = 35;
      
      return {
          name: muniName,
          total,
          auto: { count: Math.floor(total * (autoPct/100)), pct: autoPct },
          moto: { count: Math.floor(total * (motoPct/100)), pct: motoPct },
          types: {
              primera: Math.floor(total * 0.4),
              refrendo: Math.floor(total * 0.5),
              reposicion: Math.floor(total * 0.1)
          }
      };
  };
  
  const currentMuniStats = selectedMuni ? getMuniStats(selectedMuni) : null;

  const filteredOperators = operators.filter(op => {
      const matchesSearch = op.name.toLowerCase().includes(searchOp.toLowerCase()) || op.email.toLowerCase().includes(searchOp.toLowerCase());
      const matchesStatus = filterOpStatus === 'all' ? true : op.status === filterOpStatus;
      return matchesSearch && matchesStatus;
  });

  // --- LÓGICA DE EXPORTACIÓN ---

  // 1. EXCEL (CSV) - VERSIÓN NATIVA CAPACITOR
  const downloadExcel = async () => {
    try {
      // 1. Generar el contenido del CSV
      let csvContent = "\uFEFFID,Municipio,Total Tramites,Autos,Motos,Recaudacion Estimada\n"; 
      DURANGO_MUNICIPIOS.forEach((muni, index) => {
          const stats = getMuniStats(muni);
          const cash = stats.total * 900;
          csvContent += `${index + 1},"${muni}",${stats.total},${stats.auto.count},${stats.moto.count},"$${cash}"\n`;
      });

      // 2. Definir nombre único
      const fileName = `Reporte_Durango_${Date.now()}.csv`;

      // 3. Guardar el archivo físicamente en el celular
      const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: csvContent,
          directory: Directory.Documents, // Se guarda en "Documentos"
          encoding: Encoding.UTF8 // Importante: Texto plano
      });

      // 4. Abrir el archivo inmediatamente (Sheets, Excel, etc.)
      await FileOpener.open({
          filePath: savedFile.uri,
          contentType: 'text/csv', // Le dice al celular que es una hoja de cálculo
      });

    } catch (error) {
      console.error("Error al exportar Excel:", error);
      alert("No se pudo abrir el archivo. Asegúrate de tener una app como Google Sheets o Excel instalada.");
    }
  };
  // 2. PREPARAR HTML
  const generateHTMLStructure = (title: string, contentBody: string) => {
    return `
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: 'Helvetica', sans-serif; padding: 20px; color: #333; background: white; }
                h1 { color: #2c3e50; margin-bottom: 5px; font-size: 24px; }
                .header { border-bottom: 2px solid #2c3e50; padding-bottom: 10px; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; font-size: 10px; }
                th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
                th { background-color: #2c3e50; color: white; }
                tr:nth-child(even) { background-color: #f9f9f9; }
                .box { border: 1px solid #eee; padding: 10px; margin-bottom: 10px; border-radius: 8px; background: #fafafa; }
                .row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px; }
                .val { font-weight: bold; }
                .footer { margin-top: 30px; font-size: 8px; color: #777; text-align: center; border-top: 1px solid #eee; padding-top: 10px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>${title}</h1>
                <p style="font-size: 12px; margin: 0;"><strong>Fecha:</strong> ${formatDateMX(todayISO)} | <strong>Periodo:</strong> ${filterLabel} (${getRangeText()})</p>
            </div>
            ${contentBody}
            <div class="footer">Gobierno del Estado de Durango - Plataforma Digital Segura</div>
        </body>
        </html>
    `;
  };

  const handlePreviewGlobalPDF = () => {
    let grandTotal = 0;
    let grandAutos = 0;
    let grandMotos = 0;
    let rowsHTML = '';
    
    DURANGO_MUNICIPIOS.forEach(muni => {
        const stats = getMuniStats(muni);
        const cash = stats.total * 900;
        grandTotal += stats.total;
        grandAutos += stats.auto.count;
        grandMotos += stats.moto.count;
        rowsHTML += `<tr><td>${muni}</td><td><strong>${stats.total}</strong></td><td>${stats.auto.count}</td><td>${stats.moto.count}</td><td>$${cash.toLocaleString()}</td></tr>`;
    });

    const body = `
        <table>
            <thead><tr><th>Municipio</th><th>Total</th><th>Autos</th><th>Motos</th><th>Recaudación</th></tr></thead>
            <tbody>
                ${rowsHTML}
                <tr style="background-color: #eef2ff; font-weight: bold;"><td>TOTAL ESTATAL</td><td>${grandTotal}</td><td>${grandAutos}</td><td>${grandMotos}</td><td>-</td></tr>
            </tbody>
        </table>
    `;
    setPdfPreview({ show: true, html: generateHTMLStructure('Reporte Estatal Global', body), title: 'Reporte Global' });
  };

  const handlePreviewMuniPDF = () => {
    if (!currentMuniStats) return;
    const s = currentMuniStats;
    const body = `
        <h2 style="color: #4F46E5; margin-top:0;">${s.name}</h2>
        <div class="box">
            <h3 style="margin:0 0 10px 0; font-size:14px; border-bottom:1px solid #ddd;">Resumen</h3>
            <div class="row"><span>Total Trámites:</span> <span class="val">${s.total}</span></div>
        </div>
        <div class="box">
            <h3 style="margin:0 0 10px 0; font-size:14px; border-bottom:1px solid #ddd;">Parque Vehicular</h3>
            <div class="row"><span>Autos:</span> <span class="val">${s.auto.count} (${s.auto.pct}%)</span></div>
            <div class="row"><span>Motos:</span> <span class="val">${s.moto.count} (${s.moto.pct}%)</span></div>
        </div>
        <div class="box">
            <h3 style="margin:0 0 10px 0; font-size:14px; border-bottom:1px solid #ddd;">Trámites</h3>
            <div class="row"><span>Primera Vez:</span> <span class="val">${s.types.primera}</span></div>
            <div class="row"><span>Refrendo:</span> <span class="val">${s.types.refrendo}</span></div>
        </div>
    `;
    setPdfPreview({ show: true, html: generateHTMLStructure('Reporte Municipal', body), title: `Reporte - ${s.name}` });
  };

  // --- FUNCIÓN MAESTRA: GENERAR, GUARDAR Y ABRIR PDF EN ANDROID ---
  const handleDownloadAndOpen = async () => {
    if (!pdfPreview) return;
    setIsGenerating(true);

    try {
        // 1. Crear un elemento temporal en el DOM
        const element = document.createElement('div');
        element.innerHTML = pdfPreview.html;
        element.style.width = '210mm';
        element.style.padding = '20px';
        document.body.appendChild(element);

        // 2. Configuración de html2pdf (CORREGIDA CON 'as const')
        const opt = {
            margin:       0,
            filename:     'reporte.pdf',
            image:        { type: 'jpeg' as const, quality: 0.98 }, // <--- AQUÍ ESTÁ EL ARREGLO
            html2canvas:  { scale: 2, useCORS: true },
            // También agregamos 'as const' aquí para evitar errores similares con jsPDF
            jsPDF:        { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const } 
        };

        // 3. Generar el PDF como Base64
        const pdfBase64 = await html2pdf().set(opt).from(element).outputPdf('datauristring');
        
        // Limpiamos el DOM
        document.body.removeChild(element);

        // 4. Limpiar el string base64
        const base64Data = pdfBase64.split(',')[1];
        
        // 5. Definir nombre del archivo único
        const fileName = `Reporte_${Date.now()}.pdf`;

        // 6. Guardar el archivo en el dispositivo
        const savedFile = await Filesystem.writeFile({
            path: fileName,
            data: base64Data,
            directory: Directory.Documents, 
            // Si en tu Android falla con Documents, cambia a Directory.Cache
        });

        // 7. Abrir el archivo con el visor nativo
        await FileOpener.open({
            filePath: savedFile.uri,
            contentType: 'application/pdf',
        });

    } catch (error) {
        console.error("Error al generar PDF:", error);
        alert("Error al generar o abrir el documento. Verifica los permisos de almacenamiento.");
    } finally {
        setIsGenerating(false);
    }
  };

  // --- RESTO DE FUNCIONES (Sin cambios) ---
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (/^[a-zA-ZñÑáéíóúÁÉÍÓÚ\s]*$/.test(value)) setNewOpName(value);
  };
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => setNewOpEmail(e.target.value);
  const handleAddOperator = () => {
      const errors: {name?: string, email?: string} = {};
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!newOpName.trim()) errors.name = "El nombre es requerido.";
      if (!newOpEmail.trim()) { errors.email = "El email es requerido."; } else if (!emailRegex.test(newOpEmail)) { errors.email = "Formato inválido."; }
      if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
      const newOp = { id: Date.now(), name: newOpName, email: newOpEmail, role: 'Operador', status: 'active', rejections: 0, approvals: 0 };
      setOperators([...operators, newOp as any]);
      setShowAddModal(false); setNewOpName(''); setNewOpEmail(''); setFormErrors({});
  };
  const handleToggleStatus = (id: number) => { setOperators(prev => prev.map(op => op.id === id ? { ...op, status: op.status === 'active' ? 'inactive' : 'active' } : op)); };
  const handleDeleteOperator = (id: number) => { if(window.confirm('¿Estás seguro de eliminar este operador?')) setOperators(prev => prev.filter(op => op.id !== id)); };
  const handleQuickDate = (type: 'month' | 'quarter' | 'year') => {
      const end = new Date(); const start = new Date();
      if (type === 'month') { start.setDate(1); setFilterLabel('Mes Actual'); } 
      else if (type === 'quarter') { start.setMonth(end.getMonth() - 3); setFilterLabel('Último Trimestre'); } 
      else if (type === 'year') { start.setMonth(0, 1); setFilterLabel('Año en Curso'); }
      setDateRange({ start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] });
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      <header className="safe-top bg-indigo-900 text-white px-6 pb-5 shadow-lg sticky top-0 z-10 rounded-b-3xl">
        <div className="flex justify-between items-center mb-4 pt-4"> 
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30">
                    <span className="material-symbols-outlined text-indigo-100">monitoring</span>
                </div>
                <div>
                    <h1 className="font-black text-lg leading-tight tracking-tight">Panel de Control</h1>
                    <p className="text-[10px] opacity-70 uppercase tracking-wider font-bold">Estado de Durango</p>
                </div>
            </div>
            <button onClick={onLogout} className="bg-white/10 hover:bg-red-500/80 p-2 rounded-xl transition-colors">
                <span className="material-symbols-outlined text-sm">logout</span>
            </button>
        </div>
        <div className="flex bg-indigo-950/50 p-1 rounded-xl">
            <button onClick={() => setActiveTab('overview')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'overview' ? 'bg-white text-indigo-900 shadow-md' : 'text-indigo-200 hover:bg-white/5'}`}>
                <span className="material-symbols-outlined text-sm">analytics</span> Reportes
            </button>
            <button onClick={() => setActiveTab('operators')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'operators' ? 'bg-white text-indigo-900 shadow-md' : 'text-indigo-200 hover:bg-white/5'}`}>
                <span className="material-symbols-outlined text-sm">group</span> Operadores
            </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-6 pb-[calc(2rem+env(safe-area-inset-bottom))]">
        {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Trámites {filterLabel === 'Periodo Personalizado' ? 'en periodo' : filterLabel}</p>
                        <h2 className="text-2xl font-black text-gray-800 dark:text-white">3,450</h2>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2"><div className="bg-indigo-500 h-1.5 rounded-full w-[70%]"></div></div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Recaudación Total</p>
                        <h2 className="text-2xl font-black text-gray-800 dark:text-white">$2.8M</h2>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2"><div className="bg-green-500 h-1.5 rounded-full w-[85%]"></div></div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-lg border border-indigo-100 dark:border-gray-700">
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2"><span className="material-symbols-outlined text-indigo-500">filter_alt</span> Exportar Datos</h3>
                            <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-900 rounded-lg p-1 border border-gray-100 dark:border-gray-700">
                                <button onClick={handlePreviewGlobalPDF} className="p-2 text-gray-400 hover:text-red-500 hover:bg-white dark:hover:bg-gray-800 rounded-md transition-all"><span className="material-symbols-outlined text-xl">picture_as_pdf</span></button>
                                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700"></div>
                                <button onClick={downloadExcel} className="p-2 text-gray-400 hover:text-green-600 hover:bg-white dark:hover:bg-gray-800 rounded-md transition-all"><span className="material-symbols-outlined text-xl">table_view</span></button>
                            </div>
                        </div>
                        <div className="flex gap-2 items-center bg-gray-50 dark:bg-gray-900 p-2 rounded-xl border border-gray-200 dark:border-gray-700">
                             {/* ... Inputs de fecha (igual que antes) ... */}
                             <div className="flex-1 relative"><span className="absolute left-2 top-2 text-[8px] font-bold text-gray-400 uppercase">Desde</span><input type="date" value={dateRange.start} onChange={(e) => { setDateRange({...dateRange, start: e.target.value}); setFilterLabel('Periodo Personalizado'); }} className="w-full bg-transparent pt-4 pb-1 px-2 text-xs font-bold outline-none dark:text-white" /></div>
                             <div className="text-gray-300">-</div>
                             <div className="flex-1 relative"><span className="absolute left-2 top-2 text-[8px] font-bold text-gray-400 uppercase">Hasta</span><input type="date" value={dateRange.end} onChange={(e) => { setDateRange({...dateRange, end: e.target.value}); setFilterLabel('Periodo Personalizado'); }} className="w-full bg-transparent pt-4 pb-1 px-2 text-xs font-bold outline-none dark:text-white" /></div>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                            <button onClick={() => handleQuickDate('month')} className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-bold border border-indigo-100 hover:bg-indigo-100">Mes Actual</button>
                            <button onClick={() => handleQuickDate('quarter')} className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 text-xs font-bold border border-gray-200 hover:bg-gray-100">3 Meses</button>
                            <button onClick={() => handleQuickDate('year')} className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 text-xs font-bold border border-gray-200 hover:bg-gray-100">Año Actual</button>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2"><span className="material-symbols-outlined text-orange-500">map</span> Desglose por Municipio</h3>
                        <p className="text-[10px] text-gray-400 mt-1">Filtrado por: <span className="font-bold text-indigo-500">{filterLabel} ({getRangeText()})</span></p>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                        {DURANGO_MUNICIPIOS.map((muni, i) => (
                            <div key={muni} onClick={() => setSelectedMuni(muni)} className="px-5 py-4 border-b border-gray-50 dark:border-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer transition-colors flex justify-between items-center group">
                                <div className="flex items-center gap-3"><span className="text-xs font-bold text-gray-300 w-4">{i + 1}</span><span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-indigo-600 transition-colors">{muni}</span></div>
                                <span className="material-symbols-outlined text-gray-300 text-sm group-hover:text-indigo-400">bar_chart</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}
        {/* ... (Vista Operators igual) ... */}
        {activeTab === 'operators' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                 <div className="flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 dark:text-white">Equipo Registrado</h3>
                    <button onClick={() => setShowAddModal(true)} className="text-xs font-bold bg-indigo-600 text-white px-3 py-1.5 rounded-lg shadow hover:bg-indigo-700 flex items-center gap-1"><span className="material-symbols-outlined text-sm">add</span> Nuevo</button>
                </div>
                 {/* ... Filtros y Lista Operadores (sin cambios) ... */}
                 {/* Reutiliza tu código anterior aquí para operadores, no ha cambiado */}
                 <div className="text-center py-10 opacity-50"><p>Panel de Operadores (Aquí iría tu lista)</p></div>
             </div>
        )}
      </main>

      {/* --- MODAL DETALLE MUNICIPIO --- */}
      {selectedMuni && currentMuniStats && (
          <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl shadow-2xl p-6 animate-in slide-in-from-bottom-10 space-y-6 max-h-[85vh] overflow-y-auto">
                   {/* ... Cabecera y Gráficas (sin cambios) ... */}
                   <div className="flex justify-between items-start">
                      <div><p className="text-xs font-bold text-gray-400 uppercase">Detalle Municipal</p><h2 className="text-2xl font-black text-gray-900 dark:text-white">{selectedMuni}</h2></div>
                      <button onClick={() => setSelectedMuni(null)} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200"><span className="material-symbols-outlined text-sm">close</span></button>
                  </div>
                   {/* Botón Ver PDF */}
                  <button onClick={handlePreviewMuniPDF} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined">visibility</span> Ver Reporte PDF
                  </button>
              </div>
          </div>
      )}

      {/* --- MODAL AGREGAR OPERADOR (Igual) --- */}
      {showAddModal && (
         <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in">
            {/* ... Formulario Nuevo Operador ... */}
             <div className="bg-white p-6 rounded-3xl w-full max-w-sm"><button onClick={() => setShowAddModal(false)}>Cerrar</button></div>
         </div>
      )}

      {/* --- NUEVO MODAL: PREVIEW PDF --- */}
      {pdfPreview && (
          <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white w-full max-w-2xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative">
                  {/* Loading Overlay cuando descarga */}
                  {isGenerating && (
                      <div className="absolute inset-0 z-50 bg-white/80 flex flex-col items-center justify-center backdrop-blur-sm">
                          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mb-4"></div>
                          <p className="font-bold text-indigo-900">Generando PDF...</p>
                      </div>
                  )}

                  {/* Cabecera */}
                  <div className="px-4 py-3 border-b flex justify-between items-center bg-gray-50">
                      <h3 className="font-bold text-gray-700">{pdfPreview.title}</h3>
                      <button onClick={() => setPdfPreview(null)} className="p-2 hover:bg-gray-200 rounded-full text-gray-500">
                          <span className="material-symbols-outlined">close</span>
                      </button>
                  </div>
                  
                  {/* Contenido HTML (Preview Scrollable) */}
                  <div className="flex-1 overflow-auto p-4 bg-gray-200">
                      {/* min-w-[700px] fuerza scroll horizontal en móviles si la tabla es ancha */}
                      <div className="bg-white shadow-xl min-h-full p-8 mx-auto max-w-[21cm] min-w-[700px]" dangerouslySetInnerHTML={{ __html: pdfPreview.html }}></div>
                  </div>

                  {/* Pie con Botón de Descarga Real */}
                  <div className="p-4 border-t bg-white flex justify-end gap-3 safe-bottom">
                      <button onClick={() => setPdfPreview(null)} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg">Cerrar</button>
                      <button onClick={handleDownloadAndOpen} disabled={isGenerating} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg shadow-lg hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50">
                          <span className="material-symbols-outlined">download</span> Descargar y Abrir
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default AdminDashboardScreen;