'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function ArienzoLandingPremium() {
  const [mostrarModalVip, setMostrarModalVip] = useState(false);
  const [mostrarModalCalendly, setMostrarModalCalendly] = useState(false);
  const [imagenAmpliada, setImagenAmpliada] = useState<string | null>(null);
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
        detalle: 'Completó formulario web'
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
    } catch (error) {}
  };

  const imagenesGaleria = [
    "https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/render-Exterior-Fronta.jpg",
    "https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/render-Interior-Departamento-1.jpg",
    "https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/Arienzo-Piscina-1.jpg",
    "https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/render-Exterior-Derecho-A4.jpg",
    "https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/render-living-arienzo.jpg",
    "https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/Arienzo-Plaza-Comercial-1-1.jpg"
  ];

  return (
    <div className="min-h-screen bg-[#F9F7F5] font-sans text-neutral-800 selection:bg-[#974932] selection:text-white overflow-x-hidden">
      
      {/* NAVEGACIÓN */}
      <header className={`fixed top-0 w-full z-40 transition-all duration-500 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">
          <img 
            src={scrolled ? "https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/arienzo-logo-terracota.svg" : "https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/arienzo-logo-blanco.svg"} 
            alt="Arienzo Logo" 
            className="h-5 md:h-6 w-auto transition-all duration-500"
          />
          <button 
            onClick={() => setMostrarModalVip(true)}
            className={`text-[10px] font-bold uppercase tracking-[0.2em] px-6 py-2.5 rounded-full transition-all duration-300 ${scrolled ? 'bg-[#974932] text-white hover:bg-[#7A3A27] shadow-md' : 'bg-white/20 backdrop-blur-md text-white border border-white/40 hover:bg-white hover:text-[#974932]'}`}
          >
            Acceso VIP
          </button>
        </div>
      </header>

      {/* 1. HERO INMERSIVO (Render protagonista sin fondo blanco) */}
      <section className="relative h-[100vh] min-h-[700px] flex flex-col items-center justify-center">
        <img 
          src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/render-Exterior-Fronta.jpg" 
          alt="Arienzo Fachada"
          className="absolute inset-0 w-full h-full object-cover z-0"
          fetchPriority="high"
        />
        {/* Degradado oscuro solo arriba y abajo para que el render brille en el medio */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-black/70 z-0"></div>

        <div className="relative z-10 text-center px-6 w-full max-w-4xl mx-auto pt-16">
          <span className="inline-block text-[10px] font-bold tracking-[0.3em] text-[#DEB886] uppercase mb-6 px-4 py-1.5 border border-[#DEB886]/50 rounded-full backdrop-blur-sm">
            Próximamente en Manta
          </span>
          <h1 className="text-4xl md:text-6xl font-medium text-white leading-tight mb-8 tracking-tight drop-shadow-xl">
            Todo empieza con <br />
            <span className="font-light italic text-[#F9F7F5]">una buena ubicación.</span>
          </h1>
          <p className="text-sm md:text-lg text-neutral-200 font-light max-w-xl mx-auto mb-10 leading-relaxed drop-shadow-md">
            Colección exclusiva de solo 22 departamentos. Accede primero a los precios de Etapa 0 y elige las mejores ubicaciones.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={abrirCalendly}
              className="w-full sm:w-auto bg-[#974932] text-white px-8 py-3.5 rounded-full text-[11px] font-bold uppercase tracking-[0.15em] hover:bg-[#7A3A27] transition-all duration-300 shadow-xl hover:-translate-y-0.5"
            >
              Agendar Presentación
            </button>
            <button 
              onClick={() => setMostrarModalVip(true)}
              className="w-full sm:w-auto bg-transparent border border-white/50 text-white px-8 py-3.5 rounded-full text-[11px] font-bold uppercase tracking-[0.15em] hover:bg-white hover:text-[#974932] transition-all duration-300 hover:-translate-y-0.5"
            >
              Solicitar Precios VIP
            </button>
          </div>
        </div>
      </section>

      {/* BANDA TERRACOTA (Logo Dorado Inicial) */}
      <div className="bg-[#974932] py-8 md:py-10 flex justify-center items-center shadow-inner relative z-20">
        <img 
          src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/logo-dorado-arienzo.svg" 
          alt="Arienzo Boutique Living" 
          className="h-12 md:h-16 drop-shadow-md" 
        />
      </div>

      {/* 2. UBICACIÓN (Diseño Arquitectónico Superpuesto) */}
      <section className="py-24 md:py-32 px-6 bg-[#F9F7F5]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
            
            {/* Texto (Se superpone ligeramente a la imagen en desktop) */}
            <div className="md:col-span-5 md:pr-10 z-10 order-2 md:order-1">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-[2px] w-8 bg-[#974932]"></div>
                <span className="text-[10px] font-bold tracking-[0.25em] text-[#974932] uppercase">Barbasquillo, Manta</span>
              </div>
              <h3 className="text-3xl md:text-5xl font-medium text-neutral-900 leading-tight mb-8 tracking-tight">
                La mejor zona <br className="hidden md:block"/> de la ciudad.
              </h3>
              <p className="text-sm md:text-base text-neutral-600 font-light leading-relaxed mb-6">
                Vivir en Arienzo es disfrutar de una ubicación estratégica. Con acceso inmediato a La Quadra, el nuevo Hipermarket, hoteles, restaurantes y las principales vías de conexión.
              </p>
              <p className="text-sm md:text-base text-neutral-600 font-light leading-relaxed">
                Diseñado para quienes valoran la conectividad y una vida caminable, donde todo está a tu alcance.
              </p>
            </div>

            {/* Imagen con diseño flotante */}
            <div className="md:col-span-7 relative order-1 md:order-2">
              <div className="absolute -inset-4 bg-[#DEB886]/20 rounded-2xl transform translate-x-4 translate-y-4"></div>
              <img 
                src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/ubicacion-arienzo-1.jpg" 
                alt="Ubicación Manta" 
                className="relative z-10 w-full h-auto object-cover rounded-xl shadow-2xl"
                loading="lazy"
              />
              {/* Etiqueta Flotante Tech */}
              <div className="absolute bottom-6 left-6 z-20 bg-white/90 backdrop-blur-md px-5 py-3 rounded-lg shadow-xl border border-white flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-xs font-bold text-neutral-800 uppercase tracking-wider">Alta Plusvalía</span>
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* 3. AMENIDADES (Tarjetas Premium Impactantes) */}
      <section className="py-24 md:py-32 px-6 bg-white border-t border-[#EAE3DC]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 md:mb-20">
            <span className="text-[10px] font-bold tracking-[0.25em] text-[#974932] uppercase mb-4 block">Amenidades Exclusivas</span>
            <h3 className="text-3xl md:text-5xl font-medium text-neutral-900 tracking-tight mb-6">
              Espacios pensados para vivir.
            </h3>
            <p className="max-w-2xl mx-auto text-sm md:text-base text-neutral-500 font-light leading-relaxed">
              El rooftop reúne las áreas comunes en un solo nivel, organizadas para una circulación fluida y funcionamiento eficiente, elevando tu experiencia diaria.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Tarjeta 1 */}
            <div className="group bg-[#F9F7F5] rounded-2xl overflow-hidden border border-neutral-100 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
              <div className="aspect-[4/3] overflow-hidden relative">
                <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/Arienzo-Piscina-1.jpg" alt="Piscina" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
              </div>
              <div className="p-8">
                <div className="w-8 h-[2px] bg-[#DEB886] mb-4 transition-all duration-300 group-hover:w-16"></div>
                <h4 className="text-xl font-medium text-neutral-900 mb-3">Piscina & Rooftop</h4>
                <p className="text-sm text-neutral-600 font-light leading-relaxed">
                  Concebida desde la experiencia de uso. Un ambiente donde el bienestar, el diseño y la comodidad encuentran el equilibrio perfecto, incluyendo un área de BBQ.
                </p>
              </div>
            </div>

            {/* Tarjeta 2 */}
            <div className="group bg-[#F9F7F5] rounded-2xl overflow-hidden border border-neutral-100 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
              <div className="aspect-[4/3] overflow-hidden relative">
                <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/render-living-arienzo.jpg" alt="Living" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
              </div>
              <div className="p-8">
                <div className="w-8 h-[2px] bg-[#DEB886] mb-4 transition-all duration-300 group-hover:w-16"></div>
                <h4 className="text-xl font-medium text-neutral-900 mb-3">Social Living</h4>
                <p className="text-sm text-neutral-600 font-light leading-relaxed">
                  Un ambiente flexible que integra áreas de descanso, coworking y entretenimiento. Pensado para compartir, trabajar de forma remota o simplemente disfrutar.
                </p>
              </div>
            </div>

            {/* Tarjeta 3 */}
            <div className="group bg-[#F9F7F5] rounded-2xl overflow-hidden border border-neutral-100 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
              <div className="aspect-[4/3] overflow-hidden relative">
                <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/Arienzo-Plaza-Comercial-1-1.jpg" alt="Comercial" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
              </div>
              <div className="p-8">
                <div className="w-8 h-[2px] bg-[#DEB886] mb-4 transition-all duration-300 group-hover:w-16"></div>
                <h4 className="text-xl font-medium text-neutral-900 mb-3">Área Comercial</h4>
                <p className="text-sm text-neutral-600 font-light leading-relaxed">
                  Un retail de planta baja curado para complementar tu experiencia. Marcas seleccionadas por su calidad, conveniencia y afinidad con el proyecto.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. GALERÍA EN LÍNEA (Scroll horizontal elegante) */}
      <section className="py-24 md:py-28 bg-[#F9F7F5] border-t border-[#EAE3DC] overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 mb-12 flex justify-between items-end">
          <div>
            <span className="text-[10px] font-bold tracking-[0.25em] text-[#974932] uppercase mb-2 block">Galería</span>
            <h3 className="text-3xl md:text-4xl font-medium text-neutral-900 tracking-tight">Arquitectura y Diseño</h3>
          </div>
        </div>
        
        {/* Contenedor de una sola fila con scroll horizontal */}
        <div className="flex gap-4 overflow-x-auto pb-8 pt-4 px-6 md:px-12 snap-x snap-mandatory hide-scrollbar">
          {imagenesGaleria.map((img, index) => (
            <div 
              key={index} 
              className="min-w-[280px] md:min-w-[320px] aspect-[4/3] relative group cursor-pointer snap-center rounded-xl overflow-hidden shadow-md shrink-0 border border-neutral-200"
              onClick={() => setImagenAmpliada(img)}
            >
              <img src={img} alt={`Render ${index + 1}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
              {/* Capa de Hover con Ícono */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center border border-white/50">
                  <span className="text-white text-2xl font-light">⛶</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* LIGHTBOX MODAL PARA GALERÍA */}
      {imagenAmpliada && (
        <div className="fixed inset-0 bg-black/95 z-[70] flex items-center justify-center p-4 md:p-8 backdrop-blur-md animate-in fade-in" onClick={() => setImagenAmpliada(null)}>
          <button className="absolute top-6 right-6 text-white/70 hover:text-white text-4xl font-light transition-colors z-50">&times;</button>
          <img src={imagenAmpliada} alt="Vista Ampliada" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95" />
        </div>
      )}

      {/* 5. VISIÓN DE INVERSIÓN */}
      <section className="py-24 px-6 bg-white border-t border-[#EAE3DC]">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-[10px] font-bold tracking-[0.25em] text-[#974932] uppercase mb-4 block">Etapa Cero</span>
          <h3 className="text-3xl md:text-4xl font-medium text-neutral-900 mb-8">Visión de Inversión</h3>
          <p className="text-base text-neutral-600 font-light leading-relaxed mb-10 max-w-2xl mx-auto">
            Arienzo representa una entrada estratégica en un sector premium consolidado. Ingresar desde la etapa inicial permite capturar la mayor plusvalía del proyecto. Un formato íntimo que ofrece exclusividad y flexibilidad, ideal tanto para residencia principal como para modelo de renta.
          </p>
        </div>
      </section>

      {/* 6. RESPALDO INSTITUCIONAL (Bloque Exclusivo) */}
      <section className="py-24 md:py-32 px-6 bg-[#21242E] text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[10px] font-bold tracking-[0.3em] text-[#DEB886] uppercase mb-4 block">Trayectoria</span>
            <h3 className="text-3xl md:text-4xl font-medium text-white tracking-tight">Respaldo Inmobiliario</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            
            {/* Arquitectura */}
            <div className="border-t-2 border-[#974932] pt-8 group">
              <h4 className="text-xl font-medium mb-1">Diez + Muller</h4>
              <span className="text-[10px] font-bold tracking-widest uppercase text-[#DEB886] block mb-4">Arquitectura</span>
              <p className="text-sm text-neutral-400 font-light leading-relaxed transition-colors group-hover:text-neutral-300">
                Considerado entre los estudios más destacados del Ecuador por su trayectoria y la calidad de sus proyectos. Autores de Serene en Marina Blue, reflejando su arquitectura contemporánea y atención al detalle.
              </p>
            </div>

            {/* Construcción */}
            <div className="border-t-2 border-[#974932] pt-8 group">
              <h4 className="text-xl font-medium mb-1">Carrasco Suarez</h4>
              <span className="text-[10px] font-bold tracking-widest uppercase text-[#DEB886] block mb-4">Construcción</span>
              <p className="text-sm text-neutral-400 font-light leading-relaxed transition-colors group-hover:text-neutral-300">
                Desde 1992 construyendo con enfoque en calidad, solidez y cumplimiento. Amplia experiencia en la Costa y en proyectos residenciales de alto nivel, incluyendo el Hotel Eolia.
              </p>
            </div>

            {/* Desarrollo */}
            <div className="border-t-2 border-[#974932] pt-8 group">
              <h4 className="text-xl font-medium mb-1">Konkeri</h4>
              <span className="text-[10px] font-bold tracking-widest uppercase text-[#DEB886] block mb-4">Desarrollo y Ventas</span>
              <p className="text-sm text-neutral-400 font-light leading-relaxed transition-colors group-hover:text-neutral-300">
                Promotora inmobiliaria con visión integral. Estrategia, planificación y diseño se integran para crear proyectos sólidos y con valor a largo plazo, alineados con el mercado.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 7. CERRADA FINAL (Limpia y Potente) */}
      <section className="py-24 md:py-32 bg-white text-center px-6 relative border-b-8 border-[#974932]">
        <div className="max-w-3xl mx-auto flex flex-col items-center">
          <img 
            src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/logo-dorado-arienzo.svg" 
            alt="Arienzo Icono" 
            className="w-20 md:w-28 mb-10 opacity-90" 
          />
          <h2 className="text-[10px] font-bold tracking-[0.3em] text-[#974932] uppercase mb-4">Colección Limitada</h2>
          <h3 className="text-4xl md:text-5xl font-medium tracking-tight text-neutral-900 mb-6">Sé uno de los 22 propietarios.</h3>
          <p className="text-base text-neutral-500 font-light mb-12 leading-relaxed max-w-xl mx-auto">
            El privilegio de pertenecer está limitado. Solicita tu acceso para descubrir precios, tipologías y disponibilidad en tiempo real.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 w-full sm:w-auto">
             <button 
              onClick={abrirCalendly}
              className="bg-[#974932] text-white px-10 py-4 rounded-full text-[11px] font-bold uppercase tracking-[0.15em] hover:bg-[#7A3A27] transition-all duration-300 hover:-translate-y-1 shadow-lg w-full sm:w-auto"
            >
              Agendar Presentación
            </button>
            <button 
              onClick={() => setMostrarModalVip(true)}
              className="bg-transparent border border-neutral-300 text-neutral-700 px-10 py-4 rounded-full text-[11px] font-bold uppercase tracking-[0.15em] hover:bg-neutral-50 transition-all duration-300 hover:-translate-y-1 w-full sm:w-auto"
            >
              Solicitar Precios VIP
            </button>
          </div>
        </div>
      </section>

      {/* MODAL CERRADURA VIP */}
      {mostrarModalVip && (
        <div className="fixed inset-0 bg-[#21242E]/95 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md p-10 rounded-2xl relative shadow-2xl animate-in zoom-in-95">
            <button 
              onClick={() => { setMostrarModalVip(false); setSolicitudEnviada(false); }}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900 font-bold w-8 h-8 flex items-center justify-center bg-neutral-100 rounded-full transition-colors"
            >
              &times;
            </button>
            
            {!solicitudEnviada ? (
              <>
                <div className="text-center mb-8">
                  <div className="w-12 h-1 bg-[#974932] mx-auto mb-6 rounded-full"></div>
                  <h3 className="text-2xl font-medium text-neutral-900 mb-2 tracking-tight">Solicitud de Precios</h3>
                  <p className="text-xs text-neutral-500 font-light">Validaremos tu perfil para habilitar el acceso seguro a los planos y precios de Etapa 0.</p>
                </div>

                <form onSubmit={procesarSolicitudVIP} className="space-y-4">
                  <div>
                    <input required type="text" placeholder="Nombres Completos" value={formData.nombres} onChange={e => setFormData({...formData, nombres: e.target.value})} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm font-light focus:outline-none focus:border-[#974932] transition-colors" />
                  </div>
                  <div>
                    <input required type="tel" placeholder="WhatsApp (Ej: 0991234567)" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm font-light focus:outline-none focus:border-[#974932] transition-colors" />
                  </div>
                  <div>
                    <input required type="email" placeholder="Correo Electrónico" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm font-light focus:outline-none focus:border-[#974932] transition-colors" />
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={cargando}
                    className="w-full bg-[#974932] text-white py-4 rounded-xl text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-[#7A3A27] transition-all mt-4 shadow-lg disabled:opacity-70"
                  >
                    {cargando ? 'Procesando...' : 'Enviar Solicitud'}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl shadow-inner">✓</div>
                <h3 className="text-2xl font-medium text-neutral-900 mb-3 tracking-tight">Solicitud Recibida</h3>
                <p className="text-sm text-neutral-500 font-light leading-relaxed mb-8">
                  Nuestro equipo comercial validará tu información y te contactará brevemente para entregarte tu pase de acceso exclusivo.
                </p>
                <button 
                  onClick={() => { setMostrarModalVip(false); setSolicitudEnviada(false); }}
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
      <footer className="bg-[#111111] text-neutral-500 py-16 text-center text-[11px] md:text-xs">
        <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/arienzo-logo-blanco.svg" alt="Arienzo" className="h-5 mx-auto mb-8 opacity-30" />
        <div className="flex flex-col md:flex-row justify-center gap-2 md:gap-6 mb-8 font-light tracking-wider">
          <p>📍 Edificio Manta Business Center, Torre B, Oficina 801</p>
          <p className="hidden md:block text-neutral-700">•</p>
          <p>📞 097 946 9472</p>
        </div>
        <p className="mb-2 font-light">Desarrollado por <strong className="text-white font-medium">KONKERI</strong></p>
        <p className="font-light opacity-50">© {new Date().getFullYear()} Arienzo Boutique Living. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}