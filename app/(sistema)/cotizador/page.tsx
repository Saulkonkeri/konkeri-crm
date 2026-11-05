'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

interface CuotaMes {
  numeroCuota: number;
  fechaPago: string;
  valor: number;
  esEditable: boolean;
}

const MAPA_PLANOS = [
  { area: 69.43, url: 'https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/planos%20para%20landing/1D_%2069,43m2.png' },
  { area: 86.78, url: 'https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/planos%20para%20landing/1D_86,78m2.png' },
  { area: 100.2, url: 'https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/planos%20para%20landing/2D_100.2m2.png' },
  { area: 106.65, url: 'https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/planos%20para%20landing/2D_106,65m2.png' },
  { area: 121.61, url: 'https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/planos%20para%20landing/2D_121,61m2.png' },
  { area: 129.42, url: 'https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/planos%20para%20landing/2d_129,42m2.png' },
  { area: 150.14, url: 'https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/planos%20para%20landing/3D_150,14m2.png' },
  { area: 158.77, url: 'https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/planos%20para%20landing/3D_158,77m2.png' },
];

const RENDER_FACHADA = 'https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/render-Exterior-Frontal.jpg';
const LOGO_BLANCO = 'https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/logo%20arienzo%20living%20dorado_Mesa%20de%20trabajo%201.svg';

