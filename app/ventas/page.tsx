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
  
  // Estado para controlar si ya se procesó la reserva y mostrar botones de impresión
  const [reservaExitosa, setReservaExitosa] = useState(false);
  const [codigoReserva, setCodigoReserva] = useState('');

  const RESERVA_FIJA = 2500;

  // --- DATOS DE RESPALDO CORREGIDOS ---
  const datosRespaldoClientes = [
    { id: 'cli-1', nombres: 'ANA MARIA', apellidos: 'CEVALLOS TRUJILLO', cedula: '1304681393', estado_civil: 'CASADA', email: 'mariacevallos@hotmail.com', direccion_domicilio: 'VIA SAN MATEO, URBANIZACION ALTOS MANTA BEACH, MZ B15, SOLAR 7', telefono: '0991234567', tipo: 'cliente' }
  ];
  const datosRespaldoPropiedades = [
    { id: 'prop-302', unidad: '302', precio_lista: 231044, area_total: 96.48, tipologia: '2 Dormitorios', estado: 'Disponible' }
  ];

  // --- FORMULARIO DE RESERVA ---
  const [reservaForm, setReservaForm] = useState({
    clienteId: '',
    propiedadId: '',
    montoReserva: 2500,
    formaPago: 'Transferencia Bancaria',
    bancoOrigen: '',
    numeroComprobante: '',
    fechaPago: new Date().toISOString().split('T')[0],
    observaciones: ''
  });

  // --- FORMULARIO PLAN DE PAGOS (CIERRE) ---
  const [planForm, setPlanForm] = useState({
    clienteId: '',
    propiedadId: '',
    precioLista: 0,
    precioCierre: 0,
    porcentajeInicial: 15,
    porcentajeDiferido: 25,
    mesesPlazo: 24,
    diaPagoFijo: 5,
    mesInicio: new Date().getMonth() + 1,
    anioInicio: new Date().getFullYear(),
    observaciones: '',
    departamentoNo: '',
    areaDpto: 0,
    terrazaA: 0,
    bodegaNo: '',
    parqueo1No: '',
    noDormitorios: 0,
    codigoInforme: '',
    vistaDetalle: ''
  });

  const [cuotasMensuales, setCuotasMensuales] = useState<Cuota[]>([]);

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

        if (errClis) console.error("Error cargando clientes:", errClis);

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

  // Al cambiar la unidad en la reserva, resetear el estado de éxito
  useEffect(() => {
    setReservaExitosa(false);
  }, [reservaForm.propiedadId]);

  // Convertir a String para igualar los IDs sin error de tipo
  useEffect(() => {
    const propIdActivo = reservaForm.propiedadId || planForm.propiedadId;
    if (!propIdActivo) return;
    
    const prop = propiedades.find(p => p.id.toString() === propIdActivo.toString());
    if (prop) {
      setPlanForm(prev => ({
        ...prev,
        propiedadId: propIdActivo,
        departamentoNo: prop.unidad || prop.numero || '---',
        areaDpto: prop.area_total || prop.area_interior || prop.area_dpto || 0,
        terrazaA: prop.terraza_a || 0,
        bodegaNo: prop.bodega_no || prop.bodega_asignada || 'N/A',
        parqueo1No: prop.parqueo1_no || prop.parqueadero_asignado || 'N/A',
        noDormitorios: prop.no_dormitorios || 0,
        precioLista: prop.precio_lista || prop.precio || 0,
        precioCierre: prev.precioCierre === 0 ? (prop.precio_lista || prop.precio || 0) : prev.precioCierre,
        vistaDetalle: prop.vista || 'Vista Estándar',
        codigoInforme: prev.codigoInforme || `AR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
      }));
    }
  }, [reservaForm.propiedadId, planForm.propiedadId, propiedades]);

  // OBJETO PROPIEDAD ACTIVA CORREGIDO PARA EL RECIBO
  const propiedadActiva = useMemo(() => {
    const targetId = reservaForm.propiedadId || planForm.propiedadId;
    if (!targetId) return null;
    return propiedades.find(p => p.id.toString() === targetId.toString());
  }, [propiedades, reservaForm.propiedadId, planForm.propiedadId]);

  const matrizFinanciera = useMemo(() => {
    const precio = planForm.precioCierre || 0;
    const inicialMonto = precio * (planForm.porcentajeInicial / 100);
    const saldoPromesaFirma = inicialMonto > reservaForm.montoReserva ? inicialMonto - reservaForm.montoReserva : 0;
    const diferidoObraMonto = precio * (planForm.porcentajeDiferido / 100);
    const porcentajeContraEntrega = 100 - planForm.porcentajeInicial - planForm.porcentajeDiferido;
    const contraEntregaMonto = precio * (porcentajeContraEntrega / 100);

    return { inicialMonto, saldoPromesaFirma, diferidoObraMonto, porcentajeContraEntrega, contraEntregaMonto };
  }, [planForm.precioCierre, planForm.porcentajeInicial, planForm.porcentajeDiferido, reservaForm.montoReserva]);

  useEffect(() => {
    if (matrizFinanciera.diferidoObraMonto <= 0 || planForm.mesesPlazo <= 0) {
      setCuotasMensuales([]);
      return;
    }

    const valorCuotaBase = matrizFinanciera.diferidoObraMonto / planForm.mesesPlazo;
    const mesesNombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    const cronograma = Array.from({ length: planForm.mesesPlazo }, (_, index) => {
      const mesRelativo = (planForm.mesInicio - 1) + index;
      const fechaCalculada = new Date(planForm.anioInicio, mesRelativo, planForm.diaPagoFijo);
      return {
        numero: index + 1,
        fecha: `${String(fechaCalculada.getDate()).padStart(2, '0')} de ${mesesNombres[fechaCalculada.getMonth()]} ${fechaCalculada.getFullYear()}`,
        monto: valorCuotaBase,
        esEditable: false
      };
    });
    setCuotasMensuales(cronograma);
  }, [matrizFinanciera.diferidoObraMonto, planForm.mesesPlazo, planForm.diaPagoFijo, planForm.mesInicio, planForm.anioInicio]);

  const clienteSeleccionado = clientes.find(c => c.id === (reservaForm.clienteId || planForm.clienteId));

  // --- FUNCIÓN 1: PROCESAR LA RESERVA ---
  const procesarReserva = async () => {
    if (!reservaForm.clienteId || !reservaForm.propiedadId || !reservaForm.montoReserva) {
      alert("Completar Cliente, Unidad y Monto para registrar la reserva.");
      return;
    }
    
    setGuardando(true);
    try {
      const { error: errorReserva } = await supabase.from('reservas').insert([{
        cliente_id: reservaForm.clienteId,
        propiedad_id: reservaForm.propiedadId,
        monto: reservaForm.montoReserva,
        forma_pago: reservaForm.formaPago,
        banco: reservaForm.bancoOrigen,
        comprobante: reservaForm.numeroComprobante,
        fecha_pago: reservaForm.fechaPago
      }]);

      if (errorReserva) throw errorReserva;

      const { error: errorProp } = await supabase
        .from('propiedades')
        .update({ estado: 'Reservado' })
        .eq('id', reservaForm.propiedadId);

      if (errorProp) throw errorProp;

      const codigoGenerado = `RES-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
      setCodigoReserva(codigoGenerado);
      setReservaExitosa(true);
      
    } catch (err: any) {
      alert(`Error al registrar: ${err.message}`);
    } finally {
      setGuardando(false);
    }
  };

  // --- FUNCIÓN 2: IMPRIMIR PAQUETE DE RESERVA (RECIBO + FICHA) ---
  const imprimirPaqueteReserva = () => {
    if (typeof window === 'undefined') return;
    const contenidoDocumentos = document.getElementById('documentos-reserva-impresion')?.innerHTML;

    if (!contenidoDocumentos) {
      alert("Error: Las plantillas no se cargaron correctamente.");
      return;
    }

    const ventanaImpresion = window.open('', '_blank');
    if (!ventanaImpresion) return;

    ventanaImpresion.document.write(`
      <html>
        <head>
          <title>Paquete_Reserva_${codigoReserva}</title>
          <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
          <style>
            @page { size: A4 portrait; margin: 0mm; }
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; margin: 0; padding: 0; background: #FCFBFA; font-family: ui-sans-serif, system-ui; color: #333333; }
            .pagina-a4 { width: 210mm; height: 297mm; padding: 18mm 20mm; box-sizing: border-box; page-break-after: always; overflow: hidden; background: #FCFBFA; position: relative; }
            .cuadro-input { border-bottom: 1px solid #8C8A87; min-height: 16px; display: inline-block; width: 100%; }
            .checkbox-box { width: 12px; height: 12px; border: 1px solid #8C8A87; display: inline-block; margin-right: 6px; vertical-align: middle; background: white; }
            .seccion-titulo { background-color: #F2EFEB; color: #B94A36; font-weight: bold; text-transform: uppercase; font-size: 9px; padding: 4px 8px; border-left: 3px solid #B94A36; margin-bottom: 8px; margin-top: 12px; letter-spacing: 0.05em; }
          </style>
        </head>
        <body>
          ${contenidoDocumentos}
          <script>
            setTimeout(() => { window.print(); window.close(); }, 700);
          </script>
        </body>
      </html>
    `);
    ventanaImpresion.document.close();
  };

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FCFBFA]">
        <p className="text-[10px] font-bold tracking-[0.2em] text-[#B94A36] uppercase animate-pulse">Sincronizando Sistema...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FCFBFA] text-[#333333] antialiased py-8 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* CABECERA CORPORATIVA PRINCIPAL */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#EAE3DC] pb-5 gap-4">
          <div>
            <span className="text-[9px] font-bold tracking-[0.4em] text-[#B94A36] uppercase block">Gestor Comercial Inmobiliario</span>
            <h1 className="text-2xl font-light mt-1">ARIENZO Boutique Living</h1>
          </div>

          <div className="flex bg-[#F2EFEB] p-1 rounded-xl w-full md:w-auto overflow-x-auto border border-[#EAE3DC]">
            <button onClick={() => setActiveTab('reserva')} className={`flex-1 md:flex-initial text-center px-6 py-2.5 text-[10px] font-bold tracking-wider uppercase rounded-lg transition-all whitespace-nowrap ${activeTab === 'reserva' ? 'bg-white text-[#B94A36] shadow-sm' : 'text-[#8C8A87] hover:text-[#333333]'}`}>
              1. Módulo de Reserva
            </button>
            <button onClick={() => setActiveTab('cierre_venta')} className={`flex-1 md:flex-initial text-center px-6 py-2.5 text-[10px] font-bold tracking-wider uppercase rounded-lg transition-all whitespace-nowrap ${activeTab === 'cierre_venta' ? 'bg-white text-[#B94A36] shadow-sm' : 'text-[#8C8A87] hover:text-[#333333]'}`}>
              2. Cierre y Venta Definitiva
            </button>
          </div>
        </div>

        {/* =========================================================================
            MÓDULO 1: RESERVA Y GENERACIÓN DE RECIBO
           ========================================================================= */}
        {activeTab === 'reserva' && (
          <div className="bg-white border border-[#EAE3DC] rounded-xl p-6 md:p-8 shadow-sm max-w-4xl mx-auto">
            
            <div className="mb-6 border-b border-[#EAE3DC] pb-4">
              <h3 className="text-sm font-bold text-[#333333] uppercase tracking-wider">Registro de Ingreso y Bloqueo de Inventario</h3>
              <p className="text-[11px] text-[#8C8A87] mt-1">Llene los datos de la transferencia para apartar la unidad comercialmente.</p>
            </div>

            <div className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#FCFBFA] p-5 rounded-lg border border-[#EAE3DC]">
                <div>
                  <label className="text-[10px] font-bold text-[#8C8A87] uppercase block mb-1.5">Cliente / Inversionista</label>
                  <select value={reservaForm.clienteId} onChange={(e) => setReservaForm({...reservaForm, clienteId: e.target.value})} className="w-full text-xs bg-white border border-[#EAE3DC] p-3 rounded-lg outline-none font-medium focus:border-[#B94A36]">
                    <option value="">-- Seleccionar de Cartera --</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nombres} {c.apellidos}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#8C8A87] uppercase block mb-1.5">Unidad a Bloquear</label>
                  <select value={reservaForm.propiedadId} onChange={(e) => setReservaForm({...reservaForm, propiedadId: e.target.value})} className="w-full text-xs bg-white border border-[#EAE3DC] p-3 rounded-lg outline-none font-medium focus:border-[#B94A36]">
                    <option value="">-- Seleccionar Inventario Disponible --</option>
                    {propiedades.map(p => <option key={p.id} value={p.id}>Unidad {p.unidad || p.numero} ({p.estado})</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                <div>
                  <label className="text-[10px] font-bold text-[#8C8A87] uppercase block mb-1.5">Valor Recibido ($)</label>
                  <input type="number" value={reservaForm.montoReserva} onChange={(e) => setReservaForm({...reservaForm, montoReserva: Number(e.target.value)})} className="w-full text-sm bg-white border border-[#EAE3DC] p-2.5 rounded-lg font-mono font-bold text-[#B94A36] outline-none focus:border-[#B94A36]" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#8C8A87] uppercase block mb-1.5">Método de Pago</label>
                  <select value={reservaForm.formaPago} onChange={(e) => setReservaForm({...reservaForm, formaPago: e.target.value})} className="w-full text-xs bg-white border border-[#EAE3DC] p-3 rounded-lg outline-none focus:border-[#B94A36]">
                    <option>Transferencia Bancaria</option>
                    <option>Depósito en Efectivo</option>
                    <option>Cheque</option>
                    <option>Tarjeta de Crédito</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#8C8A87] uppercase block mb-1.5">Banco Origen</label>
                  <input type="text" placeholder="Ej. Banco Pichincha" value={reservaForm.bancoOrigen} onChange={(e) => setReservaForm({...reservaForm, bancoOrigen: e.target.value})} className="w-full text-xs bg-white border border-[#EAE3DC] p-3 rounded-lg outline-none focus:border-[#B94A36]" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#8C8A87] uppercase block mb-1.5">Ref / Comprobante</label>
                  <input type="text" placeholder="N° Documento" value={reservaForm.numeroComprobante} onChange={(e) => setReservaForm({...reservaForm, numeroComprobante: e.target.value})} className="w-full text-xs bg-white border border-[#EAE3DC] p-3 rounded-lg outline-none font-mono focus:border-[#B94A36]" />
                </div>
              </div>

              {!reservaExitosa ? (
                <button onClick={procesarReserva} disabled={guardando} className="w-full bg-[#B94A36] text-white text-[11px] uppercase tracking-widest font-bold py-4 rounded-lg mt-4 shadow-sm hover:bg-[#9B3B2B] transition-colors disabled:opacity-50">
                  {guardando ? 'Verificando...' : 'Aplicar Ingreso y Bloquear Unidad'}
                </button>
              ) : (
                <div className="mt-6 bg-[#F2EFEB] p-5 rounded-lg border border-[#EAE3DC] flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <span className="text-[#B94A36] font-bold text-xs uppercase flex items-center gap-2">
                      <span>✓</span> Unidad Bloqueada Exitosamente
                    </span>
                    <p className="text-[11px] text-[#8C8A87] mt-1">Puede proceder a la impresión de los documentos iniciales.</p>
                  </div>
                  <button onClick={imprimirPaqueteReserva} className="w-full md:w-auto bg-[#333333] hover:bg-[#1a1a1a] text-white px-6 py-3 rounded-lg font-bold text-[10px] tracking-wider uppercase transition-colors shadow-sm">
                    🖨️ Generar Recibo y Formularios
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            MÓDULO 2: CIERRE DE VENTA (Futuro Desarrollo)
           ========================================================================= */}
        {activeTab === 'cierre_venta' && (
          <div className="bg-white border border-[#EAE3DC] rounded-xl p-10 shadow-sm text-center">
             <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#F2EFEB] mb-4">
               <span className="text-2xl">📝</span>
             </div>
             <h3 className="text-sm font-bold text-[#333333] uppercase tracking-wider mb-2">Módulo de Promesa y Expediente UAFE</h3>
             <p className="text-xs text-[#8C8A87] max-w-md mx-auto">
               Esta sección cargará las reservas activas para estructurar el plan de pagos final, los porcentajes diferidos y generar la documentación legal definitiva (PEP, Licitud de Fondos, etc).
             </p>
          </div>
        )}

        {/* =========================================================================
            PLANTILLAS OCULTAS PARA GENERACIÓN DE PDF (MODULO RESERVA)
           ========================================================================= */}
        <div id="documentos-reserva-impresion" className="hidden">
          
          {/* ----- HOJA 1: RECIBO DE CAJA (KONKERI S.A.S.) ----- */}
          <div className="pagina-a4">
            <div className="flex justify-between items-end border-b-2 border-[#B94A36] pb-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold tracking-widest text-[#B94A36] uppercase mb-1">KONKERI S.A.S.</h2>
                <p className="text-[8px] tracking-widest text-[#8C8A87] uppercase font-bold">RUC: 1391937895001</p>
              </div>
              <div className="text-right">
                <h1 className="text-lg font-light text-[#B94A36] tracking-widest uppercase">Recibo de Caja</h1>
                <p className="text-xs font-mono font-bold mt-1">N° {codigoReserva}</p>
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
                <span className="text-sm font-bold uppercase">{clienteSeleccionado?.nombres || ''} {clienteSeleccionado?.apellidos || ''}</span>
              </div>
              
              <div className="flex flex-col border-b border-[#EAE3DC] pb-4 mb-4">
                <span className="text-[10px] uppercase font-bold text-[#8C8A87] tracking-wider mb-2">Por Concepto de:</span>
                <span className="text-sm text-justify leading-relaxed mb-3">
                  Reserva y bloqueo comercial de la siguiente unidad perteneciente al Proyecto Inmobiliario "Arienzo Boutique Living", ubicado en el sector Barbasquillo, Manta.
                </span>
                
                <div className="grid grid-cols-4 gap-3 bg-[#FCFBFA] border border-[#EAE3DC] p-3 rounded-md">
                  <div>
                    <span className="text-[8px] uppercase font-bold text-[#8C8A87] block">Unidad Inm.</span>
                    <span className="text-xs font-bold text-[#333333]">{propiedadActiva?.unidad || propiedadActiva?.numero || planForm.departamentoNo}</span>
                  </div>
                  <div>
                    <span className="text-[8px] uppercase font-bold text-[#8C8A87] block">Nivel / Piso</span>
                    <span className="text-xs font-medium text-[#333333]">
                      {propiedadActiva?.piso || ((propiedadActiva?.unidad || propiedadActiva?.numero) ? `Piso ${(propiedadActiva?.unidad || propiedadActiva?.numero).toString().substring(0, 1)}` : 'N/A')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[8px] uppercase font-bold text-[#8C8A87] block">Tipología</span>
                    <span className="text-xs font-medium text-[#333333]">{propiedadActiva?.tipologia || propiedadActiva?.categoria || 'Departamento'}</span>
                  </div>
                  <div>
                    <span className="text-[8px] uppercase font-bold text-[#8C8A87] block">Área Útil</span>
                    <span className="text-xs font-medium text-[#333333]">{propiedadActiva?.area_total || propiedadActiva?.area_interior || propiedadActiva?.area_dpto || planForm.areaDpto} m²</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 bg-[#F2EFEB] p-4 rounded-md">
                <div>
                  <span className="text-[9px] uppercase font-bold text-[#8C8A87] block mb-1">Método:</span>
                  <span className="text-[11px] font-medium">{reservaForm.formaPago}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-[#8C8A87] block mb-1">Entidad Bancaria:</span>
                  <span className="text-[11px] font-medium">{reservaForm.bancoOrigen || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-[#8C8A87] block mb-1">Ref / Documento:</span>
                  <span className="text-[11px] font-mono font-medium">{reservaForm.numeroComprobante || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="mt-24 grid grid-cols-2 gap-16 px-12">
              <div className="text-center border-t border-[#8C8A87] pt-2">
                <p className="text-[9px] font-bold uppercase tracking-wider">{clienteSeleccionado?.nombres || 'Firma del Cliente'} {clienteSeleccionado?.apellidos || ''}</p>
                <p className="text-[8px] text-[#8C8A87]">C.C. {clienteSeleccionado?.cedula || clienteSeleccionado?.identificacion}</p>
              </div>
              <div className="text-center border-t border-[#8C8A87] pt-2">
                <p className="text-[9px] font-bold uppercase tracking-wider">Konkeri S.A.S.</p>
                <p className="text-[8px] text-[#8C8A87]">Recibí Conforme</p>
              </div>
            </div>
            
            <div className="absolute bottom-10 left-0 right-0 text-center text-[7px] text-[#8C8A87] uppercase tracking-widest">
              Konkeri S.A.S. • Promotora Inmobiliaria • Página 1 de 2
            </div>
          </div>

          {/* ----- HOJA 2: FORMULARIO DATOS CLIENTE (VACÍO PARA LLENAR A MANO) ----- */}
          <div className="pagina-a4">
            <div className="flex justify-between items-end border-b-2 border-[#B94A36] pb-2 mb-4">
              <div>
                <h1 className="text-xl font-light tracking-widest text-[#B94A36] uppercase">Arienzo</h1>
                <p className="text-[7px] tracking-widest text-[#8C8A87] uppercase mt-0.5">Boutique Living</p>
              </div>
              <div className="text-right">
                <h2 className="text-[11px] font-bold uppercase tracking-wide">Formulario Datos Cliente</h2>
                <p className="text-[9px] text-[#8C8A87] uppercase mt-0.5">Persona Natural</p>
              </div>
            </div>

            {/* DATOS PERSONALES */}
            <div className="seccion-titulo">Datos Personales</div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-[8px] mb-6">
              <div className="col-span-2 flex items-center">
                <span className="w-20">NOMBRES:</span> <span className="cuadro-input"></span>
              </div>
              <div className="col-span-2 flex items-center">
                <span className="w-20">APELLIDOS:</span> <span className="cuadro-input"></span>
              </div>
              
              <div className="flex items-center">
                <span className="w-40">NUMERO CEDULA / PASAPORTE:</span> <span className="cuadro-input"></span>
              </div>
              <div className="flex items-center gap-2">
                <span>ESTADO CIVIL:</span> <span className="cuadro-input w-20 text-center"></span>
              </div>
              
              <div className="col-span-2 flex items-center gap-4 text-[7.5px] mt-1">
                <span className="checkbox-box"></span> CAPITULACIONES MATRIMONIALES
                <span className="checkbox-box ml-4"></span> DISOLUCION SOCIEDAD CONYUGAL
              </div>

              <div className="flex items-center gap-2 mt-2">
                <span>FECHA DE NACIMIENTO:</span>
                DIA: <span className="cuadro-input w-6 text-center"></span> 
                MES: <span className="cuadro-input w-6 text-center"></span> 
                AÑO: <span className="cuadro-input w-8 text-center"></span>
              </div>
              <div className="flex items-center mt-2">
                <span className="w-24">NACIONALIDAD:</span> <span className="cuadro-input uppercase"></span>
              </div>

              <div className="flex items-center">
                <span className="w-40">DIA DE PAGO: <span className="font-bold underline px-2">___</span> DE CADA MES</span>
              </div>
              <div className="flex items-center">
                <span className="w-40">NUMERO CARGAS FAMILIARES:</span> <span className="cuadro-input text-center"></span>
              </div>

              <div className="col-span-2 flex items-center">
                <span className="w-32">CORREO PERSONAL:</span> <span className="cuadro-input lowercase text-[9px]"></span>
              </div>
              <div className="col-span-2 flex items-center">
                <span className="w-32">CIUDAD DE RESIDENCIA:</span> <span className="cuadro-input uppercase"></span>
              </div>

              <div className="col-span-2 flex items-start mt-1">
                <span className="w-40 leading-tight">DIRECCION DOMICILIO:<br/><span className="text-[6px] text-[#8C8A87]">(lo mas detallada posible)</span></span> 
                <span className="cuadro-input uppercase text-[8px] pt-1"></span>
              </div>

              <div className="flex items-center">
                <span className="w-32">TELEFONO DOMICILIO:</span> <span className="cuadro-input"></span>
              </div>
              <div className="flex items-center">
                <span className="w-20">CELULAR:</span> <span className="cuadro-input font-mono"></span>
              </div>

              <div className="col-span-2 flex items-center mt-2">
                <span className="w-40">EMPRESA EN LA QUE TRABAJA:</span> <span className="cuadro-input uppercase"></span>
              </div>
              <div className="col-span-2 flex items-start">
                <span className="w-40 leading-tight">DIRECCION DE TRABAJO:<br/><span className="text-[6px] text-[#8C8A87]">(lo mas detallada posible)</span></span> 
                <span className="cuadro-input pt-1"></span>
              </div>

              <div className="flex items-center">
                <span className="w-32">TELEFONO TRABAJO:</span> <span className="cuadro-input"></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-8">PAIS:</span> <span className="cuadro-input uppercase"></span>
              </div>
              
              <div className="col-span-2 flex items-center">
                <span className="w-48">CORREO ELECTRONICO TRABAJO:</span> <span className="cuadro-input lowercase"></span>
              </div>

              <div className="col-span-2 flex items-center gap-4 mt-2">
                <span>DIRECCION PARA ENVIO CORRESPONDENCIA:</span>
                <span className="checkbox-box"></span> DOMICILIO
                <span className="checkbox-box"></span> TRABAJO
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-[8px] mb-6">
              <div className="col-span-2 flex items-center"><span className="w-48">EMITIR CONTRATO A NOMBRE DE:</span> <span className="cuadro-input uppercase"></span></div>
              <div className="col-span-2 flex items-start mt-1">
                <span className="w-48 leading-tight">BANCO PARA PRECALIFICACION:<br/><span className="text-[6px] text-[#8C8A87]">(en caso de solicitar credito Bancario)</span></span>
                <span className="cuadro-input pt-1 uppercase"></span>
              </div>
            </div>

            {/* DATOS DEL CONYUGE */}
            <div className="seccion-titulo">Datos del Cónyuge</div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-[8px] mb-8">
              <div className="flex items-center"><span className="w-16">NOMBRES:</span> <span className="cuadro-input uppercase"></span></div>
              <div className="flex items-center"><span className="w-16">APELLIDO:</span> <span className="cuadro-input uppercase"></span></div>
              <div className="flex items-center"><span className="w-24">NUMERO DE CEDULA:</span> <span className="cuadro-input font-mono"></span></div>
              <div className="flex items-center gap-2">
                <span>FECHA DE NACIMIENTO:</span>
                DIA:<span className="cuadro-input w-4 text-center"></span> 
                MES:<span className="cuadro-input w-4 text-center"></span> 
                AÑO:<span className="cuadro-input w-6 text-center"></span>
              </div>
              <div className="flex items-center"><span className="w-12">EDAD:</span> <span className="cuadro-input"></span></div>
              <div className="flex items-center"><span className="w-24">NACIONALIDAD:</span> <span className="cuadro-input uppercase"></span></div>
              <div className="col-span-2 flex items-center"><span className="w-40">EMPRESA EN LA QUE TRABAJA:</span> <span className="cuadro-input uppercase"></span></div>
              <div className="col-span-2 flex items-center"><span className="w-32">DIRECCION DE TRABAJO:</span> <span className="cuadro-input uppercase"></span></div>
              <div className="flex items-center"><span className="w-32">TELEFONO TRABAJO:</span> <span className="cuadro-input font-mono"></span></div>
              <div className="flex items-center"><span className="w-16">CELULAR:</span> <span className="cuadro-input font-mono"></span></div>
              <div className="col-span-2 flex items-center"><span className="w-32">CORREO ELECTRONICO:</span> <span className="cuadro-input lowercase"></span></div>
            </div>

            {/* FIRMA FINAL */}
            <div className="mt-12 flex justify-center">
              <div className="text-center w-64 border-t border-[#8C8A87] pt-2">
                <p className="text-[9px] font-bold tracking-wider">FIRMA CLIENTE</p>
              </div>
            </div>

            <div className="absolute bottom-6 left-0 right-0 text-center text-[7px] text-[#8C8A87] uppercase tracking-widest">
              Arienzo Boutique Living • Barbasquillo, Manta • Página 2 de 2
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}