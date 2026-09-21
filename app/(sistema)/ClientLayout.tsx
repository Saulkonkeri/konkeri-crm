'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Lista de menús basada en tu estructura, ahora con SVGs premium en lugar de emojis
  const menuItems = [
    { 
      name: 'Centro de Operaciones', 
      path: '/inicio', 
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    },
    { 
      name: 'CRM / Pipeline', 
      path: '/crm', 
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    },
    { 
      name: 'Cotizador', 
      path: '/cotizador', 
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    },
    { 
      name: 'Inventario', 
      path: '/inventario', 
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    },
    { 
      name: 'Radar en Vivo', 
      path: '/radar', 
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    },
    { 
      name: 'Clientes', 
      path: '/clientes', 
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    },
    { 
      name: 'Registrar Operación', 
      path: '/registrar', 
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    },
    { 
      name: 'Reportes BI', 
      path: '/reportes', 
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    },
    { 
      name: 'Configuración', 
      path: '/configuracion', 
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    }
  ];

  return (
    <div className="flex h-screen bg-[#dce3eb] overflow-hidden font-sans">
      
      {/* SIDEBAR CORPORATIVO KONKERI */}
      <aside className="w-[260px] bg-[#1a1c23] text-white flex-shrink-0 hidden md:flex flex-col border-r border-[#415364]/20 shadow-2xl relative z-20">
        
        {/* LOGO AREA */}
        <div className="p-8 pb-4 flex flex-col">
          <h1 className="text-2xl font-bold tracking-widest text-white mb-1">KONKERI</h1>
          <span className="text-[9px] font-medium tracking-[0.2em] text-[#ea0029] uppercase">Developer Group</span>
        </div>

        {/* NAVEGACIÓN */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = pathname === item.path || (pathname === '/' && item.path === '/inicio');
            
            return (
              <Link 
                key={item.path} 
                href={item.path}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-transparent border border-[#ea0029] text-white' 
                    : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {/* Indicador de activo a la izquierda (la barrita roja) */}
                {isActive && (
                  <div className="absolute left-4 w-1 h-5 bg-[#ea0029] rounded-r-full shadow-[0_0_8px_rgba(234,0,41,0.6)]"></div>
                )}
                
                <svg 
                  className={`w-4 h-4 transition-colors ${isActive ? 'text-[#ea0029]' : 'text-neutral-500 group-hover:text-white'}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  {item.icon}
                </svg>
                <span className={`text-[13px] tracking-wide ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* PERFIL DE USUARIO / BOTTOM AREA */}
        <div className="p-4 border-t border-white/10 mt-auto bg-[#14151a]">
          <div className="flex items-center gap-3 px-2 py-2 mb-3">
            <div className="w-10 h-10 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
              SI
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-white truncate">Saúl Intriago</span>
              <span className="text-[9px] font-bold text-[#ea0029] uppercase tracking-widest">Admin</span>
            </div>
          </div>
          
          <button className="w-full flex items-center gap-3 px-4 py-2.5 text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-[11px] font-bold uppercase tracking-wider">
            <div className="w-2 h-2 bg-[#ea0029] rounded-sm"></div>
            Salir del Sistema
          </button>
        </div>

      </aside>

      {/* ÁREA DE CONTENIDO PRINCIPAL */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Header Móvil (Solo visible en pantallas pequeñas) */}
        <header className="md:hidden bg-[#1a1c23] text-white p-4 flex justify-between items-center shadow-md sticky top-0 z-30">
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-widest leading-none">KONKERI</span>
            <span className="text-[8px] tracking-[0.2em] text-[#ea0029]">CRM MOBILE</span>
          </div>
          <button className="text-white p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          </button>
        </header>
        
        {/* Aquí se inyectan tus páginas (Dashboard, Clientes, etc.) */}
        <div className="flex-1 relative z-10">
          {children}
        </div>
      </main>

    </div>
  );
}