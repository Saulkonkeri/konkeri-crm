'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

export default function CobranzasPage() {
  const [activeTab, setActiveTab] = useState<'estado_cuenta' | 'historial'>('estado_cuenta');
  const [ventas, setVentas] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  // Selección y filtros
  const [ventaSeleccionadaId, setVentaSeleccionadaId] = useState('');
  const [busquedaAuditoria, setBusquedaAuditoria] = useState('');

  // Modal de Cobro / Edición de Recibo
  const [modalPago, setModalPago] = useState<{
    modo: 'cobrar' | 'editar';
    venta: any;
    cuota: any;
  } | null>(null);

  const [pagoForm, setPagoForm] = useState({
    metodo: 'Transferencia Bancaria',
    banco: '',
    referencia: '',
    fecha_pago: new Date().toISOString().split('T')[0],
    monto: ''
  });
  const [procesando, setProcesando] = useState(false);

  // Recibo activo para vista/impresión (funciona desde ambas pestañas)
  const [reciboGenerado, setReciboGenerado] = useState<any | null>(null);

  useEffect(() => {
    cargarDatosGenerales();
  }, []);

  const cargarDatosGenerales = async () => {
    setCargando(true);
    try {
      const { data: vts } = await supabase
        .from('cotizaciones')
        .select('*')
        .eq('estado', 'Venta - En Cierre')
        .order('created_at', { ascending: false });

      const { data: clis } = await supabase.from('clientes').select('*');

      if (vts) setVentas(vts);
      if (clis) setClientes(clis);
    } catch (error) {
      console.error(error);
    } finally {
      setCargando(false);
    }
  };

  const ventaActiva = ventas.find(v => v.id.toString() === ventaSeleccionadaId);
  const clienteActivo = ventaActiva ? clientes.find(c => c.id === ventaActiva.cliente_id) : null;

  const hoyIso = new Date().toISOString().split('T')[0];

  const formatearFecha = (fechaIso: string) => {
    if (!fechaIso) return '---';
    const partes = fechaIso.split('-');
    if (partes.length !== 3) return fechaIso;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  const esCuotaVencida = (cuota: any) => {
    if (cuota.pagado === true || !cuota.date) return false;
    return cuota.date < hoyIso;
  };

  // Resumen financiero de la venta seleccionada
  const resumenVentaActiva = useMemo(() => {
    if (!ventaActiva || !Array.isArray(ventaActiva.cronograma_pagos)) {
      return { totalCobrado: 0, saldoPendiente: ventaActiva?.precio_total || 0, porcentaje: 0, vencidas: 0 };
    }
    const cronograma = ventaActiva.cronograma_pagos;
    const totalCobrado = cronograma
      .filter((c: any) => c.pagado === true)
      .reduce((acc: number, c: any) => acc + Number(c.datos_pago?.monto_cobrado ?? c.amount ?? 0), 0);
    const totalNegocio = Number(ventaActiva.precio_total || 0);
    const saldoPendiente = Math.max(0, totalNegocio - totalCobrado);
    const porcentaje = totalNegocio > 0 ? Math.min(100, Math.round((totalCobrado / totalNegocio) * 100)) : 0;
    const vencidas = cronograma.filter((c: any) => esCuotaVencida(c)).length;

    return { totalCobrado, saldoPendiente, porcentaje, vencidas };
  }, [ventaActiva]);

  // Lista global de todos los recibos para la pestaña Auditoría Recibos
  const todosLosRecibos = useMemo(() => {
    const lista: any[] = [];
    ventas.forEach(v => {
      const cli = clientes.find(c => c.id === v.cliente_id);
      const cronograma = Array.isArray(v.cronograma_pagos) ? v.cronograma_pagos : [];
      cronograma.forEach((cuota: any) => {
        if (cuota.pagado === true && cuota.datos_pago) {
          lista.push({
            venta: v,
            cliente: cli,
            cuota,
            datos_pago: cuota.datos_pago
          });
        }
      });
    });

    // Ordenar del cobro más reciente al más antiguo
    lista.sort((a, b) => {
      const fA = a.datos_pago.fecha_pago_real || '';
      const fB = b.datos_pago.fecha_pago_real || '';
      return fB.localeCompare(fA);
    });

    return lista;
  }, [ventas, clientes]);

  const recibosFiltrados = useMemo(() => {
    const q = busquedaAuditoria.trim().toLowerCase();
    if (!q) return todosLosRecibos;
    return todosLosRecibos.filter(item => {
      const nombreCliente = item.cliente ? `${item.cliente.nombres} ${item.cliente.apellidos || ''}`.toLowerCase() : '';
      const reciboId = (item.datos_pago.recibo_id || '').toLowerCase();
      const banco = (item.datos_pago.banco || '').toLowerCase();
      const ref = (item.datos_pago.referencia || '').toLowerCase();
      const unidad = String(item.venta.unidad_numero || '').toLowerCase();
      const concepto = (item.cuota.label || '').toLowerCase();
      return (
        nombreCliente.includes(q) ||
        reciboId.includes(q) ||
        banco.includes(q) ||
        ref.includes(q) ||
        unidad.includes(q) ||
        concepto.includes(q)
      );
    });
  }, [todosLosRecibos, busquedaAuditoria]);

  const totalAuditado = useMemo(() => {
    return recibosFiltrados.reduce((acc, item) => acc + Number(item.datos_pago.monto_cobrado || 0), 0);
  }, [recibosFiltrados]);

  const abrirModalPago = (venta: any, cuota: any) => {
    if (cuota.pagado) return;
    setModalPago({ modo: 'cobrar', venta, cuota });
    setReciboGenerado(null);
    setPagoForm({
      metodo: 'Transferencia Bancaria',
      banco: '',
      referencia: '',
      fecha_pago: new Date().toISOString().split('T')[0],
      monto: String(cuota.amount ?? '')
    });
  };

  const abrirModalEditarRecibo = (venta: any, cuota: any) => {
    if (!cuota.pagado || !cuota.datos_pago) return;
    setModalPago({ modo: 'editar', venta, cuota });
    setPagoForm({
      metodo: cuota.datos_pago.metodo || 'Transferencia Bancaria',
      banco: cuota.datos_pago.banco || '',
      referencia: cuota.datos_pago.referencia || '',
      fecha_pago: cuota.datos_pago.fecha_pago_real || new Date().toISOString().split('T')[0],
      monto: String(cuota.datos_pago.monto_cobrado ?? cuota.amount ?? '')
    });
  };

  const seleccionarReciboParaVer = (venta: any, cuota: any, cliente?: any) => {
    const cli = cliente || clientes.find(c => c.id === venta.cliente_id);
    setReciboGenerado({
      ...cuota.datos_pago,
      label_cuota: cuota.label,
      fecha_proyectada: cuota.date,
      unidad_numero: venta.unidad_numero || 'N/A',
      cliente_nombre: cli ? `${cli.nombres} ${cli.apellidos || ''}`.trim() : 'Cliente',
      cliente_identificacion: cli?.cedula || cli?.identificacion || '_______________'
    });
  };

  const guardarPagoOEdicion = async () => {
    if (!modalPago) return;
    if (!pagoForm.referencia && pagoForm.metodo !== 'Efectivo') {
      alert("La referencia del documento es obligatoria para transferencias/cheques.");
      return;
    }

    const montoNumerico = parseFloat(pagoForm.monto);
    if (isNaN(montoNumerico) || montoNumerico <= 0) {
      alert("Ingresa un monto válido mayor a 0.");
      return;
    }

    setProcesando(true);
    try {
      const { venta, cuota, modo } = modalPago;
      const cronogramaActualizado = [...venta.cronograma_pagos];
      const index = cronogramaActualizado.findIndex((c: any) => c.id === cuota.id);
      if (index === -1) throw new Error("Cuota no encontrada en el cronograma");

      const reciboId =
        modo === 'editar' && cuota.datos_pago?.recibo_id
          ? cuota.datos_pago.recibo_id
          : `REC-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

      const datosPagoActualizados = {
        recibo_id: reciboId,
        fecha_pago_real: pagoForm.fecha_pago,
        metodo: pagoForm.metodo,
        banco: pagoForm.metodo === 'Efectivo' ? '' : pagoForm.banco.trim(),
        referencia: pagoForm.referencia.trim(),
        monto_cobrado: montoNumerico,
        ...(modo === 'editar' ? { editado_en: new Date().toISOString() } : {})
      };

      cronogramaActualizado[index] = {
        ...cronogramaActualizado[index],
        pagado: true,
        datos_pago: datosPagoActualizados
      };

      const { error } = await supabase
        .from('cotizaciones')
        .update({ cronograma_pagos: cronogramaActualizado })
        .eq('id', venta.id);

      if (error) throw error;

      const ventasActualizadas = ventas.map(v =>
        v.id === venta.id ? { ...v, cronograma_pagos: cronogramaActualizado } : v
      );
      setVentas(ventasActualizadas);

      const ventaActualizada = { ...venta, cronograma_pagos: cronogramaActualizado };
      seleccionarReciboParaVer(ventaActualizada, cronogramaActualizado[index]);

      setModalPago(null);
      alert(modo === 'editar' ? "✅ Recibo actualizado correctamente." : "✅ Cobro registrado exitosamente en el Estado de Cuenta.");
    } catch (err: any) {
      alert(`Error al procesar: ${err.message}`);
    } finally {
      setProcesando(false);
    }
  };

  const anularCobro = async () => {
    if (!modalPago || modalPago.modo !== 'editar') return;
    const confirmar = window.confirm(
      `¿Seguro que deseas ANULAR el recibo ${modalPago.cuota.datos_pago?.recibo_id}? La cuota volverá a estado Pendiente.`
    );
    if (!confirmar) return;

    setProcesando(true);
    try {
      const { venta, cuota } = modalPago;
      const cronogramaActualizado = [...venta.cronograma_pagos];
      const index = cronogramaActualizado.findIndex((c: any) => c.id === cuota.id);
      if (index === -1) throw new Error("Cuota no encontrada");

      const { datos_pago, ...restoCuota } = cronogramaActualizado[index];
      cronogramaActualizado[index] = {
        ...restoCuota,
        pagado: false,
        datos_pago: null
      };

      const { error } = await supabase
        .from('cotizaciones')
        .update({ cronograma_pagos: cronogramaActualizado })
        .eq('id', venta.id);

      if (error) throw error;

      setVentas(prev => prev.map(v => (v.id === venta.id ? { ...v, cronograma_pagos: cronogramaActualizado } : v)));
      if (reciboGenerado?.recibo_id === cuota.datos_pago?.recibo_id) {
        setReciboGenerado(null);
      }
      setModalPago(null);
      alert("Recibo anulado. La cuota volvió a estado Pendiente.");
    } catch (err: any) {
      alert(`Error al anular cobro: ${err.message}`);
    } finally {
      setProcesando(false);
    }
  };

  const enviarRecordatorioWhatsApp = (cuota: any) => {
    if (!clienteActivo?.telefono) {
      alert("Este cliente no tiene teléfono registrado.");
      return;
    }
    let num = clienteActivo.telefono.replace(/\D/g, '');
    if (num.startsWith('09') && num.length === 10) num = '593' + num.substring(1);
    else if (num.length === 9 && num.startsWith('9')) num = '593' + num;

    const vencida = esCuotaVencida(cuota);
    const montoStr = Number(cuota.amount).toLocaleString('en-US', { minimumFractionDigits: 2 });
    const texto = vencida
      ? `Hola ${clienteActivo.nombres}, le saludamos del departamento de Cobranzas de Arienzo Living. Le recordamos que su cuota "${cuota.label}" del Dpto. ${ventaActiva?.unidad_numero || ''} por $${montoStr} tenía fecha límite el ${formatearFecha(cuota.date)}. Si ya realizó la transferencia, por favor compártanos el comprobante para emitir su recibo oficial.`
      : `Hola ${clienteActivo.nombres}, le saludamos de Arienzo Living. Le recordamos que su próxima cuota "${cuota.label}" del Dpto. ${ventaActiva?.unidad_numero || ''} por $${montoStr} vence el ${formatearFecha(cuota.date)}. Quedamos atentos a su comprobante para emitir su recibo oficial.`;

    window.open(`https://wa.me/${num}?text=${encodeURIComponent(texto)}`, '_blank');
  };

  const imprimirRecibo = () => {
    const contenido = document.getElementById('plantilla-recibo-cobro')?.innerHTML;
    if (!contenido) return;
    const ventana = window.open('', '_blank');
    if (!ventana) return;
    ventana.document.write(`
      <html>
        <head>
          <title>Recibo_Cobro_${reciboGenerado?.recibo_id}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @page { size: A4 portrait; margin: 0; }
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; margin: 0; background: #ffffff; font-family: ui-sans-serif, system-ui, sans-serif; }
            .pagina-a4 { width: 210mm !important; height: 297mm !important; padding: 15mm; box-sizing: border-box; position: relative; margin: 0 auto; }
          </style>
        </head>
        <body>${contenido}<script>setTimeout(() => { window.print(); window.close(); }, 700);</script></body>
      </html>
    `);
    ventana.document.close();
  };

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#dce3eb]">
        <p className="text-sm font-bold tracking-widest text-[#ea0029] uppercase animate-pulse">Sincronizando Cartera...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#dce3eb] p-4 md:p-8 font-sans text-[#415364]">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* CABECERA COBRANZAS */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#415364]/10 pb-6 gap-4">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-[#ea0029] uppercase block">Control Financiero Arienzo</span>
            <h1 className="text-3xl font-bold tracking-tight text-[#415364] mt-1">Módulo de Cobranzas</h1>
          </div>

          <div className="flex bg-[#dce3eb]/50 p-1.5 rounded-xl border border-[#415364]/10 shadow-inner gap-1">
            <button
              onClick={() => setActiveTab('estado_cuenta')}
              className={`px-5 py-2.5 text-xs font-bold tracking-wider uppercase rounded-lg transition-all ${activeTab === 'estado_cuenta' ? 'bg-white text-[#ea0029] shadow-sm' : 'text-[#415364]/70 hover:text-[#415364]'}`}
            >
              Estado de Cuenta
            </button>
            <button
              onClick={() => setActiveTab('historial')}
              className={`px-5 py-2.5 text-xs font-bold tracking-wider uppercase rounded-lg transition-all flex items-center gap-2 ${activeTab === 'historial' ? 'bg-white text-[#ea0029] shadow-sm' : 'text-[#415364]/70 hover:text-[#415364]'}`}
            >
              Auditoría Recibos
              <span className="bg-[#415364] text-white text-[9px] px-1.5 py-0.5 rounded-full">{todosLosRecibos.length}</span>
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* PESTAÑA 1: ESTADO DE CUENTA                                  */}
        {/* ============================================================ */}
        {activeTab === 'estado_cuenta' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
            {/* PANEL IZQUIERDO: SELECCIÓN Y RESUMEN */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-neutral-200/60 p-6 shadow-sm">
                <label className="text-[10px] font-bold text-[#415364]/60 uppercase block mb-2">Seleccionar Venta a Cobrar</label>
                <select
                  value={ventaSeleccionadaId}
                  onChange={(e) => { setVentaSeleccionadaId(e.target.value); setReciboGenerado(null); }}
                  className="w-full bg-[#F9F7F5] border border-neutral-200 rounded-xl p-3 text-sm font-bold focus:border-[#ea0029] outline-none"
                >
                  <option value="">— Buscar Venta en Firme —</option>
                  {ventas.map(v => {
                    const c = clientes.find(cl => cl.id === v.cliente_id);
                    return (
                      <option key={v.id} value={v.id}>
                        Dpto {v.unidad_numero || 'N/A'} - {c ? `${c.nombres} ${c.apellidos || ''}` : 'Sin Cliente'}
                      </option>
                    );
                  })}
                </select>
              </div>

              {ventaActiva && clienteActivo && (
                <div className="bg-[#21242E] rounded-2xl border border-neutral-800 p-6 shadow-xl text-white space-y-5">
                  <div>
                    <h3 className="text-[10px] text-[#D1C292] font-bold uppercase tracking-widest mb-4 border-b border-white/10 pb-2">
                      Resumen de Cartera
                    </h3>
                    <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between gap-2">
                        <span className="text-white/60">Cliente:</span>
                        <span className="font-bold text-right">{clienteActivo.nombres} {clienteActivo.apellidos}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Unidad:</span>
                        <span className="font-bold text-[#D1C292]">Dpto. {ventaActiva.unidad_numero || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">C.I / RUC:</span>
                        <span className="font-mono">{clienteActivo.cedula || clienteActivo.identificacion || '---'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Estatus:</span>
                        <span className="font-bold text-[#ea0029]">{ventaActiva.estado}</span>
                      </div>
                    </div>
                  </div>

                  {/* PROGRESO DE COBRANZA */}
                  <div className="pt-4 border-t border-white/10 space-y-3">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-white/60 uppercase font-bold tracking-wider">Avance de Pago</span>
                      <span className="font-mono font-bold text-[#D1C292]">{resumenVentaActiva.porcentaje}%</span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#D1C292] to-emerald-400 rounded-full transition-all duration-500"
                        style={{ width: `${resumenVentaActiva.porcentaje}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                        <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider block">Cobrado</span>
                        <span className="font-mono font-bold text-sm text-white">
                          ${resumenVentaActiva.totalCobrado.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                        <span className="text-[9px] text-amber-300 font-bold uppercase tracking-wider block">Saldo Pendiente</span>
                        <span className="font-mono font-bold text-sm text-white">
                          ${resumenVentaActiva.saldoPendiente.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    {resumenVentaActiva.vencidas > 0 && (
                      <div className="bg-[#ea0029]/20 border border-[#ea0029]/40 rounded-xl px-3 py-2 text-[11px] font-bold text-red-200 flex justify-between items-center">
                        <span>⚠️ Cuotas Atrasadas</span>
                        <span className="bg-[#ea0029] text-white px-2 py-0.5 rounded-md font-mono">{resumenVentaActiva.vencidas}</span>
                      </div>
                    )}

                    <div className="pt-3 border-t border-white/10 flex justify-between items-center">
                      <span className="text-[10px] font-bold text-white/60 uppercase">Valor Total Negocio</span>
                      <span className="font-mono font-bold text-lg">
                        ${(ventaActiva.precio_total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* PANEL DERECHO: CRONOGRAMA DE PAGOS */}
            <div className="lg:col-span-2">
              {ventaActiva ? (
                <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-sm overflow-hidden flex flex-col h-[620px]">
                  <div className="p-5 border-b border-neutral-100 flex justify-between items-center bg-neutral-50">
                    <h2 className="text-xs font-bold text-[#ea0029] uppercase tracking-widest">Cronograma Oficial de Pagos</h2>
                    <span className="text-[10px] font-bold text-[#415364]/60 uppercase">
                      {(ventaActiva.cronograma_pagos || []).length} cuotas
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                    {ventaActiva.cronograma_pagos && ventaActiva.cronograma_pagos.length > 0 ? (
                      <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 bg-white shadow-sm z-10 text-[10px] text-neutral-500 uppercase tracking-wider">
                          <tr>
                            <th className="px-4 py-3">Concepto</th>
                            <th className="px-4 py-3 text-center">Fecha Límite</th>
                            <th className="px-4 py-3 text-right">Monto</th>
                            <th className="px-4 py-3 text-center">Estado</th>
                            <th className="px-4 py-3 text-center">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {ventaActiva.cronograma_pagos.map((cuota: any) => {
                            const estaPagado = cuota.pagado === true;
                            const esVencida = esCuotaVencida(cuota);
                            const montoMostrar = estaPagado
                              ? Number(cuota.datos_pago?.monto_cobrado ?? cuota.amount)
                              : Number(cuota.amount);

                            return (
                              <tr
                                key={cuota.id}
                                className={`hover:bg-neutral-50 transition-colors ${estaPagado ? 'bg-[#D1C292]/5' : esVencida ? 'bg-red-50/50' : ''}`}
                              >
                                <td className={`px-4 py-3 font-bold ${estaPagado ? 'text-neutral-500' : 'text-[#415364]'}`}>
                                  <div>{cuota.label}</div>
                                  {estaPagado && cuota.datos_pago && (
                                    <div className="text-[10px] font-normal text-neutral-400 mt-0.5">
                                      {cuota.datos_pago.recibo_id} · {cuota.datos_pago.banco || cuota.datos_pago.metodo}
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center font-mono text-neutral-500">
                                  {formatearFecha(cuota.date)}
                                </td>
                                <td className={`px-4 py-3 text-right font-mono font-bold ${estaPagado ? 'text-neutral-500' : 'text-[#415364]'}`}>
                                  ${montoMostrar.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {estaPagado ? (
                                    <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider">Cobrado</span>
                                  ) : esVencida ? (
                                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider">Atrasado</span>
                                  ) : (
                                    <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider">Pendiente</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {!estaPagado ? (
                                    <div className="flex items-center justify-center gap-1.5">
                                      <button
                                        onClick={() => abrirModalPago(ventaActiva, cuota)}
                                        className="bg-[#21242E] text-white px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest hover:bg-[#ea0029] transition-colors shadow-sm"
                                      >
                                        Cobrar
                                      </button>
                                      <button
                                        onClick={() => enviarRecordatorioWhatsApp(cuota)}
                                        className="p-1.5 rounded-md bg-[#25D366]/15 text-[#128C7E] hover:bg-[#25D366] hover:text-white transition-colors"
                                        title="Enviar recordatorio por WhatsApp"
                                      >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-center gap-2">
                                      <button
                                        onClick={() => seleccionarReciboParaVer(ventaActiva, cuota, clienteActivo)}
                                        className="p-1.5 rounded-md bg-neutral-100 text-[#415364] hover:bg-[#21242E] hover:text-white transition-colors"
                                        title="Ver / Imprimir Recibo"
                                      >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                      </button>
                                      <button
                                        onClick={() => abrirModalEditarRecibo(ventaActiva, cuota)}
                                        className="p-1.5 rounded-md bg-amber-50 text-amber-700 hover:bg-amber-500 hover:text-white transition-colors"
                                        title="Editar datos del recibo"
                                      >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-neutral-400 p-10 text-center">
                        <p className="text-sm font-bold uppercase tracking-widest">Operación sin cronograma</p>
                        <p className="text-xs mt-2">Esta venta fue registrada sin un flujo de caja. Vuelve al Gestor, cárgala desde el historial, genérale las cuotas y guárdala de nuevo.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-sm h-full flex flex-col items-center justify-center p-10 text-center min-h-[420px]">
                  <div className="w-16 h-16 bg-[#F9F7F5] rounded-full flex items-center justify-center mb-4 border border-neutral-200">
                    <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  </div>
                  <h3 className="text-sm font-bold text-[#415364] uppercase tracking-widest">Sin Venta Seleccionada</h3>
                  <p className="text-xs text-neutral-500 mt-2 max-w-xs">Seleccione una venta en firme en el panel izquierdo para visualizar su cronograma y procesar cobros.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* PESTAÑA 2: AUDITORÍA DE RECIBOS (HISTORIAL GLOBAL)           */}
        {/* ============================================================ */}
        {activeTab === 'historial' && (
          <div className="space-y-5 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 bg-white rounded-2xl border border-neutral-200/60 p-4 shadow-sm flex items-center">
                <div className="relative w-full">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#415364]/40">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </span>
                  <input
                    type="text"
                    value={busquedaAuditoria}
                    onChange={(e) => setBusquedaAuditoria(e.target.value)}
                    placeholder="Buscar por N° recibo, cliente, departamento, banco o referencia..."
                    className="w-full bg-[#F9F7F5] border border-neutral-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-[#415364] outline-none focus:border-[#ea0029]"
                  />
                </div>
              </div>

              <div className="bg-[#21242E] text-white rounded-2xl p-4 shadow-sm flex items-center justify-between px-6">
                <div>
                  <span className="text-[9px] font-bold text-[#D1C292] uppercase tracking-widest block">Total Recaudado</span>
                  <span className="text-xs text-white/60">{recibosFiltrados.length} {recibosFiltrados.length === 1 ? 'recibo' : 'recibos'}</span>
                </div>
                <span className="font-mono font-bold text-xl text-white">
                  ${totalAuditado.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-sm overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-xs min-w-[850px]">
                  <thead className="bg-[#21242E] text-white text-[10px] uppercase tracking-widest">
                    <tr>
                      <th className="px-5 py-4">N° Recibo</th>
                      <th className="px-5 py-4">Fecha Cobro</th>
                      <th className="px-5 py-4">Cliente / Unidad</th>
                      <th className="px-5 py-4">Concepto</th>
                      <th className="px-5 py-4">Banco / Referencia</th>
                      <th className="px-5 py-4 text-right">Monto</th>
                      <th className="px-5 py-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {recibosFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-neutral-400 font-bold uppercase tracking-widest text-[10px]">
                          No se encontraron recibos registrados.
                        </td>
                      </tr>
                    ) : (
                      recibosFiltrados.map((item, idx) => (
                        <tr key={`${item.venta.id}-${item.cuota.id}-${idx}`} className="hover:bg-[#dce3eb]/25 transition-colors">
                          <td className="px-5 py-4 font-mono font-bold text-[#ea0029] whitespace-nowrap">
                            {item.datos_pago.recibo_id}
                          </td>
                          <td className="px-5 py-4 font-mono text-neutral-600 whitespace-nowrap">
                            {formatearFecha(item.datos_pago.fecha_pago_real)}
                          </td>
                          <td className="px-5 py-4">
                            <div className="font-bold text-[#415364]">
                              {item.cliente ? `${item.cliente.nombres} ${item.cliente.apellidos || ''}` : 'Sin Cliente'}
                            </div>
                            <span className="inline-block text-[9px] font-bold uppercase tracking-wider bg-[#415364]/10 text-[#415364] px-2 py-0.5 rounded mt-1">
                              Dpto. {item.venta.unidad_numero || 'N/A'}
                            </span>
                          </td>
                          <td className="px-5 py-4 font-medium text-[#415364]">
                            {item.cuota.label}
                          </td>
                          <td className="px-5 py-4">
                            <div className="font-bold text-[#415364]">{item.datos_pago.banco || item.datos_pago.metodo}</div>
                            <div className="text-[10px] font-mono text-neutral-500">
                              {item.datos_pago.metodo} · Ref: {item.datos_pago.referencia || 'N/A'}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                            ${Number(item.datos_pago.monto_cobrado || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => seleccionarReciboParaVer(item.venta, item.cuota, item.cliente)}
                                className="px-3 py-1.5 rounded-lg bg-[#21242E] text-white text-[10px] font-bold uppercase tracking-wider hover:bg-black transition-colors"
                              >
                                Ver
                              </button>
                              <button
                                onClick={() => abrirModalEditarRecibo(item.venta, item.cuota)}
                                className="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider hover:bg-amber-500 hover:text-white transition-colors"
                              >
                                Editar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE COBRO O EDICIÓN DE RECIBO */}
        {modalPago && (
          <div className="fixed inset-0 bg-[#415364]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
              <div className="bg-[#21242E] p-5 flex justify-between items-center text-white">
                <div>
                  <h3 className="text-[10px] font-bold text-[#D1C292] uppercase tracking-widest">
                    {modalPago.modo === 'editar'
                      ? `Editar Recibo ${modalPago.cuota.datos_pago?.recibo_id}`
                      : 'Procesar Ingreso de Caja'}
                  </h3>
                  <p className="text-sm font-bold">{modalPago.cuota.label}</p>
                </div>
                <button onClick={() => setModalPago(null)} className="text-white/50 hover:text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div className="bg-[#F9F7F5] border border-neutral-200 p-4 rounded-xl text-center">
                  <label className="text-[10px] uppercase font-bold text-neutral-500 block mb-1">
                    {modalPago.modo === 'editar' ? 'Monto Cobrado (USD)' : 'Valor a Cobrar (USD)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={pagoForm.monto}
                    onChange={(e) => setPagoForm({ ...pagoForm, monto: e.target.value })}
                    className="w-full text-center text-3xl font-mono font-bold text-[#ea0029] bg-transparent outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-[#415364]/60 uppercase block mb-1.5">Método de Ingreso</label>
                    <select
                      value={pagoForm.metodo}
                      onChange={(e) => setPagoForm({ ...pagoForm, metodo: e.target.value })}
                      className="w-full text-xs bg-white border border-neutral-300 p-3 rounded-xl outline-none font-bold text-[#415364] focus:border-[#ea0029]"
                    >
                      <option>Transferencia Bancaria</option>
                      <option>Depósito en Cuenta</option>
                      <option>Cheque Certificado</option>
                      <option>Efectivo</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#415364]/60 uppercase block mb-1.5">Fecha de Ingreso</label>
                    <input
                      type="date"
                      value={pagoForm.fecha_pago}
                      onChange={(e) => setPagoForm({ ...pagoForm, fecha_pago: e.target.value })}
                      className="w-full text-xs p-3 border border-neutral-300 rounded-xl outline-none focus:border-[#ea0029] font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#415364]/60 uppercase block mb-1.5">Banco Origen</label>
                    <input
                      type="text"
                      placeholder="Ej. Pichincha"
                      value={pagoForm.banco}
                      onChange={(e) => setPagoForm({ ...pagoForm, banco: e.target.value })}
                      className="w-full text-xs p-3 border border-neutral-300 rounded-xl outline-none focus:border-[#ea0029]"
                      disabled={pagoForm.metodo === 'Efectivo'}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-[#415364]/60 uppercase block mb-1.5">Referencia / Comprobante</label>
                    <input
                      type="text"
                      placeholder="Obligatorio para transferencias..."
                      value={pagoForm.referencia}
                      onChange={(e) => setPagoForm({ ...pagoForm, referencia: e.target.value })}
                      className="w-full text-xs p-3 border border-neutral-300 rounded-xl outline-none focus:border-[#ea0029] font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2.5 pt-1">
                  <button
                    onClick={guardarPagoOEdicion}
                    disabled={procesando}
                    className="w-full bg-[#ea0029] text-white py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest shadow-md hover:bg-[#c90022] transition-colors disabled:opacity-50"
                  >
                    {procesando
                      ? 'Guardando en Nube...'
                      : modalPago.modo === 'editar'
                        ? 'Guardar Cambios del Recibo'
                        : 'Confirmar Cobro y Generar Recibo'}
                  </button>

                  {modalPago.modo === 'editar' && (
                    <button
                      onClick={anularCobro}
                      disabled={procesando}
                      className="w-full py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
                    >
                      Anular Cobro (Volver a Pendiente)
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PANEL FLOTANTE CUANDO SE GENERA/VE UN RECIBO */}
        {reciboGenerado && (
          <div className="bg-[#21242E] rounded-2xl border border-[#D1C292] p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-bottom">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#D1C292]/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-[#D1C292]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <div>
                <span className="text-[#D1C292] font-bold text-[10px] uppercase tracking-widest block mb-0.5">
                  Recibo Listo · {reciboGenerado.cliente_nombre} (Dpto. {reciboGenerado.unidad_numero})
                </span>
                <p className="text-sm font-bold text-white">Comprobante N° {reciboGenerado.recibo_id}</p>
                <p className="text-[10px] text-white/60 font-mono mt-1">
                  {reciboGenerado.banco || reciboGenerado.metodo} · Ref: {reciboGenerado.referencia || 'N/A'} · ${Number(reciboGenerado.monto_cobrado).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <button
                onClick={() => setReciboGenerado(null)}
                className="flex-1 md:flex-none px-6 py-3 border border-white/20 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={imprimirRecibo}
                className="flex-1 md:flex-none px-6 py-3 bg-[#D1C292] text-[#21242E] rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-colors shadow-lg flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                Imprimir Recibo Oficial
              </button>
            </div>
          </div>
        )}

        {/* PLANTILLA OCULTA: RECIBO DE COBRANZA */}
        {reciboGenerado && (
          <div id="plantilla-recibo-cobro" className="hidden">
            <div className="pagina-a4">
              <div className="flex justify-between items-end border-b-2 border-[#B94A36] pb-4 mb-8">
                <div>
                  <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/arienzo-logo-terracota.svg" alt="Arienzo" className="h-10 mb-2 object-contain" />
                  <p className="text-[8px] tracking-widest text-[#8C8A87] uppercase font-bold">RUC: 1391940037001</p>
                </div>
                <div className="text-right">
                  <h1 className="text-lg font-light text-[#B94A36] tracking-widest uppercase">Recibo de Caja</h1>
                  <p className="text-xs font-mono font-bold mt-1">N° {reciboGenerado.recibo_id}</p>
                </div>
              </div>

              <div className="bg-white border border-[#EAE3DC] p-6 rounded-md shadow-sm">
                <div className="flex justify-between items-center border-b border-[#EAE3DC] pb-4 mb-4">
                  <span className="text-[10px] uppercase font-bold text-[#8C8A87] tracking-wider">Fecha de Cobro:</span>
                  <span className="text-sm font-medium font-mono">{formatearFecha(reciboGenerado.fecha_pago_real)}</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#EAE3DC] pb-4 mb-4">
                  <span className="text-[10px] uppercase font-bold text-[#8C8A87] tracking-wider">Importe Recibido:</span>
                  <span className="text-xl font-mono font-bold text-[#B94A36]">
                    ${Number(reciboGenerado.monto_cobrado).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-[#EAE3DC] pb-4 mb-4">
                  <span className="text-[10px] uppercase font-bold text-[#8C8A87] tracking-wider">Recibimos de:</span>
                  <span className="text-sm font-bold uppercase">{reciboGenerado.cliente_nombre}</span>
                </div>
                <div className="flex flex-col border-b border-[#EAE3DC] pb-4 mb-4">
                  <span className="text-[10px] uppercase font-bold text-[#8C8A87] tracking-wider mb-2">Por Concepto de:</span>
                  <span className="text-sm font-bold text-[#333333] mb-3">{reciboGenerado.label_cuota}</span>
                  <div className="grid grid-cols-2 gap-3 bg-[#FCFBFA] border border-[#EAE3DC] p-3 rounded-md">
                    <div>
                      <span className="text-[8px] uppercase font-bold text-[#8C8A87] block mb-0.5">Proyecto</span>
                      <span className="text-xs font-bold text-[#333333]">Arienzo Living</span>
                    </div>
                    <div>
                      <span className="text-[8px] uppercase font-bold text-[#8C8A87] block mb-0.5">Unidad Inmobiliaria</span>
                      <span className="text-xs font-bold text-[#333333]">Dpto. {reciboGenerado.unidad_numero}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 bg-[#F2EFEB] p-4 rounded-md">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-[#8C8A87] block mb-1">Método de Ingreso:</span>
                    <span className="text-[11px] font-medium">{reciboGenerado.metodo}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-[#8C8A87] block mb-1">Entidad Bancaria:</span>
                    <span className="text-[11px] font-medium">{reciboGenerado.banco || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-[#8C8A87] block mb-1">Ref / Documento:</span>
                    <span className="text-[11px] font-mono font-medium">{reciboGenerado.referencia || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-neutral-50 border border-neutral-200 rounded-md text-[6.5pt] leading-tight text-justify text-neutral-500">
                <p><strong>Nota importante / Condiciones de Cobro:</strong> Declaramos haber recibido los fondos especificados en este documento, sujetos a la confirmación y liquidación efectiva por parte de la entidad bancaria respectiva. La emisión de este recibo no exime al cliente de las obligaciones de pago estipuladas en su Contrato o Promesa de Compraventa, en caso de que el medio de transacción reporte rechazo por fondos insuficientes, cuentas cerradas o defectos de forma detectados posteriormente por las entidades financieras compensadoras.</p>
              </div>

              <div className="mt-16 grid grid-cols-2 gap-16 px-12">
                <div className="text-center border-t border-[#8C8A87] pt-2">
                  <p className="text-[9px] font-bold uppercase tracking-wider">{reciboGenerado.cliente_nombre}</p>
                  <p className="text-[8px] text-[#8C8A87]">C.I / RUC: {reciboGenerado.cliente_identificacion}</p>
                  <p className="text-[7px] text-[#8C8A87] mt-1 uppercase tracking-widest">Titular / Entregué Conforme</p>
                </div>
                <div className="text-center border-t border-[#8C8A87] pt-2">
                  <p className="text-[9px] font-bold uppercase tracking-wider">Arienzo S.A.S.</p>
                  <p className="text-[8px] text-[#8C8A87]">RUC: 1391940037001</p>
                  <p className="text-[7px] text-[#8C8A87] mt-1 uppercase tracking-widest">Recibí Conforme / Depto. Cobranzas</p>
                </div>
              </div>

              <div className="absolute bottom-6 left-0 right-0 text-center text-[7px] text-[#8C8A87] uppercase tracking-widest">
                Arienzo S.A.S. • Ecosistema Konkeri • Copia Cliente • Documento Válido para Fines Comerciales
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}