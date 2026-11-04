'use client';

import { useState } from 'react';

export default function FinanzasDashboardPage() {
  const [activeTab, setActiveTab] = useState<'panorama' | 'movimientos' | 'presupuesto'>('panorama');
  const [fechaProyeccion, setFechaProyeccion] = useState('2026-12');

  // ================= ESTADOS PARA EL REGISTRO MANUAL =================
  const [movForm, setMovForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    entidad: 'Arienzo',
    tipo: 'Egreso',
    categoria: 'Anticipo Konkeri (Operativo)',
    detalle: '',
    monto: '',
    pagado_por: 'Caja de la Empresa',
    estado_comprobante: 'No Facturado'
  });

  const [presupuestoForm, setPresupuestoForm] = useState({
    categoria: 'Honorarios y Servicios',
    detalle: '',
    monto_proyectado: '',
    fecha_estimada: ''
  });

  // DATOS SIMULADOS PARA EL DISEÑO DEL DASHBOARD GERENCIAL
  
  // BLOQUE 1: REALIDAD ACTUAL (FUENTES Y USOS)
  const fuentes = {
    aportesSocios: 15000,
    ingresoPreventas: 8500
  };
  const totalFuentes = fuentes.aportesSocios + fuentes.ingresoPreventas;

  const usos = {
    inversionObraPermisos: 2500,
    anticiposKonkeri: 6000 // Lo que Saúl y Debbi han sacado para operar/vivir
  };
  const totalUsos = usos.inversionObraPermisos + usos.anticiposKonkeri;

  const saldoActualBancos = totalFuentes - totalUsos; // Esto debe cuadrar con el banco

  // BLOQUE 2: JUSTIFICACIÓN KONKERI
  const comisionesDevengadas = 16000; // Ej: 4% de $400,000 en ventas
  const saldoPorFacturarKonkeri = comisionesDevengadas - usos.anticiposKonkeri;

  // BLOQUE 3: PROYECCIÓN FUTURA
  const cuentasPorCobrarClientes = 18500; // Leído automático del CRM (cuotas futuras)
  
  const inversionesPorHacer = [
    { id: 1, categoria: 'Trámites Municipales', detalle: 'Aprobación Anteproyecto', proyectado: 2500, fecha_estimada: 'Nov 2026' },
    { id: 2, categoria: 'Marketing', detalle: 'Nuevos Renders', proyectado: 1800, fecha_estimada: 'Dic 2026' },
  ];
  const totalInversionesProyectadas = inversionesPorHacer.reduce((acc, curr) => acc + curr.proyectado, 0);
  
  // Proyección final
  const proyeccionCaja = saldoActualBancos + cuentasPorCobrarClientes - totalInversionesProyectadas;

  return (
    <div className="min-h-screen bg-[#F9F7F5] p-4 md:p-8 font-sans text-[#415364]">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* CABECERA FINANCIERA */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center border-b border-neutral-200 pb-6 gap-4">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-[#B94A36] uppercase block">Gestión Financiera</span>
            <h1 className="text-3xl font-bold tracking-tight text-[#21242E] mt-1">Control General de Operaciones</h1>
            <p className="text-xs text-neutral-500 mt-1">Registro contable, justificación de usos y proyección de liquidez.</p>
          </div>

          <div className="flex bg-white p-1.5 rounded-xl border border-neutral-200 shadow-sm gap-1 overflow-x-auto w-full lg:w-auto">
            <button onClick={() => setActiveTab('panorama')} className={`px-4 py-2.5 text-[11px] font-bold tracking-wider uppercase rounded-lg transition-all whitespace-nowrap ${activeTab === 'panorama' ? 'bg-[#21242E] text-[#D1C292] shadow-md' : 'text-[#415364]/70 hover:bg-neutral-50'}`}>
              1. Panorama Gerencial
            </button>
            <button onClick={() => setActiveTab('movimientos')} className={`px-4 py-2.5 text-[11px] font-bold tracking-wider uppercase rounded-lg transition-all whitespace-nowrap ${activeTab === 'movimientos' ? 'bg-[#21242E] text-[#D1C292] shadow-md' : 'text-[#415364]/70 hover:bg-neutral-50'}`}>
              2. Libro de Caja (Diario)
            </button>
            <button onClick={() => setActiveTab('presupuesto')} className={`px-4 py-2.5 text-[11px] font-bold tracking-wider uppercase rounded-lg transition-all whitespace-nowrap ${activeTab === 'presupuesto' ? 'bg-[#21242E] text-[#D1C292] shadow-md' : 'text-[#415364]/70 hover:bg-neutral-50'}`}>
              3. Inversiones por Hacer
            </button>
          </div>
        </div>

        {/* HERRAMIENTA 1: PANORAMA GERENCIAL (LA PELÍCULA COMPLETA) */}
        {activeTab === 'panorama' && (
          <div className="space-y-6 animate-in fade-in max-w-5xl mx-auto">
            
            {/* BLOQUE 1: REALIDAD ACTUAL */}
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
               <div className="bg-neutral-50 border-b border-neutral-200 p-4 px-6 flex justify-between items-center">
                  <h2 className="text-[12px] font-bold text-[#21242E] uppercase tracking-widest">I. Estado Actual: Fuentes y Usos</h2>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-wider">
                     Saldo en Bancos: ${saldoActualBancos.toLocaleString()}
                  </span>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2">
                 {/* FUENTES */}
                 <div className="p-6 border-b md:border-b-0 md:border-r border-neutral-100">
                    <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-4">Ingresos (Fuentes de Capital)</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-neutral-600">Aportes de Socios / Capital</span>
                        <span className="text-sm font-mono font-bold text-emerald-600">${fuentes.aportesSocios.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-neutral-600">Cobros de Preventa (Clientes)</span>
                        <span className="text-sm font-mono font-bold text-emerald-600">${fuentes.ingresoPreventas.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center border-t border-neutral-100 pt-3 mt-3">
                        <span className="text-xs font-bold text-[#21242E] uppercase">Total Ingresos</span>
                        <span className="text-sm font-mono font-bold text-[#21242E]">${totalFuentes.toLocaleString()}</span>
                      </div>
                    </div>
                 </div>

                 {/* USOS */}
                 <div className="p-6">
                    <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-4">Egresos (Usos de Capital)</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-neutral-600">Inversión Proyecto (Permisos, etc.)</span>
                        <span className="text-sm font-mono font-bold text-[#ea0029]">-${usos.inversionObraPermisos.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center bg-amber-50 p-2 -mx-2 rounded border border-amber-100">
                        <span className="text-xs font-bold text-amber-800">Anticipos Girados a Konkeri</span>
                        <span className="text-sm font-mono font-bold text-[#ea0029]">-${usos.anticiposKonkeri.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center border-t border-neutral-100 pt-3 mt-3">
                        <span className="text-xs font-bold text-[#21242E] uppercase">Total Egresos</span>
                        <span className="text-sm font-mono font-bold text-[#21242E]">-${totalUsos.toLocaleString()}</span>
                      </div>
                    </div>
                 </div>
               </div>
            </div>

            {/* BLOQUE 2: JUSTIFICACIÓN KONKERI */}
            <div className="bg-[#1a1c23] text-white rounded-2xl shadow-xl border border-neutral-800 p-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-[#B94A36] opacity-10 rounded-full blur-3xl -mr-20 -mt-20"></div>
               
               <h2 className="text-[12px] font-bold text-[#D1C292] uppercase tracking-widest mb-1 relative z-10">II. Justificación Operativa (Posición Konkeri)</h2>
               <p className="text-[10px] text-neutral-400 mb-6 relative z-10">Cruce contable para justificar los retiros operativos de Konkeri como anticipos de servicios comerciales.</p>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                 <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                   <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest block mb-1">Comisiones Devengadas</span>
                   <span className="text-2xl font-mono font-bold text-white">${comisionesDevengadas.toLocaleString()}</span>
                 </div>
                 <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                   <span className="text-[9px] text-[#ea0029] font-bold uppercase tracking-widest block mb-1">(-) Anticipos Retirados</span>
                   <span className="text-2xl font-mono font-bold text-white">-${usos.anticiposKonkeri.toLocaleString()}</span>
                 </div>
                 <div className="bg-[#D1C292]/10 border border-[#D1C292]/20 p-4 rounded-xl">
                   <span className="text-[9px] text-[#D1C292] font-bold uppercase tracking-widest block mb-1">Saldo por Facturar a Arienzo</span>
                   <span className="text-2xl font-mono font-bold text-[#D1C292]">${saldoPorFacturarKonkeri.toLocaleString()}</span>
                 </div>
               </div>
            </div>

            {/* BLOQUE 3: PROYECCIÓN FUTURA */}
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
               <div className="flex justify-between items-center mb-6 border-b border-neutral-100 pb-4">
                 <h2 className="text-[12px] font-bold text-[#21242E] uppercase tracking-widest">III. Proyección y Obligaciones</h2>
                 <div className="flex items-center gap-2">
                   <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Corte al:</label>
                   <input type="month" value={fechaProyeccion} onChange={(e) => setFechaProyeccion(e.target.value)} className="text-[11px] font-bold bg-neutral-50 border border-neutral-200 rounded p-1 outline-none text-[#21242E]" />
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">1. Liquidez Base Hoy</span>
                    <p className="text-xl font-mono font-bold text-[#21242E]">${saldoActualBancos.toLocaleString()}</p>
                  </div>
                  
                  <div className="space-y-1 border-l border-neutral-100 pl-6">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">(+) Cuentas por Cobrar CRM</span>
                    <p className="text-xl font-mono font-bold text-emerald-600">${cuentasPorCobrarClientes.toLocaleString()}</p>
                  </div>

                  <div className="space-y-1 border-l border-neutral-100 pl-6">
                    <span className="text-[10px] font-bold text-[#B94A36] uppercase tracking-widest">(-) Inversiones por Hacer</span>
                    <p className="text-xl font-mono font-bold text-[#B94A36]">-${totalInversionesProyectadas.toLocaleString()}</p>
                  </div>
               </div>

               <div className="mt-6 pt-6 border-t border-neutral-200 flex justify-between items-center">
                  <span className="text-[11px] font-bold text-[#21242E] uppercase tracking-widest">Proyección de Caja Libre:</span>
                  <span className="text-3xl font-mono font-bold text-[#21242E]">${proyeccionCaja.toLocaleString()}</span>
               </div>
            </div>
          </div>
        )}

        {/* HERRAMIENTA 2: LIBRO DE ENTRADAS Y SALIDAS */}
        {activeTab === 'movimientos' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
            {/* FORMULARIO MANUAL */}
            <div className="lg:col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 h-fit sticky top-6">
              <h2 className="text-[11px] font-bold text-[#21242E] uppercase tracking-widest border-b border-neutral-100 pb-3 mb-5">Nuevo Registro de Caja</h2>
              
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Tipo</label>
                    <select value={movForm.tipo} onChange={e => setMovForm({...movForm, tipo: e.target.value})} className={`w-full text-xs font-bold p-2.5 rounded-lg border outline-none ${movForm.tipo === 'Ingreso' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                      <option value="Ingreso">INGRESO (+)</option>
                      <option value="Egreso">EGRESO (-)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Entidad</label>
                    <select value={movForm.entidad} onChange={e => setMovForm({...movForm, entidad: e.target.value})} className="w-full text-xs font-bold p-2.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none">
                      <option>Arienzo</option>
                      <option>Konkeri</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Concepto o Categoría</label>
                  <select value={movForm.categoria} onChange={e => setMovForm({...movForm, categoria: e.target.value})} className="w-full text-xs font-medium p-2.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none text-[#415364]">
                    {movForm.tipo === 'Ingreso' ? (
                      <>
                        <option>Aporte de Socios / Capital</option>
                        <option>Cobro Preventa (Cliente)</option>
                        <option>Otro Ingreso</option>
                      </>
                    ) : (
                      <>
                        <option>Anticipo Konkeri (Operativo)</option>
                        <option>Inversión Obra / Permisos</option>
                        <option>Gasto Comercial Externo</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Detalle Exacto</label>
                  <input type="text" value={movForm.detalle} onChange={e => setMovForm({...movForm, detalle: e.target.value})} className="w-full text-xs font-medium p-2.5 rounded-lg border border-neutral-200 bg-white outline-none focus:border-[#B94A36]" placeholder="Ej. Aprobación Planos Municipio" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Valor ($)</label>
                    <input type="number" value={movForm.monto} onChange={e => setMovForm({...movForm, monto: e.target.value})} className="w-full text-lg font-mono font-bold p-2.5 rounded-lg border border-neutral-200 bg-white outline-none focus:border-[#B94A36] text-[#21242E]" placeholder="0.00" />
                  </div>
                </div>

                <div className="p-3 bg-[#415364]/5 border border-[#415364]/10 rounded-xl mt-2">
                   <label className="text-[9px] font-bold text-[#415364] uppercase block mb-1.5">Medio de Pago / Origen</label>
                   <select value={movForm.pagado_por} onChange={e => setMovForm({...movForm, pagado_por: e.target.value})} className="w-full text-[11px] font-bold p-2 rounded border border-neutral-200 bg-white outline-none text-[#ea0029]">
                      <option>Cuenta Bancaria Proyecto</option>
                      <option>Tarjeta Personal (Saúl)</option>
                      <option>Tarjeta Personal (Debbi)</option>
                   </select>
                </div>

                <div className="pt-3">
                  <button type="button" className="w-full bg-[#21242E] text-white font-bold uppercase tracking-widest text-[10px] py-3.5 rounded-xl hover:bg-black transition-all shadow-md">
                    Guardar en el Libro
                  </button>
                </div>
              </form>
            </div>

            {/* TABLA DE MOVIMIENTOS (CON BOTONES EDITAR/ELIMINAR) */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 overflow-hidden flex flex-col">
              <h2 className="text-[11px] font-bold text-[#B94A36] uppercase tracking-widest border-b border-neutral-100 pb-3 mb-4">Libro Diario (Caja Real)</h2>
              
              <div className="overflow-auto custom-scrollbar flex-1 -mx-2 px-2">
                <table className="w-full text-left text-[11px] whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-neutral-200 text-neutral-400 uppercase tracking-wider">
                      <th className="py-3 px-2 font-semibold">Fecha</th>
                      <th className="py-3 px-2 font-semibold">Caja</th>
                      <th className="py-3 px-2 font-semibold">Concepto</th>
                      <th className="py-3 px-2 font-semibold text-right">Monto</th>
                      <th className="py-3 px-2 font-semibold text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    <tr className="hover:bg-neutral-50">
                      <td className="py-3 px-2 font-mono text-neutral-500">2026-10-15</td>
                      <td className="py-3 px-2">
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[#D1C292]/20 text-[#8A7A55]">Arienzo</span>
                      </td>
                      <td className="py-3 px-2">
                        <p className="font-bold text-[#415364]">Aporte de Socios / Capital</p>
                        <p className="text-[9px] text-neutral-500">Depósito inicial de operaciones</p>
                      </td>
                      <td className="py-3 px-2 text-right font-mono font-bold text-emerald-600">+$15,000.00</td>
                      <td className="py-3 px-2 text-center space-x-2">
                        <button className="text-neutral-400 hover:text-[#415364]">✏️</button>
                        <button className="text-neutral-400 hover:text-[#ea0029]">🗑️</button>
                      </td>
                    </tr>
                    <tr className="hover:bg-neutral-50">
                      <td className="py-3 px-2 font-mono text-neutral-500">2026-11-05</td>
                      <td className="py-3 px-2">
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[#D1C292]/20 text-[#8A7A55]">Arienzo</span>
                      </td>
                      <td className="py-3 px-2">
                        <p className="font-bold text-[#415364]">Anticipo Konkeri (Operativo)</p>
                        <p className="text-[9px] text-neutral-500">Retiro para gastos operativos y pauta</p>
                      </td>
                      <td className="py-3 px-2 text-right font-mono font-bold text-[#ea0029]">-$6,000.00</td>
                      <td className="py-3 px-2 text-center space-x-2">
                        <button className="text-neutral-400 hover:text-[#415364]">✏️</button>
                        <button className="text-neutral-400 hover:text-[#ea0029]">🗑️</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* HERRAMIENTA 3: INVERSIONES POR HACER (PRESUPUESTO MANUAL) */}
        {activeTab === 'presupuesto' && (
          <div className="bg-white rounded-2xl p-16 shadow-sm border border-neutral-200 text-center animate-in fade-in">
             <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
               <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
             </div>
             <h2 className="text-lg font-bold text-[#21242E]">Planificación de Inversiones</h2>
             <p className="text-sm text-neutral-500 mt-2">Aquí conectarás los egresos manuales que sabes que tienes que pagar a futuro para restarlos de la proyección.</p>
          </div>
        )}

      </div>
    </div>
  );
}