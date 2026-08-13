'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState('');
  const router = useRouter();

  const manejarLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setErrorMensaje('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        router.refresh();
        setTimeout(() => {
          window.location.href = '/';
        }, 300);
      }
      
    } catch (error: any) {
      console.error(error);
      if (error.message && error.message.includes('Invalid login credentials')) {
        setErrorMensaje('Correo o contraseña incorrectos.');
      } else {
        setErrorMensaje('Ocurrió un error al intentar acceder.');
      }
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F4F4F4] font-sans">
      {/* SECCIÓN IZQUIERDA - BLOQUE DESARROLLO INMOBILIARIO */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#ea0029] flex-col justify-between p-14 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '36px 36px' }}></div>
        
        <div className="relative z-10">
          <span className="text-white font-bold tracking-[0.3em] uppercase text-[10px]">
            Konkeri Developer Group
          </span>
        </div>
        
        <div className="relative z-10 max-w-lg space-y-4">
          <h1 className="text-4xl font-light text-white tracking-tight leading-tight">
            Ecosistema de <br/>
            <span className="font-bold">Desarrollo Inmobiliario</span>
          </h1>
          <p className="text-white/85 text-xs font-light leading-relaxed max-w-md">
            Plataforma corporativa privada para la gestión financiera, comercial y operativa de los proyectos inmobiliarios de la matriz.
          </p>
        </div>

        <div className="relative z-10">
          <p className="text-white/60 text-[9px] font-medium tracking-[0.2em] uppercase">
            © {new Date().getFullYear()} Konkeri S.A.S. Todos los derechos reservados.
          </p>
        </div>
      </div>

      {/* SECCIÓN DERECHA - FORMULARIO DE ACCESO */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-16 relative bg-[#FCFBFA]">
        <div className="w-full max-w-md space-y-8 relative z-10">
          
          <div className="text-center lg:text-left space-y-2">
            <div className="h-10 flex items-center justify-center lg:justify-start mb-8">
              <span className="text-2xl font-black tracking-widest text-neutral-900 uppercase">
                KONKERI
              </span>
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 tracking-tight">Acceso Restringido</h2>
            <p className="text-xs text-neutral-500 font-light">Introduce tus credenciales corporativas para continuar.</p>
          </div>

          <form onSubmit={manejarLogin} className="space-y-5 pt-2">
            {errorMensaje && (
              <div className="bg-red-50 text-[#ea0029] border border-red-100 p-3 rounded-lg text-xs font-semibold text-center">
                {errorMensaje}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Correo Electrónico</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@konkeri.com"
                className="w-full bg-white border border-neutral-200 rounded-lg p-3 text-xs font-medium text-neutral-800 focus:outline-none focus:border-[#ea0029] transition-all shadow-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Contraseña</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-neutral-200 rounded-lg p-3 text-xs font-medium text-neutral-800 focus:outline-none focus:border-[#ea0029] transition-all shadow-xs"
              />
            </div>

            <button 
              type="submit" 
              disabled={cargando}
              className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-[11px] uppercase tracking-[0.2em] py-3.5 rounded-lg transition-all shadow-sm mt-4 disabled:opacity-70 flex justify-center items-center"
            >
              {cargando ? 'Verificando credenciales...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="pt-10 text-center lg:text-left">
            <p className="text-[9px] text-neutral-400 font-light tracking-wide">
              Sistema de uso exclusivo para la gerencia y administración de Konkeri.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}