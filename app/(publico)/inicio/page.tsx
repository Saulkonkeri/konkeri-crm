'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

export default function ArienzoLandingPremium() {
  const [mostrarModalVip, setMostrarModalVip] = useState(false);
  const [mostrarModalCalendly, setMostrarModalCalendly] = useState(false);
  const [imagenIndex, setImagenIndex] = useState<number | null>(null);
  const [cargando, setCargando] = useState(false);
  const [solicitudEnviada, setSolicitudEnviada] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const [formData, setFormData] = useState({
    nombres: '',
    telefono: '',
    email: ''
  });

  // 1. CONTROL DE SCROLL (Ya lo tenías)
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 2. NUEVO: RASTREADOR DE VISITAS PARA EL RADAR
  useEffect(() => {
    const registrarVisitaSilenciosa = async () => {
      try {
        await supabase.from('tracking_inventario').insert([{
          email_cliente: 'Visitante Web',
          accion: 'VISITA_LANDING_PAGE',
          detalle: 'Alguien está explorando la página principal'
        }]);
      } catch (error) {
        // Fallo silencioso para no molestar al usuario
      }
    };
    registrarVisitaSilenciosa();
  }, []);

  const procesarSolicitudVIP = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    const correoLimpio = formData.email.trim().toLowerCase();

    try {
      // 1. Intentar hacer UPSERT
      const { error: errorCliente } = await supabase.from('clientes').upsert([{
        nombres: formData.nombres,
        telefono: formData.telefono,
        email: correoLimpio,
        tipo: 'prospecto',
        origen: 'Web Pública - Solicitud Acceso Exclusivo',
        estado_acceso: 'pendiente'
      }], { onConflict: 'email' });

      if (errorCliente) {
        const { error: updateError } = await supabase.from('clientes')
          .update({ estado_acceso: 'pendiente', nombres: formData.nombres, telefono: formData.telefono })
          .eq('email', correoLimpio);
          
        if (updateError) {
          alert(`🚨 Error en CRM: Supabase bloqueó la actualización del cliente repetido. Detalle: ${updateError.message}`);
        }
      }

      // 2. Guardar en el tracking (Radar)
      await supabase.from('tracking_inventario').insert([{
        email_cliente: correoLimpio,
        accion: 'SOLICITUD_ACCESO_VIP',
        detalle: 'Completó formulario web'
      }]);

      // 3. CARTERO APAGADO TEMPORALMENTE (Para asegurar los leads)
      /*
      const respuesta = await fetch('/api/notificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: "nueva_solicitud_web",
          datos: { nombres: formData.nombres, telefono: formData.telefono, email: correoLimpio }
        })
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        alert(`❌ El CRM guardó los datos, pero Hostinger bloqueó el correo. Motivo: ${errorData.error || respuesta.statusText}`);
      }
      */

      // 4. Pantalla de éxito final
      setSolicitudEnviada(true);
      
    } catch (error) {
      console.error("Error general:", error);
      alert("Hubo un problema grave en la ejecución. Revisa la consola.");
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

  const prevImagen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImagenIndex((prev) => prev !== null ? (prev - 1 + imagenesGaleria.length) % imagenesGaleria.length : null);
  };

  const nextImagen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImagenIndex((prev) => prev !== null ? (prev + 1) % imagenesGaleria.length : null);
  };

  return (
    <div className="min-h-screen bg-[#F9F7F5] text-neutral-800 selection:bg-[#964B36] selection:text-white overflow-x-hidden" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      
      {/* NAVEGACIÓN */}
      <header className={`fixed top-0 w-full z-40 transition-all duration-500 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm py-5 md:py-6' : 'bg-transparent py-6 md:py-8'}`}>
        <div className="max-w-7xl mx-auto px-5 md:px-12 flex justify-between items-center">
          <Image 
            src={scrolled ? "https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/arienzo-logo-terracota.svg" : "https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/arienzo-logo-blanco.svg"} 
            alt="Arienzo Logo"
            width={160}
            height={32}
            className="w-[120px] md:w-[160px] h-auto transition-all duration-500"
          />
          <button 
            onClick={() => setMostrarModalVip(true)}
            className={`text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-3 md:px-6 md:py-3.5 rounded-full transition-all duration-300 ${scrolled ? 'bg-[#964B36] text-white hover:bg-[#7d3e2c] shadow-md' : 'bg-white/20 backdrop-blur-md text-white border border-white/40 hover:bg-white hover:text-[#964B36]'}`}
          >
            Acceso Exclusivo
          </button>
        </div>
      </header>

      {/* 1. HERO INMERSIVO */}
      <section className="relative h-[100vh] min-h-[650px] flex flex-col items-center justify-center">
        <Image 
          src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/render-Exterior-Fronta.jpg" 
          alt="Arienzo Fachada"
          fill
          priority
          className="absolute inset-0 object-cover z-0"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/70 z-0"></div>

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
              className="w-full sm:w-auto bg-[#964B36] text-white px-6 py-3.5 md:px-8 md:py-4 rounded-full text-[10px] md:text-[11px] font-bold uppercase tracking-[0.15em] hover:bg-[#7d3e2c] transition-all duration-300 shadow-xl hover:-translate-y-0.5"
            >
              Agendar Presentación
            </button>
            <button 
              onClick={() => setMostrarModalVip(true)}
              className="w-full sm:w-auto bg-white/10 backdrop-blur-sm border border-white/40 text-white px-6 py-3.5 md:px-8 md:py-4 rounded-full text-[10px] md:text-[11px] font-bold uppercase tracking-[0.15em] hover:bg-white hover:text-[#964B36] transition-all duration-300 hover:-translate-y-0.5"
            >
              Solicitar Acceso
            </button>
          </div>
        </div>
      </section>

      {/* 2. UBICACIÓN */}
      <section className="py-20 md:py-32 px-6 bg-[#F9F7F5] relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px]"></div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
            <div className="md:col-span-5 md:pr-10 z-10 order-2 md:order-1">
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
              <p className="text-sm md:text-base text-neutral-600 font-medium leading-relaxed">
                Diseñado para quienes valoran la conectividad y una vida caminable, donde todo está a tu alcance.
              </p>
            </div>

            <div className="md:col-span-7 relative order-1 md:order-2">
              <div className="absolute -inset-4 bg-[#D1C292]/20 rounded-2xl transform translate-x-4 translate-y-4 hidden md:block"></div>
              <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden shadow-2xl">
                <Image 
                  src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/ubicacion-arienzo-1.jpg" 
                  alt="Ubicación Manta" 
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              
              <div className="absolute -bottom-6 -left-2 md:-left-8 z-20 bg-white/95 backdrop-blur-xl px-5 md:px-6 py-4 rounded-xl shadow-2xl border border-white/50 flex items-center gap-4 hover:scale-105 transition-transform duration-300">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center relative">
                  <span className="w-3 h-3 rounded-full bg-green-500 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></span>
                  <span className="absolute w-3 h-3 rounded-full bg-green-500"></span>
                </div>
                <div>
                  <span className="block text-[9px] md:text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-0.5">Zona Consolidada</span>
                  <span className="block text-sm md:text-base font-bold text-neutral-900 uppercase tracking-wide">Alta Plusvalía</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LA FRANJA TERRACOTA */}
      <div className="relative h-[200px] md:h-[280px] flex justify-center items-center shadow-inner z-20 bg-[#964B36] overflow-hidden">
        <Image 
          src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/familia-en-sala-banco-imagenes-ia.jpg" 
          alt="Familia en Arienzo" 
          fill
          sizes="100vw"
          className="object-cover mix-blend-overlay opacity-30"
        />
        <div className="absolute inset-0 bg-[#964B36]/70"></div>
        <div className="relative z-10 w-[200px] md:w-[300px] h-[60px] md:h-[90px] hover:scale-105 transition-transform duration-700">
          <Image 
            src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/logo-dorado-arienzo.svg" 
            alt="Arienzo Boutique Living" 
            fill
            className="object-contain drop-shadow-2xl" 
          />
        </div>
      </div>

      {/* 3. AMENIDADES */}
      <section className="py-24 md:py-32 px-6 bg-white border-y border-[#EAE3DC] relative overflow-hidden">
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
                <Image src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/Arienzo-Piscina-1.jpg" alt="Piscina" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
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
                <Image src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/render-living-arienzo.jpg" alt="Living" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
              </div>
              <div className="p-8">
                <div className="w-8 h-[2px] bg-[#D1C292] mb-4 transition-all duration-300 group-hover:w-16"></div>
                <h4 className="text-xl font-medium text-neutral-900 mb-3">Social Living & Gym Panorámico</h4>
                <p className="text-sm text-neutral-600 font-medium leading-relaxed">
                  Un ambiente flexible que integra áreas de descanso, coworking y un gimnasio panorámico. Pensado para entrenar, compartir o trabajar de forma remota.
                </p>
              </div>
            </div>

            <div className="group bg-white rounded-2xl overflow-hidden border border-[#EAE3DC] shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2">
              <div className="aspect-[4/3] overflow-hidden relative">
                <Image src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/Arienzo-Plaza-Comercial-1-1.jpg" alt="Comercial" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
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

      {/* 4. TIPOLOGÍAS Y ACABADOS */}
      <section className="py-16 md:py-24 px-6 bg-[#F9F7F5] border-b border-[#EAE3DC] text-center">
        <div className="max-w-3xl mx-auto">
          <span className="text-[11px] font-bold tracking-[0.25em] text-[#964B36] uppercase mb-4 block">Espacios de Autor</span>
          <h3 className="text-3xl md:text-4xl font-medium text-neutral-900 tracking-tight mb-4">
            Formatos exclusivos de 1, 2 y 3 dormitorios.
          </h3>
          <p className="text-sm md:text-base text-neutral-600 font-medium leading-relaxed mb-8">
            Diseño optimizado con acabados de primera, ventanales de piso a techo y una distribución abierta donde la sala, el comedor y la terraza se integran de forma natural.
          </p>
          <button 
            onClick={() => setMostrarModalVip(true)}
            className="inline-flex items-center justify-center gap-3 text-xs font-bold tracking-[0.1em] bg-[#21242E] text-white px-8 py-4 rounded-full hover:bg-[#964B36] transition-colors duration-300 w-full sm:w-auto shadow-md"
          >
            VER DISPONIBILIDAD Y PRECIOS <span className="text-lg">→</span>
          </button>
        </div>
      </section>

      {/* 5. GALERÍA DEL PROYECTO */}
      <section className="py-20 md:py-28 bg-[#21242E] text-center px-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[7rem] md:text-[14rem] font-black text-white/[0.03] whitespace-nowrap pointer-events-none select-none z-0">
          ARQUITECTURA
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <span className="text-[13px] font-bold tracking-[0.25em] text-[#D1C292] uppercase mb-4 block">Galería del Proyecto</span>
          <h3 className="text-3xl md:text-4xl font-medium text-white mb-12 md:mb-16 tracking-tight">Imágenes que hablan por sí solas.</h3>
          
          <div className="flex flex-wrap md:flex-nowrap justify-center gap-3 md:gap-4">
            {imagenesGaleria.map((img, index) => (
              <div 
                key={index} 
                onClick={() => setImagenIndex(index)} 
                className="relative group w-[140px] sm:w-[180px] md:w-full md:flex-1 aspect-[4/3] rounded-md overflow-hidden cursor-pointer shadow-lg bg-[#1a1d24]"
              >
                <Image src={img} alt={`Render ${index + 1}`} fill sizes="(max-width: 768px) 50vw, 20vw" className="object-cover transition-transform duration-500 group-hover:scale-110 opacity-80 group-hover:opacity-100" />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LIGHTBOX MODAL CON NAVEGACIÓN */}
      {imagenIndex !== null && (
        <div className="fixed inset-0 bg-[#21242E]/98 z-[70] flex items-center justify-center p-4 md:p-8 backdrop-blur-md animate-in fade-in" onClick={() => setImagenIndex(null)}>
          <button className="absolute top-6 right-6 text-white/50 hover:text-white text-4xl font-light transition-colors z-50">&times;</button>
          
          <button onClick={prevImagen} className="absolute left-2 md:left-10 text-white/40 hover:text-white text-5xl md:text-7xl p-4 z-50 transition-all hover:scale-110 select-none">
            &#8249;
          </button>

          <div className="relative w-full max-w-5xl h-[80vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <Image 
              src={imagenesGaleria[imagenIndex]} 
              alt="Vista Ampliada" 
              fill
              className="object-contain rounded-md shadow-2xl animate-in zoom-in-95" 
            />
          </div>

          <button onClick={nextImagen} className="absolute right-2 md:right-10 text-white/40 hover:text-white text-5xl md:text-7xl p-4 z-50 transition-all hover:scale-110 select-none">
            &#8250;
          </button>
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
            onClick={() => setMostrarModalVip(true)}
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
              <p className="text-sm text-neutral-400 font-medium leading-relaxed transition-colors group-hover:text-neutral-300">
                Reconocido y premiado estudio quiteño. Autores de grandes proyectos en la capital y de su exclusivo proyecto en la costa, el edificio Serene en Manta, destacando por su visión contemporánea y rigor al detalle.
              </p>
            </div>

            <div className="md:px-8 text-center group border-t border-white/10 md:border-t-0 pt-8 md:pt-0">
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#D1C292] block mb-3">Construcción</span>
              <h4 className="text-lg md:text-xl font-medium text-white mb-4">CARRASCO SUAREZ</h4>
              <p className="text-sm text-neutral-400 font-medium leading-relaxed transition-colors group-hover:text-neutral-300">
                Constructora con sólida trayectoria desde 1992. Amplia experiencia ejecutando obras residenciales premium en la costa ecuatoriana, incluyendo el Hotel Eolia y el moderno edificio Serene en Marina Blue.
              </p>
            </div>

            <div className="md:px-8 text-center group border-t border-white/10 md:border-t-0 pt-8 md:pt-0">
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#D1C292] block mb-3">Desarrollo y Ventas</span>
              <h4 className="text-lg md:text-xl font-medium text-white mb-4">KONKERI</h4>
              <p className="text-sm text-neutral-400 font-medium leading-relaxed transition-colors group-hover:text-neutral-300">
                Promotora enfocada en el desarrollo integral de proyectos con visión a largo plazo. Fusionamos estrategia comercial, innovación arquitectónica y tecnología para estructurar desarrollos altamente rentables y alineados al mercado.
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
            El privilegeo de pertenecer está limitado. Solicita tu acceso para descubrir precios, tipologías y disponibilidad en tiempo real.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 w-full sm:w-auto">
            <button 
              onClick={abrirCalendly}
              className="bg-[#964B36] text-white px-10 py-4 rounded-full text-[11px] font-bold uppercase tracking-[0.15em] hover:bg-[#7d3e2c] transition-all duration-300 hover:-translate-y-1 shadow-xl w-full sm:w-auto"
            >
              Agendar Presentación
            </button>
            <button 
              onClick={() => setMostrarModalVip(true)}
              className="bg-[#21242E] text-white px-10 py-4 rounded-full text-[11px] font-bold uppercase tracking-[0.15em] hover:bg-black transition-all duration-300 hover:-translate-y-1 shadow-xl w-full sm:w-auto"
            >
              Solicitar Acceso Exclusivo
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
                  <div className="w-12 h-1 bg-[#964B36] mx-auto mb-6 rounded-full"></div>
                  <h3 className="text-2xl font-medium text-neutral-900 mb-2 tracking-tight">Acceso al Inventario</h3>
                  <p className="text-xs text-neutral-500 font-medium">Validaremos tu perfil para habilitar el acceso seguro a los <strong>planos arquitectónicos, disponibilidad en tiempo real y precios de lanzamiento.</strong></p>
                </div>

                <form onSubmit={procesarSolicitudVIP} className="space-y-4">
                  <div>
                    <input required type="text" placeholder="Nombres Completos" value={formData.nombres} onChange={e => setFormData({...formData, nombres: e.target.value})} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm font-medium focus:outline-none focus:border-[#964B36] transition-colors" />
                  </div>
                  <div>
                    <input required type="tel" placeholder="WhatsApp (Ej: 0991234567)" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm font-medium focus:outline-none focus:border-[#964B36] transition-colors" />
                  </div>
                  <div>
                    <input required type="email" placeholder="Correo Electrónico" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm font-medium focus:outline-none focus:border-[#964B36] transition-colors" />
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={cargando}
                    className="w-full bg-[#964B36] text-white py-4 rounded-xl text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-[#7d3e2c] transition-all mt-4 shadow-lg disabled:opacity-70"
                  >
                    {cargando ? 'Procesando...' : 'Acceder al Inventario'}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl shadow-inner">✓</div>
                <h3 className="text-2xl font-medium text-neutral-900 mb-3 tracking-tight">Solicitud Recibida</h3>
                <p className="text-sm text-neutral-500 font-medium leading-relaxed mb-8">
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
      <footer className="bg-[#21242E] text-neutral-400 py-8 border-t border-[#D1C292]/30">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="text-xs font-medium tracking-wide text-center md:text-left order-1 md:order-1">
            Un proyecto de <a href="https://konkeri.com" target="_blank" rel="noopener noreferrer" className="text-[#D1C292] hover:text-white transition-colors font-bold tracking-widest ml-1">KONKERI</a>
          </div>
          <div className="flex justify-center order-2 md:order-2">
            <Image 
              src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/logo-dorado-arienzo.svg" 
              alt="Arienzo" 
              width={180}
              height={45}
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