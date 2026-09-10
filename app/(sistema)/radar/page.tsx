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
  nivelInteraccion: '🔥 ALTO' | '⚡ MEDIO' | '🧊 BAJO';
};

export default function RadarCentral() {
  const [pestañaActiva, setPestañaActiva] = useState('solicitudes'); 
  
  // ESTADOS PESTAÑA 1: SOLICITUDES VIP
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [cargandoSolicitudes, setCargandoSolicitudes] = useState(true);
  const [tiemposSeleccionados, setTiemposSeleccionados] = useState<Record<string, string>>({});
  // Para forzar la actualización del cronómetro cada minuto
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
    // Inicia un reloj interno para actualizar los tiempos de expiración cada 60 segundos
    const intervalo = setInterval(() => setTicker(t => t + 1), 60000);
    return () => clearInterval(intervalo);
  }, [filtroTiempo]);

  const cargarDatos = () => {
    cargarSolicitudes();
    cargarRadar();
    cargarActividadWeb();
  };

  // ==========================================
  // LÓGICA PESTAÑA 1: SOLICITUDES VIP (MEJORADA CON TIEMPOS)
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
        // Obtenemos los correos para buscar si tienen pase VIP en la tabla accesos_inventario
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

        // Combinamos la información
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
    if (diff <= 0) return { estado: 'caducado', texto: '⚠️ Caducado' };
    
    const horas = Math.floor(diff / 3600000);
    const min = Math.floor((diff % 3600000) / 60000);
    
    if (horas > 800) return { estado: 'activo', texto: '⚡ Acceso Ilimitado' };
    return { estado: 'activo', texto: `⏱️ Vence en ${horas}h ${min}m` };
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

      // 1. FORZAMOS EL RECIBO DE LA TABLA ACCESOS_INVENTARIO
      const { data: dataPase, error: errorPase } = await supabase
        .from('accesos_inventario')
        .upsert({ 
          email: cliente.email.toLowerCase().trim(), 
          expira_en: fechaExpiracion.toISOString() 
        })
        .select();

      if (errorPase) throw errorPase;
      if (!dataPase || dataPase.length === 0) {
        alert("⚠️ ATENCIÓN: Supabase bloqueó la creación del Pase VIP por seguridad. Apaga el RLS de la tabla 'accesos_inventario'.");
        return;
      }

      // 2. FORZAMOS EL RECIBO DE LA TABLA CLIENTES
      const { data: dataCliente, error: errorCliente } = await supabase
        .from('clientes')
        .update({ estado_acceso: 'aprobado' }) 
        .eq('id', cliente.id)
        .select();

      if (errorCliente) throw errorCliente;
      if (!dataCliente || dataCliente.length === 0) {
        alert("⚠️ ATENCIÓN: Supabase bloqueó la actualización de estado por seguridad. Apaga el RLS de la tabla 'clientes'.");
        return;
      }

      // SI LLEGÓ AQUÍ, FUE UN ÉXITO REAL. ACTUALIZAMOS LA PANTALLA.
      setSolicitudes((prev) => 
        prev.map((c) => c.id === cliente.id ? { ...c, estado_acceso: 'aprobado', expira_en: fechaExpiracion.toISOString() } : c)
      );
      
      alert(`✅ ¡Listo! Acceso activado correctamente para ${cliente.nombres}.`);
      
    } catch (error) {
      console.error("Error detallado al generar pase VIP:", error);
      alert("❌ Hubo un error crítico de conexión con la base de datos.");
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
        alert("¡Correo corporativo enviado con éxito!");
      } else {
        alert("Hubo un problema de conexión con el servidor de correos de Hostinger.");
      }
    } catch (error) {
      alert("Error en el sistema al intentar enviar el correo.");
    }
  };

  const abrirWhatsApp = (telefono: string, nombres: string) => {
    if (!telefono) { alert("Este cliente no tiene un teléfono registrado."); return; }
    
    let numLimpio = telefono.replace(/\D/g, '');
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
    else if (sesion.minutos < 10) analisis += "Exploración moderada. Navegó por el inventario. ";
    else analisis += "Alto nivel de interés. Analizó el proyecto detalladamente. ";

    const filtros = sesion.eventos.filter(e => e.accion === 'USO_FILTRO');
    if (filtros.length > 0) {
      const ultFiltro = filtros[0].detalle?.replace('Buscó: ', '') || '';
      analisis += `Mostró inclinación por la tipología de ${ultFiltro}. `;
    }

    if (sesion.unidadesVistas.length === 1) analisis += `Se enfocó exclusivamente en la unidad ${sesion.unidadesVistas[0]}. `;
    else if (sesion.unidadesVistas.length > 1) analisis += `Comparó ${sesion.unidadesVistas.length} unidades (${sesion.unidadesVistas.join(', ')}). `;

    const reserva = sesion.eventos.some(e => e.accion === 'RESERVA_COMPLETADA');
    if (reserva) analisis += "🎯 ¡ALERTA DE CIERRE! Completó un bloqueo web. ";

    return analisis;
  };

  const cargarRadar = async () => {
    setCargandoRadar(true);
    try {
      const { data } = await supabase
        .from('tracking_inventario')
        .select('*')
        .not('accion', 'in', '("SOLICITUD_ACCESO_VIP","ABRIO_CALENDLY","VISITA_LANDING","ABRIO_FORMULARIO","CLIC_WHATSAPP","REGISTRO_COMPLETADO","CLIC_DISPONIBILIDAD")')
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
  // LÓGICA PESTAÑA 3: ACTIVIDAD WEB (LANDING)
  // ==========================================
  const PESOS_EVENTOS: Record<string, number> = {
    'VISITA_LANDING': 1,
    'SCROLL_50': 2,
    'SCROLL_90': 3,
    'VIO_ARQUITECTURA': 2,
    'ABRIO_FORMULARIO': 6,
    'ABRIO_CALENDLY': 8,
    'CLIC_WHATSAPP': 10,
    'REGISTRO_COMPLETADO': 15,
  };

  const cargarActividadWeb = async () => {
    setCargandoWeb(true);
    try {
      const fechaLimite = new Date();
      if (filtroTiempo === '7d') fechaLimite.setDate(fechaLimite.getDate() - 7);
      if (filtroTiempo === '30d') fechaLimite.setDate(fechaLimite.getDate() - 30);
      if (filtroTiempo === 'hoy') fechaLimite.setHours(0,0,0,0);

      const { data } = await supabase
        .from('tracking_inventario')
        .select('*')
        .not('visitor_id', 'is', null) 
        .gte('created_at', fechaLimite.toISOString())
        .order('created_at', { ascending: true });

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
      if (!mapa.has(ev.visitor_id)) {
        mapa.set(ev.visitor_id, {
          visitor_id: ev.visitor_id,
          email: ev.email_cliente?.includes('@') ? ev.email_cliente : null,
          primeraVisita: new Date(ev.created_at),
          ultimaActividad: new Date(ev.created_at),
          sesiones: new Set([ev.session_id]),
          eventos: [],
          tiempoAcumuladoMin: 0,
          score: 0,
          fuentePrincipal: ev.metadata?.utm_source || ev.metadata?.referrer || 'Directo',
          nivelInteraccion: '🧊 BAJO'
        });
      }

      const visitante = mapa.get(ev.visitor_id)!;
      visitante.eventos.push(ev);
      visitante.sesiones.add(ev.session_id);
      visitante.ultimaActividad = new Date(Math.max(visitante.ultimaActividad.getTime(), new Date(ev.created_at).getTime()));
      
      if (ev.email_cliente?.includes('@')) visitante.email = ev.email_cliente;
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

      if (v.score >= 20) v.nivelInteraccion = '🔥 ALTO';
      else if (v.score >= 8) v.nivelInteraccion = '⚡ MEDIO';
      else v.nivelInteraccion = '🧊 BAJO';

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
    const altoInteres = visitantesAgrupados.filter(v => v.nivelInteraccion === '🔥 ALTO').length;
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
    <div className="p-6 md:p-10 max-w-7xl mx-auto bg-[#F4F4F4] min-h-screen font-sans">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-light text-neutral-900 tracking-tight">Centro de Mando Digital</h1>
          <p className="text-sm text-neutral-500 mt-1">Control de accesos VIP y monitoreo de actividad en tiempo real.</p>
        </div>
        <button 
          onClick={cargarDatos}
          className="bg-white border border-neutral-200 text-neutral-700 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-neutral-100 transition-colors shadow-sm flex items-center gap-2"
        >
          ↻ Refrescar Datos
        </button>
      </div>

      <div className="flex overflow-x-auto space-x-1 bg-white p-1 rounded-xl shadow-sm border border-neutral-200 mb-8 w-fit">
        <button 
          onClick={() => setPestañaActiva('solicitudes')}
          className={`whitespace-nowrap px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
            pestañaActiva === 'solicitudes' ? 'bg-[#21242E] text-white shadow' : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
          }`}
        >
          🎯 Solicitudes VIP
          {solicitudes.filter(s => calcularTiempoRestante(s.expira_en).estado !== 'activo').length > 0 && (
            <span className="bg-[#964B36] text-white text-[10px] px-2 py-0.5 rounded-full">
              {solicitudes.filter(s => calcularTiempoRestante(s.expira_en).estado !== 'activo').length}
            </span>
          )}
        </button>
        <button 
          onClick={() => setPestañaActiva('inventario')}
          className={`whitespace-nowrap px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
            pestañaActiva === 'inventario' ? 'bg-[#21242E] text-white shadow' : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
          }`}
        >
          👀 Radar Inventario
        </button>
        <button 
          onClick={() => setPestañaActiva('web')}
          className={`whitespace-nowrap px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
            pestañaActiva === 'web' ? 'bg-[#21242E] text-white shadow' : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
          }`}
        >
          🌐 Actividad Web
        </button>
      </div>

      {pestañaActiva === 'solicitudes' && (
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
          <div className="px-6 py-5 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
            <h3 className="font-bold text-neutral-800">Accesos Web y Control VIP</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-600">
              <thead className="bg-white text-neutral-400 text-xs uppercase tracking-wider border-b">
                <tr>
                  <th className="px-6 py-4 font-medium">Cliente</th>
                  <th className="px-6 py-4 font-medium">Estado del Pase VIP</th>
                  <th className="px-6 py-4 font-medium">Contacto</th>
                  <th className="px-6 py-4 font-medium text-right">Gestión Rápida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {cargandoSolicitudes ? (
                  <tr><td colSpan={4} className="px-6 py-10 text-center text-neutral-400">Cargando datos en vivo...</td></tr>
                ) : solicitudes.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-10 text-center text-neutral-400 font-medium">No hay registros desde la web.</td></tr>
                ) : (
                  solicitudes.map((cliente) => {
                    const statusTiempo = calcularTiempoRestante(cliente.expira_en);
                    const activo = statusTiempo.estado === 'activo';
                    const caducado = statusTiempo.estado === 'caducado';

                    return (
                      <tr key={cliente.id} className={`transition-colors ${activo ? 'bg-green-50/20' : caducado ? 'bg-red-50/20' : 'hover:bg-neutral-50/50'}`}>
                        <td className="px-6 py-4">
                          <div className="font-bold text-neutral-900">{cliente.nombres}</div>
                          <div className="text-[10px] text-neutral-400">Registrado el {new Date(cliente.created_at).toLocaleDateString('es-EC')}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide border ${
                            activo ? 'bg-green-100 text-green-800 border-green-200' : 
                            caducado ? 'bg-red-100 text-red-800 border-red-200' : 
                            'bg-neutral-100 text-neutral-600 border-neutral-200'
                          }`}>
                            {statusTiempo.texto}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-neutral-900 font-mono text-xs">{cliente.email}</div>
                          <div className="text-neutral-500">{cliente.telefono}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <select 
                              className="bg-white border border-neutral-200 text-neutral-700 rounded-lg text-[11px] p-2 focus:outline-none focus:border-[#964B36] font-bold"
                              value={tiemposSeleccionados[cliente.id] || '24'}
                              onChange={(e) => handleTiempoChange(cliente.id, e.target.value)}
                            >
                              <option value="2">2 horas</option>
                              <option value="12">12 horas</option>
                              <option value="24">24 horas</option>
                              <option value="48">48 horas</option>
                              <option value="999">Ilimitado</option>
                            </select>
                            
                            <button 
                              onClick={() => aprobarAcceso(cliente)} 
                              className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm text-white ${
                                activo ? 'bg-[#D1C292] hover:bg-[#bfae7e]' : 'bg-neutral-800 hover:bg-black'
                              }`}
                            >
                              {activo ? '↻ Renovar' : 'Aprobar'}
                            </button>

                            <button onClick={() => enviarCorreo(cliente)} className="bg-[#964B36] text-white hover:bg-[#7d3e2c] px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm" title="Enviar correo de confirmación">
                              ✉️
                            </button>
                            <button onClick={() => abrirWhatsApp(cliente.telefono, cliente.nombres)} className="bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors" title="Escribir por WhatsApp">
                              💬
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
        <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
          {cargandoRadar && sesiones.length === 0 ? (
            <div className="p-10 text-center text-neutral-500">Cargando radar...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-100 text-neutral-500 border-b border-neutral-200">
                    <th className="p-4 text-[10px] uppercase tracking-widest font-bold">Prospecto</th>
                    <th className="p-4 text-[10px] uppercase tracking-widest font-bold">Tiempo</th>
                    <th className="p-4 text-[10px] uppercase tracking-widest font-bold">Unidades</th>
                    <th className="p-4 text-[10px] uppercase tracking-widest font-bold">Último Movimiento</th>
                    <th className="p-4 text-[10px] uppercase tracking-widest font-bold text-center">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {sesiones.map((sesion) => (
                    <React.Fragment key={sesion.idSesion}>
                      <tr className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                        <td className="p-4">
                          <span className="font-bold text-neutral-900 block text-sm">
                            {sesion.nombre ? (
                              <>{sesion.nombre} <span className="text-[10px] text-green-600 ml-1" title="Registrado en CRM">✓</span></>
                            ) : ( 'Prospecto Anónimo' )}
                          </span>
                          <span className="text-[10px] text-neutral-500 font-mono block mt-0.5">{sesion.email}</span>
                          <span className="text-[9px] text-neutral-400 mt-1.5 block">
                            {new Date().getTime() - sesion.fin.getTime() > 86400000 
                              ? new Date(sesion.fin).toLocaleDateString('es-EC', {day: '2-digit', month:'short'}) 
                              : `Hace ${Math.round((new Date().getTime() - sesion.fin.getTime()) / 60000)} min`}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="bg-[#D1C292]/20 text-[#8A7A55] px-3 py-1 rounded-full text-xs font-bold">
                            {sesion.minutos === 0 ? '< 1 min' : `${sesion.minutos} min`}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-1 flex-wrap">
                            {sesion.unidadesVistas.length > 0 ? (
                              sesion.unidadesVistas.map(u => (
                                <span key={u} className="bg-neutral-100 border border-neutral-200 text-neutral-600 text-[10px] font-bold px-2 py-0.5 rounded">{u}</span>
                              ))
                            ) : ( <span className="text-xs text-neutral-400">-</span> )}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-neutral-600">{sesion.ultimaAccion}</span>
                        </td>
                        <td className="p-4 text-center">
                          <button onClick={() => setSesionExpandida(sesionExpandida === sesion.idSesion ? null : sesion.idSesion)} className="text-xs font-bold text-[#B94A36] hover:underline uppercase tracking-wider">
                            {sesionExpandida === sesion.idSesion ? 'Ocultar' : 'Detalles'}
                          </button>
                        </td>
                      </tr>
                      
                      {sesionExpandida === sesion.idSesion && (
                        <tr className="bg-neutral-50 border-b border-neutral-200 shadow-inner">
                          <td colSpan={5} className="p-6">
                            <div className="mb-6 bg-white border border-[#D1C292] rounded-xl p-4 shadow-sm flex items-start gap-4">
                              <div className="bg-[#D1C292]/20 text-[#8A7A55] w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0">🧠</div>
                              <div>
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#8A7A55] mb-1">Análisis Comercial Automático</h4>
                                <p className="text-sm text-neutral-700 leading-relaxed font-medium">{generarAnalisisComercial(sesion)}</p>
                              </div>
                            </div>
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-4 pl-1">Línea de tiempo</h4>
                            <div className="space-y-3 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-neutral-200 before:to-transparent">
                              {sesion.eventos.map((evento, i) => (
                                <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                  <div className="flex items-center justify-center w-2 h-2 rounded-full border border-white bg-[#B94A36] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow sm:mx-0 mx-4 z-10"></div>
                                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-3 rounded-lg border border-neutral-200 shadow-sm flex flex-col hover:border-[#B94A36]/30 transition-colors">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-[10px] font-bold text-neutral-400">{new Date(evento.created_at).toLocaleTimeString('es-EC')}</span>
                                      {evento.unidad_id && <span className="text-[9px] bg-neutral-100 text-neutral-500 font-bold px-1.5 py-0.5 rounded">Unidad {evento.unidad_id}</span>}
                                    </div>
                                    <span className="text-sm font-medium text-neutral-800">{evento.accion.replace(/_/g, ' ')}</span>
                                    <span className="text-xs text-neutral-500">{evento.detalle}</span>
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
                    <tr><td colSpan={5} className="p-8 text-center text-neutral-400">Aún no hay actividad registrada en el inventario.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* PESTAÑA 3: ACTIVIDAD WEB (LANDING) */}
      {/* ========================================================= */}
      {pestañaActiva === 'web' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          
          <div className="flex justify-end gap-2">
            {['hoy', '7d', '30d'].map(f => (
              <button 
                key={f} 
                onClick={() => setFiltroTiempo(f)}
                className={`px-4 py-2 text-xs font-bold rounded-lg uppercase tracking-wider transition-colors ${filtroTiempo === f ? 'bg-[#D1C292] text-white' : 'bg-white text-neutral-500 border border-neutral-200'}`}
              >
                {f === 'hoy' ? 'Hoy' : f === '7d' ? '7 Días' : '30 Días'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-widest">Visitantes Únicos</span>
              <div className="text-3xl font-light text-neutral-900 mt-1">{metricas.unicos}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-widest">Sesiones</span>
              <div className="text-3xl font-light text-neutral-900 mt-1">{metricas.totalSesiones}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-widest">Recurrentes</span>
              <div className="text-3xl font-light text-neutral-900 mt-1">{metricas.recurrentes}</div>
            </div>
            <div className="bg-[#21242E] text-white p-5 rounded-2xl shadow-sm">
              <span className="text-[10px] uppercase font-bold text-[#D1C292] tracking-widest">Alta Intención</span>
              <div className="text-3xl font-light mt-1">{metricas.altoInteres}</div>
            </div>
            <div className="bg-[#964B36] text-white p-5 rounded-2xl shadow-sm">
              <span className="text-[10px] uppercase font-bold text-white/70 tracking-widest">Registros (Leads)</span>
              <div className="text-3xl font-light mt-1">{metricas.conversiones}</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 text-center">
            <div className="flex-1">
              <div className="text-2xl font-light text-neutral-900">{metricas.funnel.visitas}</div>
              <div className="text-[10px] font-bold uppercase text-neutral-400 tracking-widest">Visitas</div>
            </div>
            <div className="text-[#D1C292]">→</div>
            <div className="flex-1">
              <div className="text-2xl font-light text-neutral-900">{metricas.funnel.scroll50}</div>
              <div className="text-[10px] font-bold uppercase text-neutral-400 tracking-widest">Scroll 50%</div>
            </div>
            <div className="text-[#D1C292]">→</div>
            <div className="flex-1">
              <div className="text-2xl font-light text-[#964B36]">{metricas.funnel.intentosContacto}</div>
              <div className="text-[10px] font-bold uppercase text-neutral-400 tracking-widest">Intento de Contacto</div>
              <div className="text-[8px] text-neutral-400 mt-1">(WhatsApp, Calendly o VIP)</div>
            </div>
            <div className="text-[#D1C292]">→</div>
            <div className="flex-1">
              <div className="text-2xl font-light text-green-600">{metricas.funnel.registros}</div>
              <div className="text-[10px] font-bold uppercase text-neutral-400 tracking-widest">Registrados</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="p-4 text-[10px] uppercase font-bold text-neutral-500 tracking-widest">Identidad / Estado</th>
                    <th className="p-4 text-[10px] uppercase font-bold text-neutral-500 tracking-widest">Comportamiento</th>
                    <th className="p-4 text-[10px] uppercase font-bold text-neutral-500 tracking-widest">Fuente</th>
                    <th className="p-4 text-[10px] uppercase font-bold text-neutral-500 tracking-widest">Nivel de Intención</th>
                    <th className="p-4 text-center text-[10px] uppercase font-bold text-neutral-500 tracking-widest">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {cargandoWeb ? (
                    <tr><td colSpan={5} className="p-10 text-center text-neutral-400">Analizando huellas digitales...</td></tr>
                  ) : visitantesAgrupados.map((v) => (
                    <React.Fragment key={v.visitor_id}>
                      <tr className="hover:bg-neutral-50 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-sm text-neutral-900">
                            {v.email ? (
                              <span className="text-green-700 bg-green-50 px-2 py-1 rounded border border-green-200">✓ {v.email}</span>
                            ) : (
                              `Anónimo #${v.visitor_id.substring(0,6)}`
                            )}
                          </div>
                          <div className="text-[10px] text-neutral-400 mt-2">Última act: {v.ultimaActividad.toLocaleString('es-EC')}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-xs font-medium text-neutral-700">{v.sesiones.size} Sesiones · {v.tiempoAcumuladoMin} min</div>
                          <div className="text-[10px] text-neutral-400 mt-1">{v.eventos.length} Interacciones registradas</div>
                        </td>
                        <td className="p-4">
                          <span className="text-xs bg-neutral-100 px-2 py-1 rounded text-neutral-600 font-mono">{v.fuentePrincipal}</span>
                        </td>
                        <td className="p-4">
                          <span className={`text-xs font-bold px-2 py-1 rounded ${v.nivelInteraccion === '🔥 ALTO' ? 'bg-red-50 text-red-600' : v.nivelInteraccion === '⚡ MEDIO' ? 'bg-yellow-50 text-yellow-600' : 'bg-blue-50 text-blue-600'}`}>
                            {v.nivelInteraccion} ({v.score} pts)
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button 
                            onClick={() => setVisitanteExpandido(visitanteExpandido === v.visitor_id ? null : v.visitor_id)}
                            className="text-[10px] font-bold text-[#964B36] hover:underline uppercase tracking-widest bg-[#964B36]/10 px-3 py-1.5 rounded"
                          >
                            {visitanteExpandido === v.visitor_id ? 'Ocultar' : 'Ver Detalle'}
                          </button>
                        </td>
                      </tr>

                      {visitanteExpandido === v.visitor_id && (
                        <tr className="bg-neutral-50 shadow-inner">
                          <td colSpan={5} className="p-6">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-4 pl-1">Historial del Visitante</h4>
                            <div className="space-y-3 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-neutral-200">
                              {v.eventos.map((evento) => (
                                <div key={evento.id} className="relative flex items-center group">
                                  <div className="flex items-center justify-center w-2 h-2 rounded-full border border-white bg-[#D1C292] z-10 ml-4 mr-4"></div>
                                  <div className="bg-white p-3 rounded-lg border border-neutral-200 shadow-sm w-full md:w-1/2 flex justify-between items-center">
                                    <div>
                                      <span className="text-sm font-bold text-neutral-800">{evento.accion.replace(/_/g, ' ')}</span>
                                      <span className="text-xs text-neutral-500 block">{evento.detalle}</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-neutral-400 whitespace-nowrap">
                                      {new Date(evento.created_at).toLocaleTimeString('es-EC')}
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