export default function CotizadorPage() {
  const [propiedades, setPropiedades] = useState<any[]>([]);
  const [propiedadSeleccionada, setPropiedadSeleccionada] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [generandoPdf, setGenerandoPdf] = useState(false);
  
  const [mostrarModalCorreo, setMostrarModalCorreo] = useState(false);
  const [enviandoCorreo, setEnviandoCorreo] = useState(false);
  const [mensajeCorreo, setMensajeCorreo] = useState('');
  const [nombreDestinatarioCorreo, setNombreDestinatarioCorreo] = useState('');
  
  const [pestañaActiva, setPestañaActiva] = useState<'configurar' | 'previsualizar'>('configurar');

  const [clientes, setClientes] = useState<any[]>([]);
  const [busquedaCliente, setBusquedaCliente] = useState<string>('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState<string>(''); 
  const [nombreAsesor, setNombreAsesor] = useState<string>('Saúl Intriago');

  const [incluirFechas, setIncluirFechas] = useState<boolean>(true);
  const [tipoDescuento, setTipoDescuento] = useState<'porcentaje' | 'valor'>('porcentaje');
  const [valorDescuento, setValorDescuento] = useState<number>(0);

  const [incluirPlano, setIncluirPlano] = useState<boolean>(true);
  const [incluirFirmas, setIncluirFirmas] = useState<boolean>(true);

  const hoyStr = new Date().toISOString().split('T')[0];
  const sieteDiasDespuesStr = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [fechaCaducidad, setFechaCaducidad] = useState<string>(sieteDiasDespuesStr);
  const [reservaValor, setReservaValor] = useState<number>(2500);

  const [tipoInicial, setTipoInicial] = useState<'porcentaje' | 'valor'>('porcentaje');
  const [valorInicial, setValorInicial] = useState<number>(15); 
  const [mesesInicial, setMesesInicial] = useState<number>(1); 
  
  const [tipoEntrada, setTipoEntrada] = useState<'porcentaje' | 'valor'>('porcentaje');
  const [valorEntrada, setValorEntrada] = useState<number>(25); 
  
  const [mesesConstruccion, setMesesConstruccion] = useState(28);
  
  const [fechaReserva, setFechaReserva] = useState(hoyStr);
  const [fechaFirmaPromesa, setFechaFirmaPromesa] = useState(sieteDiasDespuesStr);

  const [diaPago, setDiaPago] = useState(5);
  const [mesInicio, setMesInicio] = useState(new Date().getMonth() + 1); 
  const [anioInicio, setAnioInicio] = useState(new Date().getFullYear());

  const [cronogramaCuotas, setCronogramaCuotas] = useState<CuotaMes[]>([]);

  useEffect(() => {
    if (propiedadSeleccionada) {
      setMensajeCorreo(`Es un placer saludarle.\n\nAdjunto a este correo encontrará la propuesta de inversión estructurada para la Unidad ${propiedadSeleccionada.unidad || propiedadSeleccionada.numero} en nuestro proyecto Arienzo Living.\n\nEl documento en formato PDF incluye el desglose financiero detallado y el diseño arquitectónico de la propiedad.\n\nQuedo a su entera disposición para cualquier consulta o para agendar una reunión.`);
    }
  }, [propiedadSeleccionada]);

  const formatearFechaLegible = (fechaIso: string) => {
    if (!fechaIso) return '---';
    const partes = fechaIso.split('-');
    if(partes.length !== 3) return fechaIso;
    const mesesNombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const mesIndex = parseInt(partes[1], 10) - 1;
    return `${partes[2]} de ${mesesNombres[mesIndex]} ${partes[0]}`;
  };

  useEffect(() => {
    async function cargarDatosIniciales() {
      try {
        const { data: dataProp } = await supabase.from('propiedades').select('*');
        if (dataProp) {
          const datosOrdenados = dataProp.sort((a, b) => (parseInt(a.unidad || a.numero, 10) || 0) - (parseInt(b.unidad || b.numero, 10) || 0));
          setPropiedades(datosOrdenados);
        }
        const { data: dataCli } = await supabase.from('clientes').select('id, nombres, apellidos, tipo, telefono, email').order('nombres', { ascending: true });
        if (dataCli) setClientes(dataCli);
      } catch (err) {
        console.error("Error cargando datos:", err);
      } finally {
        setCargando(false);
      }
    }
    cargarDatosIniciales();
  }, []);

  const clientesFiltrados = useMemo(() => {
    if (!busquedaCliente.trim()) return clientes;
    const b = busquedaCliente.toLowerCase();
    return clientes.filter(c => `${c.nombres || ''} ${c.apellidos || ''}`.toLowerCase().includes(b) || (c.telefono && c.telefono.includes(b)));
  }, [clientes, busquedaCliente]);

  const clienteDataCompleta = useMemo(() => {
    if (!clienteSeleccionado) return null;
    return clientes.find(item => item.id.toString() === clienteSeleccionado.toString());
  }, [clienteSeleccionado, clientes]);

  useEffect(() => {
    if (clienteDataCompleta) {
      setNombreDestinatarioCorreo(`${clienteDataCompleta.nombres || ''} ${clienteDataCompleta.apellidos || ''}`.trim());
    } else {
      setNombreDestinatarioCorreo('Cliente / Inversionista');
    }
  }, [clienteDataCompleta]);

  const { 
    precioListaOriginal, montoDescuentoCalculado, precioDeptoPreLanzamiento, valAnexosPreLanzamiento, precioTotal, 
    cuotaInicialTotal, saldoFirmaPromesa, entradaDiferirTotal, contraEntrega,
    pctInicialReal, pctFirmaReal, pctEntradaReal, pctContraEntregaReal, areaTotal, valorM2Lanzamiento,
    tipologia, parqueaderoTexto, bodegaAsignada, esLocal, cantidadParqueos, urlPlanoAsignado,
    numHabitaciones, numBanos
  } = useMemo(() => {
    const listaOriginal = propiedadSeleccionada ? Number(propiedadSeleccionada.precio) : 0;
    const asignadoText = propiedadSeleccionada?.parqueadero_asignado || '';
    const bodegaText = propiedadSeleccionada?.bodega_asignada || 'Ninguna';
    const tipologiaReal = propiedadSeleccionada?.tipologia || '---';
    
    const isLocalComercial = (propiedadSeleccionada?.categoria || '').toLowerCase().includes('local') || tipologiaReal.toLowerCase().includes('local');

    let cant = propiedadSeleccionada ? Number(propiedadSeleccionada.parqueadero_cantidad || 0) : 0;
    if (cant === 0 && asignadoText) {
      const coincidencias = asignadoText.match(/P\d+/gi);
      cant = coincidencias ? coincidencias.length : 1; 
      if (asignadoText.toLowerCase().includes('ningun') || asignadoText.toLowerCase().includes('no')) cant = 0;
    }

    let valAnexosBase = cant >= 2 ? 20000 : cant === 1 ? 11000 : 0;
    const valAnexosDescontados = isLocalComercial ? 0 : valAnexosBase * 0.95;
    const precioDeptoDescontado = Math.max(0, listaOriginal - valAnexosDescontados);

    let descuentoMonto = tipoDescuento === 'porcentaje' ? listaOriginal * (valorDescuento / 100) : valorDescuento;
    const precioFin = Math.max(0, listaOriginal - descuentoMonto);
    
    let inicialDeseado = tipoInicial === 'porcentaje' ? precioFin * (valorInicial / 100) : valorInicial;
    let entradaDeseada = tipoEntrada === 'porcentaje' ? precioFin * (valorEntrada / 100) : valorEntrada;

    let saldoPromesa = inicialDeseado - reservaValor;
    let entradaDiferir = entradaDeseada;

    if (saldoPromesa < 0) {
      const reservaSobrante = Math.abs(saldoPromesa);
      saldoPromesa = 0; 
      entradaDiferir = Math.max(0, entradaDiferir - reservaSobrante); 
    }

    const totalPagadoAntesDeEntrega = reservaValor + saldoPromesa + entradaDiferir;
    if (totalPagadoAntesDeEntrega > precioFin) {
      entradaDiferir = Math.max(0, precioFin - reservaValor - saldoPromesa);
    }

    let entrega = Math.max(0, precioFin - reservaValor - saldoPromesa - entradaDiferir);

    const pReserva = precioFin > 0 ? (reservaValor / precioFin) * 100 : 0;
    const pFirma = precioFin > 0 ? (saldoPromesa / precioFin) * 100 : 0;
    const pInicialTotal = pReserva + pFirma; 
    const pEntrada = precioFin > 0 ? (entradaDiferir / precioFin) * 100 : 0;
    const pEntrega = precioFin > 0 ? (entrega / precioFin) * 100 : 0;

    let textoParqueo = 'Ninguno';
    if (asignadoText && asignadoText.toLowerCase() !== 'ninguno') textoParqueo = `${asignadoText} (${cant})`;
    else if (cant > 0) textoParqueo = `Asignado (${cant})`;

    const area = propiedadSeleccionada ? Number(propiedadSeleccionada.area_total || 0) : 0;
    const m2Lanzamiento = area > 0 ? precioDeptoDescontado / area : 0;
    
    let urlPlano = '';
    if (area > 0 && !isLocalComercial) {
      const planoMasCercano = MAPA_PLANOS.reduce((prev, curr) => 
        Math.abs(curr.area - area) < Math.abs(prev.area - area) ? curr : prev
      );
      if (Math.abs(planoMasCercano.area - area) <= 15) { 
        urlPlano = planoMasCercano.url;
      }
    }

    let camas = "1";
    let banos = "1.5";
    const tipoLower = tipologiaReal.toLowerCase();
    if (tipoLower.includes('suite')) { camas = "1"; banos = "1.5"; }
    else if (tipoLower.includes('2') || tipoLower.includes('dos')) { camas = "2"; banos = "2.5"; }
    else if (tipoLower.includes('3') || tipoLower.includes('tres')) { camas = "3"; banos = "3.5"; }

    return {
      precioListaOriginal: listaOriginal, montoDescuentoCalculado: descuentoMonto, precioDeptoPreLanzamiento: precioDeptoDescontado,
      valAnexosPreLanzamiento: valAnexosDescontados, precioTotal: precioFin, cuotaInicialTotal: reservaValor + saldoPromesa,
      saldoFirmaPromesa: saldoPromesa, entradaDiferirTotal: entradaDiferir, contraEntrega: entrega,
      pctInicialReal: pInicialTotal, pctFirmaReal: pFirma, pctEntradaReal: pEntrada, pctContraEntregaReal: pEntrega,
      areaTotal: area, valorM2Lanzamiento: m2Lanzamiento, tipologia: tipologiaReal,
      parqueaderoTexto: textoParqueo, bodegaAsignada: bodegaText, esLocal: isLocalComercial, cantidadParqueos: cant > 0 ? cant : 1,
      urlPlanoAsignado: urlPlano, numHabitaciones: camas, numBanos: banos
    };
  }, [propiedadSeleccionada, tipoInicial, valorInicial, tipoEntrada, valorEntrada, tipoDescuento, valorDescuento, reservaValor, mesesInicial]);

  useEffect(() => {
    if (!propiedadSeleccionada || entradaDiferirTotal <= 0 || mesesConstruccion <= 0) {
      setCronogramaCuotas([]);
      return;
    }

    const valorBaseCuota = entradaDiferirTotal / mesesConstruccion;
    const mesesNombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    const cuotasCalculadas = Array.from({ length: mesesConstruccion }, (_, i) => {
      let etiquetaFecha = `Mes ${i + 1}`;
      if (incluirFechas) {
        const mesRelativo = (mesInicio - 1) + i;
        const fechaCuota = new Date(anioInicio, mesRelativo, diaPago);
        etiquetaFecha = `${String(fechaCuota.getDate()).padStart(2, '0')} de ${mesesNombres[fechaCuota.getMonth()]} ${fechaCuota.getFullYear()}`;
      }
      return { numeroCuota: i + 1, fechaPago: etiquetaFecha, valor: valorBaseCuota, esEditable: false };
    });
    setCronogramaCuotas(cuotasCalculadas);
  }, [propiedadSeleccionada, mesesConstruccion, entradaDiferirTotal, diaPago, mesInicio, anioInicio, incluirFechas]);

  const cuotasDivididas = useMemo(() => {
    const mitad = Math.ceil(cronogramaCuotas.length / 2);
    return { columnaIzquierda: cronogramaCuotas.slice(0, mitad), columnaDerecha: cronogramaCuotas.slice(mitad) };
  }, [cronogramaCuotas]);

  const guardarCotizacionEnSistema = async () => {
    if (!propiedadSeleccionada) return;
    setGuardando(true);
    try {
      const { error } = await supabase.from('cotizaciones').insert([{
        cliente_id: clienteSeleccionado || null, 
        unidad_id: propiedadSeleccionada.id.toString(), unidad_numero: propiedadSeleccionada.unidad || propiedadSeleccionada.numero,
        precio_lista: precioListaOriginal, monto_descuento: montoDescuentoCalculado, motivo_descuento: null,
        precio_total: precioTotal, porcentaje_inicial: Number(pctInicialReal.toFixed(2)), monto_inicial: cuotaInicialTotal,
        porcentaje_entrada: Number(pctEntradaReal.toFixed(2)), monto_entrada: entradaDiferirTotal, meses_plazo: mesesConstruccion,
        monto_contra_entrega: contraEntrega, cronograma_pagos: cronogramaCuotas, estado: 'Vigente'
      }]);
      if (!error) alert('¡Cotización guardada exitosamente!');
    } catch (err: any) { alert(`Error inesperado: ${err.message}`); } finally { setGuardando(false); }
  };

  const descargarPdfComercial = () => {
    if (typeof window === 'undefined') return;
    setGenerandoPdf(true);
    setPestañaActiva('previsualizar');
    
    setTimeout(() => {
      try {
        const elemento = document.getElementById('plantilla-pdf-arienzo');
        if (!elemento) return;

        const ventanaImpresion = window.open('', '_blank');
        if (!ventanaImpresion) return;

        ventanaImpresion.document.write(`
          <html>
            <head>
              <title>Arienzo_Unidad_${propiedadSeleccionada?.unidad || propiedadSeleccionada?.numero}</title>
              <script src="https://cdn.tailwindcss.com"></script>
              <style>
                @page { size: A4 portrait; margin: 0; }
                body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; font-family: ui-sans-serif, system-ui, sans-serif; background: white; margin: 0; padding: 0; }
                .pdf-page-container { width: 210mm !important; height: 297mm !important; max-height: 297mm !important; page-break-after: always; box-sizing: border-box; background: white; position: relative; overflow: hidden; margin: 0; }
                @media print { body { background: white; } #wrapper { width: 100% !important; margin: 0 !important; padding: 0 !important; align-items: flex-start !important; } .pdf-page-container { box-shadow: none !important; border: none !important; margin: 0 !important;} }
              </style>
            </head>
            <body><div id="wrapper" class="flex flex-col items-center">${elemento.innerHTML}</div><script>setTimeout(() => { window.print(); window.close(); }, 800);</script></body>
          </html>
        `);
        ventanaImpresion.document.close();
      } catch (error) { alert('Error al generar el documento.'); } finally { setGenerandoPdf(false); }
    }, 500);
  };

  const enviarCotizacionPorCorreo = async () => {
    setEnviandoCorreo(true);
    try {
      const elemento = document.getElementById('plantilla-pdf-arienzo');
      if (!elemento) throw new Error("No se encontró el diseño de la cotización");

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @page { size: A4 portrait; margin: 0; }
              body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; font-family: sans-serif; background: white; margin: 0; padding:0;}
              .pdf-page-container { width: 210mm; height: 297mm; box-sizing: border-box; background: white; position: relative; overflow: hidden; margin: 0 auto; page-break-after: always;}
            </style>
          </head>
          <body><div class="flex flex-col items-center">${elemento.innerHTML}</div></body>
        </html>
      `;

      const emailHtmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #EAE3DC; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #B94A36; padding: 25px; text-align: center;">
            <img src="${LOGO_BLANCO}" height="35" alt="Arienzo Living" style="display: block; margin: 0 auto;" />
          </div>
          <div style="padding: 35px 30px; color: #415364; font-size: 14px; line-height: 1.6; background-color: #ffffff;">
            <p style="margin-top: 0;">Estimado/a <strong style="color: #21242E;">${nombreDestinatarioCorreo}</strong>,</p>
            <div style="margin-top: 20px; margin-bottom: 25px; color: #415364;">${mensajeCorreo.replace(/\n/g, '<br/>')}</div>
            ${incluirFirmas ? `
            <div style="margin-top: 35px; padding-top: 25px; border-top: 1px solid #EAE3DC;">
              <p style="margin: 0; color: #B94A36; font-weight: bold; font-size: 15px;">${nombreAsesor}</p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #737373;">Asesor Comercial - Arienzo Living<br/>Konkeri Developer Group</p>
            </div>
            ` : ''}
          </div>
        </div>
      `;

      const response = await fetch('/api/enviar-cotizacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailDestino: clienteDataCompleta?.email,
          nombreCliente: nombreDestinatarioCorreo,
          asesor: nombreAsesor,
          unidad: propiedadSeleccionada?.unidad || propiedadSeleccionada?.numero,
          htmlCotizacion: htmlContent,
          htmlBody: emailHtmlBody
        })
      });

      if (response.ok) {
        alert(`✅ Cotización enviada con éxito al correo: ${clienteDataCompleta?.email}`);
        setMostrarModalCorreo(false);
      } else {
        const errData = await response.json();
        alert(`❌ Error: ${errData.error}`);
      }
    } catch (error) {
      alert('❌ Error al procesar el envío por correo.');
    } finally {
      setEnviandoCorreo(false);
    }
  };

  if (cargando) return <div className="flex min-h-screen items-center justify-center bg-[#dce3eb]"><p className="text-sm font-bold tracking-widest text-[#ea0029] uppercase animate-pulse">Cargando...</p></div>;

  return (
    <div className="min-h-screen bg-[#dce3eb] p-4 md:p-6 font-sans text-[#415364] relative">
      
      {/* MODAL CORREO */}
      {mostrarModalCorreo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#21242E]/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[95vh] shadow-2xl flex flex-col animate-in fade-in zoom-in-95">
            <div className="px-6 py-5 border-b border-neutral-100 flex justify-between items-center bg-[#F9F7F5] shrink-0 rounded-t-2xl">
              <h3 className="font-bold text-[#B94A36] uppercase tracking-widest text-sm">Preparar Envío</h3>
              <button onClick={() => setMostrarModalCorreo(false)} className="text-neutral-400 hover:text-[#ea0029]">✕</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 custom-scrollbar">
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="bg-[#dce3eb]/30 border border-[#415364]/10 rounded-xl p-3.5">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5 block">Destinatario</label>
                    <input type="text" value={nombreDestinatarioCorreo} onChange={(e) => setNombreDestinatarioCorreo(e.target.value)} className="w-full bg-white border border-[#415364]/20 rounded-lg p-2 text-sm font-bold outline-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#ea0029] uppercase tracking-widest">Cuerpo del Mensaje</label>
                  <textarea value={mensajeCorreo} onChange={(e) => setMensajeCorreo(e.target.value)} className="w-full bg-white border border-[#415364]/20 rounded-xl p-4 text-[13px] h-48 outline-none resize-none shadow-sm" />
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-neutral-100 bg-white flex justify-end gap-3 shrink-0 rounded-b-2xl">
              <button onClick={() => setMostrarModalCorreo(false)} className="px-6 py-3 rounded-xl text-xs font-bold hover:bg-neutral-100">Cancelar</button>
              <button onClick={enviarCotizacionPorCorreo} disabled={enviandoCorreo} className="bg-[#ea0029] text-white px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#c90022]">Enviar</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER PRINCIPAL */}
      <div className="w-full flex-shrink-0 mb-6 space-y-3">
        <div className="bg-white rounded-2xl border border-neutral-200/60 p-5 shadow-sm flex justify-between items-center">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-[#ea0029] uppercase">Estructurador</span>
            <h1 className="text-2xl font-bold tracking-tight text-[#415364] mt-1">Cotizador Oficial</h1>
          </div>
          {propiedadSeleccionada && (
            <div className="flex bg-[#dce3eb]/50 p-1.5 rounded-xl">
              <button onClick={() => setPestañaActiva('configurar')} className={`px-4 py-2 rounded-lg text-xs transition-all ${pestañaActiva === 'configurar' ? 'bg-white text-[#ea0029] font-bold' : 'text-[#415364]/70 font-semibold'}`}>Configurar Plan</button>
              <button onClick={() => setPestañaActiva('previsualizar')} className={`px-4 py-2 rounded-lg text-xs transition-all ${pestañaActiva === 'previsualizar' ? 'bg-white text-[#ea0029] font-bold' : 'text-[#415364]/70 font-semibold'}`}>Ver Documento PDF</button>
            </div>
          )}
        </div>
      </div>

      <div className="w-full mx-auto grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* COLUMNA PRINCIPAL */}
        <div className="xl:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-[#D1C292] p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#D1C292]"></div>
            <h2 className="text-[11px] font-bold text-[#21242E] uppercase tracking-widest mb-4">Selección de Inventario</h2>
            <select
              className="w-full bg-[#F9F7F5] border border-[#D1C292]/50 rounded-xl p-3.5 text-sm font-bold outline-none"
              value={propiedadSeleccionada?.id || ''}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '') { setPropiedadSeleccionada(null); setPestañaActiva('configurar'); } 
                else { setPropiedadSeleccionada(propiedades.find(p => p.id === Number(val) || p.id === val)); }
              }}
            >
              <option value="">-- Selecciona una Unidad --</option>
              {propiedades.map((prop) => <option key={prop.id} value={prop.id}>Unidad {prop.unidad || prop.numero} ({prop.tipologia || 'S/T'})</option>)}
            </select>
          </div>

          {!propiedadSeleccionada ? (
            <div className="bg-white rounded-2xl border border-dashed border-[#415364]/20 p-16 text-center text-[#415364]/40">
              <p className="text-sm font-bold uppercase tracking-widest">Selecciona una unidad para habilitar el cotizador.</p>
            </div>
          ) : pestañaActiva === 'configurar' ? (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-white rounded-2xl border border-neutral-200/60 p-6 shadow-sm">
                <h3 className="text-xs font-bold text-[#ea0029] uppercase tracking-widest mb-4 border-b border-neutral-100 pb-2">Estructura de Pagos Lineal</h3>
                <div className="grid grid-cols-2 gap-5 pt-4">
                  <div>
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-2">Valor Reserva ($)</label>
                    <input type="number" value={reservaValor} onChange={e => setReservaValor(Number(e.target.value))} className="w-full p-3 bg-white border border-neutral-200 rounded-xl text-sm font-bold font-mono outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-2">Firma Promesa (Completar Inicial)</label>
                    <div className="flex gap-2">
                      <select value={tipoInicial} onChange={e => setTipoInicial(e.target.value as any)} className="w-1/3 p-3 bg-white border border-neutral-200 rounded-xl text-xs font-bold outline-none"><option value="porcentaje">%</option><option value="valor">$</option></select>
                      <input type="number" value={valorInicial} onChange={e => setValorInicial(Number(e.target.value))} className="w-2/3 p-3 bg-white border border-neutral-200 rounded-xl text-sm font-bold font-mono outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-2">Entrada Diferida (Durante Obra)</label>
                    <div className="flex gap-2">
                      <select value={tipoEntrada} onChange={e => setTipoEntrada(e.target.value as any)} className="w-1/3 p-3 bg-white border border-neutral-200 rounded-xl text-xs font-bold outline-none"><option value="porcentaje">%</option><option value="valor">$</option></select>
                      <input type="number" value={valorEntrada} onChange={e => setValorEntrada(Number(e.target.value))} className="w-2/3 p-3 bg-white border border-neutral-200 rounded-xl text-sm font-bold font-mono outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-2">Meses de Construcción (Plazo)</label>
                    <input type="number" value={mesesConstruccion} onChange={e => setMesesConstruccion(Number(e.target.value))} className="w-full p-3 bg-white border border-neutral-200 rounded-xl text-sm font-bold font-mono outline-none" />
                  </div>
                </div>
              </div>
            </div>
          ) : pestañaActiva === 'previsualizar' ? (
            
            /* =========================================================================
               PLANTILLA DEL PDF EXACTA (DOS COLUMNAS Y ICONOS DE SUPABASE)
               ========================================================================= */
            <div className="bg-[#525659] w-full rounded-2xl shadow-inner border border-[#415364]/30 overflow-auto max-h-[85vh] custom-scrollbar text-center">
              <div className="inline-block text-left py-12 px-4 sm:px-12 min-w-max">
                <div id="plantilla-pdf-arienzo" className="flex flex-col gap-10 print:gap-0" style={{ width: '210mm' }}>
                  
                  {/* PÁGINA 1: PROPUESTA FINANCIERA (IDÉNTICA A TUS FOTOS) */}
                  <div style={{ width: '210mm', height: '297mm', minWidth: '210mm', minHeight: '297mm' }} className="pdf-page-container bg-white text-neutral-900 relative flex flex-col mx-auto shrink-0 print:shadow-none shadow-2xl">
                    <div className="px-10 pt-10 pb-6 flex flex-col h-full">
                      
                      {/* Cabecera Logo y Fecha */}
                      <div className="flex justify-between items-end border-b-2 border-neutral-200 pb-4 mb-6">
                        <div>
                          <h1 className="text-3xl font-bold tracking-widest text-[#B94A36]">ARIENZO</h1>
                          <h2 className="text-sm font-bold tracking-[0.2em] text-neutral-500 uppercase mt-0.5">LIVING</h2>
                        </div>
                        <div className="text-right">
                          <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">PROPUESTA DE INVERSIÓN</h3>
                          <p className="text-[10px] text-neutral-500">Emisión: {new Date().toLocaleDateString('es-EC')}</p>
                          <p className="text-[10px] text-neutral-500 font-bold">Válida hasta: {formatearFechaLegible(fechaCaducidad)}</p>
                        </div>
                      </div>

                      {/* Datos del Cliente */}
                      <div className="mb-6">
                        <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-1">INVERSIONISTA DE PROPUESTA</p>
                        <p className="text-xl font-bold text-[#21242E] border-b border-neutral-100 pb-3">{nombreDestinatarioCorreo}</p>
                      </div>

                      {/* Detalles de la Unidad */}
                      <div className="flex items-center justify-between text-[11px] mb-6">
                        <div className="flex-1 text-left">
                          <span className="text-[8px] text-neutral-400 uppercase block mb-1 font-bold">UNIDAD</span>
                          <span className="font-bold text-[#21242E] text-sm">Unidad {propiedadSeleccionada?.unidad || propiedadSeleccionada?.numero}</span>
                        </div>
                        <div className="flex-1 text-left">
                          <span className="text-[8px] text-neutral-400 uppercase block mb-1 font-bold">TIPOLOGIA</span>
                          <span className="font-bold text-[#21242E] text-sm">{tipologia}</span>
                        </div>
                        <div className="flex-1 text-left">
                          <span className="text-[8px] text-neutral-400 uppercase block mb-1 font-bold">COMPLEMENTOS ASIGNADOS</span>
                          <span className="font-semibold text-neutral-700 block text-xs">P: {parqueaderoTexto}</span>
                          <span className="font-semibold text-neutral-700 block text-xs">B: {bodegaAsignada}</span>
                        </div>
                        <div className="flex-1 text-center">
                          <span className="text-[8px] text-neutral-400 uppercase block mb-1 font-bold">AREA TOTAL</span>
                          <span className="font-bold text-[#B94A36] text-sm">{areaTotal}m²</span>
                        </div>
                        {!esLocal && (
                          <div className="flex-1 text-right border-l border-neutral-200 pl-4">
                            <span className="text-[8px] text-neutral-400 uppercase block mb-1 font-bold">VALOR M² (PRE LANZAMIENTO)</span>
                            <span className="font-bold text-[#415364] font-mono text-sm">${valorM2Lanzamiento.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}/m²</span>
                          </div>
                        )}
                      </div>

                      {/* Plan de Financiamiento Específico */}
                      <div className="mb-6">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-white bg-[#B94A36] py-1.5 px-3 mb-2 rounded-sm inline-block">PLAN DE FINANCIAMIENTO ESPECÍFICO</h4>
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-neutral-300 text-neutral-500 text-[9px] uppercase tracking-wider">
                              <th className="py-2 font-bold w-[45%]">CONCEPTO ESTRUCTURADO</th>
                              <th className="py-2 text-center font-bold">FECHA / CONTROL</th>
                              <th className="py-2 text-center font-bold">PORCENTAJE</th>
                              <th className="py-2 text-right font-bold">MONTO</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-100 text-neutral-800">
                            <tr>
                              <td className="py-2.5">Valor del Departamento (Pre Lanzamiento)</td>
                              <td className="py-2.5 text-center text-neutral-400">—</td>
                              <td className="py-2.5 text-center text-neutral-400">—</td>
                              <td className="py-2.5 text-right font-mono font-bold">${precioDeptoPreLanzamiento.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                            </tr>
                            {!esLocal && (
                              <tr>
                                <td className="py-2.5"><span className="text-neutral-400 mr-1">(+)</span> Valor Parqueo y Bodega (Pre Lanzamiento)</td>
                                <td className="py-2.5 text-center text-neutral-400">—</td>
                                <td className="py-2.5 text-center text-neutral-400">—</td>
                                <td className="py-2.5 text-right font-mono font-bold">${valAnexosPreLanzamiento.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                              </tr>
                            )}
                            <tr className="bg-neutral-50/50 font-bold border-y-2 border-neutral-200">
                              <td className="py-3"><span className="text-neutral-600 mr-1">(=)</span> Valor Total de Venta</td>
                              <td className="py-3 text-center text-neutral-400">—</td>
                              <td className="py-3 text-center text-neutral-400">—</td>
                              <td className="py-3 text-right font-mono text-[14px]">${precioTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                            </tr>
                            <tr>
                              <td className="py-2.5 pl-3">↳ Reserva para Bloqueo</td>
                              <td className="py-2.5 text-center text-neutral-500 text-[10px]">{formatearFechaLegible(fechaReserva)}</td>
                              <td className="py-2.5 text-center text-neutral-500 text-[10px]">{Number(pctInicialReal.toFixed(1))}%</td>
                              <td className="py-2.5 text-right font-mono">${reservaValor.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                            </tr>
                            <tr>
                              <td className="py-2.5 pl-3">↳ Abono Inicial Promesa</td>
                              <td className="py-2.5 text-center text-neutral-500 text-[10px]">{formatearFechaLegible(fechaFirmaPromesa)}</td>
                              <td className="py-2.5 text-center text-neutral-500 text-[10px]">{Number(pctFirmaReal.toFixed(1))}%</td>
                              <td className="py-2.5 text-right font-mono">${saldoFirmaPromesa.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                            </tr>
                            <tr>
                              <td className="py-2.5 pl-3 font-bold text-[#415364]">↳ Monto Diferido Construcción</td>
                              <td className="py-2.5 text-center text-neutral-500 text-[10px]">Diferido mensual</td>
                              <td className="py-2.5 text-center text-neutral-500 text-[10px]">{Number(pctEntradaReal.toFixed(1))}%</td>
                              <td className="py-2.5 text-right font-bold font-mono text-[#415364]">${entradaDiferirTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                            </tr>
                            <tr>
                              <td className="py-3 pl-3 font-bold text-[#B94A36] text-[13px]">↳ Saldo Final Contra Entrega</td>
                              <td className="py-3 text-center text-[#B94A36] text-[10px]">A la entrega física</td>
                              <td className="py-3 text-center text-[#B94A36] text-[10px] font-bold">{Number(pctContraEntregaReal.toFixed(1))}%</td>
                              <td className="py-3 text-right font-bold text-[#B94A36] font-mono text-[14px]">${contraEntrega.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                            </tr>
                          </tbody>
                        </table>
                        <p className="text-[8px] text-neutral-400 mt-2 italic">* Nota: El Valor Total de Venta detallado ya considera un 5% de descuento por etapa de pre-lanzamiento respecto al precio de lista estándar.</p>
                      </div>

                      {/* Cronograma en 2 Columnas (Idéntico a foto) */}
                      {entradaDiferirTotal > 0 && (
                        <div className="shrink-0 mb-4">
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#B94A36] mb-1.5">CRONOGRAMA DE PAGOS ({mesesConstruccion} DIVIDENDOS)</h4>
                          <div className="border-t border-[#B94A36] w-full mb-1"></div>
                          <div className="grid grid-cols-2 gap-x-12 items-start text-[10px] text-neutral-600">
                            <div className="space-y-0">
                              {cuotasDivididas.columnaIzquierda.map((cuota) => (
                                <div key={cuota.numeroCuota} className="flex justify-between border-b border-neutral-100 py-[2.5px]">
                                  <span>C{cuota.numeroCuota} | {cuota.fechaPago}</span>
                                  <span className="font-bold text-neutral-800 font-mono">${cuota.valor.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                </div>
                              ))}
                            </div>
                            <div className="space-y-0">
                              {cuotasDivididas.columnaDerecha.map((cuota) => (
                                <div key={cuota.numeroCuota} className="flex justify-between border-b border-neutral-100 py-[2.5px]">
                                  <span>C{cuota.numeroCuota} | {cuota.fechaPago}</span>
                                  <span className="font-bold text-neutral-800 font-mono">${cuota.valor.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Valores Agregados */}
                      <div className="shrink-0 border border-[#EAE3DC] rounded-[8px] p-3.5 bg-[#FDF8F5] mb-4 mt-auto">
                        <h4 className="text-[9px] font-bold uppercase tracking-widest text-[#B94A36] mb-1.5">VALORES AGREGADOS A LA UNIDAD</h4>
                        <ul className="text-[9px] text-neutral-700 space-y-1 pl-3 list-disc marker:text-[#DEB886]">
                          {esLocal ? (
                            <li><span className="font-bold text-neutral-800">Complemento Inmobiliario:</span> La unidad incluye {cantidadParqueos} parqueo{cantidadParqueos !== 1 ? 's' : ''}.</li>
                          ) : (
                            <li><span className="font-bold text-neutral-800">Complementos Inmobiliarios:</span> El Valor Total de Venta ya contempla la asignación de los parqueos y la bodega detallados en la ficha técnica.</li>
                          )}
                          {!esLocal && (<li><span className="font-bold text-neutral-800">Equipamiento:</span> La unidad incluye calentador de agua.</li>)}
                        </ul>
                      </div>

                      {/* Firmas */}
                      {incluirFirmas && (
                        <div className="mt-4 shrink-0 pt-2 pb-2">
                          <div className="grid grid-cols-2 gap-24 text-center text-[10px] px-10">
                            <div>
                              <div className="border-t border-neutral-300 w-full mb-2"></div>
                              <p className="font-bold text-[#B94A36] uppercase tracking-wider">ARIENZO LIVING</p>
                              <p className="text-neutral-400 mt-1">Emitido por: {nombreAsesor || 'Saúl Intriago'}</p>
                            </div>
                            <div>
                              <div className="border-t border-neutral-300 w-full mb-2"></div>
                              <p className="font-bold text-neutral-800 uppercase tracking-wider">ACEPTACIÓN DE PROPUESTA</p>
                              <p className="text-neutral-400 mt-1">Firma del Inversionista</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* --- PÁGINA 2: PLANO ARQUITECTÓNICO E ICONOS DE SUPABASE --- */}
                  {incluirPlano && (
                    <div style={{ width: '210mm', height: '297mm', minWidth: '210mm', minHeight: '297mm' }} className="pdf-page-container bg-white text-neutral-900 relative flex flex-col mx-auto shrink-0 print:shadow-none shadow-2xl">
                      <div className="px-10 py-10 flex flex-col h-full">
                         <div className="flex-1 flex flex-col border border-neutral-300 rounded-[12px] overflow-hidden shadow-sm bg-white">
                            
                            <div className="flex h-[150px] shrink-0 bg-white border-b border-neutral-200">
                               <div className="w-[230px] h-full shrink-0 bg-[#181A20]">
                                  <img src={RENDER_FACHADA} className="w-full h-full object-cover" alt="Fachada Arienzo" />
                               </div>
                               <div className="flex-1 pl-8 pr-6 flex flex-col justify-center text-left">
                                  <h3 className="text-[15px] font-bold tracking-widest uppercase text-[#B94A36]">Diseño Arquitectónico</h3>
                                  <p className="text-[11px] mt-0.5 font-bold tracking-wider text-neutral-800">Unidad {propiedadSeleccionada?.unidad || propiedadSeleccionada?.numero} | {tipologia}</p>
                                  <p className="text-[9.5px] text-neutral-600 leading-snug mt-2 text-justify">
                                    Un diseño arquitectónico exclusivo y minuciosamente pensado por el prestigioso estudio Diez+Muller, uno de los más reconocidos del país. Cada espacio ha sido concebido para ofrecer un estilo de vida superior, destacando una distribución inteligente y una selección de acabados de excelente calidad.
                                  </p>
                               </div>
                            </div>

                            {/* Fila de Íconos */}
                            <div className="bg-[#F9F7F5] px-4 py-3.5 grid grid-cols-7 gap-1 items-center shrink-0 border-b border-neutral-200">
                               <div className="flex flex-col items-center gap-1.5 border-r border-neutral-300">
                                  <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/iconos/area.png" alt="Área Total" className="w-[22px] h-[22px] object-contain" />
                                  <span className="text-[6.5px] font-bold text-neutral-500 uppercase tracking-widest">Área Total</span>
                                  <span className="text-[10px] font-black text-[#B94A36]">{areaTotal} m²</span>
                               </div>
                               <div className="flex flex-col items-center gap-1.5 border-r border-neutral-300">
                                  <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/iconos/dormitorio.png" alt="Dormitorios" className="w-[22px] h-[22px] object-contain" />
                                  <span className="text-[6.5px] font-bold text-neutral-500 uppercase tracking-widest">Dormitorios</span>
                                  <span className="text-[10px] font-bold text-[#21242E]">{numHabitaciones}</span>
                               </div>
                               <div className="flex flex-col items-center gap-1.5 border-r border-neutral-300">
                                  <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/iconos/ducha.png" alt="Baños" className="w-[22px] h-[22px] object-contain" />
                                  <span className="text-[6.5px] font-bold text-neutral-500 uppercase tracking-widest">Baños</span>
                                  <span className="text-[10px] font-bold text-[#21242E]">{numBanos}</span>
                               </div>
                               <div className="flex flex-col items-center gap-1.5 border-r border-neutral-300">
                                  <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/iconos/lavadora.png" alt="Lavandería" className="w-[22px] h-[22px] object-contain" />
                                  <span className="text-[6.5px] font-bold text-neutral-500 uppercase tracking-widest">Lavandería</span>
                                  <span className="text-[10px] font-bold text-[#21242E]">Sí</span>
                               </div>
                               <div className="flex flex-col items-center gap-1.5 border-r border-neutral-300">
                                  <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/iconos/terraza.png" alt="Terraza" className="w-[22px] h-[22px] object-contain" />
                                  <span className="text-[6.5px] font-bold text-neutral-500 uppercase tracking-widest">Terraza</span>
                                  <span className="text-[10px] font-bold text-[#21242E]">Sí</span>
                               </div>
                               <div className="flex flex-col items-center gap-1.5 border-r border-neutral-300">
                                  <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/iconos/garaje.png" alt="Parqueos" className="w-[22px] h-[22px] object-contain" />
                                  <span className="text-[6.5px] font-bold text-neutral-500 uppercase tracking-widest">Parqueos</span>
                                  <span className="text-[10px] font-bold text-[#21242E]">{cantidadParqueos}</span>
                               </div>
                               <div className="flex flex-col items-center gap-1.5">
                                  <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/iconos/bodega.png" alt="Bodega" className="w-[22px] h-[22px] object-contain" />
                                  <span className="text-[6.5px] font-bold text-neutral-500 uppercase tracking-widest">Bodega</span>
                                  <span className="text-[10px] font-bold text-[#21242E]">{bodegaAsignada && bodegaAsignada.toLowerCase() !== 'ninguna' ? 'Sí' : 'No'}</span>
                               </div>
                            </div>

                            <div className="flex-1 flex items-center justify-center p-6 relative bg-white">
                               <div className="w-full h-full max-h-[110mm] flex items-center justify-center">
                                  <img src={urlPlanoAsignado} alt="Plano Arienzo" className="max-w-[75%] max-h-full object-contain mix-blend-multiply" />
                               </div>
                            </div>

                            {/* Especificaciones */}
                            <div className="px-8 py-5 bg-[#F9F7F5] shrink-0 border-t border-neutral-200">
                               <h4 className="text-[9px] font-bold uppercase tracking-widest text-[#B94A36] mb-2.5">Resumen de Especificaciones Técnicas y Equipamiento</h4>
                               <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-[7.5px] text-neutral-700 leading-tight">
                                  <p><strong className="text-neutral-900 uppercase">Acabados Interiores:</strong> Pisos de porcelanato importado rectificado de 60 × 120 cm, paredes lisas con revestimientos decorativos y puertas de madera con chapa natural lacada de 2,30 m de altura.</p>
                                  <p><strong className="text-neutral-900 uppercase">Cocina y Clósets:</strong> Mobiliario de melamínico Madeval o similar. Mesones de piedra sinterizada y fregadero de acero inoxidable de dos pozos, tipo undercounter.</p>
                                  <p><strong className="text-neutral-900 uppercase">Baños y Grifería:</strong> Mesones de piedra sinterizada, muebles de melamínico, lavamanos FV o Edesa y grifería de línea alta FV o Edesa.</p>
                                  <p><strong className="text-neutral-900 uppercase">Ventanería y Pasamanos:</strong> Ventanas de aluminio anodizado color café, con vidrio claro y sistema de apertura proyectable. Pasamanos de vidrio templado con anclaje inferior.</p>
                                  <p><strong className="text-neutral-900 uppercase">Áreas Comunales y Amenidades:</strong> Área social con piscina, zona de barbacoa (BBQ), espacios de living y gimnasio.</p>
                                  <p><strong className="text-neutral-900 uppercase">Equipamiento del Edificio:</strong> Generador eléctrico, ascensor, paneles solares, lobby 24/7, cámaras CCTV y área comercial.</p>
                               </div>
                            </div>

                            <div className="bg-[#B94A36] h-[55px] flex justify-center items-center shrink-0">
                               <img src={LOGO_BLANCO} alt="Arienzo Living" className="h-[22px] w-auto object-contain opacity-95" />
                            </div>
                         </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* COLUMNA DERECHA: RESUMEN FIJO */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-neutral-200/60 p-6 shadow-xl sticky top-6 space-y-6 flex flex-col min-h-[500px]">
            <div>
              <h2 className="text-[11px] font-bold text-[#ea0029] uppercase tracking-widest mb-3 border-b border-neutral-100 pb-2">Resumen Financiero</h2>
              <div className="text-4xl font-bold tracking-tight text-[#415364] font-mono">
                {"$"}{precioTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#415364]/50 mt-1">Valor Total de Venta de la Unidad</p>
            </div>

            <div className="space-y-4 pt-5 border-t border-[#415364]/10 text-sm flex-1">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-[#415364] uppercase tracking-wider">Cuota Inicial ({Number(pctInicialReal.toFixed(1))}%)</span>
                <span className="font-bold text-[#415364] font-mono">{"$"}{cuotaInicialTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between items-center border-t border-[#415364]/10 pt-4">
                <span className="text-[11px] font-bold text-[#415364] uppercase tracking-wider">Diferido Obra ({Number(pctEntradaReal.toFixed(1))}%)</span>
                <span className="font-bold text-[#415364] font-mono">{"$"}{entradaDiferirTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between items-center border-t-2 border-[#21242E] pt-4 mt-2">
                <span className="text-[12px] font-bold text-[#21242E] uppercase tracking-widest">Contra Entrega ({Number(pctContraEntregaReal.toFixed(1))}%)</span>
                <span className="font-bold text-[#21242E] text-lg font-mono">{"$"}{contraEntrega.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
            </div>

            {propiedadSeleccionada && (
              <div className="space-y-3 pt-6 border-t border-[#415364]/10 mt-auto">
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={descargarPdfComercial} disabled={generandoPdf} className="w-full bg-white border-2 border-[#21242E] text-[#21242E] rounded-xl p-3 text-[10px] font-bold uppercase tracking-widest hover:bg-[#21242E] hover:text-white transition-colors">
                    {generandoPdf ? 'Generando...' : 'Bajar PDF'}
                  </button>
                  <button onClick={() => { if (!clienteDataCompleta?.email) { alert("⚠️ Cliente sin correo"); return; } setPestañaActiva('previsualizar'); setMostrarModalCorreo(true); }} className="w-full border-2 border-[#21242E] bg-white text-[#21242E] rounded-xl p-3 text-[10px] font-bold uppercase tracking-widest hover:bg-[#21242E] hover:text-white transition-colors">
                    Enviar Email
                  </button>
                </div>
                <button onClick={guardarCotizacionEnSistema} disabled={guardando} className="w-full bg-[#ea0029] text-white rounded-xl p-3.5 text-[11px] font-bold uppercase tracking-widest hover:bg-[#c90022] transition-colors shadow-md">
                  {guardando ? 'Guardando...' : 'Guardar en CRM'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}