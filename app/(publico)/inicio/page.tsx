import type { Metadata } from 'next';
import Script from 'next/script';
import "../globals.css"; // Aseguramos que Tailwind cargue bien

// 1. SEO y OPEN GRAPH exclusivo para la Landing Page
export const metadata: Metadata = {
  title: 'Arienzo Boutique Living | Departamentos Exclusivos en Manta',
  description: 'Colección exclusiva de solo 22 departamentos de 1, 2 y 3 dormitorios en Barbasquillo, Manta. Diseño de autor, alta plusvalía e inversión estratégica en planos.',
  keywords: 'Arienzo, departamentos Manta, Barbasquillo, inmobiliaria Manta, Konkeri, Diez Muller, inversión inmobiliaria Ecuador, bienes raíces lujo Manta',
  openGraph: {
    title: 'Arienzo Boutique Living | Lanzamiento en Planos',
    description: 'Sé uno de los 22 propietarios. Departamentos exclusivos en la zona de mayor plusvalía de Manta (Barbasquillo).',
    url: 'https://arienzoliving.com',
    siteName: 'Arienzo Boutique Living',
    images: [
      {
        url: 'https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/render-Exterior-Fronta.jpg',
        width: 1200,
        height: 630,
        alt: 'Fachada Arienzo Boutique Living Manta',
      },
    ],
    locale: 'es_EC',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  }
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased bg-[#F9F7F5]">
        
        {/* 2. PIXEL DE META - FORZADO PARA NEXT.JS */}
        <Script 
          id="meta-pixel" 
          strategy="afterInteractive" 
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '1698482924903057');
              fbq('track', 'PageView');
            `
          }}
        />
        
        {/* Carga visual de tu página de inicio */}
        {children}
      </body>
    </html>
  );
}