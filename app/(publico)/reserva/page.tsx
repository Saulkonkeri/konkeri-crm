// Actualizacion para Vercel - Reserva Express (Fix Zoom Celular, Vistas en Modal y Parqueos)
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

// INVENTARIO REAL - AGOSTO 2026
const INVENTARIO = [
  // PISO 6
  { id: '604', piso: 6, tipo: '2 Dormitorios', vista: 'Wyndham Poseidón / Mar', precio: 205865, area: 106.65, estado: 'RESERVADO' },
  { id: '603', piso: 6, tipo: '3 Dorms (Esquinero)', vista: 'Panorámica a La Quadra / Umiña / Mar', precio: 293967, area: 152.72, estado: 'DISPONIBLE' },
  { id: '602', piso: 6, tipo: '1 Dormitorio', vista: 'La Quadra / Umiña / Mar', precio: 169369, area: 86.60, estado: 'DISPONIBLE' },
  { id: '601', piso: 6, tipo: '3 Dormitorios', vista: 'La Quadra / Umiña / Mar', precio: 308760, area: 158.54, estado: 'RESERVADO' },
  // PISO 5
  { id: '504', piso: 5, tipo: '2 Dormitorios', vista: 'Wyndham Poseidón / Mar', precio: 201794, area: 106.65, estado: 'RESERVADO' },
  { id: '503', piso: 5, tipo: '3 Dorms (Esquinero)', vista: 'Panorámica a La Quadra / Umiña / Mar', precio: 290840, area: 152.72, estado: 'DISPONIBLE' },
  { id: '502', piso: 5, tipo: '1 Dormitorio', vista: 'La Quadra / Umiña / Mar', precio: 165702, area: 86.60, estado: 'DISPONIBLE' },
  { id: '501', piso: 5, tipo: '3 Dormitorios', vista: 'La Quadra / Umiña / Mar', precio: 303228, area: 158.54, estado: 'DISPONIBLE' },
  // PISO 4
  { id: '404', piso: 4, tipo: '2 Dormitorios', vista: 'Wyndham Poseidón / Mar', precio: 199677, area: 106.65, estado: 'DISPONIBLE' },
  { id: '403', piso: 4, tipo: '3 Dorms (Esquinero)', vista: 'Panorámica a La Quadra / Umiña / Mar', precio: 287042, area: 152.72, estado: 'DISPONIBLE' },
  { id: '402', piso: 4, tipo: '1 Dormitorio', vista: 'La Quadra / Umiña / Mar', precio: 163257, area: 86.60, estado: 'DISPONIBLE' },
  { id: '401', piso: 4, tipo: '3 Dormitorios', vista: 'La Quadra / Umiña / Mar', precio: 299079, area: 158.54, estado: 'RESERVADO' },
  // PISO 3
  { id: '301', piso: 3, tipo: '1 Dormitorio', vista: 'Urbanización', precio: 131529, area: 70.25, estado: 'DISPONIBLE' },
  { id: '305', piso: 3, tipo: '1 Dormitorio', vista: 'Wyndham Poseidón / Mar', precio: 152779, area: 78.87, estado: 'DISPONIBLE' },
  { id: '304', piso: 3, tipo: '3 Dorms (Esquinero)', vista: 'Panorámica a La Quadra / Umiña / Mar', precio: 284732, area: 152.68, estado: 'DISPONIBLE' },
  { id: '303', piso: 3, tipo: '1 Dormitorio', vista: 'La Quadra / Umiña / Mar', precio: 161128, area: 86.76, estado: 'DISPONIBLE' },
  { id: '302', piso: 3, tipo: '2 Dormitorios', vista: 'La Quadra / Umiña / Mar', precio: 221487, area: 121.61, estado: 'DISPONIBLE' },
  // PISO 2
  { id: '201', piso: 2, tipo: '1 Dormitorio', vista: 'Urbanización', precio: 130981, area: 70.25, estado: 'DISPONIBLE' },
  { id: '205', piso: 2, tipo: '1 Dormitorio', vista: 'Wyndham Poseidón / Mar', precio: 151259, area: 78.87, estado: 'DISPONIBLE' },
  { id: '204', piso: 2, tipo: '3 Dorms (Esquinero)', vista: 'Panorámica a La Quadra / Umiña / Mar', precio: 281458, area: 152.72, estado: 'DISPONIBLE' },
  { id: '203', piso: 2, tipo: '1 Dormitorio', vista: 'La Quadra / Umiña / Mar', precio: 159095, area: 86.66, estado: 'RESERVADO' },
  { id: '202', piso: 2, tipo: '2 Dormitorios', vista: 'La Quadra / Umiña / Mar', precio: 218918, area: 121.61, estado: 'DISPONIBLE' },
];

