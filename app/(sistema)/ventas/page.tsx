// Actualizacion para Vercel - Gestor de Operaciones v4 (Correccion Observaciones)
'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

interface CuotaMes {
  id: string;
  tipo: 'inicial' | 'construccion';
  numeroCuota: number | string;
  fechaPago: string;
  valor: number;
  esEditable: boolean;
}

interface NotaObservacion {
  id: string;
  titulo: string;
  descripcion: string;
}

export default function GestorOperacionesPage() {
  const [activeTab, setActiveTab] = useState<'reserva' | 'informe_negocio' | 'expediente'>('reserva');
  const [propiedades, setPropiedades] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  
  // ================= ESTADOS: PESTAÑA 1 (RESERVA) =================
  const [reservaExitosa, setReservaExitosa] = useState(false);
  const [codigoReserva, setCodigoReserva] = useState('');
  const [reservaForm, setReservaForm] = useState({
    clienteId: '', propiedadId: '', montoReserva: 2500, formaPago: 'Transferencia Bancaria', bancoOrigen: '', numeroComprobante: '', fechaPago: new Date().toISOString().split('T')[0],
  });

  // ================= ESTADOS: PESTAÑA 2 (INFORME NEGOCIO) =================
  const [pestañaInforme, setPestañaInforme] = useState<'configurar' | 'previsualizar'>('configurar');
  const [informeForm, setInformeForm] = useState({ clienteId: '', propiedadId: '' });
  const [formaFinanciamiento, setFormaFinanciamiento] = useState('Crédito Directo');
  
  // AQUI ESTABA EL ERROR: Faltaba declarar esta variable
  const [observacionesNegocio, setObservacionesNegocio] = useState('');
  
  // Sistema de Notas Dinámicas
  const [notas, setNotas] = useState<NotaObservacion[]>([]);
  
  const [tipoDescuento, setTipoDescuento] = useState<'porcentaje' | 'valor'>('porcentaje');
  const [valorDescuento, setValorDescuento] = useState<number>(0);
  const hoyStr = new Date().toISOString().split('T')[0];
  const [codigoInforme, setCodigoInforme] = useState(`INF-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`);
  
  const [infReservaValor, setInfReservaValor] = useState<number>(2500);
  const [tipoInicial, setTipoInicial] = useState<'porcentaje' | 'valor'>('porcentaje');
  const [valorInicial, setValorInicial] = useState<number>(15); 
  const [mesesInicial, setMesesInicial] = useState<number>(1); 
  
  const [fechaReservaInf, setFechaReservaInf] = useState(hoyStr);
  const [fechaFirmaPromesa, setFechaFirmaPromesa] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  
  const [tipoEntrada, setTipoEntrada] = useState<'porcentaje' | 'valor'>('porcentaje');
  const [valorEntrada, setValorEntrada] = useState<number>(25); 
  const [mesesConstruccion, setMesesConstruccion] = useState(24);
  const [diaPago, setDiaPago] = useState(5);
  const [mesInicio, setMesInicio] = useState(new Date().getMonth() + 1); 
  const [anioInicio, setAnioInicio] = useState(new Date().getFullYear());
  
  const [cronogramaCuotas, setCronogramaCuotas] = useState<CuotaMes[]>([]);
  const [mostrarCalculadoraRefuerzos, setMostrarCalculadoraRefuerzos] = useState(false);
  const [cuotaBaseRapida, setCuotaBaseRapida] = useState<number | ''>('');
  const [mesesRefuerzoRapido, setMesesRefuerzoRapido] = useState<string>('');

  // ================= ESTADOS: PESTAÑA 3 (EXPEDIENTE KYC) =================
  const [cierreForm, setCierreForm] = useState({ clienteId: '', propiedadId: '' });

  // DATOS GENERALES
  const [nombreAsesor, setNombreAsesor] = useState<string>('Saúl Intriago / Debbi Mera');

  const datosRespaldoClientes = [
    { id: 'cli-1', nombres: 'ANA MARIA', apellidos: 'CEVALLOS TRUJILLO', cedula: '1304681393', estado_civil: 'CASADA', email: 'mariacevallos@hotmail.com', direccion_domicilio: 'VIA SAN MATEO, MZ B15', telefono: '0991234567', tipo: 'cliente' },
    { id: 'cli-2', nombres: 'CARLOS ANDRES', apellidos: 'MENDOZA LOPEZ', cedula: '1312345678', estado_civil: 'SOLTERO', email: 'carlosm@ejemplo.com', direccion_domicilio: 'BARRIO UMIÑA, MANTA', telefono: '0987654321', tipo: 'cliente' }
  ];
  const datosRespaldoPropiedades = [
    { id: 'prop-302', unidad: '302', precio_lista: 231044, area_total: 96.48, tipologia: '2 Dormitorios', estado: 'Disponible' },
    { id: 'prop-405', unidad: '405', precio_lista: 250000, area_total: 105.00, tipologia: '3 Dormitorios', estado: 'Reservado' }
  ];

  useEffect(() => {
    async function inicializarEcosistema() {
      try {
        const { data: props } = await supabase.from('propiedades').select('*').order('unidad', { ascending: true });
        const { data: clis } = await supabase.from('clientes').select('*').eq('tipo', 'cliente').order('nombres', { ascending: true });
        setPropiedades(props && props.length > 0 ? props : datosRespaldoPropiedades);
        setClientes(clis && clis.length > 0 ? clis : datosRespaldoClientes);
      } catch (error) {
        setPropiedades(datosRespaldoPropiedades);
        setClientes(datosRespaldoClientes);
      } finally {
        setCargando(false);
      }
    }
    inicializarEcosistema();
  }, []);

  const formatearFechaLegible = (fechaIso: string) => {
    if (!fechaIso) return '---';
    const partes = fechaIso.split('-');
    if(partes.length !== 3) return fechaIso; 
    const mesesNombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const mesIndex = parseInt(partes[1], 10) - 1;
    if(isNaN(mesIndex)) return fechaIso;
    return `${partes[2]}-${mesesNombres[mesIndex].substring(0,3).toUpperCase()}-${partes[0]}`;
  };

  // ================= LÓGICA PESTAÑA 1 (RESERVA) =================
  useEffect(() => { setReservaExitosa(false); }, [reservaForm.propiedadId]);
  const clienteActivoReserva = clientes.find(c => c.id === reservaForm.clienteId);
  const propiedadActivaReserva = propiedades.find(p => p.id.toString() === reservaForm.propiedadId.toString());

  const procesarReserva = async () => {
    if (!reservaForm.clienteId || !reservaForm.propiedadId || !reservaForm.montoReserva) {
      alert("Completar Cliente, Unidad y Monto."); return;
    }
    setGuardando(true);
    try {
      const codigoGenerado = `RES-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
      setCodigoReserva(codigoGenerado);
      setPropiedades(prev => prev.map(p => p.id.toString() === reservaForm.propiedadId.toString() ? { ...p, estado: 'Reservado' } : p));
      setReservaExitosa(true);
      alert("Unidad bloqueada.");
    } catch (err: any) { alert(`Error: ${err.message}`); } finally { setGuardando(false); }
  };

  // ================= LÓGICA PESTAÑA 2 (INFORME NEGOCIO) =================
  const agregarNota = () => setNotas([...notas, { id: Date.now().toString(), titulo: '', descripcion: '' }]);
  const actualizarNota = (id: string, campo: 'titulo' | 'descripcion', valor: string) => {
    setNotas(notas.map(n => n.id === id ? { ...n, [campo]: valor } : n));
  };
  const eliminarNota = (id: string) => setNotas(notas.filter(n => n.id !== id));

  const clienteActivoInforme = clientes.find(c => c.id === informeForm.clienteId);
  const propiedadActivaInforme = propiedades.find(p => p.id.toString() === informeForm.propiedadId.toString());

  const calcInforme = useMemo(() => {
    const listaOriginal = propiedadActivaInforme ? Number(propiedadActivaInforme.precio || propiedadActivaInforme.precio_lista) : 0;
    let descuentoMonto = tipoDescuento === 'porcentaje' ? listaOriginal * (valorDescuento / 100) : valorDescuento;
    const precioFin = Math.max(0, listaOriginal - descuentoMonto);
    
    let inicialDeseado = tipoInicial === 'porcentaje' ? precioFin * (valorInicial / 100) : valorInicial;
    let entradaDeseada = tipoEntrada === 'porcentaje' ? precioFin * (valorEntrada / 100) : valorEntrada;

    let saldoPromesa = inicialDeseado - infReservaValor;
    let entradaDiferir = entradaDeseada;

    if (saldoPromesa < 0) {
      saldoPromesa = 0; 
      entradaDiferir = Math.max(0, entradaDiferir - Math.abs(inicialDeseado - infReservaValor)); 
    }
    let entrega = Math.max(0, precioFin - infReservaValor - saldoPromesa - entradaDiferir);
    
    return {
      precioListaOriginal: listaOriginal,
      montoDescuentoCalculado: descuentoMonto,
      precioTotal: precioFin,
      cuotaInicialTotal: infReservaValor + saldoPromesa,
      saldoFirmaPromesa: saldoPromesa,
      entradaDiferirTotal: entradaDiferir,
      contraEntrega: entrega
    };
  }, [propiedadActivaInforme, tipoInicial, valorInicial, tipoEntrada, valorEntrada, tipoDescuento, valorDescuento, infReservaValor]);

  useEffect(() => {
    if (!propiedadActivaInforme || (calcInforme.entradaDiferirTotal <= 0 && calcInforme.saldoFirmaPromesa <= 0) ) {
      setCronogramaCuotas([]); return;
    }
    
    let cuotasGeneradas: CuotaMes[] = [];

    // 1. Generar Cuotas Iniciales (Firma de Promesa dividida)
    if (calcInforme.saldoFirmaPromesa > 0 && mesesInicial > 0) {
      const valorAbono = calcInforme.saldoFirmaPromesa / mesesInicial;
      for (let i = 0; i < mesesInicial; i++) {
        const d = new Date(fechaFirmaPromesa + "T12:00:00");
        d.setMonth(d.getMonth() + i);
        const dateStr = d.toISOString().split('T')[0];
        cuotasGeneradas.push({
          id: `ini-${i}`,
          tipo: 'inicial',
          numeroCuota: i + 1,
          fechaPago: dateStr, 
          valor: valorAbono,
          esEditable: false
        });
      }
    }

    // 2. Generar Cuotas de Construcción
    if (mesesConstruccion > 0 && calcInforme.entradaDiferirTotal > 0) {
      const valorBaseCuota = calcInforme.entradaDiferirTotal / mesesConstruccion;
      for (let i = 0; i < mesesConstruccion; i++) {
        const mesRelativo = (mesInicio - 1) + i;
        const fechaCuota = new Date(anioInicio, mesRelativo, diaPago);
        const dateStr = fechaCuota.toISOString().split('T')[0];
        cuotasGeneradas.push({
          id: `cons-${i}`,
          tipo: 'construccion',
          numeroCuota: i + 1,
          fechaPago: dateStr,
          valor: valorBaseCuota,
          esEditable: false
        });
      }
    }

    setCronogramaCuotas(cuotasGeneradas);
  }, [propiedadActivaInforme, mesesConstruccion, calcInforme.entradaDiferirTotal, calcInforme.saldoFirmaPromesa, diaPago, mesInicio, anioInicio, mesesInicial, fechaFirmaPromesa]);

  const actualizarAtributoCuota = (id: string, campo: 'valor' | 'fechaPago', nuevoValor: any) => {
    let nuevoCrono = [...cronogramaCuotas];
    const index = nuevoCrono.findIndex(c => c.id === id);
    if(index === -1) return;

    if (campo === 'fechaPago') {
       nuevoCrono[index].fechaPago = nuevoValor;
    } else if (campo === 'valor') {
       nuevoCrono[index].valor = nuevoValor;
       nuevoCrono[index].esEditable = true;

       if (nuevoCrono[index].tipo === 'construccion') {
         const construccionCrono = nuevoCrono.filter(c => c.tipo === 'construccion');
         const saldoRestante = calcInforme.entradaDiferirTotal - construccionCrono.filter(c => c.esEditable).reduce((acc, curr) => acc + curr.valor, 0);
         const automaticos = construccionCrono.filter(c => !c.esEditable);
         if (automaticos.length > 0) {
           const valorRepartido = Math.max(0, saldoRestante / automaticos.length);
           nuevoCrono = nuevoCrono.map(c => (c.tipo === 'construccion' && !c.esEditable) ? { ...c, valor: valorRepartido } : c);
         }
       }
       else if (nuevoCrono[index].tipo === 'inicial') {
         const inicialCrono = nuevoCrono.filter(c => c.tipo === 'inicial');
         const saldoRestante = calcInforme.saldoFirmaPromesa - inicialCrono.filter(c => c.esEditable).reduce((acc, curr) => acc + curr.valor, 0);
         const automaticos = inicialCrono.filter(c => !c.esEditable);
         if (automaticos.length > 0) {
           const valorRepartido = Math.max(0, saldoRestante / automaticos.length);
           nuevoCrono = nuevoCrono.map(c => (c.tipo === 'inicial' && !c.esEditable) ? { ...c, valor: valorRepartido } : c);
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
    const saldoRef = calcInforme.entradaDiferirTotal - (base * (mesesConstruccion - mesesExtra.length));
    const valRef = saldoRef / mesesExtra.length;
    setCronogramaCuotas(cronogramaCuotas.map(c => {
      if(c.tipo === 'construccion') {
         return { ...c, valor: mesesExtra.includes(Number(c.numeroCuota)) ? valRef : base, esEditable: true };
      }
      return c;
    }));
    setMostrarCalculadoraRefuerzos(false); 
  };

  // ================= IMPRESIÓN =================
  const imprimirDocumento = (idElemento: string, tituloVentana: string) => {
    if (typeof window === 'undefined') return;
    const contenido = document.getElementById(idElemento)?.innerHTML;
    if (!contenido) return;
    const ventana = window.open('', '_blank');
    if (!ventana) return;
    ventana.document.write(`
      <html>
        <head>
          <title>${tituloVentana}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @page { size: A4 portrait; margin: 0mm; }
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; margin: 0; background: #ffffff; font-family: ui-sans-serif, system-ui; }
            .pagina-a4 { width: 210mm; height: 297mm; padding: 10mm 15mm; box-sizing: border-box; page-break-after: always; overflow: hidden; position: relative; }
            .cuadro-input { border-bottom: 1px solid #8C8A87; min-height: 14px; display: inline-block; width: 100%; }
            .checkbox-box { width: 10px; height: 10px; border: 1px solid #8C8A87; display: inline-block; margin-right: 4px; vertical-align: middle; }
            .seccion-titulo { background-color: #F2EFEB; color: #B94A36; font-weight: bold; text-transform: uppercase; font-size: 8px; padding: 4px 8px; border-left: 3px solid #B94A36; margin-bottom: 6px; margin-top: 8px; letter-spacing: 0.05em; }
            .text-xxs { font-size: 7px; line-height: 1.2; }
          </style>
        </head>
        <body>${contenido}<script>setTimeout(() => { window.print(); window.close(); }, 700);</script></body>
      </html>
    `);
    ventana.document.close();
  };

  if (cargando) return <div className="flex min-h-screen items-center justify-center bg-[#dce3eb]"><p className="text-sm font-bold tracking-widest text-[#ea0029] uppercase animate-pulse">Sincronizando Sistema...</p></div>;

  return (
    <div className="min-h-screen bg-[#dce3eb] p-4 md:p-8 font-sans text-[#415364]">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* CABECERA GESTOR */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#415364]/10 pb-6 gap-4">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-[#ea0029] uppercase block">Gestor Comercial Inmobiliario</span>
            <h1 className="text-3xl font-bold tracking-tight text-[#415364] mt-1">Gestión de Operaciones</h1>
          </div>

          <div className="flex bg-[#dce3eb]/50 p-1.5 rounded-xl w-full md:w-auto overflow-x-auto border border-[#415364]/10 shadow-inner gap-1">
            <button onClick={() => setActiveTab('reserva')} className={`px-5 py-2.5 text-xs font-bold tracking-wider uppercase rounded-lg transition-all whitespace-nowrap ${activeTab === 'reserva' ? 'bg-white text-[#ea0029] shadow-sm' : 'text-[#415364]/70 hover:text-[#415364]'}`}>
              1. Bloqueo y Reserva
            </button>
            <button onClick={() => setActiveTab('informe_negocio')} className={`px-5 py-2.5 text-xs font-bold tracking-wider uppercase rounded-lg transition-all whitespace-nowrap ${activeTab === 'informe_negocio' ? 'bg-white text-[#ea0029] shadow-sm' : 'text-[#415364]/70 hover:text-[#415364]'}`}>
              2. Informe Negocio
            </button>
            <button onClick={() => setActiveTab('expediente')} className={`px-5 py-2.5 text-xs font-bold tracking-wider uppercase rounded-lg transition-all whitespace-nowrap ${activeTab === 'expediente' ? 'bg-white text-[#ea0029] shadow-sm' : 'text-[#415364]/70 hover:text-[#415364]'}`}>
              3. Doc. Expediente
            </button>
          </div>
        </div>

        {/* =======================================================
            TAB 1: RESERVA
           ======================================================= */}
        {activeTab === 'reserva' && (
          <div className="bg-white border border-neutral-200/60 rounded-2xl p-6 md:p-8 shadow-sm max-w-4xl mx-auto animate-in fade-in">
            <div className="mb-6 border-b border-neutral-100 pb-4">
              <h3 className="text-sm font-bold text-[#415364] uppercase tracking-wider">Ingreso de Fondos y Bloqueo</h3>
              <p className="text-xs text-[#415364]/60 mt-1">Registre el abono para apartar la unidad comercialmente.</p>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#dce3eb]/30 p-5 rounded-xl border border-[#415364]/10">
                <div>
                  <label className="text-[10px] font-bold text-[#415364]/60 uppercase block mb-1.5">Cliente Titular</label>
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
                  <input type="text" placeholder="Ej. Pichincha" value={reservaForm.bancoOrigen} onChange={(e) => setReservaForm({...reservaForm, bancoOrigen: e.target.value})} className="w-full text-xs bg-white border border-[#415364]/20 p-3 rounded-xl outline-none font-medium text-[#415364] focus:border-[#ea0029]" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#415364]/60 uppercase block mb-1.5">Referencia</label>
                  <input type="text" placeholder="N° Doc" value={reservaForm.numeroComprobante} onChange={(e) => setReservaForm({...reservaForm, numeroComprobante: e.target.value})} className="w-full text-xs bg-white border border-[#415364]/20 p-3 rounded-xl outline-none font-mono text-[#415364] focus:border-[#ea0029]" />
                </div>
              </div>
              {!reservaExitosa ? (
                <button onClick={procesarReserva} disabled={guardando} className="w-full bg-[#ea0029] text-white text-xs uppercase tracking-widest font-bold py-4 rounded-xl mt-4 shadow-md hover:bg-[#c90022] transition-colors disabled:opacity-50">
                  {guardando ? 'Verificando...' : 'Aplicar Ingreso y Bloquear Unidad'}
                </button>
              ) : (
                <div className="mt-6 bg-[#21242E] p-6 rounded-2xl border border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-4 text-white shadow-xl">
                  <div>
                    <span className="text-[#D1C292] font-bold text-xs uppercase tracking-wider flex items-center gap-2">✔ Unidad Bloqueada</span>
                    <p className="text-[11px] text-white/70 mt-1">Imprima el recibo de caja para el cliente.</p>
                  </div>
                  <button onClick={() => imprimirDocumento('impresion-recibo', 'Recibo_Caja')} className="w-full md:w-auto bg-white hover:bg-neutral-100 text-[#21242E] px-6 py-3 rounded-xl font-bold text-xs tracking-wider uppercase transition-colors shadow-sm">
                    🖨️ Generar Recibo de Caja
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =======================================================
            TAB 2: INFORME DE NEGOCIO
           ======================================================= */}
        {activeTab === 'informe_negocio' && (
          <div className="animate-in fade-in">
            {/* CABECERA INFORME NEGOCIO (ESTILO COTIZADOR) */}
            <div className="mb-6 flex justify-end">
              {propiedadActivaInforme && (
                <div className="flex bg-[#dce3eb]/50 p-1.5 rounded-xl border border-[#415364]/10 shadow-inner">
                  <button onClick={() => setPestañaInforme('configurar')} className={`px-4 py-2 rounded-lg text-xs transition-all flex items-center gap-2 ${pestañaInforme === 'configurar' ? 'bg-white text-[#ea0029] shadow-sm font-bold' : 'text-[#415364]/70 hover:text-[#415364] font-semibold'}`}>
                    ⚙️ Configurar Negocio
                  </button>
                  <button onClick={() => setPestañaInforme('previsualizar')} className={`px-4 py-2 rounded-lg text-xs transition-all flex items-center gap-2 ${pestañaInforme === 'previsualizar' ? 'bg-white text-[#ea0029] shadow-sm font-bold' : 'text-[#415364]/70 hover:text-[#415364] font-semibold'}`}>
                    📄 Ver Documento Oficial
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* CONFIGURADOR */}
              <div className="xl:col-span-2 space-y-5">
                {pestañaInforme === 'configurar' ? (
                  <>
                    <div className="bg-white rounded-2xl border border-[#D1C292] p-6 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-[#D1C292]"></div>
                      <h2 className="text-[11px] font-bold text-[#21242E] uppercase tracking-widest mb-4 flex items-center gap-2">1. Vinculación de Negocio</h2>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-[#415364]/60 uppercase block mb-1.5">Cliente Titular</label>
                          <select value={informeForm.clienteId} onChange={(e) => setInformeForm({...informeForm, clienteId: e.target.value})} className="w-full bg-[#F9F7F5] border border-[#D1C292]/50 rounded-xl p-3 text-xs font-bold focus:border-[#ea0029] outline-none">
                            <option value="">— Seleccionar —</option>
                            {clientes.map(c => <option key={c.id} value={c.id}>{c.nombres} {c.apellidos}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-[#415364]/60 uppercase block mb-1.5">Unidad Reservada</label>
                          <select value={informeForm.propiedadId} onChange={(e) => setInformeForm({...informeForm, propiedadId: e.target.value})} className="w-full bg-[#F9F7F5] border border-[#D1C292]/50 rounded-xl p-3 text-xs font-bold focus:border-[#ea0029] outline-none">
                            <option value="">— Seleccionar —</option>
                            {propiedades.filter(p => p.estado === 'Reservado').map(p => <option key={p.id} value={p.id}>Unidad {p.unidad || p.numero} (Reservada)</option>)}
                          </select>
                        </div>
                      </div>
                    </div>

                    {propiedadActivaInforme && (
                      <>
                        <div className="bg-white rounded-2xl border border-neutral-200/60 p-6 shadow-sm space-y-5">
                          <h2 className="text-[11px] font-bold text-[#ea0029] uppercase tracking-widest border-b border-neutral-100 pb-2">2. Condiciones de Negocio</h2>
                          <div className="grid grid-cols-1 gap-5">
                            <div>
                              <label className="block text-[10px] font-bold text-[#415364]/60 uppercase mb-1.5">Tipo de Financiamiento</label>
                              <select value={formaFinanciamiento} onChange={(e) => setFormaFinanciamiento(e.target.value)} className="w-full md:w-1/2 bg-[#dce3eb]/30 border border-[#415364]/20 rounded-xl p-3 text-xs font-bold outline-none">
                                 <option>Crédito Directo</option><option>Contado</option><option>Crédito Hipotecario (Banco)</option><option>BIESS</option><option>Canje</option><option>Estructura Mixta</option>
                              </select>
                            </div>
                            
                            {/* SISTEMA DE NOTAS Y OBSERVACIONES */}
                            <div className="bg-[#415364]/5 border border-[#415364]/10 rounded-xl p-4 mt-2">
                               <div className="flex justify-between items-center mb-3">
                                  <label className="text-[10px] font-bold text-[#415364] uppercase">Notas y Observaciones del Negocio</label>
                                  <button onClick={agregarNota} className="text-[10px] font-bold bg-white text-[#ea0029] border border-[#ea0029]/30 px-3 py-1.5 rounded-lg shadow-sm">➕ Agregar Nota</button>
                               </div>
                               {notas.length === 0 && <p className="text-xs text-[#415364]/50 italic">No hay notas adicionales. El informe saldrá limpio.</p>}
                               <div className="space-y-3">
                                 {notas.map((nota, idx) => (
                                    <div key={nota.id} className="flex flex-col sm:flex-row gap-2 bg-white p-2 rounded-lg border border-neutral-200">
                                       <div className="flex-1">
                                          <input type="text" placeholder="Título (Ej. Promoción, Bono...)" value={nota.titulo} onChange={e => actualizarNota(nota.id, 'titulo', e.target.value)} className="w-full text-[10px] font-bold uppercase text-[#ea0029] border-b border-neutral-200 pb-1 mb-1 outline-none" />
                                          <input type="text" placeholder="Descripción de la observación..." value={nota.descripcion} onChange={e => actualizarNota(nota.id, 'descripcion', e.target.value)} className="w-full text-xs text-[#415364] outline-none" />
                                       </div>
                                       <button onClick={() => eliminarNota(nota.id)} className="text-[#415364]/40 hover:text-[#ea0029] px-2 text-sm">✖</button>
                                    </div>
                                 ))}
                               </div>
                            </div>
                          </div>
                          
                          <div className="pt-4 border-t border-neutral-100">
                            <div className="flex bg-[#dce3eb]/50 p-1.5 rounded-xl border border-[#415364]/10 w-fit mb-4">
                              <button onClick={() => setTipoDescuento('porcentaje')} className={`px-4 py-2 rounded-lg text-xs font-bold ${tipoDescuento === 'porcentaje' ? 'bg-white shadow-sm' : 'text-[#415364]/50'}`}>Descuento (%)</button>
                              <button onClick={() => setTipoDescuento('valor')} className={`px-4 py-2 rounded-lg text-xs font-bold ${tipoDescuento === 'valor' ? 'bg-white shadow-sm' : 'text-[#415364]/50'}`}>Descuento Fijo ($)</button>
                            </div>
                            <input type="number" value={valorDescuento} onChange={(e) => setValorDescuento(Number(e.target.value))} className="w-full bg-[#dce3eb]/30 border border-[#415364]/20 rounded-xl p-3 font-mono font-bold outline-none" placeholder="0" />
                          </div>
                        </div>

                        <div className="bg-[#21242E] rounded-2xl border border-neutral-800 p-6 shadow-xl space-y-6">
                          <h2 className="text-[11px] font-bold text-[#D1C292] uppercase tracking-widest border-b border-white/10 pb-2">3. Flujo de Caja (Estructura)</h2>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="space-y-2">
                              <label className="block text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">Reserva Existente ($)</label>
                              <input type="number" value={infReservaValor} onChange={(e) => setInfReservaValor(Number(e.target.value))} className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-sm font-mono font-bold text-white outline-none" />
                            </div>
                            
                            <div className="space-y-2 border border-white/10 p-3.5 rounded-xl bg-[#1a1c23]">
                              <div className="flex justify-between items-center mb-3">
                                <label className="text-[10px] font-bold text-white uppercase tracking-widest">Abono Inicial Total</label>
                                <div className="flex bg-white/10 p-1 rounded-lg text-[10px] font-bold">
                                  <button onClick={() => setTipoInicial('porcentaje')} className={`px-2 py-1 rounded-md ${tipoInicial === 'porcentaje' ? 'bg-[#ea0029] text-white' : 'text-white/50'}`}>%</button>
                                  <button onClick={() => setTipoInicial('valor')} className={`px-2 py-1 rounded-md ${tipoInicial === 'valor' ? 'bg-[#ea0029] text-white' : 'text-white/50'}`}>$</button>
                                </div>
                              </div>
                              <input type="number" value={valorInicial} onChange={(e) => setValorInicial(Number(e.target.value))} className="w-full bg-white rounded-lg p-2.5 text-sm font-mono font-bold text-[#21242E] outline-none" />
                              
                              <div className="flex justify-between items-center pt-3 mt-3 border-t border-white/10">
                                <label className="text-[10px] font-bold text-white/50 uppercase">Diferir en (Meses):</label>
                                <input type="number" min="1" max="12" value={mesesInicial} onChange={(e) => setMesesInicial(Math.max(1, Number(e.target.value)))} className="w-16 bg-white/10 border border-white/20 text-white rounded-lg p-2 text-xs font-bold outline-none text-center focus:border-[#D1C292]" />
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Entrada Diferida</label>
                                <div className="flex bg-white/10 p-1 rounded-lg text-[10px] font-bold">
                                  <button onClick={() => setTipoEntrada('porcentaje')} className={`px-2 py-1 rounded-md ${tipoEntrada === 'porcentaje' ? 'bg-[#ea0029] text-white' : 'text-white/50'}`}>%</button>
                                  <button onClick={() => setTipoEntrada('valor')} className={`px-2 py-1 rounded-md ${tipoEntrada === 'valor' ? 'bg-[#ea0029] text-white' : 'text-white/50'}`}>$</button>
                                </div>
                              </div>
                              <input type="number" value={valorEntrada} onChange={(e) => setValorEntrada(Number(e.target.value))} className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-sm font-mono font-bold text-white outline-none" />
                            </div>
                            <div className="space-y-2">
                              <label className="block text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">Plazo de Obra (Meses)</label>
                              <input type="number" value={mesesConstruccion} onChange={(e) => setMesesConstruccion(Number(e.target.value))} className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-sm font-mono font-bold text-white outline-none" />
                            </div>
                          </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-neutral-200/60 p-6 shadow-sm">
                          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-5 border-b border-neutral-100 pb-4">
                            <h2 className="text-[11px] font-bold text-[#ea0029] uppercase tracking-widest">4. Ajuste de Cuotas y Fechas (Completo)</h2>
                            <div className="flex gap-2">
                              <button onClick={reiniciarCuotas} className="text-[10px] text-[#415364]/60 hover:text-[#415364] font-bold uppercase tracking-wider bg-[#dce3eb]/50 px-3 py-2 rounded-lg transition-colors">↻ Reiniciar</button>
                              <button onClick={() => setMostrarCalculadoraRefuerzos(!mostrarCalculadoraRefuerzos)} className="text-[10px] bg-[#ea0029] text-white px-4 py-2 rounded-lg font-bold uppercase tracking-wider">⚡ Cuota Balón</button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6 bg-[#F9F7F5] p-4 rounded-xl border border-neutral-100">
                            <div><label className="block text-[10px] font-bold uppercase mb-1">Firma Reserva</label><input type="date" value={fechaReservaInf} onChange={(e)=>setFechaReservaInf(e.target.value)} className="w-full text-xs p-2 border rounded-md" /></div>
                            <div><label className="block text-[10px] font-bold uppercase mb-1">Firma Promesa / Inicio Iniciales</label><input type="date" value={fechaFirmaPromesa} onChange={(e)=>setFechaFirmaPromesa(e.target.value)} className="w-full text-xs p-2 border rounded-md" /></div>
                            <div><label className="block text-[10px] font-bold uppercase mb-1">Mes Inicio Construcción</label><input type="number" value={mesInicio} onChange={(e)=>setMesInicio(Number(e.target.value))} className="w-full text-xs p-2 border rounded-md" /></div>
                            <div><label className="block text-[10px] font-bold uppercase mb-1">Día de Pago Fijo (Const)</label><input type="number" value={diaPago} onChange={(e)=>setDiaPago(Number(e.target.value))} className="w-full text-xs p-2 border rounded-md" /></div>
                          </div>

                          {mostrarCalculadoraRefuerzos && (
                            <div className="mb-5 p-5 bg-[#415364] border border-[#21242E] rounded-xl flex gap-4">
                               <div className="flex-1"><label className="text-[9px] font-bold text-[#dce3eb]/70 uppercase mb-1.5 block">Cuota Fija Base ($)</label><input type="number" value={cuotaBaseRapida} onChange={e => setCuotaBaseRapida(e.target.value===''? '':Number(e.target.value))} className="w-full bg-white/10 p-2.5 text-xs text-white rounded-lg"/></div>
                               <div className="flex-1"><label className="text-[9px] font-bold text-[#dce3eb]/70 uppercase mb-1.5 block">Meses Refuerzo (Ej: 12,24)</label><input type="text" value={mesesRefuerzoRapido} onChange={e => setMesesRefuerzoRapido(e.target.value)} className="w-full bg-white/10 p-2.5 text-xs text-white rounded-lg"/></div>
                               <button onClick={aplicarPlanRefuerzos} className="bg-[#ea0029] text-white px-6 rounded-lg text-[11px] font-bold mt-5 h-10">Aplicar</button>
                            </div>
                          )}

                          <div className="max-h-80 overflow-y-auto border border-[#415364]/10 rounded-xl divide-y divide-[#415364]/5 custom-scrollbar">
                            {cronogramaCuotas.map(cuota => (
                              <div key={cuota.id} className={`flex justify-between items-center p-3 ${cuota.tipo === 'inicial' ? 'bg-[#D1C292]/10' : ''}`}>
                                <span className={`text-[11px] font-bold ${cuota.tipo === 'inicial' ? 'text-[#D1C292] w-32' : 'text-[#415364] w-32'}`}>
                                  {cuota.tipo === 'inicial' ? `Abono Inicial ${cuota.numeroCuota}` : `Dividendo ${cuota.numeroCuota}`}
                                </span>
                                
                                <div className="flex items-center gap-4">
                                  <input type="date" value={cuota.fechaPago} onChange={(e) => actualizarAtributoCuota(cuota.id, 'fechaPago', e.target.value)} className="text-xs p-1.5 border border-transparent hover:border-[#415364]/20 rounded-md bg-transparent outline-none text-[#415364]/70 font-medium w-32" />
                                  <div className="flex items-center border-b border-dashed border-[#415364]/30 pb-0.5 w-28 justify-end">
                                    <span className="text-xs mr-1 font-bold text-[#415364]/50">$</span>
                                    <input type="number" value={Number(cuota.valor.toFixed(2))} onChange={(e) => actualizarAtributoCuota(cuota.id, 'valor', Number(e.target.value))} className="w-full text-right text-sm font-bold font-mono outline-none bg-transparent" />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  /* PREVISUALIZADOR DEL INFORME DE NEGOCIO */
                  <div className="bg-[#1a1c23] p-6 rounded-2xl shadow-inner flex justify-center border border-[#415364]/30 overflow-x-auto min-h-[500px]">
                    <div id="plantilla-pdf-arienzo" className="bg-white w-[210mm] min-h-[297mm] flex flex-col text-neutral-900 shadow-2xl scale-95 sm:scale-100 origin-top transform p-10 box-border">
                        {/* HEADER */}
                        <div className="flex justify-between items-center mb-6">
                          <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/arienzo-logo-terracota.svg" alt="Arienzo" className="h-6 max-w-[120px] object-contain" />
                          <h1 className="text-[16pt] font-bold tracking-widest uppercase text-[#333333]">Informe de Negocio</h1>
                          <div className="text-right text-[7pt] uppercase tracking-wider text-[#333333]">
                             <p><strong>FECHA:</strong> {new Date().toLocaleDateString('es-ES')}</p>
                             <p><strong>CÓDIGO:</strong> {codigoInforme}</p>
                          </div>
                        </div>
                        
                        {/* INFORMACIÓN DEL CLIENTE */}
                        <div className="bg-[#F2EFEB] text-[#B94A36] font-bold text-[7pt] px-2 py-1 uppercase border border-[#333333] tracking-widest mt-2">Información del Cliente</div>
                        <div className="grid grid-cols-4 gap-y-2 gap-x-4 text-[7pt] border-l border-r border-b border-[#333333] p-3 uppercase">
                            <div className="col-span-2"><strong>Empresa / Cliente:</strong> {clienteActivoInforme?.nombres || '---'} {clienteActivoInforme?.apellidos || ''}</div>
                            <div className="col-span-2"><strong>RUC / Cédula / Pass:</strong> {clienteActivoInforme?.cedula || '---'}</div>
                            <div className="col-span-2"><strong>Representante Legal:</strong> {clienteActivoInforme?.representante_legal || '---'}</div>
                            <div className="col-span-2"><strong>Estado Civil:</strong> {clienteActivoInforme?.estado_civil || '---'}</div>
                            <div className="col-span-2"><strong>Ciudad Residencia:</strong> {clienteActivoInforme?.ciudad || '---'}</div>
                            <div className="col-span-2"><strong>Teléfono Fijo:</strong> {clienteActivoInforme?.telefono_domicilio || '---'}</div>
                            <div className="col-span-4"><strong>Dirección:</strong> {clienteActivoInforme?.direccion_domicilio || '---'}</div>
                            <div className="col-span-2"><strong>E-mail:</strong> <span className="lowercase">{clienteActivoInforme?.email || '---'}</span></div>
                            <div className="col-span-2"><strong>Celular:</strong> {clienteActivoInforme?.telefono || '---'}</div>
                        </div>

                        {/* DESCRIPCIÓN DEL PRODUCTO */}
                        <div className="bg-[#F2EFEB] text-[#B94A36] font-bold text-[7pt] px-2 py-1 uppercase border border-[#333333] tracking-widest mt-4">Descripción del Producto</div>
                        <div className="grid grid-cols-4 gap-y-2 gap-x-4 text-[7pt] border-l border-r border-b border-[#333333] p-3 uppercase">
                            <div><strong>Departamento No.:</strong> {propiedadActivaInforme?.unidad || propiedadActivaInforme?.numero}</div>
                            <div><strong>Área Útil:</strong> {propiedadActivaInforme?.area_interior || propiedadActivaInforme?.area_total || '0.00'} m²</div>
                            <div><strong>Terraza A:</strong> {propiedadActivaInforme?.terraza_a || '0.00'} m²</div>
                            <div><strong>Área Total:</strong> {propiedadActivaInforme?.area_total || '0.00'} m²</div>
                            <div><strong>Bodega No.:</strong> {propiedadActivaInforme?.bodega_asignada || '---'}</div>
                            <div><strong>Parqueo No.:</strong> {propiedadActivaInforme?.parqueadero_asignado || '---'}</div>
                            <div><strong>Terraza B:</strong> {propiedadActivaInforme?.terraza_b || '0.00'} m²</div>
                            <div><strong>Dormitorios:</strong> {propiedadActivaInforme?.no_dormitorios || '---'}</div>
                        </div>
                        
                        {/* NEGOCIO Y TABLA */}
                        <div className="flex gap-4 mt-4 flex-1 items-stretch">
                          <div className="w-1/2 flex flex-col h-full">
                              <div className="bg-[#F2EFEB] text-[#B94A36] font-bold text-[7pt] px-2 py-1 uppercase border border-[#333333] tracking-widest">Condiciones de Negocio</div>
                              <div className="border-l border-r border-b border-[#333333] p-3 text-[8pt] uppercase space-y-2 flex-1 flex flex-col">
                                  <div className="flex justify-between items-center"><span>Precio del Inmueble:</span> <strong className="font-mono text-[9pt]">${calcInforme.precioListaOriginal.toLocaleString('en-US', {minimumFractionDigits:2})}</strong></div>
                                  <div className="flex justify-between items-center"><span>Descuento Aplicado:</span> <strong className="font-mono text-[9pt] text-[#ea0029]">${calcInforme.montoDescuentoCalculado.toLocaleString('en-US', {minimumFractionDigits:2})}</strong></div>
                                  <div className="flex justify-between items-center text-[9pt] border-t border-[#333333] pt-2 mt-2">
                                      <span className="font-bold text-[#B94A36]">PRECIO FINAL ACORDADO:</span> <strong className="font-mono text-[11pt] text-[#B94A36]">${calcInforme.precioTotal.toLocaleString('en-US', {minimumFractionDigits:2})}</strong>
                                  </div>
                                  
                                  <div className="mt-8 pt-4 border-t border-dashed border-[#333333]/50">
                                      <p className="font-bold text-[7pt] text-[#B94A36] mb-1">Tipo de Financiamiento:</p>
                                      <p className="font-bold text-[8pt] mb-4">{formaFinanciamiento}</p>
                                      
                                      {/* SISTEMA DE NOTAS Y OBSERVACIONES IMPRESO */}
                                      <p className="font-bold text-[7pt] text-[#B94A36] mb-1">Notas y Observaciones:</p>
                                      {notas.map(n => (
                                        <div key={n.id} className="mb-2">
                                           <span className="font-bold text-[#ea0029] text-[7pt]">{n.titulo}: </span>
                                           <span className="text-[7pt] text-[#333333] normal-case">{n.descripcion}</span>
                                        </div>
                                      ))}
                                      {notas.length === 0 && <p className="text-[7pt] italic text-neutral-400">Sin observaciones especiales.</p>}
                                  </div>
                              </div>
                          </div>

                          <div className="w-1/2 flex flex-col h-full">
                              <div className="bg-[#F2EFEB] text-[#B94A36] font-bold text-[7pt] px-2 py-1 uppercase border border-[#333333] tracking-widest">Tabla de Pagos</div>
                              <div className="border-l border-r border-b border-[#333333] flex-1">
                                  <table className="w-full text-[7pt] text-left uppercase">
                                      <thead>
                                          <tr className="border-b border-[#333333] bg-neutral-50"><th className="p-1 border-r border-[#333333] text-center w-2/5">Detalle / Cuota</th><th className="p-1 border-r border-[#333333] text-center w-1/4">Fecha</th><th className="p-1 text-right w-1/3">Monto $</th></tr>
                                      </thead>
                                      <tbody className="divide-y divide-[#333333]/30">
                                          <tr>
                                            <td className="p-1 border-r border-[#333333] font-bold text-center">Reserva</td>
                                            <td className="p-1 border-r border-[#333333] text-center font-mono">{formatearFechaLegible(fechaReservaInf)}</td>
                                            <td className="p-1 text-right font-mono font-bold">${infReservaValor.toLocaleString('en-US', {minimumFractionDigits:2})}</td>
                                          </tr>
                                          
                                          {/* RENDERIZADO DEL CRONOGRAMA COMBINADO */}
                                          {cronogramaCuotas.map(c => (
                                              <tr key={c.id}>
                                                <td className={`p-1 border-r border-[#333333] pl-2 ${c.tipo === 'inicial' ? 'font-bold text-neutral-700' : 'text-[6pt] text-neutral-600'}`}>
                                                  {c.tipo === 'inicial' ? `Abono Inicial ${c.numeroCuota}` : `Dividendo ${c.numeroCuota}`}
                                                </td>
                                                <td className="p-1 border-r border-[#333333] text-center font-mono">{formatearFechaLegible(c.fechaPago)}</td>
                                                <td className={`p-1 text-right font-mono ${c.tipo === 'inicial' ? 'font-bold' : 'text-neutral-600'}`}>${c.valor.toLocaleString('en-US', {minimumFractionDigits:2})}</td>
                                              </tr>
                                          ))}
                                          
                                          <tr className="border-t-[1.5px] border-[#333333] bg-[#F2EFEB]/50">
                                            <td className="p-1 border-r border-[#333333] font-bold text-[#B94A36] text-center">Contraentrega</td>
                                            <td className="p-1 border-r border-[#333333] text-center font-mono font-bold text-neutral-400">FINAL</td>
                                            <td className="p-1 text-right font-mono font-bold text-[#B94A36]">${calcInforme.contraEntrega.toLocaleString('en-US', {minimumFractionDigits:2})}</td>
                                          </tr>
                                      </tbody>
                                  </table>
                              </div>
                          </div>
                        </div>
                        
                        {/* FIRMAS INFORME */}
                        <div className="mt-12 grid grid-cols-2 gap-16 px-12 pt-4">
                            <div className="text-center border-t border-[#333333] pt-2">
                                <p className="text-[7pt] font-bold uppercase tracking-widest">{clienteActivoInforme?.nombres || 'FIRMA DEL CLIENTE'} {clienteActivoInforme?.apellidos || ''}</p>
                                <p className="text-[6pt] text-neutral-500 mt-0.5">C.C. {clienteActivoInforme?.cedula || '_______________'}</p>
                            </div>
                            <div className="text-center border-t border-[#333333] pt-2">
                                <p className="text-[7pt] font-bold uppercase tracking-widest">Arienzo S.A.S.</p>
                                <p className="text-[6pt] text-neutral-500 mt-0.5">{nombreAsesor}</p>
                            </div>
                        </div>

                    </div>
                  </div>
                )}
              </div>

              {/* RESUMEN DERECHA Y BOTÓN IMPRIMIR */}
              <div className="xl:col-span-1 space-y-6">
                <div className="bg-white rounded-2xl border border-neutral-200/60 p-6 shadow-xl sticky top-6">
                  <h2 className="text-[11px] font-bold text-[#ea0029] uppercase tracking-widest mb-3 border-b border-neutral-100 pb-2">Acuerdo Financiero</h2>
                  <div className="text-4xl font-bold tracking-tight text-[#415364] font-mono">${calcInforme.precioTotal.toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
                  <p className="text-[10px] font-bold uppercase text-[#415364]/50 mt-1">Precio Final de Venta</p>
                  
                  <div className="space-y-4 pt-5 border-t border-[#415364]/10 text-sm mt-5">
                    <div className="flex justify-between"><span className="text-[11px] font-bold uppercase">Cuota Inicial Total</span><span className="font-bold font-mono">${calcInforme.cuotaInicialTotal.toLocaleString('en-US',{minimumFractionDigits:2})}</span></div>
                    <div className="flex justify-between pl-4 text-[10px] text-neutral-500"><span>Reserva:</span><span className="font-mono">${infReservaValor.toLocaleString('en-US',{minimumFractionDigits:2})}</span></div>
                    <div className="flex justify-between pl-4 text-[10px] text-neutral-500"><span>Saldo Firma:</span><span className="font-mono">${calcInforme.saldoFirmaPromesa.toLocaleString('en-US',{minimumFractionDigits:2})}</span></div>
                    
                    {mesesInicial > 1 && calcInforme.saldoFirmaPromesa > 0 && (
                      <div className="flex justify-between pl-4 pr-3 py-2 text-[10px] font-bold text-[#ea0029] bg-[#ea0029]/5 rounded-lg border border-[#ea0029]/10 mt-1">
                        <span>↳ Dividido en {mesesInicial} pagos</span>
                      </div>
                    )}

                    <div className="flex justify-between border-t border-neutral-100 pt-3"><span className="text-[11px] font-bold uppercase">Diferido Obra</span><span className="font-bold font-mono">${calcInforme.entradaDiferirTotal.toLocaleString('en-US',{minimumFractionDigits:2})}</span></div>
                    <div className="flex justify-between border-t-2 border-[#21242E] pt-3 mt-2"><span className="text-[12px] font-bold uppercase">Contra Entrega</span><span className="font-bold text-[#B94A36] font-mono">${calcInforme.contraEntrega.toLocaleString('en-US',{minimumFractionDigits:2})}</span></div>
                  </div>

                  <button onClick={() => imprimirDocumento('plantilla-pdf-arienzo', 'Informe_Negocio')} disabled={!propiedadActivaInforme} className="w-full bg-[#21242E] text-white rounded-xl p-3.5 text-[11px] font-bold uppercase tracking-widest hover:bg-neutral-800 transition-colors mt-8 disabled:opacity-50">
                    📄 Imprimir Informe Oficial
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =======================================================
            TAB 3: PREPARAR EXPEDIENTE KYC
           ======================================================= */}
        {activeTab === 'expediente' && (
          <div className="bg-white border border-neutral-200/60 rounded-2xl p-6 md:p-8 shadow-sm max-w-4xl mx-auto animate-in fade-in">
             <div className="mb-6 border-b border-neutral-100 pb-4">
              <h3 className="text-sm font-bold text-[#415364] uppercase tracking-wider">Formularios de Expediente (UAFE / KYC)</h3>
              <p className="text-xs text-[#415364]/60 mt-1">Impresión de documentación en blanco lista para firmas.</p>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#dce3eb]/30 p-5 rounded-xl border border-[#415364]/10">
                <div>
                  <label className="text-[10px] font-bold text-[#415364]/60 uppercase block mb-1.5">1. Seleccionar Titular</label>
                  <select value={cierreForm.clienteId} onChange={(e) => setCierreForm({...cierreForm, clienteId: e.target.value})} className="w-full text-xs bg-white border border-[#415364]/20 p-3 rounded-xl outline-none font-bold text-[#415364]">
                    <option value="">-- Seleccione Cliente --</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nombres} {c.apellidos}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#415364]/60 uppercase block mb-1.5">2. Unidad Vinculada</label>
                  <select value={cierreForm.propiedadId} onChange={(e) => setCierreForm({...cierreForm, propiedadId: e.target.value})} className="w-full text-xs bg-white border border-[#415364]/20 p-3 rounded-xl outline-none font-bold text-[#ea0029]">
                    <option value="">-- Seleccione Unidad --</option>
                    {propiedades.filter(p => p.estado === 'Reservado').map(p => <option key={p.id} value={p.id}>Unidad {p.unidad || p.numero}</option>)}
                  </select>
                </div>
              </div>

              {cierreForm.clienteId && cierreForm.propiedadId ? (
                <div className="mt-6 bg-[#FCFBFA] p-6 rounded-2xl border border-[#EAE3DC] flex flex-col md:flex-row items-center justify-between gap-6">
                  <div>
                    <span className="text-[#B94A36] font-bold text-xs uppercase tracking-wider block mb-1">Expediente Listo para Imprimir</span>
                    <p className="text-[11px] text-[#415364]/70">Formulario Conozca a su Cliente + Licitud de Fondos.</p>
                  </div>
                  <button onClick={() => imprimirDocumento('impresion-formularios-kyc', 'Formularios_Expediente')} className="w-full md:w-auto bg-[#ea0029] text-white px-8 py-4 rounded-xl font-bold text-xs tracking-wider uppercase transition-colors shadow-md">
                    🖨️ Imprimir Documentos
                  </button>
                </div>
              ) : (
                <div className="mt-6 p-6 border-2 border-dashed border-[#415364]/20 rounded-2xl text-center"><p className="text-xs text-[#415364]/50 font-bold uppercase tracking-widest">Seleccione cliente y unidad para habilitar impresión</p></div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            PLANTILLAS OCULTAS PARA GENERACIÓN DE PDF
           ========================================================================= */}

        {/* PLANTILLA A: RECIBO DE CAJA */}
        <div id="impresion-recibo" className="hidden">
          <div className="pagina-a4">
            <div className="flex justify-between items-end border-b-2 border-[#B94A36] pb-4 mb-8">
              <div>
                <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/arienzo-logo-terracota.svg" alt="Arienzo" className="h-10 mb-2 object-contain" />
                <p className="text-[8px] tracking-widest text-[#8C8A87] uppercase font-bold">RUC: 1391937895001</p>
              </div>
              <div className="text-right"><h1 className="text-lg font-light text-[#B94A36] tracking-widest uppercase">Recibo de Caja</h1><p className="text-xs font-mono font-bold mt-1">N° {codigoReserva || 'RES-BORRADOR'}</p></div>
            </div>
            <div className="bg-white border border-[#EAE3DC] p-6 rounded-md shadow-sm">
              <div className="flex justify-between items-center border-b border-[#EAE3DC] pb-4 mb-4"><span className="text-[10px] uppercase font-bold text-[#8C8A87] tracking-wider">Fecha de Emisión:</span><span className="text-sm font-medium">{new Date().toLocaleDateString('es-ES')}</span></div>
              <div className="flex justify-between items-center border-b border-[#EAE3DC] pb-4 mb-4"><span className="text-[10px] uppercase font-bold text-[#8C8A87] tracking-wider">Monto Recibido:</span><span className="text-xl font-mono font-bold text-[#B94A36]">${reservaForm.montoReserva.toLocaleString('en-US', {minimumFractionDigits: 2})}</span></div>
              <div className="flex justify-between items-center border-b border-[#EAE3DC] pb-4 mb-4"><span className="text-[10px] uppercase font-bold text-[#8C8A87] tracking-wider">Recibimos de:</span><span className="text-sm font-bold uppercase">{clienteActivoReserva?.nombres || ''} {clienteActivoReserva?.apellidos || ''}</span></div>
              <div className="flex flex-col border-b border-[#EAE3DC] pb-4 mb-4">
                <span className="text-[10px] uppercase font-bold text-[#8C8A87] tracking-wider mb-2">Por Concepto de:</span>
                <span className="text-sm text-justify leading-relaxed mb-3">Reserva y bloqueo comercial de la siguiente unidad perteneciente al Proyecto Inmobiliario "Arienzo Boutique Living", ubicado en el sector Barbasquillo, Manta.</span>
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
            <div className="absolute bottom-6 left-0 right-0 text-center text-[7px] text-[#8C8A87] uppercase tracking-widest">Arienzo S.A.S. • Promotora Inmobiliaria • Página 1 de 1</div>
          </div>
        </div>

        {/* EL RESTO DE PLANTILLAS SE ENCUENTRAN EN EL PREVISUALIZADOR ARRIBA O AQUI DEPENDIENDO DEL TAB */}

      </div>
    </div>
  );
}