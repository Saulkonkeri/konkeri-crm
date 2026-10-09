'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';

// Generador de UUID matemático (Para que no falle el radar)
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// === BASE DE DATOS DE MODELOS ARIENZO ===
const modelosArienzo = [
  { id: 'm1', area: '69.43m²', dorms: 1, banos: '1.5 Baños', lavanderia: true, extras: 'Terraza', imagen: 'https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/planos%20para%20landing/1D_%2069,43m2.png' },
  { id: 'm2', area: '86.78m²', dorms: 1, banos: '1.5 Baños', lavanderia: true, extras: 'Terraza', imagen: 'https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/planos%20para%20landing/1D_86,78m2.png' },
  { id: 'm3', area: '100.02m²', dorms: 2, banos: '2 Baños', lavanderia: true, extras: 'Terraza', imagen: 'https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/planos%20para%20landing/2D_100.2m2.png' },
  { id: 'm4', area: '106.65m²', dorms: 2, banos: '2.5 Baños', lavanderia: true, extras: 'Terraza', imagen: 'https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/planos%20para%20landing/2D_106,65m2.png' },
  { id: 'm5', area: '121.61m²', dorms: 2, banos: '2.5 Baños', lavanderia: true, extras: 'Terraza', imagen: 'https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/planos%20para%20landing/2D_121,61m2.png' },
  { id: 'm6', area: '129.42m²', dorms: 2, banos: '2.5 Baños', lavanderia: true, extras: 'Terraza', imagen: 'https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/planos%20para%20landing/2d_129,42m2.png' },
  { id: 'm7', area: '150.14m²', dorms: 3, banos: '3.5 Baños', lavanderia: true, extras: 'Terraza', imagen: 'https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/planos%20para%20landing/3D_150,14m2.png' },
  { id: 'm8', area: '158.77m²', dorms: 3, banos: '3.5 Baños', lavanderia: true, extras: 'Terraza', imagen: 'https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/planos%20para%20landing/3D_158,77m2.png' },
];