const PISOS_EDIFICIO = [6, 5, 4, 3, 2];

// FACHADA AJUSTADA: Se eliminó el "null" inicial en pisos 6, 5 y 4
const LAYOUT_FACHADA: Record<number, string[]> = {
  6: ['604', '603', '602', '601'],
  5: ['504', '503', '502', '501'],
  4: ['404', '403', '402', '401'],
  3: ['301', '305', '304', '303', '302'],
  2: ['201', '205', '204', '203', '202'],
};

// GALERÍA DE VISTAS (Supabase)
const FOTOS_VISTAS: Record<string, { titulo: string, url: string }> = {
  'urb': { titulo: 'Vista a la Urbanización', url: 'https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/vistas%20arienzo/vista%20a%20la%20urbanizacion%20(1).jpg' },
  'wyndham': { titulo: 'Vista Lateral', url: 'https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/vistas%20arienzo/vista%20a%20mikonos.jpg' },
  'panoramica': { titulo: 'Vista Panorámica Frontal', url: 'https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/vistas%20arienzo/vista%20principal%20(1).jpg' }
};

// Función de ayuda para sacar el key de la vista según el texto
const obtenerKeyVista = (vistaText: string) => {
  if (vistaText.includes('Urbanización')) return 'urb';
  if (vistaText.includes('Wyndham')) return 'wyndham';
  return 'panoramica';
};

