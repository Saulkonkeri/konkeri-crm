'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

// ==========================================
// 1. DEFINICIÓN DE TIPOS
// ==========================================
type SesionCliente = {
  idSesion: string;
  email: string;
  nombre?: string;
  inicio: Date;
  fin: Date;
  minutos: number;
  eventos: any[];
  ultimaAccion: string;
  unidadesVistas: string[];
};

type EventoWeb = {
  id: string;
  created_at: string;
  visitor_id: string;
  session_id: string;
  email_cliente: string;
  accion: string;
  detalle: string;
  metadata: any;
};

type VisitanteAgrupado = {
  visitor_id: string;
  email: string | null;
  primeraVisita: Date;
  ultimaActividad: Date;
  sesiones: Set<string>;
  eventos: EventoWeb[];
  tiempoAcumuladoMin: number;
  score: number;
  fuentePrincipal: string;
  nivelInteraccion: 'ALTO' | 'MEDIO' | 'BAJO';
};

type ItemFeed = {
  id: string;
  fecha: Date;
  accion: string;
  detalle: string;
  nombre: string;
  email: string | null;
  telefono?: string | null;
  origen?: string | null;
  campana?: string | null;
  cliente_id?: string | null;
};

// ==========================================
// 2. DICCIONARIO DE SEPARACIÓN WEB VS VIP
// ==========================================
const ACCIONES_LANDING_PUBLICA = [
  'VISITA_LANDING', 
  'SCROLL_50', 
  'SCROLL_90', 
  'VIO_ARQUITECTURA',
  'CLIC_DISPONIBILIDAD', 
  'VIO_PLANO', 
  'INICIO_COTIZACION', 
  'ABRIO_FORMULARIO', 
  'ABRIO_CALENDLY', 
  'ABRIO_MODAL_BROCHURE',
  'REGISTRO_COMPLETADO', 
  'DESCARGA_BROCHURE', 
  'CLIC_WHATSAPP', 
  'CLIC_WHATSAPP_PLANO', 
  'SOLICITUD_ACCESO_VIP', 
  'VISITA_CAPTURA'
];

// ==========================================
// 3. FUNCIONES AUXILIARES PURAS
// ==========================================
const formatTiempoAtras = (fecha: Date) => {
  const ahora = new Date().getTime();
  const diffMs = ahora - fecha.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDias = Math.floor(diffHrs / 24);

  if (diffMin < 1) return 'Hace un momento';
  if (diffMin < 60) return `Hace ${diffMin} ${diffMin === 1 ? 'minuto' : 'minutos'}`;
  if (diffHrs < 24) return `Hace ${diffHrs} ${diffHrs === 1 ? 'hora' : 'horas'}`;
  if (diffDias === 1) return 'Ayer';
  if (diffDias < 7) return `Hace ${diffDias} días`;
  
  return new Date(fecha).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' });
};

const formatMinutos = (mins: number) => {
  if (mins === 0) return 'Menos de 1 min';
  return `${mins} min`;
};

const formatAccionTexto = (str: string) => {
  if (!str) return '';
  return str.split('_').join(' ');
};

const obtenerIconoFeed = (accion: string) => {
  if (accion.includes('LEAD') || accion.includes('REGISTRO')) return { icon: '🟢', color: 'bg-green-50 text-green-700 border-green-200' };
  if (accion.includes('BROCHURE')) return { icon: '📄', color: 'bg-blue-50 text-blue-700 border-blue-200' };
  if (accion.includes('WHATSAPP')) return { icon: '📱', color: 'bg-[#25D366]/10 text-[#1DA851] border-[#25D366]/30' };
  if (accion.includes('CALENDLY') || accion.includes('CITA')) return { icon: '🗓️', color: 'bg-purple-50 text-purple-700 border-purple-200' };
  if (accion.includes('VIP') || accion.includes('INVENTARIO') || accion.includes('DISPONIBILIDAD')) return { icon: '🎯', color: 'bg-amber-50 text-amber-700 border-amber-200' };
  return { icon: '👁️', color: 'bg-neutral-100 text-neutral-600 border-neutral-200' };
};

