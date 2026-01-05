import React, { useState } from 'react';

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
  // --- ESTADOS ---
  const [activeTab, setActiveTab] = useState<'overview' | 'operators'>('overview');
  const [operators, setOperators] = useState(INITIAL_OPERATORS);
  
  // Filtros de Fecha
  const todayDate = new Date();
  const firstDay = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 0).toISOString().split('T')[0];
  
  // Fecha actual en ISO para inputs y lógica interna
  const todayISO = todayDate.toISOString().split('T')[0]; 

  const [dateRange, setDateRange] = useState({ start: firstDay, end: lastDay });
  const [filterLabel, setFilterLabel] = useState('Mes Actual');
  
  // FILTROS DE OPERADORES
  const [searchOp, setSearchOp] = useState('');
  const [filterOpStatus, setFilterOpStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Estados Modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMuni, setSelectedMuni] = useState<string | null>(null);

  // Inputs Nuevo Operador
  const [newOpName, setNewOpName] = useState('');
  const [newOpEmail, setNewOpEmail] = useState('');
  const [formErrors, setFormErrors] = useState<{name?: string, email?: string}>({});

  // --- HELPER: FORMATO DE FECHA MEXICO (DD/MM/AAAA) ---
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

  // --- GENERADOR DE DATOS FICTICIOS ---
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

  // --- LÓGICA DE FILTRADO DE OPERADORES ---
  const filteredOperators = operators.filter(op => {
      const matchesSearch = op.name.toLowerCase().includes(searchOp.toLowerCase()) || op.email.toLowerCase().includes(searchOp.toLowerCase());
      const matchesStatus = filterOpStatus === 'all' ? true : op.status === filterOpStatus;
      return matchesSearch && matchesStatus;
  });

  // --- LÓGICA DE DESCARGA REAL (EXCEL / PDF) ---

  // 1. GENERAR EXCEL GLOBAL (CSV)
  const downloadExcel = () => {
    let csvContent = "\uFEFFID,Municipio,Total Tramites,Autos,Motos,Recaudacion Estimada\n"; 

    DURANGO_MUNICIPIOS.forEach((muni, index) => {
        const stats = getMuniStats(muni);
        const cash = stats.total * 900;
        csvContent += `${index + 1},"${muni}",${stats.total},${stats.auto.count},${stats.moto.count},"$${cash}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `Reporte_Durango_${todayISO}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. GENERAR PDF GLOBAL
  const downloadGlobalPDF = () => {
    const printWindow = window.open('', '', 'height=600,width=800');
    if(printWindow) {
        printWindow.document.write('<html><head><title>Reporte Global</title>');
        printWindow.document.write('<style>body{font-family:sans-serif; padding: 20px;} table{width:100%; border-collapse: collapse; font-size: 12px;} th, td{border: 1px solid #ddd; padding: 8px; text-align: left;} th{background-color: #2c3e50; color: white;} h1, h2{color: #2c3e50;} .header{margin-bottom: 20px; border-bottom: 2px solid #2c3e50; padding-bottom: 10px;}</style>');
        printWindow.document.write('</head><body>');
        
        printWindow.document.write('<div class="header">');
        printWindow.document.write(`<h1>Reporte Estatal de Trámites Vehiculares</h1>`);
        // FECHAS EN FORMATO MX
        printWindow.document.write(`<p><strong>Fecha de Emisión:</strong> ${formatDateMX(todayISO)} &nbsp;|&nbsp; <strong>Periodo:</strong> ${filterLabel} <br/> <span style="font-size: 0.9em; color: #666;">(${getRangeText()})</span></p>`);
        printWindow.document.write('</div>');

        printWindow.document.write('<table><thead><tr><th>Municipio</th><th>Total Trámites</th><th>Autos (Carros)</th><th>Motos</th><th>Recaudación (Est.)</th></tr></thead><tbody>');
        
        let grandTotal = 0;
        let grandAutos = 0;
        let grandMotos = 0;

        DURANGO_MUNICIPIOS.forEach(muni => {
            const stats = getMuniStats(muni);
            const cash = stats.total * 900;
            grandTotal += stats.total;
            grandAutos += stats.auto.count;
            grandMotos += stats.moto.count;

            printWindow.document.write(`<tr>
                <td>${muni}</td>
                <td><strong>${stats.total}</strong></td>
                <td>${stats.auto.count}</td>
                <td>${stats.moto.count}</td>
                <td>$${cash.toLocaleString()}</td>
            </tr>`);
        });
        
        printWindow.document.write(`<tr style="background-color: #f0f0f0; font-weight: bold;">
            <td>TOTAL ESTATAL</td>
            <td>${grandTotal}</td>
            <td>${grandAutos}</td>
            <td>${grandMotos}</td>
            <td>-</td>
        </tr>`);

        printWindow.document.write('</tbody></table>');
        printWindow.document.write('<br/><p style="font-size: 10px; color: gray;">Generado por Plataforma de Licencias Digitales Durango.</p>');
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
    }
  };

  // 3. GENERAR PDF INDIVIDUAL (MUNICIPAL)
  const downloadMuniPDF = () => {
    if (!currentMuniStats) return;

    const printWindow = window.open('', '', 'height=600,width=800');
    if(printWindow) {
        const s = currentMuniStats;
        printWindow.document.write('<html><head><title>Reporte Municipal</title>');
        printWindow.document.write('<style>body{font-family:sans-serif; padding: 40px;} .box{border: 1px solid #ddd; padding: 15px; margin-bottom: 20px; border-radius: 8px;} h1{color: #4F46E5; margin-bottom: 5px;} h3{border-bottom: 1px solid #eee; padding-bottom: 10px; margin-top: 0;} .row{display: flex; justify-content: space-between; margin-bottom: 5px;} .label{color: #666;} .val{font-weight: bold;}</style>');
        printWindow.document.write('</head><body>');

        printWindow.document.write(`<h1>${s.name}</h1>`);
        printWindow.document.write(`<p>Reporte Detallado de Operaciones</p>`);
        printWindow.document.write(`<hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />`);
        
        // FECHAS EN FORMATO MX
        printWindow.document.write(`<p><strong>Periodo:</strong> ${filterLabel} (${getRangeText()})</p>`);
        printWindow.document.write(`<p><strong>Fecha Impresión:</strong> ${formatDateMX(todayISO)}</p>`);
        printWindow.document.write(`<br/>`);

        printWindow.document.write('<div class="box">');
        printWindow.document.write('<h3>Resumen General</h3>');
        printWindow.document.write(`<div class="row"><span class="label">Total de Trámites:</span> <span class="val" style="font-size: 1.2em;">${s.total}</span></div>`);
        printWindow.document.write('</div>');

        printWindow.document.write('<div class="box">');
        printWindow.document.write('<h3>Parque Vehicular Atendido</h3>');
        printWindow.document.write(`<div class="row"><span class="label">Automóviles:</span> <span class="val">${s.auto.count} (${s.auto.pct}%)</span></div>`);
        printWindow.document.write(`<div class="row"><span class="label">Motocicletas:</span> <span class="val">${s.moto.count} (${s.moto.pct}%)</span></div>`);
        printWindow.document.write('</div>');

        printWindow.document.write('<div class="box">');
        printWindow.document.write('<h3>Desglose por Tipo de Trámite</h3>');
        printWindow.document.write(`<div class="row"><span class="label">Primera Vez:</span> <span class="val">${s.types.primera}</span></div>`);
        printWindow.document.write(`<div class="row"><span class="label">Refrendo:</span> <span class="val">${s.types.refrendo}</span></div>`);
        printWindow.document.write(`<div class="row"><span class="label">Reposición:</span> <span class="val">${s.types.reposicion}</span></div>`);
        printWindow.document.write('</div>');

        printWindow.document.write('<br/><br/><p style="text-align: center; font-size: 10px; color: gray;">Gobierno del Estado de Durango - Secretaría de Seguridad Pública</p>');
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
    }
  };


  // --- RESTO DE FUNCIONES ---
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (/^[a-zA-ZñÑáéíóúÁÉÍÓÚ\s]*$/.test(value)) {
          setNewOpName(value);
          if (formErrors.name) setFormErrors(prev => ({...prev, name: ''}));
      }
  };
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setNewOpEmail(e.target.value);
      if (formErrors.email) setFormErrors(prev => ({...prev, email: ''}));
  };
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
      
      {/* HEADER */}
      <header className="safe-top bg-indigo-900 text-white px-6 pb-5 shadow-lg sticky top-0 z-10 rounded-b-3xl">
        <div className="flex justify-between items-center mb-4">
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

        {/* Tabs */}
        <div className="flex bg-indigo-950/50 p-1 rounded-xl">
            <button onClick={() => setActiveTab('overview')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'overview' ? 'bg-white text-indigo-900 shadow-md' : 'text-indigo-200 hover:bg-white/5'}`}>
                <span className="material-symbols-outlined text-sm">analytics</span> Reportes
            </button>
            <button onClick={() => setActiveTab('operators')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'operators' ? 'bg-white text-indigo-900 shadow-md' : 'text-indigo-200 hover:bg-white/5'}`}>
                <span className="material-symbols-outlined text-sm">group</span> Operadores
            </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* --- VISTA REPORTES --- */}
        {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                {/* KPIs */}
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

                {/* FILTROS Y DESCARGA */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-lg border border-indigo-100 dark:border-gray-700">
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-indigo-500">filter_alt</span> Exportar Datos
                            </h3>
                            {/* Toolbar de Descarga */}
                            <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-900 rounded-lg p-1 border border-gray-100 dark:border-gray-700">
                                <button onClick={downloadGlobalPDF} className="p-2 text-gray-400 hover:text-red-500 hover:bg-white dark:hover:bg-gray-800 rounded-md transition-all" title="Ver Reporte PDF Global">
                                    <span className="material-symbols-outlined text-xl">picture_as_pdf</span>
                                </button>
                                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700"></div>
                                <button onClick={downloadExcel} className="p-2 text-gray-400 hover:text-green-600 hover:bg-white dark:hover:bg-gray-800 rounded-md transition-all" title="Descargar Excel Global">
                                    <span className="material-symbols-outlined text-xl">table_view</span>
                                </button>
                            </div>
                        </div>
                        {/* Calendario */}
                        <div className="flex gap-2 items-center bg-gray-50 dark:bg-gray-900 p-2 rounded-xl border border-gray-200 dark:border-gray-700">
                            <div className="flex-1 relative">
                                <span className="absolute left-2 top-2 text-[8px] font-bold text-gray-400 uppercase">Desde</span>
                                <input type="date" value={dateRange.start} max={dateRange.end || todayISO} onChange={(e) => { setDateRange({...dateRange, start: e.target.value}); setFilterLabel('Periodo Personalizado'); }} className="w-full bg-transparent pt-4 pb-1 px-2 text-xs font-bold outline-none dark:text-white" />
                            </div>
                            <div className="text-gray-300">-</div>
                            <div className="flex-1 relative">
                                <span className="absolute left-2 top-2 text-[8px] font-bold text-gray-400 uppercase">Hasta</span>
                                <input type="date" value={dateRange.end} min={dateRange.start} max={todayISO} onChange={(e) => { setDateRange({...dateRange, end: e.target.value}); setFilterLabel('Periodo Personalizado'); }} className="w-full bg-transparent pt-4 pb-1 px-2 text-xs font-bold outline-none dark:text-white" />
                            </div>
                        </div>
                        {/* Chips */}
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                            <button onClick={() => handleQuickDate('month')} className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-bold border border-indigo-100 hover:bg-indigo-100">Mes Actual</button>
                            <button onClick={() => handleQuickDate('quarter')} className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 text-xs font-bold border border-gray-200 hover:bg-gray-100">3 Meses</button>
                            <button onClick={() => handleQuickDate('year')} className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 text-xs font-bold border border-gray-200 hover:bg-gray-100">Año Actual</button>
                        </div>
                    </div>
                </div>

                {/* LISTA MUNICIPIOS */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2"><span className="material-symbols-outlined text-orange-500">map</span> Desglose por Municipio</h3>
                        {/* RANGO DE FECHAS EN TEXTO MX */}
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

        {/* --- VISTA GESTIÓN DE OPERADORES --- */}
        {activeTab === 'operators' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 dark:text-white">Equipo Registrado</h3>
                    <button onClick={() => setShowAddModal(true)} className="text-xs font-bold bg-indigo-600 text-white px-3 py-1.5 rounded-lg shadow hover:bg-indigo-700 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">add</span> Nuevo
                    </button>
                </div>

                {/* FILTROS DE OPERADORES */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-3">
                    {/* Buscador */}
                    <div className="relative">
                        <input 
                            type="text" 
                            value={searchOp}
                            onChange={(e) => setSearchOp(e.target.value)}
                            placeholder="Buscar por Nombre o Correo..." 
                            className="w-full h-11 pl-10 pr-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors"
                        />
                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400">search</span>
                    </div>
                    {/* Filtro Status */}
                    <div className="flex gap-2">
                         <button onClick={() => setFilterOpStatus('all')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${filterOpStatus === 'all' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-transparent border-gray-200 text-gray-500'}`}>Todos</button>
                         <button onClick={() => setFilterOpStatus('active')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${filterOpStatus === 'active' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-transparent border-gray-200 text-gray-500'}`}>Activos</button>
                         <button onClick={() => setFilterOpStatus('inactive')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${filterOpStatus === 'inactive' ? 'bg-gray-100 border-gray-300 text-gray-600' : 'bg-transparent border-gray-200 text-gray-500'}`}>Inactivos</button>
                    </div>
                </div>

                {/* LISTA FILTRADA */}
                {filteredOperators.length > 0 ? (
                    filteredOperators.map(op => (
                        <div key={op.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                            <div className="flex items-start gap-4 relative z-10">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg text-white shadow-md ${op.status === 'active' ? 'bg-gradient-to-br from-indigo-400 to-purple-500' : 'bg-gray-400 grayscale'}`}>
                                    {op.name.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between">
                                        <h4 className="font-bold text-gray-900 dark:text-white">{op.name}</h4>
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${op.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {op.status === 'active' ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500">{op.email}</p>
                                    <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                        <div className="text-center"><p className="text-[10px] text-gray-400 font-bold uppercase">Aprobados</p><p className="text-sm font-black text-gray-700 dark:text-white">{op.approvals}</p></div>
                                        <div className="text-center"><p className="text-[10px] text-gray-400 font-bold uppercase">Rechazos</p><p className="text-sm font-black text-red-500">{op.rejections}</p></div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 flex gap-2 justify-end">
                                <button onClick={() => handleToggleStatus(op.id)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 text-gray-600 hover:bg-gray-200">
                                    {op.status === 'active' ? 'Desactivar' : 'Activar'}
                                </button>
                                <button onClick={() => handleDeleteOperator(op.id)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100">Baja</button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 opacity-50">
                        <span className="material-symbols-outlined text-4xl mb-2">person_search</span>
                        <p>No se encontraron operadores.</p>
                    </div>
                )}
            </div>
        )}
      </main>

      {/* --- MODAL DETALLE MUNICIPIO --- */}
      {selectedMuni && currentMuniStats && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl shadow-2xl p-6 animate-in slide-in-from-bottom-10 space-y-6 max-h-[85vh] overflow-y-auto">
                  <div className="flex justify-between items-start">
                      <div>
                          <p className="text-xs font-bold text-gray-400 uppercase">Detalle Municipal</p>
                          <h2 className="text-2xl font-black text-gray-900 dark:text-white">{selectedMuni}</h2>
                          {/* FECHAS EN FORMATO MX */}
                          <div className="flex items-center gap-1 mt-1"><span className="material-symbols-outlined text-xs text-indigo-500">calendar_month</span><p className="text-xs text-indigo-500 font-bold">{filterLabel} ({getRangeText()})</p></div>
                      </div>
                      <button onClick={() => setSelectedMuni(null)} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200"><span className="material-symbols-outlined text-sm">close</span></button>
                  </div>
                  {/* Gráficas */}
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
                      <h4 className="font-bold text-sm text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-indigo-500">pie_chart</span> Parque Vehicular</h4>
                      <div className="flex items-center justify-around">
                          <div className="relative w-28 h-28 rounded-full shadow-lg" style={{ background: `conic-gradient(#4F46E5 0% ${currentMuniStats.auto.pct}%, #ec4899 ${currentMuniStats.auto.pct}% 100%)` }}>
                               <div className="absolute inset-3 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center flex-col"><span className="text-xs text-gray-400">Total</span><span className="text-xl font-black text-gray-800 dark:text-white">{currentMuniStats.total}</span></div>
                          </div>
                          <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-indigo-600"></div><span className="text-gray-500">Autos ({currentMuniStats.auto.pct}%)</span></div>
                              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-pink-500"></div><span className="text-gray-500">Motos ({currentMuniStats.moto.pct}%)</span></div>
                          </div>
                      </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
                      <h4 className="font-bold text-sm text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-orange-500">bar_chart</span> Tipos de Trámite</h4>
                      <div className="space-y-4">
                          <div><div className="flex justify-between text-xs mb-1 font-medium"><span>Refrendo</span><span>{currentMuniStats.types.refrendo}</span></div><div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{ width: '60%' }}></div></div></div>
                          <div><div className="flex justify-between text-xs mb-1 font-medium"><span>Primera Vez</span><span>{currentMuniStats.types.primera}</span></div><div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{ width: '30%' }}></div></div></div>
                          <div><div className="flex justify-between text-xs mb-1 font-medium"><span>Reposición</span><span>{currentMuniStats.types.reposicion}</span></div><div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-orange-400 h-2 rounded-full" style={{ width: '10%' }}></div></div></div>
                      </div>
                  </div>
                  <button onClick={downloadMuniPDF} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 flex items-center justify-center gap-2"><span className="material-symbols-outlined">download</span> Descargar Reporte Municipal</button>
              </div>
          </div>
      )}

      {/* MODAL AGREGAR OPERADOR (CON VALIDACIONES) */}
      {showAddModal && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in">
             <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-3xl shadow-2xl p-6 animate-in slide-in-from-bottom-10 space-y-4">
                 <h2 className="text-lg font-black text-gray-900 dark:text-white">Dar de Alta Operador</h2>
                 <div className="space-y-1">
                     <label className="text-xs font-bold text-gray-400 uppercase">Nombre Completo</label>
                     <input value={newOpName} onChange={handleNameChange} className={`w-full h-12 border rounded-xl px-4 bg-gray-50 dark:bg-gray-900 dark:text-white outline-none focus:border-indigo-500 ${formErrors.name ? 'border-red-400 bg-red-50' : 'dark:border-gray-700'}`} placeholder="Ej. Luis Miguel" />
                     {formErrors.name && <p className="text-[10px] text-red-500 font-bold">{formErrors.name}</p>}
                 </div>
                 <div className="space-y-1">
                     <label className="text-xs font-bold text-gray-400 uppercase">Email Institucional</label>
                     <input value={newOpEmail} onChange={handleEmailChange} className={`w-full h-12 border rounded-xl px-4 bg-gray-50 dark:bg-gray-900 dark:text-white outline-none focus:border-indigo-500 ${formErrors.email ? 'border-red-400 bg-red-50' : 'dark:border-gray-700'}`} placeholder="@durango.gob.mx" />
                     {formErrors.email && <p className="text-[10px] text-red-500 font-bold">{formErrors.email}</p>}
                 </div>
                 <div className="flex gap-3 pt-2">
                     <button onClick={() => { setShowAddModal(false); setFormErrors({}); }} className="flex-1 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl">Cancelar</button>
                     <button onClick={handleAddOperator} className="flex-1 py-3 font-bold bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700">Guardar</button>
                 </div>
             </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboardScreen;