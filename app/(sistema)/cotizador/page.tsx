'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

interface CuotaMes {
  numeroCuota: number;
  fechaPago: string;
  valor: number;
  esEditable: boolean;
}

// === MAPEO DE PLANOS ===
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
const LOGO_BLANCO = 'https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/arienzo-logo-blanco.svg';

export default function CotizadorPage() {
  const [propiedades, setPropiedades] = useState<any[]>([]);
  const [propiedadSeleccionada, setPropiedadSeleccionada] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [generandoPdf, setGenerandoPdf] = useState(false);
  const [enviandoCorreo, setEnviandoCorreo] = useState(false);
  
  const [pestañaActiva, setPestañaActiva] = useState<'configurar' | 'previsualizar'>('configurar');

  const [clientes, setClientes] = useState<any[]>([]);
  const [busquedaCliente, setBusquedaCliente] = useState<string>('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState<string>(''); 
  const [nombreAsesor, setNombreAsesor] = useState<string>('Saúl Intriago / Debbi Mera');

  const [incluirFechas, setIncluirFechas] = useState<boolean>(true);
  const [tipoDescuento, setTipoDescuento] = useState<'porcentaje' | 'valor'>('porcentaje');
  const [valorDescuento, setValorDescuento] = useState<number>(0);
  const [motivoDescuento, setMotivoDescuento] = useState<string>('');

  const [incluirClima, setIncluirClima] = useState<boolean>(false);
  const [incluirBbq, setIncluirBbq] = useState<boolean>(false);
  const [incluirPlano, setIncluirPlano] = useState<boolean>(true);

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
  
  const [fechaReserva, setFechaReserva] = useState(hoyStr);
  const [fechaFirmaPromesa, setFechaFirmaPromesa] = useState(sieteDiasDespuesStr);

  const [diaPago, setDiaPago] = useState(5);
  const [mesInicio, setMesInicio] = useState(new Date().getMonth() + 1); 
  const [anioInicio, setAnioInicio] = useState(new Date().getFullYear());

  const [cronogramaCuotas, setCronogramaCuotas] = useState<CuotaMes[]>([]);
  const [mostrarCalculadoraRefuerzos, setMostrarCalculadoraRefuerzos] = useState(false);
  const [cuotaBaseRapida, setCuotaBaseRapida] = useState<number | ''>('');
  const [mesesRefuerzoRapido, setMesesRefuerzoRapido] = useState<string>('');

  const setDiasCaducidad = (dias: number) => {
    const nuevaFecha = new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setFechaCaducidad(nuevaFecha);
  };

  const formatearFechaLegible = (fechaIso: string) => {
    if (!fechaIso) return '---';
    const partes = fechaIso.split('-');
    const mesesNombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const mesIndex = parseInt(partes[1], 10) - 1;
    return `${partes[2]} de ${mesesNombres[mesIndex]} ${partes[0]}`;
  };

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
      const planoCercano = MAPA_PLANOS.find(p => Math.abs(p.area - area) <= 2.5);
      if (planoCercano) urlPlano = planoCercano.url;
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

  const actualizarValorCuota = (cuotaNumero: number, nuevoValor: number) => {
    let nuevoCronograma = cronogramaCuotas.map(cuota => cuota.numeroCuota === cuotaNumero ? { ...cuota, valor: nuevoValor, esEditable: true } : cuota);
    const totalManual = nuevoCronograma.filter(c => c.esEditable).reduce((acc, curr) => acc + curr.valor, 0);
    const saldoRestantePorCubrir = entradaDiferirTotal - totalManual;
    const mesesAutomaticos = nuevoCronograma.filter(c => !c.esEditable);

    if (mesesAutomaticos.length > 0) {
      const valorRepartido = Math.max(0, saldoRestantePorCubrir / mesesAutomaticos.length);
      nuevoCronograma = nuevoCronograma.map(cuota => !cuota.esEditable ? { ...cuota, valor: valorRepartido } : cuota);
    }
    setCronogramaCuotas(nuevoCronograma);
  };

  const reiniciarCuotas = () => {
    if (mesesConstruccion <= 0) return;
    const valorBaseCuota = entradaDiferirTotal / mesesConstruccion;
    setCronogramaCuotas(cronogramaCuotas.map(c => ({ ...c, valor: valorBaseCuota, esEditable: false })));
  };

  const aplicarPlanRefuerzos = () => {
    const base = Number(cuotaBaseRapida);
    if (base <= 0) return alert("Por favor ingresa una Cuota Base mayor a \$0.");

    const mesesExtra = mesesRefuerzoRapido.split(',').map(m => parseInt(m.trim())).filter(m => !isNaN(m) && m > 0 && m <= mesesConstruccion);
    if (mesesExtra.length === 0) return alert(`Ingresa al menos un mes válido entre 1 y ${mesesConstruccion}. (Ej: 12)`);

    const totalRegular = base * (mesesConstruccion - mesesExtra.length);
    if (totalRegular > entradaDiferirTotal) return alert(`La cuota base de $${base} es muy alta. Supera el total a diferir ($${entradaDiferirTotal}).`);

    const valorPorRefuerzo = (entradaDiferirTotal - totalRegular) / mesesExtra.length;
    setCronogramaCuotas(cronogramaCuotas.map(cuota => ({
      ...cuota, valor: mesesExtra.includes(cuota.numeroCuota) ? valorPorRefuerzo : base, esEditable: true 
    })));
    setMostrarCalculadoraRefuerzos(false); 
  };

  const clienteDataCompleta = useMemo(() => {
    if (!clienteSeleccionado) return null;
    return clientes.find(item => item.id.toString() === clienteSeleccionado.toString());
  }, [clienteSeleccionado, clientes]);

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
                .hoja-a4 { 
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
                  #wrapper { gap: 0 !important; padding: 0 !important; transform: none !important; margin: 0 !important; align-items: flex-start !important; justify-content: flex-start !important; }
                  .hoja-a4 { box-shadow: none !important; border: none !important; border-radius: 0 !important; }
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
    if (!clienteDataCompleta?.email) {
      alert("⚠️ El cliente seleccionado no tiene un correo electrónico registrado en el CRM.");
      return;
    }
    
    setEnviandoCorreo(true);
    setPestañaActiva('previsualizar'); 
    
    setTimeout(async () => {
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
                .hoja-a4 { width: 210mm; height: 297mm; box-sizing: border-box; background: white; position: relative; overflow: hidden; margin: 0 auto; page-break-after: always;}
              </style>
            </head>
            <body>
              <div class="flex flex-col items-center">
                ${elemento.innerHTML}
              </div>
            </body>
          </html>
        `;

        const response = await fetch('/api/enviar-cotizacion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            emailDestino: clienteDataCompleta.email,
            nombreCliente: clienteDataCompleta.nombres,
            asesor: nombreAsesor,
            unidad: propiedadSeleccionada?.unidad || propiedadSeleccionada?.numero,
            htmlCotizacion: htmlContent
          })
        });

        if (response.ok) {
          alert(`✅ Cotización enviada con éxito al correo: ${clienteDataCompleta.email}`);
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
    }, 500); 
  };

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#dce3eb]">
        <p className="text-sm font-bold tracking-widest text-[#ea0029] uppercase animate-pulse">Cargando Unidades Arienzo...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#dce3eb] p-4 md:p-6 font-sans text-[#415364]">
      
      <div className="w-full flex-shrink-0 mb-6 space-y-3">
        <div className="bg-white rounded-2xl border border-neutral-200/60 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-[#ea0029] uppercase">Estructurador Comercial</span>
            <h1 className="text-2xl font-bold tracking-tight text-[#415364] mt-1">Cotizador Konkeri</h1>
          </div>
          
          {propiedadSeleccionada && (
            <div className="flex bg-[#dce3eb]/50 p-1.5 rounded-xl border border-[#415364]/10 shadow-inner">
              <button 
                onClick={() => setPestañaActiva('configurar')} 
                className={`px-4 py-2 rounded-lg text-xs transition-all flex items-center gap-2 ${pestañaActiva === 'configurar' ? 'bg-white text-[#ea0029] shadow-sm font-bold' : 'text-[#415364]/70 hover:text-[#415364] font-semibold'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                Configurar Plan
              </button>
              <button 
                onClick={() => setPestañaActiva('previsualizar')} 
                className={`px-4 py-2 rounded-lg text-xs transition-all flex items-center gap-2 ${pestañaActiva === 'previsualizar' ? 'bg-white text-[#ea0029] shadow-sm font-bold' : 'text-[#415364]/70 hover:text-[#415364] font-semibold'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                Ver Documento
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="w-full mx-auto grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* COLUMNA IZQUIERDA: CONFIGURADOR */}
        <div className="xl:col-span-2 space-y-5">
          
          <div className="bg-white rounded-2xl border border-neutral-200/60 p-6 shadow-sm flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <h2 className="text-[10px] font-bold text-[#415364]/60 uppercase tracking-widest mb-3">Asesor / Comercial Emisor</h2>
              <input
                type="text"
                value={nombreAsesor}
                onChange={(e) => setNombreAsesor(e.target.value)}
                className="w-full bg-[#dce3eb]/30 border border-[#415364]/20 rounded-xl p-3 text-xs font-bold text-[#415364] focus:outline-none focus:border-[#ea0029] transition-colors"
                placeholder="Ej. Saúl Intriago / Debbi Mera"
              />
            </div>
            
            <div className="flex-1">
              <h2 className="text-[10px] font-bold text-[#415364]/60 uppercase tracking-widest mb-3">Asociar Inversionista</h2>
              <div className="relative mb-2">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#415364]/40">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </span>
                <input 
                  type="text" 
                  placeholder="Buscar cliente por nombre o teléfono..." 
                  value={busquedaCliente} 
                  onChange={(e) => setBusquedaCliente(e.target.value)} 
                  className="w-full bg-[#dce3eb]/30 border border-[#415364]/20 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium focus:outline-none focus:border-[#ea0029] transition-all text-[#415364]" 
                />
              </div>
              <select
                value={clienteSeleccionado}
                onChange={(e) => setClienteSeleccionado(e.target.value)}
                className="w-full bg-[#415364]/5 border border-[#415364]/20 rounded-xl p-3 text-xs font-bold text-[#415364] focus:outline-none focus:border-[#ea0029]"
              >
                <option value="">— Cliente Anónimo (Consulta Rápida) —</option>
                {clientesFiltrados.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nombres} {c.apellidos} {c.tipo === 'prospecto' ? '(Prospecto)' : '(Cliente)'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#D1C292] p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#D1C292]"></div>
            <h2 className="text-[11px] font-bold text-[#21242E] uppercase tracking-widest mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-[#D1C292]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
              1. Selección de Inventario
            </h2>
            <select
              className="w-full bg-[#F9F7F5] border border-[#D1C292]/50 rounded-xl p-3.5 text-sm font-bold text-[#21242E] mb-4 focus:outline-none focus:border-[#ea0029] transition-colors"
              value={propiedadSeleccionada?.id || ''}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '') {
                  setPropiedadSeleccionada(null);
                  setPestañaActiva('configurar');
                } else {
                  setPropiedadSeleccionada(propiedades.find(p => p.id === Number(val) || p.id === val));
                }
              }}
            >
              <option value="">-- Selecciona una Unidad para Estructurar --</option>
              {propiedades && propiedades.map((prop) => (
                <option key={prop.id} value={prop.id}>Unidad {prop.unidad || prop.numero} — {prop.categoria || 'Departamento'} ({prop.tipologia || 'S/T'})</option>
              ))}
            </select>

            {propiedadSeleccionada && (
              <div className={`grid grid-cols-2 ${esLocal ? 'sm:grid-cols-4' : 'sm:grid-cols-5'} gap-3 pt-4 border-t border-[#415364]/10 text-center text-xs`}>
                <div className="border-r border-[#415364]/10">
                  <span className="text-[9px] text-[#415364]/50 font-bold uppercase tracking-wider block mb-1">Distribución</span>
                  <span className="font-bold text-[#415364]">{tipologia}</span>
                </div>
                <div className="border-r border-[#415364]/10">
                  <span className="text-[9px] text-[#415364]/50 font-bold uppercase tracking-wider block mb-1">Complementos</span>
                  <span className="font-bold text-[#415364] block truncate" title={`${parqueaderoTexto} / ${bodegaAsignada}`}>P: {parqueaderoTexto}</span>
                </div>
                <div className={esLocal ? "" : "border-r border-[#415364]/10"}>
                  <span className="text-[9px] text-[#415364]/50 font-bold uppercase tracking-wider block mb-1">Área Total</span>
                  <span className="font-bold text-[#415364]">{areaTotal}m²</span>
                </div>
                {!esLocal && (
                  <div>
                    <span className="text-[9px] text-[#ea0029]/80 font-bold uppercase tracking-wider block mb-1">M² Lanzamiento</span>
                    <span className="font-bold font-mono text-[#ea0029]">{"\$"}{valorM2Lanzamiento.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {!propiedadSeleccionada ? (
            <div className="bg-white rounded-2xl border border-dashed border-[#415364]/20 p-16 text-center text-[#415364]/40">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
              <p className="text-sm font-bold uppercase tracking-widest">Selecciona una unidad para habilitar el cotizador.</p>
            </div>
          ) : pestañaActiva === 'previsualizar' ? (
            
            // --- CONTENEDOR PRINCIPAL DE PREVISUALIZACIÓN (VISTA REAL SIN DESBORDES) ---
            <div className="bg-[#1a1c23] py-12 px-4 flex justify-center overflow-x-auto w-full rounded-2xl shadow-inner border border-neutral-300">
              
              <div id="plantilla-pdf-arienzo" className="flex flex-col gap-10 print:gap-0 items-center mx-auto" style={{ width: '210mm' }}>
                
                {/* --- PÁGINA 1: COTIZACIÓN FINANCIERA (DISEÑO ORIGINAL CON SOMBRAS) --- */}
                <div className="hoja-a4 shrink-0 bg-white text-neutral-900 shadow-2xl print:shadow-none relative flex flex-col rounded-md print:rounded-none">
                  
                  <div className="px-10 pt-10 pb-6 flex flex-col h-full">
                    
                    {/* Header P1 */}
                    <div className="bg-[#B94A36] px-8 py-6 flex justify-between items-center mb-6 shrink-0 rounded-sm">
                      <div className="flex items-center gap-3">
                        <img src="/logo-arienzo.png" alt="Arienzo Boutique Living" className="h-10 w-auto object-contain" />
                      </div>
                      <div className="text-right text-white">
                        <h3 className="text-[13px] font-bold tracking-widest uppercase">Propuesta de Inversión</h3>
                        <p className="text-[10px] mt-1.5 font-light opacity-90">Emisión: {new Date().toLocaleDateString('es-EC')}</p>
                        <p className="text-[10px] mt-0.5 font-bold">Válida hasta: {formatearFechaLegible(fechaCaducidad)}</p>
                      </div>
                    </div>

                    {/* Datos del Cliente */}
                    <div className="mb-4 shrink-0 text-left">
                      <p className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest mb-0.5">Inversionista de Propuesta</p>
                      <p className="text-[20px] font-bold text-neutral-800">{clienteDataCompleta ? `${clienteDataCompleta.nombres} ${clienteDataCompleta.apellidos}` : 'Cliente Anónimo / Prospecto'}</p>
                    </div>

                    {/* Caja de Detalles (Con sombra y bordes) */}
                    <div className="mb-4 shrink-0 border border-neutral-200 rounded-xl p-3 bg-white shadow-sm">
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
                          <span className="text-[7.5px] text-neutral-400 uppercase block mb-1">Complementos Asignados</span>
                          <span className="font-semibold text-neutral-700 block text-[10px]">P: {parqueaderoTexto}</span>
                          <span className="font-semibold text-neutral-700 block text-[10px] mt-0.5">B: {bodegaAsignada}</span>
                        </div>
                        <div className={`flex-1 text-center ${esLocal ? '' : 'border-r border-neutral-200'} px-3`}>
                          <span className="text-[7.5px] text-neutral-400 uppercase block mb-1">Área Total</span>
                          <span className="font-bold text-neutral-800 text-[11px]">{areaTotal}m²</span>
                        </div>
                        {!esLocal && (
                          <div className="flex-[1.4] text-right pl-3">
                            <span className="text-[7.5px] text-neutral-400 uppercase block mb-1">Valor m² (Pre Lanzamiento)</span>
                            <span className="font-bold text-[#B94A36] font-mono text-[11px]">{"\$"}{valorM2Lanzamiento.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}/m²</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 mb-3">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#B94A36] mb-1">Plan de Financiamiento Específico</h4>
                      <table className="w-full text-left text-[11px] border-collapse">
                        <thead>
                          <tr className="border-b border-[#B94A36] text-[#B94A36] text-[8px] uppercase tracking-wider">
                            <th className="pb-1 font-bold">Concepto Estructurado</th>
                            <th className="pb-1 text-center font-bold">Fecha / Control</th>
                            <th className="pb-1 text-center font-bold">Porcentaje</th>
                            <th className="pb-1 text-right font-bold">Monto</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 text-neutral-700">
                          <tr>
                            <td className="py-1 text-neutral-600 font-light">Valor {esLocal ? 'del Local Comercial' : 'del Departamento (Pre Lanzamiento)'}</td>
                            <td className="py-1 text-center text-neutral-400">—</td>
                            <td className="py-1 text-center text-neutral-400">—</td>
                            <td className="py-1 text-right font-mono text-neutral-700 font-bold">{"\$"}{precioDeptoPreLanzamiento.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                          </tr>
                          {!esLocal && (
                            <tr>
                              <td className="py-1 text-neutral-600 font-light"><span className="text-neutral-400 mr-1 font-mono">(+)</span> Valor Parqueo y Bodega (Pre Lanzamiento)</td>
                              <td className="py-1 text-center text-neutral-400">—</td>
                              <td className="py-1 text-center text-neutral-400">—</td>
                              <td className="py-1 text-right font-mono text-neutral-700 font-bold">{"\$"}{valAnexosPreLanzamiento.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                            </tr>
                          )}
                          {montoDescuentoCalculado > 0 && (
                            <tr className="bg-red-50/40 text-red-900">
                              <td className="py-1 pl-2 italic"><span className="text-red-700 mr-1 font-mono">(-)</span> Descuento Adicional {motivoDescuento && `(${motivoDescuento})`}</td>
                              <td className="py-1 text-center text-red-700">—</td>
                              <td className="py-1 text-center font-medium">{tipoDescuento === 'porcentaje' ? `${valorDescuento}%` : 'Fijo'}</td>
                              <td className="py-1 text-right font-mono font-bold">-{"$"}{montoDescuentoCalculado.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                            </tr>
                          )}
                          <tr className="font-bold border-t border-neutral-300 text-neutral-950">
                            <td className="py-1.5"><span className="text-neutral-600 mr-1 font-mono">(=)</span> Valor Total de Venta</td>
                            <td className="py-1.5 text-center text-neutral-400">—</td>
                            <td className="py-1.5 text-center text-neutral-400">—</td>
                            <td className="py-1.5 text-right font-mono text-[13px]">{"$"}{precioTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                          </tr>
                          <tr>
                            <td className="py-1 pl-3 text-neutral-600">↳ Reserva para Bloqueo</td>
                            <td className="py-1 text-center text-neutral-700 text-[10px]">{incluirFechas ? formatearFechaLegible(fechaReserva) : 'Inmediato'}</td>
                            <td className="py-1 text-center text-neutral-400">—</td>
                            <td className="py-1 text-right font-medium font-mono">{"$"}{reservaValor.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                          </tr>
                          <tr>
                            <td className="py-1 pl-3 text-neutral-600">↳ Abono Inicial Promesa {mesesInicial > 1 ? `(Diferido en ${mesesInicial} meses)` : ''}</td>
                            <td className="py-1 text-center text-neutral-700 text-[10px]">{mesesInicial > 1 ? `${mesesInicial} pagos de $${cuotaInicialMensual.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : (incluirFechas ? formatearFechaLegible(fechaFirmaPromesa) : 'Plazo Convenido')}</td>
                            <td className="py-1 text-center text-neutral-500">{Number(pctFirmaReal.toFixed(1))}%</td>
                            <td className="py-1 text-right font-medium font-mono text-neutral-700">{"$"}{saldoFirmaPromesa > 0 ? saldoFirmaPromesa.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'}</td>
                          </tr>
                          <tr>
                            <td className="py-1 pl-3 font-medium text-neutral-800">↳ Monto Diferido Construcción</td>
                            <td className="py-1 text-center text-neutral-500 text-[10px]">Diferido mensual</td>
                            <td className="py-1 text-center text-neutral-500">{Number(pctEntradaReal.toFixed(1))}%</td>
                            <td className="py-1 text-right font-medium font-mono text-neutral-700">{"$"}{entradaDiferirTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                          </tr>
                          <tr>
                            <td className="py-1.5 pl-3 font-bold text-[#B94A36]">↳ Saldo Final Contra Entrega</td>
                            <td className="py-1.5 text-center text-[#B94A36] text-[10px]">A la entrega física</td>
                            <td className="py-1.5 text-center text-[#B94A36]">{Number(pctContraEntregaReal.toFixed(1))}%</td>
                            <td className="py-1.5 text-right font-bold text-[#B94A36] font-mono">{"$"}{contraEntrega.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                          </tr>
                        </tbody>
                      </table>
                      <p className="text-[7px] text-neutral-400 italic text-center mt-2">* Nota: El Valor Total de Venta detallado ya considera un beneficio especial del 5% de descuento por etapa de pre-lanzamiento respecto al precio de lista estándar.</p>
                    </div>

                    {/* Cronograma de Pagos - Resuelto el desborde */}
                    {entradaDiferirTotal > 0 && (
                      <div className="flex-1 flex flex-col mb-4 min-h-0">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#B94A36] mb-1">Cronograma de Pagos ({mesesConstruccion} Dividendos)</h4>
                        <div className="border-t border-[#B94A36] w-full mb-1"></div>
                        <div className="grid grid-cols-2 gap-x-12 items-start text-[10px] text-neutral-600 flex-1">
                          <div className="space-y-0">
                            {cuotasDivididas.columnaIzquierda.map((cuota) => (
                              <div key={cuota.numeroCuota} className="flex justify-between border-b border-neutral-100 py-[2px]">
                                <span>C{cuota.numeroCuota} | {cuota.fechaPago}</span>
                                <span className="font-bold text-neutral-800 font-mono">{"$"}{cuota.valor.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                              </div>
                            ))}
                          </div>
                          <div className="space-y-0">
                            {cuotasDivididas.columnaDerecha.map((cuota) => (
                              <div key={cuota.numeroCuota} className="flex justify-between border-b border-neutral-100 py-[2px]">
                                <span>C{cuota.numeroCuota} | {cuota.fechaPago}</span>
                                <span className="font-bold text-neutral-800 font-mono">{"$"}{cuota.valor.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Valores Agregados (Caja con sombra) */}
                    <div className="shrink-0 border border-neutral-200 rounded-xl p-3.5 bg-white shadow-sm">
                      <h4 className="text-[9px] font-bold uppercase tracking-widest text-[#B94A36] mb-1.5">Valores Agregados a la Unidad</h4>
                      <ul className="text-[9px] text-neutral-700 space-y-1 pl-3 list-disc marker:text-[#DEB886]">
                        {esLocal ? (
                          <li><span className="font-bold text-neutral-800">Complemento Inmobiliario:</span> La unidad incluye {cantidadParqueos} parqueo{cantidadParqueos !== 1 ? 's' : ''}.</li>
                        ) : (
                          <li><span className="font-bold text-neutral-800">Complementos Inmobiliarios:</span> El Valor Total de Venta ya contempla la asignación de los parqueos y la bodega detallados en la ficha técnica.</li>
                        )}
                        {!esLocal && (<li><span className="font-bold text-neutral-800">Equipamiento:</span> La unidad incluye calentador de agua.</li>)}
                        {!esLocal && incluirClima && (<li><span className="font-bold text-neutral-800">Climatización Estética:</span> Sistema de aire acondicionado integral empotrado en el tumbado para todos los ambientes del departamento.</li>)}
                        {!esLocal && incluirBbq && (<li><span className="font-bold text-neutral-800">Área de BBQ en Terraza:</span> Adecuación de espacio exterior con mesón y recubrimientos listos para su uso (no incluye parrilla ni equipos).</li>)}
                      </ul>
                    </div>

                    {/* Espacio Exacto para Firmas */}
                    <div className="mt-auto shrink-0 pt-6 pb-2">
                      <div className="grid grid-cols-2 gap-24 text-center text-[10px] px-10">
                        <div>
                          <div className="border-t border-neutral-300 w-full mb-2"></div>
                          <p className="font-bold text-[#B94A36] uppercase tracking-wider">Arienzo Boutique Living</p>
                          <p className="text-neutral-400 mt-1">Emitido por: {nombreAsesor || 'Konkeri'}</p>
                        </div>
                        <div>
                          <div className="border-t border-neutral-300 w-full mb-2"></div>
                          <p className="font-bold text-neutral-800 uppercase tracking-wider">Aceptación de Propuesta</p>
                          <p className="text-neutral-400 mt-1">Firma del Inversionista</p>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* --- PÁGINA 2: PLANO ARQUITECTÓNICO (DISEÑO ABSOLUTO Y REFINADO) --- */}
                <div className="hoja-a4 shrink-0 bg-white flex flex-col justify-between text-neutral-900 shadow-2xl print:shadow-none border border-neutral-300 print:border-none rounded-md print:rounded-none mx-auto">
                  
                  {/* Header P2: Gorra Negra Superior (Sin Diez Muller) */}
                  <div className="flex items-stretch h-[170px] z-10 shrink-0 w-full bg-[#181A20] text-white">
                    <div className="w-[210px] h-full relative">
                      <img src={RENDER_FACHADA} alt="Fachada Arienzo" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 p-8 flex flex-col justify-center border-l border-white/10">
                      <h3 className="text-[16px] font-bold tracking-widest uppercase text-[#D1C292]">Diseño Arquitectónico</h3>
                      <p className="text-[11px] mt-1 font-bold tracking-wider text-white">Unidad {propiedadSeleccionada?.unidad || propiedadSeleccionada?.numero} | {tipologia}</p>
                      <p className="text-[11.5px] text-white/90 leading-[1.8] font-light mt-3 pr-6 tracking-wide">
                        Un diseño arquitectónico exclusivo y minuciosamente pensado por el arquitecto Siegfried Müller, uno de los más reconocidos del país. Cada espacio ha sido concebido para ofrecer un estilo de vida superior, destacando una distribución inteligente y una selección de acabados de excelente calidad.
                      </p>
                    </div>
                  </div>

                  {/* Barra de Íconos */}
                  <div className="bg-[#F9F7F5] border-b border-[#EAE3DC] px-6 py-5 grid grid-cols-7 gap-1 items-center z-10 shrink-0">
                    <div className="flex flex-col items-center gap-2 border-r border-neutral-300">
                      <svg className="w-5 h-5 text-[#B94A36]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                      <span className="text-[6.5px] font-bold text-neutral-500 uppercase tracking-widest">Área Total</span>
                      <span className="text-[11px] font-black text-[#B94A36]">{areaTotal} m²</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 border-r border-neutral-300">
                      <svg className="w-5 h-5 text-[#415364]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 10h16M4 14h16m-2-4v8m-12-8v8M6 10V8a2 2 0 012-2h8a2 2 0 012 2v2" /></svg>
                      <span className="text-[6.5px] font-bold text-neutral-500 uppercase tracking-widest">Dormitorios</span>
                      <span className="text-[11px] font-bold text-[#21242E]">{numHabitaciones}</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 border-r border-neutral-300">
                      <svg className="w-5 h-5 text-[#415364]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 8V6a2 2 0 012-2h4a2 2 0 012 2v2m-6 3v3m4-3v3m-2-3v3m-6 5h12" /></svg>
                      <span className="text-[6.5px] font-bold text-neutral-500 uppercase tracking-widest">Baños</span>
                      <span className="text-[11px] font-bold text-[#21242E]">{numBanos}</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 border-r border-neutral-300">
                      <svg className="w-5 h-5 text-[#415364]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2" strokeWidth="1.5" /><circle cx="12" cy="12" r="3" strokeWidth="1.5" /><path d="M9 6h2M13 6h2" strokeWidth="1.5" strokeLinecap="round" /></svg>
                      <span className="text-[6.5px] font-bold text-neutral-500 uppercase tracking-widest">Lavandería</span>
                      <span className="text-[11px] font-bold text-[#21242E]">Sí</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 border-r border-neutral-300">
                      <svg className="w-5 h-5 text-[#415364]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 14h16v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6zM4 14V6a2 2 0 012-2h12a2 2 0 012 2v8M8 14v6m8-6v6" /></svg>
                      <span className="text-[6.5px] font-bold text-neutral-500 uppercase tracking-widest">Terraza</span>
                      <span className="text-[11px] font-bold text-[#21242E]">Sí</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 border-r border-neutral-300">
                      <svg className="w-5 h-5 text-[#415364]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 13l2-6h10l2 6M5 13v6a1 1 0 001 1h1a1 1 0 001-1v-1h8v1a1 1 0 001 1h1a1 1 0 001-1v-6M5 13h14M8 16h.01M16 16h.01" /></svg>
                      <span className="text-[6.5px] font-bold text-neutral-500 uppercase tracking-widest">Parqueos</span>
                      <span className="text-[11px] font-bold text-[#21242E]">{cantidadParqueos}</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-5 h-5 text-[#415364]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" /></svg>
                      <span className="text-[6.5px] font-bold text-neutral-500 uppercase tracking-widest">Bodega</span>
                      <span className="text-[11px] font-bold text-[#21242E]">{bodegaAsignada && bodegaAsignada.toLowerCase() !== 'ninguna' ? 'Sí' : 'No'}</span>
                    </div>
                  </div>

                  {/* Marco del Plano Arquitectónico */}
                  <div className="flex-1 flex items-center justify-center py-6 px-16 bg-white relative z-10 overflow-hidden">
                     <div className="w-full h-full max-h-[145mm] border border-[#D1C292]/60 rounded-xl flex flex-col items-center justify-center p-8 bg-white relative">
                        <div className="absolute top-0 left-0 w-full bg-[#F9F7F5] border-b border-[#D1C292]/30 flex items-center justify-center py-2.5 rounded-t-xl">
                           <span className="text-[9px] font-bold text-[#B94A36] uppercase tracking-widest">Plano Esquemático de Distribución</span>
                        </div>
                        <img src={urlPlanoAsignado} alt="Plano Arienzo" className="w-full h-full mt-6 object-contain mix-blend-multiply" />
                     </div>
                  </div>

                  {/* Resumen de Especificaciones (TEXTO LITERAL Y FONDO TERRACOTA CLARO) */}
                  <div className="px-12 py-6 bg-[#FDF8F5] shrink-0 border-t border-[#EAE3DC]">
                     <h4 className="text-[9px] font-bold uppercase tracking-widest text-[#B94A36] mb-4">Resumen de Especificaciones Técnicas y Equipamiento</h4>
                     <div className="grid grid-cols-2 gap-x-10 gap-y-4 text-[8px] text-neutral-700 leading-relaxed">
                        <div>
                          <p><strong className="text-neutral-900 uppercase">Acabados Interiores:</strong> Pisos de porcelanato importado rectificado de 60 × 120 cm, paredes lisas con revestimientos decorativos y puertas de madera con chapa natural lacada de 2,30 m de altura.</p>
                        </div>
                        <div>
                          <p><strong className="text-neutral-900 uppercase">Cocina y Clósets:</strong> Mobiliario de melamínico Madeval o similar. Mesones de piedra sinterizada y fregadero de acero inoxidable de dos pozos, tipo undercounter.</p>
                        </div>
                        <div>
                          <p><strong className="text-neutral-900 uppercase">Baños y Grifería:</strong> Mesones de piedra sinterizada, muebles de melamínico, lavamanos FV o Edesa y grifería de línea alta FV o Edesa.</p>
                        </div>
                        <div>
                          <p><strong className="text-neutral-900 uppercase">Ventanería y Pasamanos:</strong> Ventanas de aluminio anodizado color café, con vidrio claro y sistema de apertura proyectable. Pasamanos de vidrio templado con anclaje inferior.</p>
                        </div>
                        <div>
                          <p><strong className="text-neutral-900 uppercase">Áreas Comunales y Amenidades:</strong> Área social con piscina, zona de barbacoa (BBQ), espacios de living y gimnasio.</p>
                        </div>
                        <div>
                          <p><strong className="text-neutral-900 uppercase">Equipamiento del Edificio:</strong> Generador eléctrico con cobertura para el 100 % del edificio, incluidas las áreas privadas y comunales. Ascensor para 10 personas.</p>
                        </div>
                     </div>
                  </div>

                  {/* Footer P2: Terracota Grueso */}
                  <div className="bg-[#B94A36] h-[75px] flex justify-center items-center z-10 shrink-0">
                    <img src={LOGO_BLANCO} alt="Arienzo" className="h-6 w-auto object-contain opacity-95" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-2xl border border-neutral-200/60 p-6 shadow-sm space-y-5">
                
                <h2 className="text-[11px] font-bold text-[#ea0029] uppercase tracking-widest border-b border-neutral-100 pb-2">2. Descuento Extraordinario (Opcional)</h2>
                
                <div className="flex bg-[#dce3eb]/50 p-1.5 rounded-xl border border-[#415364]/10 w-fit">
                  <button type="button" onClick={() => { setTipoDescuento('porcentaje'); setValorDescuento(0); }} className={`px-4 py-2 rounded-lg text-xs transition-all font-bold ${tipoDescuento === 'porcentaje' ? 'bg-white text-[#415364] shadow-sm' : 'text-[#415364]/50 hover:text-[#415364]'}`}>
                    Porcentaje (%)
                  </button>
                  <button type="button" onClick={() => { setTipoDescuento('valor'); setValorDescuento(0); }} className={`px-4 py-2 rounded-lg text-xs transition-all font-bold ${tipoDescuento === 'valor' ? 'bg-white text-[#415364] shadow-sm' : 'text-[#415364]/50 hover:text-[#415364]'}`}>
                    Valor Fijo ($)
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-end">
                  <div className="sm:col-span-1">
                    <label className="block text-[10px] font-bold text-[#415364]/60 uppercase mb-1.5">
                      {tipoDescuento === 'porcentaje' ? 'Descuento (%)' : 'Descuento ($)'}
                    </label>
                    <input type="number" min="0" value={valorDescuento || ''} onChange={(e) => setValorDescuento(Math.max(0, Number(e.target.value)))} className="w-full bg-[#dce3eb]/30 border border-[#415364]/20 rounded-xl p-3 text-sm font-mono font-bold outline-none focus:border-[#ea0029]" placeholder="0" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-[#415364]/60 uppercase mb-1.5">Justificación de Gerencia</label>
                    <input type="text" value={motivoDescuento} onChange={(e) => setMotivoDescuento(e.target.value)} className="w-full bg-[#dce3eb]/30 border border-[#415364]/20 rounded-xl p-3 text-sm font-medium text-[#415364] outline-none focus:border-[#ea0029]" placeholder="Ej. Promoción de feria, Pago de contado..." />
                  </div>
                </div>
              </div>

              {!esLocal && propiedadSeleccionada && (
                <div className="bg-white rounded-2xl border border-neutral-200/60 p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-neutral-100 pb-2">
                    <h2 className="text-[11px] font-bold text-[#ea0029] uppercase tracking-widest">3. Presentación de Extras y Anexos (PDF)</h2>
                  </div>
                  
                  {/* 🔥 TOGGLE PARA EL PLANO ARQUITECTÓNICO */}
                  <div className={`flex items-center gap-3 border p-4 rounded-xl cursor-pointer transition-colors ${incluirPlano ? 'bg-[#ea0029]/5 border-[#ea0029]/30' : 'bg-[#415364]/5 border-[#415364]/10 hover:border-[#ea0029]/40'}`} onClick={() => setIncluirPlano(!incluirPlano)}>
                    <input type="checkbox" checked={incluirPlano} onChange={() => {}} className="w-4 h-4 text-[#ea0029] rounded focus:ring-[#ea0029] cursor-pointer" />
                    <div>
                      <p className={`text-xs font-bold ${incluirPlano ? 'text-[#ea0029]' : 'text-[#415364]'}`}>Incluir Plano Arquitectónico en el PDF</p>
                      <p className="text-[10px] font-medium text-[#415364]/60">Añade una segunda página al documento con el diseño de la tipología y el render de la fachada.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-[#415364]/5 border border-[#415364]/10 p-4 rounded-xl cursor-pointer hover:border-[#ea0029]/40 transition-colors" onClick={() => setIncluirClima(!incluirClima)}>
                    <input type="checkbox" checked={incluirClima} onChange={() => {}} className="w-4 h-4 text-[#ea0029] rounded focus:ring-[#ea0029] cursor-pointer" />
                    <div>
                      <p className="text-xs font-bold text-[#415364]">Mostrar Climatización Estética</p>
                      <p className="text-[10px] font-medium text-[#415364]/60">Detalla en la hoja de venta que la unidad incluye aire central empotrado.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-[#415364]/5 border border-[#415364]/10 p-4 rounded-xl cursor-pointer hover:border-[#ea0029]/40 transition-colors" onClick={() => setIncluirBbq(!incluirBbq)}>
                    <input type="checkbox" checked={incluirBbq} onChange={() => {}} className="w-4 h-4 text-[#ea0029] rounded focus:ring-[#ea0029] cursor-pointer" />
                    <div>
                      <p className="text-xs font-bold text-[#415364]">Mostrar Área de BBQ (Terraza)</p>
                      <p className="text-[10px] font-medium text-[#415364]/60">Agrega el texto descriptivo del mesón en la terraza en la hoja de venta.</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-2xl border border-neutral-200/60 p-6 shadow-sm space-y-5">
                <h2 className="text-[11px] font-bold text-[#ea0029] uppercase tracking-widest border-b border-neutral-100 pb-2">4. Modalidad del Plan</h2>
                <div className="grid grid-cols-2 gap-3 bg-[#dce3eb]/50 p-1.5 rounded-xl border border-[#415364]/10">
                  <button type="button" onClick={() => setIncluirFechas(true)} className={`py-3 text-xs font-bold rounded-lg transition-all ${incluirFechas ? 'bg-white text-[#ea0029] shadow-sm border border-[#ea0029]/20' : 'text-[#415364]/70 hover:text-[#415364]'}`}>
                    📅 Configurar Fechas Reales
                  </button>
                  <button type="button" onClick={() => setIncluirFechas(false)} className={`py-3 text-xs font-bold rounded-lg transition-all ${!incluirFechas ? 'bg-white text-[#ea0029] shadow-sm border border-[#ea0029]/20' : 'text-[#415364]/70 hover:text-[#415364]'}`}>
                    🚫 Solo Cotizar Valores
                  </button>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-5 items-center bg-[#415364]/5 p-4 rounded-xl border border-[#415364]/10">
                  <div className="w-full sm:w-1/2">
                    <label className="block text-[10px] font-bold text-[#415364]/60 uppercase mb-1.5">Validez (Caducidad del PDF)</label>
                    <input type="date" value={fechaCaducidad} onChange={(e) => setFechaCaducidad(e.target.value)} className="w-full bg-white border border-[#415364]/20 rounded-lg p-2.5 text-xs font-bold text-[#415364] outline-none focus:border-[#ea0029]" />
                  </div>
                  <div className="flex bg-[#dce3eb]/50 p-1 rounded-lg text-[10px] font-bold w-full sm:w-auto mt-4 sm:mt-5">
                    <button type="button" onClick={() => setDiasCaducidad(7)} className="px-4 py-2 rounded-md hover:bg-white text-[#415364] hover:shadow-sm transition-all">7 Días</button>
                    <button type="button" onClick={() => setDiasCaducidad(15)} className="px-4 py-2 rounded-md hover:bg-white text-[#415364] hover:shadow-sm transition-all">15 Días</button>
                  </div>
                </div>
              </div>

              {incluirFechas && (
                <div className="bg-white rounded-2xl border border-neutral-200/60 p-6 shadow-sm space-y-6">
                  <div>
                    <h2 className="text-[11px] font-bold text-[#ea0029] uppercase tracking-widest border-b border-neutral-100 pb-2 mb-4">Hitos Contractuales</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[10px] font-bold text-[#415364]/60 uppercase mb-1.5">Fecha Firma Reserva</label>
                        <input type="date" value={fechaReserva} onChange={(e) => setFechaReserva(e.target.value)} className="w-full bg-[#dce3eb]/30 border border-[#415364]/20 rounded-xl p-3 text-xs font-bold text-[#415364] outline-none focus:border-[#ea0029]" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#415364]/60 uppercase mb-1.5">Fecha Firma Promesa</label>
                        <input type="date" value={fechaFirmaPromesa} onChange={(e) => setFechaFirmaPromesa(e.target.value)} className="w-full bg-[#dce3eb]/30 border border-[#415364]/20 rounded-xl p-3 text-xs font-bold text-[#415364] outline-none focus:border-[#ea0029]" />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[#415364]/10 pt-4">
                    <h2 className="text-[11px] font-bold text-[#ea0029] uppercase tracking-widest mb-4">Fechas Financiamiento Obra</h2>
                    <div className="grid grid-cols-3 gap-5">
                      <div>
                        <label className="block text-[10px] font-bold text-[#415364]/60 uppercase mb-1.5">Día de Pago</label>
                        <input type="number" min="1" max="31" value={diaPago} onChange={(e) => setDiaPago(Number(e.target.value))} className="w-full bg-[#dce3eb]/30 border border-[#415364]/20 rounded-xl p-3 text-xs font-bold text-[#415364] outline-none focus:border-[#ea0029]" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#415364]/60 uppercase mb-1.5">Mes Inicio</label>
                        <select value={mesInicio} onChange={(e) => setMesInicio(Number(e.target.value))} className="w-full bg-[#dce3eb]/30 border border-[#415364]/20 rounded-xl p-3 text-xs font-bold text-[#415364] outline-none focus:border-[#ea0029]">
                          {['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'].map((m, idx) => (
                            <option key={idx} value={idx + 1}>{m}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#415364]/60 uppercase mb-1.5">Año</label>
                        <input type="number" value={anioInicio} onChange={(e) => setAnioInicio(Number(e.target.value))} className="w-full bg-[#dce3eb]/30 border border-[#415364]/20 rounded-xl p-3 text-xs font-bold text-[#415364] outline-none focus:border-[#ea0029]" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-[#21242E] rounded-2xl border border-neutral-800 p-6 shadow-xl space-y-6">
                <h2 className="text-[11px] font-bold text-[#D1C292] uppercase tracking-widest border-b border-white/10 pb-2">5. Estructura de Pagos (Flujo de Caja)</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">Monto de Reserva ($)</label>
                    <input type="number" min="0" value={reservaValor || ''} onChange={(e) => setReservaValor(Number(e.target.value))} className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-sm font-mono font-bold text-white outline-none focus:border-[#D1C292] transition-colors" />
                  </div>

                  <div className="space-y-2 border border-white/10 p-3.5 rounded-xl bg-[#1a1c23]">
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-[10px] font-bold text-white uppercase tracking-widest">Abono Inicial</label>
                      <div className="flex bg-white/10 p-1 rounded-lg text-[10px] font-bold">
                        <button type="button" onClick={() => setTipoInicial('porcentaje')} className={`px-2 py-1 rounded-md transition-all ${tipoInicial === 'porcentaje' ? 'bg-[#ea0029] text-white shadow-sm' : 'text-white/50 hover:text-white'}`}>%</button>
                        <button type="button" onClick={() => setTipoInicial('valor')} className={`px-2 py-1 rounded-md transition-all ${tipoInicial === 'valor' ? 'bg-[#ea0029] text-white shadow-sm' : 'text-white/50 hover:text-white'}`}>$</button>
                      </div>
                    </div>
                    <input type="number" min="0" value={valorInicial || ''} onChange={(e) => setValorInicial(Number(e.target.value))} className="w-full bg-white border border-transparent rounded-lg p-2.5 text-sm font-mono font-bold text-[#21242E] outline-none focus:ring-2 focus:ring-[#ea0029]" />
                    
                    <div className="flex justify-between items-center pt-3 mt-3 border-t border-white/10">
                      <label className="text-[10px] font-bold text-white/50 uppercase">Diferir en (Meses):</label>
                      <input type="number" min="1" max="12" value={mesesInicial} onChange={(e) => setMesesInicial(Math.max(1, Number(e.target.value)))} className="w-16 bg-white/10 border border-white/20 text-white rounded-lg p-2 text-xs font-bold outline-none text-center focus:border-[#D1C292]" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Entrada Obra</label>
                      <div className="flex bg-white/10 p-1 rounded-lg text-[10px] font-bold">
                        <button type="button" onClick={() => setTipoEntrada('porcentaje')} className={`px-2 py-1 rounded-md transition-all ${tipoEntrada === 'porcentaje' ? 'bg-[#ea0029] text-white shadow-sm' : 'text-white/50 hover:text-white'}`}>%</button>
                        <button type="button" onClick={() => setTipoEntrada('valor')} className={`px-2 py-1 rounded-md transition-all ${tipoEntrada === 'valor' ? 'bg-[#ea0029] text-white shadow-sm' : 'text-white/50 hover:text-white'}`}>$</button>
                      </div>
                    </div>
                    <input type="number" min="0" value={valorEntrada || ''} onChange={(e) => setValorEntrada(Number(e.target.value))} className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-sm font-mono font-bold text-white outline-none focus:border-[#D1C292]" />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">Plazo de Obra (Meses)</label>
                    <input type="number" min="1" max="48" value={mesesConstruccion} onChange={(e) => setMesesConstruccion(Math.min(48, Number(e.target.value)))} className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-sm font-mono font-bold text-white outline-none focus:border-[#D1C292]" />
                  </div>
                  
                </div>
              </div>

              {entradaDiferirTotal > 0 && (
                <div className="bg-white rounded-2xl border border-neutral-200/60 p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-5 border-b border-neutral-100 pb-4">
                    <h2 className="text-[11px] font-bold text-[#ea0029] uppercase tracking-widest">Vista y Ajuste de Cronograma de Obra</h2>
                    <div className="flex gap-2">
                      <button onClick={reiniciarCuotas} className="text-[10px] text-[#415364]/60 hover:text-[#415364] font-bold uppercase tracking-wider bg-[#dce3eb]/50 px-3 py-2 rounded-lg transition-colors">
                        ↻ Reiniciar
                      </button>
                      <button onClick={() => setMostrarCalculadoraRefuerzos(!mostrarCalculadoraRefuerzos)} className="text-[10px] bg-[#ea0029] text-white px-4 py-2 rounded-lg hover:bg-[#c90022] font-bold uppercase tracking-wider transition-colors shadow-sm">
                        ⚡ Calcular Cuota Balón
                      </button>
                    </div>
                  </div>

                  {mostrarCalculadoraRefuerzos && (
                    <div className="mb-5 p-5 bg-[#415364] border border-[#21242E] rounded-xl flex flex-col gap-4 animate-in fade-in shadow-inner">
                       <p className="text-[10px] text-[#dce3eb] font-medium leading-relaxed">Configura una <strong className="text-white">cuota base fija</strong> para todo el plan. El saldo sobrante se dividirá automáticamente en tus <strong className="text-white">meses de refuerzo</strong> (ej. utilidades, bonos, venta de activos).</p>
                       <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
                          <div className="flex-1">
                            <label className="text-[9px] font-bold text-[#dce3eb]/70 uppercase mb-1.5 block">Cuota Fija Base ($)</label>
                            <input type="number" value={cuotaBaseRapida} onChange={e => setCuotaBaseRapida(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Ej: 1500" className="w-full bg-white/10 border border-white/20 p-2.5 text-xs font-mono font-bold text-white rounded-lg outline-none focus:border-white transition-colors"/>
                          </div>
                          <div className="flex-1">
                            <label className="text-[9px] font-bold text-[#dce3eb]/70 uppercase mb-1.5 block">Meses de Refuerzo (Separar con coma)</label>
                            <input type="text" value={mesesRefuerzoRapido} onChange={e => setMesesRefuerzoRapido(e.target.value)} placeholder="Ej: 12, 24" className="w-full bg-white/10 border border-white/20 p-2.5 text-xs font-mono font-bold text-white rounded-lg outline-none focus:border-white transition-colors"/>
                          </div>
                          <button onClick={aplicarPlanRefuerzos} className="bg-[#ea0029] text-white px-6 py-2.5 rounded-lg text-[11px] font-bold hover:bg-[#c90022] uppercase tracking-wider w-full sm:w-auto transition-colors shadow-md">
                            Aplicar Cálculo
                          </button>
                       </div>
                    </div>
                  )}

                  <div className="max-h-80 overflow-y-auto border border-[#415364]/10 rounded-xl divide-y divide-[#415364]/5 custom-scrollbar">
                    {cronogramaCuotas.map((cuota) => (
                      <div key={cuota.numeroCuota} className={`flex justify-between items-center p-4 transition-colors ${cuota.esEditable ? 'bg-[#ea0029]/10' : 'bg-white hover:bg-[#dce3eb]/20'}`}>
                        <span className={`text-[11px] font-bold ${cuota.esEditable ? 'text-[#ea0029]' : 'text-[#415364]'}`}>Cuota {cuota.numeroCuota} — <span className="font-medium opacity-70">{cuota.fechaPago}</span></span>
                        <div className={`flex items-center border-b border-dashed pb-0.5 ${cuota.esEditable ? 'border-[#ea0029]/40' : 'border-[#415364]/30'}`}>
                          <span className={`text-xs mr-1 font-bold ${cuota.esEditable ? 'text-[#ea0029]' : 'text-[#415364]/50'}`}>{"$"}</span>
                          <input type="number" step="0.01" value={cuota.valor === 0 ? '' : Number(cuota.valor.toFixed(2))} onChange={(e) => actualizarValorCuota(cuota.numeroCuota, Number(e.target.value))} className={`w-28 bg-transparent text-right text-sm font-bold outline-none font-mono ${cuota.esEditable ? 'text-[#ea0029]' : 'text-[#415364]'}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
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
                    {"$"}{cronogramaCuotas.length > 0 ? (entradaDiferirTotal / mesesConstruccion).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'}
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
                  <button
                    onClick={descargarPdfComercial}
                    disabled={generandoPdf}
                    className="w-full bg-white border-2 border-[#21242E] text-[#21242E] rounded-xl p-3 text-[10px] font-bold uppercase tracking-widest hover:bg-[#21242E] hover:text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path></svg>
                    {generandoPdf ? 'Generando...' : 'Bajar PDF'}
                  </button>

                  <button
                    onClick={enviarCotizacionPorCorreo}
                    disabled={enviandoCorreo || !clienteDataCompleta?.email}
                    className={`w-full border-2 rounded-xl p-3 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 ${!clienteDataCompleta?.email ? 'bg-neutral-100 border-neutral-200 text-neutral-400 cursor-not-allowed' : 'bg-white border-[#21242E] text-[#21242E] hover:bg-[#21242E] hover:text-white shadow-sm'}`}
                    title={!clienteDataCompleta?.email ? "El cliente no tiene correo registrado" : "Enviar PDF por correo"}
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                    {enviandoCorreo ? 'Enviando...' : 'Enviar Email'}
                  </button>
                </div>

                <button
                  onClick={guardarCotizacionEnSistema}
                  disabled={guardando}
                  className="w-full bg-[#ea0029] text-white rounded-xl p-3.5 text-[11px] font-bold uppercase tracking-widest hover:bg-[#c90022] transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
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