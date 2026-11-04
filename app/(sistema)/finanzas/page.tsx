'use client';

import { useState } from 'react';

export default function FinanzasDashboardPage() {
  const [activeTab, setActiveTab] = useState<'panorama' | 'movimientos' | 'presupuesto'>('panorama');

  // ================= ESTADOS PARA EL REGISTRO MANUAL =================
  const [movForm, setMovForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    entidad: 'Arienzo',
    tipo: 'Egreso',
    categoria: 'Operación y Ventas',
    detalle: '',
    monto: '',
    pagado_por: 'Caja de la Empresa', // Clave para registrar cuando Saúl paga de su bolsillo
    estado_comprobante: 'Pendiente Facturar'
  });

  const [presupuestoForm, setPresupuestoForm] = useState({
    categoria: 'Honorarios y Servicios',
    detalle: '',
    monto_proyectado: '',
    fecha_estimada: ''
  });

  // DATOS SIMULADOS PARA MOSTRAR LA FLEXIBILIDAD DEL SISTEMA
  const movimientosManuales = [
    { id: 1, fecha: '2026-10-15', entidad: 'Konkeri', tipo: 'Ingreso', categoria: 'Honorarios por Servicios', detalle: 'Diseño de Logo y Brochure Arienzo', monto: 1200, pagado_por: 'Caja de la Empresa', estado: 'Pendiente Facturar' },
    { id: 2, fecha: '2026-10-18', entidad: 'Arienzo', tipo: 'Egreso', categoria: 'Marketing y Pauta', detalle: 'Pauta en Meta Ads (Campaña Expectativa)', monto: 450, pagado_por: 'Tarjeta Personal (Saúl)', estado: 'Reembolsable a Socio' },
    { id: 3, fecha: '2026-11-02', entidad: 'Konkeri', tipo: 'Ingreso', categoria: 'Comisiones de Venta', detalle: 'Comisión Promesa Dpto 604 (Cliente X)', monto: 8234, pagado_por: 'Caja de la Empresa', estado: 'Pendiente Facturar' },
    { id: 4, fecha: '2026-11-05', entidad: 'Arienzo', tipo: 'Egreso', categoria: 'Anticipos y Retiros', detalle: 'Retiro operativo Konkeri a cuenta de servicios', monto: 2000, pagado_por: 'Caja de la Empresa', estado: 'Pendiente Facturar' },
  ];

  const inversionesPorHacer = [
    { id: 1, categoria: 'Trámites Municipales', detalle: 'Estudio de Suelos y Aprobación de Planos', proyectado: 4500, fecha_estimada: 'Dic 2026' },
    { id: 2, categoria: 'Marketing y Ventas', detalle: 'Nuevos Renders Interiores y Maqueta 3D', proyectado: 3200, fecha_estimada: 'Nov 2026' },
    { id: 3, categoria: 'Honorarios por Servicios', detalle: 'Comisiones Konkeri por 2 ventas en curso', proyectado: 15500, fecha_estimada: 'Ene 2027' },
  ];

  // CÁLCULOS DEL PANORAMA (CASH FLOW)
  const saldoActualBancos = 32500; // Lo que hay hoy
  const cuentasPorCobrarDiciembre = 28000; // Lo que los clientes van a pagar hasta diciembre
  const totalInversionesProyectadas = inversionesPorHacer.reduce((acc, curr) => acc + curr.proyectado, 0);
  
  // Proyección: Cuánto habrá a fin de año si cobramos todo y pagamos todo lo proyectado
  const proyeccionDiciembre = saldoActualBancos + cuentasPorCobrarDiciembre - totalInversionesProyectadas;

  return (
    <div className="min-h-screen bg-[#F9F7F5] p-4 md:p-8 font-sans text-[#415364]">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* CABECERA FINANCIERA */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center border-b border-neutral-200 pb-6 gap-4">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-[#B94A36] uppercase block">Gestión Financiera</span>
            <h1 className="text-3xl font-bold tracking-tight text-[#21242E] mt-1">Control General de Operaciones</h1>
            <p className="text-xs text-neutral-500 mt-1">Registro contable, proyecciones de liquidez y presupuesto de inversión.</p>
          </div>

          <div className="flex bg-white p-1.5 rounded-xl border border-neutral-200 shadow-sm gap-1 overflow-x-auto w-full lg:w-auto">
            <button onClick={() => setActiveTab('panorama')} className={`px-4 py-2.5 text-[11px] font-bold tracking-wider uppercase rounded-lg transition-all whitespace-nowrap ${activeTab === 'panorama' ? 'bg-[#21242E] text-[#D1C292] shadow-md' : 'text-[#415364]/70 hover:bg-neutral-50'}`}>
              1. Panorama y Proyección
            </button>
            <button onClick={() => setActiveTab('movimientos')} className={`px-4 py-2.5 text-[11px] font-bold tracking-wider uppercase rounded-lg transition-all whitespace-nowrap ${activeTab === 'movimientos' ? 'bg-[#21242E] text-[#D1C292] shadow-md' : 'text-[#415364]/70 hover:bg-neutral-50'}`}>
              2. Libro de Entradas y Salidas
            </button>
            <button onClick={() => setActiveTab('presupuesto')} className={`px-4 py-2.5 text-[11px] font-bold tracking-wider uppercase rounded-lg transition-all whitespace-nowrap ${activeTab === 'presupuesto' ? 'bg-[#21242E] text-[#D1C292] shadow-md' : 'text-[#415364]/70 hover:bg-neutral-50'}`}>
              3. Inversiones por Hacer
            </button>
          </div>
        </div>

        {/* HERRAMIENTA 1: PANORAMA Y PROYECCIÓN */}
        {activeTab === 'panorama' && (
          <div className="space-y-6 animate-in fade-in max-w-6xl mx-auto">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-2">Efectivo Actual (Cajas)</span>
                  <span className="text-3xl font-mono font-bold text-[#21242E]">${saldoActualBancos.toLocaleString()}</span>
                  <span className="text-[10px] text-neutral-400 uppercase mt-2">Liquidez disponible hoy</span>
               </div>
               
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-200 flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block mb-2">(+) Proyección de Cobros a Dic.</span>
                  <span className="text-3xl font-mono font-bold text-emerald-600">${cuentasPorCobrarDiciembre.toLocaleString()}</span>
                  <span className="text-[10px] text-emerald-600/60 uppercase mt-2">Cuotas de clientes por ingresar</span>
               </div>

               <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#B94A36]/30 flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-[#B94A36] uppercase tracking-widest block mb-2">(-) Inversiones por Hacer</span>
                  <span className="text-3xl font-mono font-bold text-[#B94A36]">-${totalInversionesProyectadas.toLocaleString()}</span>
                  <span className="text-[10px] text-[#B94A36]/60 uppercase mt-2">Pagos proyectados pendientes</span>
               </div>
            </div>

            <div className="bg-[#1a1c23] text-white rounded-2xl p-8 shadow-xl border border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-[#D1C292] opacity-10 rounded-full blur-3xl -mr-20 -mt-20"></div>
               <div className="relative z-10">
                 <h2 className="text-[12px] font-bold text-[#D1C292] uppercase tracking-widest mb-1">Posición Proyectada a Diciembre 2026</h2>
                 <p className="text-xs text-neutral-400 max-w-lg">Si cobramos las cuotas programadas y ejecutamos las inversiones pendientes, esta será nuestra liquidez real a fin de año.</p>
               </div>
               <div className="relative z-10 text-right">
                 <span className="text-5xl font-mono font-bold text-white">${proyeccionDiciembre.toLocaleString()}</span>
                 <span className="block text-[10px] text-emerald-400 uppercase tracking-widest mt-2 font-bold">Flujo Neto Positivo</span>
               </div>
            </div>
          </div>
        )}

        {/* HERRAMIENTA 2: LIBRO DE ENTRADAS Y SALIDAS (REGISTRO MANUAL FLEXIBLE) */}
        {activeTab === 'movimientos' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
            
            {/* FORMULARIO MANUAL ABIERTO */}
            <div className="lg:col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 h-fit sticky top-6">
              <h2 className="text-[11px] font-bold text-[#21242E] uppercase tracking-widest border-b border-neutral-100 pb-3 mb-5">Nuevo Movimiento Manual</h2>
              
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
                    <option>Comisiones de Venta</option>
                    <option>Honorarios por Servicios (Diseño, Redes, etc.)</option>
                    <option>Marketing y Pauta Digital</option>
                    <option>Anticipos y Retiros</option>
                    <option>Trámites y Permisos</option>
                    <option>Pago a Proveedores y Contratistas</option>
                    <option>Otro Concepto Libre</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Detalle Exacto (A mano)</label>
                  <input type="text" value={movForm.detalle} onChange={e => setMovForm({...movForm, detalle: e.target.value})} className="w-full text-xs font-medium p-2.5 rounded-lg border border-neutral-200 bg-white outline-none focus:border-[#B94A36]" placeholder="Ej. Diseño de Logo Arienzo / Pauta en Meta" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Valor ($)</label>
                    <input type="number" value={movForm.monto} onChange={e => setMovForm({...movForm, monto: e.target.value})} className="w-full text-lg font-mono font-bold p-2.5 rounded-lg border border-neutral-200 bg-white outline-none focus:border-[#B94A36] text-[#21242E]" placeholder="0.00" />
                  </div>
                </div>

                {/* EL DETALLE CLAVE PARA LOS APORTES PERSONALES */}
                <div className="p-3 bg-[#415364]/5 border border-[#415364]/10 rounded-xl mt-2">
                   <label className="text-[9px] font-bold text-[#415364] uppercase block mb-1.5">¿Quién pagó esto?</label>
                   <select value={movForm.pagado_por} onChange={e => setMovForm({...movForm, pagado_por: e.target.value})} className="w-full text-[11px] font-bold p-2 rounded border border-neutral-200 bg-white outline-none text-[#ea0029]">
                      <option>Caja de la Empresa (Banco)</option>
                      <option>Tarjeta Personal (Saúl) - Reembolsable</option>
                      <option>Tarjeta Personal (Debbi) - Reembolsable</option>
                   </select>
                </div>

                <div className="pt-3">
                  <button type="button" className="w-full bg-[#21242E] text-white font-bold uppercase tracking-widest text-[10px] py-3.5 rounded-xl hover:bg-black transition-all shadow-md">
                    Guardar en el Libro
                  </button>
                </div>
              </form>
            </div>

            {/* TABLA DE MOVIMIENTOS */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 overflow-hidden flex flex-col">
              <h2 className="text-[11px] font-bold text-[#B94A36] uppercase tracking-widest border-b border-neutral-100 pb-3 mb-4">Estado de Cuenta / Movimientos</h2>
              
              <div className="overflow-auto custom-scrollbar flex-1 -mx-2 px-2">
                <table className="w-full text-left text-[11px] whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-neutral-200 text-neutral-400 uppercase tracking-wider">
                      <th className="py-3 px-2 font-semibold">Fecha</th>
                      <th className="py-3 px-2 font-semibold">Caja</th>
                      <th className="py-3 px-2 font-semibold">Detalle y Concepto</th>
                      <th className="py-3 px-2 font-semibold text-center">Estado Legal</th>
                      <th className="py-3 px-2 font-semibold text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {movimientosManuales.map(mov => (
                      <tr key={mov.id} className="hover:bg-neutral-50">
                        <td className="py-3 px-2 font-mono text-neutral-500">{new Date(mov.fecha).toLocaleDateString('es-ES')}</td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${mov.entidad === 'Arienzo' ? 'bg-[#D1C292]/20 text-[#8A7A55]' : 'bg-neutral-100 text-[#21242E]'}`}>
                            {mov.entidad}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <p className="font-bold text-[#415364] truncate max-w-[200px]" title={mov.detalle}>{mov.detalle}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[8px] uppercase font-bold text-neutral-400">{mov.categoria}</span>
                            {mov.pagado_por.includes('Personal') && (
                              <span className="text-[8px] bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded uppercase font-bold">
                                Pagado Socio
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center">
                           <span className="text-[9px] text-neutral-500 uppercase tracking-wider">{mov.estado}</span>
                        </td>
                        <td className={`py-3 px-2 text-right font-mono font-bold ${mov.tipo === 'Ingreso' ? 'text-emerald-600' : 'text-[#ea0029]'}`}>
                          {mov.tipo === 'Ingreso' ? '+' : '-'}${mov.monto.toLocaleString('en-US', {minimumFractionDigits: 2})}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* HERRAMIENTA 3: INVERSIONES POR HACER (PRESUPUESTO) */}
        {activeTab === 'presupuesto' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
            
            {/* FORMULARIO DE INVERSIONES FUTURAS */}
            <div className="lg:col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 h-fit sticky top-6">
              <h2 className="text-[11px] font-bold text-[#B94A36] uppercase tracking-widest border-b border-neutral-100 pb-3 mb-5">Planificar Inversión o Gasto</h2>
              
              <form className="space-y-4">
                <div>
                  <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Categoría del Gasto</label>
                  <select value={presupuestoForm.categoria} onChange={e => setPresupuestoForm({...presupuestoForm, categoria: e.target.value})} className="w-full text-xs font-bold p-2.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none text-[#21242E]">
                    <option>Honorarios y Servicios</option>
                    <option>Trámites Municipales</option>
                    <option>Marketing y Ventas</option>
                    <option>Estudios Técnicos</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">¿Qué necesitamos pagar a futuro?</label>
                  <input type="text" value={presupuestoForm.detalle} onChange={e => setPresupuestoForm({...presupuestoForm, detalle: e.target.value})} className="w-full text-xs font-medium p-2.5 rounded-lg border border-neutral-200 bg-white outline-none focus:border-[#B94A36]" placeholder="Ej. Aprobación Planos Municipio" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Monto Proyectado</label>
                    <input type="number" value={presupuestoForm.monto_proyectado} onChange={e => setPresupuestoForm({...presupuestoForm, monto_proyectado: e.target.value})} className="w-full text-sm font-mono font-bold p-2.5 rounded-lg border border-neutral-200 bg-white outline-none focus:border-[#B94A36] text-[#B94A36]" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">¿Para cuándo?</label>
                    <input type="month" value={presupuestoForm.fecha_estimada} onChange={e => setPresupuestoForm({...presupuestoForm, fecha_estimada: e.target.value})} className="w-full text-xs font-medium p-2.5 rounded-lg border border-neutral-200 bg-white outline-none" />
                  </div>
                </div>

                <div className="pt-3">
                  <button type="button" className="w-full bg-[#B94A36] text-white font-bold uppercase tracking-widest text-[10px] py-3.5 rounded-xl hover:bg-[#9a3d2c] transition-all shadow-md">
                    Agregar a Proyección
                  </button>
                </div>
              </form>
            </div>

            {/* TABLA DE PROYECCIONES */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 overflow-hidden flex flex-col">
              <div className="flex justify-between items-center border-b border-neutral-100 pb-3 mb-4">
                <h2 className="text-[11px] font-bold text-[#415364] uppercase tracking-widest">Inversiones Pendientes por Hacer</h2>
                <span className="text-[11px] font-mono font-bold text-[#B94A36]">Total Proyectado: ${totalInversionesProyectadas.toLocaleString()}</span>
              </div>
              
              <div className="overflow-auto custom-scrollbar flex-1 -mx-2 px-2">
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
                        <td className="py-4 px-2 text-center text-neutral-500 font-medium">{inv.fecha_estimada}</td>
                        <td className="py-4 px-2 text-right font-mono font-bold text-[#B94A36]">
                          ${inv.proyectado.toLocaleString('en-US', {minimumFractionDigits: 2})}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}