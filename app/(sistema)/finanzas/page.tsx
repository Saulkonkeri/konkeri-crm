'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function FinanzasDashboardPage() {
  const [activeTab, setActiveTab] = useState<'resumen' | 'tesoreria' | 'presupuesto' | 'intercompania'>('resumen');
  
  const [mesProyeccion, setMesProyeccion] = useState('2026-12');
  const [cargando, setCargando] = useState(true);

  // ================= ESTADOS DE DATOS Y EDICIÓN =================
  const [editandoMovId, setEditandoMovId] = useState<string | null>(null);
  const [editandoPresupuestoId, setEditandoPresupuestoId] = useState<string | null>(null); // 👈 Nuevo
  const [editandoDeudaId, setEditandoDeudaId] = useState<string | null>(null);             // 👈 Nuevo
  
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [inversionesPorHacer, setInversionesPorHacer] = useState<any[]>([]);
  const [unidadesVendidas, setUnidadesVendidas] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [deudasSocios, setDeudasSocios] = useState<any[]>([]);
  
  const [saldoBancarioReal, setSaldoBancarioReal] = useState<string>('');

  const [metricas, setMetricas] = useState({
    cajaTotal: 0,
    ingresosCapital: 0,
    ingresosVentas: 0,
    egresosTotalesHistoricos: 0,
    cobradoVentasFirme: 0,
    porCobrarVentasFirme: 0,
    totalVentasFirmeCombinado: 0,
    totalEgresosProyectadosPresupuesto: 0,
    totalClientesAbonadoReal: 0,
    inversionProyectada: 0,
    comisionesRealesKonkeri: 0, 
    anticiposRealesKonkeri: 0,
    aportesEspeciePendientes: 0
  });

  // ================= FORMULARIOS =================
  const [movForm, setMovForm] = useState({
    fecha_transaccion: new Date().toISOString().split('T')[0],
    cuenta_bancaria: 'Cta. Arienzo S.A.S.',
    tipo: 'Ingreso',
    categoria: 'Aporte de Socios / Capital',
    descripcion: '',
    monto: '',
    estado_comprobante: 'Recibo Interno',
  });

  const [proyeccionForm, setProyeccionForm] = useState({
    categoria: 'Trámites y Permisos',
    detalle: '',
    monto_estimado: '',
    fecha_estimada: new Date().toISOString().split('T')[0] // 👈 Ahora pide un día específico
  });

  const [deudaForm, setDeudaForm] = useState({
    fecha_registro: new Date().toISOString().split('T')[0],
    acreedor: 'Saúl Intriago (Socio)',
    concepto: '',
    monto: ''
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
      const { data: ventas } = await supabase.from('cotizaciones').select('*').eq('estado', 'Venta - En Cierre'); 
      const { data: clis } = await supabase.from('clientes').select('*');
      const { data: deudas } = await supabase.from('finanzas_deudas_intercompania').select('*').order('fecha_registro', { ascending: false });

      const movsData = movs || [];
      const presData = pres || [];
      const ventasData = ventas || [];
      const clisData = clis || [];
      const deudasData = deudas || [];

      setMovimientos(movsData);
      setInversionesPorHacer(presData);
      setUnidadesVendidas(ventasData);
      setClientes(clisData);
      setDeudasSocios(deudasData);

      let inCapital = 0, inVentas = 0;
      let egObra = 0, egComercial = 0, egresosTotales = 0;
      let comisionesKonkeri = 0, anticiposKonkeri = 0;
      let reservasManualesIngresadas = 0;

      movsData.forEach(m => {
        const monto = Number(m.monto);
        if (m.tipo === 'Ingreso') {
          if (m.categoria.includes('Capital') || m.categoria.includes('Socios')) inCapital += monto;
          else if (m.categoria.includes('Comisiones')) comisionesKonkeri += monto;
          else {
            inVentas += monto;
            if (m.categoria.includes('Reserva')) reservasManualesIngresadas += monto;
          }
        }
        if (m.tipo === 'Egreso') {
          egresosTotales += monto;
          if (m.categoria.includes('Obra') || m.categoria.includes('Permisos')) egObra += monto;
          else if (m.categoria.includes('Anticipo Operativo')) anticiposKonkeri += monto;
          else egComercial += monto;
        }
      });

      const cajaReal = (inCapital + inVentas + comisionesKonkeri) - egresosTotales;
      const limitePresupuesto = `${mesProyeccion}-31`;
      const presupuestoFiltrado = presData.filter(p => !p.fecha_estimada || p.fecha_estimada <= limitePresupuesto);
      const totalInvProy = presupuestoFiltrado.reduce((acc, curr) => acc + Number(curr.monto_estimado), 0);

      let sumCobrado = 0;
      let sumPorCobrarHastaFecha = 0;

      ventasData.forEach(v => {
        if (v.cronograma_pagos && Array.isArray(v.cronograma_pagos)) {
          v.cronograma_pagos.forEach((cuota: any) => {
            const montoCuota = Number(cuota.amount || 0);
            if (cuota.pagado === true) {
              sumCobrado += montoCuota;
            } else if (cuota.date && cuota.date <= limitePresupuesto) {
              sumPorCobrarHastaFecha += montoCuota;
            }
          });
        }
      });

      let sumAportesPendientes = 0;
      deudasData.forEach(d => {
        if (d.estado === 'Pendiente') sumAportesPendientes += Number(d.monto);
      });

      const totalClientesAbonado = sumCobrado + reservasManualesIngresadas;
      const totalCombinadoVentas = sumCobrado + sumPorCobrarHastaFecha;

      setMetricas({
        cajaTotal: cajaReal,
        ingresosCapital: inCapital,
        ingresosVentas: inVentas,
        egresosTotalesHistoricos: egresosTotales,
        cobradoVentasFirme: sumCobrado,
        porCobrarVentasFirme: sumPorCobrarHastaFecha,
        totalVentasFirmeCombinado: totalCombinadoVentas,
        totalEgresosProyectadosPresupuesto: totalInvProy,
        totalClientesAbonadoReal: totalClientesAbonado,
        inversionProyectada: totalInvProy,
        comisionesRealesKonkeri: comisionesKonkeri,
        anticiposRealesKonkeri: anticiposKonkeri,
        aportesEspeciePendientes: sumAportesPendientes
      });

    } catch (error) {
      console.error("Error cargando finanzas:", error);
    } finally {
      setCargando(false);
    }
  };

  // 🎯 FUNCIONES PARA TESORERÍA (MOVIMIENTOS)
  const registrarMovimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movForm.monto) return alert("Ingrese un monto válido.");
    try {
      const datos = {
        fecha_transaccion: movForm.fecha_transaccion,
        entidad: movForm.cuenta_bancaria,
        tipo: movForm.tipo,
        categoria: movForm.categoria,
        descripcion: movForm.descripcion,
        monto: Number(movForm.monto),
        estado_facturacion: movForm.estado_comprobante
      };
      if (editandoMovId) {
        await supabase.from('finanzas_movimientos').update(datos).eq('id', editandoMovId);
        setEditandoMovId(null);
      } else {
        await supabase.from('finanzas_movimientos').insert([datos]);
      }
      setMovForm({ fecha_transaccion: new Date().toISOString().split('T')[0], cuenta_bancaria: 'Cta. Arienzo S.A.S.', tipo: 'Ingreso', categoria: 'Aporte de Socios / Capital', descripcion: '', monto: '', estado_comprobante: 'Recibo Interno' });
      cargarDatos();
    } catch (err) { alert("Error al guardar en el servidor."); }
  };

  const cargarParaEditarMov = (mov: any) => {
    setMovForm({ fecha_transaccion: mov.fecha_transaccion, cuenta_bancaria: mov.entidad, tipo: mov.tipo, categoria: mov.categoria, descripcion: mov.descripcion || '', monto: mov.monto.toString(), estado_comprobante: mov.estado_facturacion || 'Recibo Interno' });
    setEditandoMovId(mov.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelarEdicionMov = () => {
    setEditandoMovId(null);
    setMovForm({ fecha_transaccion: new Date().toISOString().split('T')[0], cuenta_bancaria: 'Cta. Arienzo S.A.S.', tipo: 'Ingreso', categoria: 'Aporte de Socios / Capital', descripcion: '', monto: '', estado_comprobante: 'Recibo Interno' });
  };

  const eliminarMovimiento = async (id: string) => {
    if (!window.confirm("¿Confirma la eliminación? Esto recalculará los saldos.")) return;
    await supabase.from('finanzas_movimientos').delete().eq('id', id);
    cargarDatos();
  };

  // 🎯 FUNCIONES PARA PRESUPUESTO
  const registrarPresupuesto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proyeccionForm.monto_estimado) return alert("Ingrese un monto.");
    try {
      const datos = {
        categoria: proyeccionForm.categoria,
        detalle: proyeccionForm.detalle,
        monto_estimado: Number(proyeccionForm.monto_estimado),
        fecha_estimada: proyeccionForm.fecha_estimada
      };
      if (editandoPresupuestoId) {
        await supabase.from('finanzas_presupuestos').update(datos).eq('id', editandoPresupuestoId);
        setEditandoPresupuestoId(null);
      } else {
        await supabase.from('finanzas_presupuestos').insert([datos]);
      }
      setProyeccionForm({ categoria: 'Trámites y Permisos', detalle: '', monto_estimado: '', fecha_estimada: new Date().toISOString().split('T')[0] });
      cargarDatos();
    } catch (err) { alert("Error al guardar presupuesto."); }
  };

  const cargarParaEditarPresupuesto = (pres: any) => {
    setProyeccionForm({ categoria: pres.categoria, detalle: pres.detalle, monto_estimado: pres.monto_estimado.toString(), fecha_estimada: pres.fecha_estimada || '' });
    setEditandoPresupuestoId(pres.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelarEdicionPresupuesto = () => {
    setEditandoPresupuestoId(null);
    setProyeccionForm({ categoria: 'Trámites y Permisos', detalle: '', monto_estimado: '', fecha_estimada: new Date().toISOString().split('T')[0] });
  };

  const eliminarPresupuesto = async (id: string) => {
    if (!window.confirm("¿Eliminar este rubro del presupuesto?")) return;
    await supabase.from('finanzas_presupuestos').delete().eq('id', id);
    cargarDatos();
  };

  // 🎯 FUNCIONES PARA DEUDAS/APORTES INTERCOMPAÑÍA
  const registrarDeudaSocio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deudaForm.monto) return alert("Ingrese un monto.");
    try {
      const datos = {
        fecha_registro: deudaForm.fecha_registro,
        acreedor: deudaForm.acreedor,
        concepto: deudaForm.concepto,
        monto: Number(deudaForm.monto)
      };
      if (editandoDeudaId) {
        await supabase.from('finanzas_deudas_intercompania').update(datos).eq('id', editandoDeudaId);
        setEditandoDeudaId(null);
      } else {
        await supabase.from('finanzas_deudas_intercompania').insert([{ ...datos, estado: 'Pendiente' }]);
      }
      setDeudaForm({ fecha_registro: new Date().toISOString().split('T')[0], acreedor: 'Saúl Intriago (Socio)', concepto: '', monto: '' });
      cargarDatos();
    } catch (err) { alert("Error al guardar el aporte."); }
  };

  const cargarParaEditarDeuda = (deuda: any) => {
    setDeudaForm({ fecha_registro: deuda.fecha_registro, acreedor: deuda.acreedor, concepto: deuda.concepto, monto: deuda.monto.toString() });
    setEditandoDeudaId(deuda.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelarEdicionDeuda = () => {
    setEditandoDeudaId(null);
    setDeudaForm({ fecha_registro: new Date().toISOString().split('T')[0], acreedor: 'Saúl Intriago (Socio)', concepto: '', monto: '' });
  };

  const saldarDeudaSocio = async (id: string) => {
    if (!window.confirm("¿Confirma que Arienzo ya pagó o reembolsó este valor?\n\nRecuerde registrar el EGRESO correspondiente en la pestaña de Tesorería.")) return;
    await supabase.from('finanzas_deudas_intercompania').update({ estado: 'Saldado' }).eq('id', id);
    cargarDatos();
  };

  const eliminarDeudaSocio = async (id: string) => {
    if (!window.confirm("¿Desea eliminar este registro permanentemente?")) return;
    await supabase.from('finanzas_deudas_intercompania').delete().eq('id', id);
    cargarDatos();
  };

  if (cargando) return <div className="flex items-center justify-center min-h-screen"><div className="text-sm font-bold text-[#415364] uppercase tracking-widest animate-pulse">Estructurando Finanzas...</div></div>;

  const bancoReal = Number(saldoBancarioReal) || 0;
  const diferenciaConciliacion = bancoReal - metricas.cajaTotal;
  const saldoIntercompaniaReal = metricas.comisionesRealesKonkeri - metricas.anticiposRealesKonkeri;
  const brechaDevolucionClientes = metricas.cajaTotal - metricas.totalClientesAbonadoReal;

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

        {/* PESTAÑA 1: DASHBOARD GERENCIAL (Mantenida idéntica y limpia) */}
        {activeTab === 'resumen' && (
          <div className="space-y-6 animate-in fade-in max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-200 flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-2">Efectivo Total en Cuentas (Caja Real Actual)</span>
                  <span className="text-4xl font-mono font-bold text-[#21242E]">${metricas.cajaTotal.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
               </div>
               
               <div className="bg-[#21242E] p-8 rounded-2xl shadow-lg border border-neutral-800 flex flex-col justify-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#D1C292] opacity-10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                  <div className="flex justify-between items-center mb-2 relative z-10">
                    <span className="text-[10px] font-bold text-[#D1C292] uppercase tracking-widest block">Total Ventas Cerradas (Cobrado + Por Cobrar)</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold text-neutral-400 uppercase">Hasta:</span>
                      <input type="month" value={mesProyeccion} onChange={e => setMesProyeccion(e.target.value)} className="text-[10px] font-bold text-white border border-neutral-600 rounded p-1.5 outline-none bg-neutral-800" />
                    </div>
                  </div>
                  <span className="text-4xl font-mono font-bold text-white relative z-10">${metricas.totalVentasFirmeCombinado.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
               </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
              <h2 className="text-xs font-bold text-[#21242E] uppercase tracking-widest mb-4 border-b border-neutral-100 pb-3">Desglose de Ventas Cerradas (Hasta {mesProyeccion})</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 rounded-xl bg-sky-50/50 border border-sky-100">
                  <span className="text-[10px] font-bold text-sky-800 uppercase tracking-widest block mb-1">1. Ya Cobrado (Histórico CRM)</span>
                  <span className="text-2xl font-mono font-bold text-sky-700">${metricas.cobradoVentasFirme.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                  <p className="text-[9px] text-sky-600 mt-1">Reservas, iniciales y cuotas ya recaudadas.</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest block mb-1">2. Por Cobrar (Hasta {mesProyeccion})</span>
                  <span className="text-2xl font-mono font-bold text-emerald-700">${metricas.porCobrarVentasFirme.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                  <p className="text-[9px] text-emerald-600 mt-1">Cuotas pendientes programadas hasta el mes elegido.</p>
                </div>
                <div className="p-4 rounded-xl bg-neutral-900 text-white shadow-md">
                  <span className="text-[10px] font-bold text-[#D1C292] uppercase tracking-widest block mb-1">3. Total Ingresos Esperados (1 + 2)</span>
                  <span className="text-2xl font-mono font-bold text-white">${metricas.totalVentasFirmeCombinado.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                  <p className="text-[9px] text-white/60 mt-1">Todo lo recaudado + lo proyectado en fecha.</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
              <div className="bg-neutral-50 p-4 border-b border-neutral-200 flex justify-between items-center">
                <h2 className="text-[11px] font-bold text-[#415364] uppercase tracking-widest">Auditoría: Ventas en Firme ({unidadesVendidas.length})</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-100 text-[9px] text-neutral-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Unidad</th>
                      <th className="px-4 py-3">Cliente Inversionista</th>
                      <th className="px-4 py-3 text-center">Estatus CRM</th>
                      <th className="px-4 py-3 text-right">Valor Total Negocio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {unidadesVendidas.length > 0 ? (
                      unidadesVendidas.map(v => {
                        const cliente = clientes.find(c => c.id === v.cliente_id);
                        return (
                          <tr key={v.id} className="hover:bg-neutral-50">
                            <td className="px-4 py-3 font-bold text-[#21242E]">Dpto {v.unidad_numero || 'N/A'}</td>
                            <td className="px-4 py-3 font-medium text-neutral-700">{cliente ? `${cliente.nombres} ${cliente.apellidos}` : 'Cliente no asignado'}</td>
                            <td className="px-4 py-3 text-center"><span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[9px] font-bold uppercase">{v.estado}</span></td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-sky-700">${Number(v.precio_total || v.precio_final || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-neutral-400 text-xs italic">No hay ventas registradas en estatus 'Venta - En Cierre'.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden flex flex-col justify-between">
                <div className="bg-neutral-50 p-4 border-b border-neutral-200"><h2 className="text-[11px] font-bold text-[#415364] uppercase tracking-widest">Balance General Histórico (Ingresos vs Egresos)</h2></div>
                <div className="p-6 space-y-4 flex-1 flex flex-col justify-around">
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest block">Total Histórico Ingresado</span>
                      <span className="text-[9px] text-emerald-600">Socios + reservas + cuotas cobradas de todas las fuentes</span>
                    </div>
                    <span className="text-xl font-mono font-bold text-emerald-700">+${(metricas.ingresosCapital + metricas.ingresosVentas + metricas.comisionesRealesKonkeri).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-bold text-[#ea0029] uppercase tracking-widest block">Total Histórico Gastado</span>
                      <span className="text-[9px] text-[#ea0029]/70">Obra, permisos, marketing y anticipos operativos</span>
                    </div>
                    <span className="text-xl font-mono font-bold text-[#ea0029]">-${metricas.egresosTotalesHistoricos.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6 flex flex-col">
                <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden flex-1">
                  <div className="bg-sky-50 p-4 border-b border-sky-100"><h2 className="text-[11px] font-bold text-sky-900 uppercase tracking-widest">Resumen Presupuesto (Obra)</h2></div>
                  <div className="p-6 space-y-4">
                    <div className="p-4 border border-neutral-100 rounded-xl bg-neutral-50 flex justify-between items-center">
                      <div>
                        <span className="text-[10px] font-bold text-neutral-500 uppercase block">Obligaciones (Presupuesto)</span>
                        <span className="text-[9px] text-neutral-400">Inversiones planificadas hasta {mesProyeccion}</span>
                      </div>
                      <span className="text-lg font-mono font-bold text-amber-600">-${metricas.inversionProyectada.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-neutral-900 text-white p-5 rounded-2xl border border-neutral-800 flex justify-between items-center shadow-md">
                  <div>
                    <span className="text-[9px] font-bold text-[#D1C292] uppercase tracking-widest block">Ratio de Cobertura de Clientes</span>
                    <p className="text-[10px] text-neutral-400 mt-0.5">Total Abonado por Clientes: <span className="font-mono font-bold text-white">${metricas.totalClientesAbonadoReal.toLocaleString('en-US', {minimumFractionDigits: 2})}</span></p>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] text-neutral-400 uppercase tracking-wider block">Brecha / Faltante Caja</span>
                    <span className={`text-xl font-mono font-bold ${brechaDevolucionClientes >= 0 ? 'text-emerald-400' : 'text-[#ea0029]'}`}>
                      {brechaDevolucionClientes >= 0 ? `+$${brechaDevolucionClientes.toLocaleString('en-US', {minimumFractionDigits: 2})}` : `-$${Math.abs(brechaDevolucionClientes).toLocaleString('en-US', {minimumFractionDigits: 2})}`}
                    </span>
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
                <div className="flex justify-between items-center border-b border-neutral-100 pb-3 mb-5">
                  <h2 className="text-[11px] font-bold text-[#21242E] uppercase tracking-widest">
                    {editandoMovId ? '✏️ Editando Movimiento' : 'Registrar Movimiento'}
                  </h2>
                  {editandoMovId && (
                    <button onClick={cancelarEdicionMov} className="text-[9px] font-bold text-red-600 uppercase underline">Cancelar</button>
                  )}
                </div>
                <form onSubmit={registrarMovimiento} className="space-y-4">
                  <div>
                    <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Fecha del Movimiento</label>
                    <input type="date" required value={movForm.fecha_transaccion} onChange={e => setMovForm({...movForm, fecha_transaccion: e.target.value})} className="w-full text-xs font-bold p-2.5 rounded-lg border border-neutral-200 bg-white outline-none" />
                  </div>
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
                  <div>
                    <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Detalle</label>
                    <input type="text" required value={movForm.descripcion} onChange={e => setMovForm({...movForm, descripcion: e.target.value})} className="w-full text-xs p-2.5 rounded-lg border outline-none" placeholder="Ej. Pago Municipio" />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Monto ($)</label>
                    <input type="number" step="0.01" required value={movForm.monto} onChange={e => setMovForm({...movForm, monto: e.target.value})} className="w-full text-xl font-mono font-bold p-2.5 rounded-lg border outline-none bg-white" placeholder="0.00" />
                  </div>
                  <button type="submit" className={`w-full text-white font-bold uppercase tracking-widest text-[10px] py-3.5 rounded-xl ${editandoMovId ? 'bg-amber-600' : 'bg-[#21242E]'}`}>
                    {editandoMovId ? 'Actualizar Movimiento' : 'Guardar en Libro'}
                  </button>
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
                             <button onClick={() => cargarParaEditarMov(mov)} className="text-neutral-400 hover:text-[#415364]" title="Editar">✏️</button>
                             <button onClick={() => eliminarMovimiento(mov.id)} className="text-neutral-400 hover:text-[#ea0029]" title="Eliminar">🗑️</button>
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
              <div className="flex justify-between items-center border-b border-neutral-100 pb-3 mb-5">
                <h2 className="text-[11px] font-bold text-[#21242E] uppercase tracking-widest">
                  {editandoPresupuestoId ? '✏️ Editando Presupuesto' : 'Planificar Obligación'}
                </h2>
                {editandoPresupuestoId && (
                  <button onClick={cancelarEdicionPresupuesto} className="text-[9px] font-bold text-red-600 uppercase underline">Cancelar</button>
                )}
              </div>
              
              <form onSubmit={registrarPresupuesto} className="space-y-4">
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
                    {/* 🎯 AQUÍ SE CAMBIÓ A type="date" PARA PONER EL DÍA EXACTO */}
                    <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Día Exacto</label>
                    <input type="date" required value={proyeccionForm.fecha_estimada} onChange={e => setProyeccionForm({...proyeccionForm, fecha_estimada: e.target.value})} className="w-full text-[11px] font-bold p-2.5 rounded-lg border outline-none" />
                  </div>
                </div>
                <button type="submit" className={`w-full text-white font-bold uppercase text-[10px] py-3.5 rounded-xl ${editandoPresupuestoId ? 'bg-amber-600' : 'bg-[#B94A36]'}`}>
                  {editandoPresupuestoId ? 'Actualizar Rubro' : 'Agregar al Presupuesto'}
                </button>
              </form>
            </div>
            
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 flex flex-col">
               <h2 className="text-[11px] font-bold text-[#415364] uppercase tracking-widest border-b border-neutral-100 pb-3 mb-4">Presupuesto Registrado</h2>
               <div className="overflow-auto custom-scrollbar flex-1 -mx-2 px-2">
                 <table className="w-full text-left text-[11px] whitespace-nowrap">
                   <thead>
                     <tr className="border-b border-neutral-200 text-neutral-400 uppercase tracking-wider">
                       <th className="py-3 px-2 font-semibold">Detalle y Categoría</th>
                       <th className="py-3 px-2 font-semibold text-center">Fecha Exacta</th>
                       <th className="py-3 px-2 font-semibold text-right">Valor</th>
                       <th className="py-3 px-2 font-semibold text-center">Acciones</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-neutral-100">
                     {inversionesPorHacer.map(inv => (
                       <tr key={inv.id} className="hover:bg-neutral-50 group">
                         <td className="py-4 px-2"><p className="font-bold text-[#21242E]">{inv.detalle}</p><p className="text-[9px] text-neutral-500 uppercase">{inv.categoria}</p></td>
                         <td className="py-4 px-2 text-center text-neutral-500 font-medium">
                           {inv.fecha_estimada ? new Date(inv.fecha_estimada).toLocaleDateString('es-ES') : 'N/A'}
                         </td>
                         <td className="py-4 px-2 text-right font-mono font-bold text-[#B94A36]">${Number(inv.monto_estimado).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                         <td className="py-4 px-2 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                           <div className="flex justify-center gap-3">
                             <button onClick={() => cargarParaEditarPresupuesto(inv)} className="text-neutral-400 hover:text-[#415364]" title="Editar">✏️</button>
                             <button onClick={() => eliminarPresupuesto(inv.id)} className="text-neutral-400 hover:text-[#ea0029]" title="Eliminar">🗑️</button>
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

        {/* 🎯 PESTAÑA 4: INTERCOMPAÑÍA & APORTES EN ESPECIE */}
        {activeTab === 'intercompania' && (
          <div className="space-y-8 animate-in fade-in max-w-6xl mx-auto">
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm flex flex-col justify-center">
                <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">1. Comisiones Konkeri</span>
                <span className="text-2xl font-mono font-bold text-[#21242E]">${metricas.comisionesRealesKonkeri.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
              </div>
              <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm flex flex-col justify-center">
                <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">2. Anticipos Girados</span>
                <span className="text-2xl font-mono font-bold text-[#ea0029]">-${metricas.anticiposRealesKonkeri.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
              </div>
              <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm flex flex-col justify-center border-l-4 border-l-sky-500">
                <span className="text-[9px] font-bold text-sky-600 uppercase tracking-widest block mb-1">3. Aportes / Bolsillo Pendiente</span>
                <span className="text-2xl font-mono font-bold text-sky-700">${metricas.aportesEspeciePendientes.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
              </div>
              <div className="bg-[#21242E] p-5 rounded-xl shadow-md flex flex-col justify-center">
                <span className="text-[9px] font-bold text-[#D1C292] uppercase tracking-widest block mb-1">Total que Arienzo Debe (1 - 2 + 3)</span>
                <span className="text-2xl font-mono font-bold text-white">${(metricas.comisionesRealesKonkeri - metricas.anticiposRealesKonkeri + metricas.aportesEspeciePendientes).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <div className="lg:col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 h-fit sticky top-6">
                <div className="flex justify-between items-center border-b border-neutral-100 pb-3 mb-5">
                  <h2 className="text-[11px] font-bold text-[#21242E] uppercase tracking-widest">
                    {editandoDeudaId ? '✏️ Editando Deuda' : 'Registrar Gasto/Trabajo'}
                  </h2>
                  {editandoDeudaId && (
                    <button onClick={cancelarEdicionDeuda} className="text-[9px] font-bold text-red-600 uppercase underline">Cancelar</button>
                  )}
                </div>
                
                <form onSubmit={registrarDeudaSocio} className="space-y-4">
                  <div>
                    <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Fecha</label>
                    <input type="date" required value={deudaForm.fecha_registro} onChange={e => setDeudaForm({...deudaForm, fecha_registro: e.target.value})} className="w-full text-xs font-bold p-2.5 rounded-lg border outline-none" />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">¿Quién lo pagó / ejecutó?</label>
                    <select value={deudaForm.acreedor} onChange={e => setDeudaForm({...deudaForm, acreedor: e.target.value})} className="w-full text-xs font-bold p-2.5 rounded-lg border outline-none">
                      <option>Saúl Intriago (Socio)</option>
                      <option>Debbi (Socia)</option>
                      <option>Konkeri S.A.S.</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Concepto del Trabajo o Gasto</label>
                    <input type="text" required value={deudaForm.concepto} onChange={e => setDeudaForm({...deudaForm, concepto: e.target.value})} placeholder="Ej: Pago de Cuadros, Diseño de Renders..." className="w-full text-xs p-2.5 rounded-lg border outline-none" />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Valorización ($)</label>
                    <input type="number" step="0.01" required value={deudaForm.monto} onChange={e => setDeudaForm({...deudaForm, monto: e.target.value})} className="w-full text-sm font-mono font-bold p-2.5 rounded-lg border outline-none" placeholder="0.00" />
                  </div>
                  <button type="submit" className={`w-full text-white font-bold uppercase tracking-widest text-[10px] py-3.5 rounded-xl transition-colors ${editandoDeudaId ? 'bg-amber-600' : 'bg-sky-700 hover:bg-sky-800'}`}>
                    {editandoDeudaId ? 'Actualizar Registro' : 'Registrar Cta. Por Pagar'}
                  </button>
                </form>
              </div>
              
              <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 flex flex-col">
                 <h2 className="text-[11px] font-bold text-[#415364] uppercase tracking-widest border-b border-neutral-100 pb-3 mb-4">Cuentas por Pagar (Aportes en Especie y Bolsillo)</h2>
                 <div className="overflow-auto custom-scrollbar flex-1 -mx-2 px-2">
                   <table className="w-full text-left text-[11px] whitespace-nowrap">
                     <thead>
                       <tr className="border-b border-neutral-200 text-neutral-400 uppercase tracking-wider">
                         <th className="py-3 px-2 font-semibold">Fecha / Acreedor</th>
                         <th className="py-3 px-2 font-semibold">Concepto Registrado</th>
                         <th className="py-3 px-2 font-semibold text-center">Estado</th>
                         <th className="py-3 px-2 font-semibold text-right">Valor</th>
                         <th className="py-3 px-2 font-semibold text-center">Acciones</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-neutral-100">
                       {deudasSocios.length > 0 ? (
                         deudasSocios.map(d => (
                           <tr key={d.id} className="hover:bg-neutral-50 group">
                             <td className="py-4 px-2">
                               <p className="font-mono text-neutral-500 text-[10px]">{new Date(d.fecha_registro).toLocaleDateString('es-ES')}</p>
                               <p className="font-bold text-[#21242E]">{d.acreedor}</p>
                             </td>
                             <td className="py-4 px-2 text-neutral-600 truncate max-w-[200px]">{d.concepto}</td>
                             <td className="py-4 px-2 text-center">
                               {d.estado === 'Pendiente' ? (
                                 <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[9px] font-bold uppercase">Deuda</span>
                               ) : (
                                 <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[9px] font-bold uppercase">Saldado</span>
                               )}
                             </td>
                             <td className="py-4 px-2 text-right font-mono font-bold text-sky-700">${Number(d.monto).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                             <td className="py-4 px-2 text-center">
                               <div className="flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                 {d.estado === 'Pendiente' && (
                                   <button onClick={() => saldarDeudaSocio(d.id)} className="text-emerald-600 font-bold text-[9px] uppercase hover:underline" title="Marcar como pagado">Saldar</button>
                                 )}
                                 {/* 🎯 BOTÓN PARA EDITAR DEUDA/APORTE */}
                                 <button onClick={() => cargarParaEditarDeuda(d)} className="text-neutral-400 hover:text-[#415364]" title="Editar">✏️</button>
                                 <button onClick={() => eliminarDeudaSocio(d.id)} className="text-neutral-400 hover:text-[#ea0029]" title="Eliminar permanentemente">🗑️</button>
                               </div>
                             </td>
                           </tr>
                         ))
                       ) : (
                         <tr>
                           <td colSpan={5} className="py-8 text-center text-neutral-400 text-xs italic">No hay aportes ni gastos pendientes registrados.</td>
                         </tr>
                       )}
                     </tbody>
                   </table>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}