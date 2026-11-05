'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

interface CuotaMes {
  id: string;
  tipo: 'inicial' | 'construccion';
  numeroCuota: number | string;
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

  const [tipoDescuento, setTipoDescuento] = useState<'porcentaje' | 'valor'>('porcentaje');
  const [valorDescuento, setValorDescuento] = useState<number>(0);
  const [motivoDescuento, setMotivoDescuento] = useState<string>('');

  const [incluirClima, setIncluirClima] = useState<boolean>(false);
  const [incluirBbq, setIncluirBbq] = useState<boolean>(false);
  const [incluirPlano, setIncluirPlano] = useState<boolean>(true);
  const [incluirFirmas, setIncluirFirmas] = useState<boolean>(true);
  const [incluirFechas, setIncluirFechas] = useState<boolean>(true);

  const hoyStr = new Date().toISOString().split('T')[0];
  const sieteDiasDespuesStr = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [fechaCaducidad, setFechaCaducidad] = useState<string>(sieteDiasDespuesStr);
  const [reservaValor, setReservaValor] = useState<number>(2500);

  const [tipoInicial, setTipoInicial] = useState<'porcentaje' | 'valor'>('porcentaje');
  const [valorInicial, setValorInicial] = useState<number>(15); 
  const [mesesInicial, setMesesInicial] = useState<number>(1); 
  
  const [tipoEntrada, setTipoEntrada] = useState<'porcentaje' | 'valor'>('porcentaje');
  const [valorEntrada, setValorEntrada] = useState<number>(25); 
  const [mesesConstruccion, setMesesConstruccion] = useState(24);
  
  const [fechaReservaInf, setFechaReservaInf] = useState(hoyStr);
  const [fechaFirmaPromesa, setFechaFirmaPromesa] = useState(sieteDiasDespuesStr);
  const [fechaInicioConstruccion, setFechaInicioConstruccion] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

