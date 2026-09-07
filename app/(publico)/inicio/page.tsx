'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function ArienzoLandingPremium() {
  const [mostrarModal, setMostrarModal] = useState(false);
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

  const agendarZoom = async () => {
    if (formData.email) {
      await supabase.from('tracking_inventario').insert([{
        email_cliente: formData.email,
        accion: 'CLIC_AGENDAR_ZOOM',
        detalle: 'Clic en botón de Agendar Presentación'
      }]);
    }
    window.open('https://wa.me/593979469472?text=Hola,%20quisiera%20agendar%20una%20presentación%20virtual%20sobre%20el%20proyecto%20Arienzo.', '_blank');
  };

  return (
    <div className="min-h-screen bg-[#F9F7F5] font-sans text-neutral-900 selection:bg-[#B94A36] selection:text-white">
      
      {/* NAVEGACIÓN */}
      <header className={`fixed top-0 w-full z-40 transition-all duration-500 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <img 
            src={scrolled ? "https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/arienzo-logo-terracota.svg" : "https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/arienzo-logo-blanco.svg"} 
            alt="Arienzo Logo" 
            className="h-5 md:h-7 w-auto transition-all"
          />
          <button 
            onClick={() => setMostrarModal(true)}
            className={`text-[9px] md:text-xs font-bold uppercase tracking-[0.2em] px-6 py-3 rounded-sm transition-all ${scrolled ? 'bg-[#B94A36] text-white hover:bg-[#9B3B2B]' : 'bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white hover:text-neutral-900'}`}
          >
            🔒 Acceso VIP
          </button>
        </div>
      </header>

      {/* 1. HERO INMERSIVO */}
      <section className="relative h-[100vh] min-h-[700px] flex flex-col items-center justify-center pt-20">
        <img 
          src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/render-Exterior-Fronta.jpg" 
          alt="Arienzo Fachada Frontal"
          className="absolute inset-0 w-full h-full object-cover z-0 scale-105 animate-in zoom-in duration-[10s]"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-[#F9F7F5] z-0"></div>

        <div className="relative z-10 text-center px-4 w-full max-w-4xl mx-auto mt-16">
          <span className="text-[10px] md:text-[11px] font-bold tracking-[0.4em] text-[#DEB886] uppercase mb-6 block drop-shadow-md">
            Próximamente en Manta
          </span>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-light text-white leading-tight mb-8 drop-shadow-lg">
            Todo empieza con <br />
            <span className="font-medium italic text-[#F9F7F5]">una buena ubicación.</span>
          </h1>
          <p className="text-sm md:text-base text-neutral-300 font-light max-w-lg mx-auto mb-12 leading-relaxed tracking-wide">
            Colección exclusiva de solo 22 departamentos. Accede primero a los precios de Etapa 0 y elige las mejores ubicaciones.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <button 
              onClick={agendarZoom}
              className="w-full sm:w-auto bg-[#B94A36] text-white px-8 py-4 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-[#9B3B2B] transition-all shadow-xl shadow-[#B94A36]/20 flex items-center justify-center gap-3"
            >
              <span>📹</span> Agendar Presentación
            </button>
            <button 
              onClick={() => setMostrarModal(true)}
              className="w-full sm:w-auto bg-transparent border border-white/40 text-white px-8 py-4 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-neutral-900 transition-all flex items-center justify-center gap-3"
            >
              <span>🔒</span> Solicitar Precios VIP
            </button>
          </div>
        </div>
      </section>

      {/* 2. LA UBICACIÓN (NUEVO BLOQUE PROTAGONISTA) */}
      <section className="py-24 px-6 bg-[#F9F7F5]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-16 lg:gap-24">
            <div className="w-full md:w-1/2 relative">
              {/* Contenedor de la imagen con diseño editorial */}
              <div className="relative z-10 border-[10px] border-white shadow-2xl">
                <img 
                  src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/ubicacion-arienzo-1.jpg" 
                  alt="Ubicación Barbasquillo Manta" 
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
              </div>
              {/* Acento decorativo */}
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-[#DEB886]/20 z-0"></div>
            </div>
            
            <div className="w-full md:w-1/2">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-[1px] w-12 bg-[#B94A36]"></div>
                <h2 className="text-[10px] font-bold tracking-[0.3em] text-[#B94A36] uppercase">Ubicación Estratégica</h2>
              </div>
              <h3 className="text-3xl md:text-5xl font-light text-neutral-900 leading-tight mb-8">
                La mejor zona <br /> <span className="font-medium">de Manta.</span>
              </h3>
              <p className="text-sm md:text-base text-neutral-600 font-light leading-relaxed mb-8">
                Vivir en Arienzo será disfrutar de una ubicación estratégica en el <strong>sector Barbasquillo</strong>, con acceso cercano a plazas comerciales, supermercados (nuevo Hipermarket), hoteles, restaurantes y las principales vías de la ciudad.
              </p>
              <p className="text-sm md:text-base text-neutral-600 font-light leading-relaxed">
                Un entorno pensado para quienes valoran la comodidad, la conectividad y una vida con todo al alcance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. EL CONCEPTO Y ESTILO DE VIDA */}
      <section className="py-24 px-6 bg-white border-t border-[#EAE3DC]">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h2 className="text-[10px] font-bold tracking-[0.3em] text-[#B94A36] uppercase mb-4">El Concepto</h2>
          <h3 className="text-3xl md:text-4xl font-light text-neutral-900 leading-tight">
            Un proyecto que responde <br /> a <span className="font-medium italic text-[#DEB886]">cómo se vive hoy.</span>
          </h3>
          <p className="mt-6 text-neutral-500 font-light max-w-2xl mx-auto">
            Dejamos atrás lo innecesario para enfocarnos en lo que realmente importa: un diseño inteligente que optimiza tu tiempo, tu inversión y tu estilo de vida.
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div className="p-6">
            <span className="text-3xl mb-4 block">🚶</span>
            <h4 className="text-sm font-bold text-neutral-900 uppercase tracking-widest mb-3">Ciudad Caminable</h4>
            <p className="text-xs text-neutral-500 font-light leading-relaxed">Todo cerca, sin depender del auto. Plazas y servicios a pocos pasos, optimizando tu día a día.</p>
          </div>
          <div className="p-6 border-y md:border-y-0 md:border-x border-[#EAE3DC]">
            <span className="text-3xl mb-4 block">🌊</span>
            <h4 className="text-sm font-bold text-neutral-900 uppercase tracking-widest mb-3">Esencia Costera</h4>
            <p className="text-xs text-neutral-500 font-light leading-relaxed">A pasos del mar, donde la luz natural y la brisa elevan la experiencia de vivir, conectados a la ciudad.</p>
          </div>
          <div className="p-6">
            <span className="text-3xl mb-4 block">📈</span>
            <h4 className="text-sm font-bold text-neutral-900 uppercase tracking-widest mb-3">Visión de Inversión</h4>
            <p className="text-xs text-neutral-500 font-light leading-relaxed">Alto potencial de valorización en etapa 0. Ideal para residencia principal o modelo de renta.</p>
          </div>
        </div>
      </section>

      {/* 4. AMENIDADES (Uso Real - Diseño Galería) */}
      <section className="py-24 px-6 bg-neutral-900 text-white">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h2 className="text-[10px] font-bold tracking-[0.3em] text-[#DEB886] uppercase mb-4">Uso Real</h2>
          <h3 className="text-3xl md:text-4xl font-light">Espacios pensados para vivir.</h3>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="group relative overflow-hidden rounded-sm aspect-[4/5] bg-neutral-800">
            <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/Arienzo-Piscina-1.jpg" alt="Piscina Rooftop" className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-[1s]" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-8">
              <h4 className="text-lg font-medium text-white tracking-wide mb-1">Piscina & Rooftop</h4>
              <p className="text-xs text-neutral-300 font-light">Terraza social con área de BBQ.</p>
            </div>
          </div>
          
          <div className="group relative overflow-hidden rounded-sm aspect-[4/5] bg-neutral-800 md:-translate-y-8">
            <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/render-living-arienzo.jpg" alt="Social Living" className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-[1s]" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-8">
              <h4 className="text-lg font-medium text-white tracking-wide mb-1">Social Living</h4>
              <p className="text-xs text-neutral-300 font-light">Coworking y esparcimiento.</p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-sm aspect-[4/5] bg-neutral-800">
            <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/Arienzo-Plaza-Comercial-1-1.jpg" alt="Plaza Comercial" className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-[1s]" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-8">
              <h4 className="text-lg font-medium text-white tracking-wide mb-1">Área Comercial</h4>
              <p className="text-xs text-neutral-300 font-light">Servicios en planta baja.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. RESPALDO Y CONFIANZA (Diseño Tipográfico Elegante sin renders falsos) */}
      <section className="py-24 px-6 bg-[#F9F7F5]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-[10px] font-bold tracking-[0.3em] text-[#B94A36] uppercase mb-4">Respaldo e Inversión</h2>
          <h3 className="text-3xl font-light text-neutral-900 mb-16">Confianza, experiencia y visión a largo plazo.</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20">
            {/* Arquitectura */}
            <div className="flex flex-col items-center">
              <div className="h-16 flex items-center justify-center mb-6">
                <h4 className="text-xl font-medium tracking-widest text-neutral-800 uppercase">Diez + Muller</h4>
              </div>
              <div className="w-12 h-[1px] bg-[#DEB886] mb-6"></div>
              <span className="text-[10px] font-bold tracking-[0.2em] text-neutral-400 uppercase mb-4 block">Arquitectura</span>
              <p className="text-sm text-neutral-600 font-light leading-relaxed">
                Estudio quiteño reconocido, con amplia trayectoria en proyectos residenciales y corporativos. Autores de múltiples desarrollos y responsables del diseño de Serene en Marina Blue, reflejando su enfoque en arquitectura contemporánea y alto nivel de detalle.
              </p>
            </div>

            {/* Desarrollo */}
            <div className="flex flex-col items-center">
              <div className="h-16 flex items-center justify-center mb-6">
                <h4 className="text-xl font-medium tracking-widest text-neutral-800 uppercase">Konkeri</h4>
              </div>
              <div className="w-12 h-[1px] bg-[#DEB886] mb-6"></div>
              <span className="text-[10px] font-bold tracking-[0.2em] text-neutral-400 uppercase mb-4 block">Desarrollo Inmobiliario</span>
              <p className="text-sm text-neutral-600 font-light leading-relaxed">
                Promotores con experiencia sólida. Arienzo es concebido bajo una visión integral, donde diseño, planificación y ejecución se alinean. Participación directa en cada etapa, priorizando calidad y protección de valor para inversionistas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CERRADA FINAL (CTA) */}
      <section className="py-24 bg-white text-center px-4 border-t border-[#EAE3DC]">
        <div className="max-w-2xl mx-auto">
          <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/logo-dorado-arienzo.svg" alt="Arienzo Icono" className="w-12 mx-auto mb-8" />
          <h2 className="text-[10px] font-bold tracking-[0.3em] text-[#B94A36] uppercase mb-4">Colección Limitada</h2>
          <h3 className="text-4xl md:text-5xl font-light text-neutral-900 mb-6">Sé uno de los 22 propietarios.</h3>
          <p className="text-sm text-neutral-500 font-light mb-12 leading-relaxed">
            El privilegio de pertenecer está limitado. Una propuesta reservada para muy pocos con condiciones comerciales preferenciales de Etapa Cero.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
             <button 
              onClick={agendarZoom}
              className="bg-[#B94A36] text-white px-8 py-4 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-[#9B3B2B] transition-all shadow-lg w-full sm:w-auto"
            >
              Agendar Presentación
            </button>
            <button 
              onClick={() => setMostrarModal(true)}
              className="bg-transparent border border-neutral-300 text-neutral-700 px-8 py-4 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-neutral-50 transition-all w-full sm:w-auto"
            >
              Solicitar Precios VIP
            </button>
          </div>
        </div>
      </section>

      {/* MODAL CERRADURA VIP */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-neutral-900/90 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-md p-8 rounded-sm relative shadow-2xl animate-in zoom-in-95">
            <button 
              onClick={() => { setMostrarModal(false); setSolicitudEnviada(false); }}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900 font-bold w-8 h-8 flex items-center justify-center bg-neutral-100 rounded-full"
            >
              &times;
            </button>
            
            {!solicitudEnviada ? (
              <>
                <div className="text-center mb-8">
                  <span className="text-[10px] font-bold tracking-widest text-[#B94A36] uppercase bg-[#B94A36]/10 px-3 py-1 rounded mb-3 inline-block">Acceso Restringido</span>
                  <h3 className="text-2xl font-light text-neutral-900 mb-2">Solicitud de Precios VIP</h3>
                  <p className="text-xs text-neutral-500">Déjanos tus datos para validar tu perfil de inversionista y habilitar tu acceso a la plataforma de planos y precios.</p>
                </div>

                <form onSubmit={procesarSolicitudVIP} className="space-y-5">
                  <div>
                    <input required type="text" placeholder="Nombres Completos" value={formData.nombres} onChange={e => setFormData({...formData, nombres: e.target.value})} className="w-full bg-neutral-50 border-b-2 border-neutral-200 p-3 text-sm focus:outline-none focus:border-[#B94A36] transition-colors rounded-t-sm" />
                  </div>
                  <div>
                    <input required type="tel" placeholder="WhatsApp (Ej: 0991234567)" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} className="w-full bg-neutral-50 border-b-2 border-neutral-200 p-3 text-sm focus:outline-none focus:border-[#B94A36] transition-colors rounded-t-sm" />
                  </div>
                  <div>
                    <input required type="email" placeholder="Correo Electrónico" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-neutral-50 border-b-2 border-neutral-200 p-3 text-sm focus:outline-none focus:border-[#B94A36] transition-colors rounded-t-sm" />
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={cargando}
                    className="w-full bg-neutral-900 text-white py-4 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors shadow-lg disabled:opacity-70 mt-4 flex justify-center items-center"
                  >
                    {cargando ? 'Procesando Solicitud...' : 'Enviar Solicitud'}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">✓</div>
                <h3 className="text-2xl font-light text-neutral-900 mb-3">Solicitud Recibida</h3>
                <p className="text-sm text-neutral-600 leading-relaxed mb-6">
                  Debido a la exclusividad de la Etapa 0, nuestro equipo revisará tu solicitud y se pondrá en contacto contigo vía WhatsApp o correo electrónico para enviarte tu pase de acceso al inventario privado.
                </p>
                <button 
                  onClick={() => { setMostrarModal(false); setSolicitudEnviada(false); }}
                  className="bg-neutral-100 text-neutral-900 px-6 py-3 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-neutral-200 transition-colors"
                >
                  Volver al inicio
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}