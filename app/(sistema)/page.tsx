'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface TareaHoy {
  id: string;
  nombres: string;
  apellidos: string;
  tipo_accion: string;
  detalle_accion: string;
  telefono: string;
  temperatura: string;
}

export default function CentroOperacionesPage() {
  const [totalLeads, setTotalLeads] = useState(0);
  const [leadsCalientes, setLeadsCalientes] = useState(0);
  const [tareasHoy, setTareasHoy] = useState<TareaHoy[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarDatosDashboard();
  }, []);

  const cargarDatosDashboard = async () => {
    try {
      const { data: clientesActivos, error: errorClientes } = await supabase
        .from('clientes')
        .select('*')
        .neq('estado', 'Descartado');

      if (errorClientes) throw errorClientes;

      if (clientesActivos) {
        setTotalLeads(clientesActivos.length);
        const calientes = clientesActivos.filter(c => c.temperatura?.includes('Caliente')).length;
        setLeadsCalientes(calientes);

        const fechaHoy = new Date();
        fechaHoy.setHours(0, 0, 0, 0);

        const agendaHoy = clientesActivos.filter(c => {
          if (!c.proximo_contacto) return false;
          const fechaContacto = new Date(c.proximo_contacto + 'T00:00:00');
          return fechaContacto.getTime() === fechaHoy.getTime();
        });

        setTareasHoy(agendaHoy);
      }
    } catch (error) {
      console.error('Error cargando el dashboard:', error);
    } finally {
      setCargando(false);
    }
  };

  if (cargando) {
    return (
      <div className="flex h-full items-center justify-center bg-[#dce3eb]">
        <p className="text-sm font-bold tracking-widest text-[#ea0029] uppercase animate-pulse">Iniciando Sistema...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 font-sans text-[#415364] w-full max-w-7xl mx-auto">
      
      {/* ENCABEZADO EJECUTIVO */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#415364]">Panel Comercial</h1>
        <p className="text-sm text-[#415364]/70 mt-1">Resumen del embudo de ventas y operaciones de Arienzo.</p>
      </div>

      {/* MÉTRICAS PRINCIPALES (TARJETAS MODERNAS) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Tarjeta 1 */}
        <div className="bg-white rounded-2xl border border-neutral-200/60 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#415364]"></div>
          <p className="text-[11px] font-bold text-[#415364]/50 uppercase tracking-widest mb-1">Total Prospectos Activos</p>
          <p className="text-5xl font-light text-[#415364]">{totalLeads}</p>
          <div className="absolute bottom-4 right-4 bg-[#dce3eb]/50 rounded-full p-2 text-[#415364] opacity-50 group-hover:scale-110 transition-transform">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
          </div>
        </div>

        {/* Tarjeta 2 (Destacada) */}
        <div className="bg-white rounded-2xl border border-neutral-200/60 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#ea0029]"></div>
          <p className="text-[11px] font-bold text-[#ea0029] uppercase tracking-widest mb-1 flex items-center gap-1">
            Prospectos Calientes 
            <span className="text-sm">🔥</span>
          </p>
          <p className="text-5xl font-bold text-[#415364]">{leadsCalientes}</p>
          <div className="absolute bottom-4 right-4 bg-[#ea0029]/10 rounded-full p-2 text-[#ea0029] opacity-50 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          </div>
        </div>

        {/* Tarjeta 3 */}
        <div className="bg-[#21242E] rounded-2xl border border-neutral-800 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <p className="text-[11px] font-bold text-white/50 uppercase tracking-widest mb-1">Inventario Total</p>
          <div className="flex items-baseline gap-2">
            <p className="text-5xl font-light text-white">22</p>
            <p className="text-xs text-white/40 font-medium">Unidades</p>
          </div>
          <div className="absolute bottom-4 right-4 bg-white/5 rounded-full p-2 text-white opacity-20 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* AGENDA DEL DÍA (Ocupa 2 columnas) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-neutral-200/60 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-neutral-100 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-[#415364]">Agenda Estratégica</h2>
              <p className="text-xs text-[#415364]/60 mt-0.5">Contactos programados para hoy.</p>
            </div>
            <div className="bg-[#ea0029]/10 text-[#ea0029] text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
              {tareasHoy.length} Pendientes
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto bg-neutral-50/50">
            {tareasHoy.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center h-full">
                <svg className="w-12 h-12 text-neutral-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                <p className="text-sm font-medium text-neutral-400">Día despejado. No hay tareas agendadas.</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {tareasHoy.map((tarea) => (
                  <div key={tarea.id} className="p-5 hover:bg-white transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="bg-[#415364] text-white text-[9px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-widest">
                          {tarea.tipo_accion}
                        </span>
                        {tarea.temperatura && (
                          <span className={`text-[10px] font-bold ${tarea.temperatura.includes('Caliente') ? 'text-[#ea0029]' : 'text-neutral-500'}`}>
                            {tarea.temperatura}
                          </span>
                        )}
                      </div>
                      <h3 className="text-[15px] font-bold text-[#415364]">{tarea.nombres} {tarea.apellidos}</h3>
                      <p className="text-xs text-[#415364]/70 mt-1 max-w-md line-clamp-1">{tarea.detalle_accion || 'Sin detalles adicionales.'}</p>
                    </div>
                    
                    <Link href="/crm" className="px-4 py-2 bg-white border border-neutral-200 text-[#415364] rounded-lg text-[11px] font-bold uppercase tracking-wider hover:border-[#ea0029] hover:text-[#ea0029] transition-colors shadow-sm text-center flex-shrink-0">
                      Gestionar
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ACCESOS RÁPIDOS (Ocupa 1 columna) */}
        <div className="flex flex-col gap-4">
          <div className="bg-[#415364] rounded-2xl p-6 shadow-md text-white">
             <h2 className="text-sm font-bold tracking-widest uppercase mb-6 opacity-80">Accesos Directos</h2>
             
             <Link href="/crm" className="group flex items-center justify-between p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-all cursor-pointer mb-3 border border-white/5">
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-white transition-colors">Radar de Leads</h3>
                <p className="text-[10px] text-white/60 mt-1">Gestiona prospectos y seguimientos.</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-[#ea0029] transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </div>
            </Link>

            <Link href="/cotizador" className="group flex items-center justify-between p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-all cursor-pointer border border-white/5">
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-white transition-colors">Cotizador</h3>
                <p className="text-[10px] text-white/60 mt-1">Calculadora de planes de pago.</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-[#ea0029] transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              </div>
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}