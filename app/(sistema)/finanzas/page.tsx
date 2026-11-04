'use client';

import { useState } from 'react';

export default function FinanzasDashboardPage() {
  const [activeTab, setActiveTab] = useState<'resumen' | 'movimientos' | 'intercompania' | 'proyeccion'>('resumen');
  const [fechaCorte, setFechaCorte] = useState('2026-12');

  // ================= ESTADOS PARA EL REGISTRO MANUAL =================
  const [movForm, setMovForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    entidad: 'Arienzo',
    tipo: 'Egreso',
    categoria: 'Costos Operativos',
    detalle: '',
    monto: '',
    pagado_por: 'Caja de la Empresa',
    estado: 'Registrado'
  });

  const [proyeccionForm, setProyeccionForm] = useState({
    categoria: 'Honorarios y Servicios',
    detalle: '',
    monto_estimado: '',
    fecha_estimada: ''
  });

  // ================= DATOS DE EJEMPLO =================
  // 1. Efectivo y Caja
  const cajaDisponible = 12540.50; // Saldo real en bancos

  // 2. Histórico (Realizado)
  const totalIngresos = 23500.00;
  const totalEgresosObra = 2500.00;
  const totalEgresosOperativos = 8459.50; // Aquí están los retiros de Konkeri

  // 3. Proyecciones
  const cuentasPorCobrar = 18500.00; // Leído de CRM
  const inversionesPorHacer = [
    { id: 1, categoria: 'Trámites', detalle: 'Aprobación Anteproyecto', estimado: 2500, fecha: 'Nov 2026' },
    { id: 2, categoria: 'Marketing', detalle: 'Nuevos Renders', estimado: 1800, fecha: 'Dic 2026' },
  ];
  const totalInversionesProyectadas = inversionesPorHacer.reduce((acc, curr) => acc + curr.estimado, 0);
  
  const liquidezProyectada = cajaDisponible + cuentasPorCobrar - totalInversionesProyectadas;

  // 4. Intercompañía (La justificación de Konkeri)
  const honorariosFacturables = 16000.00; // Comisiones/Servicios de Konkeri ganados
  const anticiposEntregados = 8459.50; // Lo que Konkeri ya ha retirado
  const saldoPendienteLiquidacion = honorariosFacturables - anticiposEntregados;

  return (
    <div className="min-h-screen bg-[#F9F7F5] p-4 md:p-8 font-sans text-[#415364]">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* CABECERA */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center border-b border-neutral-200 pb-6 gap-4">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-[#B94A36] uppercase block">Dirección Financiera</span>
            <h1 className="text-3xl font-bold tracking-tight text-[#21242E] mt-1">Control de Operaciones</h1>
            <p className="text-xs text-neutral-500 mt-1">Gestión de liquidez, presupuestos y posición consolidada.</p>
          </div>

          <div className="flex bg-white p-1.5 rounded-xl border border-neutral-200 shadow-sm gap-1 overflow-x-auto w-full lg:w-auto">
            <button onClick={() => setActiveTab('resumen')} className={`px-4 py-2.5 text-[11px] font-bold tracking-wider uppercase rounded-lg transition-all whitespace-nowrap ${activeTab === 'resumen' ? 'bg-[#21242E] text-[#D1C292] shadow-md' : 'text-[#415364]/70 hover:bg-neutral-50'}`}>
              Resumen Ejecutivo
            </button>
            <button onClick={() => setActiveTab('movimientos')} className={`px-4 py-2.5 text-[11px] font-bold tracking-wider uppercase rounded-lg transition-all whitespace-nowrap ${activeTab === 'movimientos' ? 'bg-[#21242E] text-[#D1C292] shadow-md' : 'text-[#415364]/70 hover:bg-neutral-50'}`}>
              Libro Diario (Caja)
            </button>
            <button onClick={() => setActiveTab('proyeccion')} className={`px-4 py-2.5 text-[11px] font-bold tracking-wider uppercase rounded-lg transition-all whitespace-nowrap ${activeTab === 'proyeccion' ? 'bg-[#21242E] text-[#D1C292] shadow-md' : 'text-[#415364]/70 hover:bg-neutral-50'}`}>
              Obligaciones & Presupuesto
            </button>
            <button onClick={() => setActiveTab('intercompania')} className={`px-4 py-2.5 text-[11px] font-bold tracking-wider uppercase rounded-lg transition-all whitespace-nowrap ${activeTab === 'intercompania' ? 'bg-neutral-200 text-[#21242E] shadow-inner' : 'text-neutral-400 hover:bg-neutral-100'}`}>
              Conciliación Interna
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PESTAÑA 1: RESUMEN EJECUTIVO (CORPORATIVO Y LIMPIO) */}
        {/* ========================================================================= */}
        {activeTab === 'resumen' && (
          <div className="space-y-6 animate-in fade-in max-w-6xl mx-auto">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-[#21242E] p-8 rounded-2xl shadow-lg border border-neutral-800 flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-[#D1C292] uppercase tracking-widest block mb-2">Liquidez Disponible (Caja)</span>
                  <span className="text-4xl font-mono font-bold text-white">${cajaDisponible.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                  <span className="text-[10px] text-white/50 uppercase mt-3 tracking-wider">Efectivo en cuentas operativas</span>
               </div>
               
               <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-200 flex flex-col justify-center">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block">Proyección a Corto Plazo</span>
                    <input type="month" value={fechaCorte} onChange={e => setFechaCorte(e.target.value)} className="text-[10px] font-bold text-neutral-500 border border-neutral-200 rounded p-1 outline-none" />
                  </div>
                  <span className="text-4xl font-mono font-bold text-[#21242E]">${liquidezProyectada.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                  <span className="text-[10px] text-neutral-400 uppercase mt-3 tracking-wider">Caja + CxC Clientes - Obligaciones (Presupuesto)</span>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
                <h2 className="text-[11px] font-bold text-[#415364] uppercase tracking-widest mb-4 border-b border-neutral-100 pb-2">Radiografía Histórica (Realizado)</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                    <span className="text-xs font-bold text-neutral-600">Total Ingresos Históricos</span>
                    <span className="text-sm font-mono font-bold text-emerald-600">${totalIngresos.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                    <span className="text-xs font-bold text-neutral-600">Total Inversión (Obra/Permisos)</span>
                    <span className="text-sm font-mono font-bold text-[#ea0029]">-${totalEgresosObra.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                    <span className="text-xs font-bold text-neutral-600">Total Costos Operativos & Comerciales</span>
                    <span className="text-sm font-mono font-bold text-[#ea0029]">-${totalEgresosOperativos.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
                <h2 className="text-[11px] font-bold text-[#415364] uppercase tracking-widest mb-4 border-b border-neutral-100 pb-2">Obligaciones (Por Realizar)</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-sky-50 p-3 rounded-lg border border-sky-100">
                    <span className="text-xs font-bold text-sky-800">Cuentas por Cobrar (Clientes CRM)</span>
                    <span className="text-sm font-mono font-bold text-sky-700">${cuentasPorCobrar.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center bg-amber-50 p-3 rounded-lg border border-amber-100">
                    <span className="text-xs font-bold text-amber-800">Presupuesto de Inversión Pendiente</span>
                    <span className="text-sm font-mono font-bold text-amber-700">-${totalInversionesProyectadas.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PESTAÑA 2: LIBRO DIARIO (COMO ESTABA, MANUAL Y FLEXIBLE) */}
        {/* ========================================================================= */}
        {activeTab === 'movimientos' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
            <div className="lg:col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 h-fit sticky top-6">
              <h2 className="text-[11px] font-bold text-[#21242E] uppercase tracking-widest border-b border-neutral-100 pb-3 mb-5">Registrar Movimiento</h2>
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Tipo</label>
                    <select value={movForm.tipo} onChange={e => setMovForm({...movForm, tipo: e.target.value})} className="w-full text-xs font-bold p-2.5 rounded-lg border outline-none bg-neutral-50">
                      <option value="Ingreso">INGRESO (+)</option>
                      <option value="Egreso">EGRESO (-)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Entidad</label>
                    <select value={movForm.entidad} onChange={e => setMovForm({...movForm, entidad: e.target.value})} className="w-full text-xs font-bold p-2.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none">
                      <option>Arienzo S.A.S.</option>
                      <option>Konkeri S.A.S.</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Categoría</label>
                  <select value={movForm.categoria} onChange={e => setMovForm({...movForm, categoria: e.target.value})} className="w-full text-xs font-medium p-2.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none text-[#415364]">
                    <option>Costos Operativos y Comerciales</option>
                    <option>Inversión Obra y Permisos</option>
                    <option>Honorarios Profesionales</option>
                    <option>Aportes y Capital</option>
                    <option>Cobros y Preventas</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Detalle</label>
                  <input type="text" className="w-full text-xs font-medium p-2.5 rounded-lg border border-neutral-200 bg-white outline-none focus:border-[#B94A36]" placeholder="Ej. Pago Pauta Facebook" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Monto ($)</label>
                  <input type="number" className="w-full text-lg font-mono font-bold p-2.5 rounded-lg border border-neutral-200 bg-white outline-none focus:border-[#B94A36] text-[#21242E]" placeholder="0.00" />
                </div>
                <div className="pt-3">
                  <button type="button" className="w-full bg-[#21242E] text-white font-bold uppercase tracking-widest text-[10px] py-3.5 rounded-xl hover:bg-black transition-all shadow-md">
                    Guardar Movimiento
                  </button>
                </div>
              </form>
            </div>
            
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
               <h2 className="text-[11px] font-bold text-[#415364] uppercase tracking-widest border-b border-neutral-100 pb-3 mb-4">Últimos Registros</h2>
               <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-sm font-bold text-neutral-400">Libro Diario</p>
                  <p className="text-xs text-neutral-400 mt-1">Los registros manuales aparecerán aquí.</p>
               </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PESTAÑA 3: OBLIGACIONES & PRESUPUESTO (INVERSIONES POR HACER) */}
        {/* ========================================================================= */}
        {activeTab === 'proyeccion' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
            <div className="lg:col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 h-fit sticky top-6">
              <h2 className="text-[11px] font-bold text-[#21242E] uppercase tracking-widest border-b border-neutral-100 pb-3 mb-5">Planificar Obligación</h2>
              <form className="space-y-4">
                <div>
                  <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Categoría</label>
                  <select className="w-full text-xs font-bold p-2.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none text-[#21242E]">
                    <option>Trámites y Permisos</option>
                    <option>Marketing y Ventas</option>
                    <option>Honorarios y Servicios</option>
                    <option>Impuestos y Obligaciones</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Detalle del Gasto Futuro</label>
                  <input type="text" className="w-full text-xs font-medium p-2.5 rounded-lg border border-neutral-200 bg-white outline-none focus:border-[#B94A36]" placeholder="Ej. Pago Municipio" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Costo Estimado</label>
                    <input type="number" className="w-full text-sm font-mono font-bold p-2.5 rounded-lg border border-neutral-200 bg-white outline-none text-[#B94A36]" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">¿Para Cuándo?</label>
                    <input type="month" className="w-full text-xs font-medium p-2.5 rounded-lg border border-neutral-200 bg-white outline-none" />
                  </div>
                </div>
                <div className="pt-3">
                  <button type="button" className="w-full bg-[#B94A36] text-white font-bold uppercase tracking-widest text-[10px] py-3.5 rounded-xl transition-all shadow-md">
                    Añadir al Presupuesto
                  </button>
                </div>
              </form>
            </div>

            <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
               <div className="flex justify-between items-center border-b border-neutral-100 pb-3 mb-4">
                 <h2 className="text-[11px] font-bold text-[#415364] uppercase tracking-widest">Presupuesto de Inversión Pendiente</h2>
                 <span className="text-[11px] font-mono font-bold text-[#B94A36]">Total: ${totalInversionesProyectadas.toLocaleString()}</span>
               </div>
               <div className="overflow-auto custom-scrollbar">
                <table className="w-full text-left text-[11px] whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-neutral-200 text-neutral-400 uppercase tracking-wider">
                      <th className="py-3 px-2 font-semibold">Detalle y Concepto</th>
                      <th className="py-3 px-2 font-semibold">Categoría</th>
                      <th className="py-3 px-2 font-semibold text-center">Fecha Est.</th>
                      <th className="py-3 px-2 font-semibold text-right">Valor Est.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {inversionesPorHacer.map(inv => (
                      <tr key={inv.id} className="hover:bg-neutral-50">
                        <td className="py-4 px-2 font-bold text-[#21242E]">{inv.detalle}</td>
                        <td className="py-4 px-2 text-neutral-500 uppercase text-[9px] tracking-wider">{inv.categoria}</td>
                        <td className="py-4 px-2 text-center text-neutral-500 font-medium">{inv.fecha}</td>
                        <td className="py-4 px-2 text-right font-mono font-bold text-[#B94A36]">${inv.estimado.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PESTAÑA 4: ESTADO DE CUENTA INTERCOMPAÑÍA (LA JUSTIFICACIÓN AISLADA) */}
        {/* ========================================================================= */}
        {activeTab === 'intercompania' && (
          <div className="space-y-6 animate-in fade-in max-w-4xl mx-auto">
            <div className="bg-neutral-50 p-6 rounded-2xl border border-neutral-200 text-center">
               <h2 className="text-sm font-bold text-[#21242E] mb-2">Conciliación de Cuentas: Arienzo S.A.S. & Konkeri S.A.S.</h2>
               <p className="text-xs text-neutral-500 max-w-lg mx-auto">Este panel es de uso interno exclusivo para la conciliación de honorarios y servicios devengados por la operadora comercial frente a los anticipos recibidos.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
                 <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest block mb-2">Servicios Devengados</span>
                 <span className="text-3xl font-mono font-bold text-[#21242E]">${honorariosFacturables.toLocaleString()}</span>
                 <p className="text-[9px] text-neutral-400 mt-2 uppercase">Comisiones por ventas / Honorarios ganados por Konkeri.</p>
               </div>
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
                 <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest block mb-2">Anticipos Operativos Recibidos</span>
                 <span className="text-3xl font-mono font-bold text-[#ea0029]">-${anticiposEntregados.toLocaleString()}</span>
                 <p className="text-[9px] text-neutral-400 mt-2 uppercase">Fondos retirados de Arienzo para operaciones.</p>
               </div>
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-300 bg-neutral-100">
                 <span className="text-[10px] text-[#415364] font-bold uppercase tracking-widest block mb-2">Saldo Pendiente de Liquidación</span>
                 <span className="text-3xl font-mono font-bold text-[#415364]">${saldoPendienteLiquidacion.toLocaleString()}</span>
                 <p className="text-[9px] text-neutral-500 mt-2 uppercase font-bold">Monto pendiente a favor de la Operadora.</p>
               </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}