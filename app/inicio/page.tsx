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

  // Efecto para hacer el menú transparente al inicio y blanco al hacer scroll
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
      // 1. Guardamos al cliente en el CRM como prospecto web esperando validación
      await supabase.from('clientes').upsert([{
        nombres: formData.nombres,
        telefono: formData.telefono,
        email: correoLimpio,
        tipo: 'prospecto',
        origen: 'Web Pública - Solicitud VIP'
      }], { onConflict: 'email' }).catch(() => {});

      // SENSOR SILENCIOSO: Registramos la intención
      await supabase.from('tracking_inventario').insert([{
        email_cliente: correoLimpio,
        accion: 'SOLICITUD_ACCESO_VIP',
        detalle: 'Completó formulario en landing page para pedir acceso'
      }]).catch(() => {});

      // Mostramos el mensaje de éxito (NO REDIRIGIMOS)
      setSolicitudEnviada(true);

      // Opcional: Notificar por WhatsApp internamente a los asesores
      fetch('/api/notificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: "nueva_solicitud_web",
          datos: { nombres: formData.nombres, telefono: formData.telefono, email: correoLimpio }
        })
      }).catch(() => {});

    } catch (error) {
      console.error("Error al procesar:", error);
      alert("Hubo un problema de conexión. Intenta nuevamente.");
    } finally {
      setCargando(false);
    }
  };

  const agendarZoom = () => {
    // SENSOR SILENCIOSO
    if (formData.email) {
      supabase.from('tracking_inventario').insert([{
        email_cliente: formData.email,
        accion: 'CLIC_AGENDAR_ZOOM',
        detalle: 'Clic en botón principal de Agendar Presentación'
      }]).catch(() => {});
    }
    // Link de WhatsApp o Calendly
    window.open('https://wa.me/593979469472?text=Hola,%20quisiera%20agendar%20una%20presentación%20virtual%20sobre%20el%20proyecto%20Arienzo.', '_blank');
  };

  return (
    <div className="min-h-screen bg-[#F9F7F5] font-sans text-neutral-900 selection:bg-[#B94A36] selection:text-white">
      
      {/* NAVEGACIÓN SUPERIOR FIJA */}
      <header className={`fixed top-0 w-full z-40 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <img 
            src={scrolled ? "https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/arienzo-logo-terracota.svg" : "https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/arienzo-logo-blanco.svg"} 
            alt="Arienzo Logo" 
            className="h-6 md:h-8 w-auto transition-all"
          />
          <button 
            onClick={() => setMostrarModal(true)}
            className={`text-[10px] md:text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-sm transition-all ${scrolled ? 'bg-[#B94A36] text-white hover:bg-[#9B3B2B]' : 'bg-white/20 backdrop-blur-md text-white border border-white/30 hover:bg-white hover:text-neutral-900'}`}
          >
            🔒 Acceso VIP
          </button>
        </div>
      </header>

      {/* 1. HERO INMERSIVO (Portada: render-Exterior-Fronta) */}
      <section className="relative h-[100vh] min-h-[700px] flex flex-col items-center justify-center pt-20">
        <img 
          src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/render-Exterior-Fronta.jpg" 
          alt="Arienzo Fachada Frontal"
          className="absolute inset-0 w-full h-full object-cover z-0"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-[#F9F7F5] z-0"></div>

        <div className="relative z-10 text-center px-4 w-full max-w-4xl mx-auto">
          <span className="text-[10px] md:text-xs font-bold tracking-[0.3em] text-[#DEB886] uppercase mb-4 block drop-shadow-md">
            Próximamente en Manta
          </span>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-light text-white leading-tight mb-6 drop-shadow-lg">
            Todo empieza con <br />
            <span className="font-medium italic">una buena ubicación.</span>
          </h1>
          <p className="text-sm md:text-base text-neutral-200 font-light max-w-xl mx-auto mb-10 leading-relaxed">
            Solo 22 departamentos de 1, 2 y 3 dormitorios. Accede primero a los mejores precios de lanzamiento y elige las ubicaciones más exclusivas.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={agendarZoom}
              className="w-full sm:w-auto bg-[#B94A36] text-white px-8 py-4 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-[#9B3B2B] transition-all shadow-xl shadow-[#B94A36]/30 flex items-center justify-center gap-2"
            >
              <span>📹</span> Agendar Presentación
            </button>
            <button 
              onClick={() => setMostrarModal(true)}
              className="w-full sm:w-auto bg-white/10 backdrop-blur-md border border-white/30 text-white px-8 py-4 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-neutral-900 transition-all flex items-center justify-center gap-2"
            >
              <span>🔒</span> Solicitar Precios y Planos
            </button>
          </div>
        </div>
      </section>

      {/* 2. EL CONCEPTO Y ESTILO DE VIDA */}
      <section className="py-24 px-6 bg-[#F9F7F5]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-xs font-bold tracking-[0.2em] text-[#B94A36] uppercase mb-4">El Concepto</h2>
            <h3 className="text-3xl md:text-4xl font-light text-neutral-900 leading-tight mb-6">
              Un proyecto que responde <br /> a <span className="font-medium italic">cómo se vive hoy.</span>
            </h3>
            <p className="text-sm text-neutral-600 font-light leading-relaxed mb-8">
              Dejamos atrás lo innecesario para enfocarnos en lo que realmente importa: un diseño inteligente que optimiza tu tiempo, tu inversión y tu estilo de vida. Arienzo es para quienes entienden que la calidad de vida no es un evento de fin de semana, sino una construcción diaria.
            </p>
            
            <div className="space-y-6 border-t border-[#EAE3DC] pt-8">
              <div>
                <h4 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-1">Sector Premium Consolidado</h4>
                <p className="text-xs text-neutral-500 leading-relaxed">Ubicado en Barbasquillo, el sector más demandado de Manta. A pasos de La Quadra, concentrando valor, demanda y plusvalía real.</p>
              </div>
              <div>
                <h4 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-1">Ciudad Caminable</h4>
                <p className="text-xs text-neutral-500 leading-relaxed">Todo cerca, sin depender del auto. Restaurantes, plazas y servicios a pocos pasos, optimizando tu día a día.</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <img 
              src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/render-Interior-Departamento-1.jpg" 
              alt="Interior Arienzo" 
              className="w-full h-auto rounded-sm shadow-2xl object-cover"
              loading="lazy"
            />
            <div className="absolute -bottom-10 -left-10 bg-white p-8 shadow-xl border border-[#EAE3DC] hidden md:block max-w-[280px]">
              <h4 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-2">Visión de Inversión</h4>
              <p className="text-xs text-neutral-500 leading-relaxed">Alto potencial de valorización en etapa 0 y uso flexible (residencia o renta).</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. AMENIDADES (Uso Real) */}
      <section className="py-24 px-6 bg-white border-y border-[#EAE3DC]">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h2 className="text-xs font-bold tracking-[0.2em] text-[#B94A36] uppercase mb-4">Uso Real</h2>
          <h3 className="text-3xl md:text-4xl font-light text-neutral-900">Espacios pensados para vivir.</h3>
          <p className="text-sm text-neutral-500 mt-4 max-w-2xl mx-auto font-light">Amenidades bien diseñadas y ejecutadas, con el mismo nivel de detalle y buen gusto presente en todo el proyecto.</p>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Amenidad 1 */}
          <div className="group cursor-pointer">
            <div className="overflow-hidden rounded-sm mb-4 aspect-[4/3] bg-neutral-100">
              <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/Arienzo-Piscina-1.jpg" alt="Piscina Rooftop" className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" loading="lazy" />
            </div>
            <h4 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-1">Piscina & Rooftop</h4>
            <p className="text-xs text-neutral-500">Terraza social con piscina y área de BBQ.</p>
          </div>
          
          {/* Amenidad 2 */}
          <div className="group cursor-pointer md:mt-12">
            <div className="overflow-hidden rounded-sm mb-4 aspect-[4/3] bg-neutral-100">
              <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/render-living-arienzo.jpg" alt="Social Living" className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" loading="lazy" />
            </div>
            <h4 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-1">Social Living</h4>
            <p className="text-xs text-neutral-500">Coworking y esparcimiento en un solo espacio.</p>
          </div>

          {/* Amenidad 3 */}
          <div className="group cursor-pointer">
            <div className="overflow-hidden rounded-sm mb-4 aspect-[4/3] bg-neutral-100">
              <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/Arienzo-Plaza-Comercial-1-1.jpg" alt="Plaza Comercial" className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" loading="lazy" />
            </div>
            <h4 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-1">Área Comercial</h4>
            <p className="text-xs text-neutral-500">Servicios y conveniencia en planta baja.</p>
          </div>
        </div>
      </section>

      {/* 4. RESPALDO Y UBICACIÓN */}
      <section className="py-24 px-6 bg-[#F9F7F5]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/render-Exterior-Derecho-A4.jpg" alt="Arquitectura Arienzo" className="w-full h-auto rounded-sm shadow-xl" loading="lazy" />
          </div>
          <div>
            <h2 className="text-xs font-bold tracking-[0.2em] text-[#B94A36] uppercase mb-4">Respaldo e Inversión</h2>
            <h3 className="text-3xl font-light text-neutral-900 mb-8">Confianza, experiencia y visión a largo plazo.</h3>
            
            <div className="space-y-8">
              <div>
                <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-widest mb-2 border-l-2 border-[#B94A36] pl-3">Arquitectura: Diez + Muller</h4>
                <p className="text-xs text-neutral-600 font-light leading-relaxed pl-3">
                  Estudio quiteño reconocido, con amplia trayectoria en proyectos residenciales y corporativos. Responsables del diseño de Serene en Marina Blue, reflejando su enfoque contemporáneo.
                </p>
              </div>
              <div>
                <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-widest mb-2 border-l-2 border-[#B94A36] pl-3">Desarrollo: Konkeri</h4>
                <p className="text-xs text-neutral-600 font-light leading-relaxed pl-3">
                  Arienzo es un proyecto concebido bajo una visión integral. Con participación directa en cada etapa, priorizando calidad, coherencia y protección de valor para inversionistas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CERRADA FINAL (CTA) */}
      <section className="py-24 bg-neutral-900 text-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/ubicacion-arienzo-1.jpg')] bg-cover bg-center opacity-10"></div>
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-xs font-bold tracking-[0.2em] text-[#DEB886] uppercase mb-4">Oportunidad Etapa Cero</h2>
          <h3 className="text-4xl md:text-5xl font-light text-white mb-6">Sé uno de los 22 propietarios.</h3>
          <p className="text-sm text-neutral-400 font-light mb-10 leading-relaxed">
            El privilegio de pertenecer está limitado a solo 22 inversionistas. Una propuesta reservada para muy pocos con condiciones comerciales preferenciales de lanzamiento.
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
              className="bg-transparent border border-white/30 text-white px-8 py-4 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-neutral-900 transition-all w-full sm:w-auto"
            >
              Solicitar Precios VIP
            </button>
          </div>
        </div>
      </section>

      {/* MODAL CERRADURA VIP (El Cerrojo con validación manual) */}
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

      {/* FOOTER */}
      <footer className="bg-black text-neutral-500 py-12 text-center text-xs border-t border-neutral-800">
        <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/arienzo-logo-blanco.svg" alt="Arienzo" className="h-6 mx-auto mb-6 opacity-30" />
        <p className="mb-2">Desarrollado por <strong>KONKERI</strong></p>
        <p>© {new Date().getFullYear()} Arienzo Boutique Living. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}