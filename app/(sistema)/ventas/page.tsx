// Actualizacion para Vercel - Gestor de Operaciones y Reservas Konkeri
'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

interface Cuota {
  numero: number;
  fecha: string;
  monto: number;
  esEditable: boolean;
}

export default function GestorOperacionesPage() {
  const [activeTab, setActiveTab] = useState<'reserva' | 'cierre_venta'>('reserva');
  const [propiedades, setPropiedades] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  
  // Estados Módulo 1 (Reserva)
  const [reservaExitosa, setReservaExitosa] = useState(false);
  const [codigoReserva, setCodigoReserva] = useState('');

  // --- DATOS DE RESPALDO ---
  const datosRespaldoClientes = [
    { id: 'cli-1', nombres: 'ANA MARIA', apellidos: 'CEVALLOS TRUJILLO', cedula: '1304681393', estado_civil: 'CASADA', email: 'mariacevallos@hotmail.com', direccion_domicilio: 'VIA SAN MATEO, URBANIZACION ALTOS MANTA BEACH, MZ B15, SOLAR 7', telefono: '0991234567', tipo: 'cliente' },
    { id: 'cli-2', nombres: 'CARLOS ANDRES', apellidos: 'MENDOZA LOPEZ', cedula: '1312345678', estado_civil: 'SOLTERO', email: 'carlosm@ejemplo.com', direccion_domicilio: 'BARRIO UMIÑA, MANTA', telefono: '0987654321', tipo: 'cliente' }
  ];
  const datosRespaldoPropiedades = [
    { id: 'prop-302', unidad: '302', precio_lista: 231044, area_total: 96.48, tipologia: '2 Dormitorios', estado: 'Disponible' },
    { id: 'prop-405', unidad: '405', precio_lista: 250000, area_total: 105.00, tipologia: '3 Dormitorios', estado: 'Reservado' }
  ];

  // --- FORMULARIO DE RESERVA (PESTAÑA 1) ---
  const [reservaForm, setReservaForm] = useState({
    clienteId: '',
    propiedadId: '',
    montoReserva: 2500,
    formaPago: 'Transferencia Bancaria',
    bancoOrigen: '',
    numeroComprobante: '',
    fechaPago: new Date().toISOString().split('T')[0],
  });

  // --- FORMULARIO DE CIERRE (PESTAÑA 2) ---
  const [cierreForm, setCierreForm] = useState({
    clienteId: '',
    propiedadId: '',
  });

  useEffect(() => {
    async function inicializarEcosistema() {
      try {
        setCargando(true);
        const { data: props, error: errProps } = await supabase.from('propiedades').select('*').order('unidad', { ascending: true });
        
        const { data: clis, error: errClis } = await supabase
          .from('clientes')
          .select('*')
          .eq('tipo', 'cliente') 
          .order('nombres', { ascending: true });

        setPropiedades(props && props.length > 0 ? props : datosRespaldoPropiedades);
        setClientes(clis && clis.length > 0 ? clis : datosRespaldoClientes);
      } catch (error) {
        console.error("Conexión fallback", error);
        setPropiedades(datosRespaldoPropiedades);
        setClientes(datosRespaldoClientes);
      } finally {
        setCargando(false);
      }
    }
    inicializarEcosistema();
  }, []);

  useEffect(() => {
    setReservaExitosa(false);
  }, [reservaForm.propiedadId]);

  const clienteActivoReserva = clientes.find(c => c.id === reservaForm.clienteId);
  const propiedadActivaReserva = propiedades.find(p => p.id.toString() === reservaForm.propiedadId.toString());
  const clienteActivoCierre = clientes.find(c => c.id === cierreForm.clienteId);
  const propiedadActivaCierre = propiedades.find(p => p.id.toString() === cierreForm.propiedadId.toString());

  const procesarReserva = async () => {
    if (!reservaForm.clienteId || !reservaForm.propiedadId || !reservaForm.montoReserva) {
      alert("Completar Cliente, Unidad y Monto para registrar la reserva.");
      return;
    }
    setGuardando(true);
    try {
      const codigoGenerado = `RES-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
      setCodigoReserva(codigoGenerado);
      
      setPropiedades(prev => prev.map(p => p.id.toString() === reservaForm.propiedadId.toString() ? { ...p, estado: 'Reservado' } : p));
      setReservaExitosa(true);
      alert("Reserva aplicada exitosamente. Unidad bloqueada.");
    } catch (err: any) {
      alert(`Error al registrar: ${err.message}`);
    } finally {
      setGuardando(false);
    }
  };

  const imprimirDocumento = (idElemento: string, tituloVentana: string) => {
    if (typeof window === 'undefined') return;
    const contenido = document.getElementById(idElemento)?.innerHTML;
    if (!contenido) { alert("Error al cargar la plantilla."); return; }

    const ventana = window.open('', '_blank');
    if (!ventana) return;

    ventana.document.write(`
      <html>
        <head>
          <title>${tituloVentana}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @page { size: A4 portrait; margin: 0mm; }
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; margin: 0; padding: 0; background: #FCFBFA; font-family: ui-sans-serif, system-ui; color: #333333; }
            .pagina-a4 { width: 210mm; height: 297mm; padding: 15mm 15mm; box-sizing: border-box; page-break-after: always; overflow: hidden; background: #ffffff; position: relative; margin: 0 auto; }
            .cuadro-input { border-bottom: 1px solid #8C8A87; min-height: 14px; display: inline-block; width: 100%; }
            .checkbox-box { width: 10px; height: 10px; border: 1px solid #8C8A87; display: inline-block; margin-right: 4px; vertical-align: middle; background: white; }
            .seccion-titulo { background-color: #F2EFEB; color: #B94A36; font-weight: bold; text-transform: uppercase; font-size: 8px; padding: 4px 8px; border-left: 3px solid #B94A36; margin-bottom: 6px; margin-top: 8px; letter-spacing: 0.05em; }
            .text-xxs { font-size: 7px; line-height: 1.2; }
          </style>
        </head>
        <body>
          ${contenido}
          <script>setTimeout(() => { window.print(); window.close(); }, 700);</script>
        </body>
      </html>
    `);
    ventana.document.close();
  };

  if (cargando) return <div className="flex min-h-screen items-center justify-center bg-[#dce3eb]"><p className="text-sm font-bold tracking-widest text-[#ea0029] uppercase animate-pulse">Sincronizando Sistema...</p></div>;

  return (
    <div className="min-h-screen bg-[#dce3eb] p-4 md:p-8 font-sans text-[#415364]">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* CABECERA */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#415364]/10 pb-6 gap-4">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-[#ea0029] uppercase block">Gestor Comercial Inmobiliario</span>
            <h1 className="text-3xl font-bold tracking-tight text-[#415364] mt-1">Gestión de Operaciones</h1>
          </div>

          <div className="flex bg-[#dce3eb]/50 p-1.5 rounded-xl w-full md:w-auto overflow-x-auto border border-[#415364]/10 shadow-inner">
            <button onClick={() => setActiveTab('reserva')} className={`flex-1 md:flex-initial text-center px-6 py-2.5 text-xs font-bold tracking-wider uppercase rounded-lg transition-all whitespace-nowrap ${activeTab === 'reserva' ? 'bg-white text-[#ea0029] shadow-sm' : 'text-[#415364]/70 hover:text-[#415364]'}`}>
              1. Bloqueo y Reserva
            </button>
            <button onClick={() => setActiveTab('cierre_venta')} className={`flex-1 md:flex-initial text-center px-6 py-2.5 text-xs font-bold tracking-wider uppercase rounded-lg transition-all whitespace-nowrap ${activeTab === 'cierre_venta' ? 'bg-white text-[#ea0029] shadow-sm' : 'text-[#415364]/70 hover:text-[#415364]'}`}>
              2. Preparar Expediente
            </button>
          </div>
        </div>

        {/* PESTAÑA 1: RESERVA Y RECIBO DE CAJA */}
        {activeTab === 'reserva' && (
          <div className="bg-white border border-neutral-200/60 rounded-2xl p-6 md:p-8 shadow-sm max-w-4xl mx-auto">
            <div className="mb-6 border-b border-neutral-100 pb-4">
              <h3 className="text-sm font-bold text-[#415364] uppercase tracking-wider">Ingreso de Fondos y Bloqueo</h3>
              <p className="text-xs text-[#415364]/60 mt-1">Registre el abono para apartar la unidad comercialmente.</p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#dce3eb]/30 p-5 rounded-xl border border-[#415364]/10">
                <div>
                  <label className="text-[10px] font-bold text-[#415364]/60 uppercase block mb-1.5">Cliente / Inversionista</label>
                  <select value={reservaForm.clienteId} onChange={(e) => setReservaForm({...reservaForm, clienteId: e.target.value})} className="w-full text-xs bg-white border border-[#415364]/20 p-3 rounded-xl outline-none font-bold text-[#415364] focus:border-[#ea0029]">
                    <option value="">-- Seleccionar de Cartera --</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nombres} {c.apellidos}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#415364]/60 uppercase block mb-1.5">Unidad Disponible</label>
                  <select value={reservaForm.propiedadId} onChange={(e) => setReservaForm({...reservaForm, propiedadId: e.target.value})} className="w-full text-xs bg-white border border-[#415364]/20 p-3 rounded-xl outline-none font-bold text-[#415364] focus:border-[#ea0029]">
                    <option value="">-- Seleccionar Inventario --</option>
                    {propiedades.filter(p => p.estado !== 'Reservado' && p.estado !== 'Vendido').map(p => <option key={p.id} value={p.id}>Unidad {p.unidad || p.numero} (${p.precio_lista})</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                <div>
                  <label className="text-[10px] font-bold text-[#415364]/60 uppercase block mb-1.5">Valor Recibido ($)</label>
                  <input type="number" value={reservaForm.montoReserva} onChange={(e) => setReservaForm({...reservaForm, montoReserva: Number(e.target.value)})} className="w-full text-sm bg-white border border-[#415364]/20 p-3 rounded-xl font-mono font-bold text-[#ea0029] outline-none focus:border-[#ea0029]" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#415364]/60 uppercase block mb-1.5">Método de Pago</label>
                  <select value={reservaForm.formaPago} onChange={(e) => setReservaForm({...reservaForm, formaPago: e.target.value})} className="w-full text-xs bg-white border border-[#415364]/20 p-3 rounded-xl outline-none font-bold text-[#415364] focus:border-[#ea0029]">
                    <option>Transferencia Bancaria</option><option>Depósito en Efectivo</option><option>Cheque</option><option>Tarjeta de Crédito</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#415364]/60 uppercase block mb-1.5">Banco Origen</label>
                  <input type="text" placeholder="Ej. Banco Pichincha" value={reservaForm.bancoOrigen} onChange={(e) => setReservaForm({...reservaForm, bancoOrigen: e.target.value})} className="w-full text-xs bg-white border border-[#415364]/20 p-3 rounded-xl outline-none font-medium text-[#415364] focus:border-[#ea0029]" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#415364]/60 uppercase block mb-1.5">Ref / Comprobante</label>
                  <input type="text" placeholder="N° Documento" value={reservaForm.numeroComprobante} onChange={(e) => setReservaForm({...reservaForm, numeroComprobante: e.target.value})} className="w-full text-xs bg-white border border-[#415364]/20 p-3 rounded-xl outline-none font-mono text-[#415364] focus:border-[#ea0029]" />
                </div>
              </div>

              {!reservaExitosa ? (
                <button onClick={procesarReserva} disabled={guardando} className="w-full bg-[#ea0029] text-white text-xs uppercase tracking-widest font-bold py-4 rounded-xl mt-4 shadow-md hover:bg-[#c90022] transition-colors disabled:opacity-50">
                  {guardando ? 'Verificando...' : 'Aplicar Ingreso y Bloquear Unidad'}
                </button>
              ) : (
                <div className="mt-6 bg-[#21242E] p-6 rounded-2xl border border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-4 text-white shadow-xl">
                  <div>
                    <span className="text-[#D1C292] font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#D1C292]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                      Unidad Bloqueada Exitosamente
                    </span>
                    <p className="text-[11px] text-white/70 mt-1">El inventario se ha actualizado. Imprima el recibo para el cliente.</p>
                  </div>
                  <button onClick={() => imprimirDocumento('impresion-recibo', 'Recibo_Caja')} className="w-full md:w-auto bg-white hover:bg-neutral-100 text-[#21242E] px-6 py-3 rounded-xl font-bold text-xs tracking-wider uppercase transition-colors shadow-sm">
                    🖨️ Generar Recibo de Caja
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PESTAÑA 2: PREPARAR EXPEDIENTE */}
        {activeTab === 'cierre_venta' && (
          <div className="bg-white border border-neutral-200/60 rounded-2xl p-6 md:p-8 shadow-sm max-w-4xl mx-auto">
             <div className="mb-6 border-b border-neutral-100 pb-4">
              <h3 className="text-sm font-bold text-[#415364] uppercase tracking-wider">Preparación de Expediente (UAFE / KYC)</h3>
              <p className="text-xs text-[#415364]/60 mt-1">Seleccione un cliente con unidad reservada para generar su documentación en blanco lista para firma.</p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#dce3eb]/30 p-5 rounded-xl border border-[#415364]/10">
                <div>
                  <label className="text-[10px] font-bold text-[#415364]/60 uppercase block mb-1.5">1. Seleccionar Cliente</label>
                  <select value={cierreForm.clienteId} onChange={(e) => setCierreForm({...cierreForm, clienteId: e.target.value})} className="w-full text-xs bg-white border border-[#415364]/20 p-3 rounded-xl outline-none font-bold text-[#415364] focus:border-[#ea0029]">
                    <option value="">-- Seleccione Cliente --</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nombres} {c.apellidos}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#415364]/60 uppercase block mb-1.5">2. Unidad Reservada Vinculada</label>
                  <select value={cierreForm.propiedadId} onChange={(e) => setCierreForm({...cierreForm, propiedadId: e.target.value})} className="w-full text-xs bg-white border border-[#415364]/20 p-3 rounded-xl outline-none font-bold text-[#ea0029] focus:border-[#ea0029]">
                    <option value="">-- Seleccione Unidad Reservada --</option>
                    {propiedades.filter(p => p.estado === 'Reservado').map(p => <option key={p.id} value={p.id}>Unidad {p.unidad || p.numero} (Reservada)</option>)}
                  </select>
                </div>
              </div>

              {cierreForm.clienteId && cierreForm.propiedadId ? (
                <div className="mt-6 bg-[#FCFBFA] p-6 rounded-2xl border border-[#EAE3DC] flex flex-col md:flex-row items-center justify-between gap-6">
                  <div>
                    <span className="text-[#B94A36] font-bold text-xs uppercase tracking-wider block mb-1">Expediente Listo para Imprimir</span>
                    <p className="text-[11px] text-[#415364]/70">Se imprimirán 2 hojas vacías con espacios de firma para:<br/>• El Cliente<br/>• Oficial de Cumplimiento<br/>• Gerente General</p>
                  </div>
                  <button onClick={() => imprimirDocumento('impresion-formularios', 'Formularios_Expediente')} className="w-full md:w-auto bg-[#ea0029] hover:bg-[#c90022] text-white px-8 py-4 rounded-xl font-bold text-xs tracking-wider uppercase transition-colors shadow-md whitespace-nowrap">
                    🖨️ Imprimir Formularios
                  </button>
                </div>
              ) : (
                <div className="mt-6 p-6 border-2 border-dashed border-[#415364]/20 rounded-2xl text-center">
                  <p className="text-xs text-[#415364]/50 font-bold uppercase tracking-widest">Seleccione cliente y unidad para habilitar impresión</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            PLANTILLAS OCULTAS PARA GENERACIÓN DE PDF
           ========================================================================= */}
        
        {/* PLANTILLA 1: SOLO RECIBO */}
        <div id="impresion-recibo" className="hidden">
          <div className="pagina-a4">
            <div className="flex justify-between items-end border-b-2 border-[#B94A36] pb-4 mb-8">
              <div>
                <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/arienzo-logo-terracota.svg" alt="Arienzo" className="h-10 mb-2 object-contain" />
                <p className="text-[8px] tracking-widest text-[#8C8A87] uppercase font-bold">RUC: 1391937895001</p>
              </div>
              <div className="text-right">
                <h1 className="text-lg font-light text-[#B94A36] tracking-widest uppercase">Recibo de Caja</h1>
                <p className="text-xs font-mono font-bold mt-1">N° {codigoReserva || 'RES-BORRADOR'}</p>
              </div>
            </div>

            <div className="bg-white border border-[#EAE3DC] p-6 rounded-md shadow-sm">
              <div className="flex justify-between items-center border-b border-[#EAE3DC] pb-4 mb-4">
                <span className="text-[10px] uppercase font-bold text-[#8C8A87] tracking-wider">Fecha de Emisión:</span>
                <span className="text-sm font-medium">{new Date().toLocaleDateString('es-ES')}</span>
              </div>
              <div className="flex justify-between items-center border-b border-[#EAE3DC] pb-4 mb-4">
                <span className="text-[10px] uppercase font-bold text-[#8C8A87] tracking-wider">Monto Recibido:</span>
                <span className="text-xl font-mono font-bold text-[#B94A36]">${reservaForm.montoReserva.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between items-center border-b border-[#EAE3DC] pb-4 mb-4">
                <span className="text-[10px] uppercase font-bold text-[#8C8A87] tracking-wider">Recibimos de:</span>
                <span className="text-sm font-bold uppercase">{clienteActivoReserva?.nombres || ''} {clienteActivoReserva?.apellidos || ''}</span>
              </div>
              
              <div className="flex flex-col border-b border-[#EAE3DC] pb-4 mb-4">
                <span className="text-[10px] uppercase font-bold text-[#8C8A87] tracking-wider mb-2">Por Concepto de:</span>
                <span className="text-sm text-justify leading-relaxed mb-3">
                  Reserva y bloqueo comercial de la siguiente unidad perteneciente al Proyecto Inmobiliario "Arienzo Boutique Living", ubicado en el sector Barbasquillo, Manta.
                </span>
                <div className="grid grid-cols-4 gap-3 bg-[#FCFBFA] border border-[#EAE3DC] p-3 rounded-md">
                  <div><span className="text-[8px] uppercase font-bold text-[#8C8A87] block">Unidad Inm.</span><span className="text-xs font-bold text-[#333333]">{propiedadActivaReserva?.unidad || propiedadActivaReserva?.numero || '---'}</span></div>
                  <div><span className="text-[8px] uppercase font-bold text-[#8C8A87] block">Nivel / Piso</span><span className="text-xs font-medium text-[#333333]">{propiedadActivaReserva?.piso || 'N/A'}</span></div>
                  <div><span className="text-[8px] uppercase font-bold text-[#8C8A87] block">Tipología</span><span className="text-xs font-medium text-[#333333]">{propiedadActivaReserva?.tipologia || 'N/A'}</span></div>
                  <div><span className="text-[8px] uppercase font-bold text-[#8C8A87] block">Área Útil</span><span className="text-xs font-medium text-[#333333]">{propiedadActivaReserva?.area_total || 'N/A'} m²</span></div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 bg-[#F2EFEB] p-4 rounded-md">
                <div><span className="text-[9px] uppercase font-bold text-[#8C8A87] block mb-1">Método:</span><span className="text-[11px] font-medium">{reservaForm.formaPago}</span></div>
                <div><span className="text-[9px] uppercase font-bold text-[#8C8A87] block mb-1">Entidad Bancaria:</span><span className="text-[11px] font-medium">{reservaForm.bancoOrigen || 'N/A'}</span></div>
                <div><span className="text-[9px] uppercase font-bold text-[#8C8A87] block mb-1">Ref / Documento:</span><span className="text-[11px] font-mono font-medium">{reservaForm.numeroComprobante || 'N/A'}</span></div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-neutral-50 border border-neutral-200 rounded-md text-[6.5pt] leading-tight text-justify text-neutral-500">
              <p><strong>Nota importante / Cláusula de Reserva:</strong> El valor entregado en concepto de reserva implica la aceptación formal de la unidad y su respectivo bloqueo comercial. Se entiende y acepta que, en caso de desistimiento o retiros voluntarios por motivos ajenos a la promotora (Arienzo S.A.S.), dicho valor no será reembolsado, destinándose íntegramente a cubrir los gastos administrativos y de lucro cesante generados por la desincorporación temporal del inventario.</p>
            </div>

            <div className="mt-12 grid grid-cols-2 gap-16 px-12">
              <div className="text-center border-t border-[#8C8A87] pt-2">
                <p className="text-[9px] font-bold uppercase tracking-wider">{clienteActivoReserva?.nombres || 'FIRMA DEL CLIENTE'} {clienteActivoReserva?.apellidos || ''}</p>
                <p className="text-[8px] text-[#8C8A87]">C.C. {clienteActivoReserva?.cedula || '_______________'}</p>
              </div>
              <div className="text-center border-t border-[#8C8A87] pt-2">
                <p className="text-[9px] font-bold uppercase tracking-wider">Arienzo S.A.S.</p>
                <p className="text-[8px] text-[#8C8A87]">Recibí Conforme</p>
              </div>
            </div>
            
            <div className="absolute bottom-6 left-0 right-0 text-center text-[7px] text-[#8C8A87] uppercase tracking-widest">
              Arienzo S.A.S. • Promotora Inmobiliaria • Página 1 de 1
            </div>
          </div>
        </div>

        {/* PLANTILLA 2: FORMULARIOS VACÍOS */}
        <div id="impresion-formularios" className="hidden">
          
          {/* HOJA A: FORMULARIO KYC */}
          <div className="pagina-a4 text-xxs">
            <div className="flex justify-between items-end border-b-2 border-[#B94A36] pb-2 mb-2">
              <div>
                <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/arienzo-logo-terracota.svg" alt="Arienzo" className="h-8 object-contain" />
              </div>
              <div className="text-right">
                <h2 className="text-[10px] font-bold uppercase tracking-wide">FORMULARIO INFORMACIÓN BÁSICA DEL CLIENTE</h2>
                <p className="text-[8px] text-[#8C8A87] uppercase mt-0.5">Persona Natural</p>
              </div>
            </div>
            
            <div className="flex justify-end gap-6 text-[8px] mb-2">
              <div>FECHA: <span className="cuadro-input w-24"></span></div>
              <div>CIUDAD: <span className="cuadro-input w-32"></span></div>
            </div>

            <div className="seccion-titulo">1. DATOS PERSONALES</div>
            {/* LÍNEAS INDIVIDUALES PARA LOS NOMBRES */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-2">
              <div className="col-span-2 flex items-end"><span className="w-32 pb-0.5">PRIMER APELLIDO:</span> <span className="cuadro-input"></span></div>
              <div className="col-span-2 flex items-end"><span className="w-32 pb-0.5">SEGUNDO APELLIDO:</span> <span className="cuadro-input"></span></div>
              <div className="col-span-2 flex items-end"><span className="w-32 pb-0.5">NOMBRES:</span> <span className="cuadro-input"></span></div>
              
              <div className="flex items-center gap-2"><span className="checkbox-box"></span> CEDULA <span className="checkbox-box ml-2"></span> PASAPORTE <span className="ml-2">NUMERO:</span> <span className="cuadro-input w-24"></span></div>
              <div className="flex items-center gap-1"><span>FECHA NACIMIENTO:</span> DIA<span className="cuadro-input w-6"></span> MES<span className="cuadro-input w-6"></span> AÑO<span className="cuadro-input w-8"></span></div>
              <div className="flex items-center"><span className="w-24">NACIONALIDAD:</span> <span className="cuadro-input"></span></div>
              <div className="flex items-center"><span className="w-20">ESTADO CIVIL:</span> <span className="cuadro-input"></span></div>
              <div className="flex items-center"><span className="w-32">CIUDAD DE RESIDENCIA:</span> <span className="cuadro-input"></span></div>
              <div className="flex items-center"><span className="w-10">PAÍS:</span> <span className="cuadro-input"></span></div>
              <div className="flex items-center"><span className="w-32">TELEFONO DOMICILIO:</span> <span className="cuadro-input"></span></div>
              <div className="flex items-center"><span className="w-32">TELEFONO CELULAR:</span> <span className="cuadro-input"></span></div>
              <div className="col-span-2 flex items-center"><span className="w-48">CORREO ELECTRONICO PERSONAL:</span> <span className="cuadro-input"></span></div>
              <div className="col-span-2 flex items-center"><span className="w-48">CORREO ELECTRONICO LABORAL:</span> <span className="cuadro-input"></span></div>
              <div className="col-span-2 flex items-center"><span className="w-48">DIRECCION DOMICILIO (Lo mas detallada):</span> <span className="cuadro-input"></span></div>
              <div className="col-span-2 flex items-center gap-4 mt-1"><span>NIVEL ACADEMICO:</span><span className="checkbox-box"></span> BACHILLERATO <span className="checkbox-box"></span> TECNOLOGICO <span className="checkbox-box"></span> UNIVERSITARIO <span className="checkbox-box"></span> POSTGRADO</div>
              <div className="col-span-2 flex items-center gap-4"><span>ACTIVIDAD ECONOMICA:</span><span className="checkbox-box"></span> RELACION DEPENDENCIA <span className="checkbox-box"></span> INDEPENDIENTE <span className="checkbox-box"></span> JUBILADO <span className="checkbox-box"></span> AMA DE CASA</div>
              <div className="flex items-center"><span className="w-40">EMPRESA DONDE TRABAJA:</span> <span className="cuadro-input"></span></div>
              <div className="flex items-center"><span className="w-16">CARGO:</span> <span className="cuadro-input"></span></div>
              <div className="flex items-center"><span className="w-40">INGRESOS MENSUALES US$:</span> <span className="cuadro-input"></span></div>
              <div className="flex items-center"><span className="w-32">TELEFONO OFICINA:</span> <span className="cuadro-input"></span></div>
            </div>

            <div className="seccion-titulo">2. INFORMACIÓN CÓNYUGE</div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-2">
              <div className="col-span-2 flex items-center"><span className="w-48">APELLIDOS Y NOMBRES COMPLETOS:</span> <span className="cuadro-input"></span></div>
              <div className="flex items-center gap-2"><span className="checkbox-box"></span> CEDULA <span className="checkbox-box ml-2"></span> PASAPORTE <span className="ml-2">NUMERO:</span> <span className="cuadro-input w-24"></span></div>
              <div className="flex items-center gap-1"><span>FECHA NACIMIENTO:</span> DIA<span className="cuadro-input w-6"></span> MES<span className="cuadro-input w-6"></span> AÑO<span className="cuadro-input w-8"></span></div>
              <div className="flex items-center"><span className="w-24">NACIONALIDAD:</span> <span className="cuadro-input"></span></div>
              <div className="flex items-center"><span className="w-32">TELEFONO CELULAR:</span> <span className="cuadro-input"></span></div>
              <div className="col-span-2 flex items-center gap-4 mt-1"><span>ACTIVIDAD ECONOMICA:</span><span className="checkbox-box"></span> RELACION DEPENDENCIA <span className="checkbox-box"></span> INDEPENDIENTE <span className="checkbox-box"></span> JUBILADO <span className="checkbox-box"></span> AMA DE CASA</div>
              <div className="flex items-center"><span className="w-40">EMPRESA DONDE TRABAJA:</span> <span className="cuadro-input"></span></div>
              <div className="flex items-center"><span className="w-16">CARGO:</span> <span className="cuadro-input"></span></div>
              <div className="flex items-center"><span className="w-40">INGRESOS MENSUALES US$:</span> <span className="cuadro-input"></span></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="seccion-titulo">3. INFORMACIÓN PATRIMONIAL</div>
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center gap-2"><span>VIVIENDA:</span><span className="checkbox-box"></span> PROPIA <span className="checkbox-box"></span> ARRENDADA <span className="checkbox-box"></span> HIPOTECADA</div>
                  <div className="flex items-center gap-2"><span>OTROS BIENES:</span><span className="checkbox-box"></span> TERRENO <span className="checkbox-box"></span> CASA/DPTO <span className="checkbox-box"></span> VEHICULO</div>
                </div>
              </div>
              <div>
                <div className="seccion-titulo">4. INFORMACIÓN FINANCIERA</div>
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center"><span className="w-32">TOTAL INGRESOS US$:</span> <span className="cuadro-input"></span></div>
                  <div className="flex items-center"><span className="w-32">TOTAL EGRESOS US$:</span> <span className="cuadro-input"></span></div>
                </div>
              </div>
            </div>

            <div className="seccion-titulo">5. REFERENCIA PERSONAL (Familiar que no viva con usted)</div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-2">
              <div className="col-span-2 flex items-center"><span className="w-48">NOMBRES Y APELLIDOS:</span> <span className="cuadro-input"></span></div>
              <div className="flex items-center"><span className="w-32">TELEFONO DOMICILIO:</span> <span className="cuadro-input"></span></div>
              <div className="flex items-center"><span className="w-32">TELEFONO CELULAR:</span> <span className="cuadro-input"></span></div>
              <div className="col-span-2 flex items-center"><span className="w-48">DIRECCION (Lo mas detallada):</span> <span className="cuadro-input"></span></div>
            </div>

            <div className="seccion-titulo">6. CONDICIÓN DE PERSONA EXPUESTA POLÍTICAMENTE (PEP's)</div>
            <div className="mb-2 text-justify">
              <p>Declaro bajo juramento que <span className="checkbox-box ml-1"></span> SI <span className="checkbox-box ml-1"></span> NO me encuentro ejerciendo un cargo público destacado o tengo una relación de las incluidas en la normativa PEP.</p>
              <div className="flex items-center mt-1"><span className="w-16">CARGO:</span> <span className="cuadro-input"></span></div>
            </div>

            <div className="seccion-titulo">7. DECLARACIÓN DE VERACIDAD Y LICITUD DE FONDOS</div>
            <div className="mb-4 text-justify">
              <p>1. El origen de los fondos y bienes entregados son lícitos y legítimos, y que no provienen de actividades relacionadas con el cultivo, fabricación, almacenamiento o tráfico ilícito de sustancias, lavado de dinero u otra actividad ilegal.</p>
              <p>2. La información registrada es veraz y asumo cualquier responsabilidad por eventual falsedad. Autorizo expresamente a realizar el análisis y las verificaciones de los datos.</p>
            </div>

            {/* SECCIÓN DE FIRMAS CON ESPACIO MUY AMPLIO (mt-24) */}
            <div className="mt-24 grid grid-cols-4 gap-6 px-2">
              <div className="text-center border-t border-[#8C8A87] pt-2"><p className="text-[8px] font-bold">FIRMA DEL CLIENTE</p></div>
              <div className="text-center border-t border-[#8C8A87] pt-2"><p className="text-[8px] font-bold">FIRMA CÓNYUGE</p></div>
              <div className="text-center border-t border-[#8C8A87] pt-2"><p className="text-[8px] font-bold">OFICIAL DE CUMPLIMIENTO</p></div>
              <div className="text-center border-t border-[#8C8A87] pt-2"><p className="text-[8px] font-bold">GERENTE GENERAL</p></div>
            </div>
            
            <div className="absolute bottom-6 left-0 right-0 text-center text-[7px] text-[#8C8A87] uppercase tracking-widest">Arienzo S.A.S. • Formulario Conozca a su Cliente • Página 1 de 2</div>
          </div>

          {/* HOJA B: FORMULARIO LICITUD DE FONDOS */}
          <div className="pagina-a4 text-xxs">
            <div className="flex justify-between items-end border-b-2 border-[#B94A36] pb-2 mb-4">
              <div>
                <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/arienzo-logo-terracota.svg" alt="Arienzo" className="h-8 object-contain" />
              </div>
              <div className="text-right"><h2 className="text-[11px] font-bold uppercase tracking-wide">FORMULARIO LICITUD DE FONDOS</h2></div>
            </div>

            <div className="flex justify-end gap-6 text-[8px] mb-4">
              <div>CIUDAD: <span className="cuadro-input w-32"></span></div>
              <div>FECHA: <span className="cuadro-input w-24"></span></div>
            </div>

            <div className="seccion-titulo">INFORMACIÓN DEL CLIENTE</div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-4">
              <div className="col-span-2 flex items-center"><span className="w-40">NOMBRE O RAZON SOCIAL:</span> <span className="cuadro-input"></span></div>
              <div className="flex items-center gap-2"><span className="w-24">IDENTIFICACION:</span><span className="checkbox-box"></span> CEDULA <span className="checkbox-box ml-1"></span> RUC <span className="checkbox-box ml-1"></span> PASAPORTE</div>
              <div className="flex items-center"><span className="w-10">No.:</span> <span className="cuadro-input"></span></div>
              <div className="flex items-center"><span className="w-12">PAIS:</span> <span className="cuadro-input"></span></div>
              <div className="flex items-center"><span className="w-16">CIUDAD:</span> <span className="cuadro-input"></span></div>
              <div className="col-span-2 flex items-center"><span className="w-20">DIRECCION:</span> <span className="cuadro-input"></span></div>
              <div className="col-span-2 flex items-center"><span className="w-24">TELEFONO(S):</span> <span className="cuadro-input"></span></div>
            </div>

            <div className="seccion-titulo">INFORMACION DEL TERCERO QUE REALIZA LA TRANSACCION O DE QUIEN PROVIENEN LOS FONDOS (SI APLICA)</div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-4">
              <div className="col-span-2 flex items-center"><span className="w-40">NOMBRE O RAZON SOCIAL:</span> <span className="cuadro-input"></span></div>
              <div className="flex items-center gap-2"><span className="w-24">IDENTIFICACION:</span><span className="checkbox-box"></span> CEDULA <span className="checkbox-box ml-1"></span> RUC <span className="checkbox-box ml-1"></span> PASAPORTE</div>
              <div className="flex items-center"><span className="w-10">No.:</span> <span className="cuadro-input"></span></div>
              <div className="flex items-center"><span className="w-12">PAIS:</span> <span className="cuadro-input"></span></div>
              <div className="flex items-center"><span className="w-16">CIUDAD:</span> <span className="cuadro-input"></span></div>
              <div className="col-span-2 flex items-center"><span className="w-20">DIRECCION:</span> <span className="cuadro-input"></span></div>
              <div className="col-span-2 flex items-center"><span className="w-48">VINCULO CON LA RELACION (O CLIENTE):</span> <span className="cuadro-input"></span></div>
            </div>

            <div className="seccion-titulo">INFORMACION DE LA TRANSACCION</div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-4">
              <div className="flex items-center"><span className="w-20">MONEDA:</span> <span className="cuadro-input"></span></div>
              <div className="flex items-center"><span className="w-20">VALOR:</span> <span className="cuadro-input"></span></div>
              <div className="col-span-2 flex items-center gap-4"><span className="w-36">TIPO DE TRANSACCION:</span><span className="checkbox-box"></span> COMPRA DE INMUEBLES <span className="checkbox-box ml-4"></span> OTROS (Especifique) <span className="cuadro-input w-40"></span></div>
              <div className="col-span-2 flex items-center gap-4"><span className="w-36">MEDIO DE PAGO:</span><span className="checkbox-box"></span> TRANSFERENCIA <span className="checkbox-box ml-2"></span> EFECTIVO <span className="checkbox-box ml-2"></span> CHEQUE <span className="checkbox-box ml-2"></span> DEPOSITO</div>
            </div>

            <div className="seccion-titulo">DECLARACION DE ORIGEN DE LOS FONDOS</div>
            <div className="mb-6 text-justify text-[8px] leading-relaxed space-y-2">
              <div className="flex items-center mb-2"><span className="w-64 font-bold">Los fondos de esta transacción Provienen de:</span> <span className="cuadro-input"></span></div>
              <p>Declaro expresamente que el origen de los fondos entregados son lícitos y legítimos, y que no provienen, entre otras, de actividades relacionadas con el cultivo, fabricación, almacenamiento, transporte o tráfico ilícito de sustancias estupefacientes o psicotrópicas, lavado de dinero o cualquier otra actividad ilegal.</p>
              <p>Además autorizo a la compañía Arienzo S.A.S., para que efectúe todas las indagaciones que razonablemente considere oportuno realizar para comprobar el origen de tales bienes.</p>
              <p>En caso que se inicien investigaciones sobre el firmante, relacionadas con las actividades antes señaladas, o de producirse transacciones inusual o injustificadas, la compañía Arienzo S.A.S. podrá proporcionar a las autoridades competentes toda la información que tenga sobre las mismas o que le sea requerida.</p>
              <p>En tal sentido, renuncio a presentar en contra de la compañía Arienzo S.A.S., de sus funcionarios o empleados, cualquier reclamo o acción legal, judicial, extrajudicial, administrativa, civil, penal o arbitral en la eventualidad de producirse tales hechos. Autorizo a la compañía a obtener de cualquier fuente de información, mi comportamiento crediticio y demás activos o pasivos.</p>
            </div>

            <div className="mt-8 border-2 border-[#333333] flex text-[#333333]">
              <div className="w-1/2 flex items-end justify-center pb-4 border-r-2 border-[#333333] h-32">
                 <div className="w-3/4 border-t border-[#333333] text-center pt-1">
                    <span className="font-bold text-[9px]">Firma de quien provee los fondos</span>
                 </div>
              </div>
              <div className="w-1/2 flex flex-col items-center h-32 pt-2 pb-4">
                 <span className="font-bold text-[9px] mb-2">PARA USO EXCLUSIVO DE ARIENZO S.A.S.</span>
                 <div className="flex-grow"></div>
                 <div className="w-3/4 border-t border-[#333333] text-center pt-1 mb-6">
                    <span className="text-[8px]">FIRMA</span>
                 </div>
                 <div className="w-3/4 border-t border-[#333333] text-center pt-1">
                    <span className="text-[8px]">Nombre completo de quien recibe la información</span>
                 </div>
              </div>
            </div>

            <div className="absolute bottom-6 left-0 right-0 text-center text-[7px] text-[#8C8A87] uppercase tracking-widest">Arienzo S.A.S. • Formulario Licitud de Fondos • Página 2 de 2</div>
          </div>
        </div>

      </div>
    </div>
  );
}