  const [cronogramaCuotas, setCronogramaCuotas] = useState<CuotaMes[]>([]);
  const [mostrarCalculadoraRefuerzos, setMostrarCalculadoraRefuerzos] = useState(false);
  const [cuotaBaseRapida, setCuotaBaseRapida] = useState<number | ''>('');
  const [mesesRefuerzoRapido, setMesesRefuerzoRapido] = useState<string>('');

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
    if(isNaN(mesIndex)) return fechaIso;
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
      setNombreDestinatarioCorreo('Cliente Anónimo / Prospecto');
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
      entradaDiferir = Math.max(0, entradaDiferir - reservaSobrante); 
    }

    const totalPagadoAntesDeEntrega = reservaValor + saldoPromesa + entradaDiferir;
    if (totalPagadoAntesDeEntrega > precioFin) {
      entradaDiferir = Math.max(0, precioFin - reservaValor - saldoPromesa);
    }

    let entrega = Math.max(0, precioFin - reservaValor - saldoPromesa - entradaDiferir);

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

    let cuotasGeneradas: CuotaMes[] = [];

    if (saldoFirmaPromesa > 0 && mesesInicial > 0) {
      const valorAbono = Number((saldoFirmaPromesa / mesesInicial).toFixed(2));
      for (let i = 0; i < mesesInicial; i++) {
        const d = new Date(fechaFirmaPromesa + "T12:00:00");
        d.setMonth(d.getMonth() + i);
        cuotasGeneradas.push({ id: `ini-${i}`, tipo: 'inicial', numeroCuota: i + 1, fechaPago: d.toISOString().split('T')[0], valor: valorAbono, esEditable: false });
      }
    }

    if (mesesConstruccion > 0 && entradaDiferirTotal > 0) {
      const valorBaseCuota = Number((entradaDiferirTotal / mesesConstruccion).toFixed(2));
      const [y, m, d] = fechaInicioConstruccion.split('-');
      const baseDate = new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0);

      for (let i = 0; i < mesesConstruccion; i++) {
        const currentDate = new Date(baseDate);
        currentDate.setMonth(currentDate.getMonth() + i);
        cuotasGeneradas.push({ id: `cons-${i}`, tipo: 'construccion', numeroCuota: i + 1, fechaPago: currentDate.toISOString().split('T')[0], valor: valorBaseCuota, esEditable: false });
      }
    }

    setCronogramaCuotas(cuotasGeneradas);
  }, [propiedadSeleccionada, mesesConstruccion, entradaDiferirTotal, saldoFirmaPromesa, fechaInicioConstruccion, mesesInicial, fechaFirmaPromesa]);

  const actualizarAtributoCuota = (id: string, campo: 'valor' | 'fechaPago', nuevoValor: any) => {
    let nuevoCrono = [...cronogramaCuotas];
    const index = nuevoCrono.findIndex(c => c.id === id);
    if(index === -1) return;

    if (campo === 'fechaPago') {
       nuevoCrono[index].fechaPago = nuevoValor;
    } else if (campo === 'valor') {
       nuevoCrono[index].valor = Number(nuevoValor);
       nuevoCrono[index].esEditable = true;

       if (nuevoCrono[index].tipo === 'construccion') {
         const construccionCrono = nuevoCrono.filter(c => c.tipo === 'construccion');
         const saldoRestante = entradaDiferirTotal - construccionCrono.filter(c => c.esEditable).reduce((acc, curr) => acc + curr.valor, 0);
         const automaticos = construccionCrono.filter(c => !c.esEditable);
         if (automaticos.length > 0) {
           const valorRepartido = Number((Math.max(0, saldoRestante / automaticos.length)).toFixed(2));
           nuevoCrono = nuevoCrono.map(c => (c.tipo === 'construccion' && !c.esEditable) ? { ...c, valor: valorRepartido } : c);
         }
       }
    }
    setCronogramaCuotas(nuevoCrono);
  };

  const reiniciarCuotas = () => {
    const prevMeses = mesesConstruccion;
    setMesesConstruccion(0);
    setTimeout(() => setMesesConstruccion(prevMeses), 10);
  };

  const aplicarPlanRefuerzos = () => {
    const base = Number(cuotaBaseRapida);
    if (base <= 0) { alert("Ingresa Cuota Base mayor a $0."); return; }
    const mesesExtra = mesesRefuerzoRapido.split(',').map(m => parseInt(m.trim())).filter(m => !isNaN(m) && m > 0 && m <= mesesConstruccion);
    if (mesesExtra.length === 0) return;
    const saldoRef = entradaDiferirTotal - (base * (mesesConstruccion - mesesExtra.length));
    const valRef = Number((saldoRef / mesesExtra.length).toFixed(2));
    
    setCronogramaCuotas(cronogramaCuotas.map(c => {
      if(c.tipo === 'construccion') {
         return { ...c, valor: mesesExtra.includes(Number(c.numeroCuota)) ? valRef : base, esEditable: true };
      }
      return c;
    }));
    setMostrarCalculadoraRefuerzos(false); 
  };

  const listadoMaestroPagos = useMemo(() => {
    const cuotasConst = cronogramaCuotas.filter(c => c.tipo === 'construccion');
    return cuotasConst.map(c => ({
      id: c.id,
      label: `C${c.numeroCuota}`,
      date: c.fechaPago,
      amount: c.valor
    }));
  }, [cronogramaCuotas]);

  const mitadPagos = Math.ceil(listadoMaestroPagos.length / 2);
  const columnaPagosIzq = listadoMaestroPagos.slice(0, mitadPagos);
  const columnaPagosDer = listadoMaestroPagos.slice(mitadPagos);

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
            <h2 className="text-[11px] font-bold text-[#21242E] uppercase tracking-widest mb-4">1. Selección de Inventario</h2>
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
                  <div className="flex flex-col justify-end">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5 truncate">Precio de Lista</label>
                    <div className="h-11 px-3 py-2 bg-neutral-50 rounded-xl border border-neutral-200 text-[#415364] font-mono font-bold text-base flex items-center">
                      ${precioListaOriginal.toLocaleString('en-US', {minimumFractionDigits: 2})}
                    </div>
                  </div>
                  <div className="flex flex-col justify-end">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5 truncate">Descuento Especial</label>
                    <div className="flex gap-2 h-11">
                      <select value={tipoDescuento} onChange={e => setTipoDescuento(e.target.value as any)} className="w-1/3 px-2 bg-white border border-neutral-200 rounded-xl text-xs font-bold outline-none focus:border-[#ea0029]">
                        <option value="porcentaje">%</option>
                        <option value="valor">$</option>
                      </select>
                      <input type="number" value={valorDescuento} onChange={e => setValorDescuento(Number(e.target.value))} className="w-2/3 px-3 bg-white border border-neutral-200 rounded-xl text-sm font-bold outline-none focus:border-[#ea0029]" />
                    </div>
                  </div>
                  <div className="flex flex-col justify-end">
                    <label className="text-[10px] font-bold text-[#21242E] uppercase tracking-widest mb-1.5 truncate">Precio Final de Venta</label>
                    <div className="h-11 px-3 bg-[#21242E] rounded-xl border border-[#21242E] text-white font-mono font-bold text-lg shadow-md flex items-center">
                      ${precioTotal.toLocaleString('en-US', {minimumFractionDigits: 2})}
                    </div>
                  </div>
                </div>
                {valorDescuento > 0 && (
                  <div className="mt-4">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-2">Motivo / Justificación del Descuento</label>
                    <input type="text" value={motivoDescuento} onChange={e => setMotivoDescuento(e.target.value)} placeholder="Ej. Aprobación de gerencia comercial..." className="w-full h-11 px-3 bg-white border border-neutral-200 rounded-xl text-sm outline-none focus:border-[#ea0029]" />
                  </div>
                )}
              </div>

              {/* 2. ESTRUCTURA DE PAGOS */}
              <div className="bg-white rounded-2xl border border-neutral-200/60 p-6 shadow-sm">
                <h3 className="text-xs font-bold text-[#ea0029] uppercase tracking-widest mb-4 border-b border-neutral-100 pb-2">2. Estructura de Pagos (Enganche y Construcción)</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                  <div className="flex flex-col justify-end">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5 truncate">Valor Reserva ($)</label>
                    <input type="number" value={reservaValor} onChange={e => setReservaValor(Number(e.target.value))} className="w-full h-11 px-3 bg-white border border-neutral-200 rounded-xl text-sm font-bold font-mono outline-none focus:border-[#ea0029]" />
                  </div>
                  <div className="flex flex-col justify-end">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5 truncate">Firma Promesa (Completar Inicial)</label>
                    <div className="flex gap-2 h-11">
                      <select value={tipoInicial} onChange={e => setTipoInicial(e.target.value as any)} className="w-1/3 px-2 bg-white border border-neutral-200 rounded-xl text-xs font-bold outline-none focus:border-[#ea0029]">
                        <option value="porcentaje">%</option>
                        <option value="valor">$</option>
                      </select>
                      <input type="number" value={valorInicial} onChange={e => setValorInicial(Number(e.target.value))} className="w-2/3 px-3 bg-white border border-neutral-200 rounded-xl text-sm font-bold font-mono outline-none focus:border-[#ea0029]" />
                    </div>
                  </div>
                  <div className="flex flex-col justify-end">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5 truncate">Dividir Cuota Inicial (Meses)</label>
                    <input type="number" min="1" max="12" value={mesesInicial} onChange={e => setMesesInicial(Number(e.target.value))} className="w-full h-11 px-3 bg-white border border-neutral-200 rounded-xl text-sm font-bold font-mono outline-none focus:border-[#ea0029]" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-neutral-100">
                  <div className="flex flex-col justify-end">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5 truncate">Entrada Diferida (Durante Obra)</label>
                    <div className="flex gap-2 h-11">
                      <select value={tipoEntrada} onChange={e => setTipoEntrada(e.target.value as any)} className="w-1/4 px-2 bg-white border border-neutral-200 rounded-xl text-xs font-bold outline-none focus:border-[#ea0029]">
                        <option value="porcentaje">%</option>
                        <option value="valor">$</option>
                      </select>
                      <input type="number" value={valorEntrada} onChange={e => setValorEntrada(Number(e.target.value))} className="w-3/4 px-3 bg-white border border-neutral-200 rounded-xl text-sm font-bold font-mono outline-none focus:border-[#ea0029]" />
                    </div>
                  </div>
                  <div className="flex flex-col justify-end">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5 truncate">Meses de Construcción (Plazo)</label>
                    <input type="number" value={mesesConstruccion} onChange={e => setMesesConstruccion(Number(e.target.value))} className="w-full h-11 px-3 bg-white border border-neutral-200 rounded-xl text-sm font-bold font-mono outline-none focus:border-[#ea0029]" />
                  </div>
                </div>
              </div>

              {/* 3. AJUSTE DE CUOTAS Y CRONOGRAMA */}
              <div className="bg-white rounded-2xl border border-neutral-200/60 p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-5 border-b border-neutral-100 pb-4">
                  <h2 className="text-[11px] font-bold text-[#ea0029] uppercase tracking-widest">3. Ajuste de Cuotas y Fechas (Completo)</h2>
                  <div className="flex gap-2">
                    <button onClick={reiniciarCuotas} className="text-[10px] text-[#415364]/60 hover:text-[#415364] font-bold uppercase tracking-wider bg-[#dce3eb]/50 px-3 py-2 rounded-lg transition-colors flex items-center gap-1">
                      Reiniciar
                    </button>
                    <button onClick={() => setMostrarCalculadoraRefuerzos(!mostrarCalculadoraRefuerzos)} className="text-[10px] bg-[#ea0029] text-white px-4 py-2 rounded-lg font-bold uppercase tracking-wider flex items-center gap-1 hover:bg-[#c90022]">
                      Cuota Balón
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 bg-[#F9F7F5] p-4 rounded-xl border border-neutral-100">
                  <div><label className="block text-[10px] font-bold uppercase mb-1 text-neutral-500">Firma Reserva</label><input type="date" value={fechaReservaInf} onChange={(e)=>setFechaReservaInf(e.target.value)} className="w-full text-xs p-2 h-10 border rounded-md outline-none focus:border-[#ea0029]" /></div>
                  <div><label className="block text-[10px] font-bold uppercase mb-1 text-neutral-500">Inicio Cuota Inicial</label><input type="date" value={fechaFirmaPromesa} onChange={(e)=>setFechaFirmaPromesa(e.target.value)} className="w-full text-xs p-2 h-10 border rounded-md outline-none focus:border-[#ea0029]" /></div>
                  <div><label className="block text-[10px] font-bold uppercase mb-1 text-[#ea0029]">Inicio Cuotas Construcción</label><input type="date" value={fechaInicioConstruccion} onChange={(e)=>setFechaInicioConstruccion(e.target.value)} className="w-full text-xs p-2 h-10 border border-[#ea0029]/40 rounded-md outline-none focus:border-[#ea0029]" /></div>
                </div>

                {mostrarCalculadoraRefuerzos && (
                  <div className="mb-5 p-5 bg-[#415364] border border-[#21242E] rounded-xl flex gap-4">
                     <div className="flex-1"><label className="text-[9px] font-bold text-[#dce3eb]/70 uppercase mb-1.5 block">Cuota Fija Base ($)</label><input type="number" value={cuotaBaseRapida} onChange={e => setCuotaBaseRapida(e.target.value===''? '':Number(e.target.value))} className="w-full bg-white/10 p-2.5 text-xs text-white rounded-lg outline-none"/></div>
                     <div className="flex-1"><label className="text-[9px] font-bold text-[#dce3eb]/70 uppercase mb-1.5 block">Meses Refuerzo (Ej: 12,24)</label><input type="text" value={mesesRefuerzoRapido} onChange={e => setMesesRefuerzoRapido(e.target.value)} className="w-full bg-white/10 p-2.5 text-xs text-white rounded-lg outline-none"/></div>
                     <button onClick={aplicarPlanRefuerzos} className="bg-[#ea0029] text-white px-6 rounded-lg text-[11px] font-bold mt-5 h-10 hover:bg-[#c90022]">Aplicar</button>
                  </div>
                )}

                <div className="max-h-80 overflow-y-auto border border-[#415364]/10 rounded-xl divide-y divide-[#415364]/5 custom-scrollbar bg-white">
                  <div className="flex justify-between items-center p-3 bg-neutral-50">
                     <span className="text-[11px] font-bold text-neutral-600 w-32">Reserva Inmediata</span>
                     <div className="flex items-center gap-4">
                        <span className="text-xs p-1.5 font-medium text-neutral-500 w-32 text-center">{fechaReservaInf}</span>
                        <div className="flex items-center pb-0.5 w-28 justify-end">
                          <span className="text-xs mr-1 font-bold text-neutral-400">$</span>
                          <span className="text-right text-sm font-bold font-mono text-neutral-700">{reservaValor.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                     </div>
                  </div>

                  {cronogramaCuotas.map(cuota => (
                    <div key={cuota.id} className={`flex justify-between items-center p-3 ${cuota.tipo === 'inicial' ? 'bg-[#D1C292]/10' : ''}`}>
                      <span className={`text-[11px] font-bold ${cuota.tipo === 'inicial' ? 'text-[#D1C292] w-32' : 'text-[#415364] w-32'}`}>
                        {cuota.tipo === 'inicial' ? `Abono Inicial ${cuota.numeroCuota}` : `Cuota ${cuota.numeroCuota}`}
                      </span>
                      <div className="flex items-center gap-4">
                        <input type="date" value={cuota.fechaPago} onChange={(e) => actualizarAtributoCuota(cuota.id, 'fechaPago', e.target.value)} className="text-xs p-1.5 border border-transparent hover:border-[#415364]/20 rounded-md bg-transparent outline-none text-[#415364]/70 font-medium w-32 text-center" />
                        <div className="flex items-center border-b border-dashed border-[#415364]/30 pb-0.5 w-28 justify-end">
                          <span className="text-xs mr-1 font-bold text-[#415364]/50">$</span>
                          <input type="number" value={Number(cuota.valor.toFixed(2))} onChange={(e) => actualizarAtributoCuota(cuota.id, 'valor', Number(e.target.value))} className="w-full text-right text-sm font-bold font-mono outline-none bg-transparent" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-6 mt-4 border-t border-neutral-100 pt-5">
                   <label className="flex items-center gap-2 text-xs font-bold text-[#415364] cursor-pointer hover:text-[#ea0029]">
                     <input type="checkbox" checked={incluirPlano} onChange={e => setIncluirPlano(e.target.checked)} className="rounded text-[#ea0029] w-4 h-4" />
                     Adjuntar Plano de la Unidad
                   </label>
                   <label className="flex items-center gap-2 text-xs font-bold text-[#415364] cursor-pointer hover:text-[#ea0029]">
                     <input type="checkbox" checked={incluirFirmas} onChange={e => setIncluirFirmas(e.target.checked)} className="rounded text-[#ea0029] w-4 h-4" />
                     Incluir Espacios para Firma
                   </label>
                   <label className="flex items-center gap-2 text-xs font-bold text-[#415364] cursor-pointer hover:text-[#ea0029]">
                     <input type="checkbox" checked={incluirClima} onChange={e => setIncluirClima(e.target.checked)} className="rounded text-[#ea0029] w-4 h-4" />
                     Incluir Climatización Estética
                   </label>
                   <label className="flex items-center gap-2 text-xs font-bold text-[#415364] cursor-pointer hover:text-[#ea0029]">
                     <input type="checkbox" checked={incluirBbq} onChange={e => setIncluirBbq(e.target.checked)} className="rounded text-[#ea0029] w-4 h-4" />
                     Incluir Área BBQ en Terraza
                   </label>
                </div>
              </div>

            </div>
          ) : pestañaActiva === 'previsualizar' ? (
            
            /* PESTAÑA DE PREVISUALIZAR PDF (DOCUMENTO FORMAL LIMPIO) */
            <div className="bg-[#525659] w-full rounded-2xl shadow-inner border border-[#415364]/30 overflow-auto max-h-[85vh] custom-scrollbar flex justify-center py-10">
              <div id="plantilla-pdf-arienzo" className="flex flex-col gap-10 print:gap-0 shrink-0" style={{ width: '210mm' }}>
                
                {/* PÁGINA 1: PROPUESTA FINANCIERA */}
                <div style={{ width: '210mm', height: '297mm', minWidth: '210mm', minHeight: '297mm' }} className="pdf-page-container bg-white text-neutral-900 shadow-2xl relative flex flex-col mx-auto shrink-0 print:shadow-none">
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
                            <td className="py-2.5 text-center text-neutral-500 text-[10px]">{incluirFechas ? formatearFechaLegible(fechaReservaInf) : 'Inmediato'}</td>
                            <td className="py-2.5 text-center text-neutral-500 text-[10px]">{Number(pctInicialReal.toFixed(1))}%</td>
                            <td className="py-2.5 text-right font-mono">${reservaValor.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 pl-3">↳ Abono Inicial Promesa {mesesInicial > 1 ? `(Diferido en ${mesesInicial} meses)` : ''}</td>
                            <td className="py-2.5 text-center text-neutral-500 text-[10px]">{mesesInicial > 1 ? `${mesesInicial} pagos de $${cuotaInicialMensual.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : (incluirFechas ? formatearFechaLegible(fechaFirmaPromesa) : 'Plazo Convenido')}</td>
                            <td className="py-2.5 text-center text-neutral-500 text-[10px]">{Number(pctFirmaReal.toFixed(1))}%</td>
                            <td className="py-2.5 text-right font-mono">${saldoFirmaPromesa.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 pl-3 font-bold text-[#415364]">↳ Monto Diferido Construcción</td>
                            <td className="py-2.5 text-center text-neutral-500 text-[10px]">Diferido mensual</td>
                            <td className="py-2.5 text-center text-neutral-500 text-[10px]">{Number(pctEntradaReal.toFixed(1))}%</td>
                            <td className="py-2.5 text-right font-bold font-mono text-[#415364]">${entradaDiferirTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                          </tr>
                          {montoDescuentoCalculado > 0 && (
                            <tr className="bg-red-50/40 text-red-900">
                              <td className="py-2.5 pl-3 italic">(-) Descuento Especial {motivoDescuento && `(${motivoDescuento})`}</td>
                              <td className="py-2.5 text-center text-red-700">—</td>
                              <td className="py-2.5 text-center font-medium">{tipoDescuento === 'porcentaje' ? `${valorDescuento}%` : 'Fijo'}</td>
                              <td className="py-2.5 text-right font-mono font-bold">-${montoDescuentoCalculado.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                            </tr>
                          )}
                          <tr>
                            <td className="py-3 pl-3 font-bold text-[#B94A36] text-[13px]">↳ Saldo Final Contra Entrega</td>
                            <td className="py-3 text-center text-[#B94A36] text-[10px]">A la entrega física</td>
                            <td className="py-3 text-center text-[#B94A36] text-[10px] font-bold">{Number(pctContraEntregaReal.toFixed(1))}%</td>
                            <td className="py-3 text-right font-bold text-[#B94A36] font-mono text-[14px]">${contraEntrega.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                          </tr>
                        </tbody>
                      </table>
                      <p className="text-[8px] text-neutral-400 mt-2 italic">* Nota: El Valor Total de Venta detallado ya considera un 5% de descuento por etapa de pre-lanzamiento respecto al precio de lista estándar[cite: 1].</p>
                    </div>
                    
                    {/* CRONOGRAMA EN EL PDF (CON CONTENEDOR AJUSTADO QUE NO SE CHORREA) */}
                    {entradaDiferirTotal > 0 && (
                      <div className="shrink-0 mb-4">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#B94A36] mb-1.5">CRONOGRAMA DE PAGOS (CONSTRUCCIÓN)</h4>
                        <div className="bg-neutral-50/50 border border-neutral-200/60 rounded-[8px] p-3 flex gap-4">
                           <div className="flex-1">
                             <table className="w-full text-left text-[9px]">
                               <thead><tr className="border-b border-neutral-300 text-neutral-400 uppercase tracking-wider"><th className="pb-1">Concepto</th><th className="pb-1">Fecha</th><th className="pb-1 text-right">Valor</th></tr></thead>
                               <tbody className="divide-y divide-neutral-100">
                                 {columnaPagosIzq.map((c) => (
                                   <tr key={c.id}><td className="py-0.5 font-medium text-neutral-500">{c.label}</td><td className="py-0.5 text-neutral-700">{formatearFechaLegible(c.date)}</td><td className="py-0.5 text-right font-mono font-bold text-neutral-800">${c.amount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td></tr>
                                 ))}
                               </tbody>
                             </table>
                           </div>
                           <div className="flex-1">
                             <table className="w-full text-left text-[9px]">
                               <thead><tr className="border-b border-neutral-300 text-neutral-400 uppercase tracking-wider"><th className="pb-1">Concepto</th><th className="pb-1">Fecha</th><th className="pb-1 text-right">Valor</th></tr></thead>
                               <tbody className="divide-y divide-neutral-100">
                                 {columnaPagosDer.map((c) => (
                                   <tr key={c.id}><td className="py-0.5 font-medium text-neutral-500">{c.label}</td><td className="py-0.5 text-neutral-700">{formatearFechaLegible(c.date)}</td><td className="py-0.5 text-right font-mono font-bold text-neutral-800">${c.amount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td></tr>
                                 ))}
                               </tbody>
                             </table>
                           </div>
                        </div>
                      </div>
                    )}

                    {/* FIRMAS UBICADAS PERFECTAMENTE ABAJO */}
                    {incluirFirmas && (
                       <div className="mt-auto pt-6 shrink-0 flex justify-between items-end">
                          <div className="w-[40%] text-center border-t border-neutral-800 pt-1.5">
                             <p className="text-[10px] font-bold text-neutral-800 uppercase m-0">{nombreAsesor}</p>
                             <p className="text-[8px] text-neutral-500 m-0">Asesor Comercial Arienzo[cite: 1]</p>
                          </div>
                          <div className="w-[40%] text-center border-t border-neutral-800 pt-1.5">
                             <p className="text-[10px] font-bold text-neutral-800 uppercase m-0">{nombreDestinatarioCorreo}</p>
                             <p className="text-[8px] text-neutral-500 m-0">Firma Inversionista[cite: 1]</p>
                          </div>
                       </div>
                    )}
                  </div>
                </div>

                {/* PÁGINA 2: PLANO Y ARQUITECTURA */}
                {incluirPlano && (
                  <div style={{ width: '210mm', height: '297mm', minWidth: '210mm', minHeight: '297mm' }} className="pdf-page-container bg-white text-neutral-900 shadow-2xl relative flex flex-col overflow-hidden shrink-0 mx-auto print:shadow-none">
                    <div className="px-10 py-10 flex flex-col h-full">
                       <div className="flex-1 flex flex-col border border-neutral-300 rounded-[12px] overflow-hidden shadow-sm bg-white">
                          
                          <div className="flex h-[150px] shrink-0 bg-white border-b border-neutral-200">
                             <div className="w-[230px] h-full shrink-0 bg-[#181A20]">
                                <img src={RENDER_FACHADA} className="w-full h-full object-cover" alt="Fachada Arienzo[cite: 2]" />
                             </div>
                             <div className="flex-1 pl-8 pr-6 flex flex-col justify-center text-left">
                                <h3 className="text-[15px] font-bold tracking-widest uppercase text-[#B94A36]">DISEÑO ARQUITECTÓNICO[cite: 2]</h3>
                                <p className="text-[11px] mt-0.5 font-bold tracking-wider text-neutral-800">Unidad {propiedadSeleccionada?.unidad || propiedadSeleccionada?.numero} | {tipologia}[cite: 2]</p>
                                <p className="text-[9.5px] text-neutral-600 leading-snug mt-2 text-justify">
                                  Un diseño arquitectónico exclusivo y minuciosamente pensado por el prestigioso estudio Diez+Muller, uno de los más reconocidos del país[cite: 2]. Cada espacio ha sido concebido para ofrecer un estilo de vida superior, destacando una distribución inteligente y una selección de acabados de excelente calidad[cite: 2].
                                </p>
                             </div>
                          </div>

                          {/* Fila de Íconos de Supabase */}
                          <div className="bg-[#F9F7F5] px-4 py-3.5 grid grid-cols-7 gap-1 items-center shrink-0 border-b border-neutral-200">
                             <div className="flex flex-col items-center gap-1.5 border-r border-neutral-300">
                                <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/iconos/area.png" alt="Área Total" className="w-[22px] h-[22px] object-contain" />
                                <span className="text-[6.5px] font-bold text-neutral-500 uppercase tracking-widest">ÁREA TOTAL[cite: 2]</span>
                                <span className="text-[10px] font-black text-[#B94A36]">{areaTotal} m²[cite: 2]</span>
                             </div>
                             <div className="flex flex-col items-center gap-1.5 border-r border-neutral-300">
                                <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/iconos/dormitorio.png" alt="Dormitorios" className="w-[22px] h-[22px] object-contain" />
                                <span className="text-[6.5px] font-bold text-neutral-500 uppercase tracking-widest">DORMITORIOS[cite: 2]</span>
                                <span className="text-[10px] font-bold text-[#21242E]">{numHabitaciones}[cite: 2]</span>
                             </div>
                             <div className="flex flex-col items-center gap-1.5 border-r border-neutral-300">
                                <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/iconos/ducha.png" alt="Baños" className="w-[22px] h-[22px] object-contain" />
                                <span className="text-[6.5px] font-bold text-neutral-500 uppercase tracking-widest">BAÑOS[cite: 2]</span>
                                <span className="text-[10px] font-bold text-[#21242E]">{numBanos}[cite: 2]</span>
                             </div>
                             <div className="flex flex-col items-center gap-1.5 border-r border-neutral-300">
                                <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/iconos/lavadora.png" alt="Lavandería" className="w-[22px] h-[22px] object-contain" />
                                <span className="text-[6.5px] font-bold text-neutral-500 uppercase tracking-widest">LAVANDERÍA[cite: 2]</span>
                                <span className="text-[10px] font-bold text-[#21242E]">Sí[cite: 2]</span>
                             </div>
                             <div className="flex flex-col items-center gap-1.5 border-r border-neutral-300">
                                <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/iconos/terraza.png" alt="Terraza" className="w-[22px] h-[22px] object-contain" />
                                <span className="text-[6.5px] font-bold text-neutral-500 uppercase tracking-widest">TERRAZA[cite: 2]</span>
                                <span className="text-[10px] font-bold text-[#21242E]">Sí[cite: 2]</span>
                             </div>
                             <div className="flex flex-col items-center gap-1.5 border-r border-neutral-300">
                                <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/iconos/garaje.png" alt="Parqueos" className="w-[22px] h-[22px] object-contain" />
                                <span className="text-[6.5px] font-bold text-neutral-500 uppercase tracking-widest">PARQUEOS[cite: 2]</span>
                                <span className="text-[10px] font-bold text-[#21242E]">{cantidadParqueos}[cite: 2]</span>
                             </div>
                             <div className="flex flex-col items-center gap-1.5">
                                <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/iconos/bodega.png" alt="Bodega" className="w-[22px] h-[22px] object-contain" />
                                <span className="text-[6.5px] font-bold text-neutral-500 uppercase tracking-widest">BODEGA[cite: 2]</span>
                                <span className="text-[10px] font-bold text-[#21242E]">{bodegaAsignada && bodegaAsignada.toLowerCase() !== 'ninguna' ? 'Sí' : 'No'}[cite: 2]</span>
                             </div>
                          </div>

                          <div className="flex-1 flex items-center justify-center p-6 relative bg-white">
                             <div className="w-full h-full max-h-[110mm] flex items-center justify-center">
                                <img src={urlPlanoAsignado} alt="Plano Arienzo[cite: 2]" className="max-w-[75%] max-h-full object-contain mix-blend-multiply" />
                             </div>
                          </div>

                          {/* Especificaciones */}
                          <div className="px-8 py-5 bg-[#F9F7F5] shrink-0 border-t border-neutral-200">
                             <h4 className="text-[9px] font-bold uppercase tracking-widest text-[#B94A36] mb-2.5">RESUMEN DE ESPECIFICACIONES TÉCNICAS Y EQUIPAMIENTO[cite: 2]</h4>
                             <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-[7.5px] text-neutral-700 leading-tight">
                                <p><strong className="text-neutral-900 uppercase">ACABADOS INTERIORES:</strong> Pisos de porcelanato importado rectificado de 60 x 120 cm, paredes lisas con revestimientos decorativos y puertas de madera con chapa natural lacada de 2,30 m de altura[cite: 2].</p>
                                <p><strong className="text-neutral-900 uppercase">COCINA Y CLÓSETS:</strong> Mobiliario de melamínico Madeval o similar[cite: 2]. Mesones de piedra sinterizada y fregadero de acero inoxidable de dos pozos, tipo undercounter[cite: 2].</p>
                                <p><strong className="text-neutral-900 uppercase">BAÑOS Y GRIFERÍA:</strong> Mesones de piedra sinterizada, muebles de melamínico, lavamanos FV o Edesa y grifería de línea alta FV o Edesa[cite: 2].</p>
                                <p><strong className="text-neutral-900 uppercase">VENTANERÍA Y PASAMANOS:</strong> Ventanas de aluminio anodizado color café, con vidrio claro y sistema de apertura proyectable[cite: 2]. Pasamanos de vidrio templado con anclaje inferior[cite: 2].</p>
                                <p><strong className="text-neutral-900 uppercase">ÁREAS COMUNALES Y AMENIDADES:</strong> Área social con piscina, zona de barbacoa (BBQ), espacios de living y gimnasio[cite: 2].</p>
                                <p><strong className="text-neutral-900 uppercase">EQUIPAMIENTO DEL EDIFICIO:</strong> Generador eléctrico, ascensor, paneles solares, lobby 24/7, cámaras CCTV y área comercial[cite: 2].</p>
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
          ) : null}
        </div>

        {/* COLUMNA DERECHA: RESUMEN FIJO */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-neutral-200/60 p-6 shadow-xl sticky top-6 space-y-6 flex flex-col min-h-[500px]">
            <div>
              <h2 className="text-[11px] font-bold text-[#ea0029] uppercase tracking-widest mb-3 border-b border-neutral-100 pb-2">Resumen Financiero</h2>
              {montoDescuentoCalculado > 0 && (
                <div className="text-[11px] text-[#415364]/40 line-through font-mono font-bold mb-1">
                  Lista Base: {"$"}{precioListaOriginal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </div>
              )}
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
              <div className="flex justify-between pl-4 text-[11px] text-[#415364]/70 border-l-2 border-[#ea0029]/30 font-medium">
                <span>Reserva Inmediata:</span>
                <span className="font-mono font-bold">{"$"}{reservaValor.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between pl-4 text-[11px] text-[#415364]/70 border-l-2 border-[#ea0029]/30 font-medium">
                <span>Firma de Promesa:</span>
                <span className="font-mono font-bold text-[#415364]">
                  {"$"}{saldoFirmaPromesa > 0 ? saldoFirmaPromesa.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'}
                </span>
              </div>
              
              {mesesInicial > 1 && saldoFirmaPromesa > 0 && (
                <div className="flex justify-between pl-4 pr-3 py-2 text-[10px] font-bold text-[#ea0029] bg-[#ea0029]/5 rounded-lg border border-[#ea0029]/10">
                  <span>↳ Dividido en {mesesInicial} pagos:</span>
                  <span className="font-mono">{"$"}{cuotaInicialMensual.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} c/u</span>
                </div>
              )}
              
              <div className="flex justify-between items-center border-t border-[#415364]/10 pt-4">
                <span className="text-[11px] font-bold text-[#415364] uppercase tracking-wider">Diferido Obra ({Number(pctEntradaReal.toFixed(1))}%)</span>
                <span className="font-bold text-[#415364] font-mono">{"$"}{entradaDiferirTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
              
              {entradaDiferirTotal > 0 && (
                <div className="flex justify-between text-[11px] text-[#415364]/60 font-medium bg-[#dce3eb]/30 px-3 py-2 rounded-lg border border-[#415364]/5">
                  <span>{mesesConstruccion} cuotas promedio de:</span>
                  <span className="font-mono font-bold">
                    {"$"}{(entradaDiferirTotal / mesesConstruccion).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between items-center border-t-2 border-[#21242E] pt-4 mt-2">
                <span className="text-[12px] font-bold text-[#21242E] uppercase tracking-widest">Contra Entrega ({Number(pctContraEntregaReal.toFixed(1))}%)</span>
                <span className="font-bold text-[#21242E] text-lg font-mono">{"$"}{contraEntrega.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
            </div>

            {propiedadSeleccionada && (
              <div className="space-y-3 pt-6 border-t border-[#415364]/10 mt-auto">
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={descargarPdfComercial} disabled={generandoPdf} className="w-full bg-white border-2 border-[#21242E] text-[#21242E] rounded-xl p-3 text-[10px] font-bold uppercase tracking-widest hover:bg-[#21242E] hover:text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path></svg>
                    {generandoPdf ? 'Generando...' : 'Bajar PDF'}
                  </button>
                  <button onClick={() => { if (!clienteDataCompleta?.email) { alert("⚠️ El cliente seleccionado no tiene un correo electrónico registrado en el CRM."); return; } setPestañaActiva('previsualizar'); setMostrarModalCorreo(true); }} className={`w-full border-2 rounded-xl p-3 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 ${!clienteDataCompleta?.email ? 'bg-neutral-100 border-neutral-200 text-neutral-400 cursor-not-allowed' : 'bg-white border-[#21242E] text-[#21242E] hover:bg-[#21242E] hover:text-white shadow-sm'}`} title={!clienteDataCompleta?.email ? "El cliente no tiene correo registrado" : "Enviar PDF por correo"}>
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 0114 0z"></path></svg>
                    Enviar Email
                  </button>
                </div>
                <button onClick={guardarCotizacionEnSistema} disabled={guardando} className="w-full bg-[#ea0029] text-white rounded-xl p-3.5 text-[11px] font-bold uppercase tracking-widest hover:bg-[#c90022] transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                  {guardando ? 'Guardando Registro...' : 'Guardar en CRM'}
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}