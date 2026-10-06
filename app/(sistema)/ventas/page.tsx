// Actualizacion para Vercel - Gestor de Operaciones (Reserva, Informe Negocio y Expediente)
'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

interface CuotaMes {
  numeroCuota: number;
  fechaPago: string;
  valor: number;
  esEditable: boolean;
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
    clienteId: '',
    propiedadId: '',
    montoReserva: 2500,
    formaPago: 'Transferencia Bancaria',
    bancoOrigen: '',
    numeroComprobante: '',
    fechaPago: new Date().toISOString().split('T')[0],
  });

  // ================= ESTADOS: PESTAÑA 2 (INFORME NEGOCIO) =================
  const [informeForm, setInformeForm] = useState({
    clienteId: '',
    propiedadId: '',
  });
  const [formaFinanciamiento, setFormaFinanciamiento] = useState('Crédito Directo');
  const [observacionesNegocio, setObservacionesNegocio] = useState('');
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
  const [cierreForm, setCierreForm] = useState({
    clienteId: '',
    propiedadId: '',
  });

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
    const mesesNombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const mesIndex = parseInt(partes[1], 10) - 1;
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
    if (!propiedadActivaInforme || calcInforme.entradaDiferirTotal <= 0 || mesesConstruccion <= 0) {
      setCronogramaCuotas([]); return;
    }
    const valorBaseCuota = calcInforme.entradaDiferirTotal / mesesConstruccion;
    const mesesNombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    const cuotasCalculadas = Array.from({ length: mesesConstruccion }, (_, i) => {
      const mesRelativo = (mesInicio - 1) + i;
      const fechaCuota = new Date(anioInicio, mesRelativo, diaPago);
      return {
        numeroCuota: i + 1,
        fechaPago: `${String(fechaCuota.getDate()).padStart(2, '0')}-${mesesNombres[fechaCuota.getMonth()].toUpperCase()}-${fechaCuota.getFullYear()}`,
        valor: valorBaseCuota, esEditable: false,
      };
    });
    setCronogramaCuotas(cuotasCalculadas);
  }, [propiedadActivaInforme, mesesConstruccion, calcInforme.entradaDiferirTotal, diaPago, mesInicio, anioInicio]);

  const actualizarValorCuota = (cuotaNumero: number, nuevoValor: number) => {
    let nuevoCrono = cronogramaCuotas.map(c => c.numeroCuota === cuotaNumero ? { ...c, valor: nuevoValor, esEditable: true } : c);
    const saldoRestante = calcInforme.entradaDiferirTotal - nuevoCrono.filter(c => c.esEditable).reduce((acc, curr) => acc + curr.valor, 0);
    const automaticos = nuevoCrono.filter(c => !c.esEditable);
    if (automaticos.length > 0) {
      const valorRepartido = Math.max(0, saldoRestante / automaticos.length);
      nuevoCrono = nuevoCrono.map(c => !c.esEditable ? { ...c, valor: valorRepartido } : c);
    }
    setCronogramaCuotas(nuevoCrono);
  };

  const reiniciarCuotas = () => {
    if (mesesConstruccion <= 0) return;
    const valorBaseCuota = calcInforme.entradaDiferirTotal / mesesConstruccion;
    setCronogramaCuotas(cronogramaCuotas.map(c => ({ ...c, valor: valorBaseCuota, esEditable: false })));
  };

  const aplicarPlanRefuerzos = () => {
    const base = Number(cuotaBaseRapida);
    if (base <= 0) { alert("Ingresa Cuota Base mayor a $0."); return; }
    const mesesExtra = mesesRefuerzoRapido.split(',').map(m => parseInt(m.trim())).filter(m => !isNaN(m) && m > 0 && m <= mesesConstruccion);
    if (mesesExtra.length === 0) return;
    const saldoRef = calcInforme.entradaDiferirTotal - (base * (mesesConstruccion - mesesExtra.length));
    const valRef = saldoRef / mesesExtra.length;
    setCronogramaCuotas(cronogramaCuotas.map(c => ({ ...c, valor: mesesExtra.includes(c.numeroCuota) ? valRef : base, esEditable: true })));
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
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-in fade-in">
            {/* CONFIGURADOR */}
            <div className="xl:col-span-2 space-y-5">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[10px] font-bold text-[#415364]/60 uppercase mb-1.5">Tipo de Financiamiento</label>
                        <select value={formaFinanciamiento} onChange={(e) => setFormaFinanciamiento(e.target.value)} className="w-full bg-[#dce3eb]/30 border border-[#415364]/20 rounded-xl p-3 text-xs font-bold outline-none">
                           <option>Crédito Directo</option><option>Contado</option><option>Crédito Hipotecario (Banco)</option><option>BIESS</option><option>Canje</option><option>Estructura Mixta</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#415364]/60 uppercase mb-1.5">Observaciones Adicionales</label>
                        <input type="text" value={observacionesNegocio} onChange={(e) => setObservacionesNegocio(e.target.value)} placeholder="Ej. 40% CD - 60% Banco Pichincha" className="w-full bg-[#dce3eb]/30 border border-[#415364]/20 rounded-xl p-3 text-xs font-medium outline-none" />
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
                      
                      {/* CAJA ABONO INICIAL CON DIVISIÓN */}
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
                      <h2 className="text-[11px] font-bold text-[#ea0029] uppercase tracking-widest">4. Ajuste de Cuotas y Fechas</h2>
                      <div className="flex gap-2">
                        <button onClick={reiniciarCuotas} className="text-[10px] text-[#415364]/60 hover:text-[#415364] font-bold uppercase tracking-wider bg-[#dce3eb]/50 px-3 py-2 rounded-lg transition-colors">↻ Reiniciar</button>
                        <button onClick={() => setMostrarCalculadoraRefuerzos(!mostrarCalculadoraRefuerzos)} className="text-[10px] bg-[#ea0029] text-white px-4 py-2 rounded-lg font-bold uppercase tracking-wider">⚡ Cuota Balón</button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6 bg-[#F9F7F5] p-4 rounded-xl border border-neutral-100">
                      <div><label className="block text-[10px] font-bold uppercase mb-1">Firma Reserva</label><input type="date" value={fechaReservaInf} onChange={(e)=>setFechaReservaInf(e.target.value)} className="w-full text-xs p-2 border rounded-md" /></div>
                      <div><label className="block text-[10px] font-bold uppercase mb-1">Firma Promesa</label><input type="date" value={fechaFirmaPromesa} onChange={(e)=>setFechaFirmaPromesa(e.target.value)} className="w-full text-xs p-2 border rounded-md" /></div>
                      <div><label className="block text-[10px] font-bold uppercase mb-1">Mes Inicio Obra</label><input type="number" value={mesInicio} onChange={(e)=>setMesInicio(Number(e.target.value))} className="w-full text-xs p-2 border rounded-md" /></div>
                      <div><label className="block text-[10px] font-bold uppercase mb-1">Día de Pago Fijo</label><input type="number" value={diaPago} onChange={(e)=>setDiaPago(Number(e.target.value))} className="w-full text-xs p-2 border rounded-md" /></div>
                    </div>

                    {mostrarCalculadoraRefuerzos && (
                      <div className="mb-5 p-5 bg-[#415364] border border-[#21242E] rounded-xl flex gap-4">
                         <div className="flex-1"><label className="text-[9px] font-bold text-[#dce3eb]/70 uppercase mb-1.5 block">Cuota Fija Base ($)</label><input type="number" value={cuotaBaseRapida} onChange={e => setCuotaBaseRapida(e.target.value===''? '':Number(e.target.value))} className="w-full bg-white/10 p-2.5 text-xs text-white rounded-lg"/></div>
                         <div className="flex-1"><label className="text-[9px] font-bold text-[#dce3eb]/70 uppercase mb-1.5 block">Meses Refuerzo (Ej: 12,24)</label><input type="text" value={mesesRefuerzoRapido} onChange={e => setMesesRefuerzoRapido(e.target.value)} className="w-full bg-white/10 p-2.5 text-xs text-white rounded-lg"/></div>
                         <button onClick={aplicarPlanRefuerzos} className="bg-[#ea0029] text-white px-6 rounded-lg text-[11px] font-bold mt-5 h-10">Aplicar</button>
                      </div>
                    )}

                    <div className="max-h-60 overflow-y-auto border border-[#415364]/10 rounded-xl divide-y divide-[#415364]/5">
                      {cronogramaCuotas.map(cuota => (
                        <div key={cuota.numeroCuota} className="flex justify-between items-center p-3">
                          <span className="text-[11px] font-bold text-[#415364]">Dividendo {cuota.numeroCuota} <span className="opacity-70 ml-2">{cuota.fechaPago}</span></span>
                          <div className="flex items-center border-b border-dashed border-[#415364]/30 pb-0.5">
                            <span className="text-xs mr-1 font-bold text-[#415364]/50">$</span>
                            <input type="number" value={Number(cuota.valor.toFixed(2))} onChange={(e) => actualizarValorCuota(cuota.numeroCuota, Number(e.target.value))} className="w-24 text-right text-sm font-bold font-mono outline-none" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
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
                      <span>↳ Dividido en {mesesInicial} pagos:</span>
                      <span className="font-mono">${(calcInforme.saldoFirmaPromesa / mesesInicial).toLocaleString('en-US', {minimumFractionDigits: 2})} c/u</span>
                    </div>
                  )}

                  <div className="flex justify-between border-t border-neutral-100 pt-3"><span className="text-[11px] font-bold uppercase">Diferido Obra</span><span className="font-bold font-mono">${calcInforme.entradaDiferirTotal.toLocaleString('en-US',{minimumFractionDigits:2})}</span></div>
                  <div className="flex justify-between border-t-2 border-[#21242E] pt-3 mt-2"><span className="text-[12px] font-bold uppercase">Contra Entrega</span><span className="font-bold text-[#B94A36] font-mono">${calcInforme.contraEntrega.toLocaleString('en-US',{minimumFractionDigits:2})}</span></div>
                </div>

                <button onClick={() => imprimirDocumento('impresion-informe', 'Informe_Negocio')} disabled={!propiedadActivaInforme} className="w-full bg-[#21242E] text-white rounded-xl p-3.5 text-[11px] font-bold uppercase tracking-widest hover:bg-neutral-800 transition-colors mt-8 disabled:opacity-50">
                  📄 Imprimir Informe Oficial
                </button>
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

        {/* PLANTILLA B: INFORME DE NEGOCIO (EL NUEVO EXCEL) */}
        <div id="impresion-informe" className="hidden">
           <div className="pagina-a4 text-neutral-900 bg-white">
              <div className="border-[1.5px] border-[#333333] p-1 flex-1 flex flex-col min-h-[270mm]">
                <div className="border-[1.5px] border-[#333333] p-5 flex-1 flex flex-col">
                  
                  {/* HEADER */}
                  <div className="flex justify-between items-center mb-4">
                    <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/arienzo-logo-terracota.svg" alt="Arienzo" className="h-6 max-w-[120px] object-contain" />
                    <h1 className="text-xl font-bold tracking-widest uppercase text-[#333333]">Informe de Negocio</h1>
                    <div className="text-right text-[8px] uppercase tracking-wider text-[#333333]">
                       <p><strong>FECHA:</strong> {new Date().toLocaleDateString('es-ES')}</p>
                       <p><strong>CÓDIGO:</strong> {codigoInforme}</p>
                    </div>
                  </div>
                  
                  {/* INFORMACIÓN DEL CLIENTE */}
                  <div className="bg-[#F2EFEB] text-[#B94A36] font-bold text-[8px] px-2 py-1 uppercase border border-[#333333] tracking-widest mt-2">Información del Cliente</div>
                  <div className="grid grid-cols-4 gap-y-2 gap-x-4 text-[8px] border-l border-r border-b border-[#333333] p-3 uppercase">
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
                  <div className="bg-[#F2EFEB] text-[#B94A36] font-bold text-[8px] px-2 py-1 uppercase border border-[#333333] tracking-widest mt-3">Descripción del Producto</div>
                  <div className="grid grid-cols-4 gap-y-2 gap-x-4 text-[8px] border-l border-r border-b border-[#333333] p-3 uppercase">
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
                  <div className="flex gap-4 mt-3 flex-1">
                    <div className="w-1/2 flex flex-col">
                        <div className="bg-[#F2EFEB] text-[#B94A36] font-bold text-[8px] px-2 py-1 uppercase border border-[#333333] tracking-widest">Condiciones de Negocio</div>
                        <div className="border-l border-r border-b border-[#333333] p-3 text-[9px] uppercase space-y-2 flex-1">
                            <div className="flex justify-between items-center"><span>Precio del Inmueble:</span> <strong className="font-mono text-[10px]">${calcInforme.precioListaOriginal.toLocaleString('en-US', {minimumFractionDigits:2})}</strong></div>
                            <div className="flex justify-between items-center"><span>Descuento Aplicado:</span> <strong className="font-mono text-[10px] text-[#ea0029]">${calcInforme.montoDescuentoCalculado.toLocaleString('en-US', {minimumFractionDigits:2})}</strong></div>
                            <div className="flex justify-between items-center text-[10px] border-t border-[#333333] pt-2 mt-2">
                                <span className="font-bold text-[#B94A36]">PRECIO FINAL ACORDADO:</span> <strong className="font-mono text-[12px] text-[#B94A36]">${calcInforme.precioTotal.toLocaleString('en-US', {minimumFractionDigits:2})}</strong>
                            </div>
                            <div className="mt-8 pt-4 border-t border-dashed border-[#333333]/50">
                                <p className="font-bold text-[8px] text-[#B94A36] mb-1">Tipo de Financiamiento:</p>
                                <p className="font-bold text-[10px]">{formaFinanciamiento}</p>
                                <p className="font-bold text-[8px] text-[#B94A36] mt-4 mb-1">Observaciones / Distribución:</p>
                                <p className="text-[8px] leading-relaxed">{observacionesNegocio || 'Sin observaciones.'}</p>
                            </div>
                        </div>
                    </div>
                    <div className="w-1/2 flex flex-col">
                        <div className="bg-[#F2EFEB] text-[#B94A36] font-bold text-[8px] px-2 py-1 uppercase border border-[#333333] tracking-widest">Tabla de Pagos</div>
                        <div className="border-l border-r border-b border-[#333333] flex-1 max-h-[140mm] overflow-hidden">
                            <table className="w-full text-[8px] text-left uppercase">
                                <thead>
                                    <tr className="border-b border-[#333333] bg-neutral-50"><th className="p-1 border-r border-[#333333] text-center">Detalle / Cuota</th><th className="p-1 border-r border-[#333333] text-center">Fecha Pago</th><th className="p-1 text-right">Monto $</th></tr>
                                </thead>
                                <tbody className="divide-y divide-[#333333]/30">
                                    <tr>
                                      <td className="p-1 border-r border-[#333333] font-bold">Reserva</td>
                                      <td className="p-1 border-r border-[#333333] text-center font-mono">{formatearFechaLegible(fechaReservaInf)}</td>
                                      <td className="p-1 text-right font-mono font-bold">${infReservaValor.toLocaleString('en-US', {minimumFractionDigits:2})}</td>
                                    </tr>
                                    
                                    {/* GENERACIÓN DINÁMICA DE ABONOS INICIALES */}
                                    {mesesInicial === 1 ? (
                                      <tr>
                                        <td className="p-1 border-r border-[#333333] font-bold">Cuota Inicial (Firma)</td>
                                        <td className="p-1 border-r border-[#333333] text-center font-mono">{formatearFechaLegible(fechaFirmaPromesa)}</td>
                                        <td className="p-1 text-right font-mono font-bold">${calcInforme.saldoFirmaPromesa.toLocaleString('en-US', {minimumFractionDigits:2})}</td>
                                      </tr>
                                    ) : (
                                      Array.from({ length: mesesInicial }).map((_, i) => {
                                        const d = new Date(fechaFirmaPromesa + "T12:00:00");
                                        d.setMonth(d.getMonth() + i);
                                        const dateStr = d.toISOString().split('T')[0];
                                        return (
                                          <tr key={`abono-${i}`}>
                                            <td className="p-1 border-r border-[#333333] font-bold text-neutral-700 pl-2">Abono Inicial {i+1}</td>
                                            <td className="p-1 border-r border-[#333333] text-center font-mono">{formatearFechaLegible(dateStr)}</td>
                                            <td className="p-1 text-right font-mono font-bold">${(calcInforme.saldoFirmaPromesa / mesesInicial).toLocaleString('en-US', {minimumFractionDigits:2})}</td>
                                          </tr>
                                        );
                                      })
                                    )}

                                    {/* CRONOGRAMA DE OBRA */}
                                    {cronogramaCuotas.map(c => (
                                        <tr key={c.numeroCuota}><td className="p-1 border-r border-[#333333] pl-2 text-[7px] text-neutral-600">Dividendo {c.numeroCuota}</td><td className="p-1 border-r border-[#333333] text-center font-mono">{c.fechaPago}</td><td className="p-1 text-right font-mono text-neutral-600">${c.valor.toLocaleString('en-US', {minimumFractionDigits:2})}</td></tr>
                                    ))}
                                    <tr className="border-t-[1.5px] border-[#333333] bg-[#F2EFEB]/50"><td className="p-1 border-r border-[#333333] font-bold text-[#B94A36]">Contraentrega</td><td className="p-1 border-r border-[#333333] text-center font-mono font-bold text-neutral-400">PAGO FINAL</td><td className="p-1 text-right font-mono font-bold text-[#B94A36]">${calcInforme.contraEntrega.toLocaleString('en-US', {minimumFractionDigits:2})}</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                  </div>
                  
                  {/* FIRMAS INFORME */}
                  <div className="mt-16 grid grid-cols-2 gap-16 px-12 pb-4">
                      <div className="text-center border-t border-[#333333] pt-2">
                          <p className="text-[8px] font-bold uppercase tracking-widest">{clienteActivoInforme?.nombres || 'FIRMA DEL CLIENTE'} {clienteActivoInforme?.apellidos || ''}</p>
                          <p className="text-[7px] text-neutral-500 mt-0.5">C.C. {clienteActivoInforme?.cedula || '_______________'}</p>
                      </div>
                      <div className="text-center border-t border-[#333333] pt-2">
                          <p className="text-[8px] font-bold uppercase tracking-widest">Arienzo S.A.S.</p>
                          <p className="text-[7px] text-neutral-500 mt-0.5">{nombreAsesor}</p>
                      </div>
                  </div>

                </div>
              </div>
           </div>
        </div>

        {/* PLANTILLA C: FORMULARIOS KYC VACÍOS (DOC. EXPEDIENTE) */}
        <div id="impresion-formularios-kyc" className="hidden">
          
          {/* HOJA 1: FORMULARIO KYC */}
          <div className="pagina-a4 text-xxs">
            <div className="flex justify-between items-end border-b-2 border-[#B94A36] pb-2 mb-2">
              <div><img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/arienzo-logo-terracota.svg" alt="Arienzo" className="h-8 object-contain" /></div>
              <div className="text-right"><h2 className="text-[10px] font-bold uppercase tracking-wide">FORMULARIO INFORMACIÓN BÁSICA DEL CLIENTE</h2><p className="text-[8px] text-[#8C8A87] uppercase mt-0.5">Persona Natural</p></div>
            </div>
            
            <div className="flex justify-end gap-6 text-[8px] mb-2"><div>FECHA: <span className="cuadro-input w-24"></span></div><div>CIUDAD: <span className="cuadro-input w-32"></span></div></div>

            <div className="seccion-titulo">1. DATOS PERSONALES</div>
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
              <div><div className="seccion-titulo">3. INFORMACIÓN PATRIMONIAL</div><div className="grid grid-cols-1 gap-2"><div className="flex items-center gap-2"><span>VIVIENDA:</span><span className="checkbox-box"></span> PROPIA <span className="checkbox-box"></span> ARRENDADA <span className="checkbox-box"></span> HIPOTECADA</div><div className="flex items-center gap-2"><span>OTROS BIENES:</span><span className="checkbox-box"></span> TERRENO <span className="checkbox-box"></span> CASA/DPTO <span className="checkbox-box"></span> VEHICULO</div></div></div>
              <div><div className="seccion-titulo">4. INFORMACIÓN FINANCIERA</div><div className="grid grid-cols-1 gap-2"><div className="flex items-center"><span className="w-32">TOTAL INGRESOS US$:</span> <span className="cuadro-input"></span></div><div className="flex items-center"><span className="w-32">TOTAL EGRESOS US$:</span> <span className="cuadro-input"></span></div></div></div>
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

            <div className="mt-24 grid grid-cols-4 gap-6 px-2">
              <div className="text-center border-t border-[#8C8A87] pt-2"><p className="text-[8px] font-bold">FIRMA DEL CLIENTE</p></div>
              <div className="text-center border-t border-[#8C8A87] pt-2"><p className="text-[8px] font-bold">FIRMA CÓNYUGE</p></div>
              <div className="text-center border-t border-[#8C8A87] pt-2"><p className="text-[8px] font-bold">OFICIAL DE CUMPLIMIENTO</p></div>
              <div className="text-center border-t border-[#8C8A87] pt-2"><p className="text-[8px] font-bold">GERENTE GENERAL</p></div>
            </div>
            <div className="absolute bottom-6 left-0 right-0 text-center text-[7px] text-[#8C8A87] uppercase tracking-widest">Arienzo S.A.S. • Formulario Conozca a su Cliente • Página 1 de 2</div>
          </div>

          {/* HOJA 2: FORMULARIO LICITUD DE FONDOS */}
          <div className="pagina-a4 text-xxs">
            <div className="flex justify-between items-end border-b-2 border-[#B94A36] pb-2 mb-4">
              <div><img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/arienzo-logo-terracota.svg" alt="Arienzo" className="h-8 object-contain" /></div>
              <div className="text-right"><h2 className="text-[11px] font-bold uppercase tracking-wide">FORMULARIO LICITUD DE FONDOS</h2></div>
            </div>

            <div className="flex justify-end gap-6 text-[8px] mb-4"><div>CIUDAD: <span className="cuadro-input w-32"></span></div><div>FECHA: <span className="cuadro-input w-24"></span></div></div>

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
                 <div className="w-3/4 border-t border-[#333333] text-center pt-1"><span className="font-bold text-[9px]">Firma de quien provee los fondos</span></div>
              </div>
              <div className="w-1/2 flex flex-col items-center h-32 pt-2 pb-4">
                 <span className="font-bold text-[9px] mb-2">PARA USO EXCLUSIVO DE ARIENZO S.A.S.</span>
                 <div className="flex-grow"></div>
                 <div className="w-3/4 border-t border-[#333333] text-center pt-1 mb-6"><span className="text-[8px]">FIRMA</span></div>
                 <div className="w-3/4 border-t border-[#333333] text-center pt-1"><span className="text-[8px]">Nombre completo de quien recibe la información</span></div>
              </div>
            </div>

            <div className="absolute bottom-6 left-0 right-0 text-center text-[7px] text-[#8C8A87] uppercase tracking-widest">Arienzo S.A.S. • Formulario Licitud de Fondos • Página 2 de 2</div>
          </div>
        </div>

      </div>
    </div>
  );
}