'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function ArienzoLandingPremium() {
  const [mostrarModalVip, setMostrarModalVip] = useState(false);
  const [mostrarModalCalendly, setMostrarModalCalendly] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [solicitudEnviada, setSolicitudEnviada] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const [formData, setFormData] = useState({
    nombres: '',
    telefono: '',
    email: ''
  });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const procesarSolicitudVIP = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    const correoLimpio = formData.email.trim().toLowerCase();

    try {
      await supabase.from('clientes').upsert([{
        nombres: formData.nombres,
        telefono: formData.telefono,
        email: correoLimpio,
        tipo: 'prospecto',
        origen: 'Web Pública - Solicitud VIP'
      }], { onConflict: 'email' });

      await supabase.from('tracking_inventario').insert([{
        email_cliente: correoLimpio,
        accion: 'SOLICITUD_ACCESO_VIP',
        detalle: 'Completó formulario en landing page para pedir acceso'
      }]);

      setSolicitudEnviada(true);

      fetch('/api/notificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: "nueva_solicitud_web",
          datos: { nombres: formData.nombres, telefono: formData.telefono, email: correoLimpio }
        })
      }).catch(() => {});

    } catch (error) {
      alert("Hubo un problema de conexión. Intenta nuevamente.");
    } finally {
      setCargando(false);
    }
  };

  const abrirCalendly = async () => {
    setMostrarModalCalendly(true);
    try {
      await supabase.from('tracking_inventario').insert([{
        email_cliente: 'Visitante Web',
        accion: 'ABRIO_CALENDLY',
        detalle: 'Abrió modal de agendamiento'
      }]);
    } catch (error) {
      // Silencioso
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F7F5] font-sans text-neutral-900 selection:bg-[#974932] selection:text-white">
      
      {/* NAVEGACIÓN */}
      <header className={`fixed top-0 w-full z-40 transition-all duration-500 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm py-5' : 'bg-transparent py-8'}`}>
        <div className="max-w-[90rem] mx-auto px-6 md:px-12 flex justify-between items-center">
          <img 
            src={scrolled ? "https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/arienzo-logo-terracota.svg" : "https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/arienzo-logo-blanco.svg"} 
            alt="Arienzo Logo" 
            className="h-6 md:h-8 w-auto transition-all"
          />
          <button 
            onClick={() => setMostrarModalVip(true)}
            className={`text-[10px] md:text-xs font-bold uppercase tracking-[0.25em] px-8 py-4 rounded-none transition-all ${scrolled ? 'bg-[#974932] text-white hover:bg-[#7A3A27]' : 'bg-white/10 backdrop-blur-md text-white border border-white/30 hover:bg-white hover:text-neutral-900'}`}
          >
            🔒 Acceso VIP
          </button>
        </div>
      </header>

      {/* 1. HERO INMERSIVO (Más impactante) */}
      <section className="relative h-[100vh] min-h-[800px] flex flex-col items-center justify-center pt-20">
        <img 
          src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/render-Exterior-Fronta.jpg" 
          alt="Arienzo Fachada Frontal"
          className="absolute inset-0 w-full h-full object-cover z-0 scale-105 animate-in zoom-in duration-[10s]"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-[#F9F7F5] z-0"></div>

        <div className="relative z-10 text-center px-4 w-full max-w-5xl mx-auto mt-20">
          <div className="inline-block border border-[#DEB886]/50 px-6 py-2 mb-8">
            <span className="text-[10px] md:text-xs font-bold tracking-[0.5em] text-[#DEB886] uppercase drop-shadow-md">
              Próximamente en Manta
            </span>
          </div>
          {/* Tipografía ampliada para mayor impacto */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-light text-white leading-[1.1] mb-10 drop-shadow-2xl">
            Todo empieza con <br />
            <span className="font-serif italic text-[#F9F7F5] font-light">una buena ubicación.</span>
          </h1>
          <p className="text-base md:text-xl text-neutral-200 font-light max-w-2xl mx-auto mb-14 leading-relaxed tracking-wide">
            Solo 22 exclusivos departamentos de 1, 2 y 3 dormitorios. Accede primero a los precios de Etapa 0 y elige las mejores ubicaciones.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <button 
              onClick={abrirCalendly}
              className="w-full sm:w-auto bg-[#974932] text-white px-10 py-5 rounded-none text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#7A3A27] transition-all shadow-2xl flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
              Agendar Presentación
            </button>
            <button 
              onClick={() => setMostrarModalVip(true)}
              className="w-full sm:w-auto bg-transparent border border-white/50 text-white px-10 py-5 rounded-none text-xs font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-neutral-900 transition-all flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              Solicitar Precios VIP
            </button>
          </div>
        </div>
      </section>

      {/* BANDA TERRACOTA IMPONENTE */}
      <div className="bg-[#974932] py-16 px-6 text-center shadow-inner relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10 mix-blend-multiply"></div>
        <h2 className="relative z-10 text-white font-serif font-light text-2xl md:text-4xl tracking-wide max-w-4xl mx-auto italic leading-relaxed">
          "Creamos Arienzo Boutique Living buscando el equilibrio perfecto entre una arquitectura destacada y un estilo de vida cómodo."
        </h2>
      </div>

      {/* 2. LA UBICACIÓN */}
      <section className="py-32 px-6 bg-[#F9F7F5]">
        <div className="max-w-[85rem] mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-20 lg:gap-32">
            <div className="w-full md:w-1/2 relative">
              <div className="relative z-10 border-[12px] border-white shadow-2xl">
                <img 
                  src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/ubicacion-arienzo-1.jpg" 
                  alt="Ubicación Barbasquillo Manta" 
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
              </div>
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#DEB886]/20 z-0 hidden md:block"></div>
            </div>
            
            <div className="w-full md:w-1/2">
              <div className="flex items-center gap-6 mb-8">
                <div className="h-[2px] w-16 bg-[#974932]"></div>
                <h2 className="text-xs font-bold tracking-[0.4em] text-[#974932] uppercase">Ubicación Estratégica</h2>
              </div>
              <h3 className="text-4xl md:text-6xl font-light text-neutral-900 leading-[1.1] mb-10">
                La mejor zona <br /> <span className="font-serif italic">de Manta.</span>
              </h3>
              <div className="space-y-6 text-base md:text-lg text-neutral-600 font-light leading-relaxed">
                <p>
                  Vivir en Arienzo es disfrutar de una ubicación estratégica en el <strong>sector Barbasquillo</strong>, con acceso cercano a plazas comerciales, supermercados (nuevo Hipermarket), hoteles, restaurantes y las principales vías de la ciudad.
                </p>
                <p>
                  Un entorno pensado para quienes valoran la comodidad, la conectividad y una vida con todo al alcance, optimizando tu día a día en un entorno dinámico.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. AMENIDADES (AMPLIADO Y CON TEXTOS DEL BROCHURE) */}
      <section className="py-32 px-6 bg-white border-y border-[#EAE3DC]">
        <div className="max-w-[85rem] mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-xs font-bold tracking-[0.4em] text-[#974932] uppercase mb-6">Amenidades Exclusivas</h2>
            <h3 className="text-4xl md:text-6xl font-light text-neutral-900 leading-[1.1]">
              Un rooftop integrado <br /> <span className="font-serif italic text-[#DEB886]">pensado para vivir.</span>
            </h3>
            <p className="mt-8 text-neutral-500 font-light max-w-3xl mx-auto text-lg leading-relaxed">
              El rooftop reúne las principales áreas de uso común del proyecto en un solo nivel, organizadas para favorecer una circulación fluida y un funcionamiento eficiente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-24 gap-x-16">
            
            {/* Amenidad 1: Piscina */}
            <div className="flex flex-col md:flex-row gap-10 items-center">
              <div className="w-full md:w-1/2 aspect-[4/3] overflow-hidden bg-neutral-100 shadow-xl">
                <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/Arienzo-Piscina-1.jpg" alt="Piscina Rooftop" className="w-full h-full object-cover hover:scale-105 transition-transform duration-[1.5s]" loading="lazy" />
              </div>
              <div className="w-full md:w-1/2">
                <h4 className="text-2xl md:text-3xl font-light text-neutral-900 mb-4">Un respiro en lo alto</h4>
                <div className="w-8 h-[2px] bg-[#DEB886] mb-6"></div>
                <h5 className="text-xs font-bold tracking-[0.2em] text-[#974932] uppercase mb-4">Piscina & Rooftop</h5>
                <p className="text-base text-neutral-600 font-light leading-relaxed">
                  Concebida desde la experiencia de uso, la piscina y su amplio deck crean un ambiente donde el bienestar, el diseño y la comodidad encuentran el equilibrio perfecto. Incluye área de BBQ[cite: 1].
                </p>
              </div>
            </div>

            {/* Amenidad 2: Social Living */}
            <div className="flex flex-col md:flex-row-reverse gap-10 items-center">
              <div className="w-full md:w-1/2 aspect-[4/3] overflow-hidden bg-neutral-100 shadow-xl">
                <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/render-living-arienzo.jpg" alt="Social Living" className="w-full h-full object-cover hover:scale-105 transition-transform duration-[1.5s]" loading="lazy" />
              </div>
              <div className="w-full md:w-1/2">
                <h4 className="text-2xl md:text-3xl font-light text-neutral-900 mb-4">Espacios que conectan</h4>
                <div className="w-8 h-[2px] bg-[#DEB886] mb-6"></div>
                <h5 className="text-xs font-bold tracking-[0.2em] text-[#974932] uppercase mb-4">Living & Coworking</h5>
                <p className="text-base text-neutral-600 font-light leading-relaxed">
                  Un ambiente flexible que integra áreas de descanso, coworking y entretenimiento en un mismo lugar, pensado para compartir, trabajar o simplemente disfrutar[cite: 1].
                </p>
              </div>
            </div>

            {/* Amenidad 3: Gym & Salud */}
            <div className="flex flex-col md:flex-row gap-10 items-center">
              <div className="w-full md:w-1/2 aspect-[4/3] overflow-hidden bg-neutral-100 shadow-xl flex items-center justify-center p-12">
                 <h4 className="text-4xl font-serif text-[#DEB886] italic text-center">Bienestar <br/>Integral</h4>
              </div>
              <div className="w-full md:w-1/2">
                <h4 className="text-2xl md:text-3xl font-light text-neutral-900 mb-4">Salud y Movimiento</h4>
                <div className="w-8 h-[2px] bg-[#DEB886] mb-6"></div>
                <h5 className="text-xs font-bold tracking-[0.2em] text-[#974932] uppercase mb-4">Gym Panorámico</h5>
                <p className="text-base text-neutral-600 font-light leading-relaxed">
                  Entrenamiento práctico y funcional dentro del edificio. Un espacio equipado para mantener tu rutina de bienestar sin necesidad de salir de casa, complementando el circuito de salud del rooftop.
                </p>
              </div>
            </div>

            {/* Amenidad 4: Área Comercial */}
            <div className="flex flex-col md:flex-row-reverse gap-10 items-center">
              <div className="w-full md:w-1/2 aspect-[4/3] overflow-hidden bg-neutral-100 shadow-xl">
                <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/Arienzo-Plaza-Comercial-1-1.jpg" alt="Área Comercial" className="w-full h-full object-cover hover:scale-105 transition-transform duration-[1.5s]" loading="lazy" />
              </div>
              <div className="w-full md:w-1/2">
                <h4 className="text-2xl md:text-3xl font-light text-neutral-900 mb-4">Comodidad a un paso</h4>
                <div className="w-8 h-[2px] bg-[#DEB886] mb-6"></div>
                <h5 className="text-xs font-bold tracking-[0.2em] text-[#974932] uppercase mb-4">Área Comercial</h5>
                <p className="text-base text-neutral-600 font-light leading-relaxed">
                  Un retail cuidadosamente curado para complementar la experiencia de vivir en Arienzo. Marcas seleccionadas por su calidad, conveniencia y afinidad con un estilo de vida sofisticado[cite: 1].
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. VISIÓN DE INVERSIÓN (El peso de los datos) */}
      <section className="py-24 px-6 bg-neutral-900 text-white">
        <div className="max-w-[85rem] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <h2 className="text-xs font-bold tracking-[0.4em] text-[#DEB886] uppercase mb-6">Etapa Cero</h2>
            <h3 className="text-4xl md:text-6xl font-light leading-[1.1] mb-10">
              Visión de <span className="font-serif italic">Inversión.</span>
            </h3>
            <div className="space-y-8 text-neutral-300 font-light text-base leading-relaxed">
              <p>
                Arienzo representa una entrada estratégica en un sector premium consolidado. Ingresar desde etapa inicial permite capturar la mayor plusvalía del proyecto.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-4">
                  <span className="text-[#DEB886] mt-1">✦</span>
                  <span><strong>Exclusividad real:</strong> Estricta colección de solo 22 departamentos y 3 locales comerciales, asegurando un formato íntimo[cite: 1].</span>
                </li>
                <li className="flex items-start gap-4">
                  <span className="text-[#DEB886] mt-1">✦</span>
                  <span><strong>Condiciones preferenciales:</strong> Beneficios comerciales únicos por lanzamiento oficial.</span>
                </li>
                <li className="flex items-start gap-4">
                  <span className="text-[#DEB886] mt-1">✦</span>
                  <span><strong>Uso Flexible:</strong> Ideal tanto para residencia principal como para segunda vivienda o modelo de renta gracias a su alta demanda.</span>
                </li>
              </ul>
            </div>
            <button onClick={() => setMostrarModalVip(true)} className="mt-12 bg-[#974932] text-white px-10 py-5 text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#7A3A27] transition-colors inline-block">
              Ver Precios de Lanzamiento
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="aspect-square bg-neutral-800">
               <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/render-Exterior-Derecho-A4.jpg" className="w-full h-full object-cover opacity-80" alt="Vista exterior" />
             </div>
             <div className="aspect-square bg-neutral-800 translate-y-8">
               <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/render-Interior-Departamento-1.jpg" className="w-full h-full object-cover opacity-80" alt="Vista interior" />
             </div>
          </div>
        </div>
      </section>

      {/* 5. RESPALDO Y CONFIANZA */}
      <section className="py-32 px-6 bg-[#F9F7F5]">
        <div className="max-w-[85rem] mx-auto text-center">
          <h2 className="text-xs font-bold tracking-[0.4em] text-[#974932] uppercase mb-6">Respaldo Sólido</h2>
          <h3 className="text-4xl md:text-5xl font-light text-neutral-900 mb-24">Confianza, experiencia y visión a largo plazo.</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 text-center divide-y md:divide-y-0 md:divide-x divide-[#EAE3DC]">
            {/* Arquitectura */}
            <div className="flex flex-col items-center pt-8 md:pt-0 md:px-10">
              <h4 className="text-xl font-medium tracking-widest text-neutral-800 uppercase mb-2">Diez + Muller</h4>
              <span className="text-[10px] font-bold tracking-[0.2em] text-[#974932] uppercase mb-6 block">Arquitectura</span>
              <p className="text-sm text-neutral-600 font-light leading-relaxed">
                Estudio quiteño reconocido entre los más destacados del Ecuador. Autores de Serene en Marina Blue, reflejando su arquitectura contemporánea y atención al detalle[cite: 1].
              </p>
            </div>

            {/* Construcción */}
            <div className="flex flex-col items-center pt-8 md:pt-0 md:px-10">
              <h4 className="text-xl font-medium tracking-widest text-neutral-800 uppercase mb-2">Carrasco Suarez</h4>
              <span className="text-[10px] font-bold tracking-[0.2em] text-[#974932] uppercase mb-6 block">Construcción</span>
              <p className="text-sm text-neutral-600 font-light leading-relaxed">
                Desde 1992 construyendo con solidez. Con amplia experiencia en la Costa y proyectos residenciales de alto nivel como el Hotel Eolia y Serene[cite: 1].
              </p>
            </div>

            {/* Desarrollo */}
            <div className="flex flex-col items-center pt-8 md:pt-0 md:px-10">
              <h4 className="text-xl font-medium tracking-widest text-neutral-800 uppercase mb-2">Konkeri</h4>
              <span className="text-[10px] font-bold tracking-[0.2em] text-[#974932] uppercase mb-6 block">Desarrollo y Ventas</span>
              <p className="text-sm text-neutral-600 font-light leading-relaxed">
                Promotora en Manta con visión integral. Estrategia y diseño se integran para crear proyectos sólidos, alineados con las necesidades del mercado[cite: 1].
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CERRADA FINAL (CTA) */}
      <section className="py-32 bg-white text-center px-4 border-t border-[#EAE3DC]">
        <div className="max-w-3xl mx-auto">
          <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/logo-dorado-arienzo.svg" alt="Arienzo Icono" className="w-16 mx-auto mb-10" />
          <h2 className="text-xs font-bold tracking-[0.4em] text-[#974932] uppercase mb-6">Colección Limitada</h2>
          <h3 className="text-5xl md:text-6xl font-light text-neutral-900 mb-8">Sé uno de los 22 propietarios.</h3>
          <p className="text-base md:text-lg text-neutral-500 font-light mb-14 leading-relaxed">
            El privilegio de pertenecer está limitado. Una propuesta reservada para muy pocos con condiciones comerciales preferenciales.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
             <button 
              onClick={abrirCalendly}
              className="bg-[#974932] text-white px-10 py-5 rounded-none text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#7A3A27] transition-all shadow-xl w-full sm:w-auto"
            >
              Agendar Presentación
            </button>
            <button 
              onClick={() => setMostrarModalVip(true)}
              className="bg-transparent border border-neutral-300 text-neutral-700 px-10 py-5 rounded-none text-xs font-bold uppercase tracking-[0.2em] hover:bg-neutral-50 transition-all w-full sm:w-auto"
            >
              Solicitar Precios VIP
            </button>
          </div>
        </div>
      </section>

      {/* MODAL CERRADURA VIP */}
      {mostrarModalVip && (
        <div className="fixed inset-0 bg-neutral-900/90 z-[60] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-md p-10 rounded-none relative shadow-2xl animate-in zoom-in-95 border-t-4 border-[#974932]">
            <button 
              onClick={() => { setMostrarModalVip(false); setSolicitudEnviada(false); }}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900 font-bold w-8 h-8 flex items-center justify-center bg-neutral-100 rounded-full"
            >
              &times;
            </button>
            
            {!solicitudEnviada ? (
              <>
                <div className="text-center mb-8">
                  <span className="text-[10px] font-bold tracking-widest text-[#974932] uppercase mb-3 inline-block">Acceso Restringido</span>
                  <h3 className="text-3xl font-light text-neutral-900 mb-3">Solicitud de Precios</h3>
                  <p className="text-sm text-neutral-500 font-light">Déjanos tus datos para validar tu perfil de inversionista y habilitar tu acceso a la plataforma de planos y precios.</p>
                </div>

                <form onSubmit={procesarSolicitudVIP} className="space-y-6">
                  <div>
                    <input required type="text" placeholder="Nombres Completos" value={formData.nombres} onChange={e => setFormData({...formData, nombres: e.target.value})} className="w-full bg-neutral-50 border-b-2 border-neutral-200 p-4 text-sm focus:outline-none focus:border-[#974932] transition-colors" />
                  </div>
                  <div>
                    <input required type="tel" placeholder="WhatsApp (Ej: 0991234567)" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} className="w-full bg-neutral-50 border-b-2 border-neutral-200 p-4 text-sm focus:outline-none focus:border-[#974932] transition-colors" />
                  </div>
                  <div>
                    <input required type="email" placeholder="Correo Electrónico" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-neutral-50 border-b-2 border-neutral-200 p-4 text-sm focus:outline-none focus:border-[#974932] transition-colors" />
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={cargando}
                    className="w-full bg-neutral-900 text-white py-5 rounded-none text-xs font-bold uppercase tracking-[0.2em] hover:bg-black transition-colors shadow-lg disabled:opacity-70 mt-4 flex justify-center items-center"
                  >
                    {cargando ? 'Procesando Solicitud...' : 'Enviar Solicitud'}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-10">
                <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">✓</div>
                <h3 className="text-3xl font-light text-neutral-900 mb-4">Solicitud Recibida</h3>
                <p className="text-base text-neutral-600 font-light leading-relaxed mb-8">
                  Debido a la exclusividad de la Etapa 0, nuestro equipo revisará tu solicitud y se pondrá en contacto contigo vía WhatsApp o correo electrónico para enviarte tu pase de acceso.
                </p>
                <button 
                  onClick={() => { setMostrarModalVip(false); setSolicitudEnviada(false); }}
                  className="bg-neutral-100 text-neutral-900 px-8 py-4 rounded-none text-xs font-bold uppercase tracking-widest hover:bg-neutral-200 transition-colors"
                >
                  Volver al inicio
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL CALENDLY */}
      {mostrarModalCalendly && (
        <div className="fixed inset-0 bg-neutral-900/90 z-[60] flex items-center justify-center p-2 md:p-6 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-5xl h-[90vh] rounded-none relative shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
            <div className="flex justify-between items-center p-6 border-b border-neutral-200 bg-white z-10">
              <h3 className="text-xs font-bold tracking-widest uppercase text-neutral-800">Agendar Asesoría Inmobiliaria</h3>
              <button 
                onClick={() => setMostrarModalCalendly(false)}
                className="w-10 h-10 flex items-center justify-center bg-neutral-100 text-neutral-600 hover:bg-neutral-200 rounded-full font-bold transition-colors text-lg"
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
      <footer className="bg-black text-neutral-400 py-20 text-center text-sm border-t border-neutral-800">
        <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/arienzo-logo-blanco.svg" alt="Arienzo" className="h-8 mx-auto mb-10 opacity-30" />
        <div className="flex flex-col md:flex-row justify-center gap-4 md:gap-8 mb-10 font-light tracking-wide">
          <p>📍 Edificio Manta Business Center, Torre B, Oficina 801</p>
          <p className="hidden md:block">•</p>
          <p>📞 097 946 9472</p>
        </div>
        <p className="mb-2 font-light">Desarrollado por <strong className="text-white font-medium">KONKERI</strong></p>
        <p className="font-light text-neutral-600">© {new Date().getFullYear()} Arienzo Boutique Living. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}