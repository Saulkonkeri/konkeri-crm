'use client';

import Image from 'next/image';

export default function VallaObraArienzo() {
  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-center p-4 md:p-10" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      
      <div className="text-center mb-8 text-white">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">Simulador de Valla Monumental</h2>
        <p className="text-[#D1C292] font-bold tracking-widest text-sm md:text-base mb-1">
          MEDIDAS REALES: 24m de largo x 2.6m de alto
        </p>
        <p className="text-neutral-400 text-xs md:text-sm">
          Ábrelo en pantalla completa. El diseño escala de forma paramétrica según la altura (cqh).
        </p>
      </div>

      {/* CONTENEDOR PRINCIPAL DE LA VALLA 24 x 2.6 */}
      {/* Aspect ratio exacto: 24 / 2.6 */}
      <div 
        style={{ containerType: 'size' }} 
        className="w-full max-w-[2000px] aspect-[24/2.6] bg-[#964B36] relative overflow-hidden flex flex-col rounded-sm shadow-[0_30px_60px_rgba(0,0,0,0.8)] border-[3px] border-black/30"
      >
        
        {/* 1. SECCIÓN DERECHA: RENDER DE FACHADA (Toma el 60% del espacio visual por ser tan larga) */}
        <div className="absolute right-0 top-0 bottom-[16%] w-[60%] z-0">
          {/* Degradado más suave para fusionar los 24 metros */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#964B36] via-[#964B36]/80 to-transparent z-10 w-[50%]"></div>
          {/* Sombra inferior para separar la franja oscura */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#21242E] to-transparent opacity-50 z-10 h-full"></div>
          
          <Image 
            src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/render-Exterior-Fronta.jpg" 
            alt="Render Fachada Arienzo" 
            fill
            quality={100}
            className="object-cover object-[center_35%]"
            unoptimized
          />
        </div>

        {/* 2. SECCIÓN IZQUIERDA: TEXTOS PRINCIPALES */}
        <div className="relative z-20 flex-1 flex flex-col justify-center px-[4%] w-[45%] mb-[3%]">
          
          {/* LOGO ARIENZO (Basado en la altura para no deformarse) */}
          <div style={{ width: '85cqh', marginBottom: '8cqh' }}>
            <Image 
              src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/arienzo-logo-blanco.svg" 
              alt="Arienzo Logo" 
              width={500} 
              height={150} 
              className="w-full h-auto drop-shadow-2xl"
            />
          </div>

          {/* TEXTO DE IMPACTO */}
          <div>
            <h1 
              style={{ fontSize: '18cqh' }} 
              className="text-white font-black uppercase tracking-[0.1em] drop-shadow-2xl leading-none"
            >
              Próximamente
            </h1>
            
            <div 
              style={{ width: '40cqh', height: '1.2cqh', marginTop: '5cqh', marginBottom: '5cqh' }} 
              className="bg-[#D1C292] shadow-md"
            ></div>
            
            <h2 
              style={{ fontSize: '8.5cqh' }} 
              className="text-white/95 font-medium tracking-wide drop-shadow-md leading-snug"
            >
              Departamentos exclusivos de <br/>
              <strong className="text-white font-bold">1, 2 y 3 dormitorios.</strong>
            </h2>
          </div>

        </div>

        {/* 3. FRANJA INFERIOR OSCURA (CONTACTO Y RESPALDO) */}
        {/* Altura del 16% de la valla */}
        <div className="absolute bottom-0 w-full h-[16%] bg-[#21242E] z-30 flex items-center justify-between px-[4%] border-t-[0.8cqh] border-[#D1C292]">
          
          {/* SITIO WEB */}
          <div 
            style={{ fontSize: '5.5cqh' }} 
            className="text-white font-bold uppercase tracking-[0.15em] drop-shadow-md"
          >
            arienzoliving.com
          </div>

          {/* WHATSAPP */}
          <div 
            style={{ fontSize: '6cqh' }} 
            className="flex items-center text-white font-bold tracking-wider drop-shadow-md"
          >
            <svg 
              style={{ width: '7cqh', height: '7cqh', marginRight: '2cqh' }} 
              className="text-[#25D366]" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
            </svg>
            097 946 9472
          </div>

          {/* LOGOS DE RESPALDO (A la derecha) */}
          <div className="flex items-center" style={{ gap: '6cqh' }}>
            <div className="text-center">
              <span style={{ fontSize: '2.5cqh', marginBottom: '0.5cqh' }} className="block text-[#D1C292] uppercase tracking-[0.2em] font-bold">
                Desarrolla
              </span>
              <span style={{ fontSize: '4.5cqh' }} className="block text-white font-bold tracking-[0.15em]">
                KONKERI
              </span>
            </div>
            <div style={{ width: '2px', height: '8cqh' }} className="bg-white/20"></div>
            <div className="text-center">
              <span style={{ fontSize: '2.5cqh', marginBottom: '0.5cqh' }} className="block text-[#D1C292] uppercase tracking-[0.2em] font-bold">
                Arquitectura
              </span>
              <span style={{ fontSize: '4.5cqh' }} className="block text-white font-bold tracking-[0.15em]">
                DIEZ+MULLER
              </span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}