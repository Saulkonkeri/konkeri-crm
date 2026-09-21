import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import ClientLayout from "./ClientLayout"; 

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Konkeri - Gestión Comercial",
  description: "Sistema interno de gestión inmobiliaria",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#dce3eb] text-[#415364] flex h-screen overflow-hidden`}>
        {/* BARRA LATERAL (SIDEBAR) ESTILO KONKERI */}
        <aside className="w-64 bg-[#21242E] text-white flex-shrink-0 hidden md:flex flex-col shadow-2xl z-20">
          <div className="p-6 border-b border-white/10 flex items-center justify-center">
             <img 
              src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/logo-dorado-arienzo.svg" 
              alt="Konkeri Logo" 
              className="h-10 w-auto opacity-90"
            />
          </div>
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <a href="/" className="flex items-center gap-3 px-4 py-3 bg-[#ea0029] text-white rounded-lg font-medium shadow-md transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
              Dashboard
            </a>
            <a href="/crm" className="flex items-center gap-3 px-4 py-3 text-[#dce3eb] hover:bg-white/5 hover:text-white rounded-lg font-medium transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
              Radar (Leads)
            </a>
            <a href="/cotizador" className="flex items-center gap-3 px-4 py-3 text-[#dce3eb] hover:bg-white/5 hover:text-white rounded-lg font-medium transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              Inventario & Coti.
            </a>
          </nav>
          <div className="p-4 border-t border-white/10 text-center">
            <span className="text-[10px] text-white/50 uppercase tracking-widest">Powered by Konkeri</span>
          </div>
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#dce3eb]">
          {/* Header Móvil */}
          <header className="md:hidden bg-[#21242E] text-white p-4 flex justify-between items-center shadow-md z-20">
             <img 
              src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/logo-dorado-arienzo.svg" 
              alt="Konkeri Logo" 
              className="h-6 w-auto"
            />
            <button className="text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
          </header>
          
          <div className="flex-1 overflow-y-auto">
            <ClientLayout>
              {children}
            </ClientLayout>
          </div>
        </main>
      </body>
    </html>
  );
}