'use client';

import Image from 'next/image';

export default function VallaObraArienzo() {
  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-center p-4 md:p-8" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      
      <div className="text-center mb-6 text-white">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">Valla Monumental: Diseño Premium</h2>
        <p className="text-[#D1C292] font-bold tracking-widest text-sm md:text-base mb-1">
          ESCALA REAL: 24.00m x 2.60m
        </p>
        <p className="text-neutral-400 text-xs md:text-sm">
          Abre tu navegador a pantalla completa. Diseño optimizado para lectura a 60 km/h.
        </p>
      </div>

      {/* CONTENEDOR PRINCIPAL - PROPORCIÓN MATEMÁTICA EXACTA 24:2.6 */}
      <div 
        style={{ aspectRatio: '24 / 2.6', containerType: 'size' }} 
        className="w-full max-w-[2400px] bg-[#21242E] relative overflow-hidden flex flex-col shadow-[0_40px_80px_rgba(0,0,0,0.9)] border-4 border-black/50"
      >
        
        {/* 1. EL RENDER GIGANTE (Fondo panorámico) */}
        <div className="absolute right-0 top-0 h-full w-[80%] z-0">
          {/* Degradado oscuro profundo que va de negro a transparente para fundir la imagen */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#21242E] via-[#21242E]/90 to-transparent z-10 w-[60%]"></div>
          
          <Image 
            src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/render-Exterior-Fronta.jpg" 
            alt="Fachada Arienzo" 
            fill
            quality={100}
            className="object-cover object-[center_35%]"
            unoptimized
          />
        </div>

        {/* 2. TEXTOS DE ALTO IMPACTO (Lado Izquierdo) */}
        {/* Usamos cqh (Container Query Height) para que las letras sean inmensas y escalen perfecto */}
        <div className="relative z-20 flex-1 flex flex-col justify-center px-[4cqw] pt-[2cqh]">
          
          {/* LOGO EN DORADO (Resalta espectacular sobre el fondo oscuro) */}
          <div style={{ height: '24cqh', marginBottom: '8cqh' }}>
            <Image 
              src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/logo-dorado-arienzo.svg" 
              alt="Arienzo Logo" 
              width={800} 
              height={200} 
              className="h-full w-auto drop-shadow-2xl"
            />
          </div>

          <div>
            {/* TAGLINE: Qué es y dónde es */}
            <span 
              style={{ fontSize: '7cqh', marginBottom: '2cqh' }} 
              className="block text-[#D1C292] font-bold tracking-[0.3em] uppercase drop-shadow-md"
            >
              Barbasquillo, Manta
            </span>

            {/* CALL TO ACTION PRINCIPAL */}
            <h1 
              style={{ fontSize: '15cqh' }} 
              className="text-white font-black uppercase tracking-[0.05em] drop-shadow-2xl leading-none mb-[3cqh]"
            >
              Lanzamiento en Planos
            </h1>
            
            {/* CARACTERÍSTICA ESTRELLA */}
            <h2 
              style={{ fontSize: '9cqh' }} 
              className="text-neutral-300 font-medium tracking-wide drop-shadow-md"
            >
              Colección exclusiva de <strong className="text-white font-bold">22 residencias.</strong>
            </h2>
          </div>

        </div>

        {/* 3. ZÓCALO INFERIOR (La base que sostiene el diseño) */}
        <div 
          style={{ height: '20cqh' }}
          className="absolute bottom-0 left-0 w-full bg-[#964B36] z-30 flex items-center justify-between px-[4cqw] shadow-inner"
        >
          
          {/* SITIO WEB */}
          <div 
            style={{ fontSize: '7cqh' }} 
            className="text-white font-bold uppercase tracking-[0.2em] drop-shadow-md"
          >
            arienzoliving.com
          </div>

          {/* CONTACTO (WhatsApp) */}
          <div 
            style={{ fontSize: '8cqh' }} 
            className="flex items-center text-white font-bold tracking-widest drop-shadow-md"
          >
            <svg 
              style={{ width: '8cqh', height: '8cqh', marginRight: '2cqh' }} 
              className="text-[#25D366]" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
            </svg>
            097 946 9472
          </div>

          {/* FIRMAS INSTITUCIONALES (Respaldo) */}
          <div className="flex items-center" style={{ gap: '4cqw' }}>
            
            {/* Konkeri */}
            <div className="flex flex-col items-end justify-center">
              <span style={{ fontSize: '3.5cqh', marginBottom: '0.5cqh' }} className="text-[#D1C292] uppercase tracking-[0.25em] font-bold">
                Desarrolla
              </span>
              <span style={{ fontSize: '5.5cqh' }} className="text-white font-bold tracking-[0.2em] leading-none">
                KONKERI
              </span>
            </div>
            
            {/* Separador */}
            <div style={{ width: '2px', height: '10cqh' }} className="bg-white/30 rounded-full"></div>
            
            {/* Diez+Muller */}
            <div className="flex flex-col items-start justify-center">
              <span style={{ fontSize: '3.5cqh', marginBottom: '0.5cqh' }} className="text-[#D1C292] uppercase tracking-[0.25em] font-bold">
                Arquitectura
              </span>
              <span style={{ fontSize: '5.5cqh' }} className="text-white font-bold tracking-[0.2em] leading-none">
                DIEZ+MULLER
              </span>
            </div>

            {/* Separador */}
            <div style={{ width: '2px', height: '10cqh' }} className="bg-white/30 rounded-full hidden lg:block"></div>

            {/* Carrasco */}
            <div className="flex flex-col items-start justify-center hidden lg:flex">
              <span style={{ fontSize: '3.5cqh', marginBottom: '0.5cqh' }} className="text-[#D1C292] uppercase tracking-[0.25em] font-bold">
                Construye
              </span>
              <span style={{ fontSize: '5.5cqh' }} className="text-white font-bold tracking-[0.2em] leading-none">
                CARRASCO
              </span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}