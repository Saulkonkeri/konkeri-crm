'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function FinanzasDashboardPage() {
  const [activeTab, setActiveTab] = useState<'resumen' | 'tesoreria' | 'presupuesto' | 'intercompania'>('resumen');
  
  const [mesProyeccion, setMesProyeccion] = useState('2026-12');
  const [cargando, setCargando] = useState(true);

  // ================= ESTADOS DE DATOS =================
  const [editandoMovId, setEditandoMovId] = useState<string | null>(null);
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [inversionesPorHacer, setInversionesPorHacer] = useState<any[]>([]);
  const [unidadesVendidas, setUnidadesVendidas] = useState<any[]>([]);
  
  const [saldoBancarioReal, setSaldoBancarioReal] = useState<string>('');

  const [metricas, setMetricas] = useState({
    cajaTotal: 0,
    ingresosCapital: 0,
    ingresosVentas: 0,
    egresosObra: 0,
    egresosComerciales: 0,
    cuentasPorCobrarCRM: 0, 
    inversionProyectada: 0,
    serviciosDevengados: 0, 
    anticiposOperativos: 0
  });

  // ================= FORMULARIO UNIFICADO =================
  const [movForm, setMovForm] = useState({
    fecha_transaccion: new Date().toISOString().split('T')[0],
    cuenta_bancaria: 'Cta. Arienzo S.A.S.',
    tipo: 'Ingreso',
    categoria: 'Aporte de Socios / Capital',
    descripcion: '',
    monto: '',
    estado_comprobante: 'Recibo Interno',
    comision_unidad: '',
    comision_total: '',
    comision_porcentaje: '100'
  });

  const [proyeccionForm, setProyeccionForm] = useState({
    categoria: 'Trámites y Permisos',
    detalle: '',
    monto_estimado: '',
    fecha_estimada: ''
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
      
      // 🎯 CONEXIÓN MAESTRO-FINANCIERA: Lee estrictamente las ventas oficiales del CRM
      const { data: ventas } = await supabase.from('cotizaciones').select('*').eq('estado', 'Venta - En Cierre'); 

      const movsData = movs || [];
      const presData = pres || [];
      const ventasData = ventas || [];

      setMovimientos(movsData);
      setInversionesPorHacer(presData);
      setUnidadesVendidas(ventasData);

      let inCapital = 0, inVentas = 0;
      let egObra = 0, egComercial = 0, anticipos = 0;

      movsData.forEach(m => {
        const monto = Number(m.monto);
        if (m.tipo === 'Ingreso') {
          if (m.categoria.includes('Capital') || m.categoria.includes('Socios')) inCapital += monto;
          else inVentas += monto;
        }
        if (m.tipo === 'Egreso') {
          if (m.categoria.includes('Obra') || m.categoria.includes('Permisos')) egObra += monto;
          else if (m.categoria.includes('Anticipo Operativo')) anticipos += monto;
          else egComercial += monto;
        }
      });

      const cajaReal = (inCapital + inVentas) - (egObra + egComercial + anticipos);
      const totalInvProy = presData.filter(p => p.fecha_estimada <= mesProyeccion).reduce((acc, curr) => acc + Number(curr.monto_estimado), 0);
      
      // Sumatoria real basada en las ventas en firme registradas
      const totalVentasCerradas = ventasData.reduce((acc, curr) => acc + Number(curr.precio_total || curr.precio_final || 0), 0);
      
      setMetricas({
        cajaTotal: cajaReal,
        ingresosCapital: inCapital,
        ingresosVentas: inVentas,
        egresosObra: egObra,
        egresosComerciales: egComercial,
        cuentasPorCobrarCRM: totalVentasCerradas * 0.40, // 40% pendiente estimado de obra
        inversionProyectada: totalInvProy,
        serviciosDevengados: totalVentasCerradas * 0.04, // 4% comisión Konkeri sobre ventas reales
        anticiposOperativos: anticipos
      });

      if (ventasData.length > 0 && !movForm.comision_unidad) {
        setMovForm(prev => ({ ...prev, comision_unidad: ventasData[0].unidad_numero || 'Dpto' }));
      }
    } catch (error) {
      console.error("Error cargando finanzas:", error);
    } finally {
      setCargando(false);
    }
  };

  const esModoComision = movForm.cuenta_bancaria === 'Cta. Konkeri S.A.S.' && movForm.tipo === 'Ingreso' && movForm.categoria === 'Cobro de Comisiones (Ventas)';

  const handleComisionChange = (field: string, value: string) => {
    const updated = { ...movForm, [field]: value };
    if (field === 'comision_total' || field === 'comision_porcentaje' || field === 'comision_unidad') {
      const total = field === 'comision_total' ? Number(value) : Number(updated.comision_total);
      const pct = field === 'comision_porcentaje' ? Number(value) : Number(updated.comision_porcentaje);
      const montoCalculado = (total * pct) / 100;
      updated.monto = montoCalculado > 0 ? montoCalculado.toString() : '';
      if (total > 0) updated.descripcion = `Comisión (${pct}% de $${total}) - ${updated.comision_unidad}`;
    }
    setMovForm(updated);
  };

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
      
      setMovForm({ ...movForm, descripcion: '', monto: '', comision_total: '' });
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
      estado_comprobante: mov.estado_facturacion || 'Recibo Interno',
      comision_unidad: '', comision_total: '', comision_porcentaje: '100'
    });
    setEditandoMovId(mov.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const eliminarMovimiento = async (id: string) => {
    if (!window.confirm("¿Confirma la eliminación? Esto recalculará los saldos.")) return;
    try {
      await supabase.from('finanzas_movimientos').delete().eq('id', id);
      cargarDatos();
    } catch (err) {
      alert("Error al eliminar.");
    }
  };

  if (cargando) return <div className="flex items-center justify-center min-h-screen"><div className="text-sm font-bold text-[#415364] uppercase tracking-widest animate-pulse">Estructurando Finanzas...</div></div>;

  const liquidezProyectada = metricas.cajaTotal + metricas.cuentasPorCobrarCRM - metricas.inversionProyectada;
  const bancoReal = Number(saldoBancarioReal) || 0;
  const diferenciaConciliacion = bancoReal - metricas.cajaTotal;

  return (
    <div className="min-h-screen bg-[#F9F7F5] p-4 md:p-8 font-sans text-[#415364]">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* CABECERA */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center border-b border-neutral-200 pb-6 gap-4">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-[#B94A36] uppercase block">Módulo Financiero Integrado</span>
            <h1 className="text-3xl font-bold tracking-tight text-[#21242E] mt-1">Centro de Control de Capital</h1>
          </div>

          <div className="flex bg-white p-1.5 rounded-xl border border-neutral-200 shadow-sm gap-1 overflow-x-auto w-full lg:w-auto">
            <button onClick={() => setActiveTab('resumen')} className={`px-4 py-2.5 text-[11px] font-bold tracking-wider uppercase rounded-lg transition-all whitespace-nowrap ${activeTab === 'resumen' ? 'bg-[#21242E] text-white shadow-md' : 'text-[#415364]/70 hover:bg-neutral-50'}`}>Dashboard Gerencial</button>
            <button onClick={() => setActiveTab('tesoreria')} className={`px-4 py-2.5 text-[11px] font-bold tracking-wider uppercase rounded-lg transition-all whitespace-nowrap ${activeTab === 'tesoreria' ? 'bg-[#21242E] text-white shadow-md' : 'text-[#415364]/70 hover:bg-neutral-50'}`}>Tesorería y Caja</button>
            <button onClick={() => setActiveTab('presupuesto')} className={`px-4 py-2.5 text-[11px] font-bold tracking-wider uppercase rounded-lg transition-all whitespace-nowrap ${activeTab === 'presupuesto' ? 'bg-[#21242E] text-white shadow-md' : 'text-[#415364]/70 hover:bg-neutral-50'}`}>Presupuestos</button>
            <button onClick={() => setActiveTab('intercompania')} className={`px-4 py-2.5 text-[11px] font-bold tracking-wider uppercase rounded-lg transition-all whitespace-nowrap ${activeTab === 'intercompania' ? 'bg-white border border-neutral-300 text-[#21242E] shadow-sm' : 'text-neutral-500 hover:bg-white'}`}>Cuentas Intercompañía</button>
          </div>
        </div>

        {/* PESTAÑA 1: DASHBOARD GERENCIAL */}
        {activeTab === 'resumen' && (
          <div className="space-y-6 animate-in fade-in max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-200 flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-2">Efectivo Total en Cuentas (Caja)</span>
                  <span className="text-4xl font-mono font-bold text-[#21242E]">${metricas.cajaTotal.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
               </div>
               
               <div className="bg-[#21242E] p-8 rounded-2xl shadow-lg border border-neutral-800 flex flex-col justify-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#D1C292] opacity-10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                  <div className="flex justify-between items-center mb-2 relative z-10">
                    <span className="text-[10px] font-bold text-[#D1C292] uppercase tracking-widest block">Flujo de Liquidez Proyectada</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold text-neutral-400 uppercase">Proyectar a:</span>
                      <input type="month" value={mesProyeccion} onChange={e => setMesProyeccion(e.target.value)} className="text-[10px] font-bold text-white border border-neutral-600 rounded p-1.5 outline-none bg-neutral-800" />
                    </div>
                  </div>
                  <span className="text-4xl font-mono font-bold text-white relative z-10">${liquidezProyectada.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
                <div className="bg-neutral-50 p-4 border-b border-neutral-200"><h2 className="text-[11px] font-bold text-[#415364] uppercase tracking-widest">Origen y Uso de Fondos (Histórico)</h2></div>
                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-3">Fuentes (Ingresos)</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs"><span className="text-neutral-600">Aportes y Capital Propio</span><span className="font-mono font-bold text-emerald-600">${metricas.ingresosCapital.toLocaleString()}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-neutral-600">Preventas y Reservas</span><span className="font-mono font-bold text-emerald-600">${metricas.ingresosVentas.toLocaleString()}</span></div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-3">Aplicaciones (Egresos)</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs"><span className="text-neutral-600">CAPEX (Obra, Suelos, Permisos)</span><span className="font-mono font-bold text-[#ea0029]">-${metricas.egresosObra.toLocaleString()}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-neutral-600">OPEX (Comercial, Anticipos)</span><span className="font-mono font-bold text-[#ea0029]">-${(metricas.egresosComerciales + metricas.anticiposOperativos).toLocaleString()}</span></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
                <div className="bg-sky-50 p-4 border-b border-sky-100"><h2 className="text-[11px] font-bold text-sky-900 uppercase tracking-widest">Pipeline Financiero (Basado en Ventas en Firme)</h2></div>
                <div className="p-6 space-y-4">
                  <div className="p-4 border border-neutral-100 rounded-xl bg-neutral-50 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-bold text-neutral-500 uppercase block">Cuentas por Cobrar (Ventas Oficiales)</span>
                      <span className="text-[9px] text-neutral-400">Calculado de unidades en 'Venta - En Cierre'</span>
                    </div>
                    <span className="text-lg font-mono font-bold text-sky-600">${metricas.cuentasPorCobrarCRM.toLocaleString()}</span>
                  </div>
                  <div className="p-4 border border-neutral-100 rounded-xl bg-neutral-50 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-bold text-neutral-500 uppercase block">Obligaciones (Presupuesto)</span>
                      <span className="text-[9px] text-neutral-400">Inversiones planificadas hasta {mesProyeccion}</span>
                    </div>
                    <span className="text-lg font-mono font-bold text-amber-600">-${metricas.inversionProyectada.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 2: TESORERÍA */}
        {activeTab === 'tesoreria' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
                <h2 className="text-[11px] font-bold text-[#21242E] uppercase tracking-widest border-b border-neutral-100 pb-3 mb-4 flex justify-between items-center">
                  <span>Auditor de Caja</span><span>⚖️</span>
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Saldo Real en Bancos Hoy:</label>
                    <input type="number" value={saldoBancarioReal} onChange={e => setSaldoBancarioReal(e.target.value)} className="w-full text-xl font-mono font-bold p-3 rounded-lg border border-neutral-300 bg-neutral-50 outline-none" placeholder="0.00" />
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold text-neutral-500 uppercase">Saldo en Sistema:</span>
                    <span className="font-mono font-bold text-[#415364]">${metricas.cajaTotal.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className={`p-4 rounded-xl border ${saldoBancarioReal === '' ? 'bg-neutral-50 border-neutral-200' : diferenciaConciliacion === 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                    <span className="text-[9px] font-bold uppercase tracking-widest block mb-1 text-neutral-500">Diferencia a Justificar:</span>
                    <span className={`text-2xl font-mono font-bold ${saldoBancarioReal === '' ? 'text-neutral-400' : diferenciaConciliacion === 0 ? 'text-emerald-600' : 'text-[#ea0029]'}`}>
                      ${Math.abs(diferenciaConciliacion).toLocaleString('en-US', {minimumFractionDigits: 2})}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
                <h2 className="text-[11px] font-bold text-[#21242E] uppercase tracking-widest border-b border-neutral-100 pb-3 mb-5">
                  {editandoMovId ? 'Editar Registro' : 'Registrar Movimiento'}
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
                      <select value={movForm.tipo} onChange={e => setMovForm({...movForm, tipo: e.target.value})} className="w-full text-xs font-bold p-2.5 rounded-lg border outline-none">
                        <option value="Ingreso">INGRESO (+)</option>
                        <option value="Egreso">EGRESO (-)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Estado Factura</label>
                      <select value={movForm.estado_comprobante} onChange={e => setMovForm({...movForm, estado_comprobante: e.target.value})} className="w-full text-[10px] font-bold p-2.5 rounded-lg border outline-none">
                        <option>Recibo Interno</option>
                        <option>Facturado SRI</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Categoría</label>
                    <select value={movForm.categoria} onChange={e => setMovForm({...movForm, categoria: e.target.value})} className="w-full text-xs font-medium p-2.5 rounded-lg border border-neutral-200 bg-white outline-none">
                      {movForm.tipo === 'Ingreso' ? (
                        <>
                          <option>Aporte de Socios / Capital</option>
                          <option>Reserva Manual (Sin contrato)</option>
                          {movForm.cuenta_bancaria === 'Cta. Konkeri S.A.S.' && <option>Cobro de Comisiones (Ventas)</option>}
                          <option>Saldo Inicial de Cuenta</option>
                        </>
                      ) : (
                        <>
                          <option>Costos Comerciales (Marketing, Renders)</option>
                          <option>Anticipo Operativo (Konkeri)</option>
                          <option>Inversión Obra / Permisos Municipales</option>
                        </>
                      )}
                    </select>
                  </div>

                  {esModoComision ? (
                    <div className="bg-[#D1C292]/10 border border-[#D1C292]/30 p-4 rounded-xl space-y-4">
                      <h3 className="text-[10px] font-bold text-[#8A7A55] uppercase tracking-widest">Estructura de Comisión</h3>
                      <div>
                        <label className="text-[9px] font-bold text-[#8A7A55] uppercase block mb-1">Unidad / Venta</label>
                        <select value={movForm.comision_unidad} onChange={e => handleComisionChange('comision_unidad', e.target.value)} className="w-full text-xs font-bold p-2 rounded border border-[#D1C292]/40 bg-white outline-none">
                          {unidadesVendidas.map(u => <option key={u.id} value={u.unidad_numero}>Dpto {u.unidad_numero}</option>)}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] font-bold text-[#8A7A55] uppercase block mb-1">Total ($)</label>
                          <input type="number" value={movForm.comision_total} onChange={e => handleComisionChange('comision_total', e.target.value)} className="w-full text-sm font-mono font-bold p-2 rounded border bg-white" placeholder="Ej. 4000" />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-[#8A7A55] uppercase block mb-1">% Hoy</label>
                          <input type="number" value={movForm.comision_porcentaje} onChange={e => handleComisionChange('comision_porcentaje', e.target.value)} className="w-full text-sm font-mono font-bold p-2 rounded border bg-white" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Detalle</label>
                      <input type="text" required value={movForm.descripcion} onChange={e => setMovForm({...movForm, descripcion: e.target.value})} className="w-full text-xs p-2.5 rounded-lg border outline-none" placeholder="Ej. Pago Municipio" />
                    </div>
                  )}

                  <div>
                    <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Monto ($)</label>
                    <input type="number" step="0.01" required value={movForm.monto} onChange={e => setMovForm({...movForm, monto: e.target.value})} readOnly={esModoComision} className="w-full text-xl font-mono font-bold p-2.5 rounded-lg border outline-none bg-white" placeholder="0.00" />
                  </div>

                  <button type="submit" className="w-full bg-[#21242E] text-white font-bold uppercase tracking-widest text-[10px] py-3.5 rounded-xl">Guardar en Libro</button>
                </form>
              </div>
            </div>
            
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
                         <td className="py-3 px-2"><span className="font-bold text-[#415364] text-[10px]">{mov.entidad}</span></td>
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

        {/* PESTAÑA 3: PRESUPUESTO */}
        {activeTab === 'presupuesto' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
            <div className="lg:col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 h-fit sticky top-6">
              <h2 className="text-[11px] font-bold text-[#21242E] uppercase tracking-widest border-b border-neutral-100 pb-3 mb-5">Planificar Obligación Futura</h2>
              <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!proyeccionForm.monto_estimado) return;
                  await supabase.from('finanzas_presupuestos').insert([{ ...proyeccionForm, monto_estimado: Number(proyeccionForm.monto_estimado) }]);
                  setProyeccionForm({ categoria: 'Trámites y Permisos', detalle: '', monto_estimado: '', fecha_estimada: '' });
                  cargarDatos();
              }} className="space-y-4">
                <div>
                  <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Categoría</label>
                  <select value={proyeccionForm.categoria} onChange={e => setProyeccionForm({...proyeccionForm, categoria: e.target.value})} className="w-full text-xs font-bold p-2.5 rounded-lg border outline-none">
                    <option>Trámites y Permisos</option>
                    <option>Costos de Obra</option>
                    <option>Marketing y Ventas</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Detalle</label>
                  <input type="text" required value={proyeccionForm.detalle} onChange={e => setProyeccionForm({...proyeccionForm, detalle: e.target.value})} className="w-full text-xs p-2.5 rounded-lg border outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Monto ($)</label>
                    <input type="number" step="0.01" required value={proyeccionForm.monto_estimado} onChange={e => setProyeccionForm({...proyeccionForm, monto_estimado: e.target.value})} className="w-full text-sm font-mono font-bold p-2.5 rounded-lg border outline-none" />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Mes Est.</label>
                    <input type="month" required value={proyeccionForm.fecha_estimada} onChange={e => setProyeccionForm({...proyeccionForm, fecha_estimada: e.target.value})} className="w-full text-xs p-2.5 rounded-lg border outline-none" />
                  </div>
                </div>
                <button type="submit" className="w-full bg-[#B94A36] text-white font-bold uppercase text-[10px] py-3.5 rounded-xl">Agregar al Presupuesto</button>
              </form>
            </div>
            
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 flex flex-col">
               <h2 className="text-[11px] font-bold text-[#415364] uppercase tracking-widest border-b border-neutral-100 pb-3 mb-4">Presupuesto Registrado</h2>
               <div className="overflow-auto custom-scrollbar flex-1 -mx-2 px-2">
                 <table className="w-full text-left text-[11px] whitespace-nowrap">
                   <thead>
                     <tr className="border-b border-neutral-200 text-neutral-400 uppercase tracking-wider">
                       <th className="py-3 px-2 font-semibold">Detalle y Categoría</th>
                       <th className="py-3 px-2 font-semibold text-center">Mes Estimado</th>
                       <th className="py-3 px-2 font-semibold text-right">Valor</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-neutral-100">
                     {inversionesPorHacer.map(inv => (
                       <tr key={inv.id} className="hover:bg-neutral-50">
                         <td className="py-4 px-2"><p className="font-bold text-[#21242E]">{inv.detalle}</p><p className="text-[9px] text-neutral-500 uppercase">{inv.categoria}</p></td>
                         <td className="py-4 px-2 text-center text-neutral-500 font-medium">{inv.fecha_estimada}</td>
                         <td className="py-4 px-2 text-right font-mono font-bold text-[#B94A36]">${Number(inv.monto_estimado).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 4: CONCILIACIÓN INTERCOMPAÑÍA */}
        {activeTab === 'intercompania' && (
          <div className="space-y-6 animate-in fade-in max-w-5xl mx-auto">
            <div className="bg-white p-8 rounded-2xl border border-neutral-200 shadow-sm">
               <div className="mb-8 border-b border-neutral-100 pb-6">
                 <h2 className="text-xl font-bold text-[#21242E] mb-2">Reporte Intercompañía: Arienzo vs Konkeri</h2>
                 <p className="text-xs text-neutral-500 max-w-3xl leading-relaxed text-justify">
                   Contrapone las comisiones devengadas (calculadas sobre las ventas en firme registradas en 'Venta - En Cierre') versus los giros realizados desde Tesorería bajo la categoría "Anticipo Operativo (Konkeri)".
                 </p>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="border border-neutral-200 p-6 rounded-xl bg-neutral-50">
                   <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest block mb-2">Comisiones Devengadas (CRM)</span>
                   <span className="text-3xl font-mono font-bold text-[#21242E]">${metricas.serviciosDevengados.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                   <p className="text-[10px] text-neutral-400 mt-3 uppercase font-bold">4% sobre ventas en firme oficiales.</p>
                 </div>
                 <div className="border border-neutral-200 p-6 rounded-xl bg-neutral-50">
                   <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest block mb-2">(-) Anticipos Girados (Caja)</span>
                   <span className="text-3xl font-mono font-bold text-[#ea0029]">-${metricas.anticiposOperativos.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                   <p className="text-[10px] text-neutral-400 mt-3 uppercase font-bold">Fondos transferidos a Konkeri.</p>
                 </div>
                 <div className="border border-neutral-300 p-6 rounded-xl bg-white shadow-sm">
                   <span className="text-[10px] text-[#415364] font-bold uppercase tracking-widest block mb-2">(=) Saldo Intercompañía a Favor</span>
                   <span className="text-3xl font-mono font-bold text-[#415364]">${(metricas.serviciosDevengados - metricas.anticiposOperativos).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                   <p className="text-[10px] text-[#415364]/70 mt-3 uppercase font-bold">Deuda pendiente de liquidación.</p>
                 </div>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}