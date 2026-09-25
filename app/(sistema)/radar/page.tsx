'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

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

export default function RadarCentral() {
  const [pestañaActiva, setPestañaActiva] = useState('solicitudes'); 
  
  // ESTADOS PESTAÑA 1: SOLICITUDES VIP
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [cargandoSolicitudes, setCargandoSolicitudes] = useState(true);
  const [tiemposSeleccionados, setTiemposSeleccionados] = useState<Record<string, string>>({});
  const [ticker, setTicker] = useState(0); 

  // ESTADOS PESTAÑA 2: RADAR INVENTARIO
  const [sesiones, setSesiones] = useState<SesionCliente[]>([]);
  const [cargandoRadar, setCargandoRadar] = useState(true);
  const [sesionExpandida, setSesionExpandida] = useState<string | null>(null);

  // ESTADOS PESTAÑA 3: ACTIVIDAD WEB
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
    cargarSolicitudes();
    cargarRadar();
    cargarActividadWeb();
  };

  // ==========================================
  // LÓGICA PESTAÑA 1: SOLICITUDES VIP
  // ==========================================
  const cargarSolicitudes = async () => {
    setCargandoSolicitudes(true);
    try {
      const { data: clientesData, error: errClientes } = await supabase
        .from('clientes')
        .select('*')
        .eq('origen', 'Web Pública - Solicitud Acceso Exclusivo')
        .order('created_at', { ascending: false })
        .limit(100);

      if (errClientes) throw errClientes;

      if (clientesData && clientesData.length > 0) {
        const emails = clientesData.map(c => c.email?.toLowerCase().trim()).filter(Boolean);
        let mapaAccesos: Record<string, string> = {};

        if (emails.length > 0) {
          const { data: accesosData } = await supabase
            .from('accesos_inventario')
            .select('email, expira_en')
            .in('email', emails);

          if (accesosData) {
            accesosData.forEach(acc => {
              mapaAccesos[acc.email] = acc.expira_en;
            });
          }
        }

        const solicitudesCompletas = clientesData.map(c => ({
          ...c,
          expira_en: c.email ? mapaAccesos[c.email.toLowerCase().trim()] : null
        }));

        setSolicitudes(solicitudesCompletas);
        const tiemposInit: Record<string, string> = {};
        solicitudesCompletas.forEach(c => { tiemposInit[c.id] = '24'; });
        setTiemposSeleccionados(tiemposInit);
      } else {
        setSolicitudes([]);
      }
    } catch (error) {
      console.error("Error al cargar solicitudes:", error);
    } finally {
      setCargandoSolicitudes(false);
    }
  };

  const calcularTiempoRestante = (expiraEn?: string | null) => {
    if (!expiraEn) return { estado: 'sin_pase', texto: 'Sin pase generado' };
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
      ? `¿Estás seguro de darle acceso ILIMITADO a ${cliente.nombres}?`
      : esRenovacion 
        ? `¿Renovar el acceso de ${cliente.nombres} por ${horasStr} horas?`
        : `¿Estás seguro de aprobar el acceso a ${cliente.nombres} por ${horasStr} horas?`;

    const confirmar = window.confirm(mensaje);
    if (!confirmar) return; 

    try {
      const fechaExpiracion = new Date();
      fechaExpiracion.setHours(fechaExpiracion.getHours() + horasNum);

      const { data: dataPase, error: errorPase } = await supabase
        .from('accesos_inventario')
        .upsert({ 
          email: cliente.email.toLowerCase().trim(), 
          expira_en: fechaExpiracion.toISOString() 
        })
        .select();

      if (errorPase) throw errorPase;
      if (!dataPase || dataPase.length === 0) {
        alert("⚠️ ATENCIÓN: Supabase bloqueó la creación del Pase VIP por seguridad. Revisa los permisos.");
        return;
      }

      const { data: dataCliente, error: errorCliente } = await supabase
        .from('clientes')
        .update({ estado_acceso: 'aprobado' }) 
        .eq('id', cliente.id)
        .select();

      if (errorCliente) throw errorCliente;

      setSolicitudes((prev) => 
        prev.map((c) => c.id === cliente.id ? { ...c, estado_acceso: 'aprobado', expira_en: fechaExpiracion.toISOString() } : c)
      );
      
      alert(`Acceso activado correctamente para ${cliente.nombres}.`);
      
    } catch (error) {
      console.error("Error detallado al generar pase VIP:", error);
      alert("Hubo un error de conexión con la base de datos.");
    }
  };

  const enviarCorreo = async (cliente: any) => {
    const horas = tiemposSeleccionados[cliente.id] || '24';
    alert(`Iniciando envío a ${cliente.email}... Por favor espera un momento.`);
    try {
      const response = await fetch('/api/enviar-acceso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cliente.email, nombres: cliente.nombres, horas: horas }),
      });
      if (response.ok) {
        alert("Correo corporativo enviado con éxito.");
      } else {
        alert("Hubo un problema de conexión con el servidor de correos de Hostinger.");
      }
    } catch (error) {
      alert("Error en el sistema al intentar enviar el correo.");
    }
  };

  const solicitarTelefonoCorrecto = (cliente: any) => {
    if (!cliente.email) {
      alert("No hay un correo registrado para este cliente.");
      return;
    }
    const asunto = encodeURIComponent("Arienzo Boutique Living - Actualización de Contacto");
    const cuerpo = encodeURIComponent(`Hola ${cliente.nombres},\n\nGracias por su interés en Arienzo Boutique Living.\n\nHemos intentado comunicarnos al número de teléfono registrado (${cliente.telefono || 'sin número'}), pero parece no estar disponible o ser incorrecto.\n\nPara poder otorgarle su Pase VIP y enviarle la lista de precios e inventario, por favor indíquenos su número de WhatsApp actual respondiendo a este correo.\n\nQuedamos a la espera de su respuesta.\n\nSaludos cordiales,\nEquipo Comercial Arienzo\nKonkeri Real Estate`);
    
    window.location.href = `mailto:${cliente.email}?subject=${asunto}&body=${cuerpo}`;
  };

  const abrirWhatsApp = (telefono: string, nombres: string) => {
    if (!telefono) { alert("Este cliente no tiene un teléfono registrado."); return; }
    
    let numLimpio = telefono.split('').filter(char => char >= '0' && char <= '9').join('');
    
    if (numLimpio.startsWith('0') && numLimpio.length === 10) {
      numLimpio = '593' + numLimpio.substring(1);
    } else if (numLimpio.length === 9) {
      numLimpio = '593' + numLimpio;
    }

    const mensaje = `Hola ${nombres}, soy Saúl de Konkeri. Hemos validado tu perfil y tu acceso exclusivo al inventario de Arienzo Boutique Living está listo. Puedes ingresar aquí: https://reserva.arienzoliving.com con tu correo.`;
    window.open(`https://wa.me/${numLimpio}?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  // ==========================================
  // LÓGICA PESTAÑA 2: RADAR INVENTARIO
  // ==========================================
  const generarAnalisisComercial = (sesion: SesionCliente) => {
    if (sesion.eventos.length === 0) return "Sin datos suficientes para analizar.";
    let analisis = "";
    if (sesion.minutos < 2) analisis += "Vistazo rápido. Exploró superficialmente. ";
    else if (sesion.minutos < 10) analisis += "Exploración moderada. Navegó por el inventario de manera fluida. ";
    else analisis += "Alto nivel de interés. Analizó el proyecto detalladamente y revisó varias opciones. ";

    const filtros = sesion.eventos.filter(e => e.accion === 'USO_FILTRO');
    if (filtros.length > 0) {
      const ultFiltro = filtros[0].detalle ? filtros[0].detalle.split('Buscó: ').join('') : '';
      analisis += `Mostró inclinación por la tipología de ${ultFiltro}. `;
    }

    if (sesion.unidadesVistas.length === 1) analisis += `Se enfocó exclusivamente en la unidad ${sesion.unidadesVistas[0]}. `;
    else if (sesion.unidadesVistas.length > 1) analisis += `Comparó ${sesion.unidadesVistas.length} unidades (${sesion.unidadesVistas.join(', ')}). `;

    const reserva = sesion.eventos.some(e => e.accion === 'RESERVA_COMPLETADA');
    if (reserva) analisis += "Alerta de Cierre: Completó un bloqueo web de forma autónoma. ";

    return analisis;
  };

  const cargarRadar = async () => {
    setCargandoRadar(true);
    try {
      const { data } = await supabase
        .from('tracking_inventario')
        .select('*')
        .not('accion', 'in', '("SOLICITUD_ACCESO_VIP","ABRIO_CALENDLY","VISITA_LANDING","ABRIO_FORMULARIO","CLIC_WHATSAPP","REGISTRO_COMPLETADO","CLIC_DISPONIBILIDAD","DESCARGA_BROCHURE")')
        .not('accion', 'like', 'SCROLL_%')
        .not('accion', 'like', 'VIO_%')
        .not('detalle', 'ilike', '%LANDING%') 
        .order('created_at', { ascending: false })
        .limit(500);

      if (data) {
        const datosCronologicos = [...data].reverse();
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
              idSesion: `${email}-${tiempoActual}`,
              email: email,
              inicio: fechaRow,
              fin: fechaRow,
              minutos: 0,
              eventos: [row],
              ultimaAccion: '',
              unidadesVistas: row.unidad_id ? [row.unidad_id] : []
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
    'VISITA_LANDING': 1,
    'SCROLL_50': 2,
    'SCROLL_90': 3,
    'VIO_ARQUITECTURA': 2,
    'ABRIO_FORMULARIO': 6,
    'ABRIO_CALENDLY': 8,
    'CLIC_WHATSAPP': 10,
    'DESCARGA_BROCHURE': 12,
    'REGISTRO_COMPLETADO': 15,
  };

  const cargarActividadWeb = async () => {
    setCargandoWeb(true);
    try {
      const fechaLimite = new Date();
      if (filtroTiempo === '7d') fechaLimite.setDate(fechaLimite.getDate() - 7);
      if (filtroTiempo === '30d') fechaLimite.setDate(fechaLimite.getDate() - 30);
      if (filtroTiempo === 'hoy') fechaLimite.setHours(0,0,0,0);

      const { data, error } = await supabase
        .from('tracking_inventario')
        .select('*')
        .gte('created_at', fechaLimite.toISOString())
        .order('created_at', { ascending: true });

      if (error) console.error("Error al cargar actividad:", error);

      if (data) {
        setEventosWeb(data);
        procesarVisitantes(data);
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
          email: ev.email_cliente && ev.email_cliente.includes('@') ? ev.email_cliente : null,
          primeraVisita: new Date(ev.created_at),
          ultimaActividad: new Date(ev.created_at),
          sesiones: new Set([ev.session_id || 'sesion-unica']),
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
      if (fechaEvento > visitante.ultimaActividad) {
          visitante.ultimaActividad = fechaEvento;
      }
      
      if (ev.email_cliente && ev.email_cliente.includes('@')) {
          visitante.email = ev.email_cliente;
      }
      
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
      intentosContacto: eventosWeb.filter(e => ['ABRIO_FORMULARIO', 'ABRIO_CALENDLY', 'CLIC_WHATSAPP'].includes(e.accion)).length,
      registros: conversiones
    };

    return { unicos, totalSesiones, recurrentes, altoInteres, conversiones, funnel };
  }, [visitantesAgrupados, eventosWeb]);


  return (
    <div className="p-4 md:p-8 w-full max-w-7xl mx-auto bg-[#dce3eb] min-h-screen font-sans text-[#415364]">
      
      {/* ENCABEZADO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 border-b border-[#415364]/10 pb-6">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-[#ea0029] uppercase">Analítica y Accesos</span>
          <h1 className="text-3xl md:text-4xl font-bold text-[#415364] tracking-tight mt-1">Radar Digital</h1>
          <p className="text-sm text-[#415364]/70 mt-1">Monitoreo de actividad web y gestión de accesos exclusivos al inventario.</p>
        </div>
        <button 
          onClick={cargarDatos}
          className="bg-white border border-[#415364]/20 text-[#415364] px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#415364]/5 transition-colors shadow-sm flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          Refrescar Datos
        </button>
      </div>

      {/* PESTAÑAS (TABS) */}
      <div className="flex overflow-x-auto bg-[#dce3eb]/50 p-1.5 rounded-xl shadow-inner border border-[#415364]/10 mb-8 w-full md:w-fit custom-scrollbar">
        <button 
          onClick={() => setPestañaActiva('solicitudes')}
          className={`flex-1 md:flex-auto whitespace-nowrap px-6 py-2.5 rounded-lg text-xs font-bold transition-all flex justify-center items-center gap-2 ${
            pestañaActiva === 'solicitudes' ? 'bg-white text-[#ea0029] shadow-sm' : 'text-[#415364]/70 hover:text-[#415364]'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg>
          Pases VIP
          {solicitudes.filter(s => calcularTiempoRestante(s.expira_en).estado !== 'activo').length > 0 && (
            <span className="bg-[#ea0029] text-white text-[9px] px-2 py-0.5 rounded-md ml-1">
              {solicitudes.filter(s => calcularTiempoRestante(s.expira_en).estado !== 'activo').length}
            </span>
          )}
        </button>
        <button 
          onClick={() => setPestañaActiva('inventario')}
          className={`flex-1 md:flex-auto whitespace-nowrap px-6 py-2.5 rounded-lg text-xs font-bold transition-all flex justify-center items-center gap-2 ${
            pestañaActiva === 'inventario' ? 'bg-white text-[#ea0029] shadow-sm' : 'text-[#415364]/70 hover:text-[#415364]'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          Radar Unidades
        </button>
        <button 
          onClick={() => setPestañaActiva('web')}
          className={`flex-1 md:flex-auto whitespace-nowrap px-6 py-2.5 rounded-lg text-xs font-bold transition-all flex justify-center items-center gap-2 ${
            pestañaActiva === 'web' ? 'bg-white text-[#ea0029] shadow-sm' : 'text-[#415364]/70 hover:text-[#415364]'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>
          Trazabilidad Web
        </button>
      </div>

      {/* ========================================================= */}
      {/* PESTAÑA 1: SOLICITUDES VIP */}
      {/* ========================================================= */}
      {pestañaActiva === 'solicitudes' && (
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200/60 overflow-hidden animate-in fade-in slide-in-from-bottom-2 w-full">
          <div className="px-6 py-5 border-b border-neutral-100 flex justify-between items-center bg-[#21242E]">
            <h3 className="text-sm font-bold text-white tracking-widest uppercase flex items-center gap-2">
              Gestión de Accesos al Inventario
            </h3>
          </div>
          
          <div className="overflow-x-auto custom-scrollbar w-full">
            <table className="w-full min-w-[950px] text-left text-sm text-[#415364]">
              <thead className="bg-neutral-50/50 text-[#415364]/60 text-[10px] uppercase tracking-widest border-b border-neutral-100">
                <tr>
                  <th className="px-6 py-4 font-bold">Inversionista</th>
                  <th className="px-6 py-4 font-bold">Estado del Pase</th>
                  <th className="px-6 py-4 font-bold">Contacto</th>
                  <th className="px-6 py-4 font-bold text-right">Gestión Rápida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {cargandoSolicitudes ? (
                  <tr><td colSpan={4} className="px-6 py-10 text-center text-[#415364]/40 font-bold uppercase tracking-widest text-[10px]">Cargando datos en vivo...</td></tr>
                ) : solicitudes.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-10 text-center text-[#415364]/40 font-bold uppercase tracking-widest text-[10px]">No hay solicitudes pendientes.</td></tr>
                ) : (
                  solicitudes.map((cliente) => {
                    const statusTiempo = calcularTiempoRestante(cliente.expira_en);
                    const activo = statusTiempo.estado === 'activo';
                    const caducado = statusTiempo.estado === 'caducado';

                    return (
                      <tr key={cliente.id} className={`transition-colors ${activo ? 'bg-green-50/10' : caducado ? 'bg-[#ea0029]/5' : 'hover:bg-[#dce3eb]/30'}`}>
                        <td className="px-6 py-4">
                          <div className="font-bold text-[#415364] whitespace-nowrap">{cliente.nombres}</div>
                          <div className="text-[10px] text-[#415364]/50 mt-0.5">Ingresó: {new Date(cliente.created_at).toLocaleDateString('es-EC')}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center text-[9px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border whitespace-nowrap ${
                            activo ? 'bg-green-50 text-green-700 border-green-200' : 
                            caducado ? 'bg-[#ea0029]/10 text-[#ea0029] border-[#ea0029]/20' : 
                            'bg-[#dce3eb]/50 text-[#415364]/60 border-[#415364]/10'
                          }`}>
                            {statusTiempo.texto}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-[#415364] font-mono text-[11px] font-medium">{cliente.email}</div>
                          <div className="text-[#415364]/60 font-mono text-[10px]">{cliente.telefono}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <select 
                              className="bg-white border border-[#415364]/20 text-[#415364] rounded-lg text-[10px] p-2 focus:outline-none focus:border-[#ea0029] font-bold outline-none cursor-pointer"
                              value={tiemposSeleccionados[cliente.id] || '24'}
                              onChange={(e) => handleTiempoChange(cliente.id, e.target.value)}
                            >
                              <option value="2">2 hrs</option>
                              <option value="12">12 hrs</option>
                              <option value="24">24 hrs</option>
                              <option value="48">48 hrs</option>
                              <option value="999">Ilimitado</option>
                            </select>
                            
                            <button 
                              onClick={() => aprobarAcceso(cliente)} 
                              className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm text-white whitespace-nowrap ${
                                activo ? 'bg-[#415364] hover:bg-[#21242E]' : 'bg-[#ea0029] hover:bg-[#c90022]'
                              }`}
                            >
                              {activo ? 'Renovar' : 'Aprobar'}
                            </button>

                            <button onClick={() => enviarCorreo(cliente)} className="bg-[#dce3eb]/50 text-[#415364] hover:bg-[#415364]/10 border border-[#415364]/10 px-3 py-2 rounded-lg transition-colors shadow-sm flex items-center justify-center" title="Enviar Email Pase">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                            </button>
                            
                            <button onClick={() => solicitarTelefonoCorrecto(cliente)} className="bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200 px-3 py-2 rounded-lg transition-colors shadow-sm flex items-center justify-center" title="Solicitar Teléfono Correcto (Email)">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                            </button>
                            
                            <button onClick={() => abrirWhatsApp(cliente.telefono, cliente.nombres)} className="bg-[#25D366]/10 border border-[#25D366]/30 text-[#1DA851] hover:bg-[#25D366]/20 px-3 py-2 rounded-lg transition-colors flex items-center justify-center" title="Escribir por WhatsApp">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
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

      {/* ========================================================= */}
      {/* PESTAÑA 2: RADAR INVENTARIO */}
      {/* ========================================================= */}
      {pestañaActiva === 'inventario' && (
        <div className="bg-white border border-neutral-200/60 rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 w-full">
          {cargandoRadar && sesiones.length === 0 ? (
            <div className="p-10 text-center text-[#415364]/40 font-bold uppercase tracking-widest text-[10px]">Cargando lecturas del radar...</div>
          ) : (
            
            <div className="overflow-x-auto custom-scrollbar w-full">
              <table className="w-full min-w-[1000px] text-left border-collapse">
                <thead>
                  <tr className="bg-[#21242E] text-white">
                    <th className="p-5 text-[10px] uppercase tracking-widest font-bold">Prospecto Monitorizado</th>
                    <th className="p-5 text-[10px] uppercase tracking-widest font-bold">Estadía</th>
                    <th className="p-5 text-[10px] uppercase tracking-widest font-bold">Inventario Visto</th>
                    <th className="p-5 text-[10px] uppercase tracking-widest font-bold">Última Acción</th>
                    <th className="p-5 text-[10px] uppercase tracking-widest font-bold text-center">Trazabilidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {sesiones.map((sesion) => (
                    <React.Fragment key={sesion.idSesion}>
                      <tr className="hover:bg-[#dce3eb]/30 transition-colors">
                        <td className="p-5">
                          <span className="font-bold text-[#415364] flex items-center gap-1.5 text-sm whitespace-nowrap">
                            {sesion.nombre ? (
                              <>{sesion.nombre} <svg className="w-3.5 h-3.5 text-[#1DA851]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg></>
                            ) : ( 'Visitante Anónimo' )}
                          </span>
                          <span className="text-[10px] text-[#415364]/60 font-mono block mt-1">{sesion.email}</span>
                          <span className="text-[9px] text-[#415364]/40 mt-1.5 block font-bold uppercase tracking-wider">
                            {new Date().getTime() - sesion.fin.getTime() > 86400000 
                              ? new Date(sesion.fin).toLocaleDateString('es-EC', {day: '2-digit', month:'short'}) 
                              : `Hace ${Math.round((new Date().getTime() - sesion.fin.getTime()) / 60000)} min`}
                          </span>
                        </td>
                        <td className="p-5">
                          <span className="bg-[#dce3eb]/50 text-[#415364] border border-[#415364]/10 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                            {sesion.minutos === 0 ? '< 1 min' : `${sesion.minutos} min`}
                          </span>
                        </td>
                        <td className="p-5">
                          <div className="flex gap-1.5 flex-wrap min-w-[150px]">
                            {sesion.unidadesVistas.length > 0 ? (
                              sesion.unidadesVistas.map(u => (
                                <span key={u} className="bg-white border border-[#415364]/20 text-[#415364] text-[9px] font-bold px-2 py-1 rounded-md shadow-sm">U-{u}</span>
                              ))
                            ) : ( <span className="text-xs text-[#415364]/30">-</span> )}
                          </div>
                        </td>
                        <td className="p-5">
                          <span className="text-xs font-medium text-[#415364]/80 whitespace-nowrap">{sesion.ultimaAccion}</span>
                        </td>
                        <td className="p-5 text-center">
                          <button onClick={() => setSesionExpandida(sesionExpandida === sesion.idSesion ? null : sesion.idSesion)} className="text-[10px] font-bold text-[#ea0029] hover:text-[#c90022] bg-[#ea0029]/10 px-3 py-1.5 rounded-lg uppercase tracking-widest transition-colors whitespace-nowrap">
                            {sesionExpandida === sesion.idSesion ? 'Ocultar' : 'Detalles'}
                          </button>
                        </td>
                      </tr>
                      
                      {sesionExpandida === sesion.idSesion && (
                        <tr className="bg-[#F9F7F5] shadow-inner">
                          <td colSpan={5} className="p-6 md:p-8">
                            <div className="mb-8 bg-white border border-[#ea0029]/20 rounded-2xl p-5 shadow-sm flex items-start gap-4">
                              <div className="bg-[#ea0029]/10 text-[#ea0029] w-12 h-12 rounded-full flex items-center justify-center shrink-0">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                              </div>
                              <div>
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#ea0029] mb-1.5">Inteligencia Comercial</h4>
                                <p className="text-sm text-[#415364] leading-relaxed font-medium">{generarAnalisisComercial(sesion)}</p>
                              </div>
                            </div>
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#415364]/40 mb-5 pl-2">Línea de tiempo de navegación</h4>
                            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[#415364]/20 before:to-transparent">
                              {sesion.eventos.map((evento, i) => (
                                <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                  <div className="flex items-center justify-center w-2.5 h-2.5 rounded-full border-[2px] border-white bg-[#ea0029] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm sm:mx-0 mx-4 z-10"></div>
                                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] bg-white p-4 rounded-xl border border-[#415364]/10 shadow-sm flex flex-col hover:border-[#ea0029]/40 hover:shadow-md transition-all">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-[10px] font-bold text-[#415364]/50">{new Date(evento.created_at).toLocaleTimeString('es-EC')}</span>
                                      {evento.unidad_id && <span className="text-[9px] bg-[#dce3eb]/50 text-[#415364] border border-[#415364]/10 font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">Unidad {evento.unidad_id}</span>}
                                    </div>
                                    <span className="text-xs font-bold text-[#415364]">{evento.accion.split('_').join(' ')}</span>
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
                    <tr><td colSpan={5} className="p-10 text-center text-[#415364]/40 font-bold uppercase tracking-widest text-[10px]">Aún no hay actividad registrada en el inventario.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* PESTAÑA 3: ACTIVIDAD WEB (LANDING) */}
      {/* ========================================================= */}
      {pestañaActiva === 'web' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 w-full">
          
          <div className="flex justify-end gap-2 bg-white w-fit ml-auto p-1.5 rounded-xl shadow-sm border border-neutral-200/60">
            {['hoy', '7d', '30d'].map(f => (
              <button 
                key={f} 
                onClick={() => setFiltroTiempo(f)}
                className={`px-4 py-2 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-colors ${filtroTiempo === f ? 'bg-[#415364] text-white shadow-sm' : 'bg-transparent text-[#415364]/60 hover:text-[#415364]'}`}
              >
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
                <svg className="w-3 h-3 text-[#ea0029]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
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
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </div>
            <div className="flex-1">
              <div className="text-3xl font-light text-[#415364]">{metricas.funnel.scroll50}</div>
              <div className="text-[10px] font-bold uppercase text-[#415364]/50 tracking-widest mt-1">Navegación +50%</div>
            </div>
            <div className="hidden md:block text-[#415364]/20">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </div>
            <div className="flex-1">
              <div className="text-3xl font-bold text-[#415364]">{metricas.funnel.intentosContacto}</div>
              <div className="text-[10px] font-bold uppercase text-[#415364]/70 tracking-widest mt-1">Intento Contacto</div>
              <div className="text-[8px] text-[#415364]/40 mt-1 font-medium">(WhatsApp o Accesos)</div>
            </div>
            <div className="hidden md:block text-[#ea0029]/30">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path></svg>
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
                  {cargandoWeb ? (
                    <tr><td colSpan={5} className="p-10 text-center text-[#415364]/40 font-bold uppercase tracking-widest text-[10px]">Analizando huellas digitales...</td></tr>
                  ) : visitantesAgrupados.map((v) => (
                    <React.Fragment key={v.visitor_id}>
                      <tr className="hover:bg-[#dce3eb]/30 transition-colors">
                        <td className="p-5">
                          <div className="font-bold text-sm text-[#415364] whitespace-nowrap">
                            {v.email ? (
                              <span className="text-green-700 bg-green-50 px-2.5 py-1 rounded-md border border-green-200 text-xs">✓ {v.email}</span>
                            ) : (
                              `Anónimo #${v.visitor_id.substring(0,6)}`
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
                          <span className={`text-[10px] font-bold px-2.5 py-1.5 rounded-md tracking-wider flex w-fit items-center gap-1.5 whitespace-nowrap ${
                            v.nivelInteraccion === 'ALTO' ? 'bg-[#ea0029]/10 text-[#ea0029] border border-[#ea0029]/20' : 
                            v.nivelInteraccion === 'MEDIO' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 
                            'bg-[#415364]/5 text-[#415364]/60 border border-[#415364]/10'
                          }`}>
                            {v.nivelInteraccion === 'ALTO' && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>}
                            {v.nivelInteraccion} ({v.score} pts)
                          </span>
                        </td>
                        <td className="p-5 text-center">
                          <button 
                            onClick={() => setVisitanteExpandido(visitanteExpandido === v.visitor_id ? null : v.visitor_id)}
                            className="text-[10px] font-bold text-[#415364] hover:text-white bg-[#415364]/10 hover:bg-[#415364] px-4 py-2 rounded-lg uppercase tracking-widest transition-colors whitespace-nowrap"
                          >
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
                                      <span className="text-xs font-bold text-[#415364]">{evento.accion.split('_').join(' ')}</span>
                                      <span className="text-[10px] text-[#415364]/60 block mt-1 font-medium">{evento.detalle}</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-[#415364]/40 whitespace-nowrap bg-[#dce3eb]/30 px-2 py-1 rounded-md shrink-0">
                                      {new Date(evento.created_at).toLocaleTimeString('es-EC', {hour: '2-digit', minute:'2-digit'})}
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