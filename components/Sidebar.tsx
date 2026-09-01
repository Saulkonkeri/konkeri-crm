'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const menuItems = [
    { name: '⚡ Centro de Operaciones', path: '/' },
    { name: '📊 CRM / Pipeline', path: '/crm' },
    { name: '📄 Cotizador', path: '/cotizador' },
    { name: '📦 Inventario', path: '/inventario' },
    { name: '📡 Radar en Vivo', path: '/radar' }, // <-- AQUÍ ESTÁ EL NUEVO BOTÓN
    { name: '👥 Clientes', path: '/clientes' },
    { name: '🤝 Registrar Operación', path: '/ventas' },
    { name: '📈 Reportes BI', path: '/reportes' },
    { name: '⚙️ Configuración', path: '/config' },
  ];

  return (
    <div className="w-64 bg-[#0A0A0A] text-neutral-300 flex flex-col justify-between h-screen fixed left-0 top-0 border-r border-neutral-800/60 z-30 shadow-2xl">
      
      {/* HEADER / LOGO TIPOGRÁFICO */}
      <div className="px-7 py-8 border-b border-neutral-900/80">
        <div className="flex flex-col">
          <span className="text-[22px] font-light tracking-[0.25em] text-white uppercase block leading-none">
            KONK<span className="font-bold">ERI</span>
          </span>
          <span className="text-[8px] text-[#B94A36] font-bold uppercase tracking-widest block mt-2">
            Developer Group
          </span>
        </div>
      </div>

      {/* NAVEGACIÓN */}
      <div className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg text-xs font-medium tracking-wide transition-all duration-200 ${
                isActive
                  ? 'bg-neutral-900 text-white shadow-sm border border-neutral-800'
                  : 'text-neutral-400 hover:bg-neutral-900/60 hover:text-neutral-200 border border-transparent'
              }`}
            >
              {/* Decorador visual activo (Línea roja) */}
              <div className={`w-1 h-4 rounded-full transition-colors ${isActive ? 'bg-[#B94A36]' : 'bg-transparent'}`} />
              {item.name}
            </Link>
          );
        })}
      </div>

      {/* USUARIO Y CERRAR SESIÓN */}
      <div className="p-5 border-t border-neutral-900 bg-[#0A0A0A] flex flex-col gap-5">
        <div className="flex items-center gap-3 px-1">
          <div className="h-9 w-9 rounded-md bg-gradient-to-br from-neutral-800 to-neutral-900 border border-neutral-700/50 flex items-center justify-center text-xs font-bold text-neutral-300 shadow-inner">
            SI
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-xs font-semibold text-white truncate">Saúl Intriago</p>
            <p className="text-[9px] text-[#B94A36] font-medium tracking-wider uppercase truncate mt-0.5">Admin</p>
          </div>
        </div>
        
        <button 
          onClick={cerrarSesion}
          className="w-full py-2.5 px-3 flex items-center justify-center gap-2 rounded-md text-[10px] font-bold text-neutral-500 hover:text-white hover:bg-red-500/10 hover:border-red-500/20 border border-transparent transition-all uppercase tracking-widest"
        >
          <span>🚪</span> Salir del sistema
        </button>
      </div>
    </div>
  );
}