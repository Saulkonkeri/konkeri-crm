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
  const [todasLasTareas, setTodasLasTareas] = useState<TareaHoy[]>([]);
  const [actividadReciente, setActividadReciente] = useState<ActividadReciente[]>([]);
  const [cargando, setCargando] = useState(true);

  // Estados para métricas financieras y de absorción
  const [montoCotizadoMes, setMontoCotizadoMes] = useState(0);
  const [inventarioDisponible, setInventarioDisponible] = useState(0);
  const [inventarioColocado, setInventarioColocado] = useState(0);

  // Estados para la nueva Agenda con Pestañas
  const [tabAgenda, setTabAgenda] = useState<'hoy' | 'vencidas' | 'proximas'>('hoy');
  const [tareaActiva, setTareaActiva] = useState<TareaHoy | null>(null);
  const [resolucionForm, setResolucionForm] = useState({ accion: 'completar', nuevaFecha: '', nota: '' });
  const [guardandoTarea, setGuardandoTarea] = useState(false);

  useEffect(() => {
    cargarDatosDashboard();
  }, []);

  const cargarDatosDashboard = async () => {
    setCargando(true);
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

        // Agrupar todas las tareas programadas
        const tareasConFecha = clientesActivos.filter(c => c.proximo_contacto);
        
        // Ordenar por prioridad: 1ro Fecha, 2do Temperatura (Calientes primero)
        const tareasOrdenadas = tareasConFecha.sort((a, b) => {
          const dateA = new Date(a.proximo_contacto).getTime();
          const dateB = new Date(b.proximo_contacto).getTime();
          if (dateA !== dateB) return dateA - dateB;
          
          const tempWeight = (t: string) => t?.includes('Caliente') ? 3 : t?.includes('Tibio') ? 2 : 1;
          return tempWeight(b.temperatura) - tempWeight(a.temperatura);
        });

        setTodasLasTareas(tareasOrdenadas);
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

      // 4. CARGA DE ACTIVIDAD RECIENTE
      const accionesValiosas = ['DESCARGA_BROCHURE', 'CLIC_WHATSAPP', 'INICIO_COTIZACION', 'REGISTRO_COMPLETADO', 'USO_FILTRO', 'CLIC_DISPONIBILIDAD'];
      const { data: trackData } = await supabase
        .from('tracking_inventario')
        .select('*')
        .in('accion', accionesValiosas)
        .order('created_at', { ascending: false })
        .limit(20);

      if (trackData && trackData.length > 0) {
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
        
        const actUnicas = actividadesConNombre.filter((v,i,a) => a.findIndex(t => (t.email_cliente === v.email_cliente && t.accion === v.accion)) === i).slice(0, 5);
        setActividadReciente(actUnicas);
      }

    } catch (error) {
      console.error('Error cargando el dashboard:', error);
    } finally {
      setCargando(false);
    }
  };

  const resolverTarea = async () => {
    if (!tareaActiva) return;
    setGuardandoTarea(true);

    try {
      const payload: any = {};
      
      if (resolucionForm.accion === 'completar') {
        payload.proximo_contacto = null;
        payload.tipo_accion = null;
        payload.detalle_accion = null;
      } else if (resolucionForm.accion === 'reprogramar') {
        if (!resolucionForm.nuevaFecha) { alert("Selecciona una nueva fecha"); setGuardandoTarea(false); return; }
        payload.proximo_contacto = resolucionForm.nuevaFecha;
      }
      
      const { error } = await supabase.from('clientes').update(payload).eq('id', tareaActiva.id);
      if (error) throw error;

      alert(`✅ Tarea de ${tareaActiva.nombres} gestionada con éxito.`);
      setTareaActiva(null);
      setResolucionForm({ accion: 'completar', nuevaFecha: '', nota: '' });
      cargarDatosDashboard();

    } catch (error: any) {
      alert(`Error al actualizar tarea: ${error.message}`);
    } finally {
      setGuardandoTarea(false);
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

  // Filtrado de Tareas para las Pestañas
  const hoyStr = new Date().toISOString().split('T')[0];
  const hoyMs = new Date(hoyStr + 'T00:00:00').getTime();

  const tareasFiltradas = todasLasTareas.filter(tarea => {
    const tareaMs = new Date(tarea.proximo_contacto + 'T00:00:00').getTime();
    if (tabAgenda === 'hoy') return tareaMs === hoyMs;
    if (tabAgenda === 'vencidas') return tareaMs < hoyMs;
    if (tabAgenda === 'proximas') return tareaMs > hoyMs;
    return false;
  });

  const contadoresAgenda = {
    hoy: todasLasTareas.filter(t => new Date(t.proximo_contacto + 'T00:00:00').getTime() === hoyMs).length,
    vencidas: todasLasTareas.filter(t => new Date(t.proximo_contacto + 'T00:00:00').getTime() < hoyMs).length,
    proximas: todasLasTareas.filter(t => new Date(t.proximo_contacto + 'T00:00:00').getTime() > hoyMs).length,
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

  return (
    <div className="p-4 md:p-8 font-sans text-[#415364] w-full max-w-7xl mx-auto min-h-[calc(100vh-2rem)] flex flex-col relative">
      
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

      {/* MÉTRICAS PRINCIPALES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
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

        <div className="bg-white rounded-2xl border border-neutral-200/60 p-6 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group hover:-translate-y-1">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 transition-all group-hover:w-1.5"></div>
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Cotizado (Mes)</p>
          <div className="flex items-baseline gap-1">
            <p className="text-2xl font-bold text-[#415364] font-mono">{"\$"}{(montoCotizadoMes / 1000).toFixed(1)}k</p>
          </div>
          <p className="text-[9px] text-[#415364]/40 font-bold uppercase tracking-widest mt-1">En propuestas enviadas</p>
        </div>

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

      {/* PANELES DE ACCIÓN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* AGENDA INTELIGENTE CON PESTAÑAS (8 columnas) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-neutral-200/60 shadow-sm flex flex-col h-[500px]">
          
          <div className="px-6 pt-6 pb-4 border-b border-neutral-100 bg-[#F9F7F5] rounded-t-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold text-[#415364] uppercase tracking-widest flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#ea0029]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  Agenda Comercial
                </h2>
                <p className="text-[10px] font-bold text-[#415364]/50 uppercase tracking-widest mt-1">Organiza tus seguimientos y llamadas.</p>
              </div>
            </div>

            {/* Pestañas de Navegación de Tareas */}
            <div className="flex gap-2">
              <button 
                onClick={() => setTabAgenda('vencidas')}
                className={`flex-1 py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${tabAgenda === 'vencidas' ? 'bg-[#ea0029] text-white shadow-md' : 'bg-white border border-neutral-200 text-neutral-500 hover:bg-neutral-50'}`}
              >
                Atrasadas {contadoresAgenda.vencidas > 0 && `(${contadoresAgenda.vencidas})`}
              </button>
              <button 
                onClick={() => setTabAgenda('hoy')}
                className={`flex-1 py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${tabAgenda === 'hoy' ? 'bg-[#21242E] text-white shadow-md' : 'bg-white border border-neutral-200 text-neutral-500 hover:bg-neutral-50'}`}
              >
                Para Hoy {contadoresAgenda.hoy > 0 && `(${contadoresAgenda.hoy})`}
              </button>
              <button 
                onClick={() => setTabAgenda('proximas')}
                className={`flex-1 py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${tabAgenda === 'proximas' ? 'bg-[#415364] text-white shadow-md' : 'bg-white border border-neutral-200 text-neutral-500 hover:bg-neutral-50'}`}
              >
                Próximas {contadoresAgenda.proximas > 0 && `(${contadoresAgenda.proximas})`}
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
            {tareasFiltradas.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center h-full">
                <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-4 border border-neutral-100">
                  <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h3 className="text-[#415364] font-bold mb-1">Sin tareas {tabAgenda}</h3>
                <p className="text-xs font-medium text-[#415364]/60">No tienes seguimientos programados en esta sección.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tareasFiltradas.map((tarea) => {
                  const indicadorColor = tabAgenda === 'vencidas' ? 'bg-red-500 border-red-200' : tabAgenda === 'hoy' ? 'bg-emerald-400 border-emerald-100' : 'bg-blue-400 border-blue-100';

                  return (
                    <div key={tarea.id} className="p-4 bg-white hover:bg-[#F9F7F5] border border-neutral-200 rounded-xl transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                      <div className="flex items-start gap-4">
                        <div className={`mt-1.5 shrink-0 w-3 h-3 rounded-full border-2 ${indicadorColor} ${tabAgenda === 'vencidas' ? 'animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]' : ''}`}></div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-bold text-[#415364]">{tarea.nombres} {tarea.apellidos}</h3>
                            <a href={`https://wa.me/${tarea.telefono.replace('+', '')}`} target="_blank" className="text-[10px] text-[#25D366] font-bold tracking-widest hover:underline flex items-center gap-1">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                              Contactar
                            </a>
                            {tabAgenda === 'proximas' && (
                              <span className="text-[9px] text-[#415364]/50 font-bold bg-neutral-100 px-2 py-0.5 rounded">
                                {new Date(tarea.proximo_contacto + 'T00:00:00').toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#415364]/80 font-medium line-clamp-1">{tarea.detalle_accion || `Acción requerida: ${tarea.tipo_accion}`}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="bg-[#415364]/5 text-[#415364]/70 border border-[#415364]/10 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">
                              {tarea.tipo_accion || 'Seguimiento'}
                            </span>
                            {tarea.temperatura && (
                              <span className="text-[10px]">{tarea.temperatura.includes('Caliente') ? '🔥' : tarea.temperatura.includes('Tibio') ? '☀️' : '❄️'}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 shrink-0">
                        <button 
                          onClick={() => setTareaActiva(tarea)}
                          className="px-5 py-2.5 bg-[#21242E] text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-[#ea0029] transition-all shadow-sm"
                        >
                          Resolver
                        </button>
                      </div>
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
                    <p className="text-[9px] text-white/50 uppercase tracking-widest mt-0.5">Gestor de Prospectos</p>
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
                    <p className="text-[9px] text-white/50 uppercase tracking-widest mt-0.5">Simulador Financiero</p>
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

      {/* MODAL GESTOR DE RESOLUCIÓN RÁPIDA */}
      {tareaActiva && (
        <div className="fixed inset-0 bg-[#415364]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="bg-[#21242E] p-5 flex justify-between items-center text-white">
              <div>
                <h3 className="text-[10px] font-bold text-[#ea0029] uppercase tracking-widest">Resolver Seguimiento</h3>
                <p className="text-sm font-bold">{tareaActiva.nombres} {tareaActiva.apellidos}</p>
              </div>
              <button onClick={() => setTareaActiva(null)} className="text-white/50 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              
              <div className="bg-[#F9F7F5] border border-neutral-200 p-4 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-neutral-500 block mb-1">Acción Pendiente</span>
                <span className="text-xs font-bold text-[#415364]">{tareaActiva.detalle_accion || tareaActiva.tipo_accion}</span>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#415364]/60 uppercase block mb-2">Decisión Comercial</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setResolucionForm({...resolucionForm, accion: 'completar'})}
                    className={`py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all border ${resolucionForm.accion === 'completar' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-inner' : 'bg-white text-neutral-400 hover:bg-neutral-50'}`}
                  >
                    Completar Hoy
                  </button>
                  <button 
                    onClick={() => setResolucionForm({...resolucionForm, accion: 'reprogramar'})}
                    className={`py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all border ${resolucionForm.accion === 'reprogramar' ? 'bg-amber-50 text-amber-600 border-amber-200 shadow-inner' : 'bg-white text-neutral-400 hover:bg-neutral-50'}`}
                  >
                    Reprogramar
                  </button>
                </div>
              </div>

              {resolucionForm.accion === 'reprogramar' && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className="text-[10px] font-bold text-[#415364]/60 uppercase block mb-1.5">Nueva Fecha</label>
                  <input 
                    type="date" 
                    value={resolucionForm.nuevaFecha} 
                    onChange={(e) => setResolucionForm({...resolucionForm, nuevaFecha: e.target.value})} 
                    className="w-full text-xs p-3 border border-neutral-300 rounded-xl outline-none focus:border-[#ea0029] font-mono text-[#415364]" 
                  />
                </div>
              )}

              <button 
                onClick={resolverTarea} 
                disabled={guardandoTarea} 
                className="w-full bg-[#ea0029] text-white py-4 rounded-xl text-xs font-bold uppercase tracking-widest shadow-md hover:bg-[#c90022] transition-colors mt-2"
              >
                {guardandoTarea ? 'Sincronizando...' : 'Guardar y Cerrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}