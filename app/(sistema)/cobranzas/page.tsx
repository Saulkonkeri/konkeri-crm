'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function CobranzasPage() {
  const [activeTab, setActiveTab] = useState<'estado_cuenta' | 'historial'>('estado_cuenta');
  const [ventas, setVentas] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  
  // Selección
  const [ventaSeleccionadaId, setVentaSeleccionadaId] = useState('');
  const [cuotaSeleccionada, setCuotaSeleccionada] = useState<any | null>(null);
  
  // Formulario de Pago
  const [pagoForm, setPagoForm] = useState({
    metodo: 'Transferencia Bancaria', banco: '', referencia: '', fecha_pago: new Date().toISOString().split('T')[0],
  });
  const [procesando, setProcesando] = useState(false);
  const [reciboGenerado, setReciboGenerado] = useState<any | null>(null);

  useEffect(() => {
    cargarDatosGenerales();
  }, []);

  const cargarDatosGenerales = async () => {
    setCargando(true);
    try {
      // Cargamos solo las operaciones que son Ventas definitivas o en cierre
      const { data: vts } = await supabase.from('cotizaciones')
        .select('*')
        .eq('estado', 'Venta - En Cierre')
        .order('created_at', { ascending: false });
        
      const { data: clis } = await supabase.from('clientes').select('*').eq('tipo', 'cliente');
      
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

  const formatearFecha = (fechaIso: string) => {
    if (!fechaIso) return '---';
    const partes = fechaIso.split('-');
    if(partes.length !== 3) return fechaIso; 
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  const abrirModalPago = (cuota: any) => {
    if (cuota.pagado) return; // Si ya está pagada, no hacemos nada
    setCuotaSeleccionada(cuota);
    setReciboGenerado(null);
    setPagoForm({
      metodo: 'Transferencia Bancaria', banco: '', referencia: '', fecha_pago: new Date().toISOString().split('T')[0]
    });
  };

  const registrarPago = async () => {
    if (!pagoForm.referencia && pagoForm.metodo !== 'Efectivo') {
      alert("La referencia del documento es obligatoria."); return;
    }
    setProcesando(true);
    try {
      // 1. Clonar el cronograma actual
      const cronogramaActualizado = [...ventaActiva.cronograma_pagos];
      
      // 2. Encontrar la cuota y marcarla como pagada
      const index = cronogramaActualizado.findIndex(c => c.id === cuotaSeleccionada.id);
      if (index === -1) throw new Error("Cuota no encontrada");

      const reciboId = `REC-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

      cronogramaActualizado[index] = {
        ...cronogramaActualizado[index],
        pagado: true,
        datos_pago: {
          recibo_id: reciboId,
          fecha_pago_real: pagoForm.fecha_pago,
          metodo: pagoForm.metodo,
          banco: pagoForm.banco,
          referencia: pagoForm.referencia,
          monto_cobrado: cuotaSeleccionada.amount
        }
      };

      // 3. Guardar en Supabase actualizando el JSON de la cotización
      const { error } = await supabase.from('cotizaciones')
        .update({ cronograma_pagos: cronogramaActualizado })
        .eq('id', ventaActiva.id);

      if (error) throw error;

      // 4. Actualizar estado local
      const ventasActualizadas = ventas.map(v => v.id === ventaActiva.id ? { ...v, cronograma_pagos: cronogramaActualizado } : v);
      setVentas(ventasActualizadas);
      
      // 5. Preparar datos para imprimir el recibo
      setReciboGenerado({
        ...cronogramaActualizado[index].datos_pago,
        label_cuota: cuotaSeleccionada.label,
        fecha_proyectada: cuotaSeleccionada.date
      });
      
      setCuotaSeleccionada(null);
      alert("✅ Pago registrado exitosamente.");

    } catch (err: any) {
      alert(`Error al registrar pago: ${err.message}`);
    } finally {
      setProcesando(false);
    }
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

  if (cargando) return <div className="flex min-h-screen items-center justify-center bg-[#dce3eb]"><p className="text-sm font-bold tracking-widest text-[#ea0029] uppercase animate-pulse">Sincronizando Cartera...</p></div>;

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
            <button onClick={() => setActiveTab('estado_cuenta')} className={`px-5 py-2.5 text-xs font-bold tracking-wider uppercase rounded-lg transition-all ${activeTab === 'estado_cuenta' ? 'bg-white text-[#ea0029] shadow-sm' : 'text-[#415364]/70 hover:text-[#415364]'}`}>
              Estado de Cuenta
            </button>
            <button onClick={() => setActiveTab('historial')} className={`px-5 py-2.5 text-xs font-bold tracking-wider uppercase rounded-lg transition-all ${activeTab === 'historial' ? 'bg-white text-[#ea0029] shadow-sm' : 'text-[#415364]/70 hover:text-[#415364]'}`}>
              Auditoría Recibos
            </button>
          </div>
        </div>

        {activeTab === 'estado_cuenta' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
            {/* PANEL IZQUIERDO: SELECCIÓN Y RESUMEN */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-neutral-200/60 p-6 shadow-sm">
                <label className="text-[10px] font-bold text-[#415364]/60 uppercase block mb-2">Seleccionar Unidad a Cobrar</label>
                <select value={ventaSeleccionadaId} onChange={(e) => { setVentaSeleccionadaId(e.target.value); setReciboGenerado(null); }} className="w-full bg-[#F9F7F5] border border-neutral-200 rounded-xl p-3 text-sm font-bold focus:border-[#ea0029] outline-none">
                  <option value="">— Buscar Operación Activa —</option>
                  {ventas.map(v => {
                    const c = clientes.find(cl => cl.id === v.cliente_id);
                    return <option key={v.id} value={v.id}>Dpto {v.unidad_numero} - {c?.nombres} {c?.apellidos}</option>
                  })}
                </select>
              </div>

              {ventaActiva && clienteActivo && (
                <div className="bg-[#21242E] rounded-2xl border border-neutral-800 p-6 shadow-xl text-white">
                  <h3 className="text-[10px] text-[#D1C292] font-bold uppercase tracking-widest mb-4 border-b border-white/10 pb-2">Resumen de Cartera</h3>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between"><span className="text-white/60">Cliente:</span> <span className="font-bold truncate max-w-[150px]">{clienteActivo.nombres} {clienteActivo.apellidos}</span></div>
                    <div className="flex justify-between"><span className="text-white/60">Unidad:</span> <span className="font-bold text-[#D1C292]">{ventaActiva.unidad_numero}</span></div>
                    <div className="flex justify-between"><span className="text-white/60">C.I / RUC:</span> <span className="font-mono">{clienteActivo.cedula}</span></div>
                    <div className="pt-3 mt-3 border-t border-white/10 flex justify-between items-center">
                      <span className="text-[10px] font-bold text-white/60 uppercase">Valor Total Negocio</span>
                      <span className="font-mono font-bold text-lg">${ventaActiva.precio_total.toLocaleString('en-US', {minimumFractionDigits:2})}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* PANEL DERECHO: CRONOGRAMA DE PAGOS */}
            <div className="lg:col-span-2">
              {ventaActiva ? (
                <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-sm overflow-hidden flex flex-col h-[600px]">
                  <div className="p-5 border-b border-neutral-100 flex justify-between items-center bg-neutral-50">
                    <h2 className="text-xs font-bold text-[#ea0029] uppercase tracking-widest">Cronograma Oficial de Pagos</h2>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
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
                        {ventaActiva.cronograma_pagos?.map((cuota: any) => {
                          const estaPagado = cuota.pagado === true;
                          const esVencida = !estaPagado && new Date(cuota.date) < new Date();
                          
                          return (
                            <tr key={cuota.id} className={`hover:bg-neutral-50 transition-colors ${estaPagado ? 'bg-[#D1C292]/5' : esVencida ? 'bg-red-50/50' : ''}`}>
                              <td className={`px-4 py-3 font-bold ${estaPagado ? 'text-neutral-400' : 'text-[#415364]'}`}>{cuota.label}</td>
                              <td className="px-4 py-3 text-center font-mono text-neutral-500">{formatearFecha(cuota.date)}</td>
                              <td className={`px-4 py-3 text-right font-mono font-bold ${estaPagado ? 'text-neutral-400' : 'text-[#415364]'}`}>${cuota.amount.toLocaleString('en-US', {minimumFractionDigits:2})}</td>
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
                                  <button onClick={() => abrirModalPago(cuota)} className="bg-[#21242E] text-white px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest hover:bg-[#ea0029] transition-colors shadow-sm">
                                    Cobrar
                                  </button>
                                ) : (
                                  <button onClick={() => {
                                      setReciboGenerado({ ...cuota.datos_pago, label_cuota: cuota.label, fecha_proyectada: cuota.date });
                                  }} className="text-neutral-400 hover:text-[#415364] flex justify-center w-full">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-sm h-full flex flex-col items-center justify-center p-10 text-center">
                  <div className="w-16 h-16 bg-[#F9F7F5] rounded-full flex items-center justify-center mb-4 border border-neutral-200">
                    <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  </div>
                  <h3 className="text-sm font-bold text-[#415364] uppercase tracking-widest">Sin Operación Seleccionada</h3>
                  <p className="text-xs text-neutral-500 mt-2 max-w-xs">Busque un cliente en el panel izquierdo para visualizar su cronograma y procesar cobros.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL / PANEL DE PROCESAMIENTO DE PAGO */}
        {cuotaSeleccionada && (
          <div className="fixed inset-0 bg-[#415364]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
              <div className="bg-[#21242E] p-5 flex justify-between items-center text-white">
                <div>
                  <h3 className="text-[10px] font-bold text-[#D1C292] uppercase tracking-widest">Procesar Ingreso de Caja</h3>
                  <p className="text-sm font-bold">{cuotaSeleccionada.label}</p>
                </div>
                <button onClick={() => setCuotaSeleccionada(null)} className="text-white/50 hover:text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
              </div>
              
              <div className="p-6 space-y-5">
                <div className="bg-[#F9F7F5] border border-neutral-200 p-4 rounded-xl text-center">
                  <span className="text-[10px] uppercase font-bold text-neutral-500 block mb-1">Valor a Cobrar</span>
                  <span className="text-3xl font-mono font-bold text-[#ea0029]">${cuotaSeleccionada.amount.toLocaleString('en-US', {minimumFractionDigits:2})}</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-[#415364]/60 uppercase block mb-1.5">Método de Ingreso</label>
                    <select value={pagoForm.metodo} onChange={(e) => setPagoForm({...pagoForm, metodo: e.target.value})} className="w-full text-xs bg-white border border-neutral-300 p-3 rounded-xl outline-none font-bold text-[#415364] focus:border-[#ea0029]">
                      <option>Transferencia Bancaria</option><option>Depósito en Cuenta</option><option>Cheque Certificado</option><option>Efectivo</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#415364]/60 uppercase block mb-1.5">Fecha de Ingreso</label>
                    <input type="date" value={pagoForm.fecha_pago} onChange={(e) => setPagoForm({...pagoForm, fecha_pago: e.target.value})} className="w-full text-xs p-3 border border-neutral-300 rounded-xl outline-none focus:border-[#ea0029] font-mono" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#415364]/60 uppercase block mb-1.5">Banco Origen</label>
                    <input type="text" placeholder="Ej. Pichincha" value={pagoForm.banco} onChange={(e) => setPagoForm({...pagoForm, banco: e.target.value})} className="w-full text-xs p-3 border border-neutral-300 rounded-xl outline-none focus:border-[#ea0029]" disabled={pagoForm.metodo === 'Efectivo'} />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-[#415364]/60 uppercase block mb-1.5">Referencia / Comprobante</label>
                    <input type="text" placeholder="Obligatorio para transferencias..." value={pagoForm.referencia} onChange={(e) => setPagoForm({...pagoForm, referencia: e.target.value})} className="w-full text-xs p-3 border border-neutral-300 rounded-xl outline-none focus:border-[#ea0029] font-mono font-bold" />
                  </div>
                </div>

                <button onClick={registrarPago} disabled={procesando} className="w-full bg-[#ea0029] text-white py-4 rounded-xl text-xs font-bold uppercase tracking-widest shadow-md hover:bg-[#c90022] transition-colors mt-2">
                  {procesando ? 'Procesando en Nube...' : 'Confirmar Cobro y Generar Recibo'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PANEL FLOTANTE CUANDO SE GENERA/VER UN RECIBO */}
        {reciboGenerado && clienteActivo && (
          <div className="bg-[#21242E] rounded-2xl border border-[#D1C292] p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-bottom">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#D1C292]/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-[#D1C292]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <div>
                <span className="text-[#D1C292] font-bold text-[10px] uppercase tracking-widest block mb-0.5">Recibo Emitido Correctamente</span>
                <p className="text-sm font-bold text-white">Comprobante N° {reciboGenerado.recibo_id}</p>
                <p className="text-[10px] text-white/50 font-mono mt-1">Ref: {reciboGenerado.referencia || 'N/A'}</p>
              </div>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <button onClick={() => setReciboGenerado(null)} className="flex-1 md:flex-none px-6 py-3 border border-white/20 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-colors">
                Cerrar
              </button>
              <button onClick={imprimirRecibo} className="flex-1 md:flex-none px-6 py-3 bg-[#D1C292] text-[#21242E] rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-colors shadow-lg flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                Imprimir Recibo Oficial
              </button>
            </div>
          </div>
        )}

        {/* PLANTILLA OCULTA: RECIBO DE COBRANZA EN FORMATO A4 */}
        {reciboGenerado && clienteActivo && ventaActiva && (
          <div id="plantilla-recibo-cobro" className="hidden">
            <div className="pagina-a4">
              <div className="border border-[#415364] p-10 h-full relative">
                {/* MARCA DE AGUA */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none z-0">
                  <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/arienzo-logo-terracota.svg" alt="Arienzo Watermark" className="w-[80%] -rotate-12" />
                </div>
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start border-b-2 border-[#ea0029] pb-6 mb-8">
                    <div>
                      <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/arienzo-logo-terracota.svg" alt="Arienzo" className="h-12 mb-3 object-contain" />
                      <p className="text-[9px] tracking-widest text-[#415364] uppercase font-bold">Arienzo S.A.S.</p>
                      <p className="text-[8px] tracking-widest text-neutral-500 uppercase mt-0.5">RUC: 1391940037001</p>
                    </div>
                    <div className="text-right bg-[#F9F7F5] border border-neutral-200 px-6 py-4 rounded-xl">
                      <h1 className="text-xl font-bold text-[#415364] tracking-widest uppercase mb-1">Recibo de Caja</h1>
                      <p className="text-sm font-mono font-bold text-[#ea0029]">{reciboGenerado.recibo_id}</p>
                      <p className="text-[8px] text-neutral-500 uppercase tracking-widest mt-2">Copia Cliente</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                      <h3 className="text-[8px] font-bold text-[#ea0029] uppercase tracking-widest border-b border-neutral-200 pb-1 mb-3">Datos del Cliente</h3>
                      <div className="space-y-1.5 text-[10px] uppercase">
                        <p><span className="font-bold text-neutral-500 w-20 inline-block">Titular:</span> <span className="font-bold text-[#415364]">{clienteActivo.nombres} {clienteActivo.apellidos}</span></p>
                        <p><span className="font-bold text-neutral-500 w-20 inline-block">C.I / RUC:</span> <span className="font-mono">{clienteActivo.cedula}</span></p>
                        <p><span className="font-bold text-neutral-500 w-20 inline-block">Teléfono:</span> <span>{clienteActivo.telefono}</span></p>
                        <p><span className="font-bold text-neutral-500 w-20 inline-block">E-mail:</span> <span className="lowercase">{clienteActivo.email}</span></p>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-[8px] font-bold text-[#ea0029] uppercase tracking-widest border-b border-neutral-200 pb-1 mb-3">Detalle Operación</h3>
                      <div className="space-y-1.5 text-[10px] uppercase">
                        <p><span className="font-bold text-neutral-500 w-20 inline-block">Fecha Cobro:</span> <span className="font-mono font-bold">{formatearFecha(reciboGenerado.fecha_pago_real)}</span></p>
                        <p><span className="font-bold text-neutral-500 w-20 inline-block">Proyecto:</span> <span className="font-bold text-[#415364]">Arienzo Boutique Living</span></p>
                        <p><span className="font-bold text-neutral-500 w-20 inline-block">Unidad Inm:</span> <span className="font-bold text-[#415364]">Dpto. {ventaActiva.unidad_numero}</span></p>
                      </div>
                    </div>
                  </div>

                  {/* BLOQUE CENTRAL DE VALOR */}
                  <div className="bg-[#415364] text-white rounded-xl p-8 mb-8 border-l-8 border-[#D1C292] shadow-sm flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#D1C292] block mb-2">Importe Recibido</span>
                      <span className="text-4xl font-mono font-bold">${Number(reciboGenerado.monto_cobrado).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                    <div className="text-right">
                      <span className="bg-white/10 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider inline-block">
                        Concepto: {reciboGenerado.label_cuota}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-[8px] font-bold text-[#ea0029] uppercase tracking-widest border-b border-neutral-200 pb-1 mb-4">Forma de Pago Registrada</h3>
                  <div className="grid grid-cols-3 gap-4 text-[10px] uppercase bg-neutral-50 p-5 rounded-xl border border-neutral-200 mb-12">
                    <div>
                      <span className="font-bold text-neutral-400 block mb-1">Método de Ingreso</span>
                      <span className="font-bold text-[#415364]">{reciboGenerado.metodo}</span>
                    </div>
                    <div>
                      <span className="font-bold text-neutral-400 block mb-1">Entidad Bancaria</span>
                      <span className="font-bold text-[#415364]">{reciboGenerado.banco || '---'}</span>
                    </div>
                    <div>
                      <span className="font-bold text-neutral-400 block mb-1">Ref / Documento</span>
                      <span className="font-mono font-bold text-[#415364]">{reciboGenerado.referencia || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="text-[8px] leading-relaxed text-justify text-neutral-500 mb-20 border-l-2 border-neutral-300 pl-4 py-1 italic">
                    Declaramos haber recibido los fondos especificados en este documento. Este recibo no invalida letras de cambio, pagarés u otros documentos de garantía firmados por el cliente si el medio de pago reportara rechazo por fondos insuficientes o defectos de forma por parte de las entidades bancarias involucradas. 
                  </div>

                  <div className="grid grid-cols-2 gap-16 px-16">
                    <div className="text-center border-t border-[#415364] pt-3">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-[#415364] mb-1">{clienteActivo.nombres} {clienteActivo.apellidos}</p>
                      <p className="text-[8px] text-neutral-400 uppercase tracking-widest">Titular / Entregué Conforme</p>
                    </div>
                    <div className="text-center border-t border-[#415364] pt-3">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-[#415364] mb-1">Arienzo S.A.S.</p>
                      <p className="text-[8px] text-neutral-400 uppercase tracking-widest">Recibí Conforme / Departamento Cobranzas</p>
                    </div>
                  </div>

                  <div className="absolute bottom-6 left-0 right-0 text-center text-[7px] text-neutral-400 uppercase tracking-widest">
                    Impreso desde Ecosistema Konkeri • Documento Válido para Fines Comerciales
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}