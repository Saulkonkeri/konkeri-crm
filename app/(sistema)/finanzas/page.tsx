'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function FinanzasDashboardPage() {
  const [activeTab, setActiveTab] = useState<'resumen' | 'tesoreria' | 'presupuesto' | 'intercompania'>('resumen');
  
  const [mesProyeccion, setMesProyeccion] = useState('2026-12');
  const [cargando, setCargando] = useState(true);

  // ================= ESTADOS DE DATOS Y EDICIÓN =================
  const [editandoMovId, setEditandoMovId] = useState<string | null>(null);
  const [editandoPresupuestoId, setEditandoPresupuestoId] = useState<string | null>(null);
  const [editandoDeudaId, setEditandoDeudaId] = useState<string | null>(null);
  
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [inversionesPorHacer, setInversionesPorHacer] = useState<any[]>([]);
  const [unidadesVendidas, setUnidadesVendidas] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [deudasSocios, setDeudasSocios] = useState<any[]>([]);
  
  const [saldoBancarioReal, setSaldoBancarioReal] = useState<string>(''); // 👈 Inicial vacío
  const [guardandoSaldo, setGuardandoSaldo] = useState(false);

  const [metricas, setMetricas] = useState({
    cajaSistema: 0,
    totalIngresosHistoricos: 0,
    ingresosTesoreria: 0,
    egresosTesoreria: 0,
    cobradoCRM: 0,
    porCobrarCRM: 0,
    presupuestoFuturo: 0,
    comisionesKonkeri: 0, 
    anticiposRealesKonkeri: 0,
    aportesEspeciePendientes: 0,
    totalClientesAbonadoReal: 0
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
    fecha_estimada: new Date().toISOString().split('T')[0]
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
      
      // 🎯 FORZAMOS LA LECTURA DEL SALDO BANCARIO DIRECTO DE SUPABASE
      const { data: config, error: configError } = await supabase.from('finanzas_configuracion').select('valor').eq('id', 'saldo_bancario_real').maybeSingle();

      if (config && config.valor) {
        setSaldoBancarioReal(config.valor); // Cargamos el valor real del servidor
      } else {
        setSaldoBancarioReal('0'); // Si no hay nada, forzamos a 0 para que no se quede en blanco
      }

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

      let inTesoreria = 0;
      let outTesoreria = 0;
      let comKonk = 0;
      let antKonk = 0;
      let reservasManuales = 0;

      movsData.forEach(m => {
        const monto = Number(m.monto);
        if (m.tipo === 'Ingreso') {
          inTesoreria += monto;
          if (m.categoria.includes('Comisiones')) comKonk += monto;
          if (m.categoria.includes('Reserva')) reservasManuales += monto;
        }
        if (m.tipo === 'Egreso') {
          outTesoreria += monto;
          if (m.categoria.includes('Anticipo Operativo')) antKonk += monto;
        }
      });

      let cobradoCRM = 0;
      let porCobrarCRM = 0;
      const limitePresupuesto = `${mesProyeccion}-31`;

      ventasData.forEach(v => {
        if (v.cronograma_pagos && Array.isArray(v.cronograma_pagos)) {
          v.cronograma_pagos.forEach((cuota: any) => {
            const montoCuota = Number(cuota.amount || 0);
            if (cuota.pagado === true) {
              cobradoCRM += montoCuota;
            } else if (cuota.date && cuota.date <= limitePresupuesto) {
              porCobrarCRM += montoCuota;
            }
          });
        }
      });

      const totalIngresosHistoricos = cobradoCRM + inTesoreria;
      const cajaSistema = totalIngresosHistoricos - outTesoreria;
      const totalClientesAbonadoReal = cobradoCRM + reservasManuales;

      const presupuestoFiltrado = presData.filter(p => !p.fecha_estimada || p.fecha_estimada <= limitePresupuesto);
      const presupuestoFuturo = presupuestoFiltrado.reduce((acc, curr) => acc + Number(curr.monto_estimado), 0);

      let sumAportesPendientes = 0;
      deudasData.forEach(d => {
        if (d.estado === 'Pendiente') sumAportesPendientes += Number(d.monto);
      });

      setMetricas({
        cajaSistema,
        totalIngresosHistoricos,
        ingresosTesoreria: inTesoreria,
        egresosTesoreria: outTesoreria,
        cobradoCRM,
        porCobrarCRM,
        presupuestoFuturo,
        comisionesKonkeri: comKonk,
        anticiposRealesKonkeri: antKonk,
        aportesEspeciePendientes: sumAportesPendientes,
        totalClientesAbonadoReal
      });

    } catch (error) {
      console.error("Error cargando finanzas:", error);
    } finally {
      setCargando(false);
    }
  };

  // 🎯 FUNCIÓN CORREGIDA PARA GUARDAR EL SALDO BANCARIO
  const guardarSaldoBancario = async () => {
    setGuardandoSaldo(true);
    try {
      // Usamos onConflict para asegurarnos de que sobrescriba el valor si ya existe el ID
      const { error } = await supabase
        .from('finanzas_configuracion')
        .upsert(
          { id: 'saldo_bancario_real', valor: saldoBancarioReal || '0' },
          { onConflict: 'id' } // 👈 ESTO ES LA CLAVE PARA QUE NO FALLE
        );
      
      if (error) {
        throw error;
      }
      
      alert('¡Saldo bancario guardado correctamente en la nube!');
      // Forzamos una recarga silenciosa para asegurar que el estado está sincronizado
      cargarDatos(); 
    } catch (err: any) {
      console.error("Error guardando saldo:", err);
      alert('Error al guardar el saldo: ' + (err.message || 'Fallo desconocido'));
    } finally {
      setGuardandoSaldo(false);
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
      setDeudaForm({ fecha_registro: new Date().toISOString().split('T')[0], acreedor: 'Konkeri S.A.S.', concepto: '', monto: '' });
      cargarDatos();
    } catch (err) { alert("Error al guardar registro intercompañía."); }
  };

  const cargarParaEditarDeuda = (deuda: any) => {
    setDeudaForm({ fecha_registro: deuda.fecha_registro, acreedor: deuda.acreedor, concepto: deuda.concepto, monto: deuda.monto.toString() });
    setEditandoDeudaId(deuda.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelarEdicionDeuda = () => {
    setEditandoDeudaId(null);
    setDeudaForm({ fecha_registro: new Date().toISOString().split('T')[0], acreedor: 'Konkeri S.A.S.', concepto: '', monto: '' });
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
  const diferenciaConciliacion = bancoReal - metricas.cajaSistema;
  const brechaCobertura = bancoReal - metricas.totalClientesAbonadoReal;

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
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 flex flex-col justify-center">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-2">Caja Real en Bancos</span>
                <span className="text-3xl font-mono font-bold text-[#21242E]">${bancoReal.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
              </div>
              <div className="bg-sky-50/50 p-6 rounded-2xl border border-sky-100 flex flex-col justify-center">
                <span className="text-[10px] font-bold text-sky-800 uppercase tracking-widest block mb-2">Cobrado (Ventas Cerradas)</span>
                <span className="text-2xl font-mono font-bold text-sky-700">${metricas.cobradoCRM.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
              </div>
              <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 flex flex-col justify-center">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest block mb-2">Por Cobrar (Ventas Cerradas)</span>
                <span className="text-2xl font-mono font-bold text-emerald-700">${metricas.porCobrarCRM.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
              </div>
              <div className="bg-[#21242E] p-6 rounded-2xl shadow-md flex flex-col justify-center">
                <span className="text-[10px] font-bold text-[#D1C292] uppercase tracking-widest block mb-2">Balance Proyectado Ventas</span>
                <span className="text-2xl font-mono font-bold text-white">${(metricas.cobradoCRM + metricas.porCobrarCRM).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
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
                      <tr><td colSpan={4} className="py-6 text-center text-neutral-400 text-xs italic">No hay ventas registradas en estatus 'Venta - En Cierre'.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden flex flex-col justify-between">
                  <div className="bg-neutral-50 p-4 border-b border-neutral-200"><h2 className="text-[11px] font-bold text-[#415364] uppercase tracking-widest">Balance General Histórico</h2></div>
                  <div className="p-6 space-y-4">
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex justify-between items-center">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest block">Total Ingresos Totales</span>
                        <span className="text-[9px] text-emerald-600">Todo lo ingresado al proyecto</span>
                      </div>
                      <span className="text-xl font-mono font-bold text-emerald-700">+${metricas.totalIngresosHistoricos.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex justify-between items-center">
                      <div>
                        <span className="text-[10px] font-bold text-[#ea0029] uppercase tracking-widest block">Total Histórico Gastado</span>
                        <span className="text-[9px] text-[#ea0029]/70">Todo el capital utilizado hasta la fecha</span>
                      </div>
                      <span className="text-xl font-mono font-bold text-[#ea0029]">-${metricas.egresosTesoreria.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden flex flex-col justify-between">
                  <div className="bg-neutral-50 p-4 border-b border-neutral-200 flex justify-between items-center">
                    <h2 className="text-[11px] font-bold text-[#415364] uppercase tracking-widest">Presupuestos Futuros</h2>
                    <input type="month" value={mesProyeccion} onChange={e => setMesProyeccion(e.target.value)} className="text-[10px] font-bold text-[#21242E] border border-neutral-300 rounded p-1 outline-none bg-white" />
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 flex justify-between items-center">
                      <div>
                        <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest block">Inversiones Proyectadas</span>
                        <span className="text-[9px] text-amber-600">Obligaciones planificadas hasta {mesProyeccion}</span>
                      </div>
                      <span className="text-xl font-mono font-bold text-amber-700">-${metricas.presupuestoFuturo.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:col-span-1">
                <div className="bg-neutral-900 text-white p-6 rounded-2xl shadow-lg border border-neutral-800 h-full flex flex-col">
                  <span className="text-[10px] font-bold text-[#D1C292] uppercase tracking-widest block mb-4 border-b border-neutral-700 pb-3">Ratio de Cobertura</span>
                  <div className="flex-1 flex flex-col justify-center space-y-5">
                    <div>
                      <span className="text-[9px] text-neutral-400 uppercase tracking-wider block mb-1">Caja Real (En Banco)</span>
                      <span className="text-2xl font-mono font-bold text-white">${bancoReal.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-neutral-400 uppercase tracking-wider block mb-1">Total Abonado (Clientes)</span>
                      <span className="text-2xl font-mono font-bold text-white">${metricas.totalClientesAbonadoReal.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-neutral-700">
                    <span className="text-[9px] text-neutral-400 uppercase tracking-wider block mb-1">Brecha / Diferencia</span>
                    <span className={`text-xl font-mono font-bold ${brechaCobertura >= 0 ? 'text-emerald-400' : 'text-[#ea0029]'}`}>
                      {brechaCobertura >= 0 ? '+' : '-'}${Math.abs(brechaCobertura).toLocaleString('en-US', {minimumFractionDigits: 2})}
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
              
              {/* 🎯 AUDITOR DE CAJA CON BOTÓN GUARDAR (NUBE) */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
                <h2 className="text-[11px] font-bold text-[#21242E] uppercase tracking-widest border-b border-neutral-100 pb-3 mb-4 flex justify-between items-center">
                  <span>Auditor de Caja</span><span>⚖️</span>
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Saldo Real en Bancos Hoy:</label>
                    <div className="flex gap-2">
                      <input type="number" value={saldoBancarioReal} onChange={e => setSaldoBancarioReal(e.target.value)} className="w-full text-xl font-mono font-bold p-3 rounded-lg border border-neutral-300 bg-neutral-50 outline-none" placeholder="0.00" />
                      <button onClick={guardarSaldoBancario} disabled={guardandoSaldo} className="bg-[#21242E] text-white px-4 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-neutral-800 whitespace-nowrap transition-all">
                        {guardandoSaldo ? '...' : 'Guardar'}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold text-neutral-500 uppercase">Saldo Contable (Sistema):</span>
                    <span className="font-mono font-bold text-[#415364]">${metricas.cajaSistema.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
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
                      <select 
                        value={movForm.tipo} 
                        onChange={e => {
                          const nuevoTipo = e.target.value;
                          setMovForm({
                            ...movForm, 
                            tipo: nuevoTipo,
                            categoria: nuevoTipo === 'Ingreso' ? 'Aporte de Socios / Capital' : 'Costos Comerciales (Marketing, Renders)'
                          });
                        }} 
                        className="w-full text-xs font-bold p-2.5 rounded-lg border outline-none"
                      >
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
                          <option>Gastos Legales y Notariales</option>
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
                    <option>Gastos Legales y Notariales</option>
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

        {/* PESTAÑA 4: INTERCOMPAÑÍA & APORTES EN ESPECIE */}
        {activeTab === 'intercompania' && (
          <div className="space-y-8 animate-in fade-in max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm flex flex-col justify-center">
                <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">1. Comisiones Konkeri</span>
                <span className="text-2xl font-mono font-bold text-[#21242E]">${metricas.comisionesKonkeri.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
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
                <span className="text-2xl font-mono font-bold text-white">${(metricas.comisionesKonkeri - metricas.anticiposRealesKonkeri + metricas.aportesEspeciePendientes).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
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
                    <input type="text" required value={deudaForm.concepto} onChange={e => setDeudaForm({...deudaForm, concepto: e.target.value})} placeholder="Ej: Comisión Ganada Unidad 1, Pago Notaría..." className="w-full text-xs p-2.5 rounded-lg border outline-none" />
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