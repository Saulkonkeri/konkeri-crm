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
    <div className="min-h-screen bg-[#F9F7F5] font-sans text-neutral-800 selection:bg-[#974932] selection:text-white">
      
      {/* NAVEGACIÓN (Más delicada) */}
      <header className={`fixed top-0 w-full z-40 transition-all duration-700 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6 md:py-8'}`}>
        <div className="max-w-[85rem] mx-auto px-6 md:px-12 flex justify-between items-center">
          <img 
            src={scrolled ? "https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/arienzo-logo-terracota.svg" : "https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/arienzo-logo-blanco.svg"} 
            alt="Arienzo Logo" 
            className="h-5 md:h-6 w-auto transition-all duration-700"
          />
          <button 
            onClick={() => setMostrarModalVip(true)}
            className={`text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] px-6 py-3 transition-all duration-500 border ${scrolled ? 'border-[#974932] text-[#974932] hover:bg-[#974932] hover:text-white' : 'border-white/50 text-white hover:bg-white hover:text-neutral-900'}`}
          >
            Acceso VIP
          </button>
        </div>
      </header>

      {/* 1. HERO INMERSIVO (Elegancia clásica) */}
      <section className="relative h-[100vh] min-h-[700px] flex flex-col items-center justify-center">
        <img 
          src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/render-Exterior-Fronta.jpg" 
          alt="Arienzo Fachada Frontal"
          className="absolute inset-0 w-full h-full object-cover z-0"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#21242E]/70 via-[#21242E]/40 to-[#F9F7F5] z-0"></div>

        <div className="relative z-10 text-center px-6 w-full max-w-4xl mx-auto pt-20">
          <span className="text-[10px] font-medium tracking-[0.4em] text-[#DEB886] uppercase mb-8 block">
            Próximamente en Manta
          </span>
          {/* Título con fuente Serif para toque editorial */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-light text-white leading-[1.2] mb-8">
            Todo empieza con <br />
            <span className="italic text-[#DEB886]">una buena ubicación.</span>
          </h1>
          <p className="text-sm md:text-base text-neutral-200 font-light max-w-xl mx-auto mb-12 leading-relaxed tracking-wide">
            Colección exclusiva de solo 22 departamentos. Accede primero a los precios de Etapa 0 y elige las mejores ubicaciones.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={abrirCalendly}
              className="w-full sm:w-auto bg-[#974932] text-white px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-[#7A3A27] transition-all"
            >
              Agendar Presentación
            </button>
            <button 
              onClick={() => setMostrarModalVip(true)}
              className="w-full sm:w-auto bg-transparent border border-white/40 text-white px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-neutral-900 transition-all"
            >
              Solicitar Precios VIP
            </button>
          </div>
        </div>
      </section>

      {/* BANDA TERRACOTA (Sutil y elegante) */}
      <div className="bg-[#974932] py-14 px-6 text-center">
        <h2 className="text-white font-serif font-light text-xl md:text-2xl tracking-wide max-w-3xl mx-auto italic leading-relaxed opacity-90">
          "El verdadero lujo es vivir bien, todos los días."
        </h2>
      </div>

      {/* 2. LA UBICACIÓN (Diseño de revista) */}
      <section className="py-24 md:py-32 px-6 bg-[#F9F7F5]">
        <div className="max-w-[75rem] mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-16 lg:gap-24">
            <div className="w-full md:w-1/2 relative">
              <div className="relative z-10 p-2 bg-white shadow-xl">
                <img 
                  src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/ubicacion-arienzo-1.jpg" 
                  alt="Ubicación Barbasquillo Manta" 
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
              </div>
            </div>
            
            <div className="w-full md:w-1/2">
              <span className="text-[10px] font-bold tracking-[0.3em] text-[#974932] uppercase mb-4 block">Entorno & Conectividad</span>
              <h3 className="text-3xl md:text-4xl font-serif font-light text-neutral-900 leading-[1.2] mb-8">
                La mejor zona <br /> <span className="italic text-[#DEB886]">de Manta.</span>
              </h3>
              <div className="space-y-6 text-sm text-neutral-600 font-light leading-relaxed">
                <p>
                  Vivir en Arienzo es disfrutar de una ubicación estratégica en el sector <strong>Barbasquillo</strong>, con acceso cercano a plazas comerciales (La Quadra), el nuevo Hipermarket, hoteles, restaurantes y las principales vías.
                </p>
                <p>
                  Un entorno pensado para quienes valoran la comodidad, la conectividad y una vida con todo al alcance, optimizando el día a día.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. AMENIDADES (Layout Alternado y Limpio) */}
      <section className="py-24 md:py-32 px-6 bg-white border-t border-[#EAE3DC]">
        <div className="max-w-[75rem] mx-auto">
          <div className="text-center mb-24">
            <span className="text-[10px] font-bold tracking-[0.3em] text-[#974932] uppercase mb-4 block">Uso Real</span>
            <h3 className="text-3xl md:text-4xl font-serif font-light text-neutral-900 leading-[1.2]">
              Espacios pensados <span className="italic">para vivir.</span>
            </h3>
          </div>

          <div className="space-y-24 md:space-y-32">
            
            {/* Amenidad 1 */}
            <div className="flex flex-col md:flex-row gap-12 lg:gap-20 items-center">
              <div className="w-full md:w-1/2 aspect-[4/5] md:aspect-square overflow-hidden bg-neutral-100">
                <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/Arienzo-Piscina-1.jpg" alt="Piscina Rooftop" className="w-full h-full object-cover hover:scale-105 transition-transform duration-[2s] ease-out" loading="lazy" />
              </div>
              <div className="w-full md:w-1/2 md:pr-12">
                <h4 className="text-2xl font-serif font-light text-neutral-900 mb-4">Un respiro en lo alto</h4>
                <h5 className="text-[10px] font-bold tracking-[0.2em] text-[#974932] uppercase mb-6">Piscina & Rooftop</h5>
                <p className="text-sm text-neutral-500 font-light leading-relaxed">
                  Concebida desde la experiencia de uso, la piscina y su amplio deck crean un ambiente donde el bienestar, el diseño y la comodidad encuentran el equilibrio perfecto.
                </p>
              </div>
            </div>

            {/* Amenidad 2 */}
            <div className="flex flex-col md:flex-row-reverse gap-12 lg:gap-20 items-center">
              <div className="w-full md:w-1/2 aspect-[4/5] md:aspect-square overflow-hidden bg-neutral-100">
                <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/render-living-arienzo.jpg" alt="Social Living" className="w-full h-full object-cover hover:scale-105 transition-transform duration-[2s] ease-out" loading="lazy" />
              </div>
              <div className="w-full md:w-1/2 md:pl-12">
                <h4 className="text-2xl font-serif font-light text-neutral-900 mb-4">Espacios que conectan</h4>
                <h5 className="text-[10px] font-bold tracking-[0.2em] text-[#974932] uppercase mb-6">Living & Coworking</h5>
                <p className="text-sm text-neutral-500 font-light leading-relaxed">
                  Un ambiente flexible que integra áreas de descanso, coworking y entretenimiento en un mismo lugar, pensado para compartir, trabajar o simplemente disfrutar.
                </p>
              </div>
            </div>

            {/* Amenidad 3 */}
            <div className="flex flex-col md:flex-row gap-12 lg:gap-20 items-center">
              <div className="w-full md:w-1/2 aspect-[4/5] md:aspect-square overflow-hidden bg-neutral-100">
                <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/Arienzo-Plaza-Comercial-1-1.jpg" alt="Área Comercial" className="w-full h-full object-cover hover:scale-105 transition-transform duration-[2s] ease-out" loading="lazy" />
              </div>
              <div className="w-full md:w-1/2 md:pr-12">
                <h4 className="text-2xl font-serif font-light text-neutral-900 mb-4">Comodidad a un paso</h4>
                <h5 className="text-[10px] font-bold tracking-[0.2em] text-[#974932] uppercase mb-6">Área Comercial</h5>
                <p className="text-sm text-neutral-500 font-light leading-relaxed">
                  Un retail cuidadosamente curado para complementar la experiencia. Marcas seleccionadas por su calidad y afinidad con un estilo de vida sofisticado y tranquilo.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. GALERÍA DE RENDERS (Fondo Azul Profundo #21242E) */}
      <section className="py-24 md:py-32 px-6 bg-[#21242E]">
        <div className="max-w-[85rem] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <span className="text-[10px] font-bold tracking-[0.3em] text-[#DEB886] uppercase mb-4 block">Arquitectura</span>
              <h3 className="text-3xl md:text-4xl font-serif font-light text-white">Imágenes que hablan.</h3>
            </div>
            <button onClick={() => setMostrarModalVip(true)} className="text-[10px] text-white uppercase tracking-[0.2em] border-b border-[#DEB886] pb-1 hover:text-[#DEB886] transition-colors">
              Ver Planos y Tipologías
            </button>
          </div>
          
          {/* Grilla Curada (Diseño Masonry) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
            <div className="md:col-span-8 overflow-hidden bg-[#1a1d24]">
              <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/render-Exterior-Derecho-A4.jpg" alt="Vista Lateral" className="w-full h-full object-cover hover:scale-105 transition-transform duration-[2s] ease-out opacity-90 hover:opacity-100 aspect-[16/9] md:aspect-auto" loading="lazy" />
            </div>
            <div className="md:col-span-4 overflow-hidden bg-[#1a1d24]">
              <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/render-Interior-Departamento-1.jpg" alt="Interior" className="w-full h-full object-cover hover:scale-105 transition-transform duration-[2s] ease-out opacity-90 hover:opacity-100 aspect-square" loading="lazy" />
            </div>
            <div className="md:col-span-4 overflow-hidden bg-[#1a1d24]">
              <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/Arienzo-Piscina-1.jpg" alt="Piscina" className="w-full h-full object-cover hover:scale-105 transition-transform duration-[2s] ease-out opacity-90 hover:opacity-100 aspect-square" loading="lazy" />
            </div>
            <div className="md:col-span-8 overflow-hidden bg-[#1a1d24]">
              <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/render-living-arienzo.jpg" alt="Living" className="w-full h-full object-cover hover:scale-105 transition-transform duration-[2s] ease-out opacity-90 hover:opacity-100 aspect-[16/9] md:aspect-auto" loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      {/* 5. VISIÓN DE INVERSIÓN Y RESPALDO (Unificado y limpio) */}
      <section className="py-24 md:py-32 px-6 bg-[#F9F7F5]">
        <div className="max-w-[75rem] mx-auto grid grid-cols-1 md:grid-cols-2 gap-20">
          
          {/* Inversión */}
          <div>
            <span className="text-[10px] font-bold tracking-[0.3em] text-[#974932] uppercase mb-4 block">Etapa Cero</span>
            <h3 className="text-3xl font-serif font-light text-neutral-900 mb-8">Visión de Inversión</h3>
            <p className="text-sm text-neutral-600 font-light leading-relaxed mb-6">
              Arienzo representa una entrada estratégica en un sector premium consolidado. Ingresar desde etapa inicial permite capturar la mayor plusvalía.
            </p>
            <ul className="space-y-4 text-sm text-neutral-600 font-light">
              <li className="flex items-start gap-3 border-t border-[#EAE3DC] pt-4">
                <span className="text-[#DEB886]">✦</span>
                <span><strong>Exclusividad:</strong> Solo 22 departamentos.</span>
              </li>
              <li className="flex items-start gap-3 border-t border-[#EAE3DC] pt-4">
                <span className="text-[#DEB886]">✦</span>
                <span><strong>Uso Flexible:</strong> Residencia o modelo de renta.</span>
              </li>
            </ul>
          </div>

          {/* Respaldo */}
          <div>
            <span className="text-[10px] font-bold tracking-[0.3em] text-[#974932] uppercase mb-4 block">Trayectoria</span>
            <h3 className="text-3xl font-serif font-light text-neutral-900 mb-8">Respaldo Inmobiliario</h3>
            
            <div className="space-y-8">
              <div>
                <h4 className="text-xs font-bold tracking-widest text-neutral-800 uppercase mb-2">Diez + Muller <span className="font-normal text-neutral-400">| Arquitectura</span></h4>
                <p className="text-sm text-neutral-500 font-light leading-relaxed">
                  Estudio quiteño destacado en Ecuador. Autores de Serene en Marina Blue, reflejando su arquitectura contemporánea.
                </p>
              </div>
              <div>
                <h4 className="text-xs font-bold tracking-widest text-neutral-800 uppercase mb-2">Carrasco Suarez <span className="font-normal text-neutral-400">| Construcción</span></h4>
                <p className="text-sm text-neutral-500 font-light leading-relaxed">
                  Desde 1992 construyendo con solidez. Experiencia en proyectos residenciales de alto nivel.
                </p>
              </div>
              <div>
                <h4 className="text-xs font-bold tracking-widest text-neutral-800 uppercase mb-2">Konkeri <span className="font-normal text-neutral-400">| Desarrollo</span></h4>
                <p className="text-sm text-neutral-500 font-light leading-relaxed">
                  Visión integral donde estrategia y diseño se integran para crear proyectos sólidos.
                </p>
              </div>
            </div>
          </div>
          
        </div>
      </section>

      {/* 6. CERRADA FINAL (El Logo Dorado sobre Terracota) */}
      <section className="py-24 md:py-32 bg-[#974932] text-center px-4">
        <div className="max-w-2xl mx-auto flex flex-col items-center">
          {/* Logo Dorado Gigante */}
          <img 
            src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/logo-dorado-arienzo.svg" 
            alt="Arienzo Icono Dorado" 
            className="w-24 md:w-32 mb-10 drop-shadow-xl" 
          />
          <h2 className="text-[10px] font-bold tracking-[0.4em] text-[#DEB886] uppercase mb-4">Colección Limitada</h2>
          <h3 className="text-3xl md:text-4xl font-serif font-light text-white mb-8">Sé uno de los 22 propietarios.</h3>
          <p className="text-sm text-white/80 font-light mb-12 leading-relaxed">
            El privilegio de pertenecer está limitado. Una propuesta reservada con condiciones de Etapa Cero.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 w-full sm:w-auto">
             <button 
              onClick={abrirCalendly}
              className="bg-[#21242E] text-white px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-black transition-colors w-full sm:w-auto"
            >
              Agendar Presentación
            </button>
            <button 
              onClick={() => setMostrarModalVip(true)}
              className="bg-transparent border border-[#DEB886] text-[#DEB886] px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-[#DEB886] hover:text-[#974932] transition-colors w-full sm:w-auto"
            >
              Solicitar Precios VIP
            </button>
          </div>
        </div>
      </section>

      {/* MODAL CERRADURA VIP */}
      {mostrarModalVip && (
        <div className="fixed inset-0 bg-[#21242E]/90 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md p-8 relative shadow-2xl animate-in zoom-in-95">
            <button 
              onClick={() => { setMostrarModalVip(false); setSolicitudEnviada(false); }}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900 font-bold w-8 h-8 flex items-center justify-center bg-neutral-100 rounded-full"
            >
              &times;
            </button>
            
            {!solicitudEnviada ? (
              <>
                <div className="text-center mb-8">
                  <span className="text-[9px] font-bold tracking-[0.2em] text-[#974932] uppercase mb-2 inline-block">Acceso Restringido</span>
                  <h3 className="text-2xl font-serif font-light text-neutral-900 mb-2">Solicitud de Precios</h3>
                  <p className="text-xs text-neutral-500 font-light">Validaremos tu perfil para habilitar el acceso a planos y precios.</p>
                </div>

                <form onSubmit={procesarSolicitudVIP} className="space-y-4">
                  <div>
                    <input required type="text" placeholder="Nombres Completos" value={formData.nombres} onChange={e => setFormData({...formData, nombres: e.target.value})} className="w-full bg-transparent border-b border-neutral-300 p-3 text-sm font-light focus:outline-none focus:border-[#974932] transition-colors" />
                  </div>
                  <div>
                    <input required type="tel" placeholder="WhatsApp (Ej: 0991234567)" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} className="w-full bg-transparent border-b border-neutral-300 p-3 text-sm font-light focus:outline-none focus:border-[#974932] transition-colors" />
                  </div>
                  <div>
                    <input required type="email" placeholder="Correo Electrónico" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-transparent border-b border-neutral-300 p-3 text-sm font-light focus:outline-none focus:border-[#974932] transition-colors" />
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={cargando}
                    className="w-full bg-[#974932] text-white py-4 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-[#7A3A27] transition-colors mt-6"
                  >
                    {cargando ? 'Procesando...' : 'Enviar Solicitud'}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
                <h3 className="text-xl font-serif font-light text-neutral-900 mb-3">Solicitud Recibida</h3>
                <p className="text-xs text-neutral-500 font-light leading-relaxed mb-6">
                  Nuestro equipo revisará tu solicitud y te contactará para enviarte tu pase de acceso.
                </p>
                <button 
                  onClick={() => { setMostrarModalVip(false); setSolicitudEnviada(false); }}
                  className="border border-neutral-200 text-neutral-600 px-6 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-neutral-50 transition-colors"
                >
                  Volver
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL CALENDLY */}
      {mostrarModalCalendly && (
        <div className="fixed inset-0 bg-[#21242E]/90 z-[60] flex items-center justify-center p-2 md:p-6 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-4xl h-[85vh] relative shadow-2xl flex flex-col animate-in zoom-in-95">
            <div className="flex justify-between items-center p-4 border-b border-neutral-100">
              <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-800">Agendar Asesoría</h3>
              <button 
                onClick={() => setMostrarModalCalendly(false)}
                className="w-8 h-8 flex items-center justify-center bg-neutral-50 text-neutral-500 hover:bg-neutral-100 rounded-full font-bold transition-colors"
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
      <footer className="bg-[#21242E] text-neutral-400 py-16 text-center text-xs border-t border-[#1a1d24]">
        <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/arienzo-logo-blanco.svg" alt="Arienzo" className="h-6 mx-auto mb-8 opacity-40" />
        <div className="flex flex-col md:flex-row justify-center gap-2 md:gap-6 mb-8 font-light tracking-wide">
          <p>📍 Edificio Manta Business Center, Torre B, Oficina 801</p>
          <p className="hidden md:block text-neutral-600">•</p>
          <p>📞 097 946 9472</p>
        </div>
        <p className="mb-1 font-light">Desarrollado por <strong className="text-white font-medium">KONKERI</strong></p>
        <p className="font-light text-neutral-500">© {new Date().getFullYear()} Arienzo Boutique Living. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}