export default function ArienzoLandingPremium() {
  const [mostrarModalVip, setMostrarModalVip] = useState(false);
  const [mostrarModalCalendly, setMostrarModalCalendly] = useState(false);
  const [mostrarModalBrochure, setMostrarModalBrochure] = useState(false);
  const [mostrarModalPlano, setMostrarModalPlano] = useState(false); 
  
  const [imagenIndex, setImagenIndex] = useState<number | null>(null);
  const [planoZoom, setPlanoZoom] = useState<string | null>(null); 
  const [cargando, setCargando] = useState(false);
  const [solicitudEnviada, setSolicitudEnviada] = useState(false);
  const [brochureDescargado, setBrochureDescargado] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const carruselRef = useRef<HTMLDivElement>(null);
  const [modeloActivo, setModeloActivo] = useState(modelosArienzo[0]);

  const [formData, setFormData] = useState({ nombres: '', telefono: '', email: '', modeloCotizado: '' });
  const [formBrochure, setFormBrochure] = useState({ nombres: '', telefono: '', email: '' });

  const imagenesGaleria = useMemo(() => [
    "https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/render-Exterior-Frontal.jpg",
    "https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/render-PISCINA-PARA-PAGINA.jpg",
    "https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/render-Interior-Departamento-1.jpg",
    "https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/render-living2.jpg",
    "https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/render-Exterior-Derecho-A4.jpg",
    "https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/Arienzo-Plaza-Comercial-1-1.jpg"
  ], []);

  const imagenesInfinitas = useMemo(() => {
    return Array(15).fill(imagenesGaleria).flat();
  }, [imagenesGaleria]);

  const trackEvent = async (accion: string, detalle: string, datosUsuario?: { email?: string, telefono?: string }) => {
    try {
      let visitorId = localStorage.getItem('arienzo_visitor_id');
      if (!visitorId) {
        visitorId = generateUUID();
        localStorage.setItem('arienzo_visitor_id', visitorId);
      }

      let sessionId = sessionStorage.getItem('arienzo_session_id');
      if (!sessionId || sessionId.startsWith('sess-')) {
        sessionId = generateUUID();
        sessionStorage.setItem('arienzo_session_id', sessionId);
      }

      const eventId = generateUUID();
      const urlParams = new URLSearchParams(window.location.search);
      const emailConocido = localStorage.getItem('arienzo_lead_email') || datosUsuario?.email || formData.email || formBrochure.email;

      const { error } = await supabase.from('tracking_inventario').insert([{
        visitor_id: visitorId,
        session_id: sessionId,
        email_cliente: emailConocido || 'Anónimo',
        accion,
        detalle,
        metadata: {
          utm_source: urlParams.get('utm_source'),
          utm_campaign: urlParams.get('utm_campaign'),
          referrer: document.referrer || 'Directo',
          dispositivo: /Mobile|Android|iP(hone|od|ad)/i.test(navigator.userAgent) ? 'Móvil' : 'Desktop',
          meta_event_id: eventId
        }
      }]);

      if (error) console.error("Error en Radar:", error);
    } catch (error) {
      console.error("Error general tracking:", error);
    }
  };

  useEffect(() => {
    if (!sessionStorage.getItem('visita_registrada_landing')) {
      trackEvent('VISITA_LANDING', 'Ingresó a la página principal de Arienzo');
      sessionStorage.setItem('visita_registrada_landing', 'true');
    }

    const handleScrollNav = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScrollNav);
    
    if (carruselRef.current) {
      setTimeout(() => {
        if (carruselRef.current && carruselRef.current.children.length > 5) {
          const itemCentral = carruselRef.current.children[5] as HTMLElement;
          const scrollPos = itemCentral.offsetLeft - (window.innerWidth / 2) + (itemCentral.clientWidth / 2);
          carruselRef.current.scrollTo({ left: scrollPos, behavior: 'instant' });
        }
      }, 200);
    }

    return () => window.removeEventListener('scroll', handleScrollNav);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      if (imagenIndex !== null) {
        if (e.key === 'ArrowRight') setImagenIndex((prev) => prev !== null ? (prev + 1) % imagenesGaleria.length : null);
        else if (e.key === 'ArrowLeft') setImagenIndex((prev) => prev !== null ? (prev - 1 + imagenesGaleria.length) % imagenesGaleria.length : null);
        else if (e.key === 'Escape') setImagenIndex(null);
      } else if (planoZoom) {
        if (e.key === 'Escape') setPlanoZoom(null);
      } else if (mostrarModalPlano) {
        if (e.key === 'Escape') setMostrarModalPlano(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [imagenIndex, imagenesGaleria.length, planoZoom, mostrarModalPlano]);

  const clickImagen = (index: number) => { 
    const realIndex = index % imagenesGaleria.length;
    trackEvent('VIO_ARQUITECTURA', `Abrió render ${realIndex + 1} de la galería`); 
    setImagenIndex(realIndex); 
  };
  
  const prevImagen = (e?: React.MouseEvent) => { 
    if(e) e.stopPropagation(); 
    setImagenIndex((prev) => prev !== null ? (prev - 1 + imagenesGaleria.length) % imagenesGaleria.length : null); 
  };
  
  const nextImagen = (e?: React.MouseEvent) => { 
    if(e) e.stopPropagation(); 
    setImagenIndex((prev) => prev !== null ? (prev + 1) % imagenesGaleria.length : null); 
  };

  const abrirPlanoInteractivo = (mod: any) => {
    setModeloActivo(mod);
    setMostrarModalPlano(true);
    trackEvent('VIO_PLANO', `Abrió modal inmersivo del modelo ${mod.area}`);
  };

  const abrirModalVIP = (modeloOpcional?: string) => { 
    if(modeloOpcional) {
      setFormData({...formData, modeloCotizado: modeloOpcional});
      trackEvent('INICIO_COTIZACION', `Clic en cotizar modelo: ${modeloOpcional}`);
    } else {
      setFormData({...formData, modeloCotizado: ''});
      trackEvent('ABRIO_FORMULARIO', 'Hizo clic en botón de Registrarse'); 
    }
    setMostrarModalVip(true); 
  };
  
  const abrirCalendly = () => { 
    trackEvent('ABRIO_CALENDLY', 'Abrió modal de agendamiento'); 
    setMostrarModalCalendly(true); 
  };

  const procesarSolicitudVIP = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    const correoLimpio = formData.email.trim().toLowerCase();
    
    if (!correoLimpio.includes('@') || !correoLimpio.includes('.')) {
      alert("Por favor ingresa un correo electrónico válido.");
      setCargando(false);
      return;
    }

    const origenDinamico = formData.modeloCotizado ? `Landing - Cotización de ${formData.modeloCotizado}` : 'Web Pública - Registro Landing';

    try {
      const { error: errorUpsert } = await supabase.from('clientes').upsert([{
        nombres: formData.nombres,
        telefono: formData.telefono,
        email: correoLimpio,
        tipo: 'prospecto',
        origen: origenDinamico,
        campana: 'Lanzamiento Arienzo Web',
        estado: 'Interesado',
        temperatura: '☀️ Tibio',
        estado_acceso: 'pendiente',
        created_at: new Date().toISOString()
      }], { onConflict: 'email' }); 

      if (errorUpsert) {
        console.error("ERROR UPSERT CLIENTES:", errorUpsert);
        alert("Hubo un problema al registrar tus datos en la base. Inténtalo de nuevo.");
        setCargando(false);
        return;
      }

      localStorage.setItem('arienzo_lead_email', correoLimpio);
      await trackEvent('REGISTRO_COMPLETADO', `Se registró exitosamente. Correo: ${correoLimpio}`, { email: correoLimpio, telefono: formData.telefono });

      setSolicitudEnviada(true);
    } catch (error) {
      console.error("ERROR CRÍTICO CAPTURA LEAD:", error);
      alert("Ocurrió un error inesperado.");
    } finally {
      setCargando(false);
    }
  };

  const procesarDescargaBrochure = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    const correoLimpio = formBrochure.email.trim().toLowerCase();

    if (!correoLimpio.includes('@') || !correoLimpio.includes('.')) {
      alert("Por favor ingresa un correo electrónico válido.");
      setCargando(false);
      return;
    }

    try {
      const { error: errorDescarga } = await supabase.from('clientes').upsert([{
        nombres: formBrochure.nombres,
        telefono: formBrochure.telefono,
        email: correoLimpio,
        tipo: 'prospecto',
        origen: 'Web Pública - Descarga Brochure',
        campana: 'Lanzamiento Arienzo Web',
        estado: 'Interesado',
        temperatura: '☀️ Tibio',
        created_at: new Date().toISOString()
      }], { onConflict: 'email' });

      if (errorDescarga) {
        console.error("ERROR DESCARGA BROCHURE CLIENTES:", errorDescarga);
        alert("Hubo un problema al procesar tu descarga. Inténtalo de nuevo.");
        setCargando(false);
        return;
      }

      localStorage.setItem('arienzo_lead_email', correoLimpio);
      await trackEvent('DESCARGA_BROCHURE', `Descargó el brochure. Correo: ${correoLimpio}`, { email: correoLimpio, telefono: formBrochure.telefono });

      window.open('https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/documentos-publicos/Brochure_Arienzo%20.pdf', '_blank');
      setBrochureDescargado(true);
      
      setTimeout(() => {
        setMostrarModalBrochure(false);
        setBrochureDescargado(false);
        setFormBrochure({ nombres: '', telefono: '', email: '' });
      }, 4000);
      
    } catch (error) {
      console.error("ERROR CRÍTICO DESCARGA:", error);
      alert("Ocurrió un error inesperado.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F7F5] text-neutral-800 selection:bg-[#964B36] selection:text-white overflow-x-hidden" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      
      {/* NAVEGACIÓN */}
      <header className={`fixed top-0 w-full z-40 transition-all duration-500 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm py-5 md:py-6' : 'bg-transparent py-6 md:py-8'}`}>
        <div className="max-w-7xl mx-auto px-5 md:px-12 flex justify-between items-center">
          <img 
            src={scrolled ? "https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/arienzo-logo-terracota.svg" : "https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/arienzo-logo-blanco.svg"} 
            alt="Arienzo Logo"
            className="w-[120px] md:w-[160px] h-auto transition-all duration-500"
          />
          <button 
            onClick={() => abrirModalVIP()}
            className={`text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-3 md:px-6 md:py-3.5 rounded-full transition-all duration-300 ${scrolled ? 'bg-[#964B36] text-white hover:bg-[#7d3e2c] shadow-md' : 'bg-white/20 backdrop-blur-md text-white border border-white/40 hover:bg-white hover:text-[#964B36]'}`}
          >
            Registrarse
          </button>
        </div>
      </header>

      {/* 1. HERO INMERSIVO */}
      <section className="relative h-[100vh] min-h-[650px] flex flex-col items-center justify-center">
        <img 
          src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/render-Exterior-Frontal.jpg" 
          alt="Arienzo Fachada"
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/10 to-black/60 z-0"></div>

        <div className="relative z-10 text-center px-6 w-full max-w-4xl mx-auto pt-20">
          <div className="inline-block px-5 py-2 border border-[#D1C292]/60 backdrop-blur-md rounded-full mb-6 md:mb-8 shadow-[0_0_15px_rgba(209,194,146,0.2)]">
            <span className="text-[11px] md:text-[13px] font-bold tracking-[0.35em] text-[#D1C292] uppercase">
              Próximamente en Manta
            </span>
          </div>
          <h1 className="text-[2rem] leading-tight md:text-5xl lg:text-[4rem] font-medium text-white md:leading-tight mb-6 md:mb-8 tracking-tight drop-shadow-xl max-w-3xl mx-auto">
            Todo empieza con <br />
            <span className="font-light italic text-[#F9F7F5]">una buena ubicación.</span>
          </h1>
          <p className="text-sm md:text-xl text-neutral-100 font-medium max-w-2xl mx-auto mb-8 md:mb-10 leading-relaxed drop-shadow-md">
            Colección exclusiva de solo 22 departamentos de 1, 2 y 3 dormitorios. Accede primero a la disponibilidad y precios de lanzamiento en planos.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4">
            <button 
              onClick={abrirCalendly}
              className="group w-full sm:w-auto bg-[#964B36] text-white px-6 py-3.5 md:px-8 md:py-4 rounded-full text-[10px] md:text-[11px] font-bold uppercase tracking-[0.15em] transition-all duration-300 shadow-[0_4px_20px_rgba(150,75,54,0.4)] hover:shadow-[0_8px_30px_rgba(150,75,54,0.6)] hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              <svg className="w-3.5 h-3.5 opacity-90 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              Agendar Presentación
            </button>
            <button 
              onClick={() => abrirModalVIP()}
              className="w-full sm:w-auto bg-white/10 backdrop-blur-sm border border-white/40 text-white px-6 py-3.5 md:px-8 md:py-4 rounded-full text-[10px] md:text-[11px] font-bold uppercase tracking-[0.15em] hover:bg-white hover:text-[#964B36] transition-all duration-300 hover:-translate-y-1"
            >
              Solicitar Precios
            </button>
          </div>
        </div>

        <div className="absolute bottom-6 right-6 md:bottom-10 md:right-10 z-20 flex flex-col items-end opacity-90 hover:opacity-100 transition-opacity">
          <span className="text-[6px] md:text-[8px] font-medium text-white/80 uppercase tracking-[0.3em] mb-1 drop-shadow-md">Diseño Arquitectónico</span>
          <div className="flex items-center gap-2">
            <div className="w-4 md:w-8 h-[1px] bg-[#D1C292] shadow-sm"></div>
            <span className="text-[9px] md:text-[11px] font-bold tracking-[0.2em] text-[#D1C292] uppercase drop-shadow-md">Diez + Muller</span>
          </div>
        </div>
      </section>

      {/* 2. UBICACIÓN */}
      <section className="py-20 md:py-32 px-6 bg-[#F9F7F5] relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px]"></div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-16 items-center">
            
            {/* Textos de ubicación */}
            <div className="md:col-span-5 z-10 order-2 md:order-1">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-[2px] w-8 bg-[#964B36]"></div>
                <span className="text-[13px] font-bold tracking-[0.25em] text-[#964B36] uppercase">Barbasquillo, Manta</span>
              </div>
              <h3 className="text-3xl md:text-4xl font-medium text-neutral-900 leading-tight mb-6 md:mb-8 tracking-tight">
                La mejor zona <br className="hidden md:block"/> de la ciudad.
              </h3>
              <p className="text-sm md:text-base text-neutral-600 font-medium leading-relaxed mb-6">
                Vivir en Arienzo es disfrutar de una ubicación estratégica. A pasos de La Quadra y del nuevo Riocentro Plaza Barbasquillo, con acceso inmediato a hoteles, restaurantes y las principales vías de conexión.
              </p>
            </div>

            {/* Contenedor de la Imagen del Mapa */}
            <div className="md:col-span-7 relative order-1 md:order-2 flex justify-center md:justify-end">
              <div className="relative w-full max-w-[600px]">
                
                <div className="absolute -inset-4 bg-[#D1C292]/20 rounded-2xl transform translate-x-4 translate-y-4 hidden md:block z-0"></div>
                
                <div className="relative w-full aspect-[4/5] md:aspect-[3/4] rounded-xl overflow-hidden shadow-2xl group z-10 bg-[#EAE3DC]">
                  <img 
                    src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/ubicacion-arienzo3.jpg" 
                    alt="Ubicación Manta" 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-500"></div>

                  {/* === MARCADOR ADAPTATIVO (MÓVIL vs DESKTOP) === */}
                  {/* Móvil: top-[87.2%] (0.6% más abajo que antes), left-[41.4%] */}
                  <div className="absolute md:top-[86.1%] top-[87.2%] md:left-[43.4%] left-[41.4%] -translate-x-1/2 -translate-y-1/2 z-20 flex items-center drop-shadow-xl">
                    
                    {/* Etiqueta Blanca delgada */}
                    <div className="bg-white/95 backdrop-blur-md px-3 py-1 rounded-sm shadow-md whitespace-nowrap z-10">
                      <span className="text-[8px] md:text-[10px] font-bold tracking-[0.08em] text-[#21242E] uppercase">Ubicación Arienzo</span>
                    </div>
                    
                    {/* Línea blanca conectora */}
                    <div className="w-8 md:w-12 h-[2px] bg-white shadow-sm -ml-0.5 -mr-0.5 z-0"></div>
                    
                    {/* Punto Verde Titilante */}
                    <div className="relative flex h-4 w-4 md:h-5 md:w-5 items-center justify-center shrink-0 z-10">
                      <span className="animate-ping absolute inline-flex h-8 w-8 md:h-10 md:w-10 rounded-full bg-[#25D366] opacity-75 duration-1000"></span>
                      <span className="relative inline-flex rounded-full h-full w-full bg-[#25D366] border-[1.5px] border-white shadow-md"></span>
                    </div>
                    
                  </div>
                  {/* === FIN MARCADOR === */}

                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LA FRANJA TERRACOTA */}
      <div className="relative h-[200px] md:h-[280px] flex justify-center items-center shadow-inner z-20 bg-[#964B36] overflow-hidden">
        <img 
          src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/familia-en-sala-banco-imagenes-ia.jpg" 
          alt="Familia en Arienzo" 
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30"
        />
        <div className="absolute inset-0 bg-[#964B36]/70"></div>
        <div className="relative z-10 w-[200px] md:w-[300px] h-[60px] md:h-[90px] hover:scale-105 transition-transform duration-700">
          <img 
            src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/logo-dorado-arienzo.svg" 
            alt="Arienzo Boutique Living" 
            className="w-full h-full object-contain drop-shadow-2xl" 
          />
        </div>
      </div>

      {/* 3. AMENIDADES */}
      <section className="py-20 md:py-28 px-6 bg-white border-y border-[#EAE3DC] relative overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16 md:mb-20">
            <span className="text-[13px] font-bold tracking-[0.25em] text-[#964B36] uppercase mb-4 block">Amenidades Exclusivas</span>
            <h3 className="text-3xl md:text-4xl font-medium text-neutral-900 tracking-tight mb-6">
              Espacios pensados para vivir.
            </h3>
            <p className="max-w-2xl mx-auto text-sm md:text-base text-neutral-500 font-medium leading-relaxed">
              El rooftop reúne las áreas comunes en un solo nivel, organizadas para una circulación fluida y funcionamiento eficiente, elevando tu experiencia diaria.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group bg-white rounded-2xl overflow-hidden border border-[#EAE3DC] shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2">
              <div className="aspect-[4/3] overflow-hidden relative">
                <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/render-PISCINA-PARA-PAGINA.jpg" alt="Piscina" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              </div>
              <div className="p-8">
                <div className="w-8 h-[2px] bg-[#D1C292] mb-4 transition-all duration-300 group-hover:w-16"></div>
                <h4 className="text-xl font-medium text-neutral-900 mb-3">Piscina & Rooftop</h4>
                <p className="text-sm text-neutral-600 font-medium leading-relaxed">
                  Concebida desde la experiencia de uso. Un ambiente donde el bienestar, el diseño y la comodidad encuentran el equilibrio perfecto, incluyendo un área de BBQ.
                </p>
              </div>
            </div>

             <div className="group bg-white rounded-2xl overflow-hidden border border-[#EAE3DC] shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2">
              <div className="aspect-[4/3] overflow-hidden relative">
                <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/render-living-arienzo.jpg" alt="Living" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              </div>
              <div className="p-8">
                <div className="w-8 h-[2px] bg-[#D1C292] mb-4 transition-all duration-300 group-hover:w-16"></div>
                <h4 className="text-xl font-medium text-neutral-900 mb-3">Social Living & Gym</h4>
                <p className="text-sm text-neutral-600 font-medium leading-relaxed">
                  Un ambiente flexible que integra áreas de descanso, coworking y un gimnasio panorámico. Pensado para entrenar o trabajar de forma remota.
                </p>
              </div>
            </div>

             <div className="group bg-white rounded-2xl overflow-hidden border border-[#EAE3DC] shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2">
              <div className="aspect-[4/3] overflow-hidden relative">
                <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/Arienzo-Plaza-Comercial-1-1.jpg" alt="Comercial" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              </div>
              <div className="p-8">
                <div className="w-8 h-[2px] bg-[#D1C292] mb-4 transition-all duration-300 group-hover:w-16"></div>
                <h4 className="text-xl font-medium text-neutral-900 mb-3">Área Comercial</h4>
                <p className="text-sm text-neutral-600 font-medium leading-relaxed">
                  Un retail de planta baja curado para complementar tu experiencia. Marcas seleccionadas por su calidad, conveniencia y afinidad con el proyecto.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4.5. ESPACIOS DE AUTOR                                                    */}
      {/* ========================================================================= */}
      <section className="py-20 md:py-28 px-4 md:px-8 bg-[#F9F7F5] border-b border-[#EAE3DC] font-sans relative overflow-hidden">
        
        {/* Luces de fondo arquitectónicas para dar emoción y profundidad */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#D1C292]/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#964B36]/5 rounded-full blur-[100px] pointer-events-none z-0"></div>

        <div className="max-w-4xl mx-auto relative z-10">
          
          {/* TÍTULO DE LA SECCIÓN (Texto original, diseño premium) */}
          <div className="text-center mb-12 md:mb-16">
            <span className="inline-block px-5 py-2 rounded-full border border-[#964B36]/20 bg-white shadow-sm text-[10px] md:text-[11px] font-bold tracking-[0.3em] text-[#964B36] uppercase mb-5">
              Espacios de Autor
            </span>
            <h2 className="text-[#21242E] text-3xl md:text-5xl font-medium tracking-tight mb-5 leading-tight">
              Departamentos de 1, 2 y <br className="hidden md:block" /> 3 dormitorios
            </h2>
            <p className="max-w-2xl mx-auto text-sm md:text-[17px] text-neutral-500 font-medium leading-relaxed">
              Explore las diferentes áreas y distribuciones, y encuentre el departamento que mejor se adapte a sus requerimientos.
            </p>
          </div>

          {/* GRID DE BOTONES CON LÍNEAS ARQUITECTÓNICAS (Tamaño perfecto h-20 md:h-24) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 max-w-3xl mx-auto">
            {modelosArienzo.map((mod) => (
              <button
                key={mod.id}
                onClick={() => abrirPlanoInteractivo(mod)}
                className="group relative flex flex-col items-center justify-center py-4 px-2 w-full h-20 md:h-24 rounded-2xl transition-all duration-500 border-[2px] border-dashed border-[#D1C292]/70 bg-white/90 backdrop-blur-sm shadow-[0_8px_20px_rgba(0,0,0,0.03)] hover:bg-white hover:border-solid hover:border-[#964B36]/70 hover:shadow-[0_20px_40px_rgba(150,75,54,0.15)] hover:-translate-y-2 overflow-hidden"
              >
                {/* Acento estético que se desliza al hover */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#D1C292] to-[#964B36] scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500 ease-out"></div>
                
                <span className="text-[#415364] group-hover:text-[#964B36] text-xl md:text-2xl font-bold tracking-tight transition-colors mb-1.5">
                  {mod.area.replace('m²', '')}
                  <span className="text-xs font-normal text-neutral-400 ml-0.5 group-hover:text-[#964B36]/70">m²</span>
                </span>
                
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-[#D1C292] group-hover:text-[#964B36] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M3 16h18M5 12V8a2 2 0 012-2h10a2 2 0 012 2v4M7 16v2m10-2v2"></path>
                  </svg>
                  <span className="text-neutral-500 group-hover:text-[#964B36] text-[10px] font-bold uppercase tracking-[0.2em] transition-colors">{mod.dorms} Dorm.</span>
                </div>
              </button>
            ))}
          </div>

        </div>
      </section>

      {/* MODAL INMERSIVO DEL PLANO INTERACTIVO */}
      {mostrarModalPlano && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 md:p-6 bg-[#21242E]/90 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setMostrarModalPlano(false)}>
          
          <div className="bg-white w-full max-w-4xl rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl flex flex-col relative animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
            
            {/* BOTÓN CERRAR */}
            <button 
              onClick={() => setMostrarModalPlano(false)}
              className="absolute top-4 right-4 md:top-5 md:right-5 w-8 h-8 md:w-10 md:h-10 bg-neutral-100 hover:bg-[#964B36] text-neutral-500 hover:text-white rounded-full flex items-center justify-center transition-colors z-20 shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>

            {/* CONTENIDO DEL MODAL */}
            <div className="flex flex-col w-full">
              
              {/* CABECERA (TÍTULO Y ÁREA) */}
              <div className="px-6 pt-8 pb-4 md:px-10 md:pt-10 text-center border-b border-[#EAE3DC] bg-white">
                <h3 className="text-[10px] md:text-xs font-bold tracking-[0.3em] text-[#964B36] uppercase mb-1.5 md:mb-2">Distribución Espacial</h3>
                <div className="text-2xl md:text-4xl font-medium text-neutral-900 tracking-tight">{modeloActivo.area}</div>
              </div>

              {/* ZONA DEL PLANO */}
              <div className="w-full h-[280px] sm:h-[350px] md:h-[420px] bg-[#FDFCFB] flex items-center justify-center p-4 md:p-8 relative group cursor-zoom-in" onClick={(e) => { e.stopPropagation(); setPlanoZoom(modeloActivo.imagen); }}>
                <img 
                  src={modeloActivo.imagen} 
                  alt={`Plano Arienzo ${modeloActivo.area}`}
                  className="max-w-full max-h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-[1.02]"
                />
                {/* Lupita siempre visible en móvil para invitar al zoom */}
                <div className="absolute bottom-3 right-3 sm:bottom-5 sm:right-5 bg-white/90 backdrop-blur-md rounded-full p-2.5 sm:p-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shadow-md text-[#964B36] animate-pulse md:animate-none">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path></svg>
                </div>
              </div>

              {/* ZONA DE ÍCONOS Y BOTONES */}
              <div className="bg-white px-4 py-5 md:px-10 md:py-6 border-t border-[#EAE3DC] flex flex-col gap-6">
                
                {/* Fila de Íconos */}
                <div className="flex flex-row items-center justify-between sm:justify-center w-full gap-2 sm:gap-10 text-[#415364]">
                  
                  <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-center">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 stroke-current text-[#964B36]" fill="none" viewBox="0 0 24 24" strokeWidth="1.2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M3 16h18M5 12V8a2 2 0 012-2h10a2 2 0 012 2v4M7 16v2m10-2v2"></path>
                    </svg>
                    <span className="text-[10px] sm:text-xs md:text-sm font-medium leading-tight">{modeloActivo.dorms} Dorm.</span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-center">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 stroke-current text-[#964B36]" fill="none" viewBox="0 0 24 24" strokeWidth="1.2">
                       <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v6m-4 0h8m-6 4v1m4-1v1m-2 2v1"></path>
                       <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a4 4 0 00-4 4"></path>
                    </svg>
                    <span className="text-[10px] sm:text-xs md:text-sm font-medium leading-tight">{modeloActivo.banos}</span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-center">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 stroke-current text-[#964B36]" fill="none" viewBox="0 0 24 24" strokeWidth="1.2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 21v-4a2 2 0 012-2h12a2 2 0 012 2v4M4 15V8a2 2 0 012-2h12a2 2 0 012 2v7M8 15v6M16 15v6"></path>
                    </svg>
                    <span className="text-[10px] sm:text-xs md:text-sm font-medium leading-tight">{modeloActivo.extras}</span>
                  </div>
                  
                  {modeloActivo.lavanderia && (
                    <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-center">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 stroke-current text-[#964B36]" fill="none" viewBox="0 0 24 24" strokeWidth="1.2">
                        <rect x="5" y="3" width="14" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round"></rect>
                        <circle cx="12" cy="13" r="4" strokeLinecap="round" strokeLinejoin="round"></circle>
                        <path d="M8 7h3" strokeLinecap="round" strokeLinejoin="round"></path>
                      </svg>
                      <span className="text-[10px] sm:text-xs md:text-sm font-medium leading-tight">Lavandería</span>
                    </div>
                  )}

                </div>

                {/* Botones CTA */}
                <div className="flex flex-col sm:flex-row justify-center items-center gap-3 md:gap-4 mt-1">
                  <button 
                    onClick={() => { setMostrarModalPlano(false); abrirModalVIP(`Distribución de ${modeloActivo.area}`); }}
                    className="w-full sm:w-auto bg-[#21242E] text-white px-8 py-3.5 md:px-10 md:py-4 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-[0.15em] hover:bg-black transition-all duration-300 shadow-xl flex items-center justify-center hover:-translate-y-0.5"
                  >
                    Cotizar este Depto.
                  </button>
                  <a 
                    href={`https://wa.me/593979469472?text=${encodeURIComponent(`Hola, quiero cotizar el modelo de ${modeloActivo.area} de${modeloActivo.dorms} dormitorio(s) en el proyecto Arienzo.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackEvent('CLIC_WHATSAPP', 'Hizo clic en WhatsApp desde Modal Plano')}
                    className="w-full sm:w-auto bg-transparent border border-[#25D366] text-[#25D366] px-8 py-3.5 md:px-10 md:py-4 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-[0.15em] hover:bg-[#25D366] hover:text-white transition-all duration-300 flex items-center justify-center gap-2 hover:-translate-y-0.5"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                    Hablar con un asesor
                  </a>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. GALERÍA DEL PROYECTO */}
      <section className="py-12 md:py-16 bg-[#21242E] relative overflow-hidden text-center">
        <div className="max-w-6xl mx-auto relative z-10 px-6 mb-6">
          <span className="text-[11px] font-bold tracking-[0.25em] text-[#D1C292] uppercase mb-3 block">Galería del Proyecto</span>
          <h3 className="text-2xl md:text-3xl font-medium text-white tracking-tight">Imágenes que hablan por sí solas.</h3>
        </div>

        <div className="relative w-full z-20 mb-8">
          <div 
            ref={carruselRef}
            className="flex overflow-x-auto snap-x snap-mandatory gap-4 md:gap-8 px-[50vw] py-8 items-center scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            {imagenesInfinitas.map((img, index) => (
              <div 
                key={index} 
                onClick={() => clickImagen(index)} 
                className="relative shrink-0 snap-center w-[75vw] md:w-[40vw] max-w-[600px] aspect-[4/3] md:aspect-[16/9] rounded-2xl overflow-hidden cursor-pointer shadow-[0_15px_35px_rgba(0,0,0,0.3)] transition-all duration-500 hover:scale-[1.02] bg-[#1a1d24] group"
              >
                <img 
                  src={img} 
                  alt={`Render ${(index % imagenesGaleria.length) + 1}`} 
                  className="absolute inset-0 w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity duration-500" 
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300"></div>
                
                <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path></svg>
                </div>
              </div>
            ))}
          </div>
          
          <div className="max-w-6xl mx-auto px-6 mt-2 relative z-10 flex justify-center">
            <span className="flex items-center justify-center gap-2 text-[9px] font-bold tracking-[0.2em] text-white/40 uppercase">
              Desliza para explorar
            </span>
          </div>
        </div>

        <div className="pt-4 max-w-lg mx-auto flex flex-col items-center relative z-10 px-6">
          <button 
            onClick={() => setMostrarModalBrochure(true)}
            className="bg-transparent border border-[#D1C292] text-[#D1C292] px-8 py-3 rounded-full text-[10px] md:text-[11px] font-bold uppercase tracking-[0.15em] hover:bg-[#D1C292] hover:text-[#21242E] transition-all duration-300 w-full sm:w-auto"
          >
            Descargar Brochure Oficial
          </button>
        </div>
      </section>

      {/* LIGHTBOX GALERÍA (Click en pantalla para ZOOM OUT) */}
      {imagenIndex !== null && (
        <div 
          className="fixed inset-0 bg-[#21242E]/98 z-[70] flex items-center justify-center p-4 md:p-8 backdrop-blur-md animate-in fade-in cursor-zoom-out" 
          onClick={() => setImagenIndex(null)}
        >
          <button className="absolute top-6 right-6 text-white/50 hover:text-white text-4xl font-light transition-colors z-50 cursor-pointer" onClick={(e) => { e.stopPropagation(); setImagenIndex(null); }}>&times;</button>
          <button onClick={(e) => { e.stopPropagation(); prevImagen(e); }} className="absolute left-2 md:left-10 text-white/40 hover:text-white text-4xl md:text-7xl p-2 md:p-4 z-50 transition-all hover:scale-110 cursor-pointer">&#8249;</button>
          
          <div className="relative w-full max-w-5xl h-[80vh] flex items-center justify-center">
            <img 
              src={imagenesGaleria[imagenIndex]} 
              alt="Vista Ampliada" 
              className="max-w-full max-h-[80vh] object-contain rounded-md shadow-2xl pointer-events-none" 
            />
          </div>
          
          <button onClick={(e) => { e.stopPropagation(); nextImagen(e); }} className="absolute right-2 md:right-10 text-white/40 hover:text-white text-4xl md:text-7xl p-2 md:p-4 z-50 transition-all hover:scale-110 cursor-pointer">&#8250;</button>
        </div>
      )}

      {/* LIGHTBOX ZOOM PLANOS (Click en pantalla para ZOOM OUT) */}
      {planoZoom && (
        <div 
          className="fixed inset-0 bg-white/95 z-[80] flex items-center justify-center p-8 md:p-24 backdrop-blur-md animate-in fade-in cursor-zoom-out" 
          onClick={() => setPlanoZoom(null)}
        >
          <button className="absolute top-6 right-6 text-neutral-400 hover:text-neutral-900 text-4xl font-light transition-colors z-50 cursor-pointer" onClick={(e) => { e.stopPropagation(); setPlanoZoom(null); }}>&times;</button>
          
          <div className="relative w-full h-full max-w-6xl mx-auto flex items-center justify-center">
            <img 
              src={planoZoom} 
              alt="Plano Ampliado" 
              className="max-w-full max-h-full object-contain mix-blend-multiply drop-shadow-2xl animate-in zoom-in-95 pointer-events-none" 
            />
          </div>
        </div>
      )}

      {/* 6. VISIÓN DE INVERSIÓN */}
      <section className="py-16 md:py-24 px-6 bg-[#FDFCFB] relative border-t border-[#EAE3DC] overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#D1C292]/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
        
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="w-[1px] h-12 bg-gradient-to-b from-transparent to-[#964B36] mx-auto mb-6"></div>
          
          <span className="text-[11px] font-bold tracking-[0.25em] text-[#964B36] uppercase mb-4 block">Inversión Temprana</span>
          <h3 className="text-3xl md:text-4xl font-medium text-neutral-900 mb-6 tracking-tight">Visión de Inversión</h3>
          
          <p className="text-sm md:text-base text-neutral-600 font-medium leading-relaxed mb-8">
            Arienzo representa una entrada estratégica en un sector premium consolidado. Ingresar en la etapa de <strong className="font-semibold text-[#964B36]">lanzamiento en planos</strong> permite capturar la mayor plusvalía del proyecto. Un formato íntimo que ofrece exclusividad y flexibilidad, ideal tanto para residencia principal como para modelo de renta.
          </p>

          <button 
            onClick={() => abrirModalVIP()}
            className="inline-flex items-center justify-center gap-3 text-[11px] font-bold tracking-[0.15em] bg-[#21242E] text-white px-8 py-3.5 rounded-full hover:bg-[#964B36] hover:-translate-y-1 transition-all duration-300 shadow-xl"
          >
            CONSULTAR PRECIOS EN PLANOS <span className="text-base">→</span>
          </button>
        </div>
      </section>

      {/* 7. RESPALDO INSTITUCIONAL */}
      <section className="py-20 md:py-28 px-6 bg-[#21242E] text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 md:mb-20">
            <span className="text-[13px] font-bold tracking-[0.3em] text-[#D1C292] uppercase mb-4 block">Trayectoria Sólida</span>
            <h3 className="text-3xl md:text-4xl font-medium text-white tracking-tight">Respaldo Inmobiliario</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 md:divide-x divide-white/10">
            <div className="md:px-8 text-center group">
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#D1C292] block mb-3">Arquitectura</span>
              <h4 className="text-lg md:text-xl font-medium text-white mb-4">DIEZ + MULLER</h4>
              <p className="text-sm text-neutral-400 font-medium leading-relaxed">
                Reconocido y premiado estudio quiteño. Autores de grandes proyectos en la capital y de su exclusivo proyecto en la costa, el edificio Serene en Manta.
              </p>
            </div>
            <div className="md:px-8 text-center group border-t border-white/10 md:border-t-0 pt-8 md:pt-0">
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#D1C292] block mb-3">Construcción</span>
              <h4 className="text-lg md:text-xl font-medium text-white mb-4">CARRASCO SUAREZ</h4>
              <p className="text-sm text-neutral-400 font-medium leading-relaxed">
                Constructora con sólida trayectoria desde 1992. Amplia experiencia ejecutando obras residenciales premium en la costa ecuatoriana.
              </p>
            </div>
            <div className="md:px-8 text-center group border-t border-white/10 md:border-t-0 pt-8 md:pt-0">
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#D1C292] block mb-3">Desarrollo y Ventas</span>
              <h4 className="text-lg md:text-xl font-medium text-white mb-4">KONKERI</h4>
              <p className="text-sm text-neutral-400 font-medium leading-relaxed">
                Promotora enfocada en el desarrollo integral de proyectos con visión a largo plazo y tecnología avanzada.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. CERRADA FINAL */}
      <section className="py-20 md:py-28 bg-[#F9F7F5] text-center px-6 relative border-b-[2px] border-[#D1C292] overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[14rem] md:text-[22rem] font-bold text-[#EAE3DC]/40 pointer-events-none select-none z-0 tracking-tighter leading-none">
          22
        </div>
        
        <div className="max-w-2xl mx-auto flex flex-col items-center relative z-10">
          <h2 className="text-[11px] font-bold tracking-[0.3em] text-[#964B36] uppercase mb-4">Colección Limitada</h2>
          <h3 className="text-3xl md:text-4xl font-medium tracking-tight text-neutral-900 mb-4">Sé uno de los 22 propietarios.</h3>
          <p className="text-sm md:text-base text-neutral-600 font-medium mb-10 leading-relaxed">
            El privilegio de pertenecer está limitado. Solicita tu registro para descubrir precios, tipologías y disponibilidad en tiempo real.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 w-full sm:w-auto">
            <button 
              onClick={abrirCalendly}
              className="group w-full sm:w-auto bg-[#964B36] text-white px-6 py-3.5 md:px-8 md:py-4 rounded-full text-[10px] md:text-[11px] font-bold uppercase tracking-[0.15em] transition-all duration-300 shadow-[0_4px_20px_rgba(150,75,54,0.4)] hover:shadow-[0_8px_30px_rgba(150,75,54,0.6)] hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              Agendar Presentación
            </button>
            <button 
              onClick={() => abrirModalVIP()}
              className="w-full sm:w-auto bg-[#21242E] text-white px-6 py-3.5 md:px-8 md:py-4 rounded-full text-[10px] md:text-[11px] font-bold uppercase tracking-[0.15em] hover:bg-black transition-all duration-300 hover:-translate-y-1 shadow-xl flex items-center justify-center"
            >
              Registrarse
            </button>
          </div>
        </div>
      </section>

      {/* MODAL REGISTRO VIP/COTIZADOR */}
      {mostrarModalVip && (
        <div className="fixed inset-0 bg-[#21242E]/95 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md p-10 rounded-2xl relative shadow-2xl animate-in zoom-in-95">
            <button 
              onClick={() => { setMostrarModalVip(false); setSolicitudEnviada(false); setFormData({...formData, modeloCotizado: ''}); }}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900 font-bold w-8 h-8 flex items-center justify-center bg-neutral-100 rounded-full transition-colors"
            >
              &times;
            </button>
            
            {!solicitudEnviada ? (
              <>
                <div className="text-center mb-8">
                  <div className="w-12 h-1 bg-[#964B36] mx-auto mb-6 rounded-full"></div>
                  <h3 className="text-2xl font-medium text-neutral-900 mb-2 tracking-tight">
                    {formData.modeloCotizado ? 'Solicitar Cotización' : 'Registro Arienzo'}
                  </h3>
                  <p className="text-xs text-neutral-500 font-medium">
                    {formData.modeloCotizado 
                      ? `Ingresa tus datos para recibir la información financiera y detalles del ${formData.modeloCotizado}.`
                      : 'Regístrate en el proyecto y te enviaremos la información financiera, disponibilidad en tiempo real y precios de lanzamiento.'
                    }
                  </p>
                </div>

                <form onSubmit={procesarSolicitudVIP} className="space-y-4">
                  <div>
                    <input 
                      required 
                      type="text" 
                      placeholder="Nombres Completos" 
                      autoComplete="name"
                      value={formData.nombres} 
                      onChange={e => setFormData({...formData, nombres: e.target.value.replace(/[0-9!@#\$%^&*()_+=\[\]{};':"\\|,.<>/?]/g, '')})} 
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm font-medium focus:outline-none focus:border-[#964B36] transition-colors" 
                    />
                  </div>
                  <div>
                    <input 
                      required 
                      type="tel" 
                      placeholder="WhatsApp (Solo números)" 
                      autoComplete="tel"
                      value={formData.telefono} 
                      onChange={e => setFormData({...formData, telefono: e.target.value.replace(/\D/g, '').slice(0, 15)})} 
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm font-medium focus:outline-none focus:border-[#964B36] transition-colors" 
                    />
                  </div>
                  <div>
                    <input 
                      required 
                      type="email" 
                      placeholder="Correo Electrónico" 
                      autoComplete="email"
                      value={formData.email} 
                      onChange={e => setFormData({...formData, email: e.target.value})} 
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm font-medium focus:outline-none focus:border-[#964B36] transition-colors" 
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={cargando}
                    className="w-full bg-[#964B36] text-white py-4 rounded-xl text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-[#7d3e2c] transition-all mt-4 shadow-lg disabled:opacity-70 flex justify-center items-center"
                  >
                    {cargando ? 'Enviando...' : (formData.modeloCotizado ? 'Enviar Solicitud' : 'Registrarse')}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl shadow-inner">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h3 className="text-2xl font-medium text-neutral-900 mb-3 tracking-tight">Solicitud Recibida</h3>
                <p className="text-sm text-neutral-500 font-medium leading-relaxed mb-8">
                  Nuestro equipo comercial validará tu información y se comunicará brevemente a tu WhatsApp.
                </p>
                <button 
                  onClick={() => { setMostrarModalVip(false); setSolicitudEnviada(false); setFormData({...formData, modeloCotizado: ''}); }}
                  className="bg-neutral-900 text-white rounded-xl px-8 py-4 text-[11px] font-bold uppercase tracking-widest hover:bg-neutral-800 transition-colors w-full"
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DESCARGA BROCHURE */}
      {mostrarModalBrochure && (
        <div className="fixed inset-0 bg-[#21242E]/95 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md p-10 rounded-2xl relative shadow-2xl animate-in zoom-in-95">
            <button 
              onClick={() => { setMostrarModalBrochure(false); setBrochureDescargado(false); }}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900 font-bold w-8 h-8 flex items-center justify-center bg-neutral-100 rounded-full transition-colors"
            >
              &times;
            </button>
            
            {!brochureDescargado ? (
              <>
                <div className="text-center mb-8">
                  <div className="w-12 h-1 bg-[#D1C292] mx-auto mb-6 rounded-full"></div>
                  <h3 className="text-2xl font-medium text-neutral-900 mb-2 tracking-tight">Descargar Brochure</h3>
                  <p className="text-xs text-neutral-500 font-medium">Ingresa tus datos para habilitar la descarga inmediata del archivo PDF oficial del proyecto.</p>
                </div>

                <form onSubmit={procesarDescargaBrochure} className="space-y-4">
                  <div>
                    <input 
                      required 
                      type="text" 
                      placeholder="Nombres Completos" 
                      autoComplete="name"
                      value={formBrochure.nombres} 
                      onChange={e => setFormBrochure({...formBrochure, nombres: e.target.value.replace(/[0-9!@#\$%^&*()_+=\[\]{};':"\\|,.<>/?]/g, '')})} 
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm font-medium focus:outline-none focus:border-[#D1C292] transition-colors" 
                    />
                  </div>
                  <div>
                    <input 
                      required 
                      type="tel" 
                      placeholder="WhatsApp (Solo números)" 
                      autoComplete="tel"
                      value={formBrochure.telefono} 
                      onChange={e => setFormBrochure({...formBrochure, telefono: e.target.value.replace(/\D/g, '').slice(0, 15)})} 
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm font-medium focus:outline-none focus:border-[#D1C292] transition-colors" 
                    />
                  </div>
                  <div>
                    <input 
                      required 
                      type="email" 
                      placeholder="Correo Electrónico" 
                      autoComplete="email"
                      value={formBrochure.email} 
                      onChange={e => setFormBrochure({...formBrochure, email: e.target.value})} 
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm font-medium focus:outline-none focus:border-[#D1C292] transition-colors" 
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={cargando}
                    className="w-full bg-[#21242E] text-white py-4 rounded-xl text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-black transition-all mt-4 shadow-lg disabled:opacity-70 flex justify-center items-center"
                  >
                    {cargando ? 'Procesando...' : 'Descargar PDF'}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl shadow-inner">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                </div>
                <h3 className="text-2xl font-medium text-neutral-900 mb-3 tracking-tight">¡Descarga en curso!</h3>
                <p className="text-sm text-neutral-500 font-medium leading-relaxed mb-8">
                  El brochure de Arienzo se está abriendo en una nueva pestaña.
                </p>
                <button 
                  onClick={() => { setMostrarModalBrochure(false); setBrochureDescargado(false); }}
                  className="bg-neutral-900 text-white rounded-xl px-8 py-4 text-[11px] font-bold uppercase tracking-widest hover:bg-neutral-800 transition-colors w-full"
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL CALENDLY */}
      {mostrarModalCalendly && (
        <div className="fixed inset-0 bg-[#21242E]/95 z-[60] flex items-center justify-center p-2 md:p-6 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-4xl h-[85vh] rounded-2xl relative shadow-2xl flex flex-col animate-in zoom-in-95 overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-neutral-100 bg-white">
              <h3 className="text-[11px] font-bold tracking-[0.2em] uppercase text-neutral-800">Agendar Asesoría Inmobiliaria</h3>
              <button 
                onClick={() => setMostrarModalCalendly(false)}
                className="w-8 h-8 flex items-center justify-center bg-neutral-100 text-neutral-500 hover:bg-neutral-200 rounded-full font-bold transition-colors"
              >
                &times;
              </button>
            </div>
            <div className="flex-1 w-full bg-[#F9F7F5]">
              <iframe 
                src="https://calendly.com/saul-intriago/asesoria-inmobiliaria" 
                className="w-full h-full border-none"
                title="Agendar Presentación"
              ></iframe>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-[#21242E] text-neutral-400 py-8 border-t border-[#D1C292]/30">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="text-xs font-medium tracking-wide text-center md:text-left order-1 md:order-1">
            Un proyecto de <a href="https://konkeri.com" target="_blank" rel="noopener noreferrer" className="text-[#D1C292] hover:text-white transition-colors font-bold tracking-widest ml-1">KONKERI</a>
          </div>
          <div className="flex justify-center order-2 md:order-2">
            <img 
              src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/logo-dorado-arienzo.svg" 
              alt="Arienzo" 
              className="w-[140px] md:w-[170px] h-auto opacity-90" 
            />
          </div>
          <div className="text-[10px] md:text-[11px] font-medium opacity-60 text-center md:text-right order-3 md:order-3">
            © {new Date().getFullYear()} Todos los derechos reservados.
          </div>
        </div>
      </footer>

    </div>
  );
}