export default function ReservaExpressPage() {
  const [paso, setPaso] = useState<'acceso' | 'filtro' | 'mapa' | 'formulario' | 'exito'>('acceso');
  
  const [emailAcceso, setEmailAcceso] = useState('');
  const [cargandoAcceso, setCargandoAcceso] = useState(false);
  const [errorAcceso, setErrorAcceso] = useState('');

  const [filtroTipo, setFiltroTipo] = useState<string | null>(null);
  const [unidadSeleccionada, setUnidadSeleccionada] = useState<any>(null);
  const [vistaActiva, setVistaActiva] = useState<string | null>(null);

  const [formData, setFormData] = useState({ nombres: '', cedula: '', email: '', telefono: '' });
  const [cargandoReserva, setCargandoReserva] = useState(false);

  // 1. DISPARO SILENCIOSO AL SERVIDOR: INGRESO VIP
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
    } catch (e) {
      console.log("Notificación silenciosa omitida");
    }
  };

  // VALIDACIÓN DE ACCESO VIP CON SUPABASE
  const verificarAcceso = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargandoAcceso(true);
    setErrorAcceso('');

    const correoLimpio = emailAcceso.trim().toLowerCase();

    try {
      const { data, error } = await supabase
        .from('accesos_inventario')
        .select('expira_en')
        .eq('email', correoLimpio)
        .single();

      if (error || !data) {
        setErrorAcceso('Este correo no cuenta con una invitación activa.');
        setCargandoAcceso(false);
        return;
      }

      const ahora = new Date();
      const fechaExpiracion = new Date(data.expira_en);

      if (ahora > fechaExpiracion) {
        setErrorAcceso('Tu invitación ha expirado. Solicita una nueva a tu asesor Konkeri.');
        setCargandoAcceso(false);
        return;
      }

      // Conceder acceso
      setFormData({ ...formData, email: correoLimpio });
      setPaso('filtro');
      
      // Enviar correo de notificación a Saul en silencio
      notificarIngresoSilencioso(correoLimpio);

    } catch (err) {
      setErrorAcceso('Ocurrió un error al verificar. Intenta nuevamente.');
    }
    
    setCargandoAcceso(false);
  };

  // 2. DISPARO SILENCIOSO AL SERVIDOR: RESERVA CONFIRMADA
  const procesarReserva = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargandoReserva(true);

    try {
      // Disparamos el correo automático de reserva
      await fetch('/api/notificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: "reserva",
          datos: {
            nombres: formData.nombres,
            cedula: formData.cedula,
            telefono: formData.telefono,
            email: formData.email,
            unidadId: unidadSeleccionada.id,
            tipoUnidad: unidadSeleccionada.tipo,
            precio: unidadSeleccionada.precio.toLocaleString('en-US')
          }
        })
      });
    } catch (error) {
      console.error("Error notificando reserva:", error);
    }

    setCargandoReserva(false);
    setPaso('exito');
  };

  const seleccionarFiltro = (tipo: string) => {
    setFiltroTipo(tipo);
    setPaso('mapa');
  };

  const obtenerDatosUnidad = (id: string | null) => {
    if (!id) return null;
    return INVENTARIO.find(u => u.id === id) || null;
  };

  // CONTACTO DIRECTO POR WHATSAPP CON DEBBI
  const contactarAsesor = () => {
    const telefonoDebbi = "593979469472"; 
    const mensaje = `Hola Debbi, estoy revisando el inventario VIP y me interesa cotizar la *Unidad ${unidadSeleccionada?.id}* (${unidadSeleccionada?.tipo}). ¿Podemos conversar?`;
    window.open(`https://wa.me/${telefonoDebbi}?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  // REPORTE WHATSAPP MANUAL DE RESPALDO AL FINAL
  const enviarNotificacionReservaWhatsApp = () => {
    const telefonoDebbi = "593979469472"; 
    const mensaje = `🚨 *¡NUEVA RESERVA EN LÍNEA!* 🚨\n\nEl cliente *${formData.nombres}* acaba de bloquear la unidad:\n\n🏢 *Unidad:* ${unidadSeleccionada?.id} (${unidadSeleccionada?.tipo})\n💵 *Precio:* $${unidadSeleccionada?.precio.toLocaleString('en-US')}\n🆔 *Cédula:* ${formData.cedula}\n📱 *WhatsApp:* ${formData.telefono}\n📧 *Email:* ${formData.email}\n\n¡Entra al CRM para validar la transferencia de $2,500!`;
    window.open(`https://wa.me/${telefonoDebbi}?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#F9F7F5] font-sans pb-20 relative">
      
      {paso !== 'acceso' && (
        <header className="bg-white border-b border-[#EAE3DC] px-6 py-4 sticky top-0 z-40 flex justify-center shadow-sm">
          <div className="text-center cursor-pointer" onClick={() => setPaso('filtro')}>
            <h1 className="text-lg font-light tracking-[0.2em] text-neutral-900 uppercase">Arienzo</h1>
            <p className="text-[9px] font-bold tracking-widest text-[#B94A36] uppercase mt-0.5">Boutique Living</p>
          </div>
        </header>
      )}

      <main className="max-w-5xl mx-auto px-3 md:px-4 mt-6">
        
        {/* PASO 0: PUERTA VIP */}
        {paso === 'acceso' && (
          <div className="min-h-[80vh] flex flex-col items-center justify-center animate-in fade-in duration-700 px-4">
            <div className="bg-white p-8 md:p-12 rounded-3xl border border-[#EAE3DC] shadow-xl max-w-md w-full text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-[#B94A36]"></div>
              
              <h1 className="text-3xl font-light tracking-[0.2em] text-neutral-900 uppercase mt-4">Arienzo</h1>
              <p className="text-[9px] font-bold tracking-widest text-[#B94A36] uppercase mt-1 mb-8">Boutique Living</p>

              <h2 className="text-xl font-light text-neutral-800 mb-2">Acceso Exclusivo</h2>
              <p className="text-xs text-neutral-500 mb-8 px-2">Ingresa tu correo electrónico autorizado para visualizar el inventario y lista de precios en tiempo real.</p>
              
              <form onSubmit={verificarAcceso} className="space-y-4">
                <div>
                  <input 
                    type="email" 
                    required 
                    value={emailAcceso} 
                    onChange={(e) => setEmailAcceso(e.target.value)}
                    placeholder="tucorreo@ejemplo.com" 
                    // TEXT-BASE (16px) es la clave aquí para evitar que el celular haga zoom
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-base text-center focus:outline-none focus:border-[#B94A36] focus:ring-1 focus:ring-[#B94A36] transition-all"
                  />
                </div>
                {errorAcceso && <p className="text-xs text-red-500">{errorAcceso}</p>}
                
                <button 
                  type="submit" 
                  disabled={cargandoAcceso} 
                  className="w-full bg-neutral-900 text-white font-bold uppercase tracking-widest text-xs py-4 rounded-xl hover:bg-black transition-all shadow-lg shadow-neutral-900/20 disabled:opacity-70 flex justify-center items-center"
                >
                  {cargandoAcceso ? <span className="animate-pulse">Verificando...</span> : 'Acceder al Inventario'}
                </button>
              </form>
              
              <div className="mt-8 pt-6 border-t border-neutral-100">
                <p className="text-[10px] text-neutral-400">Si no tienes acceso, solicita una invitación a tu asesor Konkeri.</p>
              </div>
            </div>
          </div>
        )}

        {/* PASO 1: FILTRO DE TIPOLOGÍA */}
        {paso === 'filtro' && (
          <div className="max-w-lg mx-auto text-center space-y-8 animate-in zoom-in-95 duration-500 mt-10 md:mt-20">
            <div>
              <h2 className="text-3xl font-light text-neutral-900 mb-2 px-2">Selecciona la tipología de departamento.</h2>
              <p className="text-sm text-neutral-500 px-4">Para explorar el inventario, indícanos qué distribución se adapta a tu requerimiento.</p>
            </div>
            
            <div className="flex flex-col gap-4 px-2">
              <button onClick={() => seleccionarFiltro('1 Dormitorio')} className="w-full bg-white border border-[#EAE3DC] p-5 sm:p-6 rounded-2xl shadow-sm hover:border-[#B94A36] hover:shadow-md transition-all group relative overflow-hidden text-left">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#B94A36] transform -translate-x-full group-hover:translate-x-0 transition-transform"></div>
                <h3 className="text-xl font-bold text-neutral-800 uppercase tracking-wide">Suite / 1 Dormitorio</h3>
                <p className="text-xs text-neutral-400 mt-1">Ideal para ejecutivos o inversión dinámica.</p>
              </button>

              <button onClick={() => seleccionarFiltro('2 Dormitorios')} className="w-full bg-white border border-[#EAE3DC] p-5 sm:p-6 rounded-2xl shadow-sm hover:border-[#B94A36] hover:shadow-md transition-all group relative overflow-hidden text-left">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#B94A36] transform -translate-x-full group-hover:translate-x-0 transition-transform"></div>
                <h3 className="text-xl font-bold text-neutral-800 uppercase tracking-wide">2 Dormitorios</h3>
                <p className="text-xs text-neutral-400 mt-1">Equilibrio perfecto de espacio y confort.</p>
              </button>

              <button onClick={() => seleccionarFiltro('3 Dormitorios')} className="w-full bg-white border border-[#EAE3DC] p-5 sm:p-6 rounded-2xl shadow-sm hover:border-[#B94A36] hover:shadow-md transition-all group relative overflow-hidden text-left">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#B94A36] transform -translate-x-full group-hover:translate-x-0 transition-transform"></div>
                <h3 className="text-xl font-bold text-neutral-800 uppercase tracking-wide">3 Dormitorios</h3>
                <p className="text-xs text-neutral-400 mt-1">Amplitud máxima para familias y comodidad total.</p>
              </button>
            </div>
          </div>
        )}

        {/* PASO 2: MAPA DE FACHADA */}
        {paso === 'mapa' && (
          <div className="space-y-4 md:space-y-6 animate-in slide-in-from-bottom-8 duration-500 w-full max-w-4xl mx-auto">
            
            <div className="flex flex-col md:flex-row md:justify-between md:items-end px-1 gap-4">
              <div>
                <button onClick={() => setPaso('filtro')} className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2 hover:text-[#B94A36] flex items-center gap-1">
                  ← Volver a opciones
                </button>
                <h2 className="text-xl md:text-2xl font-light text-neutral-800 uppercase tracking-wide">Unidades de {filtroTipo?.replace('s (Esquinero)', 's')}</h2>
                <p className="text-[10px] md:text-xs text-neutral-500 mt-1">Navega por la fachada. Toca una unidad para ver su detalle.</p>
              </div>

              <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl border border-neutral-200 shadow-sm w-full md:w-auto justify-center">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 md:w-4 md:h-4 bg-white border-[1.5px] border-[#B94A36] rounded inline-block shadow-sm"></span>
                  <span className="text-[9px] md:text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Unidad Disponible</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-3 md:p-8 rounded-2xl md:rounded-3xl border border-[#EAE3DC] shadow-sm relative w-full">
              <div className="flex flex-col w-full">

                {/* ROOFTOP */}
                <div className="flex items-stretch gap-1 md:gap-2 mb-2 w-full">
                  <div className="w-12 md:w-20 text-[7px] md:text-[9px] font-bold text-neutral-500 uppercase flex items-center justify-end pr-2 md:pr-4">Cima</div>
                  <div className="flex-1 bg-[#D1C292]/30 border border-[#D1C292]/50 p-2 md:p-3 rounded-t-xl text-center flex items-center justify-center">
                    <span className="text-[8px] md:text-[10px] font-bold text-[#8A7A55] uppercase tracking-widest">Rooftop & Amenidades Exclusivas</span>
                  </div>
                </div>

                {/* VISTAS */}
                <div className="flex items-stretch gap-1 md:gap-2 mb-2 w-full">
                  <div className="w-12 md:w-20 flex flex-col justify-center pr-2 md:pr-4">
                    <span className="text-[7px] md:text-[9px] font-bold text-neutral-500 uppercase tracking-widest text-right leading-tight">Vistas</span>
                  </div>
                  {/* GRID RECALIBRADO MATEMÁTICAMENTE: 4fr 4fr 10fr 5fr 9fr */}
                  <div className="flex-1 grid grid-cols-[4fr_4fr_10fr_5fr_9fr] gap-1 md:gap-2">
                    <button onClick={() => setVistaActiva('urb')} className="col-span-1 bg-neutral-50 hover:bg-neutral-100 shadow-sm rounded-md py-1.5 px-1 flex flex-col items-center justify-center border border-neutral-200 cursor-pointer">
                      <span className="text-[5px] md:text-[7px] font-bold uppercase tracking-widest text-neutral-500 text-center leading-tight">A la<br/>Urbanización</span>
                    </button>
                    <button onClick={() => setVistaActiva('wyndham')} className="col-span-1 bg-sky-50/50 hover:bg-sky-50 shadow-sm rounded-md py-1.5 px-1 flex flex-col items-center justify-center border border-sky-100 cursor-pointer">
                      <span className="text-[5px] md:text-[7px] font-bold uppercase tracking-widest text-sky-700 text-center leading-tight">Al Wyndham /<br/>Mar</span>
                    </button>
                    <button onClick={() => setVistaActiva('panoramica')} className="col-span-3 bg-[#B94A36]/5 hover:bg-[#B94A36]/10 shadow-sm rounded-md py-1.5 px-1 flex flex-col items-center justify-center border border-[#B94A36]/20 cursor-pointer">
                      <span className="text-[5px] md:text-[7px] font-bold uppercase tracking-widest text-[#B94A36] text-center leading-tight">Panorámica Frontal: La Quadra / Umiña / Mar</span>
                    </button>
                  </div>
                </div>

                {/* PISOS */}
                {PISOS_EDIFICIO.map(piso => (
                  <div key={piso} className="flex items-stretch gap-1 md:gap-2 mb-1 md:mb-2 w-full">
                    <div className="w-12 md:w-20 flex items-center justify-end pr-2 md:pr-4 text-[9px] md:text-[11px] font-bold text-neutral-500 uppercase">P{piso}</div>
                    {/* GRID RECALIBRADO MATEMÁTICAMENTE */}
                    <div className="flex-1 grid gap-1 md:gap-2 grid-cols-[4fr_4fr_10fr_5fr_9fr]">
                      {LAYOUT_FACHADA[piso].map((idUnidad, colIndex) => {
                        if (!idUnidad) return <div key={`empty-${piso}-${colIndex}`} className="invisible"></div>;
                        const unidad = obtenerDatosUnidad(idUnidad);
                        if (!unidad) return null;

                        const tipoBase = unidad.tipo.includes('3 Dorms') ? '3 Dormitorios' : unidad.tipo;
                        const noCoincide = tipoBase !== filtroTipo;
                        const reservado = unidad.estado === 'RESERVADO';
                        const desactivado = noCoincide || reservado;
                        
                        let botonEstilo = desactivado ? "bg-neutral-50 border border-neutral-200 cursor-not-allowed opacity-90" : "bg-white border-[1.5px] border-[#B94A36] shadow-sm cursor-pointer transform hover:-translate-y-1 hover:shadow-md hover:bg-orange-50/20";
                        
                        // Ocupan las 2 columnas visuales
                        if (['604', '504', '404'].includes(unidad.id)) {
                          botonEstilo += " col-span-2";
                        }

                        let textoIdEstilo = desactivado ? "text-neutral-400" : "text-[#B94A36] font-bold";
                        let textoTipoEstilo = desactivado ? "text-neutral-400" : "text-neutral-800 font-medium";

                        return (
                          <button
                            key={unidad.id}
                            disabled={desactivado}
                            onClick={() => { if(!desactivado) setUnidadSeleccionada(unidad) }}
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
                  <div className="flex-1 bg-neutral-800 text-neutral-300 p-3 md:p-5 rounded-b-2xl text-center flex flex-col justify-center shadow-md">
                    <span className="text-[8px] md:text-[11px] font-bold text-white uppercase tracking-widest">Planta Baja</span>
                    <span className="text-[6px] md:text-[8px] mt-1 md:mt-1.5 uppercase tracking-widest opacity-80">Ingreso Vehicular • Locales Comerciales • Lobby Design</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* MODAL VISOR DE VISTA CON FOTO */}
        {vistaActiva && (
          <div className="fixed inset-0 bg-neutral-900/60 z-[60] flex flex-col items-center justify-center p-4 sm:p-6 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setVistaActiva(null)}>
            <div className="relative w-full max-w-3xl bg-white p-2 md:p-4 rounded-2xl shadow-2xl flex flex-col items-center animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setVistaActiva(null)} className="absolute top-4 right-4 bg-white/80 backdrop-blur text-neutral-800 w-8 h-8 rounded-full flex items-center justify-center font-bold hover:bg-neutral-200 z-10 shadow-sm">&times;</button>
              <div className="w-full rounded-xl overflow-hidden relative bg-neutral-100">
                <img src={FOTOS_VISTAS[vistaActiva].url} alt={FOTOS_VISTAS[vistaActiva].titulo} className="w-full max-h-[60vh] object-contain" />
              </div>
              <div className="mt-4 text-center pb-2 w-full">
                <h3 className="text-sm md:text-base font-bold text-neutral-800 uppercase tracking-wide">{FOTOS_VISTAS[vistaActiva].titulo}</h3>
                <span className="text-[9px] md:text-[10px] text-neutral-400 uppercase tracking-widest mt-1 block">Toma de Dron - Arienzo Boutique Living</span>
              </div>
            </div>
          </div>
        )}

        {/* MODAL FICHA EXPRESS */}
        {unidadSeleccionada && paso === 'mapa' && !vistaActiva && (
          <div className="fixed inset-0 bg-neutral-900/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 transform transition-transform animate-in slide-in-from-bottom-8">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[10px] font-bold tracking-widest text-[#B94A36] uppercase bg-[#B94A36]/10 px-2 py-1 rounded">Unidad Seleccionada</span>
                  <h3 className="text-3xl font-light text-neutral-900 mt-2">Dpto. {unidadSeleccionada.id}</h3>
                </div>
                <button onClick={() => setUnidadSeleccionada(null)} className="bg-neutral-100 text-neutral-500 w-8 h-8 rounded-full flex items-center justify-center font-bold hover:bg-neutral-200">&times;</button>
              </div>

              <div className="space-y-3 bg-[#F9F7F5] p-4 rounded-xl border border-[#EAE3DC] text-sm">
                <div className="flex justify-between border-b border-neutral-200/60 pb-2">
                  <span className="text-neutral-500">Distribución</span>
                  <span className="font-bold text-neutral-800">{unidadSeleccionada.tipo}</span>
                </div>
                
                <div className="flex justify-between border-b border-neutral-200/60 pb-2">
                  <span className="text-neutral-500">Área Total</span>
                  <span className="font-bold text-neutral-800">{unidadSeleccionada.area} m²</span>
                </div>
                
                {/* MODIFICACIÓN: VISTA CON BOTÓN INTEGRADO */}
                <div className="flex justify-between border-b border-neutral-200/60 pb-2 items-start">
                  <span className="text-neutral-500">Vista / Orientación</span>
                  <div className="text-right w-[60%] flex flex-col items-end">
                    <span className="font-bold text-neutral-800 leading-tight">{unidadSeleccionada.vista}</span>
                    <button 
                      onClick={() => setVistaActiva(obtenerKeyVista(unidadSeleccionada.vista))} 
                      className="text-[10px] text-[#B94A36] font-bold underline mt-1.5 cursor-pointer flex items-center gap-1 hover:text-[#9B3B2B]"
                    >
                      <span>👁️</span> Ver imagen de la vista
                    </button>
                  </div>
                </div>

                {/* MODIFICACIÓN: PRECIO CON DETALLE DE PARQUEOS Y BODEGAS */}
                <div className="flex justify-between pt-1 items-center">
                  <span className="text-neutral-500 font-medium mt-1">Inversión Total</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-[#B94A36] font-mono block leading-none">
                      ${unidadSeleccionada.precio.toLocaleString('en-US')}
                    </span>
                    <span className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest block mt-1.5">
                      {unidadSeleccionada.tipo.includes('3 Dorm') 
                        ? 'Incluye 2 parqueos y 1 bodega' 
                        : 'Incluye 1 parqueo y 1 bodega'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button onClick={() => setPaso('formulario')} className="w-full bg-neutral-900 text-white font-bold uppercase tracking-widest text-xs py-4 rounded-xl hover:bg-black transition-colors shadow-lg shadow-neutral-900/20">
                  Bloquear Unidad por $2,500
                </button>
                
                <button onClick={contactarAsesor} className="w-full bg-white border border-[#25D366] text-[#25D366] font-bold uppercase tracking-widest text-xs py-3.5 rounded-xl hover:bg-green-50 transition-colors flex items-center justify-center gap-2">
                  <span>💬 Cotizar con Asesor</span>
                </button>

                <p className="text-center text-[10px] text-neutral-400 px-2 leading-tight">El pago se realiza mediante transferencia posterior a la validación de tus datos.</p>
              </div>
            </div>
          </div>
        )}

        {/* FORMULARIO KYC EXPRESS */}
        {paso === 'formulario' && (
          <div className="max-w-md mx-auto bg-white p-6 md:p-8 rounded-2xl border border-[#EAE3DC] shadow-sm animate-in slide-in-from-right-8 mt-10">
            <button onClick={() => setPaso('mapa')} className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-6 hover:text-[#B94A36] flex items-center gap-1">← Volver al plano</button>
            <h3 className="text-xl font-light text-neutral-900 mb-1">Registro de Inversionista</h3>
            <p className="text-xs text-neutral-500 mb-6 border-b border-neutral-100 pb-4">Ingresa tus datos legales para asignar el bloqueo de la <strong>Unidad {unidadSeleccionada.id}</strong> a tu nombre.</p>

            <form onSubmit={procesarReserva} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Nombres Completos</label>
                <input required type="text" value={formData.nombres} onChange={e => setFormData({...formData, nombres: e.target.value})} 
                  // TEXT-BASE (16px) en todos los inputs para evitar zoom en celular
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-base focus:outline-none focus:border-[#B94A36]" placeholder="Tal como aparece en tu documento" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Cédula / Pasaporte</label>
                <input required type="text" value={formData.cedula} onChange={e => setFormData({...formData, cedula: e.target.value})} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-base focus:outline-none focus:border-[#B94A36]" placeholder="Número de identidad" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">WhatsApp</label>
                  <input required type="tel" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-base focus:outline-none focus:border-[#B94A36]" placeholder="099..." />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Correo Electrónico</label>
                  <input required type="email" value={formData.email} readOnly className="w-full bg-neutral-100 border border-neutral-200 rounded-lg p-3 text-base text-neutral-500 cursor-not-allowed" />
                </div>
              </div>

              <div className="pt-6 mt-2 border-t border-neutral-100">
                <button type="submit" disabled={cargandoReserva} className="w-full bg-[#B94A36] text-white font-bold uppercase tracking-widest text-xs py-4 rounded-xl hover:bg-[#9B3B2B] transition-colors shadow-lg shadow-[#B94A36]/20 disabled:opacity-70 flex justify-center items-center">
                  {cargandoReserva ? <span className="animate-pulse">Asegurando Unidad...</span> : 'Confirmar Reserva Oficial'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* PANTALLA DE ÉXITO */}
        {paso === 'exito' && (
          <div className="max-w-md mx-auto bg-white p-8 rounded-2xl border-2 border-emerald-500 shadow-xl text-center animate-in zoom-in-95 duration-500 mb-10 mt-10">
            <h2 className="text-2xl font-light text-neutral-900 mb-2">¡Unidad Asegurada!</h2>
            <p className="text-sm text-neutral-600 mb-6">Hola {formData.nombres}, la <strong>Unidad {unidadSeleccionada.id}</strong> ha sido bloqueada exitosamente a tu nombre en nuestro sistema.</p>
            
            <div className="mb-6">
              <button 
                onClick={enviarNotificacionReservaWhatsApp}
                className="w-full bg-[#25D366] hover:bg-[#1DA851] text-white font-bold uppercase tracking-wider text-xs py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>📲 Notificar Reserva a Asesores</span>
              </button>
              <p className="text-[9px] text-neutral-400 mt-1.5">Haz clic aquí para enviar el reporte a WhatsApp de Konkeri.</p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse"></div>
              <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-1">Tiempo Restante para Formalizar</p>
              <p className="text-3xl font-mono font-bold text-red-700">23:59:59</p>
              <p className="text-xs text-red-800/70 mt-2">Tienes 24 horas para realizar la transferencia de $2,500 y evitar que la unidad vuelva al mercado.</p>
            </div>

            <div className="text-left bg-neutral-50 p-4 rounded-lg border border-neutral-200 text-xs text-neutral-700 space-y-2 font-mono">
              <p className="font-bold text-neutral-900 font-sans uppercase text-[10px] border-b pb-2 mb-2">Datos Bancarios (Konkeri S.A.S.)</p>
              <p><strong>Banco:</strong> Produbanco</p>
              <p><strong>Tipo de Cuenta:</strong> Ahorros</p>
              <p><strong>Número de Cuenta:</strong> 12006887517</p>
              <p><strong>RUC:</strong> 1391937895001</p>
              <p><strong>Monto:</strong> $2,500.00 USD</p>
            </div>
            
            <p className="text-[10px] text-neutral-500 mt-4 px-2">
              Una vez efectuada la transferencia, agradeceremos nos puedan enviar el comprobante al correo <strong>ventas@konkeri.com</strong>.
            </p>

            <button onClick={() => window.location.reload()} className="mt-8 text-xs font-bold text-neutral-400 hover:text-neutral-800 uppercase underline">
              Finalizar y salir
            </button>
          </div>
        )}

      </main>
    </div>
  );
}