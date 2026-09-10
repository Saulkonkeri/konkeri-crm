// Actualizacion para Vercel - Reserva Express (Colores Oficiales Arienzo, Bug Vistas y UI Premium)
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

// GALERÍA DE VISTAS EXTERNAS (Supabase)
const FOTOS_VISTAS: Record<string, { titulo: string, url: string }> = {
  'urb': { titulo: 'Vista a la Urbanización', url: 'https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/vistas%20arienzo/vista%20a%20la%20urbanizacion%20(1).jpg' },
  'wyndham': { titulo: 'Vista Lateral', url: 'https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/vistas%20arienzo/vista%20a%20mikonos.jpg' },
  'panoramica': { titulo: 'Vista Panorámica Frontal', url: 'https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/vistas%20arienzo/vista%20principal%20(1).jpg' }
};

// === SOLUCIÓN ESTRICTA PARA LAS VISTAS ===
const obtenerKeyVista = (unidad: any) => {
  if (!unidad) return 'panoramica';
  const idUnidad = String(unidad.id);
  
  // Fuerza bruta: Si es uno de estos, obligatoriamente es vista Lateral (Wyndham)
  if (['604', '504', '404', '305', '205'].includes(idUnidad)) {
    return 'wyndham';
  }

  const vistaText = String(unidad.vista || '').toLowerCase();
  if (vistaText.includes('urbanización') || vistaText.includes('urb')) return 'urb';
  if (vistaText.includes('wyndham') || vistaText.includes('lateral')) return 'wyndham';
  
  return 'panoramica';
};

// === ASIGNACIÓN INTELIGENTE DE PLANOS POR METRAJE ===
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

// TRADUCTOR DE TIPOLOGÍAS
const traducirTipologia = (tipologiaDB: string) => {
  const t = String(tipologiaDB || '').toLowerCase();
  if (t.includes('suite') || t.includes('1 dorm')) return '1 Dormitorio';
  if (t.includes('2 dorm')) return '2 Dormitorios';
  if (t.includes('3 dorm')) return '3 Dormitorios';
  return tipologiaDB;
};

