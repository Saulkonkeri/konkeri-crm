'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

const PISOS_EDIFICIO = [6, 5, 4, 3, 2];

// INVENTARIO DE RESPALDO (PLAN B por si falla el internet o Supabase)
const INVENTARIO_FALLBACK = [
  { id: '604', piso: 6, tipo: '2 Dormitorios', vista: 'Wyndham Poseidón / Mar', precio: 205865, area: 106.65, estado: 'RESERVADO' },
  { id: '603', piso: 6, tipo: '3 Dorms (Esquinero)', vista: 'Panorámica a La Quadra / Umiña / Mar', precio: 293967, area: 152.72, estado: 'DISPONIBLE' },
  { id: '602', piso: 6, tipo: '1 Dormitorio', vista: 'La Quadra / Umiña / Mar', precio: 169369, area: 86.60, estado: 'DISPONIBLE' },
  { id: '601', piso: 6, tipo: '3 Dormitorios', vista: 'La Quadra / Umiña / Mar', precio: 308760, area: 158.54, estado: 'RESERVADO' },
  { id: '504', piso: 5, tipo: '2 Dormitorios', vista: 'Wyndham Poseidón / Mar', precio: 201794, area: 106.65, estado: 'RESERVADO' },
  { id: '503', piso: 5, tipo: '3 Dorms (Esquinero)', vista: 'Panorámica a La Quadra / Umiña / Mar', precio: 290840, area: 152.72, estado: 'DISPONIBLE' },
  { id: '502', piso: 5, tipo: '1 Dormitorio', vista: 'La Quadra / Umiña / Mar', precio: 165702, area: 86.60, estado: 'DISPONIBLE' },
  { id: '501', piso: 5, tipo: '3 Dormitorios', vista: 'La Quadra / Umiña / Mar', precio: 303228, area: 158.54, estado: 'DISPONIBLE' },
  { id: '404', piso: 4, tipo: '2 Dormitorios', vista: 'Wyndham Poseidón / Mar', precio: 199677, area: 106.65, estado: 'DISPONIBLE' },
  { id: '403', piso: 4, tipo: '3 Dorms (Esquinero)', vista: 'Panorámica a La Quadra / Umiña / Mar', precio: 287042, area: 152.72, estado: 'DISPONIBLE' },
  { id: '402', piso: 4, tipo: '1 Dormitorio', vista: 'La Quadra / Umiña / Mar', precio: 163257, area: 86.60, estado: 'DISPONIBLE' },
  { id: '401', piso: 4, tipo: '3 Dormitorios', vista: 'La Quadra / Umiña / Mar', precio: 299079, area: 158.54, estado: 'RESERVADO' },
  { id: '301', piso: 3, tipo: '1 Dormitorio', vista: 'Urbanización', precio: 131529, area: 70.25, estado: 'DISPONIBLE' },
  { id: '305', piso: 3, tipo: '1 Dormitorio', vista: 'Wyndham Poseidón / Mar', precio: 152779, area: 78.87, estado: 'DISPONIBLE' },
  { id: '304', piso: 3, tipo: '3 Dorms (Esquinero)', vista: 'Panorámica a La Quadra / Umiña / Mar', precio: 284732, area: 152.68, estado: 'DISPONIBLE' },
  { id: '303', piso: 3, tipo: '1 Dormitorio', vista: 'La Quadra / Umiña / Mar', precio: 161128, area: 86.76, estado: 'DISPONIBLE' },
  { id: '302', piso: 3, tipo: '2 Dormitorios', vista: 'La Quadra / Umiña / Mar', precio: 221487, area: 121.61, estado: 'DISPONIBLE' },
  { id: '201', piso: 2, tipo: '1 Dormitorio', vista: 'Urbanización', precio: 130981, area: 70.25, estado: 'DISPONIBLE' },
  { id: '205', piso: 2, tipo: '1 Dormitorio', vista: 'Wyndham Poseidón / Mar', precio: 151259, area: 78.87, estado: 'DISPONIBLE' },
  { id: '204', piso: 2, tipo: '3 Dorms (Esquinero)', vista: 'Panorámica a La Quadra / Umiña / Mar', precio: 281458, area: 152.72, estado: 'DISPONIBLE' },
  { id: '203', piso: 2, tipo: '1 Dormitorio', vista: 'La Quadra / Umiña / Mar', precio: 159095, area: 86.66, estado: 'RESERVADO' },
  { id: '202', piso: 2, tipo: '2 Dormitorios', vista: 'La Quadra / Umiña / Mar', precio: 218918, area: 121.61, estado: 'DISPONIBLE' },
];

const LAYOUT_FACHADA: Record<number, string[]> = {
  6: ['604', '603', '602', '601'],
  5: ['504', '503', '502', '501'],
  4: ['404', '403', '402', '401'],
  3: ['301', '305', '304', '303', '302'],
  2: ['201', '205', '204', '203', '202'],
};

// GALERÍA DE VISTAS EXTERNAS
const FOTOS_VISTAS: Record<string, { titulo: string, url: string }> = {
  'urb': { titulo: 'Vista a la Urbanización', url: 'https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/vistas%20arienzo/vista%20a%20la%20urbanizacion%20(1).jpg' },
  'wyndham': { titulo: 'Vista Lateral', url: 'https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/vistas%20arienzo/vista%20a%20mikonos.jpg' },
  'panoramica': { titulo: 'Vista Panorámica Frontal', url: 'https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/vistas%20arienzo/vista%20principal%20(1).jpg' }
};

