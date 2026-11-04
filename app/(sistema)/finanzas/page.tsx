'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function FinanzasDashboardPage() {
  const [activeTab, setActiveTab] = useState<'resumen' | 'movimientos' | 'intercompania' | 'proyeccion'>('intercompania');
  const [fechaCorte, setFechaCorte] = useState('2026-12');
  const [cargando, setCargando] = useState(true);

  // ================= ESTADOS DE EDICIÓN =================
  const [editandoMovId, setEditandoMovId] = useState<string | null>(null);
  const [editandoPresId, setEditandoPresId] = useState<string | null>(null);

  // ================= ESTADOS DE DATOS REALES =================
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [inversionesPorHacer, setInversionesPorHacer] = useState<any[]>([]);
  const [unidadesVendidas, setUnidadesVendidas] = useState<any[]>([]);
  
  const [metricas, setMetricas] = useState({
    cajaDisponible: 0,
    totalIngresos: 0,
    totalEgresosObra: 0,
    totalEgresosOperativos: 0,
    cuentasPorCobrar: 0, 
    totalInversionesProyectadas: 0,
    honorariosFacturables: 0, 
    anticiposEntregados: 0
  });

  // ================= FORMULARIOS =================
  const [movForm, setMovForm] = useState({
    fecha_transaccion: new Date().toISOString().split('T')[0],
    entidad: 'Konkeri S.A.S.',
    tipo: 'Ingreso',
    categoria: 'Cobro de Comisiones (Ventas)',
    descripcion: '',
    monto: '',
    metodo_pago: 'Transferencia Bancaria',
    estado_facturacion: 'No Facturado',
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

  // ================= CEREBRO =================
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const { data: movs } = await supabase.from('finanzas_movimientos').select('*').order('fecha_transaccion', { ascending: false });
      const { data: pres } = await supabase.from('finanzas_presupuestos').select('*').order('fecha_estimada', { ascending: true });
      const { data: ventas } = await supabase.from('cotizaciones').select('*').eq('estado', 'Ganada'); 

      const movsData = movs || [];
      const presData = pres || [];
      const ventasData = (ventas && ventas.length > 0) ? ventas : [
        { id: '1', unidad: 'Dpto 601 (Prueba)', precio_final: 120000, cliente: 'Juan Pérez' },
        { id: '2', unidad: 'Dpto 604 (Prueba)', precio_final: 145000, cliente: 'María López' }
      ];

      setMovimientos(movsData);
      setInversionesPorHacer(presData);
      setUnidadesVendidas(ventasData);

      let ingresos = 0;
      let egresosObra = 0;
      let egresosOperativos = 0;
      let anticiposKonkeri = 0;

      movsData.forEach(m => {
        const monto = Number(m.monto);
        if (m.tipo === 'Ingreso') ingresos += monto;
        if (m.tipo === 'Egreso') {
          if (m.categoria.includes('Obra') || m.categoria.includes('Inversión')) egresosObra += monto;
          else if (m.categoria.includes('Anticipo Konkeri')) anticiposKonkeri += monto;
          else egresosOperativos += monto;
        }
      });

      const caja = ingresos - (egresosObra + egresosOperativos + anticiposKonkeri);
      const totalInvProy = presData.reduce((acc, curr) => acc + Number(curr.monto_estimado), 0);
      const totalVentasCerradas = ventasData.reduce((acc, curr) => acc + Number(curr.precio_final || 0), 0);
      
      setMetricas({
        cajaDisponible: caja,
        totalIngresos: ingresos,
        totalEgresosObra: egresosObra,
        totalEgresosOperativos: egresosOperativos + anticiposKonkeri,
        cuentasPorCobrar: totalVentasCerradas * 0.40,
        totalInversionesProyectadas: totalInvProy,
        honorariosFacturables: totalVentasCerradas * 0.04,
        anticiposEntregados: anticiposKonkeri
      });

      if (ventasData.length > 0 && !movForm.comision_unidad) {
        setMovForm(prev => ({ ...prev, comision_unidad: ventasData[0].unidad }));
      }

    } catch (error) {
      console.error("Error cargando finanzas:", error);
    } finally {
      setCargando(false);
    }
  };

  const esModoComision = movForm.entidad === 'Konkeri S.A.S.' && movForm.tipo === 'Ingreso' && movForm.categoria === 'Cobro de Comisiones (Ventas)';

  const handleComisionChange = (field: string, value: string) => {
    const updated = { ...movForm, [field]: value };
    if (field === 'comision_total' || field === 'comision_porcentaje' || field === 'comision_unidad') {
      const total = field === 'comision_total' ? Number(value) : Number(updated.comision_total);
      const pct = field === 'comision_porcentaje' ? Number(value) : Number(updated.comision_porcentaje);
      const montoCalculado = (total * pct) / 100;
      updated.monto = montoCalculado > 0 ? montoCalculado.toString() : '';
      if (total > 0) {
        updated.descripcion = `Cobro Comisión (${pct}% de $${total}) - Unidad: ${updated.comision_unidad}`;
      }
    }
    setMovForm(updated);
  };

  // ================= ACCIONES: GUARDAR, EDITAR, ELIMINAR =================
  
  // MOVIMIENTOS
  const registrarMovimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movForm.monto || Number(movForm.monto) <= 0) return alert("Ingrese un monto válido.");
    try {
      const datosAGuardar = {
        fecha_transaccion: movForm.fecha_transaccion,
        entidad: movForm.entidad,
        tipo: movForm.tipo,
        categoria: movForm.categoria,
        descripcion: movForm.descripcion,
        monto: Number(movForm.monto),
        metodo_pago: movForm.metodo_pago,
        estado_facturacion: movForm.estado_facturacion
      };

      if (editandoMovId) {
        await supabase.from('finanzas_movimientos').update(datosAGuardar).eq('id', editandoMovId);
        setEditandoMovId(null);
        alert("✅ Movimiento actualizado.");
      } else {
        await supabase.from('finanzas_movimientos').insert([datosAGuardar]);
        alert("✅ Movimiento registrado con éxito.");
      }
      
      setMovForm({ ...movForm, descripcion: '', monto: '', comision_total: '' });
      cargarDatos();
    } catch (err) {
      alert("❌ Error al guardar.");
    }
  };

  const cargarParaEditarMov = (mov: any) => {
    setMovForm({
      fecha_transaccion: mov.fecha_transaccion,
      entidad: mov.entidad,
      tipo: mov.tipo,
      categoria: mov.categoria,
      descripcion: mov.descripcion,
      monto: mov.monto.toString(),
      metodo_pago: mov.metodo_pago || 'Transferencia Bancaria',
      estado_facturacion: mov.estado_facturacion,
      comision_unidad: '', 
      comision_total: '', 
      comision_porcentaje: '100'
    });
    setEditandoMovId(mov.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const eliminarMovimiento = async (id: string) => {
    if (!window.confirm("⚠️ ¿Estás seguro de que deseas eliminar este movimiento? Esto recalculará tu caja.")) return;
    try {
      await supabase.from('finanzas_movimientos').delete().eq('id', id);
      cargarDatos();
    } catch (err) {
      alert("Error al eliminar.");
    }
  };

  // PRESUPUESTOS
  const registrarPresupuesto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proyeccionForm.monto_estimado) return;
    try {
      const datosAGuardar = { ...proyeccionForm, monto_estimado: Number(proyeccionForm.monto_estimado) };
      
      if (editandoPresId) {
        await supabase.from('finanzas_presupuestos').update(datosAGuardar).eq('id', editandoPresId);
        setEditandoPresId(null);
        alert("✅ Inversión actualizada.");
      } else {
        await supabase.from('finanzas_presupuestos').insert([datosAGuardar]);
        alert("✅ Inversión agregada.");
      }
      
      setProyeccionForm({ categoria: 'Trámites y Permisos', detalle: '', monto_estimado: '', fecha_estimada: '' });
      cargarDatos();
    } catch (err) {
      alert("❌ Error al guardar.");
    }
  };

  const cargarParaEditarPres = (pres: any) => {
    setProyeccionForm({
      categoria: pres.categoria,
      detalle: pres.detalle,
      monto_estimado: pres.monto_estimado.toString(),
      fecha_estimada: pres.fecha_estimada
    });
    setEditandoPresId(pres.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const eliminarPresupuesto = async (id: string) => {
    if (!window.confirm("⚠️ ¿Estás seguro de que deseas eliminar esta inversión del presupuesto?")) return;
    try {
      await supabase.from('finanzas_presupuestos').delete().eq('id', id);
      cargarDatos();
    } catch (err) {
      alert("Error al eliminar.");
    }
  };

  if (cargando) return <div className="flex items-center justify-center min-h-screen"><div className="p-8 text-center text-sm font-bold text-[#B94A36] uppercase tracking-widest animate-pulse">Cargando Plataforma Financiera...</div></div>;

  const liquidezProyectada = metricas.cajaDisponible + metricas.cuentasPorCobrar - metricas.totalInversionesProyectadas;
  const saldoPendienteLiquidacion = metricas.honorariosFacturables - metricas.anticiposEntregados;

  return (
    <div className="min-h-screen bg-[#F9F7F5] p-4 md:p-8 font-sans text-[#415364]">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* CABECERA */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center border-b border-neutral-200 pb-6 gap-4">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-[#B94A36] uppercase block">Dirección Financiera</span>
            <h1 className="text-3xl font-bold tracking-tight text-[#21242E] mt-1">Control de Operaciones</h1>
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
            <button onClick={() => setActiveTab('intercompania')} className={`px-4 py-2.5 text-[11px] font-bold tracking-wider uppercase rounded-lg transition-all whitespace-nowrap ${activeTab === 'intercompania' ? 'bg-[#B94A36] text-white shadow-md' : 'text-neutral-400 hover:bg-red-50 hover:text-[#B94A36]'}`}>
              Justificación Konkeri (Fiscal)
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PESTAÑA 4: JUSTIFICACIÓN KONKERI (EL ESCUDO FISCAL) */}
        {/* ========================================================================= */}
        {activeTab === 'intercompania' && (
          <div className="space-y-6 animate-in fade-in max-w-5xl mx-auto">
            
            <div className="bg-[#1a1c23] p-8 rounded-2xl border border-neutral-800 relative overflow-hidden shadow-2xl">
               <div className="absolute top-0 right-0 w-96 h-96 bg-[#ea0029] opacity-10 rounded-full blur-3xl -mr-20 -mt-20"></div>
               
               <div className="relative z-10 mb-8 border-b border-white/10 pb-6">
                 <h2 className="text-xl font-bold text-white mb-2">Conciliación de Comisiones y Anticipos</h2>
                 <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
                   Este reporte justifica legal y contablemente las salidas de dinero hacia Konkeri S.A.S. 
                   Ninguno de los valores actuales (ni lo devengado ni lo retirado) ha generado factura oficial aún. 
                   Konkeri opera con <strong>Anticipos No Facturados</strong> respaldados estrictamente por las ventas cerradas en el CRM.
                 </p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                 
                 <div className="bg-white/5 border border-white/10 p-6 rounded-xl relative">
                   <div className="absolute top-0 right-0 bg-emerald-500/20 text-emerald-400 text-[8px] font-bold px-2 py-1 rounded-bl-lg rounded-tr-xl uppercase">No Facturado</div>
                   <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest block mb-2">1. Fondo Ganado (4% CRM)</span>
                   <span className="text-4xl font-mono font-bold text-emerald-400">${metricas.honorariosFacturables.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                   <p className="text-[10px] text-neutral-500 mt-3 uppercase leading-relaxed">
                     Comisiones 100% justificadas por firmas de promesas. Quedan como provisión pendiente de factura.
                   </p>
                 </div>
                 
                 <div className="bg-white/5 border border-white/10 p-6 rounded-xl relative">
                   <div className="absolute top-0 right-0 bg-amber-500/20 text-amber-400 text-[8px] font-bold px-2 py-1 rounded-bl-lg rounded-tr-xl uppercase">Anticipo Operativo</div>
                   <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest block mb-2">2. (-) Retiros Ya Realizados</span>
                   <span className="text-4xl font-mono font-bold text-[#ea0029]">-${metricas.anticiposEntregados.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                   <p className="text-[10px] text-neutral-500 mt-3 uppercase leading-relaxed">
                     Fondos extraídos para operar. No son gastos al vacío, se restan directamente del fondo ganado.
                   </p>
                 </div>

                 <div className="bg-[#D1C292]/10 border border-[#D1C292]/20 p-6 rounded-xl relative">
                   <span className="text-[10px] text-[#D1C292] font-bold uppercase tracking-widest block mb-2">3. (=) Saldo A Favor Konkeri</span>
                   <span className="text-4xl font-mono font-bold text-[#D1C292]">${saldoPendienteLiquidacion.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                   <p className="text-[10px] text-[#D1C292]/60 mt-3 uppercase font-bold leading-relaxed">
                     Monto que Arienzo aún debe transferirle a Konkeri de lo ya devengado.
                   </p>
                 </div>

               </div>
               
               <div className="mt-6 bg-[#ea0029]/10 border border-[#ea0029]/20 p-4 rounded-xl text-justify relative z-10 flex gap-4 items-start">
                 <span className="text-2xl">⚖️</span>
                 <p className="text-[11px] text-[#ea0029] font-medium leading-relaxed">
                   <strong>Nota Fiscal:</strong> Para evitar el pago de IVA prematuro y descapitalizar el proyecto, Konkeri S.A.S. emitirá la factura global correspondiente a estos honorarios y anticipos únicamente cuando el desarrollo alcance su punto de equilibrio financiero y operativo. Mientras tanto, las cuentas cuadran como saldos intercompañía.
                 </p>
               </div>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PESTAÑA 1: RESUMEN EJECUTIVO */}
        {/* ========================================================================= */}
        {activeTab === 'resumen' && (
          <div className="space-y-6 animate-in fade-in max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-[#21242E] p-8 rounded-2xl shadow-lg border border-neutral-800 flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-[#D1C292] uppercase tracking-widest block mb-2">Liquidez Disponible (Caja Real)</span>
                  <span className="text-4xl font-mono font-bold text-white">${metricas.cajaDisponible.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
               </div>
               <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-200 flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block mb-2">Proyección de Flujo Neto</span>
                  <span className="text-4xl font-mono font-bold text-[#21242E]">${liquidezProyectada.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
                <h2 className="text-[11px] font-bold text-[#415364] uppercase tracking-widest mb-4 border-b border-neutral-100 pb-2">Radiografía Histórica (Realizado)</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                    <span className="text-xs font-bold text-neutral-600">Total Ingresos Recaudados</span>
                    <span className="text-sm font-mono font-bold text-emerald-600">${metricas.totalIngresos.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between items-center bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                    <span className="text-xs font-bold text-neutral-600">Inversión en Obra y Permisos</span>
                    <span className="text-sm font-mono font-bold text-[#ea0029]">-${metricas.totalEgresosObra.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between items-center bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                    <span className="text-xs font-bold text-neutral-600">Costos Comerciales (Incluye Anticipos)</span>
                    <span className="text-sm font-mono font-bold text-[#ea0029]">-${metricas.totalEgresosOperativos.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
                <h2 className="text-[11px] font-bold text-[#415364] uppercase tracking-widest mb-4 border-b border-neutral-100 pb-2">Proyecciones del Ecosistema</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-sky-50 p-3 rounded-lg border border-sky-100">
                    <span className="text-xs font-bold text-sky-800">Por Cobrar de Ventas (CRM)</span>
                    <span className="text-sm font-mono font-bold text-sky-700">${metricas.cuentasPorCobrar.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between items-center bg-amber-50 p-3 rounded-lg border border-amber-100">
                    <span className="text-xs font-bold text-amber-800">Inversión Pendiente (Presupuesto)</span>
                    <span className="text-sm font-mono font-bold text-amber-700">-${metricas.totalInversionesProyectadas.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PESTAÑA 2: LIBRO DIARIO CON CALCULADORA Y EDICIÓN */}
        {/* ========================================================================= */}
        {activeTab === 'movimientos' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
            <div className="lg:col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 h-fit sticky top-6">
              <div className="flex justify-between items-center border-b border-neutral-100 pb-3 mb-5">
                <h2 className="text-[11px] font-bold text-[#21242E] uppercase tracking-widest">
                  {editandoMovId ? 'Editar Movimiento' : 'Registrar Movimiento'}
                </h2>
                {editandoMovId && (
                  <button onClick={() => { setEditandoMovId(null); setMovForm({ ...movForm, descripcion: '', monto: '', comision_total: '' }); }} className="text-[9px] text-[#ea0029] font-bold uppercase hover:underline">Cancelar</button>
                )}
              </div>
              
              <form onSubmit={registrarMovimiento} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Entidad</label>
                    <select value={movForm.entidad} onChange={e => setMovForm({...movForm, entidad: e.target.value})} className="w-full text-xs font-bold p-2.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none text-[#21242E]">
                      <option>Arienzo S.A.S.</option>
                      <option>Konkeri S.A.S.</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Tipo</label>
                    <select value={movForm.tipo} onChange={e => setMovForm({...movForm, tipo: e.target.value})} className={`w-full text-xs font-bold p-2.5 rounded-lg border outline-none ${movForm.tipo === 'Ingreso' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                      <option value="Ingreso">INGRESO (+)</option>
                      <option value="Egreso">EGRESO (-)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Categoría</label>
                  <select value={movForm.categoria} onChange={e => setMovForm({...movForm, categoria: e.target.value})} className="w-full text-xs font-medium p-2.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none text-[#415364]">
                    {movForm.entidad === 'Konkeri S.A.S.' && movForm.tipo === 'Ingreso' ? (
                      <>
                        <option>Cobro de Comisiones (Ventas)</option>
                        <option>Honorarios por Servicios</option>
                        <option>Otro Ingreso</option>
                      </>
                    ) : (
                      <>
                        <option>Costos Operativos y Comerciales</option>
                        <option>Inversión Obra y Permisos</option>
                        <option>Anticipo Konkeri (Operativo)</option>
                        <option>Aportes y Capital</option>
                        <option>Cobros de Clientes</option>
                      </>
                    )}
                  </select>
                </div>

                {esModoComision ? (
                  <div className="bg-[#D1C292]/10 border border-[#D1C292]/30 p-4 rounded-xl space-y-4">
                    <h3 className="text-[10px] font-bold text-[#8A7A55] uppercase tracking-widest">Estructura de Comisión</h3>
                    <div>
                      <label className="text-[9px] font-bold text-[#8A7A55] uppercase block mb-1">Unidad / Cliente</label>
                      <select value={movForm.comision_unidad} onChange={e => handleComisionChange('comision_unidad', e.target.value)} className="w-full text-xs font-bold p-2 rounded border border-[#D1C292]/40 bg-white outline-none">
                        {unidadesVendidas.map(u => (
                          <option key={u.id} value={u.unidad}>{u.unidad} - {u.cliente}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-bold text-[#8A7A55] uppercase block mb-1">Total ($)</label>
                        <input type="number" value={movForm.comision_total} onChange={e => handleComisionChange('comision_total', e.target.value)} className="w-full text-sm font-mono font-bold p-2 rounded border border-[#D1C292]/40 bg-white outline-none" />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-[#8A7A55] uppercase block mb-1">% Hoy</label>
                        <div className="flex items-center">
                          <input type="number" value={movForm.comision_porcentaje} onChange={e => handleComisionChange('comision_porcentaje', e.target.value)} className="w-full text-sm font-mono font-bold p-2 rounded-l border border-[#D1C292]/40 bg-white outline-none" />
                          <span className="bg-[#D1C292]/20 px-2 py-1.5 text-xs font-bold text-[#8A7A55] rounded-r border border-l-0 border-[#D1C292]/40">%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Detalle (Libre)</label>
                    <input type="text" required value={movForm.descripcion} onChange={e => setMovForm({...movForm, descripcion: e.target.value})} className="w-full text-xs font-medium p-2.5 rounded-lg border border-neutral-200 bg-white outline-none focus:border-[#B94A36]" />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                  <div>
                    <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">{esModoComision ? 'Monto a Ingresar ($)' : 'Valor ($)'}</label>
                    <input type="number" step="0.01" required value={movForm.monto} onChange={e => setMovForm({...movForm, monto: e.target.value})} readOnly={esModoComision} className={`w-full text-lg font-mono font-bold p-2 rounded-lg border outline-none ${esModoComision ? 'bg-emerald-50 border-emerald-200 text-emerald-700 cursor-not-allowed' : 'bg-white border-neutral-200 focus:border-[#B94A36] text-[#21242E]'}`} />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Estado SRI</label>
                    <select value={movForm.estado_facturacion} onChange={e => setMovForm({...movForm, estado_facturacion: e.target.value})} className={`w-full text-[10px] font-bold p-2.5 rounded-lg border outline-none ${movForm.estado_facturacion === 'Facturado' ? 'bg-sky-50 border-sky-200 text-sky-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                      <option value="No Facturado">Pendiente (Futuro)</option>
                      <option value="Facturado">Facturado Hoy</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3">
                  <button type="submit" className={`w-full text-white font-bold uppercase tracking-widest text-[10px] py-3.5 rounded-xl transition-all shadow-md ${editandoMovId ? 'bg-[#ea0029] hover:bg-red-800' : 'bg-[#21242E] hover:bg-black'}`}>
                    {editandoMovId ? 'Actualizar Registro' : 'Guardar Movimiento'}
                  </button>
                </div>
              </form>
            </div>
            
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 overflow-hidden flex flex-col">
               <h2 className="text-[11px] font-bold text-[#415364] uppercase tracking-widest border-b border-neutral-100 pb-3 mb-4">Libro de Caja Real</h2>
               {movimientos.length === 0 ? (
                 <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-sm font-bold text-neutral-400">Libro en Blanco</p>
                 </div>
               ) : (
                 <div className="overflow-auto custom-scrollbar flex-1 -mx-2 px-2">
                   <table className="w-full text-left text-[11px] whitespace-nowrap">
                     <thead>
                       <tr className="border-b border-neutral-200 text-neutral-400 uppercase tracking-wider">
                         <th className="py-3 px-2 font-semibold">Fecha</th>
                         <th className="py-3 px-2 font-semibold">Caja</th>
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
                             <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${mov.entidad === 'Arienzo' || mov.entidad === 'Arienzo S.A.S.' ? 'bg-[#D1C292]/20 text-[#8A7A55]' : 'bg-neutral-100 text-[#415364]'}`}>
                               {mov.entidad === 'Arienzo S.A.S.' ? 'Arienzo' : 'Konkeri'}
                             </span>
                           </td>
                           <td className="py-3 px-2">
                             <p className="font-bold text-[#415364]">{mov.categoria}</p>
                             <p className="text-[9px] text-neutral-500">{mov.descripcion}</p>
                           </td>
                           <td className={`py-3 px-2 text-right font-mono font-bold ${mov.tipo === 'Ingreso' ? 'text-emerald-600' : 'text-[#ea0029]'}`}>
                             {mov.tipo === 'Ingreso' ? '+' : '-'}${Number(mov.monto).toLocaleString('en-US', {minimumFractionDigits: 2})}
                           </td>
                           <td className="py-3 px-2 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <div className="flex justify-center gap-3">
                               <button onClick={() => cargarParaEditarMov(mov)} className="text-neutral-400 hover:text-[#415364]" title="Editar">
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                               </button>
                               <button onClick={() => eliminarMovimiento(mov.id)} className="text-neutral-400 hover:text-[#ea0029]" title="Eliminar">
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                               </button>
                             </div>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PESTAÑA 3: PRESUPUESTO (INVERSIONES POR HACER CON EDICIÓN) */}
        {/* ========================================================================= */}
        {activeTab === 'proyeccion' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
            <div className="lg:col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 h-fit sticky top-6">
              <div className="flex justify-between items-center border-b border-neutral-100 pb-3 mb-5">
                <h2 className="text-[11px] font-bold text-[#21242E] uppercase tracking-widest">
                  {editandoPresId ? 'Editar Inversión' : 'Planificar Obligación'}
                </h2>
                {editandoPresId && (
                  <button onClick={() => { setEditandoPresId(null); setProyeccionForm({ categoria: 'Trámites y Permisos', detalle: '', monto_estimado: '', fecha_estimada: '' }); }} className="text-[9px] text-[#ea0029] font-bold uppercase hover:underline">Cancelar</button>
                )}
              </div>

              <form onSubmit={registrarPresupuesto} className="space-y-4">
                <div>
                  <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Categoría</label>
                  <select value={proyeccionForm.categoria} onChange={e => setProyeccionForm({...proyeccionForm, categoria: e.target.value})} className="w-full text-xs font-bold p-2.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none text-[#21242E]">
                    <option>Trámites y Permisos</option>
                    <option>Marketing y Ventas</option>
                    <option>Honorarios y Servicios</option>
                    <option>Impuestos y Obligaciones</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Detalle del Gasto</label>
                  <input type="text" required value={proyeccionForm.detalle} onChange={e => setProyeccionForm({...proyeccionForm, detalle: e.target.value})} className="w-full text-xs font-medium p-2.5 rounded-lg border border-neutral-200 bg-white outline-none focus:border-[#B94A36]" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Costo Estimado ($)</label>
                    <input type="number" step="0.01" required value={proyeccionForm.monto_estimado} onChange={e => setProyeccionForm({...proyeccionForm, monto_estimado: e.target.value})} className="w-full text-sm font-mono font-bold p-2.5 rounded-lg border border-neutral-200 bg-white outline-none text-[#B94A36]" />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Mes Est.</label>
                    <input type="text" required value={proyeccionForm.fecha_estimada} onChange={e => setProyeccionForm({...proyeccionForm, fecha_estimada: e.target.value})} className="w-full text-xs font-medium p-2.5 rounded-lg border border-neutral-200 bg-white outline-none" />
                  </div>
                </div>
                <div className="pt-3">
                  <button type="submit" className={`w-full text-white font-bold uppercase tracking-widest text-[10px] py-3.5 rounded-xl transition-all shadow-md ${editandoPresId ? 'bg-[#ea0029] hover:bg-red-800' : 'bg-[#B94A36] hover:bg-[#9a3d2c]'}`}>
                    {editandoPresId ? 'Actualizar Presupuesto' : 'Añadir al Presupuesto'}
                  </button>
                </div>
              </form>
            </div>

            <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 overflow-hidden flex flex-col">
               <div className="flex justify-between items-center border-b border-neutral-100 pb-3 mb-4">
                 <h2 className="text-[11px] font-bold text-[#415364] uppercase tracking-widest">Presupuesto de Inversión Pendiente</h2>
                 <span className="text-[11px] font-mono font-bold text-[#B94A36]">Total: ${metricas.totalInversionesProyectadas.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
               </div>
               {inversionesPorHacer.length === 0 ? (
                 <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-sm font-bold text-neutral-400">Sin Presupuestos</p>
                 </div>
               ) : (
                 <div className="overflow-auto custom-scrollbar flex-1 -mx-2 px-2">
                  <table className="w-full text-left text-[11px] whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-neutral-200 text-neutral-400 uppercase tracking-wider">
                        <th className="py-3 px-2 font-semibold">Detalle y Concepto</th>
                        <th className="py-3 px-2 font-semibold text-center">Fecha Est.</th>
                        <th className="py-3 px-2 font-semibold text-right">Valor Est.</th>
                        <th className="py-3 px-2 font-semibold text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {inversionesPorHacer.map(inv => (
                        <tr key={inv.id} className="hover:bg-neutral-50 group">
                          <td className="py-4 px-2">
                            <p className="font-bold text-[#21242E]">{inv.detalle}</p>
                            <p className="text-neutral-500 uppercase text-[9px] tracking-wider">{inv.categoria}</p>
                          </td>
                          <td className="py-4 px-2 text-center text-neutral-500 font-medium">{inv.fecha_estimada}</td>
                          <td className="py-4 px-2 text-right font-mono font-bold text-[#B94A36]">${Number(inv.monto_estimado).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                          <td className="py-4 px-2 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <div className="flex justify-center gap-3">
                               <button onClick={() => cargarParaEditarPres(inv)} className="text-neutral-400 hover:text-[#415364]" title="Editar">
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                               </button>
                               <button onClick={() => eliminarPresupuesto(inv.id)} className="text-neutral-400 hover:text-[#ea0029]" title="Eliminar">
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                               </button>
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
               )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}