export default function ReservaExpressPage() {
  const [paso, setPaso] = useState<'acceso' | 'filtro' | 'mapa' | 'formulario' | 'exito'>('acceso');
  const [inventario, setInventario] = useState<any[]>(INVENTARIO_FALLBACK); 

  const [emailAcceso, setEmailAcceso] = useState('');
  const [cargandoAcceso, setCargandoAcceso] = useState(false);
  const [errorAcceso, setErrorAcceso] = useState('');

  const [filtroTipo, setFiltroTipo] = useState<string | null>(null);
  const [unidadSeleccionada, setUnidadSeleccionada] = useState<any>(null);
  
  const [vistaActiva, setVistaActiva] = useState<string | null>(null);
  const [planoUrlActivo, setPlanoUrlActivo] = useState<string | null>(null);

  const [formData, setFormData] = useState({ nombres: '', cedula: '', email: '', telefono: '' });
  const [cargandoReserva, setCargandoReserva] = useState(false);

  // ==========================================
  // SENSOR MAESTRO: 100% SILENCIOSO
  // ==========================================
  const registrarAccion = async (accion: string, idUnidad?: string, detalleAdicional?: string) => {
    const correoActivo = formData.email || emailAcceso;
    if (!correoActivo) return; 
    
    try {
      await supabase.from('tracking_inventario').insert([{
        email_cliente: correoActivo,
        accion: accion,
        unidad_id: idUnidad || null,
        detalle: detalleAdicional || null
      }]);
    } catch (error) {
      console.error("Error en radar:", error);
    }
  };

  // === CÁLCULO SUTIL DEL PRECIO POR M2 ===
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
      if (error || !data) { setErrorAcceso('Este correo no cuenta con una invitación activa.'); setCargandoAcceso(false); return; }
      const ahora = new Date();
      if (ahora > new Date(data.expira_en)) { setErrorAcceso('Tu invitación ha expirado.'); setCargandoAcceso(false); return; }
      setFormData({ ...formData, email: correoLimpio });
      setPaso('filtro');
      
      notificarIngresoSilencioso(correoLimpio);
      registrarAccion('INGRESO_INVENTARIO', undefined, 'Inició sesión en el inventario');
      
    } catch (err) { setErrorAcceso('Ocurrió un error al verificar.'); }
    setCargandoAcceso(false);
  };

  const procesarReserva = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargandoReserva(true);
    try {
      registrarAccion('RESERVA_COMPLETADA', unidadSeleccionada?.id, `Reserva procesada a nombre de ${formData.nombres}`);
      
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
    registrarAccion('USO_FILTRO', undefined, `Buscó: ${tipo}`);
  };

  const obtenerDatosUnidad = (idBuscado: string | null) => {
    if (!idBuscado) return null;
    return inventario.find(u => String(u.id) === idBuscado) || null;
  };

  const contactarAsesor = () => {
    registrarAccion('CLIC_WHATSAPP', unidadSeleccionada?.id, 'Intentó contactar asesor');
    const telefonoDebbi = "593979469472"; 
    const mensaje = `Hola Debbi, estoy revisando el inventario VIP y me interesa cotizar la *Unidad ${unidadSeleccionada?.id}* (${unidadSeleccionada?.tipo}). ¿Podemos conversar?`;
    window.open(`https://wa.me/${telefonoDebbi}?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  const enviarNotificacionReservaWhatsApp = () => {
    const telefonoDebbi = "593979469472"; 
    const mensaje = `🚨 *¡NUEVA RESERVA EN LÍNEA (Soft Block)!* 🚨\n\nEl cliente *${formData.nombres}* acaba de realizar una solicitud de bloqueo web:\n\n🏢 *Unidad:* ${unidadSeleccionada?.id} (${unidadSeleccionada?.tipo})\n💵 *Precio:* $${unidadSeleccionada?.precio.toLocaleString('en-US')}\n🆔 *Cédula:* ${formData.cedula}\n📱 *WhatsApp:* ${formData.telefono}\n📧 *Email:* ${formData.email}\n\n¡Comunícate con el cliente y valida el pago de $2,500 para bloquear oficialmente la unidad en el CRM!`;
    window.open(`https://wa.me/${telefonoDebbi}?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#F9F7F5] font-sans pb-20 relative">
      {/* HEADER MÁS IMPONENTE */}
      {paso !== 'acceso' && (
        <header className="bg-white border-b border-[#EAE3DC] px-6 py-5 md:py-7 sticky top-0 z-40 flex justify-center shadow-sm">
          <div className="text-center cursor-pointer flex justify-center items-center hover:scale-105 transition-transform duration-300" onClick={() => setPaso('filtro')}>
            <img 
              src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/arienzo-logo-terracota.svg" 
              alt="Arienzo Boutique Living" 
              className="w-32 md:w-40 h-auto"
            />
          </div>
        </header>
      )}

      <main className="max-w-5xl mx-auto px-3 md:px-4 mt-6">
        
        {/* CAJA DE ACCESO VIP */}
        {paso === 'acceso' && (
          <div className="min-h-[80vh] flex flex-col items-center justify-center animate-in fade-in duration-700 px-4">
            <div className="bg-white p-8 md:p-12 rounded-3xl border border-[#EAE3DC] shadow-2xl max-w-md w-full text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-[#964B36]"></div>
              
              <div className="flex justify-center mt-4 mb-8">
                <img 
                  src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/arienzo-logo-terracota.svg" 
                  alt="Arienzo Boutique Living" 
                  className="w-48 md:w-56 h-auto"
                />
              </div>
              
              <h2 className="text-2xl font-medium text-neutral-800 mb-2">Acceso Exclusivo</h2>
              <p className="text-xs text-neutral-500 mb-8 px-2 font-medium">Ingresa tu correo electrónico autorizado para visualizar el inventario.</p>
              
              <form onSubmit={verificarAcceso} className="space-y-5">
                <div>
                  <input 
                    type="email" 
                    required 
                    value={emailAcceso} 
                    onChange={(e) => setEmailAcceso(e.target.value)} 
                    placeholder="tucorreo@ejemplo.com" 
                    className="w-full bg-[#F9F7F5] border border-neutral-200 rounded-xl p-4 text-base font-medium text-center focus:outline-none focus:border-[#964B36] focus:ring-1 focus:ring-[#964B36] transition-all" 
                  />
                </div>
                {errorAcceso && <p className="text-xs font-bold text-[#964B36] bg-[#964B36]/10 py-2 rounded-lg">{errorAcceso}</p>}
                
                <button type="submit" disabled={cargandoAcceso} className="w-full bg-[#21242E] text-white font-bold uppercase tracking-[0.2em] text-xs py-4 rounded-xl hover:bg-[#1a1d24] transition-all shadow-xl hover:-translate-y-0.5 disabled:opacity-70 disabled:transform-none flex justify-center items-center">
                  {cargandoAcceso ? <span className="animate-pulse">Verificando...</span> : 'Acceder al Inventario'}
                </button>
              </form>
            </div>
          </div>
        )}

        {paso === 'filtro' && (
          <div className="max-w-lg mx-auto text-center space-y-8 animate-in zoom-in-95 duration-500 mt-10 md:mt-20">
            <div>
              <h2 className="text-3xl font-medium text-neutral-900 mb-2 px-2">Selecciona la tipología.</h2>
              <p className="text-sm font-medium text-neutral-500 px-4">Indícanos qué distribución se adapta a tu requerimiento.</p>
            </div>
            <div className="flex flex-col gap-4 px-2">
              <button onClick={() => seleccionarFiltro('1 Dormitorio')} className="w-full bg-white border border-[#EAE3DC] p-5 sm:p-6 rounded-2xl shadow-sm hover:border-[#964B36] hover:shadow-lg transition-all group relative overflow-hidden text-left">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#964B36] transform -translate-x-full group-hover:translate-x-0 transition-transform"></div>
                <h3 className="text-xl font-bold text-neutral-800 uppercase tracking-wide group-hover:text-[#964B36] transition-colors">1 Dormitorio</h3>
              </button>
              <button onClick={() => seleccionarFiltro('2 Dormitorios')} className="w-full bg-white border border-[#EAE3DC] p-5 sm:p-6 rounded-2xl shadow-sm hover:border-[#964B36] hover:shadow-lg transition-all group relative overflow-hidden text-left">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#964B36] transform -translate-x-full group-hover:translate-x-0 transition-transform"></div>
                <h3 className="text-xl font-bold text-neutral-800 uppercase tracking-wide group-hover:text-[#964B36] transition-colors">2 Dormitorios</h3>
              </button>
              <button onClick={() => seleccionarFiltro('3 Dormitorios')} className="w-full bg-white border border-[#EAE3DC] p-5 sm:p-6 rounded-2xl shadow-sm hover:border-[#964B36] hover:shadow-lg transition-all group relative overflow-hidden text-left">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#964B36] transform -translate-x-full group-hover:translate-x-0 transition-transform"></div>
                <h3 className="text-xl font-bold text-neutral-800 uppercase tracking-wide group-hover:text-[#964B36] transition-colors">3 Dormitorios</h3>
              </button>
            </div>
          </div>
        )}

        {paso === 'mapa' && (
          <div className="space-y-4 md:space-y-6 animate-in slide-in-from-bottom-8 duration-500 w-full max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end px-1 gap-4">
              <div>
                <button onClick={() => setPaso('filtro')} className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2 hover:text-[#964B36] flex items-center gap-1 transition-colors">← Volver</button>
                <h2 className="text-xl md:text-2xl font-medium text-neutral-800 uppercase tracking-wide">Unidades de {filtroTipo?.replace('s (Esquinero)', 's')}</h2>
              </div>
              <div className="flex items-center gap-4 bg-white px-5 py-2.5 rounded-xl border border-neutral-200 shadow-sm w-full md:w-auto justify-center">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 md:w-4 md:h-4 bg-white border-[2px] border-[#964B36] rounded inline-block shadow-sm"></span>
                  <span className="text-[9px] md:text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Unidad Disponible</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-3 md:p-8 rounded-2xl md:rounded-3xl border border-[#EAE3DC] shadow-lg relative w-full overflow-hidden">
              <div className="flex flex-col w-full">
                
                {/* ROOFTOP */}
                <div className="flex items-stretch gap-1 md:gap-2 mb-2 w-full">
                  <div className="w-12 md:w-20 text-[7px] md:text-[9px] font-bold text-neutral-500 uppercase flex items-center justify-end pr-2 md:pr-4">Cima</div>
                  <div className="flex-1 bg-[#D1C292]/10 border border-[#D1C292] p-2 md:p-3 rounded-t-xl text-center flex items-center justify-center">
                    <span className="text-[8px] md:text-[10px] font-bold text-[#8A7A55] uppercase tracking-widest">Rooftop & Amenidades Exclusivas</span>
                  </div>
                </div>

                {/* VISTAS */}
                <div className="flex items-stretch gap-1 md:gap-2 mb-2 w-full">
                  <div className="w-12 md:w-20 flex flex-col justify-center pr-2 md:pr-4">
                    <span className="text-[7px] md:text-[9px] font-bold text-neutral-500 uppercase tracking-widest text-right leading-tight">Vistas</span>
                  </div>
                  <div className="flex-1 grid grid-cols-[4fr_4fr_10fr_5fr_9fr] gap-1 md:gap-2">
                    <button onClick={() => setVistaActiva('urb')} className="col-span-1 bg-neutral-50 hover:bg-neutral-100 shadow-sm rounded-md py-1.5 px-1 flex flex-col items-center justify-center border border-neutral-200 cursor-pointer transition-colors">
                      <span className="text-[5px] md:text-[7px] font-bold uppercase tracking-widest text-neutral-500 text-center leading-tight">A la<br/>Urbanización</span>
                    </button>
                    <button onClick={() => setVistaActiva('wyndham')} className="col-span-1 bg-sky-50/50 hover:bg-sky-50 shadow-sm rounded-md py-1.5 px-1 flex flex-col items-center justify-center border border-sky-100 cursor-pointer transition-colors">
                      <span className="text-[5px] md:text-[7px] font-bold uppercase tracking-widest text-sky-700 text-center leading-tight">Al Wyndham /<br/>Mar</span>
                    </button>
                    <button onClick={() => setVistaActiva('panoramica')} className="col-span-3 bg-[#964B36]/5 hover:bg-[#964B36]/10 shadow-sm rounded-md py-1.5 px-1 flex flex-col items-center justify-center border border-[#964B36]/20 cursor-pointer transition-colors">
                      <span className="text-[5px] md:text-[7px] font-bold uppercase tracking-widest text-[#964B36] text-center leading-tight">Panorámica Frontal: La Quadra / Umiña / Mar</span>
                    </button>
                  </div>
                </div>

                {/* PISOS */}
                {PISOS_EDIFICIO.map(piso => (
                  <div key={piso} className="flex items-stretch gap-1 md:gap-2 mb-1 md:mb-2 w-full">
                    <div className="w-12 md:w-20 flex items-center justify-end pr-2 md:pr-4 text-[9px] md:text-[11px] font-bold text-neutral-500 uppercase">P{piso}</div>
                    <div className="flex-1 grid gap-1 md:gap-2 grid-cols-[4fr_4fr_10fr_5fr_9fr]">
                      {LAYOUT_FACHADA[piso].map((idUnidad, colIndex) => {
                        if (!idUnidad) return <div key={`empty-${piso}-${colIndex}`} className="invisible"></div>;
                        const unidad = obtenerDatosUnidad(idUnidad);
                        
                        if (!unidad) return <div key={`notfound-${idUnidad}`} className="bg-neutral-100 rounded-lg border border-neutral-200 opacity-50 min-h-[45px] md:min-h-[70px]"></div>;

                        const noCoincide = unidad.tipo !== filtroTipo;
                        const reservado = unidad.estado === 'RESERVADO' || unidad.estado === 'VENDIDO' || unidad.estado === 'BLOQUEADO' || unidad.estado === 'SEPARADO';
                        const desactivado = noCoincide || reservado;
                        
                        let botonEstilo = desactivado ? "bg-neutral-50 border border-neutral-200 cursor-not-allowed opacity-90" : "bg-white border-[2px] border-[#964B36] shadow-sm cursor-pointer transform hover:-translate-y-1 hover:shadow-lg hover:bg-orange-50/20";
                        if (['604', '504', '404'].includes(String(unidad.id))) botonEstilo += " col-span-2";

                        let textoIdEstilo = desactivado ? "text-neutral-400" : "text-[#964B36] font-bold";
                        let textoTipoEstilo = desactivado ? "text-neutral-400" : "text-neutral-800 font-medium";

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
                            className={`flex flex-col items-center justify-center p-1 md:p-2 rounded-lg transition-all duration-300 min-h-[45px] md:min-h-[70px] ${botonEstilo}`}
                          >
                            <span className={`text-[12px] md:text-lg font-light leading-none ${textoIdEstilo}`}>{unidad.id}</span>
                            {!desactivado && <span className={`mt-0.5 md:mt-1 text-[5px] md:text-[8px] text-center leading-tight ${textoTipoEstilo}`}>{unidad.tipo}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* PLANTA BAJA */}
                <div className="flex items-stretch gap-1 md:gap-2 mt-1 w-full">
                  <div className="w-12 md:w-20 text-[8px] md:text-[10px] font-bold text-neutral-500 uppercase flex items-center justify-end pr-2 md:pr-4">PB</div>
                  <div className="flex-1 bg-[#21242E] p-3 md:p-5 rounded-b-2xl text-center flex flex-col justify-center shadow-md border border-[#21242E]">
                    <span className="text-[8px] md:text-[11px] font-bold text-[#D1C292] uppercase tracking-widest">Planta Baja</span>
                    <span className="text-[6px] md:text-[8px] mt-1 md:mt-1.5 uppercase tracking-widest text-white/70">Ingreso Vehicular • Locales Comerciales • Lobby Design</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* === MODALES DE VISUALIZACIÓN === */}
        {vistaActiva && (
          <div className="fixed inset-0 bg-[#21242E]/80 z-[60] flex flex-col items-center justify-center p-4 sm:p-6 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setVistaActiva(null)}>
            <div className="relative w-full max-w-3xl bg-white p-2 md:p-4 rounded-2xl shadow-2xl flex flex-col items-center animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setVistaActiva(null)} className="absolute top-4 right-4 bg-white/80 backdrop-blur text-[#21242E] w-8 h-8 rounded-full flex items-center justify-center font-bold hover:bg-[#F9F7F5] z-10 shadow-sm transition-colors">&times;</button>
              <div className="w-full rounded-xl overflow-hidden relative bg-[#F9F7F5] flex items-center justify-center min-h-[300px]">
                <img src={FOTOS_VISTAS[vistaActiva]?.url} alt={FOTOS_VISTAS[vistaActiva]?.titulo} className="w-full max-h-[60vh] object-contain" />
              </div>
              <div className="mt-4 text-center pb-2 w-full">
                <h3 className="text-sm md:text-base font-bold text-[#21242E] uppercase tracking-wide">{FOTOS_VISTAS[vistaActiva]?.titulo}</h3>
                <span className="text-[9px] md:text-[10px] text-neutral-400 uppercase tracking-widest mt-1 block">Toma de Dron - Arienzo Boutique Living</span>
              </div>
            </div>
          </div>
        )}

        {planoUrlActivo && (
          <div className="fixed inset-0 bg-[#21242E]/80 z-[60] flex flex-col items-center justify-center p-4 sm:p-6 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setPlanoUrlActivo(null)}>
            <div className="relative w-full max-w-2xl bg-white p-2 md:p-4 rounded-2xl shadow-2xl flex flex-col items-center animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setPlanoUrlActivo(null)} className="absolute top-4 right-4 bg-white/80 backdrop-blur text-[#21242E] w-8 h-8 rounded-full flex items-center justify-center font-bold hover:bg-[#F9F7F5] z-10 shadow-sm transition-colors">&times;</button>
              <div className="w-full rounded-xl overflow-hidden relative bg-[#F9F7F5] flex items-center justify-center min-h-[400px]">
                <img src={planoUrlActivo} alt="Plano de Distribución" className="w-full max-h-[70vh] object-contain" />
              </div>
              <div className="mt-4 text-center pb-2 w-full">
                <h3 className="text-sm md:text-base font-bold text-[#21242E] uppercase tracking-wide">Plano de Distribución</h3>
                <span className="text-[9px] md:text-[10px] text-neutral-400 uppercase tracking-widest mt-1 block">Arienzo Boutique Living</span>
              </div>
            </div>
          </div>
        )}

        {unidadSeleccionada && paso === 'mapa' && !vistaActiva && !planoUrlActivo && (
          <div className="fixed inset-0 bg-[#21242E]/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 transform transition-transform animate-in slide-in-from-bottom-8 border border-[#EAE3DC]">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[10px] font-bold tracking-widest text-[#964B36] uppercase bg-[#964B36]/10 px-2.5 py-1 rounded-md">Unidad Seleccionada</span>
                  <h3 className="text-3xl font-medium text-neutral-900 mt-2">Dpto. {unidadSeleccionada.id}</h3>
                </div>
                <button onClick={() => setUnidadSeleccionada(null)} className="bg-[#F9F7F5] text-neutral-500 w-8 h-8 rounded-full flex items-center justify-center font-bold hover:bg-[#EAE3DC] transition-colors">&times;</button>
              </div>

              <div className="space-y-3 bg-[#F9F7F5] p-5 rounded-xl border border-[#EAE3DC] text-sm">
                
                <div className="flex justify-between border-b border-neutral-200/60 pb-3 items-start">
                  <span className="text-neutral-500 font-medium">Distribución</span>
                  <div className="text-right flex flex-col items-end">
                    <span className="font-bold text-neutral-800 leading-tight">{unidadSeleccionada.tipo}</span>
                    <button 
                      onClick={() => {
                        setPlanoUrlActivo(obtenerUrlPlano(unidadSeleccionada.area));
                        registrarAccion('VIO_PLANO_INTERNO', String(unidadSeleccionada.id), 'Abrió imagen del plano');
                      }} 
                      className="text-[10px] text-neutral-500 font-bold underline mt-1.5 cursor-pointer flex items-center gap-1 hover:text-[#964B36] transition-colors"
                    >
                      <span>📐</span> Ver plano interno
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-between border-b border-neutral-200/60 pb-3">
                  <span className="text-neutral-500 font-medium">Área Total</span>
                  <span className="font-bold text-neutral-800">{unidadSeleccionada.area} m²</span>
                </div>
                
                <div className="flex justify-between border-b border-neutral-200/60 pb-3 items-start">
                  <span className="text-neutral-500 font-medium">Vista / Orientación</span>
                  <div className="text-right w-[60%] flex flex-col items-end">
                    <span className="font-bold text-neutral-800 leading-tight">{unidadSeleccionada.vista}</span>
                    <button 
                      onClick={() => {
                        setVistaActiva(obtenerKeyVista(unidadSeleccionada));
                        registrarAccion('VIO_IMAGEN_VISTA', String(unidadSeleccionada.id), `Vio vista: ${unidadSeleccionada.vista}`);
                      }} 
                      className="text-[10px] text-[#964B36] font-bold underline mt-1.5 cursor-pointer flex items-center gap-1 hover:text-[#7d3e2c] transition-colors">
                      <span>👁️</span> Ver imagen de la vista
                    </button>
                  </div>
                </div>

                <div className="flex justify-between border-b border-neutral-200/60 pb-3 pt-1 items-start">
                  <div className="flex flex-col">
                     <span className="text-neutral-500 font-medium">Valor m²</span>
                     <span className="text-[8px] text-[#D1C292] uppercase tracking-widest font-bold mt-0.5">Pre-Lanzamiento</span>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="text-neutral-700 font-mono text-sm font-semibold">${calcularM2Lanzamiento.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    <span className="text-[8px] text-neutral-400 uppercase tracking-widest mt-0.5 font-bold">Sin anexos</span>
                  </div>
                </div>

                <div className="flex justify-between pt-2 items-center">
                  <span className="text-neutral-500 font-medium mt-1">Inversión Total</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-[#964B36] font-mono block leading-none">
                      ${unidadSeleccionada.precio?.toLocaleString('en-US') || 0}
                    </span>
                    <span className="text-[9px] text-[#D1C292] font-bold uppercase tracking-widest block mt-2">
                      {(unidadSeleccionada.tipo || '').includes('3 Dorm') ? 'Incluye 2 parqueos y 1 bodega' : 'Incluye 1 parqueo y 1 bodega'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button onClick={() => setPaso('formulario')} className="w-full bg-[#21242E] text-white font-bold uppercase tracking-[0.15em] text-xs py-4 rounded-xl hover:bg-[#1a1d24] transition-all shadow-xl hover:-translate-y-0.5">
                  Bloquear Unidad por $2,500
                </button>
                <button onClick={contactarAsesor} className="w-full bg-white border-2 border-[#25D366] text-[#25D366] font-bold uppercase tracking-[0.15em] text-xs py-3.5 rounded-xl hover:bg-[#25D366] hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm">
                  <span>💬 Cotizar con Asesor</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {paso === 'formulario' && (
          <div className="max-w-md mx-auto bg-white p-6 md:p-8 rounded-3xl border border-[#EAE3DC] shadow-xl animate-in slide-in-from-right-8 mt-10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-[#964B36]"></div>
            <button onClick={() => setPaso('mapa')} className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-6 hover:text-[#964B36] flex items-center gap-1 transition-colors">← Volver al plano</button>
            <h3 className="text-2xl font-medium text-neutral-900 mb-2">Registro de Inversionista</h3>
            <p className="text-xs text-neutral-500 mb-6 font-medium">Completa tus datos para procesar la solicitud del Dpto. {unidadSeleccionada.id}</p>
            
            <form onSubmit={procesarReserva} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Nombres Completos</label>
                <input required type="text" value={formData.nombres} onChange={e => setFormData({...formData, nombres: e.target.value})} className="w-full bg-[#F9F7F5] border border-neutral-200 rounded-xl p-3.5 text-sm font-medium focus:outline-none focus:border-[#964B36] transition-colors" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Cédula / Pasaporte</label>
                <input required type="text" value={formData.cedula} onChange={e => setFormData({...formData, cedula: e.target.value})} className="w-full bg-[#F9F7F5] border border-neutral-200 rounded-xl p-3.5 text-sm font-medium focus:outline-none focus:border-[#964B36] transition-colors" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">WhatsApp</label>
                  <input required type="tel" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} className="w-full bg-[#F9F7F5] border border-neutral-200 rounded-xl p-3.5 text-sm font-medium focus:outline-none focus:border-[#964B36] transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Correo Autorizado</label>
                  <input required type="email" value={formData.email} readOnly className="w-full bg-neutral-100 border border-neutral-200 rounded-xl p-3.5 text-sm font-medium text-neutral-400 cursor-not-allowed" />
                </div>
              </div>
              <div className="pt-6 mt-2 border-t border-neutral-100">
                <button type="submit" disabled={cargandoReserva} className="w-full bg-[#964B36] text-white font-bold uppercase tracking-[0.2em] text-xs py-4 rounded-xl hover:bg-[#7d3e2c] transition-all shadow-xl hover:-translate-y-0.5 disabled:opacity-70 flex justify-center items-center">
                  {cargandoReserva ? <span className="animate-pulse">Procesando...</span> : 'Confirmar Reserva Oficial'}
                </button>
              </div>
            </form>
          </div>
        )}

        {paso === 'exito' && (
          <div className="max-w-md mx-auto bg-white p-8 md:p-12 rounded-3xl border border-[#EAE3DC] shadow-2xl text-center animate-in zoom-in-95 duration-500 mb-10 mt-10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">✓</div>
            <h2 className="text-2xl font-medium text-neutral-900 mb-2">¡Solicitud Recibida!</h2>
            <p className="text-sm text-neutral-500 mb-8 font-medium">La solicitud de bloqueo para la <strong>Unidad {unidadSeleccionada.id}</strong> ha sido enviada con éxito a nuestro equipo comercial.</p>
            <div className="mb-6">
              <button onClick={enviarNotificacionReservaWhatsApp} className="w-full bg-[#25D366] hover:bg-[#1DA851] text-white font-bold uppercase tracking-[0.1em] text-xs py-4 rounded-xl transition-all shadow-lg hover:-translate-y-0.5 flex justify-center items-center gap-2">
                <span>📲 Notificar a mi Asesor</span>
              </button>
            </div>
            <button onClick={() => window.location.reload()} className="mt-4 text-[10px] font-bold text-neutral-400 hover:text-neutral-800 uppercase tracking-widest transition-colors">Finalizar y volver al inicio</button>
          </div>
        )}
      </main>
    </div>
  );
}