const obtenerKeyVista = (unidad: any) => {
  if (!unidad) return 'panoramica';
  const idUnidad = String(unidad.id);
  
  if (['604', '504', '404', '305', '205'].includes(idUnidad)) {
    return 'wyndham';
  }

  const vistaText = String(unidad.vista || '').toLowerCase();
  if (vistaText.includes('urbanización') || vistaText.includes('urb')) return 'urb';
  if (vistaText.includes('wyndham') || vistaText.includes('lateral')) return 'wyndham';
  
  return 'panoramica';
};

const obtenerUrlPlano = (area: number) => {
  if (area < 75) return 'https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/Planos%20departamentos/Suite%2070,25m2.png?v=2'; 
  if (area >= 75 && area < 82) return 'https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/Planos%20departamentos/Suite%2078,87m2.png?v=2'; 
  if (area >= 82 && area < 100) return 'https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/Planos%20departamentos/Suite%2086,60m2.png?v=2'; 
  if (area >= 100 && area < 115) return 'https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/Planos%20departamentos/2%20dormitorios%20106,65.png?v=2'; 
  if (area >= 115 && area < 135) return 'https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/Planos%20departamentos/2%20dormitorios%20121,61m2.png?v=2'; 
  if (area >= 135 && area < 155) return 'https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/Planos%20departamentos/3%20dormitorios%20152,72m2.png?v=2'; 
  if (area >= 155) return 'https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/Planos%20departamentos/3%20dormitorios%20158,54m2.png?v=2'; 
  return null;
};

const traducirTipologia = (tipologiaDB: string) => {
  const t = String(tipologiaDB || '').toLowerCase();
  if (t.includes('suite') || t.includes('1 dorm')) return '1 Dormitorio';
  if (t.includes('2 dorm')) return '2 Dormitorios';
  if (t.includes('3 dorm')) return '3 Dormitorios';
  return tipologiaDB;
};

const PlanIcon = () => (
  <svg className="w-5 h-5 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 4v16h16V4H4zm4 0v16m8-16v16M4 12h16" /></svg>
);

const ViewIcon = () => (
  <svg className="w-5 h-5 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
);

const ChatIcon = () => (
  <svg className="w-5 h-5 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
);

