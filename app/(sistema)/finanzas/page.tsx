'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function FinanzasDashboardPage() {
  const [activeTab, setActiveTab] = useState<'resumen' | 'tesoreria' | 'presupuesto' | 'intercompania'>('tesoreria');
  
  const [mesProyeccion, setMesProyeccion] = useState('2026-12');
  const [cargando, setCargando] = useState(true);

  // ================= ESTADOS DE DATOS =================
  const [editandoMovId, setEditandoMovId] = useState<string | null>(null);
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [inversionesPorHacer, setInversionesPorHacer] = useState<any[]>([]);
  
  // Estado para la Conciliación Manual de Caja
  const [saldoBancarioReal, setSaldoBancarioReal] = useState<string>('');

  const [metricas, setMetricas] = useState({
    cajaTotal: 0,
    totalIngresos: 0,
    totalEgresos: 0,
    cuentasPorCobrarCRM: 0, 
    inversionProyectada: 0,
    serviciosDevengados: 0, 
    anticiposOperativos: 0
  });

  // ================= FORMULARIOS =================
  const [movForm, setMovForm] = useState({
    fecha_transaccion: new Date().toISOString().split('T')[0],
    cuenta_bancaria: 'Cta. Arienzo S.A.S.',
    tipo: 'Egreso',
    categoria: 'Costos Comerciales (Marketing, Renders)',
    descripcion: '',
    monto: '',
    estado_comprobante: 'Recibo Interno'
  });

  // ================= CEREBRO FINANCIERO =================
  useEffect(() => {
    cargarDatos();
  }, [mesProyeccion]);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const { data: movs } = await supabase.from('finanzas_movimientos').select('*').order('fecha_transaccion', { ascending: false });
      const { data: pres } = await supabase.from('finanzas_presupuestos').select('*').order('fecha_estimada', { ascending: true });
      const { data: ventas } = await supabase.from('cotizaciones').select('*').eq('estado', 'Ganada'); 

      const movsData = movs || [];
      const presData = pres || [];
      const ventasData = ventas || [];

      setMovimientos(movsData);
      setInversionesPorHacer(presData);

      let ingresos = 0;
      let egresos = 0;
      let anticiposIntercompania = 0;

      movsData.forEach(m => {
        const monto = Number(m.monto);
        if (m.tipo === 'Ingreso') ingresos += monto;
        if (m.tipo === 'Egreso') {
          egresos += monto;
          if (m.categoria.includes('Anticipo Operativo (Konkeri)')) anticiposIntercompania += monto;
        }
      });

      const cajaReal = ingresos - egresos;
      
      const totalInvProy = presData
        .filter(p => p.fecha_estimada <= mesProyeccion)
        .reduce((acc, curr) => acc + Number(curr.monto_estimado), 0);
        
      const totalVentasCerradas = ventasData.reduce((acc, curr) => acc + Number(curr.precio_final || 0), 0);
      
      setMetricas({
        cajaTotal: cajaReal,
        totalIngresos: ingresos,
        totalEgresos: egresos,
        cuentasPorCobrarCRM: totalVentasCerradas * 0.40,
        inversionProyectada: totalInvProy,
        serviciosDevengados: totalVentasCerradas * 0.04,
        anticiposOperativos: anticiposIntercompania
      });

    } catch (error) {
      console.error("Error cargando finanzas:", error);
    } finally {
      setCargando(false);
    }
  };

  // ================= GUARDAR Y EDITAR =================
  const registrarMovimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movForm.monto || Number(movForm.monto) <= 0) return alert("Ingrese un monto válido.");
    
    try {
      const datosAGuardar = {
        fecha_transaccion: movForm.fecha_transaccion,
        entidad: movForm.cuenta_bancaria,
        tipo: movForm.tipo,
        categoria: movForm.categoria,
        descripcion: movForm.descripcion,
        monto: Number(movForm.monto),
        estado_facturacion: movForm.estado_comprobante
      };

      if (editandoMovId) {
        await supabase.from('finanzas_movimientos').update(datosAGuardar).eq('id', editandoMovId);
        setEditandoMovId(null);
      } else {
        await supabase.from('finanzas_movimientos').insert([datosAGuardar]);
      }
      
      setMovForm({ ...movForm, descripcion: '', monto: '' });
      cargarDatos();
    } catch (err) {
      alert("Error al guardar en el servidor.");
    }
  };

  const cargarParaEditarMov = (mov: any) => {
    setMovForm({
      fecha_transaccion: mov.fecha_transaccion,
      cuenta_bancaria: mov.entidad,
      tipo: mov.tipo,
      categoria: mov.categoria,
      descripcion: mov.descripcion,
      monto: mov.monto.toString(),
      estado_comprobante: mov.estado_facturacion || 'Recibo Interno'
    });
    setEditandoMovId(mov.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const eliminarMovimiento = async (id: string) => {
    if (!window.confirm("¿Confirma la eliminación de este registro? Afectará el saldo de caja.")) return;
    try {
      await supabase.from('finanzas_movimientos').delete().eq('id', id);
      cargarDatos();
    } catch (err) {
      alert("Error al eliminar.");
    }
  };

  if (cargando) return <div className="flex items-center justify-center min-h-screen"><div className="text-sm font-bold text-[#415364] uppercase tracking-widest animate-pulse">Cargando Módulo Financiero...</div></div>;

  const liquidezProyectada = metricas.cajaTotal + metricas.cuentasPorCobrarCRM - metricas.inversionProyectada;
  const saldoIntercompania = metricas.serviciosDevengados - metricas.anticiposOperativos;

  // Cálculos de Conciliación
  const bancoReal = Number(saldoBancarioReal) || 0;
  const diferenciaConciliacion = bancoReal - metricas.cajaTotal;

  return (
    <div className="min-h-screen bg-[#F9F7F5] p-4 md:p-8 font-sans text-[#415364]">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* ================= CABECERA ================= */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center border-b border-neutral-200 pb-6 gap-4">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-[#B94A36] uppercase block">Módulo Financiero</span>
            <h1 className="text-3xl font-bold tracking-tight text-[#21242E] mt-1">Control Gerencial</h1>
          </div>

          <div className="flex bg-white p-1.5 rounded-xl border border-neutral-200 shadow-sm gap-1 overflow-x-auto w-full lg:w-auto">
            <button onClick={() => setActiveTab('resumen')} className={`px-4 py-2.5 text-[11px] font-bold tracking-wider uppercase rounded-lg transition-all whitespace-nowrap ${activeTab === 'resumen' ? 'bg-[#21242E] text-white shadow-md' : 'text-[#415364]/70 hover:bg-neutral-50'}`}>
              Resumen (Dashboard)
            </button>
            <button onClick={() => setActiveTab('tesoreria')} className={`px-4 py-2.5 text-[11px] font-bold tracking-wider uppercase rounded-lg transition-all whitespace-nowrap ${activeTab === 'tesoreria' ? 'bg-[#21242E] text-white shadow-md' : 'text-[#415364]/70 hover:bg-neutral-50'}`}>
              Tesorería (Cuadre y Caja)
            </button>
            <button onClick={() => setActiveTab('intercompania')} className={`px-4 py-2.5 text-[11px] font-bold tracking-wider uppercase rounded-lg transition-all whitespace-nowrap ${activeTab === 'intercompania' ? 'bg-white border border-neutral-300 text-[#21242E] shadow-sm' : 'text-neutral-500 hover:bg-white'}`}>
              Conciliación Intercompañía
            </button>
          </div>
        </div>

        {/* ================= PESTAÑA: RESUMEN (DASHBOARD) ================= */}
        {activeTab === 'resumen' && (
          <div className="space-y-6 animate-in fade-in max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-200 flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-2">Efectivo Total (Libros)</span>
                  <span className="text-4xl font-mono font-bold text-[#21242E]">${metricas.cajaTotal.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                  <span className="text-[10px] text-neutral-400 uppercase mt-3 tracking-wider">Saldo validado en Tesorería</span>
               </div>
               
               <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-200 flex flex-col justify-center bg-gradient-to-br from-white to-slate-50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block">Liquidez Proyectada</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold text-neutral-400 uppercase">Corte al:</span>
                      <input type="month" value={mesProyeccion} onChange={e => setMesProyeccion(e.target.value)} className="text-[10px] font-bold text-[#21242E] border border-neutral-300 rounded p-1.5 outline-none bg-white shadow-sm" />
                    </div>
                  </div>
                  <span className="text-4xl font-mono font-bold text-[#21242E]">${liquidezProyectada.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                  <span className="text-[10px] text-neutral-400 uppercase mt-3 tracking-wider">Caja Actual + CxC CRM - Inversiones Presupuestadas</span>
               </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 text-center text-sm font-bold text-neutral-400 uppercase tracking-widest">
               Ve a la pestaña Tesorería para registrar movimientos o hacer tu cuadre de caja real.
            </div>
          </div>
        )}

        {/* ================= PESTAÑA: TESORERÍA (CON AUDITOR DE CAJA) ================= */}
        {activeTab === 'tesoreria' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
            
            {/* COLUMNA IZQUIERDA: AUDITOR DE CAJA Y FORMULARIO */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* WIDGET: AUDITOR / CUADRE DE CAJA */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
                <h2 className="text-[11px] font-bold text-[#21242E] uppercase tracking-widest border-b border-neutral-100 pb-3 mb-4 flex justify-between items-center">
                  <span>Auditor de Caja (Cuadre)</span>
                  <span className="text-[16px]">⚖️</span>
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">1. Ingresa el saldo real de tu app bancaria:</label>
                    <input 
                      type="number" 
                      value={saldoBancarioReal} 
                      onChange={e => setSaldoBancarioReal(e.target.value)} 
                      className="w-full text-xl font-mono font-bold p-3 rounded-lg border border-neutral-300 bg-neutral-50 outline-none text-[#21242E]" 
                      placeholder="0.00" 
                    />
                  </div>
                  
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold text-neutral-500 uppercase">2. Saldo en Libros (Sistema):</span>
                    <span className="font-mono font-bold text-[#415364]">${metricas.cajaTotal.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                  </div>

                  <div className={`p-4 rounded-xl border ${saldoBancarioReal === '' ? 'bg-neutral-50 border-neutral-200' : diferenciaConciliacion === 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                    <span className="text-[9px] font-bold uppercase tracking-widest block mb-1 text-neutral-500">Diferencia a Justificar:</span>
                    <span className={`text-2xl font-mono font-bold ${saldoBancarioReal === '' ? 'text-neutral-400' : diferenciaConciliacion === 0 ? 'text-emerald-600' : 'text-[#ea0029]'}`}>
                      ${Math.abs(diferenciaConciliacion).toLocaleString('en-US', {minimumFractionDigits: 2})}
                    </span>
                    
                    {saldoBancarioReal !== '' && diferenciaConciliacion > 0 && (
                      <p className="text-[9px] text-amber-700 mt-2 font-medium">Te falta registrar Ingresos (o registrar un "Saldo Inicial de Cuenta" en el formulario de abajo).</p>
                    )}
                    {saldoBancarioReal !== '' && diferenciaConciliacion < 0 && (
                      <p className="text-[9px] text-[#ea0029] mt-2 font-medium">Te falta justificar salidas. Debes registrar los Egresos correspondientes abajo para cuadrar la caja.</p>
                    )}
                    {saldoBancarioReal !== '' && diferenciaConciliacion === 0 && (
                      <p className="text-[9px] text-emerald-700 mt-2 font-bold uppercase tracking-widest">✅ Caja Cuadrada Perfectamente</p>
                    )}
                  </div>
                </div>
              </div>

              {/* FORMULARIO DE REGISTRO */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
                <h2 className="text-[11px] font-bold text-[#21242E] uppercase tracking-widest border-b border-neutral-100 pb-3 mb-5">
                  {editandoMovId ? 'Editar Registro' : 'Justificar Movimiento'}
                </h2>
                
                <form onSubmit={registrarMovimiento} className="space-y-4">
                  <div>
                    <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Cuenta Bancaria</label>
                    <select value={movForm.cuenta_bancaria} onChange={e => setMovForm({...movForm, cuenta_bancaria: e.target.value})} className="w-full text-xs font-bold p-2.5 rounded-lg border border-neutral-200 bg-white outline-none">
                      <option>Cta. Arienzo S.A.S.</option>
                      <option>Cta. Konkeri S.A.S.</option>
                      <option>Caja Chica (Efectivo)</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Tipo</label>
                      <select value={movForm.tipo} onChange={e => setMovForm({...movForm, tipo: e.target.value})} className="w-full text-xs font-bold p-2.5 rounded-lg border border-neutral-200 bg-white outline-none">
                        <option value="Ingreso">INGRESO (+)</option>
                        <option value="Egreso">EGRESO (-)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Soporte/Factura</label>
                      <select value={movForm.estado_comprobante} onChange={e => setMovForm({...movForm, estado_comprobante: e.target.value})} className="w-full text-[10px] font-bold p-2.5 rounded-lg border border-neutral-200 bg-white outline-none">
                        <option>Recibo Interno / Sin Factura</option>
                        <option>Facturado SRI</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Categoría</label>
                    <select value={movForm.categoria} onChange={e => setMovForm({...movForm, categoria: e.target.value})} className="w-full text-xs font-medium p-2.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none text-[#415364]">
                      {movForm.tipo === 'Ingreso' ? (
                        <>
                          <option>Saldo Inicial de Cuenta (Ajuste)</option>
                          <option>Reserva Manual (Cliente sin contrato)</option>
                          <option>Cobro Cuota Cliente (CRM)</option>
                          <option>Aporte de Socios</option>
                          <option>Reembolso / Otros</option>
                        </>
                      ) : (
                        <>
                          <option>Costos Comerciales (Marketing, Renders)</option>
                          <option>Anticipo Operativo (Konkeri)</option>
                          <option>Inversión Obra / Permisos Municipales</option>
                          <option>Pago a Proveedores y Legales</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Detalle del Movimiento</label>
                    <input type="text" required value={movForm.descripcion} onChange={e => setMovForm({...movForm, descripcion: e.target.value})} className="w-full text-xs font-medium p-2.5 rounded-lg border border-neutral-200 bg-white outline-none focus:border-[#415364]" placeholder="Ej. Reserva cliente Juan Pérez / Meta Ads" />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Monto ($)</label>
                    <input type="number" step="0.01" required value={movForm.monto} onChange={e => setMovForm({...movForm, monto: e.target.value})} className="w-full text-lg font-mono font-bold p-2.5 rounded-lg border border-neutral-200 bg-white outline-none focus:border-[#415364] text-[#21242E]" placeholder="0.00" />
                  </div>
                  <div className="pt-2 flex gap-2">
                    <button type="submit" className={`flex-1 text-white font-bold uppercase tracking-widest text-[10px] py-3.5 rounded-xl transition-all shadow-sm ${editandoMovId ? 'bg-neutral-800' : 'bg-[#21242E]'}`}>
                      {editandoMovId ? 'Actualizar' : 'Guardar'}
                    </button>
                    {editandoMovId && (
                      <button type="button" onClick={() => { setEditandoMovId(null); setMovForm({ ...movForm, descripcion: '', monto: '' }); }} className="px-4 bg-neutral-200 text-neutral-600 font-bold uppercase text-[10px] rounded-xl hover:bg-neutral-300">
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
            
            {/* COLUMNA DERECHA: TABLA DE TESORERÍA */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 flex flex-col">
               <h2 className="text-[11px] font-bold text-[#415364] uppercase tracking-widest border-b border-neutral-100 pb-3 mb-4">Libro de Entradas y Salidas</h2>
               <div className="overflow-auto custom-scrollbar flex-1 -mx-2 px-2">
                 <table className="w-full text-left text-[11px] whitespace-nowrap">
                   <thead>
                     <tr className="border-b border-neutral-200 text-neutral-400 uppercase tracking-wider">
                       <th className="py-3 px-2 font-semibold">Fecha</th>
                       <th className="py-3 px-2 font-semibold">Cuenta</th>
                       <th className="py-3 px-2 font-semibold">Categoría / Detalle</th>
                       <th className="py-3 px-2 font-semibold text-right">Monto</th>
                       <th className="py-3 px-2 font-semibold text-center">Acciones</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-neutral-100">
                     {movimientos.map(mov => (
                       <tr key={mov.id} className="hover:bg-neutral-50 group">
                         <td className="py-3 px-2 font-mono text-neutral-500">{new Date(mov.fecha_transaccion).toLocaleDateString('es-ES')}</td>
                         <td className="py-3 px-2">
                           <span className="font-bold text-[#415364] text-[10px]">{mov.entidad}</span>
                         </td>
                         <td className="py-3 px-2">
                           <p className="font-bold text-[#21242E]">{mov.categoria}</p>
                           <p className="text-[9px] text-neutral-500 truncate max-w-[200px]">{mov.descripcion}</p>
                         </td>
                         <td className={`py-3 px-2 text-right font-mono font-bold ${mov.tipo === 'Ingreso' ? 'text-emerald-600' : 'text-[#ea0029]'}`}>
                           {mov.tipo === 'Ingreso' ? '+' : '-'}${Number(mov.monto).toLocaleString('en-US', {minimumFractionDigits: 2})}
                         </td>
                         <td className="py-3 px-2 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                           <div className="flex justify-center gap-3">
                             <button onClick={() => cargarParaEditarMov(mov)} className="text-neutral-400 hover:text-[#415364]">✏️</button>
                             <button onClick={() => eliminarMovimiento(mov.id)} className="text-neutral-400 hover:text-[#ea0029]">🗑️</button>
                           </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>
        )}

        {/* ================= PESTAÑA 4: CONCILIACIÓN INTERCOMPAÑÍA ================= */}
        {activeTab === 'intercompania' && (
          <div className="space-y-6 animate-in fade-in max-w-5xl mx-auto">
            <div className="bg-white p-8 rounded-2xl border border-neutral-200 shadow-sm">
               <div className="mb-8 border-b border-neutral-100 pb-6">
                 <h2 className="text-xl font-bold text-[#21242E] mb-2">Conciliación de Cuentas: Arienzo S.A.S. & Konkeri S.A.S.</h2>
                 <p className="text-xs text-neutral-500 max-w-3xl leading-relaxed text-justify">
                   Reporte de validación interna. Contrapone los honorarios devengados (calculados automáticamente sobre las ventas en firme) versus los giros registrados en Tesorería bajo la categoría "Anticipos Operativos". Este saldo sustenta la relación comercial entre las partes previo a la emisión de facturación definitiva.
                 </p>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="border border-neutral-200 p-6 rounded-xl bg-neutral-50">
                   <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest block mb-2">Honorarios Devengados</span>
                   <span className="text-3xl font-mono font-bold text-[#21242E]">${metricas.serviciosDevengados.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                   <p className="text-[10px] text-neutral-400 mt-3 uppercase leading-relaxed font-bold">Provisión a favor de Konkeri.</p>
                 </div>
                 <div className="border border-neutral-200 p-6 rounded-xl bg-neutral-50">
                   <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest block mb-2">(-) Anticipos Girados</span>
                   <span className="text-3xl font-mono font-bold text-[#ea0029]">-${metricas.anticiposOperativos.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                   <p className="text-[10px] text-neutral-400 mt-3 uppercase leading-relaxed font-bold">Fondos transferidos a la operadora.</p>
                 </div>
                 <div className="border border-neutral-300 p-6 rounded-xl bg-white shadow-sm">
                   <span className="text-[10px] text-[#415364] font-bold uppercase tracking-widest block mb-2">(=) Saldo Intercompañía</span>
                   <span className="text-3xl font-mono font-bold text-[#415364]">${saldoIntercompania.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                   <p className="text-[10px] text-[#415364]/70 mt-3 uppercase font-bold leading-relaxed">Deuda pendiente de liquidación.</p>
                 </div>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}