export default function RadarCentral() {
  const [pestañaActiva, setPestañaActiva] = useState('feed'); 
  const [ticker, setTicker] = useState(0); 
  
  // ESTADOS FEED EN VIVO
  const [feedEnVivo, setFeedEnVivo] = useState<ItemFeed[]>([]);
  const [cargandoFeed, setCargandoFeed] = useState(true);
  const [feedExpandido, setFeedExpandido] = useState<string | null>(null);

  // ESTADOS ACCESOS VIP
  const [accesosVip, setAccesosVip] = useState<any[]>([]);
  const [cargandoAccesos, setCargandoAccesos] = useState(true);
  const [tiemposSeleccionados, setTiemposSeleccionados] = useState<Record<string, string>>({});

  // ESTADOS RADAR INVENTARIO
  const [sesiones, setSesiones] = useState<SesionCliente[]>([]);
  const [cargandoRadar, setCargandoRadar] = useState(true);
  const [sesionExpandida, setSesionExpandida] = useState<string | null>(null);

  // ESTADOS ACTIVIDAD WEB
  const [eventosWeb, setEventosWeb] = useState<EventoWeb[]>([]);
  const [visitantesAgrupados, setVisitantesAgrupados] = useState<VisitanteAgrupado[]>([]);
  const [cargandoWeb, setCargandoWeb] = useState(true);
  const [filtroTiempo, setFiltroTiempo] = useState('30d');
  const [visitanteExpandido, setVisitanteExpandido] = useState<string | null>(null);

  useEffect(() => {
    cargarDatos();
    const intervalo = setInterval(() => setTicker(t => t + 1), 60000); 
    return () => clearInterval(intervalo);
  }, [filtroTiempo]);

  const cargarDatos = () => {
    cargarFeedEnVivo();
    cargarAccesos();
    cargarRadar();
    cargarActividadWeb();
  };

  const abrirWhatsApp = (telefono: string, nombres: string) => {
    if (!telefono || telefono === 'N/A') { alert("Este cliente no tiene teléfono registrado."); return; }
    let numLimpio = telefono.split('').filter(char => char >= '0' && char <= '9').join('');
    if (numLimpio.startsWith('0') && numLimpio.length === 10) numLimpio = '593' + numLimpio.substring(1);
    else if (numLimpio.length === 9) numLimpio = '593' + numLimpio;
    const mensaje = `Hola ${nombres}, soy Saúl de Konkeri. Acabo de ver tu interés en el proyecto Arienzo Boutique Living...`;
    window.open(`https://wa.me/${numLimpio}?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  // ==========================================
  // LÓGICA PESTAÑA 1: FEED EN VIVO (PULSO DEL NEGOCIO)
  // ==========================================
  const cargarFeedEnVivo = async () => {
    setCargandoFeed(true);
    try {
      const { data: trackData } = await supabase.from('tracking_inventario')
        .select('*')
        .not('accion', 'in', '("SCROLL_50", "SCROLL_90", "VISITA_LANDING")')
        .order('created_at', { ascending: false })
        .limit(100);

      // 🔥 AHORA TRAEMOS TODOS LOS DATOS VALIOSOS DEL CLIENTE
      const { data: clientData } = await supabase.from('clientes')
        .select('id, nombres, apellidos, telefono, email, origen_captacion, origen, campana, created_at')
        .order('created_at', { ascending: false })
        .limit(50);

      // Cruzamos los correos del tracking web para ponerles nombre y teléfono
      const emails = Array.from(new Set(trackData?.map(t => t.email_cliente).filter(e => e && e.includes('@'))));
      let lookup: Record<string, { nombre: string, telefono: string, id: string }> = {};
      
      if (emails.length > 0) {
        const { data: cData } = await supabase.from('clientes').select('id, email, nombres, apellidos, telefono').in('email', emails);
        cData?.forEach(c => {
          lookup[c.email.toLowerCase()] = {
            nombre: `${c.nombres} ${c.apellidos || ''}`.trim(),
            telefono: c.telefono || '',
            id: c.id
          };
        });
      }

      const feedUnificado: ItemFeed[] = [];
      
      trackData?.forEach(t => {
        const info = t.email_cliente ? lookup[t.email_cliente.toLowerCase()] : null;
        const isAnon = !t.email_cliente || t.email_cliente === 'Anónimo';
        
        feedUnificado.push({
          id: `trk-${t.id}`,
          fecha: new Date(t.created_at),
          accion: t.accion,
          detalle: t.detalle,
          nombre: info ? info.nombre : (isAnon ? 'Visitante Anónimo' : t.email_cliente),
          email: t.email_cliente,
          telefono: info?.telefono,
          cliente_id: info?.id
        });
      });

      clientData?.forEach(c => {
        const origenReal = c.origen_captacion || c.origen || 'Web';
        feedUnificado.push({
          id: `cli-${c.id}`,
          fecha: new Date(c.created_at),
          accion: 'NUEVO_LEAD',
          detalle: `Se registró en la plataforma. Origen: ${origenReal}`,
          nombre: `${c.nombres} ${c.apellidos || ''}`.trim(),
          email: c.email,
          telefono: c.telefono,
          origen: origenReal,
          campana: c.campana,
          cliente_id: c.id
        });
      });

      feedUnificado.sort((a,b) => b.fecha.getTime() - a.fecha.getTime());
      
      const feedFiltrado = feedUnificado.filter((v,i,a) => 
        a.findIndex(t => (t.nombre === v.nombre && Math.abs(t.fecha.getTime() - v.fecha.getTime()) < 60000 && (t.accion.includes('LEAD') || t.accion.includes('REGISTRO')))) === i
      );

      setFeedEnVivo(feedFiltrado.slice(0, 100));
    } catch (e) {
      console.error(e);
    } finally {
      setCargandoFeed(false);
    }
  };

  // ==========================================
  // LÓGICA PESTAÑA 4: CONTROL DE ACCESOS VIP
  // ==========================================
  const cargarAccesos = async () => {
    setCargandoAccesos(true);
    try {
      const { data: accesos } = await supabase.from('accesos_inventario').select('*').order('expira_en', { ascending: false });
      
      if (!accesos || accesos.length === 0) {
        setAccesosVip([]);
        return;
      }

      const emails = accesos.map(a => a.email);
      const { data: clientes } = await supabase.from('clientes').select('id, nombres, apellidos, telefono, email').in('email', emails);

      const combinados = accesos.map(acc => {
        const cli = clientes?.find(c => c.email?.toLowerCase() === acc.email.toLowerCase());
        return {
          id: cli?.id || acc.email,
          email: acc.email,
          nombres: cli ? `${cli.nombres} ${cli.apellidos || ''}` : 'Cliente Web',
          telefono: cli?.telefono || 'N/A',
          expira_en: acc.expira_en
        };
      });

      setAccesosVip(combinados);
      
      const tiemposInit: Record<string, string> = {};
      combinados.forEach(c => { tiemposInit[c.id] = '24'; });
      setTiemposSeleccionados(tiemposInit);

    } catch (error) {
      console.error("Error al cargar accesos:", error);
    } finally {
      setCargandoAccesos(false);
    }
  };

  const calcularTiempoRestante = (expiraEn?: string | null) => {
    if (!expiraEn) return { estado: 'sin_pase', texto: 'Sin pase' };
    const diff = new Date(expiraEn).getTime() - new Date().getTime();
    if (diff <= 0) return { estado: 'caducado', texto: 'Caducado' };
    
    const horas = Math.floor(diff / 3600000);
    const min = Math.floor((diff % 3600000) / 60000);
    
    if (horas > 800) return { estado: 'activo', texto: 'Acceso Ilimitado' };
    return { estado: 'activo', texto: `Vence en ${horas}h ${min}m` };
  };

  const handleTiempoChange = (id: string, valor: string) => {
    setTiemposSeleccionados(prev => ({ ...prev, [id]: valor }));
  };

  const aprobarAcceso = async (cliente: any) => {
    const horasStr = tiemposSeleccionados[cliente.id] || '24';
    const horasNum = parseInt(horasStr, 10);
    const statusTiempo = calcularTiempoRestante(cliente.expira_en);
    const esRenovacion = statusTiempo.estado === 'caducado' || statusTiempo.estado === 'activo';
    
    const mensaje = horasStr === '999' 
      ? `¿Darle acceso ILIMITADO a ${cliente.nombres}?`
      : esRenovacion 
        ? `¿Renovar el acceso de ${cliente.nombres} por ${horasStr} horas?`
        : `¿Aprobar el acceso a ${cliente.nombres} por ${horasStr} horas?`;

    const confirmar = window.confirm(mensaje);
    if (!confirmar) return; 

    try {
      const fechaExpiracion = new Date();
      fechaExpiracion.setHours(fechaExpiracion.getHours() + horasNum);

      await supabase.from('accesos_inventario').upsert({ email: cliente.email.toLowerCase().trim(), expira_en: fechaExpiracion.toISOString() });
      await supabase.from('clientes').update({ estado_acceso: 'aprobado' }).eq('email', cliente.email.toLowerCase().trim());

      cargarAccesos(); 
      alert(`Acceso activado correctamente para ${cliente.nombres}.`);
      
    } catch (error) {
      alert("Hubo un error de conexión.");
    }
  };

  const revocarAcceso = async (cliente: any) => {
    const confirmar = window.confirm(`🚨 ¿Estás seguro que deseas revocar y eliminar el pase VIP de ${cliente.nombres}? Ya no podrá ver los precios.`);
    if (!confirmar) return;
    
    try {
      await supabase.from('accesos_inventario').delete().eq('email', cliente.email.toLowerCase().trim());
      await supabase.from('clientes').update({ estado_acceso: 'revocado' }).eq('email', cliente.email.toLowerCase().trim());
      cargarAccesos();
      alert("Acceso revocado exitosamente.");
    } catch (e) {
      alert("Hubo un error al revocar el acceso.");
    }
  };

  const enviarCorreo = async (cliente: any) => {
    const horas = tiemposSeleccionados[cliente.id] || '24';
    alert(`Enviando pase VIP al correo ${cliente.email}...`);
    try {
      const response = await fetch('/api/enviar-acceso', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: cliente.email, nombres: cliente.nombres, horas: horas }) });
      if (response.ok) alert("Correo enviado con éxito.");
      else alert("Problema de conexión con servidor de correos.");
    } catch (error) { alert("Error al intentar enviar el correo."); }
  };

  // ==========================================
  // LÓGICA PESTAÑA 2: RADAR INVENTARIO
  // ==========================================
  const generarAnalisisComercial = (sesion: SesionCliente) => {
    if (sesion.eventos.length === 0) return "Sin datos suficientes.";
    let analisis = "";
    if (sesion.minutos < 2) analisis += "Vistazo rápido. Exploró superficialmente. ";
    else if (sesion.minutos < 10) analisis += "Exploración moderada. Navegó por el inventario fluidamente. ";
    else analisis += "Alto nivel de interés. Analizó detalladamente varias opciones. ";

    const filtros = sesion.eventos.filter(e => e.accion === 'USO_FILTRO');
    if (filtros.length > 0) {
      const ultFiltro = filtros[0].detalle ? filtros[0].detalle.split('Buscó: ').join('') : '';
      analisis += `Mostró inclinación por la tipología de ${ultFiltro}. `;
    }

    if (sesion.unidadesVistas.length === 1) analisis += `Se enfocó exclusivamente en la unidad ${sesion.unidadesVistas[0]}. `;
    else if (sesion.unidadesVistas.length > 1) analisis += `Comparó ${sesion.unidadesVistas.length} unidades (${sesion.unidadesVistas.join(', ')}). `;
    return analisis;
  };

  const cargarRadar = async () => {
    setCargandoRadar(true);
    try {
      const { data } = await supabase.from('tracking_inventario').select('*').order('created_at', { ascending: false }).limit(2000); 
      if (data) {
        const dataFiltrada = data.filter(row => !ACCIONES_LANDING_PUBLICA.includes(row.accion));

        const datosCronologicos = [...dataFiltrada].reverse();
        const sesionesList: SesionCliente[] = [];
        const sesionesActivas: Record<string, SesionCliente> = {};

        datosCronologicos.forEach(row => {
          const email = row.email_cliente;
          const fechaRow = new Date(row.created_at);
          const tiempoActual = fechaRow.getTime();

          if (sesionesActivas[email] && (tiempoActual - sesionesActivas[email].fin.getTime()) < 45 * 60000) {
            const sesion = sesionesActivas[email];
            sesion.fin = fechaRow;
            sesion.eventos.unshift(row); 
            if (row.unidad_id && !sesion.unidadesVistas.includes(row.unidad_id)) {
              sesion.unidadesVistas.push(row.unidad_id);
            }
          } else {
            const nuevaSesion: SesionCliente = {
              idSesion: `${email}-${tiempoActual}`, email: email, inicio: fechaRow, fin: fechaRow, minutos: 0,
              eventos: [row], ultimaAccion: '', unidadesVistas: row.unidad_id ? [row.unidad_id] : []
            };
            sesionesList.push(nuevaSesion);
            sesionesActivas[email] = nuevaSesion;
          }
        });

        sesionesList.forEach(s => {
          const diffMs = s.fin.getTime() - s.inicio.getTime();
          s.minutos = Math.round(diffMs / 60000);
          s.ultimaAccion = s.eventos[0]?.detalle || s.eventos[0]?.accion || 'Desconocido';
        });

        const correosUnicos = Array.from(new Set(sesionesList.map(s => s.email)));
        if (correosUnicos.length > 0) {
          const { data: clientesData } = await supabase.from('clientes').select('email, nombres, apellidos').in('email', correosUnicos);
          if (clientesData) {
            const mapaNombres: Record<string, string> = {};
            clientesData.forEach(c => { if (c.email) mapaNombres[c.email.toLowerCase()] = `${c.nombres || ''} ${c.apellidos || ''}`.trim(); });
            sesionesList.forEach(s => { s.nombre = mapaNombres[s.email.toLowerCase()]; });
          }
        }
        sesionesList.sort((a, b) => b.fin.getTime() - a.fin.getTime());
        setSesiones(sesionesList);
      }
    } finally {
      setCargandoRadar(false);
    }
  };

  // ==========================================
  // LÓGICA PESTAÑA 3: ACTIVIDAD WEB
  // ==========================================
  const PESOS_EVENTOS: Record<string, number> = {
    'VISITA_LANDING': 1, 'SCROLL_50': 2, 'SCROLL_90': 3, 'VIO_ARQUITECTURA': 2, 'VIO_PLANO': 3,
    'ABRIO_FORMULARIO': 6, 'ABRIO_CALENDLY': 8, 'CLIC_WHATSAPP': 10, 'CLIC_WHATSAPP_PLANO': 10, 
    'DESCARGA_BROCHURE': 12, 'REGISTRO_COMPLETADO': 15, 'INICIO_COTIZACION': 10
  };

  const cargarActividadWeb = async () => {
    setCargandoWeb(true);
    try {
      const fechaLimite = new Date();
      if (filtroTiempo === '7d') fechaLimite.setDate(fechaLimite.getDate() - 7);
      if (filtroTiempo === '30d') fechaLimite.setDate(fechaLimite.getDate() - 30);
      if (filtroTiempo === 'hoy') fechaLimite.setHours(0,0,0,0);

      const { data } = await supabase.from('tracking_inventario').select('*').gte('created_at', fechaLimite.toISOString()).order('created_at', { ascending: false }).limit(3000); 

      if (data) {
        const dataFiltrada = data.filter(row => ACCIONES_LANDING_PUBLICA.includes(row.accion));
        
        const datosCronologicos = [...dataFiltrada].reverse();
        setEventosWeb(datosCronologicos);
        procesarVisitantes(datosCronologicos);
      }
    } finally {
      setCargandoWeb(false);
    }
  };

  const procesarVisitantes = (eventos: EventoWeb[]) => {
    const mapa = new Map<string, VisitanteAgrupado>();

    eventos.forEach(ev => {
      const safeVisitorId = ev.visitor_id || ev.email_cliente || ev.session_id || `anon-${ev.id}`;

      if (!mapa.has(safeVisitorId)) {
        mapa.set(safeVisitorId, {
          visitor_id: safeVisitorId,
          email: ev.email_cliente?.includes('@') ? ev.email_cliente : null,
          primeraVisita: new Date(ev.created_at),
          ultimaActividad: new Date(ev.created_at),
          sesiones: new Set([ev.session_id || 'unica']),
          eventos: [],
          tiempoAcumuladoMin: 0,
          score: 0,
          fuentePrincipal: ev.metadata?.utm_source || ev.metadata?.referrer || 'Directo',
          nivelInteraccion: 'BAJO'
        });
      }

      const visitante = mapa.get(safeVisitorId)!;
      visitante.eventos.push(ev);
      if (ev.session_id) visitante.sesiones.add(ev.session_id);
      
      const fechaEvento = new Date(ev.created_at);
      if (fechaEvento > visitante.ultimaActividad) visitante.ultimaActividad = fechaEvento;
      if (ev.email_cliente && ev.email_cliente.includes('@')) visitante.email = ev.email_cliente;
      visitante.score += PESOS_EVENTOS[ev.accion] || 1;
    });

    const resultado = Array.from(mapa.values()).map(v => {
      const sesionesAgrupadas = v.eventos.reduce((acc, curr) => {
        if (!acc[curr.session_id]) acc[curr.session_id] = [];
        acc[curr.session_id].push(new Date(curr.created_at).getTime());
        return acc;
      }, {} as Record<string, number[]>);

      let minAcumulados = 0;
      Object.values(sesionesAgrupadas).forEach(tiempos => {
        if (tiempos.length > 1) minAcumulados += (Math.max(...tiempos) - Math.min(...tiempos)) / 60000;
        else minAcumulados += 1; 
      });
      
      v.tiempoAcumuladoMin = Math.round(minAcumulados);
      if (v.sesiones.size > 1) v.score += 5; 

      if (v.score >= 20) v.nivelInteraccion = 'ALTO';
      else if (v.score >= 8) v.nivelInteraccion = 'MEDIO';
      else v.nivelInteraccion = 'BAJO';

      v.eventos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return v;
    });

    resultado.sort((a, b) => b.ultimaActividad.getTime() - a.ultimaActividad.getTime());
    setVisitantesAgrupados(resultado);
  };

  const metricas = useMemo(() => {
    const unicos = visitantesAgrupados.length;
    const totalSesiones = visitantesAgrupados.reduce((acc, v) => acc + v.sesiones.size, 0);
    const recurrentes = visitantesAgrupados.filter(v => v.sesiones.size > 1).length;
    const altoInteres = visitantesAgrupados.filter(v => v.nivelInteraccion === 'ALTO').length;
    const conversiones = visitantesAgrupados.filter(v => v.email !== null).length;
    
    const funnel = {
      visitas: eventosWeb.filter(e => e.accion === 'VISITA_LANDING').length,
      scroll50: eventosWeb.filter(e => e.accion === 'SCROLL_50').length,
      intentosContacto: eventosWeb.filter(e => ['ABRIO_FORMULARIO', 'ABRIO_CALENDLY', 'CLIC_WHATSAPP', 'INICIO_COTIZACION'].includes(e.accion)).length,
      registros: conversiones
    };

    return { unicos, totalSesiones, recurrentes, altoInteres, conversiones, funnel };
  }, [visitantesAgrupados, eventosWeb]);

  return (
    <div className="p-4 md:p-8 w-full max-w-7xl mx-auto bg-[#dce3eb] min-h-screen font-sans text-[#415364]">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 border-b border-[#415364]/10 pb-6">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-[#ea0029] uppercase">Analítica y Accesos</span>
          <h1 className="text-3xl md:text-4xl font-bold text-[#415364] tracking-tight mt-1">Radar Central</h1>
          <p className="text-sm text-[#415364]/70 mt-1">Centro de inteligencia comercial, comportamiento de leads y pases de seguridad.</p>
        </div>
        <button onClick={cargarDatos} className="bg-white border border-[#415364]/20 text-[#415364] px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#415364]/5 transition-colors shadow-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Refrescar Datos
        </button>
      </div>

      <div className="flex overflow-x-auto bg-[#dce3eb]/50 p-1.5 rounded-xl shadow-inner border border-[#415364]/10 mb-8 w-full custom-scrollbar">
        <button onClick={() => setPestañaActiva('feed')} className={`flex-1 md:flex-auto whitespace-nowrap px-6 py-2.5 rounded-lg text-xs font-bold transition-all flex justify-center items-center gap-2 ${pestañaActiva === 'feed' ? 'bg-white text-[#ea0029] shadow-sm' : 'text-[#415364]/70 hover:text-[#415364]'}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          Feed en Vivo
        </button>
        <button onClick={() => setPestañaActiva('web')} className={`flex-1 md:flex-auto whitespace-nowrap px-6 py-2.5 rounded-lg text-xs font-bold transition-all flex justify-center items-center gap-2 ${pestañaActiva === 'web' ? 'bg-white text-[#ea0029] shadow-sm' : 'text-[#415364]/70 hover:text-[#415364]'}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
          Trazabilidad Web
        </button>
        <button onClick={() => setPestañaActiva('inventario')} className={`flex-1 md:flex-auto whitespace-nowrap px-6 py-2.5 rounded-lg text-xs font-bold transition-all flex justify-center items-center gap-2 ${pestañaActiva === 'inventario' ? 'bg-white text-[#ea0029] shadow-sm' : 'text-[#415364]/70 hover:text-[#415364]'}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Radar Inventario
        </button>
        <button onClick={() => setPestañaActiva('accesos')} className={`flex-1 md:flex-auto whitespace-nowrap px-6 py-2.5 rounded-lg text-xs font-bold transition-all flex justify-center items-center gap-2 ${pestañaActiva === 'accesos' ? 'bg-white text-[#ea0029] shadow-sm' : 'text-[#415364]/70 hover:text-[#415364]'}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          Accesos VIP
        </button>
      </div>

      {/* ============================================================== */}
      {/* PESTAÑA FEED EN VIVO CON TARJETAS EXPANDIBLES Y PUENTE AL CRM */}
      {/* ============================================================== */}
      {pestañaActiva === 'feed' && (
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200/60 overflow-hidden animate-in fade-in slide-in-from-bottom-2 w-full max-w-4xl mx-auto">
          <div className="px-6 py-5 border-b border-neutral-100 flex justify-between items-center bg-[#21242E]">
            <h3 className="text-sm font-bold text-white tracking-widest uppercase flex items-center gap-2">
              🚨 Pulso del Negocio en Vivo
            </h3>
          </div>
          
          <div className="p-6 md:p-8 overflow-y-auto max-h-[70vh] custom-scrollbar bg-[#F9F7F5]">
            {cargandoFeed ? (
              <div className="text-center text-[#415364]/40 font-bold uppercase tracking-widest text-[10px] py-10 animate-pulse">Sincronizando feed en vivo...</div>
            ) : feedEnVivo.length === 0 ? (
              <div className="text-center text-[#415364]/40 font-bold uppercase tracking-widest text-[10px] py-10">No hay actividad reciente.</div>
            ) : (
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-[#ea0029]/30 before:via-[#415364]/10 before:to-transparent">
                {feedEnVivo.map((item, idx) => {
                  const style = obtenerIconoFeed(item.accion);
                  const isExpanded = feedExpandido === item.id;
                  const isLeadInfo = item.email && item.email !== 'Anónimo';

                  return (
                    <div key={idx} className="relative flex items-start group">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full border-[3px] border-[#F9F7F5] z-10 ml-[2px] mr-4 shrink-0 shadow-sm bg-white mt-2">
                        <span className="text-xs">{style.icon}</span>
                      </div>
                      
                      {/* CONTENEDOR DE LA TARJETA (HACER CLIC PARA EXPANDIR) */}
                      <div 
                        onClick={() => isLeadInfo && setFeedExpandido(isExpanded ? null : item.id)}
                        className={`w-full bg-white p-4 rounded-xl border shadow-sm flex flex-col transition-all ${style.color.split(' ')[0]} ${style.color.split(' ')[2]} ${isLeadInfo ? 'cursor-pointer hover:shadow-md' : ''}`}
                      >
                        {/* VISTA RESUMIDA */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[13px] font-bold text-[#415364]">{item.nombre}</span>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border ${style.color}`}>
                                {formatAccionTexto(item.accion)}
                              </span>
                            </div>
                            <span className="text-[11px] text-[#415364]/80 font-medium leading-relaxed">{item.detalle}</span>
                          </div>
                          <div className="text-right shrink-0 mt-2 md:mt-0 flex flex-col items-end gap-1">
                            <span className="text-[10px] font-bold text-[#ea0029] bg-white border border-[#ea0029]/20 px-3 py-1.5 rounded-lg shadow-sm whitespace-nowrap block">
                              {formatTiempoAtras(item.fecha)}
                            </span>
                            {isLeadInfo && !isExpanded && (
                              <span className="text-[8px] uppercase tracking-widest text-[#415364]/40 font-bold hidden md:block">Clic para ver datos 👇</span>
                            )}
                          </div>
                        </div>

                        {/* VISTA EXPANDIDA CON DATOS Y BOTONES (PUENTE AL CRM) */}
                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-neutral-100 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-200">
                            <div>
                              <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Información de Contacto</p>
                              <p className="text-[11px] font-mono font-medium text-neutral-700">{item.email || 'Sin correo registrado'}</p>
                              <p className="text-[11px] font-mono font-medium text-neutral-700 mt-0.5">{item.telefono || 'Sin teléfono registrado'}</p>
                            </div>
                            
                            {(item.origen || item.campana) && (
                              <div>
                                <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Procedencia</p>
                                <p className="text-[11px] font-medium text-neutral-700">{item.origen || 'Web'}</p>
                                {item.campana && <p className="text-[10px] text-neutral-500 mt-0.5">Camp: {item.campana}</p>}
                              </div>
                            )}

                            <div className="sm:col-span-2 flex flex-wrap gap-2 mt-2">
                              {item.telefono && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); abrirWhatsApp(item.telefono!, item.nombre); }}
                                  className="bg-[#25D366] text-white hover:bg-[#128C7E] px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm flex items-center gap-1.5"
                                >
                                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                                  Responder Inmediato
                                </button>
                              )}
                              
                              <Link href="/crm" passHref>
                                <button 
                                  onClick={(e) => e.stopPropagation()}
                                  className="bg-[#21242E] text-white hover:bg-black px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm flex items-center gap-1.5"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                  Gestionar en CRM
                                </button>
                              </Link>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {pestañaActiva === 'accesos' && (
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200/60 overflow-hidden animate-in fade-in slide-in-from-bottom-2 w-full">
          <div className="px-6 py-5 border-b border-neutral-100 flex justify-between items-center bg-[#21242E]">
            <h3 className="text-sm font-bold text-white tracking-widest uppercase flex items-center gap-2">
              🔑 Control de Seguridad y Accesos VIP
            </h3>
          </div>
          
          <div className="overflow-x-auto custom-scrollbar w-full">
            <table className="w-full min-w-[950px] text-left text-sm text-[#415364]">
              <thead className="bg-neutral-50/50 text-[#415364]/60 text-[10px] uppercase tracking-widest border-b border-neutral-100">
                <tr>
                  <th className="px-6 py-4 font-bold">Inversionista</th>
                  <th className="px-6 py-4 font-bold">Estado del Pase</th>
                  <th className="px-6 py-4 font-bold">Contacto</th>
                  <th className="px-6 py-4 font-bold text-right">Gestión de Seguridad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {cargandoAccesos ? (
                  <tr><td colSpan={4} className="px-6 py-10 text-center text-[#415364]/40 font-bold uppercase tracking-widest text-[10px]">Cargando llaves de seguridad...</td></tr>
                ) : accesosVip.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-10 text-center text-[#415364]/40 font-bold uppercase tracking-widest text-[10px]">No hay pases VIP generados actualmente.</td></tr>
                ) : (
                  accesosVip.map((cliente) => {
                    const statusTiempo = calcularTiempoRestante(cliente.expira_en);
                    const activo = statusTiempo.estado === 'activo';

                    return (
                      <tr key={cliente.id} className={`transition-colors ${activo ? 'bg-green-50/10' : 'bg-[#ea0029]/5'}`}>
                        <td className="px-6 py-4">
                          <div className="font-bold text-[#415364] whitespace-nowrap">{cliente.nombres}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center text-[9px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border whitespace-nowrap ${activo ? 'bg-green-50 text-green-700 border-green-200' : 'bg-[#ea0029]/10 text-[#ea0029] border-[#ea0029]/20'}`}>
                            {statusTiempo.texto}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-[#415364] font-mono text-[11px] font-medium">{cliente.email}</div>
                          <div className="text-[#415364]/60 font-mono text-[10px]">{cliente.telefono}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <select className="bg-white border border-[#415364]/20 text-[#415364] rounded-lg text-[10px] p-2 focus:outline-none focus:border-[#ea0029] font-bold outline-none cursor-pointer" value={tiemposSeleccionados[cliente.id] || '24'} onChange={(e) => handleTiempoChange(cliente.id, e.target.value)}>
                              <option value="2">2 hrs</option>
                              <option value="12">12 hrs</option>
                              <option value="24">24 hrs</option>
                              <option value="48">48 hrs</option>
                              <option value="999">Ilimitado</option>
                            </select>
                            
                            {activo ? (
                              <>
                                <button onClick={() => aprobarAcceso(cliente)} className="px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm text-white whitespace-nowrap bg-[#415364] hover:bg-[#21242E]">
                                  Renovar
                                </button>
                                <button onClick={() => revocarAcceso(cliente)} className="px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm text-white whitespace-nowrap bg-[#ea0029] hover:bg-[#c90022]" title="Quitar Acceso">
                                  Revocar
                                </button>
                              </>
                            ) : (
                              <button onClick={() => aprobarAcceso(cliente)} className="px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm text-white whitespace-nowrap bg-[#1DA851] hover:bg-green-700">
                                Reactivar
                              </button>
                            )}

                            <button onClick={() => enviarCorreo(cliente)} className="bg-[#dce3eb]/50 text-[#415364] hover:bg-[#415364]/10 border border-[#415364]/10 px-3 py-2 rounded-lg transition-colors shadow-sm flex items-center justify-center" title="Reenviar Email Pase">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            </button>
                            <button onClick={() => abrirWhatsApp(cliente.telefono, cliente.nombres)} className="bg-[#25D366]/10 border border-[#25D366]/30 text-[#1DA851] hover:bg-[#25D366]/20 px-3 py-2 rounded-lg transition-colors flex items-center justify-center" title="Escribir por WhatsApp">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pestañaActiva === 'inventario' && (
        <div className="bg-white border border-neutral-200/60 rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 w-full">
          {cargandoRadar && sesiones.length === 0 && (
            <div className="p-10 text-center text-[#415364]/40 font-bold uppercase tracking-widest text-[10px] animate-pulse">Cargando lecturas del inventario VIP...</div>
          )}
          {!(cargandoRadar && sesiones.length === 0) && (
            <div className="overflow-x-auto custom-scrollbar w-full">
              <table className="w-full min-w-[1000px] text-left border-collapse">
                <thead>
                  <tr className="bg-[#21242E] text-white">
                    <th className="p-5 text-[10px] uppercase tracking-widest font-bold">Inversionista en Inventario</th>
                    <th className="p-5 text-[10px] uppercase tracking-widest font-bold">Estadía</th>
                    <th className="p-5 text-[10px] uppercase tracking-widest font-bold">Opciones Vistas</th>
                    <th className="p-5 text-[10px] uppercase tracking-widest font-bold">Última Acción</th>
                    <th className="p-5 text-[10px] uppercase tracking-widest font-bold text-center">Trazabilidad VIP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {sesiones.map((sesion) => (
                    <React.Fragment key={sesion.idSesion}>
                      <tr className="hover:bg-[#dce3eb]/30 transition-colors">
                        <td className="p-5">
                          {sesion.nombre && (
                            <span className="font-bold text-[#415364] flex items-center gap-1.5 text-sm whitespace-nowrap">
                              {sesion.nombre} <svg className="w-3.5 h-3.5 text-[#1DA851]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                            </span>
                          )}
                          {!sesion.nombre && (
                            <span className="font-bold text-[#415364] flex items-center gap-1.5 text-sm whitespace-nowrap">
                              Visitante Anónimo
                            </span>
                          )}
                          <span className="text-[10px] text-[#415364]/60 font-mono block mt-1">{sesion.email}</span>
                          <span className="text-[9px] text-[#ea0029] mt-1.5 block font-bold uppercase tracking-wider bg-[#ea0029]/10 px-2 py-0.5 rounded-md w-fit">
                            {formatTiempoAtras(sesion.fin)}
                          </span>
                        </td>
                        <td className="p-5">
                          <span className="bg-[#dce3eb]/50 text-[#415364] border border-[#415364]/10 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                            {formatMinutos(sesion.minutos)}
                          </span>
                        </td>
                        <td className="p-5">
                          <div className="flex gap-1.5 flex-wrap min-w-[150px]">
                            {sesion.unidadesVistas.length > 0 && sesion.unidadesVistas.map(u => (
                              <span key={u} className="bg-white border border-[#415364]/20 text-[#415364] text-[9px] font-bold px-2 py-1 rounded-md shadow-sm">U-{u}</span>
                            ))}
                            {sesion.unidadesVistas.length === 0 && (
                              <span className="text-xs text-[#415364]/30">-</span>
                            )}
                          </div>
                        </td>
                        <td className="p-5">
                          <span className="text-xs font-medium text-[#415364]/80 whitespace-nowrap">{sesion.ultimaAccion}</span>
                        </td>
                        <td className="p-5 text-center">
                          <button onClick={() => setSesionExpandida(sesionExpandida === sesion.idSesion ? null : sesion.idSesion)} className="text-[10px] font-bold text-[#ea0029] hover:text-[#c90022] bg-[#ea0029]/10 hover:bg-[#ea0029]/20 px-3 py-1.5 rounded-lg uppercase tracking-widest transition-colors whitespace-nowrap">
                            {sesionExpandida === sesion.idSesion ? 'Ocultar' : 'Ver Recorrido'}
                          </button>
                        </td>
                      </tr>
                      
                      {sesionExpandida === sesion.idSesion && (
                        <tr className="bg-[#F9F7F5] shadow-inner">
                          <td colSpan={5} className="p-6 md:p-8">
                            <div className="mb-8 bg-white border border-[#ea0029]/20 rounded-2xl p-5 shadow-sm flex items-start gap-4">
                              <div className="bg-[#ea0029]/10 text-[#ea0029] w-12 h-12 rounded-full flex items-center justify-center shrink-0">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                              </div>
                              <div>
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#ea0029] mb-1.5">Inteligencia Comercial</h4>
                                <p className="text-sm text-[#415364] leading-relaxed font-medium">{generarAnalisisComercial(sesion)}</p>
                              </div>
                            </div>
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#415364]/40 mb-5 pl-2">Línea de tiempo de navegación VIP</h4>
                            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[#415364]/20 before:to-transparent">
                              {sesion.eventos.map((evento, i) => (
                                <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                  <div className="flex items-center justify-center w-2.5 h-2.5 rounded-full border-[2px] border-white bg-[#ea0029] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm sm:mx-0 mx-4 z-10"></div>
                                  <div className="w-full md:w-1/2 bg-white p-4 rounded-xl border border-[#415364]/10 shadow-sm flex flex-col hover:border-[#ea0029]/40 hover:shadow-md transition-all">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-[10px] font-bold text-[#415364]/50">{new Date(evento.created_at).toLocaleTimeString('es-EC')}</span>
                                      {evento.unidad_id && (
                                        <span className="text-[9px] bg-[#dce3eb]/50 text-[#415364] border border-[#415364]/10 font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">Unidad {evento.unidad_id}</span>
                                      )}
                                    </div>
                                    <span className="text-xs font-bold text-[#415364]">{formatAccionTexto(evento.accion)}</span>
                                    <span className="text-[11px] text-[#415364]/70 mt-1 font-medium">{evento.detalle}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                  {sesiones.length === 0 && !cargandoRadar && (
                    <tr><td colSpan={5} className="p-10 text-center text-[#415364]/40 font-bold uppercase tracking-widest text-[10px]">Aún no hay actividad de clientes en el inventario.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {pestañaActiva === 'web' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 w-full">
          <div className="flex justify-end gap-2 bg-white w-fit ml-auto p-1.5 rounded-xl shadow-sm border border-neutral-200/60">
            {['hoy', '7d', '30d'].map(f => (
              <button key={f} onClick={() => setFiltroTiempo(f)} className={`px-4 py-2 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-colors ${filtroTiempo === f ? 'bg-[#415364] text-white shadow-sm' : 'bg-transparent text-[#415364]/60 hover:text-[#415364]'}`}>
                {f === 'hoy' ? 'Hoy' : f === '7d' ? '7 Días' : '30 Días'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-5">
            <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm transition-transform hover:-translate-y-1">
              <span className="text-[9px] uppercase font-bold text-[#415364]/50 tracking-widest">Visitantes Únicos</span>
              <div className="text-3xl font-light text-[#415364] mt-1">{metricas.unicos}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm transition-transform hover:-translate-y-1">
              <span className="text-[9px] uppercase font-bold text-[#415364]/50 tracking-widest">Sesiones</span>
              <div className="text-3xl font-light text-[#415364] mt-1">{metricas.totalSesiones}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm transition-transform hover:-translate-y-1">
              <span className="text-[9px] uppercase font-bold text-[#415364]/50 tracking-widest">Recurrentes</span>
              <div className="text-3xl font-light text-[#415364] mt-1">{metricas.recurrentes}</div>
            </div>
            <div className="bg-[#21242E] text-white p-5 rounded-2xl shadow-md transition-transform hover:-translate-y-1">
              <span className="text-[9px] uppercase font-bold text-white/50 tracking-widest flex items-center gap-1.5">
                <svg className="w-3 h-3 text-[#ea0029]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Alta Intención
              </span>
              <div className="text-3xl font-light mt-1">{metricas.altoInteres}</div>
            </div>
            <div className="bg-[#ea0029] text-white p-5 rounded-2xl shadow-md transition-transform hover:-translate-y-1">
              <span className="text-[9px] uppercase font-bold text-white/70 tracking-widest">Leads (Registros)</span>
              <div className="text-3xl font-light mt-1 font-bold">{metricas.conversiones}</div>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-2xl border border-neutral-200/60 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 text-center">
            <div className="flex-1">
              <div className="text-3xl font-light text-[#415364]">{metricas.funnel.visitas}</div>
              <div className="text-[10px] font-bold uppercase text-[#415364]/50 tracking-widest mt-1">Visitas Web</div>
            </div>
            <div className="hidden md:block text-[#415364]/20">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </div>
            <div className="flex-1">
              <div className="text-3xl font-light text-[#415364]">{metricas.funnel.scroll50}</div>
              <div className="text-[10px] font-bold uppercase text-[#415364]/50 tracking-widest mt-1">Navegación +50%</div>
            </div>
            <div className="hidden md:block text-[#415364]/20">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </div>
            <div className="flex-1">
              <div className="text-3xl font-bold text-[#415364]">{metricas.funnel.intentosContacto}</div>
              <div className="text-[10px] font-bold uppercase text-[#415364]/70 tracking-widest mt-1">Intento Contacto</div>
              <div className="text-[8px] text-[#415364]/40 mt-1 font-medium">(WhatsApp o Registros)</div>
            </div>
            <div className="hidden md:block text-[#ea0029]/30">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
            </div>
            <div className="flex-1 bg-[#ea0029]/5 p-3 rounded-xl border border-[#ea0029]/10">
              <div className="text-3xl font-bold text-[#ea0029]">{metricas.funnel.registros}</div>
              <div className="text-[10px] font-bold uppercase text-[#ea0029]/70 tracking-widest mt-1">Conversiones</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-sm overflow-hidden w-full">
            <div className="overflow-x-auto custom-scrollbar w-full">
              <table className="w-full min-w-[1000px] text-left">
                <thead className="bg-[#21242E] border-b border-neutral-200">
                  <tr>
                    <th className="p-5 text-[9px] uppercase font-bold text-white tracking-widest">Identidad de Sesión</th>
                    <th className="p-5 text-[9px] uppercase font-bold text-white tracking-widest">Comportamiento</th>
                    <th className="p-5 text-[9px] uppercase font-bold text-white tracking-widest">Fuente</th>
                    <th className="p-5 text-[9px] uppercase font-bold text-white tracking-widest">Score / Intención</th>
                    <th className="p-5 text-center text-[9px] uppercase font-bold text-white tracking-widest">Análisis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {cargandoWeb && (
                    <tr><td colSpan={5} className="p-10 text-center text-[#415364]/40 font-bold uppercase tracking-widest text-[10px] animate-pulse">Analizando huellas digitales...</td></tr>
                  )}
                  {!cargandoWeb && visitantesAgrupados.map((v) => (
                    <React.Fragment key={v.visitor_id}>
                      <tr className="hover:bg-[#dce3eb]/30 transition-colors">
                        <td className="p-5">
                          <div className="font-bold text-sm text-[#415364] whitespace-nowrap">
                            {v.email && (
                              <span className="text-green-700 bg-green-50 px-2.5 py-1 rounded-md border border-green-200 text-xs">✓ {v.email}</span>
                            )}
                            {!v.email && (
                              <span className="text-neutral-500">Anónimo #{v.visitor_id.substring(0,6)}</span>
                            )}
                          </div>
                          <div className="text-[10px] text-[#415364]/50 mt-2 font-medium">Últ. Act: {v.ultimaActividad.toLocaleString('es-EC')}</div>
                        </td>
                        <td className="p-5">
                          <div className="text-xs font-bold text-[#415364] whitespace-nowrap">{v.sesiones.size} Sesiones · {v.tiempoAcumuladoMin} min</div>
                          <div className="text-[10px] text-[#415364]/50 mt-1.5 font-medium">{v.eventos.length} interacciones</div>
                        </td>
                        <td className="p-5">
                          <span className="text-[10px] bg-[#dce3eb]/50 border border-[#415364]/10 px-2.5 py-1.5 rounded-md text-[#415364] font-mono font-bold whitespace-nowrap">{v.fuentePrincipal}</span>
                        </td>
                        <td className="p-5">
                          <span className={`text-[10px] font-bold px-2.5 py-1.5 rounded-md tracking-wider flex w-fit items-center gap-1.5 whitespace-nowrap ${v.nivelInteraccion === 'ALTO' ? 'bg-[#ea0029]/10 text-[#ea0029] border border-[#ea0029]/20' : v.nivelInteraccion === 'MEDIO' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-[#415364]/5 text-[#415364]/60 border border-[#415364]/10'}`}>
                            {v.nivelInteraccion === 'ALTO' && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                            {v.nivelInteraccion} ({v.score} pts)
                          </span>
                        </td>
                        <td className="p-5 text-center">
                          <button onClick={() => setVisitanteExpandido(visitanteExpandido === v.visitor_id ? null : v.visitor_id)} className="text-[10px] font-bold text-[#415364] hover:text-white bg-[#415364]/10 hover:bg-[#415364] px-4 py-2 rounded-lg uppercase tracking-widest transition-colors whitespace-nowrap">
                            {visitanteExpandido === v.visitor_id ? 'Ocultar' : 'Revisar'}
                          </button>
                        </td>
                      </tr>

                      {visitanteExpandido === v.visitor_id && (
                        <tr className="bg-[#F9F7F5] shadow-inner">
                          <td colSpan={5} className="p-6 md:p-8">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#415364]/40 mb-5 pl-2">Huella de Eventos</h4>
                            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-[#415364]/10">
                              {v.eventos.map((evento) => (
                                <div key={evento.id} className="relative flex items-center group">
                                  <div className="flex items-center justify-center w-2.5 h-2.5 rounded-full border-[2px] border-[#F9F7F5] bg-[#415364]/30 z-10 ml-4 mr-5 shrink-0"></div>
                                  <div className="bg-white p-4 rounded-xl border border-[#415364]/10 shadow-sm w-full md:w-1/2 flex justify-between items-center hover:border-[#415364]/30 transition-colors">
                                    <div>
                                      <span className="text-xs font-bold text-[#415364]">{formatAccionTexto(evento.accion)}</span>
                                      <span className="text-[10px] text-[#415364]/60 block mt-1 font-medium">{evento.detalle}</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-[#ea0029] whitespace-nowrap bg-[#ea0029]/10 border border-[#ea0029]/20 px-2 py-1 rounded-md shrink-0">
                                      {formatTiempoAtras(new Date(evento.created_at))}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}