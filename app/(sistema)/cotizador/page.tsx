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
  const [nombreAsesor, setNombreAsesor] = useState<string>('Saúl Intriago / Debbi Mera');

  const [incluirFechas, setIncluirFechas] = useState<boolean>(true);
  const [tipoDescuento, setTipoDescuento] = useState<'porcentaje' | 'valor'>('porcentaje');
  const [valorDescuento, setValorDescuento] = useState<number>(0);
  const [motivoDescuento, setMotivoDescuento] = useState<string>('');

  const [incluirPlano, setIncluirPlano] = useState<boolean>(true);
  const [incluirFirmas, setIncluirFirmas] = useState<boolean>(true);

  const hoyStr = new Date().toISOString().split('T')[0];
  const sieteDiasDespuesStr = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [reservaValor, setReservaValor] = useState<number>(2500);

  const [tipoInicial, setTipoInicial] = useState<'porcentaje' | 'valor'>('porcentaje');
  const [valorInicial, setValorInicial] = useState<number>(15); 
  const [mesesInicial, setMesesInicial] = useState<number>(1); 
  
  const [tipoEntrada, setTipoEntrada] = useState<'porcentaje' | 'valor'>('porcentaje');
  const [valorEntrada, setValorEntrada] = useState<number>(25); 
  
  const [mesesConstruccion, setMesesConstruccion] = useState(24);
  
  const [diaPago, setDiaPago] = useState(5);
  const [mesInicio, setMesInicio] = useState(new Date().getMonth() + 1); 
  const [anioInicio, setAnioInicio] = useState(new Date().getFullYear());

  const [cronogramaCuotas, setCronogramaCuotas] = useState<CuotaMes[]>([]);

  useEffect(() => {
    if (propiedadSeleccionada) {
      setMensajeCorreo(`Es un placer saludarle.\n\nAdjunto a este correo encontrará la propuesta de inversión estructurada para la Unidad ${propiedadSeleccionada.unidad || propiedadSeleccionada.numero} en nuestro proyecto Arienzo Living.\n\nEl documento en formato PDF incluye el desglose financiero detallado y el diseño arquitectónico de la propiedad.\n\nQuedo a su entera disposición para cualquier consulta o para agendar una reunión.`);
    }
  }, [propiedadSeleccionada]);

  useEffect(() => {
    async function cargarDatosIniciales() {
      try {
        const { data: dataProp, error: errorProp } = await supabase.from('propiedades').select('*');
        if (!errorProp && dataProp) {
          const datosOrdenados = dataProp.sort((a, b) => {
            const numA = parseInt(a.unidad || a.numero, 10) || 0;
            const numB = parseInt(b.unidad || b.numero, 10) || 0;
            return numA - numB;
          });
          setPropiedades(datosOrdenados);
        }
        const { data: dataCli, error: errorCli } = await supabase.from('clientes').select('id, nombres, apellidos, tipo, telefono, email').order('nombres', { ascending: true });
        if (!errorCli && dataCli) setClientes(dataCli);
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
    cuotaInicialTotal, saldoFirmaPromesa, cuotaInicialMensual, entradaDiferirTotal, contraEntrega,
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
      entradaDiferir = entradaDiferir - reservaSobrante; 
      if (entradaDiferir < 0) entradaDiferir = 0;
    }

    const totalPagadoAntesDeEntrega = reservaValor + saldoPromesa + entradaDiferir;
    if (totalPagadoAntesDeEntrega > precioFin) entradaDiferir = Math.max(0, precioFin - reservaValor - saldoPromesa);

    let entrega = precioFin - reservaValor - saldoPromesa - entradaDiferir;
    if (entrega < 0) entrega = 0;

    const mensualInicial = mesesInicial > 0 ? saldoPromesa / mesesInicial : saldoPromesa;

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
      saldoFirmaPromesa: saldoPromesa, cuotaInicialMensual: mensualInicial, entradaDiferirTotal: entradaDiferir, contraEntrega: entrega,
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
        precio_lista: precioListaOriginal, monto_descuento: montoDescuentoCalculado, motivo_descuento: motivoDescuento || null,
        precio_total: precioTotal, porcentaje_inicial: Number(pctInicialReal.toFixed(2)), monto_inicial: cuotaInicialTotal,
        porcentaje_entrada: Number(pctEntradaReal.toFixed(2)), monto_entrada: entradaDiferirTotal, meses_plazo: mesesConstruccion,
        monto_contra_entrega: contraEntrega, cronograma_pagos: cronogramaCuotas, estado: 'Vigente'
      }]);
      if (!error) alert('¡Cotización guardada exitosamente!');
      else alert(`Error de Base de Datos: ${error.message}`);
    } catch (err: any) { alert(`Error inesperado: ${err.message}`); } finally { setGuardando(false); }
  };

  const descargarPdfComercial = () => {
    if (typeof window === 'undefined') return;
    setGenerandoPdf(true);
    setPestañaActiva('previsualizar');
    
    setTimeout(() => {
      try {
        const elemento = document.getElementById('plantilla-pdf-arienzo');
        if (!elemento) return alert("Error: No se encontró la plantilla del PDF.");

        const ventanaImpresion = window.open('', '_blank');
        if (!ventanaImpresion) return alert("Por favor, permite las ventanas emergentes.");

        ventanaImpresion.document.write(`
          <html>
            <head>
              <title>Arienzo_Unidad_${propiedadSeleccionada?.unidad || propiedadSeleccionada?.numero || 'S-N'}</title>
              <script src="https://cdn.tailwindcss.com"></script>
              <style>
                @page { size: A4 portrait; margin: 0; }
                body { 
                  -webkit-print-color-adjust: exact !important; 
                  print-color-adjust: exact !important; 
                  font-family: ui-sans-serif, system-ui, sans-serif; 
                  background: white;
                  margin: 0; padding: 0;
                }
                .pdf-page-container {
                  width: 210mm !important; 
                  height: 297mm !important; 
                  max-height: 297mm !important; 
                  page-break-after: always; 
                  box-sizing: border-box; 
                  background: white; 
                  position: relative; 
                  overflow: hidden; 
                  margin: 0;
                }
                @media print {
                  body { background: white; }
                  #wrapper { width: 100% !important; max-width: none !important; margin: 0 !important; padding: 0 !important; align-items: flex-start !important; justify-content: flex-start !important; }
                  .pdf-page-container { box-shadow: none !important; border: none !important; border-radius: 0 !important; margin: 0 !important;}
                }
              </style>
            </head>
            <body>
              <div id="wrapper" class="flex flex-col items-center">
                ${elemento.innerHTML}
              </div>
              <script>setTimeout(() => { window.print(); window.close(); }, 800);</script>
            </body>
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
          <body>
            <div class="flex flex-col items-center">
              ${elemento.innerHTML}
            </div>
          </body>
        </html>
      `;

      const emailHtmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #EAE3DC; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #B94A36; padding: 25px; text-align: center;">
            <img src="${LOGO_BLANCO}" height="35" alt="Arienzo Living" style="display: block; margin: 0 auto;" />
          </div>
          <div style="padding: 35px 30px; color: #415364; font-size: 14px; line-height: 1.6; background-color: #ffffff;">
            <p style="margin-top: 0;">Estimado/a <strong style="color: #21242E;">${nombreDestinatarioCorreo}</strong>,</p>
            <div style="margin-top: 20px; margin-bottom: 25px; color: #415364;">
              ${mensajeCorreo.replace(/\n/g, '<br/>')}
            </div>
            ${incluirFirmas ? `
            <div style="margin-top: 35px; padding-top: 25px; border-top: 1px solid #EAE3DC;">
              <p style="margin: 0; color: #B94A36; font-weight: bold; font-size: 15px;">${nombreAsesor}</p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #737373;">Asesor Comercial - Arienzo Living<br/>Konkeri Developer Group</p>
            </div>
            ` : ''}
          </div>
          <div style="background-color: #F9F7F5; padding: 15px; text-align: center; border-top: 1px solid #EAE3DC;">
            <p style="margin: 0; font-size: 10px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 1px;">Este es un mensaje generado desde Konkeri CRM</p>
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
        alert(`❌ Error al enviar el correo: ${errData.error || 'Problema de servidor'}`);
      }
    } catch (error) {
      console.error(error);
      alert('❌ Error al procesar el envío por correo.');
    } finally {
      setEnviandoCorreo(false);
    }
  };

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#dce3eb]">
        <p className="text-sm font-bold tracking-widest text-[#ea0029] uppercase animate-pulse">Cargando Unidades Arienzo...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#dce3eb] p-4 md:p-6 font-sans text-[#415364] relative">
      
      {/* MODAL DE CORREO */}
      {mostrarModalCorreo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#21242E]/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[95vh] shadow-2xl flex flex-col animate-in fade-in zoom-in-95">
            <div className="px-6 py-5 border-b border-neutral-100 flex justify-between items-center bg-[#F9F7F5] shrink-0 rounded-t-2xl">
              <h3 className="font-bold text-[#B94A36] uppercase tracking-widest text-sm flex items-center gap-2">
                Preparar Envío de Cotización
              </h3>
              <button onClick={() => setMostrarModalCorreo(false)} className="text-neutral-400 hover:text-[#ea0029] transition-colors p-1 bg-white rounded-md shadow-sm border border-neutral-200">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 custom-scrollbar">
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="bg-[#dce3eb]/30 border border-[#415364]/10 rounded-xl p-3.5">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5 block">Destinatario (Editable)</label>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <input 
                        type="text" 
                        value={nombreDestinatarioCorreo} 
                        onChange={(e) => setNombreDestinatarioCorreo(e.target.value)} 
                        className="flex-1 bg-white border border-[#415364]/20 rounded-lg p-2 text-sm font-bold text-[#415364] outline-none focus:border-[#ea0029]"
                      />
                      <span className="text-xs font-medium text-neutral-500 bg-neutral-100 px-2 py-2 rounded-lg border border-neutral-200 whitespace-nowrap">
                        &lt;{clienteDataCompleta?.email}&gt;
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#ea0029] uppercase tracking-widest block">Cuerpo del Mensaje (Editable)</label>
                  <textarea 
                    value={mensajeCorreo}
                    onChange={(e) => setMensajeCorreo(e.target.value)}
                    className="w-full bg-white border border-[#415364]/20 rounded-xl p-4 text-[13px] text-[#415364] h-48 outline-none focus:border-[#ea0029] resize-none leading-relaxed shadow-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <p className="text-[10px] font-bold text-[#415364]/50 uppercase tracking-widest mb-3">Vista previa del diseño del cliente</p>
                <div className="border border-neutral-200 rounded-xl overflow-hidden bg-[#F9F7F5] flex-1 flex flex-col shadow-sm">
                  <div className="p-4 overflow-y-auto custom-scrollbar bg-[#F3F4F6] flex-1">
                    <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden shadow-sm">
                      <div className="bg-[#B94A36] p-4 text-center">
                        <img src={LOGO_BLANCO} alt="Arienzo" className="h-5 mx-auto" />
                      </div>
                      <div className="p-5 text-[12px] text-[#415364] leading-relaxed">
                        <p className="mb-4">Estimado/a <strong className="text-[#21242E]">{nombreDestinatarioCorreo}</strong>,</p>
                        <div className="whitespace-pre-wrap">{mensajeCorreo}</div>
                        {incluirFirmas && (
                          <div className="mt-5 pt-4 border-t border-neutral-100">
                             <p className="font-bold text-[#B94A36] text-[13px] m-0">{nombreAsesor}</p>
                             <p className="text-[10px] text-neutral-500 m-0 mt-0.5">Asesor Comercial - Arienzo Living</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-5 border-t border-neutral-100 bg-white flex justify-end gap-3 shrink-0 rounded-b-2xl">
              <button onClick={() => setMostrarModalCorreo(false)} className="px-6 py-3 rounded-xl text-xs font-bold text-[#415364] hover:bg-neutral-100 transition-colors">Cancelar</button>
              <button onClick={enviarCotizacionPorCorreo} disabled={enviandoCorreo} className="bg-[#ea0029] text-white px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#c90022] transition-colors shadow-md disabled:opacity-50">
                {enviandoCorreo ? 'Enviando...' : 'Confirmar y Enviar Correo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER COTIZADOR */}
      <div className="w-full flex-shrink-0 mb-6 space-y-3">
        <div className="bg-white rounded-2xl border border-neutral-200/60 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-[#ea0029] uppercase">Estructurador Comercial</span>
            <h1 className="text-2xl font-bold tracking-tight text-[#415364] mt-1">Cotizador Konkeri</h1>
          </div>
          
          {propiedadSeleccionada && (
            <div className="flex bg-[#dce3eb]/50 p-1.5 rounded-xl border border-[#415364]/10 shadow-inner">
              <button onClick={() => setPestañaActiva('configurar')} className={`px-4 py-2 rounded-lg text-xs transition-all ${pestañaActiva === 'configurar' ? 'bg-white text-[#ea0029] shadow-sm font-bold' : 'text-[#415364]/70 font-semibold'}`}>Configurar Plan</button>
              <button onClick={() => setPestañaActiva('previsualizar')} className={`px-4 py-2 rounded-lg text-xs transition-all ${pestañaActiva === 'previsualizar' ? 'bg-white text-[#ea0029] shadow-sm font-bold' : 'text-[#415364]/70 font-semibold'}`}>Ver Documento</button>
            </div>
          )}
        </div>
      </div>

      <div className="w-full mx-auto grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        <div className="xl:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-neutral-200/60 p-6 shadow-sm flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <h2 className="text-[10px] font-bold text-[#415364]/60 uppercase tracking-widest mb-3">Asesor / Comercial Emisor</h2>
              <input type="text" value={nombreAsesor} onChange={(e) => setNombreAsesor(e.target.value)} className="w-full bg-[#dce3eb]/30 border border-[#415364]/20 rounded-xl p-3 text-xs font-bold text-[#415364] focus:outline-none focus:border-[#ea0029]" />
            </div>
            <div className="flex-1">
              <h2 className="text-[10px] font-bold text-[#415364]/60 uppercase tracking-widest mb-3">Asociar Inversionista</h2>
              <select value={clienteSeleccionado} onChange={(e) => setClienteSeleccionado(e.target.value)} className="w-full bg-[#415364]/5 border border-[#415364]/20 rounded-xl p-3 text-xs font-bold text-[#415364] focus:outline-none focus:border-[#ea0029]">
                <option value="">— Cliente Anónimo (Consulta Rápida) —</option>
                {clientesFiltrados.map(c => <option key={c.id} value={c.id}>{c.nombres} {c.apellidos}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#D1C292] p-6 shadow-sm relative overflow-hidden">
            <h2 className="text-[11px] font-bold text-[#21242E] uppercase tracking-widest mb-4">Selección de Inventario</h2>
            <select
              className="w-full bg-[#F9F7F5] border border-[#D1C292]/50 rounded-xl p-3.5 text-sm font-bold text-[#21242E] mb-4 focus:outline-none focus:border-[#ea0029]"
              value={propiedadSeleccionada?.id || ''}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '') { setPropiedadSeleccionada(null); setPestañaActiva('configurar'); } 
                else { setPropiedadSeleccionada(propiedades.find(p => p.id === Number(val) || p.id === val)); }
              }}
            >
              <option value="">-- Selecciona una Unidad para Estructurar --</option>
              {propiedades && propiedades.map((prop) => (
                <option key={prop.id} value={prop.id}>Unidad {prop.unidad || prop.numero} — {prop.categoria || 'Departamento'} ({prop.tipologia || 'S/T'})</option>
              ))}
            </select>
          </div>

          {/* 🎯 AQUÍ ESTÁ LA PESTAÑA DE CONFIGURACIÓN QUE SE HABÍA BORRADO */}
          {!propiedadSeleccionada ? (
            <div className="bg-white rounded-2xl border border-dashed border-[#415364]/20 p-16 text-center text-[#415364]/40">
              <p className="text-sm font-bold uppercase tracking-widest">Selecciona una unidad para habilitar el cotizador.</p>
            </div>
          ) : pestañaActiva === 'configurar' ? (
            <div className="space-y-6 animate-in fade-in">
              
              {/* 1. PRECIO Y DESCUENTOS */}
              <div className="bg-white rounded-2xl border border-neutral-200/60 p-6 shadow-sm">
                <h3 className="text-xs font-bold text-[#ea0029] uppercase tracking-widest mb-4 border-b border-neutral-100 pb-2">1. Precio y Condiciones Comerciales</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-2">Precio de Lista</label>
                    <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 text-[#415364] font-mono font-bold text-lg">
                      ${precioListaOriginal.toLocaleString('en-US', {minimumFractionDigits: 2})}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-2">Descuento Especial</label>
                    <div className="flex gap-2">
                      <select value={tipoDescuento} onChange={e => setTipoDescuento(e.target.value as any)} className="w-1/3 p-3.5 bg-white border border-neutral-200 rounded-xl text-xs font-bold outline-none focus:border-[#ea0029]">
                        <option value="porcentaje">%</option>
                        <option value="valor">$</option>
                      </select>
                      <input type="number" value={valorDescuento} onChange={e => setValorDescuento(Number(e.target.value))} className="w-2/3 p-3.5 bg-white border border-neutral-200 rounded-xl text-sm font-bold outline-none focus:border-[#ea0029]" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#21242E] uppercase tracking-widest block mb-2">Precio Final de Venta</label>
                    <div className="p-3.5 bg-[#21242E] rounded-xl border border-[#21242E] text-white font-mono font-bold text-xl shadow-md">
                      ${precioTotal.toLocaleString('en-US', {minimumFractionDigits: 2})}
                    </div>
                  </div>
                </div>
                {valorDescuento > 0 && (
                  <div className="mt-4">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-2">Motivo / Justificación del Descuento</label>
                    <input type="text" value={motivoDescuento} onChange={e => setMotivoDescuento(e.target.value)} placeholder="Ej. Aprobación de gerencia comercial..." className="w-full p-3.5 bg-white border border-neutral-200 rounded-xl text-sm outline-none focus:border-[#ea0029]" />
                  </div>
                )}
              </div>

              {/* 2. ESTRUCTURA DE PAGOS */}
              <div className="bg-white rounded-2xl border border-neutral-200/60 p-6 shadow-sm">
                <h3 className="text-xs font-bold text-[#ea0029] uppercase tracking-widest mb-4 border-b border-neutral-100 pb-2">2. Estructura de Pagos (Enganche y Construcción)</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                  <div>
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-2">Valor Reserva ($)</label>
                    <input type="number" value={reservaValor} onChange={e => setReservaValor(Number(e.target.value))} className="w-full p-3.5 bg-white border border-neutral-200 rounded-xl text-base font-bold font-mono outline-none focus:border-[#ea0029]" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-2">Firma Promesa (Completar Inicial)</label>
                    <div className="flex gap-2">
                      <select value={tipoInicial} onChange={e => setTipoInicial(e.target.value as any)} className="w-1/3 p-3.5 bg-white border border-neutral-200 rounded-xl text-xs font-bold outline-none focus:border-[#ea0029]">
                        <option value="porcentaje">%</option>
                        <option value="valor">$</option>
                      </select>
                      <input type="number" value={valorInicial} onChange={e => setValorInicial(Number(e.target.value))} className="w-2/3 p-3.5 bg-white border border-neutral-200 rounded-xl text-base font-bold font-mono outline-none focus:border-[#ea0029]" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-2">Plazo Firma (Meses)</label>
                    <input type="number" value={mesesInicial} onChange={e => setMesesInicial(Number(e.target.value))} className="w-full p-3.5 bg-white border border-neutral-200 rounded-xl text-base font-bold font-mono outline-none focus:border-[#ea0029]" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-neutral-100">
                  <div>
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-2">Entrada Diferida (Durante Obra)</label>
                    <div className="flex gap-2">
                      <select value={tipoEntrada} onChange={e => setTipoEntrada(e.target.value as any)} className="w-1/4 p-3.5 bg-white border border-neutral-200 rounded-xl text-xs font-bold outline-none focus:border-[#ea0029]">
                        <option value="porcentaje">%</option>
                        <option value="valor">$</option>
                      </select>
                      <input type="number" value={valorEntrada} onChange={e => setValorEntrada(Number(e.target.value))} className="w-3/4 p-3.5 bg-white border border-neutral-200 rounded-xl text-base font-bold font-mono outline-none focus:border-[#ea0029]" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-2">Meses de Construcción (Plazo)</label>
                    <input type="number" value={mesesConstruccion} onChange={e => setMesesConstruccion(Number(e.target.value))} className="w-full p-3.5 bg-white border border-neutral-200 rounded-xl text-base font-bold font-mono outline-none focus:border-[#ea0029]" />
                  </div>
                </div>
              </div>

              {/* 3. CRONOGRAMA */}
              <div className="bg-white rounded-2xl border border-neutral-200/60 p-6 shadow-sm">
                <h3 className="text-xs font-bold text-[#ea0029] uppercase tracking-widest mb-4 border-b border-neutral-100 pb-2">3. Calendario de Pagos</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                   <div>
                     <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-2">Día de Pago (Corte)</label>
                     <input type="number" min="1" max="31" value={diaPago} onChange={e => setDiaPago(Number(e.target.value))} className="w-full p-3.5 bg-white border border-neutral-200 rounded-xl text-sm font-bold outline-none focus:border-[#ea0029]" />
                   </div>
                   <div>
                     <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-2">Mes de Inicio</label>
                     <select value={mesInicio} onChange={e => setMesInicio(Number(e.target.value))} className="w-full p-3.5 bg-white border border-neutral-200 rounded-xl text-sm font-bold outline-none focus:border-[#ea0029]">
                       <option value="1">Enero</option><option value="2">Febrero</option><option value="3">Marzo</option>
                       <option value="4">Abril</option><option value="5">Mayo</option><option value="6">Junio</option>
                       <option value="7">Julio</option><option value="8">Agosto</option><option value="9">Septiembre</option>
                       <option value="10">Octubre</option><option value="11">Noviembre</option><option value="12">Diciembre</option>
                     </select>
                   </div>
                   <div>
                     <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-2">Año de Inicio</label>
                     <input type="number" value={anioInicio} onChange={e => setAnioInicio(Number(e.target.value))} className="w-full p-3.5 bg-white border border-neutral-200 rounded-xl text-sm font-bold outline-none focus:border-[#ea0029]" />
                   </div>
                </div>

                <div className="flex flex-wrap gap-6 mt-4 border-t border-neutral-100 pt-5">
                   <label className="flex items-center gap-2 text-xs font-bold text-[#415364] cursor-pointer hover:text-[#ea0029] transition-colors">
                     <input type="checkbox" checked={incluirFechas} onChange={e => setIncluirFechas(e.target.checked)} className="rounded text-[#ea0029] focus:ring-[#ea0029] w-4 h-4" />
                     Mostrar Fechas Exactas en PDF
                   </label>
                   <label className="flex items-center gap-2 text-xs font-bold text-[#415364] cursor-pointer hover:text-[#ea0029] transition-colors">
                     <input type="checkbox" checked={incluirPlano} onChange={e => setIncluirPlano(e.target.checked)} className="rounded text-[#ea0029] focus:ring-[#ea0029] w-4 h-4" />
                     Adjuntar Plano de la Unidad
                   </label>
                   <label className="flex items-center gap-2 text-xs font-bold text-[#415364] cursor-pointer hover:text-[#ea0029] transition-colors">
                     <input type="checkbox" checked={incluirFirmas} onChange={e => setIncluirFirmas(e.target.checked)} className="rounded text-[#ea0029] focus:ring-[#ea0029] w-4 h-4" />
                     Incluir Espacios para Firma
                   </label>
                </div>
              </div>

            </div>
          ) : pestañaActiva === 'previsualizar' ? (
            
            /* PESTAÑA DE PREVISUALIZAR PDF (LA QUE SÍ FUNCIONABA Y SE QUEDÓ INTACTA) */
            <div className="bg-[#525659] w-full rounded-2xl shadow-inner border border-[#415364]/30 overflow-auto max-h-[85vh] custom-scrollbar text-center">
              <div className="inline-block text-left py-12 px-4 sm:px-12 min-w-max">
                <div id="plantilla-pdf-arienzo" className="flex flex-col gap-10 print:gap-0" style={{ width: '210mm' }}>
                  
                  {/* PÁGINA 1 */}
                  <div style={{ width: '210mm', height: '297mm', minWidth: '210mm', minHeight: '297mm' }} className="pdf-page-container bg-white text-neutral-900 shadow-2xl relative flex flex-col overflow-hidden mx-auto shrink-0">
                    <div className="px-10 pt-10 pb-6 flex flex-col h-full">
                      <div className="bg-[#B94A36] px-8 py-5 flex justify-between items-center mb-6 shrink-0 rounded-[8px]">
                        <img src={LOGO_BLANCO} alt="Arienzo Living" className="h-10 w-auto object-contain" />
                        <div className="text-right text-white">
                          <h3 className="text-[13px] font-bold tracking-widest uppercase">Propuesta de Inversión</h3>
                          <p className="text-[10px] mt-1.5 font-light opacity-90">Emisión: {new Date().toLocaleDateString('es-EC')}</p>
                        </div>
                      </div>

                      <div className="mb-4 shrink-0 text-left">
                        <p className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest mb-0.5">Inversionista de Propuesta</p>
                        <p className="text-[20px] font-bold text-neutral-800">{clienteDataCompleta ? `${clienteDataCompleta.nombres} ${clienteDataCompleta.apellidos}` : 'Cliente Anónimo / Prospecto'}</p>
                      </div>

                      <div className="mb-4 shrink-0 border border-neutral-200/80 rounded-[8px] p-3 bg-white">
                        <div className="flex items-center justify-between text-[10px]">
                          <div className="flex-1 text-left border-r border-neutral-200 pr-2">
                            <span className="text-[7.5px] text-neutral-400 uppercase block mb-1">Unidad</span>
                            <span className="font-bold text-neutral-800 text-[11px]">Unidad {propiedadSeleccionada?.unidad || propiedadSeleccionada?.numero}</span>
                          </div>
                          <div className="flex-1 text-left border-r border-neutral-200 px-3">
                            <span className="text-[7.5px] text-neutral-400 uppercase block mb-1">Tipología</span>
                            <span className="font-bold text-neutral-800 text-[11px]">{tipologia}</span>
                          </div>
                          <div className="flex-[1.5] text-left border-r border-neutral-200 px-3">
                            <span className="text-[7.5px] text-neutral-400 uppercase block mb-1">Complementos</span>
                            <span className="font-semibold text-neutral-700 block text-[10px]">P: {parqueaderoTexto}</span>
                          </div>
                          <div className="flex-1 text-center border-r border-neutral-200 px-3">
                            <span className="text-[7.5px] text-neutral-400 uppercase block mb-1">Área Total</span>
                            <span className="font-bold text-neutral-800 text-[11px]">{areaTotal}m²</span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 mb-4">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#B94A36] mb-1.5">Plan de Financiamiento</h4>
                        <table className="w-full text-left text-[11px] border-collapse">
                          <thead>
                            <tr className="border-b border-[#B94A36] text-[#B94A36] text-[8px] uppercase tracking-wider">
                              <th className="pb-1 font-bold">Concepto</th>
                              <th className="pb-1 text-right font-bold">Monto</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-100 text-neutral-700">
                            <tr>
                              <td className="py-1 text-neutral-600 font-light">Valor Total de Venta</td>
                              <td className="py-1 text-right font-mono text-neutral-950 font-bold">${precioTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                            </tr>
                            <tr>
                              <td className="py-1 pl-3 text-neutral-600">↳ Reserva</td>
                              <td className="py-1 text-right font-medium font-mono">${reservaValor.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                            </tr>
                            <tr>
                              <td className="py-1 pl-3 text-neutral-600">↳ Inicial Promesa</td>
                              <td className="py-1 text-right font-medium font-mono">${saldoFirmaPromesa.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                            </tr>
                            <tr>
                              <td className="py-1 pl-3 font-medium text-neutral-800">↳ Diferido Construcción</td>
                              <td className="py-1 text-right font-medium font-mono">${entradaDiferirTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                            </tr>
                            <tr>
                              <td className="py-1.5 pl-3 font-bold text-[#B94A36]">↳ Saldo Contra Entrega</td>
                              <td className="py-1.5 text-right font-bold text-[#B94A36] font-mono">${contraEntrega.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      
                      {/* CRONOGRAMA EN EL PDF */}
                      <div className="flex-1 flex flex-col min-h-0 relative z-10">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#B94A36] mb-1.5 shrink-0">Cronograma de Pagos (Construcción)</h4>
                        <div className="flex-1 bg-neutral-50/50 border border-neutral-200/60 rounded-[8px] p-4 flex gap-6">
                           <div className="flex-1">
                             <table className="w-full text-left text-[9px]">
                               <thead><tr className="border-b border-neutral-300 text-neutral-400 uppercase tracking-wider"><th className="pb-1">Nº</th><th className="pb-1">Fecha Programada</th><th className="pb-1 text-right">Valor</th></tr></thead>
                               <tbody className="divide-y divide-neutral-100">
                                 {cuotasDivididas.columnaIzquierda.map((c) => (
                                   <tr key={c.numeroCuota}><td className="py-1 font-medium text-neutral-500">{c.numeroCuota}</td><td className="py-1 text-neutral-700">{c.fechaPago}</td><td className="py-1 text-right font-mono font-bold text-neutral-800">${c.valor.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td></tr>
                                 ))}
                               </tbody>
                             </table>
                           </div>
                           <div className="flex-1">
                             <table className="w-full text-left text-[9px]">
                               <thead><tr className="border-b border-neutral-300 text-neutral-400 uppercase tracking-wider"><th className="pb-1">Nº</th><th className="pb-1">Fecha Programada</th><th className="pb-1 text-right">Valor</th></tr></thead>
                               <tbody className="divide-y divide-neutral-100">
                                 {cuotasDivididas.columnaDerecha.map((c) => (
                                   <tr key={c.numeroCuota}><td className="py-1 font-medium text-neutral-500">{c.numeroCuota}</td><td className="py-1 text-neutral-700">{c.fechaPago}</td><td className="py-1 text-right font-mono font-bold text-neutral-800">${c.valor.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td></tr>
                                 ))}
                               </tbody>
                             </table>
                           </div>
                        </div>
                      </div>

                      {incluirFirmas && (
                         <div className="mt-4 pt-3 shrink-0 flex justify-between items-end border-t border-neutral-200">
                            <div className="w-[45%] text-center border-t border-neutral-400 pt-1">
                               <p className="text-[10px] font-bold text-neutral-800 uppercase m-0">{nombreAsesor}</p>
                               <p className="text-[8px] text-neutral-500 m-0">Asesor Comercial Arienzo</p>
                            </div>
                            <div className="w-[45%] text-center border-t border-neutral-400 pt-1">
                               <p className="text-[10px] font-bold text-neutral-800 uppercase m-0">{nombreDestinatarioCorreo}</p>
                               <p className="text-[8px] text-neutral-500 m-0">Firma Inversionista</p>
                            </div>
                         </div>
                      )}
                    </div>
                  </div>

                  {/* PÁGINA 2 */}
                  {incluirPlano && (
                    <div style={{ width: '210mm', height: '297mm', minWidth: '210mm', minHeight: '297mm' }} className="pdf-page-container bg-white text-neutral-900 shadow-2xl relative flex flex-col overflow-hidden shrink-0 mx-auto">
                      <div className="px-10 py-10 flex flex-col h-full">
                         <div className="flex-1 flex flex-col border border-neutral-300 rounded-[12px] overflow-hidden shadow-sm bg-white">
                            <div className="flex h-[150px] shrink-0 bg-white border-b border-neutral-200">
                               <div className="w-[230px] h-full shrink-0 bg-[#181A20]">
                                  <img src={RENDER_FACHADA} className="w-full h-full object-cover" alt="Fachada Arienzo" />
                               </div>
                               <div className="flex-1 pl-8 pr-6 flex flex-col justify-center text-left">
                                  <h3 className="text-[15px] font-bold tracking-widest uppercase text-[#B94A36]">Diseño Arquitectónico</h3>
                                  <p className="text-[11px] mt-0.5 font-bold tracking-wider text-neutral-800">Unidad {propiedadSeleccionada?.unidad || propiedadSeleccionada?.numero} | {tipologia}</p>
                               </div>
                            </div>
                            <div className="flex-1 flex items-center justify-center p-6 relative bg-white">
                               <div className="w-full h-full max-h-[110mm] flex items-center justify-center">
                                  <img src={urlPlanoAsignado} alt="Plano Arienzo" className="max-w-[75%] max-h-full object-contain mix-blend-multiply" />
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
                ${precioTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#415364]/50 mt-1">Valor Total de Venta de la Unidad</p>
            </div>

            <div className="space-y-4 pt-5 border-t border-[#415364]/10 text-sm flex-1">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-[#415364] uppercase">Cuota Inicial</span>
                <span className="font-bold text-[#415364] font-mono">${cuotaInicialTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between items-center border-t border-[#415364]/10 pt-4">
                <span className="text-[11px] font-bold text-[#415364] uppercase">Diferido Obra</span>
                <span className="font-bold text-[#415364] font-mono">${entradaDiferirTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between items-center border-t-2 border-[#21242E] pt-4 mt-2">
                <span className="text-[12px] font-bold text-[#21242E] uppercase">Contra Entrega</span>
                <span className="font-bold text-[#21242E] text-lg font-mono">${contraEntrega.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
            </div>

            {propiedadSeleccionada && (
              <div className="space-y-3 pt-6 border-t border-[#415364]/10 mt-auto">
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={descargarPdfComercial} disabled={generandoPdf} className="w-full bg-white border-2 border-[#21242E] text-[#21242E] rounded-xl p-3 text-[10px] font-bold uppercase tracking-widest hover:bg-[#21242E] hover:text-white transition-colors">
                    {generandoPdf ? 'Generando...' : 'Bajar PDF'}
                  </button>
                  <button onClick={() => { if (!clienteDataCompleta?.email) { alert("⚠️ El cliente no tiene correo registrado."); return; } setPestañaActiva('previsualizar'); setMostrarModalCorreo(true); }} className="w-full border-2 border-[#21242E] bg-white text-[#21242E] rounded-xl p-3 text-[10px] font-bold uppercase tracking-widest hover:bg-[#21242E] hover:text-white transition-colors">
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