export default function ReservaExpressPage() {
  const [paso, setPaso] = useState<'acceso' | 'filtro' | 'mapa' | 'formulario' | 'exito'>('acceso');
  const [inventario, setInventario] = useState<any[]>(INVENTARIO_FALLBACK); 
  const [sessionId, setSessionId] = useState('');

  const [emailAcceso, setEmailAcceso] = useState('');
  const [cargandoAcceso, setCargandoAcceso] = useState(false);
  const [errorAcceso, setErrorAcceso] = useState('');

  const [filtroTipo, setFiltroTipo] = useState<string | null>(null);
  const [unidadSeleccionada, setUnidadSeleccionada] = useState<any>(null);
  
  const [vistaActiva, setVistaActiva] = useState<string | null>(null);
  const [planoUrlActivo, setPlanoUrlActivo] = useState<string | null>(null);

  const [formData, setFormData] = useState({ nombres: '', cedula: '', email: '', telefono: '' });
  const [cargandoReserva, setCargandoReserva] = useState(false);

  // Generar ID de Sesión Anónima al Cargar
  useEffect(() => {
    const id = localStorage.getItem('arienzo_session_id') || `sess_${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem('arienzo_session_id', id);
    setSessionId(id);
    registrarAccionInicial('VISITA_LANDING', 'Ingresó al Inventario VIP');
  }, []);

  const registrarAccionInicial = async (accion: string, detalleAdicional?: string) => {
    try {
      await supabase.from('tracking_inventario').insert([{
        session_id: sessionId || 'sess_init',
        accion: accion,
        detalle: detalleAdicional || null,
        metadata: { url: window.location.href }
      }]);
    } catch (error) { console.error("Error en radar:", error); }
  };

  const registrarAccion = async (accion: string, idUnidad?: string, detalleAdicional?: string) => {
    const correoActivo = formData.email || emailAcceso || null;
    try {
      await supabase.from('tracking_inventario').insert([{
        session_id: sessionId,
        email_cliente: correoActivo,
        accion: accion,
        unidad_id: idUnidad || null,
        detalle: detalleAdicional || null
      }]);
    } catch (error) {
      console.error("Error en radar:", error);
    }
  };

  const calcularM2Lanzamiento = useMemo(() => {
    if (!unidadSeleccionada) return 0;
    const is3Dorm = (unidadSeleccionada.tipo || '').includes('3 Dorm');
    const valorAnexosDesc = is3Dorm ? 19000 : 10450; 
    const precioSoloDepto = Math.max(0, (unidadSeleccionada.precio || 0) - valorAnexosDesc);
    const precioM2 = (unidadSeleccionada.area || 0) > 0 ? precioSoloDepto / unidadSeleccionada.area : 0;
    return precioM2;
  }, [unidadSeleccionada]);

  const cargarInventarioEnTiempoReal = async () => {
    try {
      const { data, error } = await supabase.from('propiedades').select('*');
      if (error) throw error;
      
      if (data && data.length > 0) {
        const inventarioTraducido = data.map(item => {
          const idUnidad = String(item.unidad || item.id);
          const fallbackData = INVENTARIO_FALLBACK.find(f => f.id === idUnidad);
          const areaEncontrada = item.area_total || item.area || item.area_util || item.m2 || item.area_m2 || item.metraje || item.superficie || fallbackData?.area || 0;
          const vistaEncontrada = item.vista || item.orientacion || fallbackData?.vista || 'Por definir';
          const precioEncontrado = item.precio || item.precio_total || item.precio_lista || fallbackData?.precio || 0;

          return {
            ...item,
            id: idUnidad,
            tipo: traducirTipologia(item.tipologia || item.tipo || fallbackData?.tipo || ''),
            estado: item.estado ? String(item.estado).toUpperCase().trim() : 'DISPONIBLE',
            precio: Number(precioEncontrado),
            area: Number(areaEncontrada),
            vista: vistaEncontrada
          };
        });
        setInventario(inventarioTraducido);
      }
    } catch (err) {
      console.error("❌ Usando Fallback. Error con Supabase:", err);
    }
  };

  useEffect(() => {
    cargarInventarioEnTiempoReal();
  }, []);

  const notificarIngresoSilencioso = async (email: string) => {
    try {
      fetch('/api/notificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: "ingreso_vip",
          datos: { email: email, fecha: new Date().toLocaleString('es-EC') }
        })
      }).catch(() => {});
    } catch (e) {}
  };

  const verificarAcceso = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargandoAcceso(true);
    setErrorAcceso('');
    const correoLimpio = emailAcceso.trim().toLowerCase();

    try {
      const { data, error } = await supabase.from('accesos_inventario').select('expira_en').eq('email', correoLimpio).single();
      if (error || !data) { 
        setErrorAcceso('Este correo no cuenta con una invitación activa.'); 
        setCargandoAcceso(false); 
        registrarAccion('INTENTO_FALLIDO_ACCESO', undefined, `Correo no autorizado: ${correoLimpio}`);
        return; 
      }
      const ahora = new Date();
      if (ahora > new Date(data.expira_en)) { 
        setErrorAcceso('Tu invitación ha expirado.'); 
        setCargandoAcceso(false); 
        registrarAccion('INTENTO_FALLIDO_ACCESO', undefined, `Pase caducado: ${correoLimpio}`);
        return; 
      }
      
      setFormData({ ...formData, email: correoLimpio });
      setPaso('filtro');
      
      notificarIngresoSilencioso(correoLimpio);
      registrarAccion('INGRESO_EXITOSO_INVENTARIO', undefined, `Logueado exitosamente como: ${correoLimpio}`);
      
    } catch (err) { setErrorAcceso('Ocurrió un error al verificar.'); }
    setCargandoAcceso(false);
  };

  const procesarReserva = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargandoReserva(true);
    try {
      registrarAccion('RESERVA_COMPLETADA', unidadSeleccionada?.id, `Reserva web generada a nombre de ${formData.nombres}`);
      
      await fetch('/api/notificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: "reserva",
          datos: {
            nombres: formData.nombres, cedula: formData.cedula, telefono: formData.telefono, email: formData.email,
            unidadId: unidadSeleccionada.id, tipoUnidad: unidadSeleccionada.tipo, precio: unidadSeleccionada.precio.toLocaleString('en-US')
          }
        })
      });
    } catch (error) {}
    setCargandoReserva(false);
    setPaso('exito');
  };

  const seleccionarFiltro = (tipo: string) => { 
    setFiltroTipo(tipo); 
    setPaso('mapa'); 
    registrarAccion('USO_FILTRO', undefined, `Buscó tipología: ${tipo}`);
  };

  const obtenerDatosUnidad = (idBuscado: string | null) => {
    if (!idBuscado) return null;
    return inventario.find(u => String(u.id) === idBuscado) || null;
  };

  const contactarAsesor = () => {
    registrarAccion('CLIC_WHATSAPP', unidadSeleccionada?.id, 'Intentó contactar al asesor por WhatsApp');
    const telefonoDebbi = "593979469472"; 
    const mensaje = `Hola Debbi, estoy revisando el inventario VIP y me interesa cotizar la *Unidad ${unidadSeleccionada?.id}* (${unidadSeleccionada?.tipo}). ¿Podemos conversar?`;
    window.open(`https://wa.me/${telefonoDebbi}?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  const enviarNotificacionReservaWhatsApp = () => {
    registrarAccion('CLIC_WHATSAPP_NOTIFICAR_RESERVA', unidadSeleccionada?.id, 'Avisó a asesor por WhatsApp sobre el bloqueo');
    const telefonoDebbi = "593979469472"; 
    const mensaje = `🚨 *¡NUEVA RESERVA EN LÍNEA (Soft Block)!* 🚨\n\nEl cliente *${formData.nombres}* acaba de realizar una solicitud de bloqueo web:\n\n🏢 *Unidad:* ${unidadSeleccionada?.id} (${unidadSeleccionada?.tipo})\n💵 *Precio:* $${unidadSeleccionada?.precio.toLocaleString('en-US')}\n🆔 *Cédula:* ${formData.cedula}\n📱 *WhatsApp:* ${formData.telefono}\n📧 *Email:* ${formData.email}\n\n¡Comunícate con el cliente y valida el pago de $2,500 para bloquear oficialmente la unidad en el CRM!`;
    window.open(`https://wa.me/${telefonoDebbi}?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  return (
    <div className="min-h-[100dvh] bg-[#F9F7F5] font-sans relative text-[#415364] flex flex-col items-center">
      
      {/* HEADER: Aumento de Padding para que no roce */}
      {paso !== 'acceso' && (
        <header className="bg-white border-b border-neutral-200 w-full px-6 py-6 md:py-6 sticky top-0 z-40 flex justify-center shadow-sm">
          <div className="text-center cursor-pointer flex justify-center items-center hover:opacity-80 transition-opacity duration-300" onClick={() => setPaso('filtro')}>
            <img 
              src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/arienzo-logo-terracota.svg" 
              alt="Arienzo Boutique Living" 
              className="h-6 md:h-8 w-auto"
            />
          </div>
        </header>
      )}

      <main className="w-full max-w-5xl px-3 md:px-4 mt-6 md:mt-10 pb-20 flex flex-col items-center flex-1">
        
        {/* CAJA DE ACCESO VIP: Logo más pequeño */}
        {paso === 'acceso' && (
          <div className="min-h-[80vh] flex flex-col items-center justify-center w-full animate-in fade-in duration-700">
            <div className="bg-white p-8 md:p-12 rounded-2xl border border-neutral-200 shadow-xl max-w-md w-full text-center relative overflow-hidden mx-auto">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-[#964B36]"></div>
              
              <div className="flex justify-center mt-2 mb-8">
                <img 
                  src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/arienzo-logo-terracota.svg" 
                  alt="Arienzo" 
                  className="h-8 md:h-10 w-auto" 
                />
              </div>
              
              <h2 className="text-2xl font-bold text-[#21242E] mb-2 tracking-tight">Acceso Exclusivo</h2>
              <p className="text-xs text-[#415364]/70 mb-8 px-2 font-medium">Ingresa tu correo electrónico autorizado para visualizar la disponibilidad y precios en tiempo real.</p>
              
              <form onSubmit={verificarAcceso} className="space-y-5">
                <div>
                  <input 
                    type="email" 
                    required 
                    value={emailAcceso} 
                    onChange={(e) => setEmailAcceso(e.target.value)} 
                    placeholder="tucorreo@ejemplo.com" 
                    className="w-full bg-[#F9F7F5] border border-neutral-200 rounded-xl p-4 text-[16px] font-medium text-center focus:outline-none focus:border-[#964B36] focus:ring-1 focus:ring-[#964B36]/20 transition-all text-[#415364]" 
                  />
                </div>
                {errorAcceso && <p className="text-xs font-bold text-[#964B36] bg-[#964B36]/5 py-2.5 rounded-lg border border-[#964B36]/20">{errorAcceso}</p>}
                
                <button type="submit" disabled={cargandoAcceso} className="w-full bg-[#21242E] text-white font-bold uppercase tracking-widest text-[16px] md:text-sm py-4 rounded-xl hover:bg-black transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed">
                  {cargandoAcceso ? 'Verificando...' : 'Acceder al Inventario'}
                </button>
              </form>
            </div>
          </div>
        )}

        {paso === 'filtro' && (
          <div className="w-full max-w-xl mx-auto text-center space-y-8 animate-in zoom-in-95 duration-500 mt-4 md:mt-10">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-[#21242E] mb-2 tracking-tight">Selecciona la tipología.</h2>
              <p className="text-sm font-medium text-[#415364]/70">Indícanos qué distribución se adapta mejor a tu estilo de vida.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-2">
              <button onClick={() => seleccionarFiltro('1 Dormitorio')} className="bg-white border border-neutral-200 p-6 md:p-8 rounded-2xl shadow-sm hover:border-[#964B36] hover:shadow-md transition-all group flex flex-col items-center justify-center gap-3 w-full">
                <span className="w-10 h-10 rounded-full bg-[#964B36]/5 text-[#964B36] flex items-center justify-center group-hover:bg-[#964B36] group-hover:text-white transition-colors">1</span>
                <h3 className="text-[16px] md:text-sm font-bold text-[#415364] uppercase tracking-widest group-hover:text-[#964B36] transition-colors">Dormitorio</h3>
              </button>
              <button onClick={() => seleccionarFiltro('2 Dormitorios')} className="bg-white border border-neutral-200 p-6 md:p-8 rounded-2xl shadow-sm hover:border-[#D1C292] hover:shadow-md transition-all group flex flex-col items-center justify-center gap-3 w-full">
                <span className="w-10 h-10 rounded-full bg-[#D1C292]/10 text-[#D1C292] flex items-center justify-center group-hover:bg-[#D1C292] group-hover:text-white transition-colors">2</span>
                <h3 className="text-[16px] md:text-sm font-bold text-[#415364] uppercase tracking-widest group-hover:text-[#D1C292] transition-colors">Dormitorios</h3>
              </button>
              <button onClick={() => seleccionarFiltro('3 Dormitorios')} className="bg-white border border-neutral-200 p-6 md:p-8 rounded-2xl shadow-sm hover:border-[#21242E] hover:shadow-md transition-all group flex flex-col items-center justify-center gap-3 w-full">
                <span className="w-10 h-10 rounded-full bg-[#21242E]/5 text-[#21242E] flex items-center justify-center group-hover:bg-[#21242E] group-hover:text-white transition-colors">3</span>
                <h3 className="text-[16px] md:text-sm font-bold text-[#415364] uppercase tracking-widest group-hover:text-[#21242E] transition-colors">Dormitorios</h3>
              </button>
            </div>
          </div>
        )}

        {/* MAPA E INVENTARIO CON CUADRÍCULA ESTILIZADA (Evitando auto-zoom móvil) */}
        {paso === 'mapa' && (
          <div className="space-y-4 md:space-y-4 animate-in slide-in-from-bottom-8 duration-500 w-full max-w-5xl mx-auto flex flex-col items-center">
            
            <div className="flex flex-col md:flex-row w-full md:justify-between items-center md:items-end px-2 gap-3 mb-2">
              <div className="w-full text-center md:text-left">
                <button onClick={() => setPaso('filtro')} className="text-[12px] md:text-[10px] font-bold text-[#415364]/50 uppercase tracking-widest mb-2 hover:text-[#964B36] flex items-center justify-center md:justify-start gap-1 transition-colors w-full md:w-auto">← Cambiar Tipología</button>
                <h2 className="text-2xl md:text-2xl font-bold text-[#21242E] tracking-tight">Inventario: {filtroTipo?.replace('s (Esquinero)', 's')}</h2>
              </div>
              <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-neutral-200 shadow-sm w-full sm:w-auto justify-center mx-auto md:mx-0">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 bg-white border-2 border-[#964B36]/80 rounded-sm"></span>
                  <span className="text-[11px] md:text-[10px] font-bold text-[#415364] uppercase tracking-widest">Disponible</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-3 md:p-6 rounded-2xl md:rounded-3xl border border-neutral-200 shadow-lg relative w-full overflow-hidden">
              <div className="flex flex-col w-full">
                
                {/* ROOFTOP */}
                <div className="flex items-stretch gap-1 md:gap-2 mb-2 w-full">
                  <div className="w-14 min-w-[3.5rem] md:w-20 md:min-w-[5rem] shrink-0 text-[8px] md:text-[10px] font-bold text-[#415364]/50 uppercase tracking-widest flex items-center justify-end pr-2 md:pr-4">Cima</div>
                  <div className="flex-1 bg-[#D1C292]/10 border border-[#D1C292]/40 p-2 md:p-3 rounded-t-xl text-center flex items-center justify-center">
                    <span className="text-[8px] md:text-[10px] font-bold text-[#8A7A55] uppercase tracking-widest">Rooftop & Amenidades Exclusivas</span>
                  </div>
                </div>

                {/* VISTAS */}
                <div className="flex items-stretch gap-1 md:gap-2 mb-3 md:mb-4 w-full">
                  <div className="w-14 min-w-[3.5rem] md:w-20 md:min-w-[5rem] shrink-0 flex flex-col justify-center pr-2 md:pr-4">
                    <span className="text-[8px] md:text-[10px] font-bold text-[#415364]/50 uppercase tracking-widest text-right leading-tight">Vistas</span>
                  </div>
                  <div className="flex-1 grid grid-cols-[4fr_4fr_10fr_5fr_9fr] gap-1 md:gap-2">
                    <button onClick={() => {setVistaActiva('urb'); registrarAccion('VIO_VISTA_GENERAL', undefined, 'Vio vista general a la Urbanización');}} className="col-span-1 bg-[#F9F7F5] hover:bg-neutral-100 shadow-sm rounded-lg py-1.5 md:py-2 px-1 flex flex-col items-center justify-center border border-neutral-200 transition-colors group">
                      <span className="text-[6px] md:text-[8px] font-bold uppercase tracking-widest text-[#415364]/70 group-hover:text-neutral-800 text-center leading-tight">A la<br/>Urb.</span>
                    </button>
                    <button onClick={() => {setVistaActiva('wyndham'); registrarAccion('VIO_VISTA_GENERAL', undefined, 'Vio vista general al Wyndham');}} className="col-span-1 bg-sky-50/70 hover:bg-sky-100 shadow-sm rounded-lg py-1.5 md:py-2 px-1 flex flex-col items-center justify-center border border-sky-200 transition-colors group">
                      <span className="text-[6px] md:text-[8px] font-bold uppercase tracking-widest text-sky-700 group-hover:text-sky-900 text-center leading-tight">Wyndham<br/>/ Mar</span>
                    </button>
                    <button onClick={() => {setVistaActiva('panoramica'); registrarAccion('VIO_VISTA_GENERAL', undefined, 'Vio vista Panorámica Frontal');}} className="col-span-3 bg-[#964B36]/5 hover:bg-[#964B36]/15 shadow-sm rounded-lg py-1.5 md:py-2 px-1 flex flex-col items-center justify-center border border-[#964B36]/30 transition-colors group">
                      <span className="text-[7px] md:text-[9px] font-bold uppercase tracking-widest text-[#964B36] text-center leading-tight">Vista Panorámica Frontal<br/><span className="text-[5px] md:text-[7px] opacity-70 mt-0.5 inline-block">La Quadra / Umiña / Mar</span></span>
                    </button>
                  </div>
                </div>

                {/* PISOS */}
                {PISOS_EDIFICIO.map(piso => (
                  <div key={piso} className="flex items-stretch gap-1 md:gap-2 mb-1.5 md:mb-2 w-full">
                    {/* ALINEACIÓN ESTRICTA COLUMNA IZQUIERDA Y TEXTO CLARO */}
                    <div className="w-14 min-w-[3.5rem] md:w-20 md:min-w-[5rem] shrink-0 flex items-center justify-end pr-2 md:pr-4 text-[9px] md:text-[11px] font-bold text-[#415364]/70 uppercase tracking-widest">Piso {piso}</div>
                    
                    <div className="flex-1 grid gap-1 md:gap-2 grid-cols-[4fr_4fr_10fr_5fr_9fr]">
                      {LAYOUT_FACHADA[piso].map((idUnidad, colIndex) => {
                        if (!idUnidad) return <div key={`empty-${piso}-${colIndex}`} className="invisible"></div>;
                        const unidad = obtenerDatosUnidad(idUnidad);
                        
                        if (!unidad) return <div key={`notfound-${idUnidad}`} className="invisible"></div>;

                        const noCoincide = unidad.tipo !== filtroTipo;
                        const reservado = unidad.estado === 'RESERVADO' || unidad.estado === 'VENDIDO' || unidad.estado === 'BLOQUEADO' || unidad.estado === 'SEPARADO';
                        const desactivado = noCoincide || reservado;
                        
                        // Si está desactivada, usamos opacity en vez de fondo para que el edificio respire
                        let botonEstilo = desactivado ? "border border-neutral-200 bg-[#F9F7F5]/50 cursor-not-allowed opacity-40" : "bg-white border-2 border-[#964B36] shadow-md cursor-pointer transform hover:-translate-y-1 hover:shadow-lg hover:bg-[#964B36]/5 relative z-10";
                        if (['604', '504', '404'].includes(String(unidad.id))) botonEstilo += " col-span-2";

                        let textoIdEstilo = desactivado ? "text-[#415364]/50" : "text-[#964B36] font-bold";
                        let textoTipoEstilo = desactivado ? "text-[#415364]/40" : "text-[#415364] font-medium";

                        return (
                          <button
                            key={unidad.id}
                            disabled={desactivado}
                            onClick={() => { 
                              if(!desactivado) {
                                setUnidadSeleccionada(unidad);
                                registrarAccion('ABRIO_UNIDAD', String(unidad.id), 'Revisó detalles de unidad');
                              } 
                            }}
                            className={`w-full h-full flex flex-col items-center justify-center p-1 md:p-2 rounded-xl transition-all duration-300 min-h-[45px] md:min-h-[55px] overflow-hidden select-none touch-manipulation ${botonEstilo}`}
                          >
                            <span className={`text-[12px] md:text-[14px] font-bold tracking-tight leading-none ${textoIdEstilo}`}>{unidad.id}</span>
                            {!desactivado && <span className={`mt-1 text-[6px] md:text-[7.5px] text-center leading-tight uppercase tracking-wider whitespace-normal px-0.5 ${textoTipoEstilo}`}>{unidad.tipo}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* PLANTA BAJA */}
                <div className="flex items-stretch gap-1 md:gap-2 mt-2 w-full">
                  <div className="w-14 min-w-[3.5rem] md:w-20 md:min-w-[5rem] shrink-0 text-[8px] md:text-[10px] font-bold text-[#415364]/50 uppercase tracking-widest flex items-center justify-end pr-2 md:pr-4">PB</div>
                  <div className="flex-1 bg-[#21242E] p-3 md:p-4 rounded-b-xl text-center flex flex-col justify-center shadow-inner border border-[#21242E]">
                    <span className="text-[9px] md:text-[11px] font-bold text-[#D1C292] uppercase tracking-widest">Planta Baja / Ingreso Principal</span>
                    <span className="text-[6px] md:text-[8px] mt-1 uppercase tracking-widest text-white/50">Lobby Design • Locales Comerciales • Estacionamientos</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* === MODALES DE VISUALIZACIÓN === */}
        {vistaActiva && (
          <div className="fixed inset-0 bg-[#21242E]/90 z-[60] flex flex-col items-center justify-center p-4 sm:p-6 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setVistaActiva(null)}>
            <div className="relative w-full max-w-4xl bg-white p-2 md:p-3 rounded-2xl shadow-2xl flex flex-col items-center animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setVistaActiva(null)} className="absolute top-4 right-4 bg-white/90 text-[#21242E] w-8 h-8 rounded-full flex items-center justify-center font-bold hover:bg-neutral-100 z-10 shadow-sm transition-colors">&times;</button>
              <div className="w-full rounded-xl overflow-hidden bg-[#F9F7F5] flex items-center justify-center min-h-[300px]">
                <img src={FOTOS_VISTAS[vistaActiva]?.url} alt={FOTOS_VISTAS[vistaActiva]?.titulo} className="w-full max-h-[70vh] object-cover md:object-contain" />
              </div>
              <div className="mt-4 text-center pb-3 w-full">
                <h3 className="text-base font-bold text-[#21242E] uppercase tracking-widest">{FOTOS_VISTAS[vistaActiva]?.titulo}</h3>
                <span className="text-[10px] text-[#415364]/50 uppercase tracking-widest mt-1 block">Arienzo Boutique Living</span>
              </div>
            </div>
          </div>
        )}

        {planoUrlActivo && (
          <div className="fixed inset-0 bg-[#21242E]/90 z-[60] flex flex-col items-center justify-center p-4 sm:p-6 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setPlanoUrlActivo(null)}>
            <div className="relative w-full max-w-3xl bg-white p-2 md:p-4 rounded-2xl shadow-2xl flex flex-col items-center animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setPlanoUrlActivo(null)} className="absolute top-4 right-4 bg-white/90 text-[#21242E] w-8 h-8 rounded-full flex items-center justify-center font-bold hover:bg-neutral-100 z-10 shadow-sm transition-colors">&times;</button>
              <div className="w-full rounded-xl overflow-hidden bg-[#F9F7F5] flex items-center justify-center min-h-[400px]">
                <img src={planoUrlActivo} alt="Plano de Distribución" className="w-full max-h-[75vh] object-contain" />
              </div>
              <div className="mt-4 text-center pb-2 w-full">
                <h3 className="text-base font-bold text-[#21242E] uppercase tracking-widest">Plano Arquitectónico</h3>
                <span className="text-[10px] text-[#415364]/50 uppercase tracking-widest mt-1 block">Distribución Interna</span>
              </div>
            </div>
          </div>
        )}

        {/* MODAL UNIDAD SELECCIONADA CON MÁRGENES MÓVILES SEGUROS */}
        {unidadSeleccionada && paso === 'mapa' && !vistaActiva && !planoUrlActivo && (
          <div className="fixed inset-0 bg-[#21242E]/70 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden transform transition-transform animate-in slide-in-from-bottom-8 mx-auto mx-0 sm:mx-4">
              
              <div className="bg-[#21242E] p-6 relative flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-bold tracking-widest text-[#D1C292] uppercase border border-[#D1C292]/30 bg-[#D1C292]/10 px-2 py-0.5 rounded">Unidad Seleccionada</span>
                  <h3 className="text-3xl font-bold text-white mt-2 tracking-tight">Dpto. {unidadSeleccionada.id}</h3>
                </div>
                <button onClick={() => setUnidadSeleccionada(null)} className="bg-white/10 text-white/70 w-8 h-8 rounded-full flex items-center justify-center font-bold hover:bg-white/20 hover:text-white transition-colors">&times;</button>
              </div>

              <div className="p-6">
                <div className="space-y-4 mb-6">
                  
                  <div className="flex justify-between items-center pb-3 border-b border-neutral-100">
                    <span className="text-xs font-bold text-[#415364]/60 uppercase tracking-widest">Tipología</span>
                    <span className="font-bold text-[#21242E]">{unidadSeleccionada.tipo}</span>
                  </div>

                  <div className="flex justify-between items-center pb-3 border-b border-neutral-100">
                    <span className="text-xs font-bold text-[#415364]/60 uppercase tracking-widest">Área Total</span>
                    <span className="font-bold text-[#21242E]">{unidadSeleccionada.area} m²</span>
                  </div>

                  <div className="flex justify-between items-start pb-3 border-b border-neutral-100">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#415364]/60 uppercase tracking-widest">Valor por m²</span>
                      <span className="text-[9px] text-[#D1C292] uppercase tracking-widest font-bold mt-1">Pre-Lanzamiento</span>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="font-bold text-[#21242E] text-base font-mono">${calcularM2Lanzamiento.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                      <span className="text-[9px] text-[#415364]/40 uppercase tracking-widest font-bold mt-1">Sin anexos</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button 
                      onClick={() => {
                        setPlanoUrlActivo(obtenerUrlPlano(unidadSeleccionada.area));
                        registrarAccion('VIO_PLANO_INTERNO', String(unidadSeleccionada.id), 'Abrió imagen del plano');
                      }} 
                      className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl border border-neutral-200 bg-[#F9F7F5] hover:border-[#964B36] hover:bg-white transition-colors group"
                    >
                      <div className="text-[#415364] group-hover:text-[#964B36] transition-colors"><PlanIcon /></div>
                      <span className="text-[10px] md:text-[9px] font-bold text-[#415364] uppercase tracking-widest group-hover:text-[#964B36] transition-colors">Ver Plano</span>
                    </button>
                    
                    <button 
                      onClick={() => {
                        setVistaActiva(obtenerKeyVista(unidadSeleccionada));
                        registrarAccion('VIO_IMAGEN_VISTA', String(unidadSeleccionada.id), `Vio vista: ${unidadSeleccionada.vista}`);
                      }} 
                      className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl border border-neutral-200 bg-[#F9F7F5] hover:border-[#964B36] hover:bg-white transition-colors group"
                    >
                      <div className="text-[#415364] group-hover:text-[#964B36] transition-colors"><ViewIcon /></div>
                      <span className="text-[10px] md:text-[9px] font-bold text-[#415364] uppercase tracking-widest group-hover:text-[#964B36] transition-colors">Ver Vista</span>
                    </button>
                  </div>
                </div>

                <div className="bg-[#F9F7F5] p-5 rounded-2xl border border-[#EAE3DC] mb-6 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-bold text-[#415364]/60 uppercase tracking-widest block mb-1">Inversión Total</span>
                    <span className="text-[8px] text-[#964B36] font-bold uppercase tracking-widest">
                      {(unidadSeleccionada.tipo || '').includes('3 Dorm') ? 'Incluye 2 parqueos y 1 bodega' : 'Incluye 1 parqueo y 1 bodega'}
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-[#21242E] tracking-tight">
                    ${unidadSeleccionada.precio?.toLocaleString('en-US') || 0}
                  </span>
                </div>

                <div className="space-y-3">
                  <button onClick={() => { setPaso('formulario'); registrarAccion('ABRIO_FORMULARIO_RESERVA', String(unidadSeleccionada.id), 'Dio clic en botón de bloqueo web'); }} className="w-full bg-[#964B36] text-white font-bold uppercase tracking-widest text-[13px] md:text-[11px] py-4 rounded-xl hover:bg-[#7d3e2c] transition-all shadow-md">
                    Bloquear Unidad Web ($2,500)
                  </button>
                  <button onClick={contactarAsesor} className="w-full bg-white border border-neutral-200 text-[#21242E] font-bold uppercase tracking-widest text-[13px] md:text-[11px] py-3.5 rounded-xl hover:bg-[#F9F7F5] hover:border-neutral-300 transition-all flex items-center justify-center gap-2">
                    <ChatIcon /> Cotizar con Asesor
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {paso === 'formulario' && (
          <div className="max-w-md w-full mx-auto bg-white p-6 md:p-8 rounded-3xl border border-neutral-200 shadow-xl animate-in slide-in-from-right-8 mt-4 md:mt-10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-[#964B36]"></div>
            <button onClick={() => setPaso('mapa')} className="text-[12px] md:text-[10px] font-bold text-[#415364]/50 uppercase tracking-widest mb-6 hover:text-[#964B36] flex items-center gap-1 transition-colors">← Volver al plano</button>
            <h3 className="text-2xl font-bold text-[#21242E] mb-2 tracking-tight">Registro de Inversión</h3>
            <p className="text-[14px] md:text-xs text-[#415364]/70 mb-6 font-medium">Completa tus datos para procesar la solicitud del Dpto. {unidadSeleccionada.id}</p>
            
            <form onSubmit={procesarReserva} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-[#415364] uppercase tracking-widest mb-1.5">Nombres Completos</label>
                <input required type="text" value={formData.nombres} onChange={e => setFormData({...formData, nombres: e.target.value})} className="w-full bg-[#F9F7F5] border border-neutral-200 rounded-xl p-3.5 text-[16px] md:text-sm font-medium text-[#21242E] focus:outline-none focus:border-[#964B36] transition-colors" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#415364] uppercase tracking-widest mb-1.5">Cédula / Pasaporte</label>
                <input required type="text" value={formData.cedula} onChange={e => setFormData({...formData, cedula: e.target.value})} className="w-full bg-[#F9F7F5] border border-neutral-200 rounded-xl p-3.5 text-[16px] md:text-sm font-medium text-[#21242E] focus:outline-none focus:border-[#964B36] transition-colors" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#415364] uppercase tracking-widest mb-1.5">WhatsApp</label>
                  <input required type="tel" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} className="w-full bg-[#F9F7F5] border border-neutral-200 rounded-xl p-3.5 text-[16px] md:text-sm font-medium text-[#21242E] focus:outline-none focus:border-[#964B36] transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#415364] uppercase tracking-widest mb-1.5">Correo</label>
                  <input required type="email" value={formData.email} readOnly className="w-full bg-neutral-100 border border-neutral-200 rounded-xl p-3.5 text-[16px] md:text-sm font-medium text-neutral-400 cursor-not-allowed" />
                </div>
              </div>
              <div className="pt-6 mt-2 border-t border-neutral-100">
                <button type="submit" disabled={cargandoReserva} className="w-full bg-[#21242E] text-white font-bold uppercase tracking-widest text-[14px] md:text-xs py-4 rounded-xl hover:bg-black transition-all shadow-md disabled:opacity-70 flex justify-center items-center">
                  {cargandoReserva ? <span className="animate-pulse">Procesando...</span> : 'Confirmar Reserva Oficial'}
                </button>
              </div>
            </form>
          </div>
        )}

        {paso === 'exito' && (
          <div className="max-w-md w-full mx-auto bg-white p-8 md:p-12 rounded-3xl border border-neutral-200 shadow-2xl text-center animate-in zoom-in-95 duration-500 mb-10 mt-10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-[#D1C292]"></div>
            <div className="w-20 h-20 bg-[#D1C292]/10 text-[#D1C292] rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-2xl font-bold text-[#21242E] mb-2 tracking-tight">¡Solicitud Recibida!</h2>
            <p className="text-sm text-[#415364]/70 mb-8 font-medium">La solicitud de bloqueo para la <strong>Unidad {unidadSeleccionada.id}</strong> ha sido enviada con éxito a nuestro equipo comercial.</p>
            <div className="mb-6">
              <button onClick={enviarNotificacionReservaWhatsApp} className="w-full bg-[#21242E] hover:bg-black text-white font-bold uppercase tracking-widest text-[14px] md:text-xs py-4 rounded-xl transition-all shadow-md flex justify-center items-center gap-2">
                <ChatIcon /> Notificar a mi Asesor
              </button>
            </div>
            <button onClick={() => window.location.reload()} className="mt-4 text-[12px] md:text-[10px] font-bold text-[#415364]/40 hover:text-[#964B36] uppercase tracking-widest transition-colors">Finalizar y volver al inicio</button>
          </div>
        )}
      </main>
    </div>
  );
}