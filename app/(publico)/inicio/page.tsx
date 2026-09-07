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
    <div className="min-h-screen bg-[#F9F7F5] font-sans text-neutral-800 selection:bg-[#974932] selection:text-white">
      
      {/* NAVEGACIÓN */}
      <header className={`fixed top-0 w-full z-40 transition-all duration-500 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-8'}`}>
        <div className="max-w-7xl mx-auto px-8 md:px-12 flex justify-between items-center">
          <img 
            src={scrolled ? "https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/arienzo-logo-terracota.svg" : "https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/arienzo-logo-blanco.svg"} 
            alt="Arienzo Logo" 
            className="h-5 md:h-6 w-auto transition-all duration-500"
          />
          <button 
            onClick={() => setMostrarModalVip(true)}
            className={`text-[10px] font-bold uppercase tracking-[0.25em] px-6 py-3 rounded-md transition-all duration-300 ${scrolled ? 'bg-[#974932] text-white hover:bg-[#7A3A27] shadow-md' : 'bg-white/10 backdrop-blur-md text-white border border-white/30 hover:bg-white hover:text-[#974932]'}`}
          >
            Acceso VIP
          </button>
        </div>
      </header>

      {/* 1. HERO INMERSIVO */}
      <section className="relative h-[100vh] min-h-[700px] flex flex-col items-center justify-center overflow-hidden">
        <img 
          src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/render-Exterior-Fronta.jpg" 
          alt="Arienzo Fachada"
          className="absolute inset-0 w-full h-full object-cover z-0 animate-[pulse_20s_ease-in-out_infinite] scale-105"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-[#F9F7F5] z-0"></div>

        <div className="relative z-10 text-center px-8 w-full max-w-5xl mx-auto pt-20">
          <div className="inline-block px-5 py-2 border border-[#DEB886]/40 backdrop-blur-sm rounded-full mb-8">
            <span className="text-[10px] font-bold tracking-[0.3em] text-[#DEB886] uppercase">
              Próximamente en Manta
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-[4.5rem] font-light text-white leading-[1.1] mb-8 tracking-tight drop-shadow-lg">
            Todo empieza con <br />
            <span className="font-medium text-[#F9F7F5]">una buena ubicación.</span>
          </h1>
          <p className="text-sm md:text-lg text-neutral-200 font-light max-w-2xl mx-auto mb-12 leading-relaxed">
            Colección exclusiva de solo 22 departamentos. Accede primero a los precios de Etapa Cero y elige las mejores ubicaciones.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <button 
              onClick={abrirCalendly}
              className="w-full sm:w-auto bg-[#974932] text-white px-8 py-4 rounded-md text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-[#7A3A27] transition-all duration-300 shadow-xl hover:-translate-y-1"
            >
              Agendar Presentación
            </button>
            <button 
              onClick={() => setMostrarModalVip(true)}
              className="w-full sm:w-auto bg-transparent border border-white/40 text-white px-8 py-4 rounded-md text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-neutral-900 transition-all duration-300 hover:-translate-y-1"
            >
              Solicitar Precios VIP
            </button>
          </div>
        </div>
      </section>

      {/* BANDA TERRACOTA FUSIONADA CON IMAGEN IA */}
      <div className="relative py-24 md:py-32 px-8 text-center flex items-center justify-center overflow-hidden bg-[#974932]">
        <img 
          src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/familia-en-sala-banco-imagenes-ia.jpg" 
          alt="Familia en Arienzo" 
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30"
        />
        <div className="absolute inset-0 bg-[#974932]/70"></div>
        <h2 className="relative z-10 text-white font-light text-2xl md:text-4xl tracking-wide max-w-4xl mx-auto leading-relaxed px-4">
          "El verdadero lujo es vivir bien, todos los días."
        </h2>
      </div>

      {/* 2. LA UBICACIÓN */}
      <section className="py-24 md:py-32 px-8 md:px-12 bg-[#F9F7F5]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="w-full md:w-1/2 relative">
              <div className="relative z-10 overflow-hidden rounded-2xl shadow-2xl">
                <img 
                  src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/ubicacion-arienzo-1.jpg" 
                  alt="Ubicación Barbasquillo Manta" 
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
              </div>
            </div>
            
            <div className="w-full md:w-1/2 md:pl-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-[2px] w-12 bg-[#974932]"></div>
                <span className="text-[10px] font-bold tracking-[0.3em] text-[#974932] uppercase">Barbasquillo, Manta</span>
              </div>
              <h3 className="text-4xl md:text-5xl font-light text-neutral-900 leading-[1.1] mb-8 tracking-tight">
                La mejor zona <br /> <span className="font-medium text-[#974932]">de la ciudad.</span>
              </h3>
              <div className="space-y-6 text-base text-neutral-600 font-light leading-relaxed">
                <p>
                  Vivir en Arienzo es disfrutar de una ubicación estratégica. Acceso inmediato a plazas comerciales, supermercados (nuevo Hipermarket), hoteles, restaurantes y vías principales.
                </p>
                <p>
                  Diseñado para quienes valoran la conectividad y una vida caminable, donde todo está a tu alcance optimizando tu tiempo.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. AMENIDADES (Textos claros y distribuidos) */}
      <section className="py-24 md:py-32 px-8 md:px-12 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <span className="text-[10px] font-bold tracking-[0.3em] text-[#974932] uppercase mb-4 block">Amenidades Exclusivas</span>
            <h3 className="text-4xl md:text-5xl font-light text-neutral-900 tracking-tight mb-6">Espacios pensados para vivir.</h3>
            <p className="max-w-2xl mx-auto text-base text-neutral-500 font-light leading-relaxed">
              El rooftop reúne las áreas comunes en un solo nivel, organizadas para una circulación fluida y funcionamiento eficiente, elevando tu experiencia diaria.
            </p>
          </div>

          <div className="space-y-24">
            
            {/* Amenidad 1 */}
            <div className="flex flex-col md:flex-row gap-12 items-center">
              <div className="w-full md:w-7/12 aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
                <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/Arienzo-Piscina-1.jpg" alt="Piscina Rooftop" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" loading="lazy"/>
              </div>
              <div className="w-full md:w-5/12 md:pl-8">
                <h4 className="text-2xl md:text-3xl font-light text-neutral-900 mb-2">Piscina & Rooftop</h4>
                <div className="w-12 h-[2px] bg-[#DEB886] mb-6"></div>
                <p className="text-base text-neutral-600 font-light leading-relaxed">
                  Concebida desde la experiencia de uso, la piscina y su amplio deck crean un ambiente donde el bienestar, el diseño y la comodidad encuentran el equilibrio perfecto. Incluye un área de BBQ ideal para compartir.
                </p>
              </div>
            </div>

            {/* Amenidad 2 */}
            <div className="flex flex-col md:flex-row-reverse gap-12 items-center">
              <div className="w-full md:w-7/12 aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
                <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/render-living-arienzo.jpg" alt="Social Living" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" loading="lazy"/>
              </div>
              <div className="w-full md:w-5/12 md:pr-8">
                <h4 className="text-2xl md:text-3xl font-light text-neutral-900 mb-2">Social Living</h4>
                <div className="w-12 h-[2px] bg-[#DEB886] mb-6"></div>
                <p className="text-base text-neutral-600 font-light leading-relaxed">
                  Un ambiente flexible que integra áreas de descanso, coworking y entretenimiento en un mismo lugar. Pensado minuciosamente para compartir con familia, trabajar de forma remota o simplemente disfrutar de la vista.
                </p>
              </div>
            </div>

            {/* Amenidad 3 */}
            <div className="flex flex-col md:flex-row gap-12 items-center">
              <div className="w-full md:w-7/12 aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
                <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/Arienzo-Plaza-Comercial-1-1.jpg" alt="Plaza Comercial" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" loading="lazy"/>
              </div>
              <div className="w-full md:w-5/12 md:pl-8">
                <h4 className="text-2xl md:text-3xl font-light text-neutral-900 mb-2">Área Comercial</h4>
                <div className="w-12 h-[2px] bg-[#DEB886] mb-6"></div>
                <p className="text-base text-neutral-600 font-light leading-relaxed">
                  Un retail de planta baja cuidadosamente curado para complementar tu experiencia. Marcas y servicios seleccionados por su calidad, conveniencia y total afinidad con el estilo de vida tranquilo de Arienzo.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. GALERÍA (Estilo Lightbox / WordPress) */}
      <section className="py-24 md:py-32 px-8 md:px-12 bg-[#F9F7F5] border-t border-[#EAE3DC]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[10px] font-bold tracking-[0.3em] text-[#974932] uppercase mb-4 block">Galería del Proyecto</span>
            <h3 className="text-3xl md:text-4xl font-light text-neutral-900 tracking-tight">Arquitectura y Diseño</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {imagenesGaleria.map((img, index) => (
              <div 
                key={index} 
                className="group relative aspect-square overflow-hidden rounded-xl cursor-pointer shadow-sm hover:shadow-xl transition-all"
                onClick={() => setImagenAmpliada(img)}
              >
                <img src={img} alt={`Arienzo Galería ${index + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                <div className="absolute inset-0 bg-[#974932]/0 group-hover:bg-[#974932]/30 transition-colors duration-300 flex items-center justify-center">
                  <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-50 group-hover:scale-100 transform text-3xl">⛶</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LIGHTBOX MODAL PARA GALERÍA */}
      {imagenAmpliada && (
        <div className="fixed inset-0 bg-black/95 z-[70] flex items-center justify-center p-4 md:p-8 backdrop-blur-sm animate-in fade-in" onClick={() => setImagenAmpliada(null)}>
          <button className="absolute top-6 right-6 text-white/50 hover:text-white text-4xl font-light transition-colors z-50">&times;</button>
          <img src={imagenAmpliada} alt="Arienzo Vista Ampliada" className="max-w-full max-h-[90vh] object-contain rounded-md shadow-2xl animate-in zoom-in-95" />
        </div>
      )}

      {/* 5. VISIÓN Y RESPALDO */}
      <section className="py-24 md:py-32 px-8 md:px-12 bg-white">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">
          
          {/* Inversión */}
          <div className="bg-[#F9F7F5] p-10 rounded-2xl border border-[#EAE3DC]">
            <span className="text-[10px] font-bold tracking-[0.3em] text-[#974932] uppercase mb-4 block">Etapa Cero</span>
            <h3 className="text-3xl font-light text-neutral-900 mb-6">Visión de Inversión</h3>
            <p className="text-sm text-neutral-600 font-light leading-relaxed mb-8">
              Arienzo representa una entrada estratégica en un sector premium consolidado. Ingresar desde etapa inicial permite capturar la mayor plusvalía del proyecto.
            </p>
            <ul className="space-y-4">
              <li className="flex items-start gap-4 border-b border-[#EAE3DC] pb-4">
                <span className="text-[#DEB886] mt-1 text-lg">✦</span>
                <span className="text-sm font-medium text-neutral-700 leading-relaxed">Exclusividad garantizada con solo 22 unidades.</span>
              </li>
              <li className="flex items-start gap-4 pt-2">
                <span className="text-[#DEB886] mt-1 text-lg">✦</span>
                <span className="text-sm font-medium text-neutral-700 leading-relaxed">Uso flexible ideal para residencia o modelo de renta.</span>
              </li>
            </ul>
          </div>

          {/* Respaldo */}
          <div className="p-10 flex flex-col justify-center">
            <span className="text-[10px] font-bold tracking-[0.3em] text-[#974932] uppercase mb-4 block">Trayectoria</span>
            <h3 className="text-3xl font-light text-neutral-900 mb-10">Respaldo Inmobiliario</h3>
            <div className="space-y-8">
              <div>
                <h4 className="text-sm font-bold tracking-widest uppercase text-neutral-900 mb-2">Diez + Muller <span className="font-light text-neutral-400">| Arquitectura</span></h4>
                <p className="text-sm text-neutral-500 font-light leading-relaxed">Considerado entre los más destacados del Ecuador. Autores de Serene en Marina Blue.</p>
              </div>
              <div>
                <h4 className="text-sm font-bold tracking-widest uppercase text-neutral-900 mb-2">Carrasco Suarez <span className="font-light text-neutral-400">| Construcción</span></h4>
                <p className="text-sm text-neutral-500 font-light leading-relaxed">Desde 1992 construyendo con solidez en proyectos residenciales de alto nivel.</p>
              </div>
              <div>
                <h4 className="text-sm font-bold tracking-widest uppercase text-neutral-900 mb-2">Konkeri <span className="font-light text-neutral-400">| Desarrollo</span></h4>
                <p className="text-sm text-neutral-500 font-light leading-relaxed">Visión integral donde estrategia y diseño aseguran proyectos sólidos a largo plazo.</p>
              </div>
            </div>
          </div>
          
        </div>
      </section>

      {/* 6. CERRADA FINAL (Terracota y Logo Masivo) */}
      <section className="py-24 md:py-36 bg-[#974932] text-center px-6 relative overflow-hidden">
        {/* Luces de fondo sutiles */}
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-white/5 to-transparent z-0 pointer-events-none"></div>
        
        <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
          <img 
            src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/logo-dorado-arienzo.svg" 
            alt="Arienzo Icono Dorado" 
            className="w-32 md:w-48 mb-12 drop-shadow-2xl" 
          />
          <h2 className="text-[10px] font-bold tracking-[0.4em] text-[#DEB886] uppercase mb-4">Oportunidad Única</h2>
          <h3 className="text-4xl md:text-5xl font-light tracking-tight text-white mb-8">Sé uno de los 22 propietarios.</h3>
          <p className="text-base text-white/90 font-light mb-12 leading-relaxed max-w-xl mx-auto">
            El privilegio de pertenecer está limitado. Ingresa para descubrir precios, tipologías y disponibilidad de lanzamiento en Etapa Cero.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-5 w-full sm:w-auto">
             <button 
              onClick={abrirCalendly}
              className="bg-white text-[#974932] px-10 py-4 rounded-md text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-neutral-100 transition-transform duration-300 hover:-translate-y-1 w-full sm:w-auto shadow-2xl"
            >
              Agendar Presentación
            </button>
            <button 
              onClick={() => setMostrarModalVip(true)}
              className="bg-[#974932] border border-white text-white px-10 py-4 rounded-md text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-[#974932] transition-colors duration-300 w-full sm:w-auto"
            >
              Solicitar Precios VIP
            </button>
          </div>
        </div>
      </section>

      {/* MODAL CERRADURA VIP */}
      {mostrarModalVip && (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
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
                  <h3 className="text-2xl font-light text-neutral-900 mb-2 tracking-tight">Solicitud de Precios</h3>
                  <p className="text-xs text-neutral-500 font-light">Validaremos tu perfil para habilitar el acceso seguro a los planos y precios de Etapa 0.</p>
                </div>

                <form onSubmit={procesarSolicitudVIP} className="space-y-4">
                  <div>
                    <input required type="text" placeholder="Nombres Completos" value={formData.nombres} onChange={e => setFormData({...formData, nombres: e.target.value})} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-4 text-sm font-light focus:outline-none focus:border-[#974932] transition-colors" />
                  </div>
                  <div>
                    <input required type="tel" placeholder="WhatsApp (Ej: 0991234567)" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-4 text-sm font-light focus:outline-none focus:border-[#974932] transition-colors" />
                  </div>
                  <div>
                    <input required type="email" placeholder="Correo Electrónico" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-4 text-sm font-light focus:outline-none focus:border-[#974932] transition-colors" />
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={cargando}
                    className="w-full bg-[#974932] text-white py-4 rounded-lg text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-[#7A3A27] transition-colors mt-6 shadow-lg disabled:opacity-70"
                  >
                    {cargando ? 'Procesando...' : 'Enviar Solicitud'}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl shadow-inner">✓</div>
                <h3 className="text-2xl font-light text-neutral-900 mb-3 tracking-tight">Solicitud Recibida</h3>
                <p className="text-sm text-neutral-500 font-light leading-relaxed mb-8">
                  Nuestro equipo comercial validará tu información y te contactará brevemente para entregarte tu pase de acceso exclusivo.
                </p>
                <button 
                  onClick={() => { setMostrarModalVip(false); setSolicitudEnviada(false); }}
                  className="bg-neutral-900 text-white rounded-lg px-8 py-4 text-[11px] font-bold uppercase tracking-widest hover:bg-neutral-800 transition-colors w-full"
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
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-2 md:p-6 backdrop-blur-md animate-in fade-in">
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

      {/* FOOTER - REGRESO AL NEGRO PURO */}
      <footer className="bg-[#111111] text-neutral-500 py-16 text-center text-[11px] md:text-xs">
        <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/arienzo-logo-blanco.svg" alt="Arienzo" className="h-6 mx-auto mb-8 opacity-30" />
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