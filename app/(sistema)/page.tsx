'use client';

import { useEffect, useState, useMemo } from 'react';
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
  proximo_contacto: string;
}

interface ActividadReciente {
  id: string;
  accion: string;
  detalle: string;
  created_at: string;
  email_cliente: string;
  nombres?: string;
}

export default function CentroOperacionesPage() {
  const [totalLeads, setTotalLeads] = useState(0);
  const [leadsCalientes, setLeadsCalientes] = useState(0);
  const [tareasHoy, setTareasHoy] = useState<TareaHoy[]>([]);
  const [actividadReciente, setActividadReciente] = useState<ActividadReciente[]>([]);
  const [cargando, setCargando] = useState(true);

  // Estados para métricas financieras y de absorción
  const [montoCotizadoMes, setMontoCotizadoMes] = useState(0);
  const [inventarioDisponible, setInventarioDisponible] = useState(0);
  const [inventarioColocado, setInventarioColocado] = useState(0);

  useEffect(() => {
    cargarDatosDashboard();
  }, []);

  const cargarDatosDashboard = async () => {
    try {
      // 1. CARGA DE CLIENTES Y TAREAS
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

        const agendaHoyYVencida = clientesActivos.filter(c => {
          if (!c.proximo_contacto) return false;
          const fechaContacto = new Date(c.proximo_contacto + 'T00:00:00');
          // Incluimos tareas de hoy y tareas vencidas
          return fechaContacto.getTime() <= fechaHoy.getTime();
        }).sort((a, b) => new Date(a.proximo_contacto).getTime() - new Date(b.proximo_contacto).getTime());

        setTareasHoy(agendaHoyYVencida);
      }

      // 2. CARGA DE COTIZACIONES DEL MES
      const fechaInicioMes = new Date();
      fechaInicioMes.setDate(1);
      fechaInicioMes.setHours(0,0,0,0);
      
      const { data: cotizacionesMes } = await supabase
        .from('cotizaciones')
        .select('precio_total')
        .gte('created_at', fechaInicioMes.toISOString());
        
      if (cotizacionesMes) {
        const monto = cotizacionesMes.reduce((acc, cot) => acc + (Number(cot.precio_total) || 0), 0);
        setMontoCotizadoMes(monto);
      }

      // 3. CARGA DE INVENTARIO
      const { data: propiedades } = await supabase
        .from('propiedades')
        .select('estado');
        
      if (propiedades) {
        const libres = propiedades.filter(p => p.estado === 'Disponible').length;
        const colocadas = propiedades.filter(p => p.estado === 'Reservado' || p.estado === 'Vendido').length;
        setInventarioDisponible(libres);
        setInventarioColocado(colocadas);
      }

      // 4. CARGA DE ACTIVIDAD RECIENTE (Mini Radar)
      const accionesValiosas = ['DESCARGA_BROCHURE', 'CLIC_WHATSAPP', 'INICIO_COTIZACION', 'REGISTRO_COMPLETADO', 'USO_FILTRO', 'CLIC_DISPONIBILIDAD'];
      const { data: trackData } = await supabase
        .from('tracking_inventario')
        .select('*')
        .in('accion', accionesValiosas)
        .order('created_at', { ascending: false })
        .limit(20);

      if (trackData && trackData.length > 0) {
        // Enriquecer con nombres si los hay
        const emails = Array.from(new Set(trackData.map(t => t.email_cliente).filter(e => e && e.includes('@'))));
        let lookup: Record<string, string> = {};
        if (emails.length > 0) {
          const { data: cData } = await supabase.from('clientes').select('email, nombres, apellidos').in('email', emails);
          cData?.forEach(c => lookup[c.email.toLowerCase()] = `${c.nombres} ${c.apellidos || ''}`.trim());
        }

        const actividadesConNombre = trackData.map(t => ({
          ...t,
          nombres: t.email_cliente ? lookup[t.email_cliente.toLowerCase()] : 'Anónimo'
        }));
        
        // Filtramos duplicados rápidos
        const actUnicas = actividadesConNombre.filter((v,i,a) => a.findIndex(t => (t.email_cliente === v.email_cliente && t.accion === v.accion)) === i).slice(0, 5);
        setActividadReciente(actUnicas);
      }

    } catch (error) {
      console.error('Error cargando el dashboard:', error);
    } finally {
      setCargando(false);
    }
  };

  const formatTiempoAtras = (fechaStr: string) => {
    const fecha = new Date(fechaStr);
    const diffMs = new Date().getTime() - fecha.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMin / 60);

    if (diffMin < 1) return 'Ahora';
    if (diffMin < 60) return `${diffMin}m`;
    if (diffHrs < 24) return `${diffHrs}h`;
    return 'Ayer';
  };

  if (cargando) {
    return (
      <div className="flex h-full items-center justify-center bg-[#dce3eb]">
        <div className="flex flex-col items-center gap-3">
          <svg className="w-8 h-8 text-[#ea0029] animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          <p className="text-[10px] font-bold tracking-widest text-[#415364] uppercase animate-pulse">Iniciando Centro de Operaciones...</p>
        </div>
      </div>
    );
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  return (
    <div className="p-4 md:p-8 font-sans text-[#415364] w-full max-w-7xl mx-auto min-h-[calc(100vh-2rem)] flex flex-col">
      
      {/* ENCABEZADO EJECUTIVO */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#415364]/10 pb-6">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-[#ea0029] uppercase">Konkeri Developer Group</span>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#415364] mt-1">Torre de Control</h1>
          <p className="text-sm text-[#415364]/70 mt-1 font-medium">Resumen ejecutivo, operaciones en caliente y tareas prioritarias.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-white border border-[#415364]/10 text-[#415364] text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-lg shadow-sm">
            {new Date().toLocaleDateString('es-EC', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
          <button onClick={cargarDatosDashboard} className="bg-[#21242E] text-white p-2 rounded-lg hover:bg-black transition-colors shadow-sm" title="Refrescar Datos">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
        </div>
      </div>

      {/* MÉTRICAS PRINCIPALES (TARJETAS MODERNAS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        
        {/* Tarjeta 1: Leads Activos */}
        <div className="bg-white rounded-2xl border border-neutral-200/60 p-6 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group hover:-translate-y-1">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#415364] transition-all group-hover:w-1.5"></div>
          <p className="text-[10px] font-bold text-[#415364]/50 uppercase tracking-widest mb-1">Base CRM Activa</p>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-light text-[#415364]">{totalLeads}</p>
            <p className="text-[10px] text-[#415364]/40 font-bold uppercase tracking-widest">Prospectos</p>
          </div>
          <div className="absolute bottom-4 right-4 text-[#415364] opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4a4 4 0 100 8 4 4 0 000-8zM6 8a6 6 0 1112 0A6 6 0 016 8zm2 10a4 4 0 118 0v1h-8v-1z" /></svg>
          </div>
        </div>

        {/* Tarjeta 2: Termómetro (Destacada) */}
        <div className="bg-[#FDFCFB] rounded-2xl border border-[#ea0029]/20 p-6 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group hover:-translate-y-1">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#ea0029] transition-all group-hover:w-1.5"></div>
          <p className="text-[10px] font-bold text-[#ea0029] uppercase tracking-widest mb-1 flex items-center gap-1.5">
            Interés Alto <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-bold text-[#ea0029]">{leadsCalientes}</p>
            <p className="text-[10px] text-[#ea0029]/60 font-bold uppercase tracking-widest">Negociaciones</p>
          </div>
        </div>

        {/* Tarjeta 3: Dinero en Mesa */}
        <div className="bg-white rounded-2xl border border-neutral-200/60 p-6 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group hover:-translate-y-1">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 transition-all group-hover:w-1.5"></div>
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Cotizado (Mes)</p>
          <div className="flex items-baseline gap-1">
            <p className="text-2xl font-bold text-[#415364] font-mono">{"\$"}{(montoCotizadoMes / 1000).toFixed(1)}k</p>
          </div>
          <p className="text-[9px] text-[#415364]/40 font-bold uppercase tracking-widest mt-1">En propuestas enviadas</p>
        </div>

        {/* Tarjeta 4: Inventario */}
        <div className="bg-[#21242E] rounded-2xl border border-neutral-800 p-6 shadow-xl transition-all duration-300 relative overflow-hidden group hover:-translate-y-1">
          <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">Absorción Arienzo</p>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-4xl font-bold text-white">{inventarioColocado}</p>
            <p className="text-[10px] text-[#D1C292] font-bold uppercase tracking-widest">Colocadas</p>
          </div>
          <div className="mt-3 bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div className="h-full bg-[#D1C292]" style={{ width: `${(inventarioColocado / Math.max(inventarioDisponible + inventarioColocado, 1)) * 100}%` }}></div>
          </div>
          <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest mt-2 text-right">{inventarioDisponible} Disponibles</p>
        </div>
      </div>

      {/* PANELES DE ACCIÓN (ABAJO) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* AGENDA DEL DÍA (Ocupa 8 columnas) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-neutral-200/60 shadow-sm flex flex-col h-[450px]">
          <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-[#F9F7F5] rounded-t-2xl">
            <div>
              <h2 className="text-sm font-bold text-[#415364] uppercase tracking-widest flex items-center gap-2">
                <svg className="w-5 h-5 text-[#ea0029]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                Agenda Estratégica
              </h2>
              <p className="text-[10px] font-bold text-[#415364]/50 uppercase tracking-widest mt-1">Seguimientos para Hoy y Atrasados.</p>
            </div>
            {tareasHoy.length > 0 && (
              <div className="bg-[#ea0029] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-sm">
                {tareasHoy.length} Tareas Activas
              </div>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            {tareasHoy.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center h-full">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4 border border-green-100">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h3 className="text-[#415364] font-bold mb-1">Día despejado</h3>
                <p className="text-xs font-medium text-[#415364]/60">No tienes tareas pendientes ni atrasadas.</p>
                <Link href="/crm" className="mt-4 text-[10px] font-bold text-[#ea0029] uppercase tracking-widest hover:underline">Ir a prospectar →</Link>
              </div>
            ) : (
              <div className="space-y-2">
                {tareasHoy.map((tarea) => {
                  const fechaTarea = new Date(tarea.proximo_contacto + 'T00:00:00');
                  const esAtrasada = fechaTarea.getTime() < hoy.getTime();

                  return (
                    <div key={tarea.id} className="p-4 bg-white hover:bg-[#F9F7F5] border border-neutral-100 rounded-xl transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                      <div className="flex items-start gap-4">
                        <div className={`mt-1 shrink-0 w-2.5 h-2.5 rounded-full ${esAtrasada ? 'bg-[#ea0029] shadow-[0_0_8px_rgba(234,0,41,0.5)] animate-pulse' : 'bg-emerald-400'}`} title={esAtrasada ? 'Tarea Atrasada' : 'Tarea para Hoy'}></div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-bold text-[#415364]">{tarea.nombres} {tarea.apellidos}</h3>
                            <span className="text-[9px] text-[#415364]/40 font-mono font-bold">| {tarea.telefono}</span>
                          </div>
                          <p className="text-xs text-[#415364]/80 font-medium line-clamp-1">{tarea.detalle_accion || `Acción requerida: ${tarea.tipo_accion}`}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-widest border ${esAtrasada ? 'bg-[#ea0029]/5 text-[#ea0029] border-[#ea0029]/20' : 'bg-[#415364]/5 text-[#415364]/70 border-[#415364]/10'}`}>
                              {tarea.tipo_accion}
                            </span>
                            {tarea.temperatura && (
                              <span className="text-[10px]">{tarea.temperatura.includes('Caliente') ? '🔥' : tarea.temperatura.includes('Tibio') ? '☀️' : '❄️'}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <Link href="/crm" className="px-5 py-2.5 bg-white border border-[#415364]/20 text-[#415364] rounded-lg text-[10px] font-bold uppercase tracking-widest hover:border-[#ea0029] hover:bg-[#ea0029] hover:text-white transition-all shadow-sm text-center flex-shrink-0">
                        Gestionar
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA (4 Columnas) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* ACCESOS RÁPIDOS */}
          <div className="bg-[#415364] rounded-2xl p-6 shadow-md text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
               <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            
            <h2 className="text-[10px] font-bold tracking-widest uppercase mb-4 opacity-80 border-b border-white/10 pb-2">Acceso Inmediato</h2>
            <div className="space-y-3 relative z-10">
              <Link href="/crm" className="group flex items-center justify-between p-3.5 bg-white/10 rounded-xl hover:bg-white/20 transition-all cursor-pointer border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/80 group-hover:bg-[#ea0029] group-hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                  </div>
                  <div>
                    <h3 className="text-[13px] font-bold text-white group-hover:text-white transition-colors">Base CRM</h3>
                    <p className="text-[9px] text-white/50 uppercase tracking-widest mt-0.5">Prospectos</p>
                  </div>
                </div>
                <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
              </Link>

              <Link href="/cotizador" className="group flex items-center justify-between p-3.5 bg-white/10 rounded-xl hover:bg-white/20 transition-all cursor-pointer border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/80 group-hover:bg-[#ea0029] group-hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  </div>
                  <div>
                    <h3 className="text-[13px] font-bold text-white group-hover:text-white transition-colors">Cotizador</h3>
                    <p className="text-[9px] text-white/50 uppercase tracking-widest mt-0.5">Simulador</p>
                  </div>
                </div>
                <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
              </Link>
            </div>
          </div>

          {/* MINI RADAR DE ACTIVIDAD (RECIENTE) */}
          <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-sm flex-1 flex flex-col min-h-[220px]">
            <div className="p-4 border-b border-neutral-100 flex justify-between items-center">
              <h2 className="text-[10px] font-bold text-[#ea0029] uppercase tracking-widest flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                Radar en Vivo
              </h2>
              <Link href="/radar" className="text-[9px] font-bold text-[#415364]/50 hover:text-[#415364] uppercase tracking-widest">Ver todo</Link>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto custom-scrollbar bg-[#F9F7F5]">
              {actividadReciente.length === 0 ? (
                <p className="text-center text-[10px] text-[#415364]/40 font-bold uppercase tracking-widest mt-8">Sin actividad reciente.</p>
              ) : (
                <div className="space-y-3">
                  {actividadReciente.map((act, idx) => (
                    <div key={idx} className="flex gap-3 items-start p-2 rounded-lg hover:bg-white transition-colors border border-transparent hover:border-neutral-200">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ea0029] mt-1.5 shrink-0"></div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-[#415364] truncate">{act.nombres}</p>
                        <p className="text-[10px] text-[#415364]/70 line-clamp-1">{act.detalle}</p>
                        <p className="text-[9px] text-[#ea0029] font-bold mt-1 uppercase">{formatTiempoAtras(act.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}