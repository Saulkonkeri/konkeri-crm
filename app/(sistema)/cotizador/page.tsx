// Actualizacion para Vercel - Cotizador con Llenado Rápido (Cuotas Balón/Refuerzo)
'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

interface CuotaMes {
  numeroCuota: number;
  fechaPago: string;
  valor: number;
  esEditable: boolean;
}

export default function CotizadorPage() {
  const [propiedades, setPropiedades] = useState<any[]>([]);
  const [propiedadSeleccionada, setPropiedadSeleccionada] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [generandoPdf, setGenerandoPdf] = useState(false);
  
  const [pestañaActiva, setPestañaActiva] = useState<'configurar' | 'previsualizar'>('configurar');

  // --- ESTADOS DE CLIENTES, BUSCADOR Y ASESOR ---
  const [clientes, setClientes] = useState<any[]>([]);
  const [busquedaCliente, setBusquedaCliente] = useState<string>('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState<string>(''); 
  const [nombreAsesor, setNombreAsesor] = useState<string>('Saúl Intriago / Debbi Mera');

  // --- CONTROL DE MODALIDAD TEMPORAL (CON/SIN FECHAS) ---
  const [incluirFechas, setIncluirFechas] = useState<boolean>(true);

  // --- CONTROL DE DESCUENTOS ADICIONALES ---
  const [tipoDescuento, setTipoDescuento] = useState<'porcentaje' | 'valor'>('porcentaje');
  const [valorDescuento, setValorDescuento] = useState<number>(0);
  const [motivoDescuento, setMotivoDescuento] = useState<string>('');

  // --- COMPLEMENTOS ESTÉTICOS Y ARQUITECTÓNICOS (No afectan precios) ---
  const [incluirClima, setIncluirClima] = useState<boolean>(false);
  const [incluirBbq, setIncluirBbq] = useState<boolean>(false);

  // --- PARÁMETROS FINANCIEROS Y DE FECHA ---
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

  // NUEVO: ESTADOS PARA CALCULADORA RÁPIDA DE REFUERZOS (Cuotas Balón)
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
        const { data: dataProp, error: errorProp } = await supabase
          .from('propiedades')
          .select('*');
        
        if (!errorProp && dataProp) {
          const datosOrdenados = dataProp.sort((a, b) => {
            const numA = parseInt(a.unidad || a.numero, 10) || 0;
            const numB = parseInt(b.unidad || b.numero, 10) || 0;
            return numA - numB;
          });
          setPropiedades(datosOrdenados);
        }

        const { data: dataCli, error: errorCli } = await supabase
          .from('clientes')
          .select('id, nombres, apellidos, tipo, telefono')
          .order('nombres', { ascending: true });
        if (!errorCli && dataCli) setClientes(dataCli);

      } catch (err) {
        console.error("Error cargando datos de Supabase:", err);
      } finally {
        setCargando(false);
      }
    }
    cargarDatosIniciales();
  }, []);

  const clientesFiltrados = useMemo(() => {
    if (!busquedaCliente.trim()) return clientes;
    const b = busquedaCliente.toLowerCase();
    return clientes.filter(c => 
      `${c.nombres || ''} ${c.apellidos || ''}`.toLowerCase().includes(b) || 
      (c.telefono && c.telefono.includes(b))
    );
  }, [clientes, busquedaCliente]);

  const { 
    precioListaOriginal,
    montoDescuentoCalculado,
    precioDeptoPreLanzamiento,
    valAnexosPreLanzamiento,
    precioTotal, 
    cuotaInicialTotal, 
    saldoFirmaPromesa, 
    cuotaInicialMensual, 
    entradaDiferirTotal, 
    contraEntrega,
    pctInicialReal,
    pctFirmaReal,
    pctEntradaReal,
    pctContraEntregaReal,
    areaTotal,
    valorM2Lanzamiento,
    tipologia,
    parqueaderoTexto,
    bodegaAsignada,
    esLocal,
    cantidadParqueos
  } = useMemo(() => {
    const listaOriginal = propiedadSeleccionada ? Number(propiedadSeleccionada.precio) : 0;
    
    const asignadoText = propiedadSeleccionada?.parqueadero_asignado || '';
    const bodegaText = propiedadSeleccionada?.bodega_asignada || 'Ninguna';
    
    const isLocalComercial = 
      (propiedadSeleccionada?.categoria || '').toLowerCase().includes('local') || 
      (propiedadSeleccionada?.tipologia || '').toLowerCase().includes('local');

    let cant = propiedadSeleccionada ? Number(propiedadSeleccionada.parqueadero_cantidad || 0) : 0;
    if (cant === 0 && asignadoText) {
      const coincidencias = asignadoText.match(/P\d+/gi);
      cant = coincidencias ? coincidencias.length : 1; 
      if (asignadoText.toLowerCase().includes('ningun') || asignadoText.toLowerCase().includes('no')) {
          cant = 0;
      }
    }

    let valAnexosBase = 0;
    if (cant >= 2) {
      valAnexosBase = 20000;
    } else if (cant === 1) {
      valAnexosBase = 11000;
    }
    
    const valAnexosDescontados = isLocalComercial ? 0 : valAnexosBase * 0.95;
    const precioDeptoDescontado = Math.max(0, listaOriginal - valAnexosDescontados);

    let descuentoMonto = 0;
    if (tipoDescuento === 'porcentaje') {
      descuentoMonto = listaOriginal * (valorDescuento / 100);
    } else {
      descuentoMonto = valorDescuento;
    }

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
    if (totalPagadoAntesDeEntrega > precioFin) {
        entradaDiferir = Math.max(0, precioFin - reservaValor - saldoPromesa);
    }

    let entrega = precioFin - reservaValor - saldoPromesa - entradaDiferir;
    if (entrega < 0) entrega = 0;

    const mensualInicial = mesesInicial > 0 ? saldoPromesa / mesesInicial : saldoPromesa;

    const pReserva = precioFin > 0 ? (reservaValor / precioFin) * 100 : 0;
    const pFirma = precioFin > 0 ? (saldoPromesa / precioFin) * 100 : 0;
    const pInicialTotal = pReserva + pFirma; 
    const pEntrada = precioFin > 0 ? (entradaDiferir / precioFin) * 100 : 0;
    const pEntrega = precioFin > 0 ? (entrega / precioFin) * 100 : 0;

    let textoParqueo = 'Ninguno';
    if (asignadoText && asignadoText.toLowerCase() !== 'ninguno') {
      textoParqueo = `${asignadoText} (${cant})`;
    } else if (cant > 0) {
      textoParqueo = `Asignado (${cant})`;
    }

    const area = propiedadSeleccionada ? Number(propiedadSeleccionada.area_total || 0) : 0;
    const m2Lanzamiento = area > 0 ? precioDeptoDescontado / area : 0;
    
    return {
      precioListaOriginal: listaOriginal,
      montoDescuentoCalculado: descuentoMonto,
      precioDeptoPreLanzamiento: precioDeptoDescontado,
      valAnexosPreLanzamiento: valAnexosDescontados,
      precioTotal: precioFin,
      cuotaInicialTotal: reservaValor + saldoPromesa,
      saldoFirmaPromesa: saldoPromesa,
      cuotaInicialMensual: mensualInicial,
      entradaDiferirTotal: entradaDiferir,
      contraEntrega: entrega,
      pctInicialReal: pInicialTotal,
      pctFirmaReal: pFirma,
      pctEntradaReal: pEntrada,
      pctContraEntregaReal: pEntrega,
      areaTotal: area,
      valorM2Lanzamiento: m2Lanzamiento,
      tipologia: propiedadSeleccionada?.tipologia || '---',
      parqueaderoTexto: textoParqueo,
      bodegaAsignada: bodegaText,
      esLocal: isLocalComercial,
      cantidadParqueos: cant > 0 ? cant : 1
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
        const diaFormateado = String(fechaCuota.getDate()).padStart(2, '0');
        const nombreMes = mesesNombres[fechaCuota.getMonth()];
        const anioFormateado = fechaCuota.getFullYear();
        etiquetaFecha = `${diaFormateado} de ${nombreMes} ${anioFormateado}`;
      }

      return {
        numeroCuota: i + 1,
        fechaPago: etiquetaFecha,
        valor: valorBaseCuota,
        esEditable: false,
      };
    });
    setCronogramaCuotas(cuotasCalculadas);
  }, [propiedadSeleccionada, mesesConstruccion, entradaDiferirTotal, diaPago, mesInicio, anioInicio, incluirFechas]);

  const cuotasDivididas = useMemo(() => {
    const mitad = Math.ceil(cronogramaCuotas.length / 2);
    return {
      columnaIzquierda: cronogramaCuotas.slice(0, mitad),
      columnaDerecha: cronogramaCuotas.slice(mitad)
    };
  }, [cronogramaCuotas]);

  // === EDICIÓN MANUAL DE UNA SOLA CUOTA ===
  const actualizarValorCuota = (cuotaNumero: number, nuevoValor: number) => {
    let nuevoCronograma = cronogramaCuotas.map(cuota => {
      if (cuota.numeroCuota === cuotaNumero) {
        return { ...cuota, valor: nuevoValor, esEditable: true };
      }
      return cuota;
    });

    const totalManual = nuevoCronograma.filter(c => c.esEditable).reduce((acc, curr) => acc + curr.valor, 0);
    const saldoRestantePorCubrir = entradaDiferirTotal - totalManual;
    const mesesAutomaticos = nuevoCronograma.filter(c => !c.esEditable);

    if (mesesAutomaticos.length > 0) {
      const valorRepartido = Math.max(0, saldoRestantePorCubrir / mesesAutomaticos.length);
      nuevoCronograma = nuevoCronograma.map(cuota => {
        if (!cuota.esEditable) return { ...cuota, valor: valorRepartido };
        return cuota;
      });
    }
    setCronogramaCuotas(nuevoCronograma);
  };

  // === NUEVO: FUNCIONES DE LLENADO RÁPIDO ===
  const reiniciarCuotas = () => {
    if (mesesConstruccion <= 0) return;
    const valorBaseCuota = entradaDiferirTotal / mesesConstruccion;
    setCronogramaCuotas(cronogramaCuotas.map(c => ({
      ...c,
      valor: valorBaseCuota,
      esEditable: false
    })));
  };

  const aplicarPlanRefuerzos = () => {
    const base = Number(cuotaBaseRapida);
    if (base <= 0) {
      alert("Por favor ingresa una Cuota Base mayor a $0.");
      return;
    }

    // Convertir texto "12, 24" a array de números [12, 24]
    const mesesExtra = mesesRefuerzoRapido
      .split(',')
      .map(m => parseInt(m.trim()))
      .filter(m => !isNaN(m) && m > 0 && m <= mesesConstruccion);

    if (mesesExtra.length === 0) {
      alert(`Por favor ingresa al menos un mes válido entre 1 y ${mesesConstruccion}. (Ej: 12)`);
      return;
    }

    const mesesRegularesCount = mesesConstruccion - mesesExtra.length;
    const totalRegular = base * mesesRegularesCount;
    
    if (totalRegular > entradaDiferirTotal) {
      alert(`La cuota base de $${base} es muy alta. Solo las cuotas regulares sumarían $${totalRegular}, superando el total a diferir ($${entradaDiferirTotal}).`);
      return;
    }

    const saldoParaRefuerzos = entradaDiferirTotal - totalRegular;
    const valorPorRefuerzo = saldoParaRefuerzos / mesesExtra.length;

    const nuevoCronograma = cronogramaCuotas.map(cuota => {
      const esRefuerzo = mesesExtra.includes(cuota.numeroCuota);
      return {
        ...cuota,
        valor: esRefuerzo ? valorPorRefuerzo : base,
        esEditable: true // Lo bloqueamos para que recalculos futuros no lo borren
      };
    });

    setCronogramaCuotas(nuevoCronograma);
    setMostrarCalculadoraRefuerzos(false); // Cerramos el panel tras el éxito
  };

  const nombreClienteActivo = useMemo(() => {
    if (!clienteSeleccionado) return 'Cliente Anónimo / Prospecto Rápido';
    const c = clientes.find(item => item.id.toString() === clienteSeleccionado.toString());
    return c ? `${c.nombres} ${c.apellidos}` : 'Cliente Anónimo';
  }, [clienteSeleccionado, clientes]);

  const guardarCotizacionEnSistema = async () => {
    if (!propiedadSeleccionada) return;
    setGuardando(true);
    try {
      const { error } = await supabase.from('cotizaciones').insert([
        {
          cliente_id: clienteSeleccionado || null, 
          unidad_id: propiedadSeleccionada.id.toString(),
          unidad_numero: propiedadSeleccionada.unidad || propiedadSeleccionada.numero,
          precio_lista: precioListaOriginal,
          monto_descuento: montoDescuentoCalculado,
          motivo_descuento: motivoDescuento || null,
          precio_total: precioTotal,
          porcentaje_inicial: Number(pctInicialReal.toFixed(2)),
          monto_inicial: cuotaInicialTotal,
          porcentaje_entrada: Number(pctEntradaReal.toFixed(2)),
          monto_entrada: entradaDiferirTotal,
          meses_plazo: mesesConstruccion,
          monto_contra_entrega: contraEntrega,
          cronograma_pagos: cronogramaCuotas,
          estado: 'Vigente'
        }
      ]);
      
      if (!error) {
        alert('¡Cotización guardada exitosamente!');
      } else {
        console.error("Error de Supabase:", error);
        alert(`Error de Base de Datos: ${error.message}`);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Error inesperado: ${err.message}`);
    } finally {
      setGuardando(false);
    }
  };

  const descargarPdfComercial = () => {
    if (typeof window === 'undefined') return;
    setGenerandoPdf(true);
    setPestañaActiva('previsualizar');
    
    setTimeout(() => {
      try {
        const elemento = document.getElementById('plantilla-pdf-arienzo');
        if (!elemento) {
          alert("Error: No se encontró la plantilla del PDF.");
          setGenerandoPdf(false);
          return;
        }

        const ventanaImpresion = window.open('', '_blank');
        if (!ventanaImpresion) {
          alert("Por favor, permite las ventanas emergentes.");
          setGenerandoPdf(false);
          return;
        }

        ventanaImpresion.document.write(`
          <html>
            <head>
              <title>Arienzo_Unidad_${propiedadSeleccionada?.unidad || propiedadSeleccionada?.numero || 'S-N'}</title>
              <script src="https://cdn.tailwindcss.com"></script>
              <style>
                @page { size: A4 portrait; margin: 0mm; }
                body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; font-family: ui-sans-serif, system-ui, sans-serif; }
                .contenedor-a4 { width: 210mm; height: 297mm; page-break-inside: avoid; box-sizing: border-box; }
              </style>
            </head>
            <body class="bg-white text-neutral-900 p-0 m-0">
              <div class="contenedor-a4 p-10 flex flex-col justify-between">
                ${elemento.innerHTML}
              </div>
              <script>
                setTimeout(() => { window.print(); window.close(); }, 700);
              </script>
            </body>
          </html>
        `);
        
        ventanaImpresion.document.close();

      } catch (error) {
        console.error('Error procesando impresión:', error);
        alert('Error al generar el documento.');
      } finally {
        setGenerandoPdf(false);
      }
    }, 500);
  };

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F4F4]">
        <p className="text-sm font-light tracking-widest text-[#B94A36] uppercase animate-pulse">Cargando Unidades Arienzo...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F4F4] px-8 py-12 font-sans text-neutral-800">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: CONFIGURADOR */}
        <div className="lg:col-span-2 space-y-6">
          <div className="border-b border-neutral-200 pb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            
            <div>
              <span className="text-xs font-semibold tracking-widest text-[#B94A36] uppercase">Estructurador Comercial</span>
              <h1 className="text-3xl font-light tracking-tight text-neutral-900 mt-1">ARIENZO Boutique Living</h1>
            </div>
            
            {propiedadSeleccionada && (
              <div className="flex bg-neutral-200 p-1 rounded-lg text-xs font-medium shadow-inner">
                <button 
                  onClick={() => setPestañaActiva('configurar')} 
                  className={`px-4 py-2 rounded-md transition duration-200 ${pestañaActiva === 'configurar' ? 'bg-white text-neutral-950 shadow-sm font-semibold' : 'text-neutral-600 hover:text-neutral-900'}`}
                >
                  ⚙️ Configurar Plan
                </button>
                <button 
                  onClick={() => setPestañaActiva('previsualizar')} 
                  className={`px-4 py-2 rounded-md transition duration-200 ${pestañaActiva === 'previsualizar' ? 'bg-white text-[#B94A36] shadow-sm font-bold' : 'text-neutral-600 hover:text-neutral-900'}`}
                >
                  👁️ Ver Cotización
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
            <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Asesor / Comercial Emisor</h2>
            <input
              type="text"
              value={nombreAsesor}
              onChange={(e) => setNombreAsesor(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-sm font-medium focus:outline-none focus:border-[#B94A36]"
              placeholder="Ej. Saúl Intriago / Debbi Mera"
            />
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm space-y-3">
            <h2 className="text-xs font-semibold text-[#B94A36] uppercase tracking-wider">Validez de la Cotización (Caducidad)</h2>
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <input 
                type="date" 
                value={fechaCaducidad} 
                onChange={(e) => setFechaCaducidad(e.target.value)} 
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 text-sm font-semibold outline-none focus:border-[#B94A36]" 
              />
              <div className="flex bg-neutral-100 p-1 rounded-lg text-[11px] font-medium w-full sm:w-auto flex-shrink-0">
                <button type="button" onClick={() => setDiasCaducidad(7)} className="px-3 py-1.5 rounded hover:bg-white hover:shadow-sm transition text-neutral-700 font-semibold">7 Días</button>
                <button type="button" onClick={() => setDiasCaducidad(15)} className="px-3 py-1.5 rounded hover:bg-white hover:shadow-sm transition text-neutral-700 font-semibold">15 Días</button>
              </div>
            </div>
            <p className="text-[10px] text-neutral-400">Esta fecha aparecerá en el documento impreso para generar urgencia de compra.</p>
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm space-y-3">
            <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Asociar Inversionista</h2>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400 text-xs">🔍</span>
              <input 
                type="text" 
                placeholder="Escribe para buscar cliente por nombre o teléfono..." 
                value={busquedaCliente} 
                onChange={(e) => setBusquedaCliente(e.target.value)} 
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg py-2.5 pl-9 pr-3 text-xs font-medium focus:outline-none focus:border-[#B94A36]" 
              />
            </div>
            <select
              value={clienteSeleccionado}
              onChange={(e) => setClienteSeleccionado(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-sm font-medium focus:outline-none focus:border-[#B94A36]"
            >
              <option value="">— Sin registrar / Cliente Anónimo (Consulta Rápida) —</option>
              {clientesFiltrados.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombres} {c.apellidos} {c.tipo === 'prospecto' ? '(Prospecto)' : '(Cliente)'}
                </option>
              ))}
            </select>
          </div>
          
          <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
            <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">1. Inmueble Seleccionado</h2>
            <select
              className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-sm font-medium mb-4 focus:outline-none"
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
              <option value="">-- Selecciona una Unidad de la Lista --</option>
              {propiedades && propiedades.map((prop) => (
                <option key={prop.id} value={prop.id}>Unidad {prop.unidad || prop.numero} — {prop.categoria || 'Departamento'} ({prop.tipologia || 'S/T'})</option>
              ))}
            </select>

            {propiedadSeleccionada && (
              <div className={`grid grid-cols-2 ${esLocal ? 'sm:grid-cols-4' : 'sm:grid-cols-5'} gap-2 pt-4 border-t border-neutral-100 text-center text-xs`}>
                <div className="border-r border-neutral-100">
                  <span className="text-[10px] text-neutral-400 uppercase block mb-0.5">Distribución</span>
                  <span className="font-semibold text-neutral-800">{tipologia}</span>
                </div>
                <div className="border-r border-neutral-100">
                  <span className="text-[10px] text-neutral-400 uppercase block mb-0.5">Complementos</span>
                  <span className="font-semibold text-neutral-800 block truncate" title={`${parqueaderoTexto} / ${bodegaAsignada}`}>P: {parqueaderoTexto}</span>
                </div>
                <div className={esLocal ? "" : "border-r border-neutral-100"}>
                  <span className="text-[10px] text-neutral-400 uppercase block mb-0.5">Área Total</span>
                  <span className="font-semibold text-neutral-800">{areaTotal}m²</span>
                </div>
                {!esLocal && (
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase block mb-0.5">Valor m² (Pre Lanz.)</span>
                    <span className="font-bold text-[#B94A36]">${valorM2Lanzamiento.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {!propiedadSeleccionada ? (
            <div className="bg-white rounded-xl border border-dashed border-neutral-300 p-12 text-center text-neutral-400">
              <p className="text-sm font-medium">Por favor, selecciona una unidad en el panel superior.</p>
            </div>
          ) : pestañaActiva === 'previsualizar' ? (
            <div className="bg-neutral-800 p-6 rounded-xl shadow-inner flex justify-center border border-neutral-700 overflow-x-auto">
              <div id="plantilla-pdf-arienzo" className="bg-white w-[210mm] min-h-[297mm] p-10 flex flex-col justify-between text-neutral-900 rounded-sm shadow-2xl scale-95 sm:scale-100 origin-top transform">
                <div>
                  <div className="bg-[#B94A36] px-8 py-5 flex justify-between items-center rounded-t-sm">
                    <div className="flex items-center gap-3">
                      <img 
                        src="/logo-arienzo.png" 
                        alt="Arienzo Boutique Living" 
                        className="h-9 w-auto object-contain max-w-[140px]" 
                      />
                    </div>
                    <div className="text-right text-white">
                      <h3 className="text-[10px] font-semibold tracking-wider uppercase opacity-90">Propuesta de Inversión</h3>
                      <p className="text-[9px] mt-0.5 font-light opacity-75">Emisión: {new Date().toLocaleDateString('es-EC')}</p>
                      <p className="text-[9px] mt-0.5 font-bold text-red-200">Válida hasta: {formatearFechaLegible(fechaCaducidad)}</p>
                    </div>
                  </div>

                  <div className="my-3 border-b border-neutral-100 pb-2 text-left">
                    <span className="text-[8px] uppercase tracking-wider text-neutral-400 block">Inversionista de Propuesta</span>
                    <p className="text-sm font-semibold text-neutral-800">{nombreClienteActivo}</p>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between bg-[#F9F7F5] p-3 rounded-md border border-[#EAE3DC] text-[10px]">
                      <div className="flex-1 text-left border-r border-[#EAE3DC] pr-2">
                        <span className="text-[7px] text-neutral-400 uppercase block mb-0.5">Unidad</span>
                        <span className="font-bold text-neutral-800">Unidad {propiedadSeleccionada?.unidad || propiedadSeleccionada?.numero}</span>
                      </div>
                      <div className="flex-1 text-left border-r border-[#EAE3DC] px-2">
                        <span className="text-[7px] text-neutral-400 uppercase block mb-0.5">Tipología</span>
                        <span className="font-semibold text-neutral-800">{tipologia}</span>
                      </div>
                      <div className="flex-[1.5] text-left border-r border-[#EAE3DC] px-2">
                        <span className="text-[7px] text-neutral-400 uppercase block mb-0.5">Complementos Asignados</span>
                        <span className="font-semibold text-neutral-700 block">P: {parqueaderoTexto}</span>
                        <span className="font-semibold text-neutral-700 block mt-0.5">B: {bodegaAsignada}</span>
                      </div>
                      <div className={`flex-1 text-center ${esLocal ? '' : 'border-r border-[#EAE3DC]'} px-2`}>
                        <span className="text-[7px] text-neutral-400 uppercase block mb-0.5">Área Total</span>
                        <span className="font-semibold text-neutral-800">{areaTotal}m²</span>
                      </div>
                      {!esLocal && (
                        <div className="flex-[1.4] text-right pl-2">
                          <span className="text-[7px] text-neutral-400 uppercase block mb-0.5">Valor m² (Pre Lanzamiento)</span>
                          <span className="font-bold text-[#B94A36] font-mono text-[11px]">${valorM2Lanzamiento.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}/m²</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mb-2">
                    <h4 className="text-[8px] font-bold uppercase tracking-widest text-[#B94A36] mb-1.5">Plan de Financiamiento Específico</h4>
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead>
                        <tr className="border-b border-neutral-200 text-neutral-500 text-[8px] uppercase tracking-wider">
                          <th className="pb-1">Concepto Estructurado</th>
                          <th className="pb-1 text-center">Fecha / Control</th>
                          <th className="pb-1 text-center">Porcentaje</th>
                          <th className="pb-1 text-right">Monto</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 text-neutral-700">
                        <tr>
                          <td className="py-1 text-neutral-600 font-light">Valor {esLocal ? 'del Local Comercial' : 'del Departamento (Pre Lanzamiento)'}</td>
                          <td className="py-1 text-center text-neutral-400">—</td>
                          <td className="py-1 text-center text-neutral-400">—</td>
                          <td className="py-1 text-right font-mono text-neutral-700">${precioDeptoPreLanzamiento.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                        </tr>
                        
                        {!esLocal && (
                          <tr>
                            <td className="py-1 text-neutral-600 font-light"><span className="text-neutral-400 mr-1 font-mono">(+)</span> Valor Parqueo y Bodega (Pre Lanzamiento)</td>
                            <td className="py-1 text-center text-neutral-400">—</td>
                            <td className="py-1 text-center text-neutral-400">—</td>
                            <td className="py-1 text-right font-mono text-neutral-700">${valAnexosPreLanzamiento.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                          </tr>
                        )}
                        
                        {montoDescuentoCalculado > 0 && (
                          <tr className="bg-red-50/40 text-red-900">
                            <td className="py-1 pl-2 italic"><span className="text-red-700 mr-1 font-mono">(-)</span> Descuento Adicional {motivoDescuento && `(${motivoDescuento})`}</td>
                            <td className="py-1 text-center text-red-700">—</td>
                            <td className="py-1 text-center font-medium">
                              {tipoDescuento === 'porcentaje' ? `${valorDescuento}%` : 'Fijo'}
                            </td>
                            <td className="py-1 text-right font-mono font-medium">-${montoDescuentoCalculado.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                          </tr>
                        )}
                        
                        <tr className="font-bold border-t-2 border-neutral-800 text-neutral-950">
                          <td className="py-2"><span className="text-neutral-600 mr-1 font-mono">(=)</span> Valor Total de Venta</td>
                          <td className="py-2 text-center text-neutral-400">—</td>
                          <td className="py-2 text-center text-neutral-400">—</td>
                          <td className="py-2 text-right font-mono text-[12px]">${precioTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                        </tr>
                        
                        <tr>
                          <td className="py-1.5 pl-3 text-neutral-600">↳ Reserva para Bloqueo</td>
                          <td className="py-1.5 text-center text-neutral-700 text-[10px]">
                            {incluirFechas ? formatearFechaLegible(fechaReserva) : 'Inmediato'}
                          </td>
                          <td className="py-1.5 text-center text-neutral-400">—</td>
                          <td className="py-1.5 text-right font-medium font-mono">${reservaValor.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                        </tr>
                        <tr className="bg-[#F9F7F5]">
                          <td className="py-1 pl-3 text-neutral-600">
                            ↳ Abono Inicial Promesa {mesesInicial > 1 ? `(Diferido en ${mesesInicial} meses)` : ''}
                          </td>
                          <td className="py-1 text-center text-neutral-700 text-[10px]">
                            {mesesInicial > 1 
                              ? `${mesesInicial} pagos de $${cuotaInicialMensual.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` 
                              : (incluirFechas ? formatearFechaLegible(fechaFirmaPromesa) : 'Plazo Convenido')}
                          </td>
                          <td className="py-1 text-center text-neutral-400">{Number(pctFirmaReal.toFixed(1))}%</td>
                          <td className="py-1 text-right font-medium font-mono">${saldoFirmaPromesa > 0 ? saldoFirmaPromesa.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'}</td>
                        </tr>
                        <tr>
                          <td className="py-1 pl-3 font-medium text-neutral-800">↳ Monto Diferido Construcción</td>
                          <td className="py-1 text-center text-neutral-500 text-[10px]">Diferido mensual</td>
                          <td className="py-1 text-center text-neutral-400">{Number(pctEntradaReal.toFixed(1))}%</td>
                          <td className="py-1 text-right font-medium font-mono">${entradaDiferirTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                        </tr>
                        <tr className="bg-[#F9F7F5]">
                          <td className="py-1.5 pl-3 font-bold text-[#B94A36]">↳ Saldo Final Contra Entrega</td>
                          <td className="py-1.5 text-center text-neutral-500 text-[10px]">A la entrega física</td>
                          <td className="py-1.5 text-center text-[#B94A36]">{Number(pctContraEntregaReal.toFixed(1))}%</td>
                          <td className="py-1.5 text-right font-bold text-[#B94A36] font-mono">${contraEntrega.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  {!esLocal && (
                    <p className="text-[7px] text-neutral-400 italic mb-4 text-center">* Nota: El Valor Total de Venta detallado ya considera un beneficio especial del 5% de descuento por etapa de pre-lanzamiento respecto al precio de lista estándar.</p>
                  )}

                  {/* Cronograma Mensual */}
                  {entradaDiferirTotal > 0 && (
                    <div className="mb-4">
                      <h4 className="text-[8px] font-bold uppercase tracking-widest text-[#B94A36] mb-1.5">Cronograma de Pagos ({mesesConstruccion} Dividendos)</h4>
                      <div className="grid grid-cols-2 gap-x-4 border border-[#EAE3DC] p-2.5 rounded-md bg-[#F9F7F5] items-start text-[9px]">
                        <div className="space-y-0.5">
                          {cuotasDivididas.columnaIzquierda.map((cuota) => (
                            <div key={cuota.numeroCuota} className="flex justify-between border-b border-neutral-200/60 py-0.5">
                              <span className="text-neutral-500">C{cuota.numeroCuota} | {cuota.fechaPago}</span>
                              <span className="font-semibold text-neutral-800 font-mono">${cuota.valor.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-0.5">
                          {cuotasDivididas.columnaDerecha.map((cuota) => (
                            <div key={cuota.numeroCuota} className="flex justify-between border-b border-neutral-200/60 py-0.5">
                              <span className="text-neutral-500">C{cuota.numeroCuota} | {cuota.fechaPago}</span>
                              <span className="font-semibold text-neutral-800 font-mono">${cuota.valor.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mb-4 bg-[#F9F7F5] border border-[#EAE3DC] rounded-md p-3">
                    <h4 className="text-[8px] font-bold uppercase tracking-widest text-[#B94A36] mb-1.5">Valores Agregados a la Unidad</h4>
                    <ul className="text-[9px] text-neutral-700 space-y-1 pl-3 list-disc marker:text-[#DEB886]">
                      {esLocal ? (
                        <li><span className="font-semibold text-neutral-800">Complemento Inmobiliario:</span> La unidad incluye {cantidadParqueos} parqueo{cantidadParqueos !== 1 ? 's' : ''}.</li>
                      ) : (
                        <li><span className="font-semibold text-neutral-800">Complementos Inmobiliarios:</span> El Valor Total de Venta ya contempla la asignación de los parqueos y la bodega detallados en la ficha técnica.</li>
                      )}
                      
                      {!esLocal && incluirClima && (
                        <li><span className="font-semibold text-neutral-800">Climatización Estética:</span> Sistema de aire acondicionado integral empotrado en el tumbado para todos los ambientes del departamento.</li>
                      )}

                      {!esLocal && incluirBbq && (
                        <li><span className="font-semibold text-neutral-800">Área de BBQ en Terraza:</span> Adecuación de espacio exterior con mesón y recubrimientos listos para su uso (no incluye parrilla ni equipos).</li>
                      )}

                      {!esLocal && (
                        <li><span className="font-semibold text-neutral-800">Equipamiento:</span> La unidad incluye calentador de agua.</li>
                      )}
                    </ul>
                  </div>

                </div>

                <div className="mt-2">
                  <div className="grid grid-cols-2 gap-8 text-center text-[9px]">
                    <div className="border-t border-neutral-300 pt-1.5">
                      <p className="font-bold text-[#B94A36] uppercase tracking-wider">Arienzo Boutique Living</p>
                      <p className="text-neutral-400 mt-0.5">Emitido por: {nombreAsesor || 'Konkeri'}</p>
                    </div>
                    <div className="border-t border-neutral-300 pt-1.5">
                      <p className="font-bold text-neutral-800 uppercase tracking-wider">Aceptación de Propuesta</p>
                      <p className="text-neutral-400 mt-0.5">Firma del Inversionista</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {!esLocal && propiedadSeleccionada && (
                <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm space-y-4">
                  <h2 className="text-xs font-semibold text-[#B94A36] uppercase tracking-wider">Presentación de Extras (PDF)</h2>
                  
                  <div className="flex items-center justify-between bg-neutral-50 border border-neutral-200 p-3 rounded-lg transition-colors hover:border-[#B94A36]/30">
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        checked={incluirClima} 
                        onChange={(e) => setIncluirClima(e.target.checked)} 
                        className="w-4 h-4 text-[#B94A36] border-gray-300 rounded focus:ring-[#B94A36] cursor-pointer" 
                      />
                      <div className="cursor-pointer select-none" onClick={() => setIncluirClima(!incluirClima)}>
                        <p className="text-xs font-bold text-neutral-800">Mostrar Climatización Estética en el PDF</p>
                        <p className="text-[10px] text-neutral-500">Agrega el texto descriptivo del aire acondicionado en los Valores Agregados.</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-neutral-50 border border-neutral-200 p-3 rounded-lg transition-colors hover:border-[#B94A36]/30">
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        checked={incluirBbq} 
                        onChange={(e) => setIncluirBbq(e.target.checked)} 
                        className="w-4 h-4 text-[#B94A36] border-gray-300 rounded focus:ring-[#B94A36] cursor-pointer" 
                      />
                      <div className="cursor-pointer select-none" onClick={() => setIncluirBbq(!incluirBbq)}>
                        <p className="text-xs font-bold text-neutral-800">Mostrar Área de BBQ en el PDF</p>
                        <p className="text-[10px] text-neutral-500">Agrega el texto sobre el mesón en la terraza (sin incluir equipos).</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h2 className="text-xs font-semibold text-[#B94A36] uppercase tracking-wider">Descuento Adicional (Opcional)</h2>
                  <div className="flex bg-neutral-100 p-0.5 rounded-md text-[11px] font-medium">
                    <button type="button" onClick={() => { setTipoDescuento('porcentaje'); setValorDescuento(0); }} className={`px-2 py-1 rounded ${tipoDescuento === 'porcentaje' ? 'bg-white text-neutral-900 shadow-xs font-bold' : 'text-neutral-500'}`}>
                      Porcentaje (%)
                    </button>
                    <button type="button" onClick={() => { setTipoDescuento('valor'); setValorDescuento(0); }} className={`px-2 py-1 rounded ${tipoDescuento === 'valor' ? 'bg-white text-neutral-900 shadow-xs font-bold' : 'text-neutral-500'}`}>
                      Valor (USD)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-medium text-neutral-500 uppercase mb-1">
                      {tipoDescuento === 'porcentaje' ? 'Porcentaje %' : 'Valor Descuento ($)'}
                    </label>
                    <input type="number" min="0" value={valorDescuento || ''} onChange={(e) => setValorDescuento(Math.max(0, Number(e.target.value)))} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 text-sm font-mono font-bold outline-none focus:border-[#B94A36]" placeholder="0" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-neutral-500 uppercase mb-1">Motivo (Ej. Pago Contado)</label>
                    <input type="text" value={motivoDescuento} onChange={(e) => setMotivoDescuento(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 text-sm outline-none focus:border-[#B94A36]" placeholder="Descuento extra por pronto pago..." />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
                <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Modalidad del Plan Temporal</h2>
                <div className="grid grid-cols-2 gap-3 bg-neutral-100 p-1 rounded-lg">
                  <button type="button" onClick={() => setIncluirFechas(true)} className={`py-2.5 text-xs font-semibold rounded-md transition-all ${incluirFechas ? 'bg-[#B94A36] text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900'}`}>
                    📅 Incluir Fechas de Hitos
                  </button>
                  <button type="button" onClick={() => setIncluirFechas(false)} className={`py-2.5 text-xs font-semibold rounded-md transition-all ${!incluirFechas ? 'bg-[#B94A36] text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900'}`}>
                    🚫 Cotizar Sin Fechas (Solo Valores)
                  </button>
                </div>
              </div>

              {incluirFechas && (
                <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm space-y-6">
                  <div>
                    <h2 className="text-xs font-semibold text-[#B94A36] uppercase tracking-wider mb-3">Fechas de Hitos Iniciales</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-neutral-500 uppercase mb-1">Fecha Cuota de Reserva</label>
                        <input type="date" value={fechaReserva} onChange={(e) => setFechaReserva(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 text-sm font-semibold outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-500 uppercase mb-1">Fecha Firma Promesa</label>
                        <input type="date" value={fechaFirmaPromesa} onChange={(e) => setFechaFirmaPromesa(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 text-sm font-semibold outline-none" />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-neutral-100 pt-4">
                    <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Plazos del Financiamiento de Obra</h2>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-neutral-500 uppercase mb-1">Día Fijo Cuotas</label>
                        <input type="number" min="1" max="31" value={diaPago} onChange={(e) => setDiaPago(Number(e.target.value))} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 text-sm font-semibold outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-500 uppercase mb-1">Mes de Inicio</label>
                        <select value={mesInicio} onChange={(e) => setMesInicio(Number(e.target.value))} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 text-sm font-semibold outline-none">
                          {['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'].map((m, idx) => (
                            <option key={idx} value={idx + 1}>{m}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-500 uppercase mb-1">Año</label>
                        <input type="number" value={anioInicio} onChange={(e) => setAnioInicio(Number(e.target.value))} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 text-sm font-semibold outline-none" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm space-y-4">
                <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Control de Valores del Plan</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-neutral-500 uppercase mt-1 mb-1">Reserva (USD)</label>
                    <input type="number" min="0" value={reservaValor || ''} onChange={(e) => setReservaValor(Number(e.target.value))} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 text-sm font-semibold outline-none mt-1 focus:border-[#B94A36]" />
                  </div>

                  <div className="space-y-2 border border-neutral-100 p-2.5 rounded-lg bg-white shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-bold text-[#B94A36] uppercase">Abono Inicial</label>
                      <div className="flex bg-neutral-100 p-0.5 rounded text-[10px] font-medium">
                        <button type="button" onClick={() => setTipoInicial('porcentaje')} className={`px-1.5 py-0.5 rounded ${tipoInicial === 'porcentaje' ? 'bg-white shadow-sm font-bold' : 'text-neutral-500'}`}>%</button>
                        <button type="button" onClick={() => setTipoInicial('valor')} className={`px-1.5 py-0.5 rounded ${tipoInicial === 'valor' ? 'bg-white shadow-sm font-bold' : 'text-neutral-500'}`}>$</button>
                      </div>
                    </div>
                    <input type="number" min="0" value={valorInicial || ''} onChange={(e) => setValorInicial(Number(e.target.value))} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2 text-sm font-semibold outline-none focus:border-[#B94A36]" />
                    
                    <div className="flex justify-between items-center pt-2 mt-2 border-t border-neutral-100">
                      <label className="text-[10px] font-medium text-neutral-500 uppercase">Diferir en (Meses):</label>
                      <input type="number" min="1" max="12" value={mesesInicial} onChange={(e) => setMesesInicial(Math.max(1, Number(e.target.value)))} className="w-16 bg-neutral-50 border border-neutral-200 rounded-lg p-1.5 text-xs font-semibold outline-none text-center focus:border-[#B94A36]" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-medium text-neutral-500 uppercase">Cuotas Obra</label>
                      <div className="flex bg-neutral-100 p-0.5 rounded text-[10px] font-medium">
                        <button type="button" onClick={() => setTipoEntrada('porcentaje')} className={`px-1.5 py-0.5 rounded ${tipoEntrada === 'porcentaje' ? 'bg-white shadow-sm font-bold' : 'text-neutral-500'}`}>%</button>
                        <button type="button" onClick={() => setTipoEntrada('valor')} className={`px-1.5 py-0.5 rounded ${tipoEntrada === 'valor' ? 'bg-white shadow-sm font-bold' : 'text-neutral-500'}`}>$</button>
                      </div>
                    </div>
                    <input type="number" min="0" value={valorEntrada || ''} onChange={(e) => setValorEntrada(Number(e.target.value))} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 text-sm font-semibold outline-none focus:border-[#B94A36]" />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-neutral-500 uppercase mt-1 mb-1">Meses Plazo Obra</label>
                    <input type="number" min="1" max="48" value={mesesConstruccion} onChange={(e) => setMesesConstruccion(Math.min(48, Number(e.target.value)))} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 text-sm font-semibold outline-none mt-1 focus:border-[#B94A36]" />
                  </div>
                  
                </div>
              </div>

              {/* VISTA Y AJUSTE DE CUOTAS CON LLENADO RÁPIDO */}
              {entradaDiferirTotal > 0 && (
                <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-4 border-b border-neutral-100 pb-3">
                    <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Vista y Ajuste de Cuotas de Obra</h2>
                    <div className="flex gap-2">
                      <button onClick={reiniciarCuotas} className="text-[10px] text-neutral-500 hover:text-neutral-800 font-bold uppercase tracking-wider">
                        ↻ Reiniciar
                      </button>
                      <button onClick={() => setMostrarCalculadoraRefuerzos(!mostrarCalculadoraRefuerzos)} className="text-[10px] bg-[#B94A36]/10 text-[#B94A36] px-2 py-1 rounded hover:bg-[#B94A36]/20 font-bold uppercase tracking-wider transition-colors">
                        ⚡ Llenado Rápido
                      </button>
                    </div>
                  </div>

                  {mostrarCalculadoraRefuerzos && (
                    <div className="mb-4 p-3 bg-orange-50 border border-orange-100 rounded-lg flex flex-col gap-3 animate-in fade-in">
                       <p className="text-[10px] text-orange-800 font-medium">Configura una cuota base fija. El saldo sobrante se dividirá y sumará automáticamente a tus meses de refuerzo (ej. mes de utilidades o bonos).</p>
                       <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
                          <div className="flex-1">
                            <label className="text-[9px] font-bold text-orange-700 uppercase mb-1 block">Cuota Fija Base ($)</label>
                            <input type="number" value={cuotaBaseRapida} onChange={e => setCuotaBaseRapida(e.target.value)} placeholder="Ej: 1500" className="w-full bg-white border border-orange-200 p-2 text-xs font-mono rounded outline-none focus:border-orange-400"/>
                          </div>
                          <div className="flex-1">
                            <label className="text-[9px] font-bold text-orange-700 uppercase mb-1 block">Meses de Refuerzo</label>
                            <input type="text" value={mesesRefuerzoRapido} onChange={e => setMesesRefuerzoRapido(e.target.value)} placeholder="Ej: 12, 24" className="w-full bg-white border border-orange-200 p-2 text-xs font-mono rounded outline-none focus:border-orange-400"/>
                          </div>
                          <button onClick={aplicarPlanRefuerzos} className="bg-orange-600 text-white px-4 py-2 rounded text-xs font-bold hover:bg-orange-700 uppercase tracking-wider w-full sm:w-auto transition-colors">
                            Aplicar
                          </button>
                       </div>
                    </div>
                  )}

                  <div className="max-h-80 overflow-y-auto border border-neutral-100 rounded-lg divide-y divide-neutral-100">
                    {cronogramaCuotas.map((cuota) => (
                      <div key={cuota.numeroCuota} className={`flex justify-between items-center p-3 ${cuota.esEditable ? 'bg-[#B94A36] text-white' : 'bg-white'}`}>
                        <span className="text-xs font-medium">Cuota {cuota.numeroCuota} — {cuota.fechaPago}</span>
                        <div className="flex items-center border-b py-0.5 border-neutral-200">
                          <span className="text-xs opacity-50 mr-1">$</span>
                          <input type="number" step="0.01" value={cuota.valor === 0 ? '' : Number(cuota.valor.toFixed(2))} onChange={(e) => actualizarValorCuota(cuota.numeroCuota, Number(e.target.value))} className="w-24 bg-transparent text-right text-xs font-semibold outline-none font-mono" />
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
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm sticky top-6 space-y-6">
            <div>
              <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Resumen Financiero</h2>
              {montoDescuentoCalculado > 0 && (
                <div className="text-xs text-neutral-400 line-through font-mono mb-0.5">
                  Lista Base: ${precioListaOriginal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </div>
              )}
              <div className="text-3xl font-light tracking-tight text-neutral-900 font-mono">
                ${precioTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </div>
              <p className="text-xs text-neutral-400 mt-1">Valor Total de Venta de la Unidad</p>
            </div>

            <div className="space-y-3 pt-4 border-t border-neutral-100 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-500">Cuota Inicial Total ({Number(pctInicialReal.toFixed(1))}%):</span>
                <span className="font-semibold text-neutral-900 font-mono">${cuotaInicialTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between pl-3 text-xs text-neutral-500 border-l-2 border-neutral-200">
                <span>Reserva Inmediata:</span>
                <span className="font-mono">${reservaValor.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between pl-3 text-xs text-neutral-500 border-l-2 border-neutral-200">
                <span>Saldo Firma Promesa:</span>
                <span className="font-medium text-neutral-800 font-mono">
                  ${saldoFirmaPromesa > 0 ? saldoFirmaPromesa.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'}
                </span>
              </div>
              {mesesInicial > 1 && saldoFirmaPromesa > 0 && (
                <div className="flex justify-between pl-6 pr-1 py-1 text-[10px] text-[#B94A36] bg-[#B94A36]/5 rounded">
                  <span>↳ Dividido en {mesesInicial} pagos de:</span>
                  <span className="font-mono font-bold">${cuotaInicialMensual.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} c/u</span>
                </div>
              )}
              <div className="flex justify-between border-t border-dashed border-neutral-100 pt-2">
                <span className="text-neutral-500">Monto Financiamiento Obra ({Number(pctEntradaReal.toFixed(1))}%):</span>
                <span className="font-semibold text-neutral-900 font-mono">${entradaDiferirTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
              
              {entradaDiferirTotal > 0 && (
                <div className="flex justify-between text-xs text-neutral-400 lifted pl-3">
                  <span>{mesesConstruccion} cuotas promedio de:</span>
                  <span className="font-mono">
                    ${cronogramaCuotas.length > 0 ? (entradaDiferirTotal / mesesConstruccion).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between border-t border-neutral-100 pt-3 text-base">
                <span className="font-medium text-[#B94A36]">Contra Entrega ({Number(pctContraEntregaReal.toFixed(1))}%):</span>
                <span className="font-bold text-[#B94A36] font-mono">${contraEntrega.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
            </div>

            {propiedadSeleccionada && (
              <div className="space-y-3 pt-4 border-t border-neutral-100">
                <button
                  onClick={descargarPdfComercial}
                  disabled={generandoPdf}
                  className="w-full bg-[#B94A36] text-white rounded-lg p-3 text-xs font-semibold uppercase tracking-wider hover:bg-[#9B3B2B] transition disabled:opacity-50"
                >
                  {generandoPdf ? 'Generando Documento...' : '📥 Descargar PDF Comercial'}
                </button>
                <button
                  onClick={guardarCotizacionEnSistema}
                  disabled={guardando}
                  className="w-full bg-neutral-900 text-white rounded-lg p-3 text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 transition disabled:opacity-50"
                >
                  {guardando ? 'Guardando Registro...' : '💾 Guardar Cotización'}
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}