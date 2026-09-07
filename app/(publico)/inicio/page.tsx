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
    // Sensor silencioso para el radar
    await supabase.from('tracking_inventario').insert([{
      email_cliente: 'Visitante Web',
      accion: 'ABRIO_CALENDLY',
      detalle: 'Abrió modal de agendamiento'
    }]).catch(() => {});
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
            onClick={() => setMostrarModalVip(true)}
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
              onClick={abrirCalendly}
              className="w-full sm:w-auto bg-[#B94A36] text-white px-8 py-4 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-[#9B3B2B] transition-all shadow-xl shadow-[#B94A36]/20 flex items-center justify-center gap-3"
            >
              <span>📹</span> Agendar Presentación
            </button>
            <button 
              onClick={() => setMostrarModalVip(true)}
              className="w-full sm:w-auto bg-transparent border border-white/40 text-white px-8 py-4 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-neutral-900 transition-all flex items-center justify-center gap-3"
            >
              <span>🔒</span> Solicitar Precios VIP
            </button>
          </div>
        </div>
      </section>

      {/* BANDA TERRACOTA (Diseño Extraído de WordPress) */}
      <div className="bg-[#B94A36] py-12 px-6 text-center shadow-inner">
        <h2 className="text-white font-light text-xl md:text-2xl tracking-wide max-w-3xl mx-auto italic">
          "Porque el verdadero lujo es vivir bien, todos los días."
        </h2>
      </div>

      {/* 2. LA UBICACIÓN */}
      <section className="py-24 px-6 bg-[#F9F7F5]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-16 lg:gap-24">
            <div className="w-full md:w-1/2 relative">
              <div className="relative z-10 border-[10px] border-white shadow-2xl">
                <img 
                  src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/ubicacion-arienzo-1.jpg" 
                  alt="Ubicación Barbasquillo Manta" 
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
              </div>
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
                Vivir en Arienzo es disfrutar de una ubicación estratégica en el sector Barbasquillo, con acceso cercano a plazas comerciales, supermercados (nuevo Hipermarket), hoteles, restaurantes y las principales vías de la ciudad.
              </p>
              <p className="text-sm md:text-base text-neutral-600 font-light leading-relaxed">
                Un entorno pensado para quienes valoran la comodidad, la conectividad y una vida con todo al alcance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. EL CONCEPTO Y VISIÓN DE INVERSIÓN (Elevado) */}
      <section className="py-24 px-6 bg-white border-t border-[#EAE3DC]">
        <div className="max-w-7xl mx-auto text-center mb-20">
          <h2 className="text-[10px] font-bold tracking-[0.3em] text-[#B94A36] uppercase mb-4">El Concepto</h2>
          <h3 className="text-3xl md:text-4xl font-light text-neutral-900 leading-tight">
            Un proyecto que responde <br /> a <span className="font-medium italic text-[#DEB886]">cómo se vive hoy.</span>
          </h3>
          <p className="mt-6 text-neutral-500 font-light max-w-3xl mx-auto leading-relaxed">
            Creamos Arienzo Boutique Living buscando el equilibrio perfecto entre una arquitectura destacada y un estilo de vida cómodo. El proyecto cuenta con 22 departamentos y 3 locales comerciales integrados armónicamente para sumar valor a tu experiencia.
          </p>
        </div>

        {/* Columnas de Inversión y Estilo de vida */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-left">
          <div className="p-8 bg-[#F9F7F5] rounded-sm border border-[#EAE3DC] hover:border-[#DEB886] transition-colors">
            <h4 className="text-sm font-bold text-neutral-900 uppercase tracking-widest mb-4">Ciudad Caminable</h4>
            <p className="text-xs text-neutral-600 font-light leading-relaxed">Todo cerca, sin depender del auto. Plazas, supermercados y servicios a pocos pasos, optimizando tu día a día en un entorno dinámico.</p>
          </div>
          <div className="p-8 bg-[#F9F7F5] rounded-sm border border-[#EAE3DC] hover:border-[#DEB886] transition-colors">
            <h4 className="text-sm font-bold text-neutral-900 uppercase tracking-widest mb-4">Estándar Exigente</h4>
            <p className="text-xs text-neutral-600 font-light leading-relaxed">Personas que disfrutan la vida costera, pero no comprometen calidad, diseño ni comodidad urbana. Su formato íntimo ofrece un entorno privado.</p>
          </div>
          <div className="p-8 bg-neutral-900 text-white rounded-sm shadow-xl">
            <h4 className="text-sm font-bold text-[#DEB886] uppercase tracking-widest mb-4">Visión de Inversión</h4>
            <p className="text-xs text-neutral-300 font-light leading-relaxed mb-4">Ingresar en etapa inicial permite capturar la mayor plusvalía en un sector premium consolidado con alta demanda real.</p>
            <button onClick={() => setMostrarModalVip(true)} className="text-[10px] uppercase tracking-widest font-bold text-white border-b border-[#B94A36] pb-1 hover:text-[#B94A36] transition-colors">Descubrir Precios ➔</button>
          </div>
        </div>
      </section>

      {/* 4. GALERÍA DE RENDERS (Mosaico Moderno) */}
      <section className="py-24 px-2 bg-black">
        <div className="max-w-7xl mx-auto text-center mb-12">
           <h2 className="text-[10px] font-bold tracking-[0.3em] text-[#DEB886] uppercase mb-4">Galería del Proyecto</h2>
           <h3 className="text-3xl md:text-4xl font-light text-white">Imágenes que hablan por sí solas.</h3>
        </div>
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          <div className="overflow-hidden aspect-video bg-neutral-800">
            <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/render-Exterior-Fronta.jpg" alt="Fachada" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 opacity-90 hover:opacity-100" loading="lazy" />
          </div>
          <div className="overflow-hidden aspect-video bg-neutral-800">
            <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/render-Interior-Departamento-1.jpg" alt="Interior" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 opacity-90 hover:opacity-100" loading="lazy" />
          </div>
          <div className="overflow-hidden aspect-video bg-neutral-800">
            <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/Arienzo-Piscina-1.jpg" alt="Piscina" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 opacity-90 hover:opacity-100" loading="lazy" />
          </div>
          <div className="overflow-hidden aspect-video bg-neutral-800">
            <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/render-Exterior-Derecho-A4.jpg" alt="Vista Lateral" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 opacity-90 hover:opacity-100" loading="lazy" />
          </div>
          <div className="overflow-hidden aspect-video bg-neutral-800">
            <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/render-living-arienzo.jpg" alt="Living" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 opacity-90 hover:opacity-100" loading="lazy" />
          </div>
          <div className="overflow-hidden aspect-video bg-neutral-800">
            <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/Arienzo-Plaza-Comercial-1-1.jpg" alt="Plaza Comercial" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 opacity-90 hover:opacity-100" loading="lazy" />
          </div>
        </div>
      </section>

      {/* 5. RESPALDO Y CONFIANZA (Tres Pilares Oficiales) */}
      <section className="py-24 px-6 bg-[#F9F7F5]">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-[10px] font-bold tracking-[0.3em] text-[#B94A36] uppercase mb-4">Respaldo e Inversión</h2>
          <h3 className="text-3xl font-light text-neutral-900 mb-16">Confianza, experiencia y visión a largo plazo.</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center divide-y md:divide-y-0 md:divide-x divide-[#EAE3DC]">
            {/* Arquitectura */}
            <div className="flex flex-col items-center pt-8 md:pt-0 md:px-8">
              <span className="text-3xl mb-4 text-[#DEB886]">📐</span>
              <h4 className="text-lg font-medium tracking-widest text-neutral-800 uppercase mb-2">Diez + Muller</h4>
              <span className="text-[9px] font-bold tracking-[0.2em] text-[#B94A36] uppercase mb-4 block">Arquitectura</span>
              <p className="text-xs text-neutral-600 font-light leading-relaxed">
                Estudio quiteño reconocido entre los más destacados del Ecuador. Autores de Serene en Marina Blue, reflejando su arquitectura contemporánea y atención al detalle.
              </p>
            </div>

            {/* Construcción (NUEVO) */}
            <div className="flex flex-col items-center pt-8 md:pt-0 md:px-8">
              <span className="text-3xl mb-4 text-[#DEB886]">🏗️</span>
              <h4 className="text-lg font-medium tracking-widest text-neutral-800 uppercase mb-2">Carrasco Suarez</h4>
              <span className="text-[9px] font-bold tracking-[0.2em] text-[#B94A36] uppercase mb-4 block">Construcción</span>
              <p className="text-xs text-neutral-600 font-light leading-relaxed">
                Desde 1992 construyendo con solidez. Con amplia experiencia en la Costa y proyectos residenciales de alto nivel como el Hotel Eolia y Serene.
              </p>
            </div>

            {/* Desarrollo */}
            <div className="flex flex-col items-center pt-8 md:pt-0 md:px-8">
              <span className="text-3xl mb-4 text-[#DEB886]">🏢</span>
              <h4 className="text-lg font-medium tracking-widest text-neutral-800 uppercase mb-2">Konkeri</h4>
              <span className="text-[9px] font-bold tracking-[0.2em] text-[#B94A36] uppercase mb-4 block">Desarrollo y Ventas</span>
              <p className="text-xs text-neutral-600 font-light leading-relaxed">
                Promotora en Manta con visión integral. Estrategia y diseño se integran para crear proyectos sólidos, alineados con las necesidades del mercado.
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
              onClick={abrirCalendly}
              className="bg-[#B94A36] text-white px-8 py-4 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-[#9B3B2B] transition-all shadow-lg w-full sm:w-auto"
            >
              Agendar Presentación
            </button>
            <button 
              onClick={() => setMostrarModalVip(true)}
              className="bg-transparent border border-neutral-300 text-neutral-700 px-8 py-4 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-neutral-50 transition-all w-full sm:w-auto"
            >
              Solicitar Precios VIP
            </button>
          </div>
        </div>
      </section>

      {/* MODAL CERRADURA VIP */}
      {mostrarModalVip && (
        <div className="fixed inset-0 bg-neutral-900/90 z-[60] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-md p-8 rounded-sm relative shadow-2xl animate-in zoom-in-95">
            <button 
              onClick={() => { setMostrarModalVip(false); setSolicitudEnviada(false); }}
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
                  Debido a la exclusividad de la Etapa 0, nuestro equipo revisará tu solicitud y se pondrá en contacto contigo vía WhatsApp o correo electrónico para enviarte tu pase de acceso.
                </p>
                <button 
                  onClick={() => { setMostrarModalVip(false); setSolicitudEnviada(false); }}
                  className="bg-neutral-100 text-neutral-900 px-6 py-3 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-neutral-200 transition-colors"
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
          <div className="bg-white w-full max-w-4xl h-[85vh] rounded-xl relative shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
            <div className="flex justify-between items-center p-4 border-b border-neutral-200 bg-white z-10">
              <h3 className="text-sm font-bold tracking-widest uppercase text-neutral-800">Agendar Asesoría Inmobiliaria</h3>
              <button 
                onClick={() => setMostrarModalCalendly(false)}
                className="w-8 h-8 flex items-center justify-center bg-neutral-100 text-neutral-600 hover:bg-neutral-200 rounded-full font-bold transition-colors"
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
      <footer className="bg-black text-neutral-400 py-16 text-center text-xs border-t border-neutral-800">
        <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/arienzo-logo-blanco.svg" alt="Arienzo" className="h-6 mx-auto mb-8 opacity-40" />
        <div className="flex flex-col md:flex-row justify-center gap-2 md:gap-6 mb-8 font-light">
          <p>📍 Edificio Manta Business Center, Torre B, Oficina 801</p>
          <p className="hidden md:block">•</p>
          <p>📞 097 946 9472</p>
        </div>
        <p className="mb-2">Desarrollado por <strong className="text-white">KONKERI</strong></p>
        <p>© {new Date().getFullYear()} Arienzo Boutique Living. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}