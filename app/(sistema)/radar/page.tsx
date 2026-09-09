'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

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

export default function RadarCentral() {
  const [pestañaActiva, setPestañaActiva] = useState('solicitudes');
  
  // ESTADOS PESTAÑA 1: SOLICITUDES VIP
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [cargandoSolicitudes, setCargandoSolicitudes] = useState(true);
  const [tiemposSeleccionados, setTiemposSeleccionados] = useState<Record<string, string>>({});

  // ESTADOS PESTAÑA 2: RADAR INVENTARIO
  const [sesiones, setSesiones] = useState<SesionCliente[]>([]);
  const [cargandoRadar, setCargandoRadar] = useState(true);
  const [sesionExpandida, setSesionExpandida] = useState<string | null>(null);

  useEffect(() => {
    cargarSolicitudes();
    cargarRadar();
  }, []);

  // ==========================================
  // PESTAÑA 1: SOLICITUDES VIP
  // ==========================================
  const cargarSolicitudes = async () => {
    setCargandoSolicitudes(true);
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('estado_acceso', 'pendiente')
        // FILTRO ESTRICTO: Solo landing page
        .eq('origen', 'Web Pública - Solicitud Acceso Exclusivo')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error al cargar solicitudes:", error);
        return;
      }

      if (data) {
        setSolicitudes(data);
        const tiemposInit: Record<string, string> = {};
        data.forEach(c => { tiemposInit[c.id] = '24'; });
        setTiemposSeleccionados(tiemposInit);
      }
    } catch (error) {
      console.error("Error inesperado cargando solicitudes", error);
    } finally {
      setCargandoSolicitudes(false);
    }
  };

  const handleTiempoChange = (id: string, valor: string) => {
    setTiemposSeleccionados(prev => ({ ...prev, [id]: valor }));
  };

  const aprobarAcceso = async (cliente: any) => {
    const horas = tiemposSeleccionados[cliente.id] || '24';
    alert(`Aprobando a ${cliente.nombres} por ${horas} horas... (En construcción)`);
  };

  // --- AQUÍ ESTÁ LA MAGIA DEL CORREO CONECTADA ---
  const enviarCorreo = async (cliente: any) => {
    const horas = tiemposSeleccionados[cliente.id] || '24';
    
    // Cambiamos el texto del botón temporalmente a "Enviando..."
    alert(`Iniciando envío a ${cliente.email}... Por favor espera un momento.`);
    
    try {
      const response = await fetch('/api/enviar-acceso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cliente.email,
          nombres: cliente.nombres,
          horas: horas
        }),
      });

      if (response.ok) {
        alert("¡Correo corporativo enviado con éxito! Revisa la bandeja de entrada (o spam por si acaso).");
      } else {
        alert("Hubo un problema de conexión con el servidor de correos de Hostinger.");
      }
    } catch (error) {
      console.error("Error al disparar el correo:", error);
      alert("Error en el sistema al intentar enviar el correo.");
    }
  };

  const abrirWhatsApp = (telefono: string, nombres: string) => {
    if (!telefono) {
      alert("Este cliente no tiene un teléfono registrado.");
      return;
    }
    const mensaje = `Hola ${nombres}, soy Saúl de Konkeri. Hemos validado tu perfil y tu acceso exclusivo al inventario de Arienzo Boutique Living está listo. Puedes ingresar aquí: https://reserva.arienzoliving.com con tu correo.`;
    const url = `https://wa.me/${telefono.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  // ==========================================
  // PESTAÑA 2: RADAR INVENTARIO
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

    const vioPlanos = sesion.eventos.some(e => e.accion === 'VIO_PLANO_INTERNO');
    const vioVistas = sesion.eventos.some(e => e.accion === 'VIO_IMAGEN_VISTA');
    const clicWa = sesion.eventos.some(e => e.accion === 'CLIC_WHATSAPP');
    const reserva = sesion.eventos.some(e => e.accion === 'RESERVA_COMPLETADA');

    if (reserva) analisis += "🎯 ¡ALERTA DE CIERRE! Completó un bloqueo web. ";
    else if (clicWa) analisis += "🔥 INTENCIÓN CALIENTE: Intentó contactar por WhatsApp. ";
    else if (vioPlanos && vioVistas) analisis += "Perfil analítico: revisó distribución interna y vistas reales. ";
    else if (vioPlanos) analisis += "Le dio más importancia a conocer la distribución interna. ";
    else if (vioVistas) analisis += "Le dio mucha importancia a la panorámica y vistas. ";

    return analisis;
  };

  const cargarRadar = async () => {
    setCargandoRadar(true);
    try {
      const { data, error } = await supabase
        .from('tracking_inventario')
        .select('*')
        .not('accion', 'in', '("SOLICITUD_ACCESO_VIP","ABRIO_CALENDLY")')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) {
        console.error("Error cargando radar:", error);
        return;
      }

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
          const { data: clientesData } = await supabase
            .from('clientes')
            .select('email, nombres, apellidos')
            .in('email', correosUnicos);
            
          if (clientesData) {
            const mapaNombres: Record<string, string> = {};
            clientesData.forEach(c => {
              if (c.email) mapaNombres[c.email.toLowerCase()] = `${c.nombres || ''} ${c.apellidos || ''}`.trim();
            });
            
            sesionesList.forEach(s => {
              s.nombre = mapaNombres[s.email.toLowerCase()];
            });
          }
        }

        sesionesList.sort((a, b) => b.fin.getTime() - a.fin.getTime());
        setSesiones(sesionesList);
      }
    } catch (error) {
      console.error("Error inesperado cargando el radar", error);
    } finally {
      setCargandoRadar(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto bg-[#F4F4F4] min-h-screen font-sans">
      
      {/* ENCABEZADO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-light text-neutral-900 tracking-tight">Centro de Mando Digital</h1>
          <p className="text-sm text-neutral-500 mt-1">Control de accesos VIP y monitoreo de actividad en tiempo real.</p>
        </div>
        <button 
          onClick={() => { cargarSolicitudes(); cargarRadar(); }}
          className="bg-white border border-neutral-200 text-neutral-700 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-neutral-100 transition-colors shadow-sm flex items-center gap-2"
        >
          ↻ Refrescar Datos
        </button>
      </div>

      {/* SISTEMA DE PESTAÑAS */}
      <div className="flex overflow-x-auto space-x-1 bg-white p-1 rounded-xl shadow-sm border border-neutral-200 mb-8 w-fit">
        <button 
          onClick={() => setPestañaActiva('solicitudes')}
          className={`whitespace-nowrap px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
            pestañaActiva === 'solicitudes' ? 'bg-[#21242E] text-white shadow' : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
          }`}
        >
          🎯 Solicitudes VIP
          {solicitudes.length > 0 && (
            <span className="bg-[#964B36] text-white text-[10px] px-2 py-0.5 rounded-full">{solicitudes.length}</span>
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

      {/* CONTENIDO PESTAÑA 1: SOLICITUDES VIP */}
      {pestañaActiva === 'solicitudes' && (
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
          <div className="px-6 py-5 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
            <h3 className="font-bold text-neutral-800">Accesos Web Pendientes</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-600">
              <thead className="bg-white text-neutral-400 text-xs uppercase tracking-wider border-b">
                <tr>
                  <th className="px-6 py-4 font-medium">Cliente</th>
                  <th className="px-6 py-4 font-medium">Contacto</th>
                  <th className="px-6 py-4 font-medium">Fecha</th>
                  <th className="px-6 py-4 font-medium text-right">Gestión de Acceso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {cargandoSolicitudes ? (
                  <tr><td colSpan={4} className="px-6 py-10 text-center text-neutral-400">Cargando solicitudes...</td></tr>
                ) : solicitudes.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-10 text-center text-neutral-400 font-medium">No hay solicitudes nuevas desde la web.</td></tr>
                ) : (
                  solicitudes.map((cliente) => (
                    <tr key={cliente.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-neutral-900">{cliente.nombres}</div>
                        <div className="text-xs text-neutral-400">Desde Landing Page</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-neutral-900 font-mono text-xs">{cliente.email}</div>
                        <div className="text-neutral-500">{cliente.telefono}</div>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {new Date(cliente.created_at).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          
                          <select 
                            className="bg-white border border-neutral-200 text-neutral-700 rounded-lg text-xs p-2 focus:outline-none focus:border-[#964B36]"
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
                            className="bg-neutral-800 text-white hover:bg-black px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm"
                          >
                            Aprobar
                          </button>
                          
                          <button 
                            onClick={() => enviarCorreo(cliente)}
                            className="bg-[#964B36] text-white hover:bg-[#7d3e2c] px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm"
                          >
                            ✉️ Enviar Correo
                          </button>

                          <button 
                            onClick={() => abrirWhatsApp(cliente.telefono, cliente.nombres)}
                            className="bg-green-50 text-green-700 hover:bg-green-100 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors border border-green-200"
                          >
                            WhatsApp
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONTENIDO PESTAÑA 2: RADAR INVENTARIO */}
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
                            ) : (
                              'Prospecto Anónimo'
                            )}
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
                                <span key={u} className="bg-neutral-100 border border-neutral-200 text-neutral-600 text-[10px] font-bold px-2 py-0.5 rounded">
                                  {u}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-neutral-400">-</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-neutral-600">{sesion.ultimaAccion}</span>
                        </td>
                        <td className="p-4 text-center">
                          <button 
                            onClick={() => setSesionExpandida(sesionExpandida === sesion.idSesion ? null : sesion.idSesion)}
                            className="text-xs font-bold text-[#B94A36] hover:underline uppercase tracking-wider"
                          >
                            {sesionExpandida === sesion.idSesion ? 'Ocultar' : 'Detalles'}
                          </button>
                        </td>
                      </tr>
                      
                      {sesionExpandida === sesion.idSesion && (
                        <tr className="bg-neutral-50 border-b border-neutral-200 shadow-inner">
                          <td colSpan={5} className="p-6">
                            <div className="mb-6 bg-white border border-[#D1C292] rounded-xl p-4 shadow-sm flex items-start gap-4">
                              <div className="bg-[#D1C292]/20 text-[#8A7A55] w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0">
                                🧠
                              </div>
                              <div>
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#8A7A55] mb-1">Análisis Comercial Automático</h4>
                                <p className="text-sm text-neutral-700 leading-relaxed font-medium">
                                  {generarAnalisisComercial(sesion)}
                                </p>
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
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-neutral-400">Aún no hay actividad registrada en el inventario.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CONTENIDO PESTAÑA 3: ACTIVIDAD WEB */}
      {pestañaActiva === 'web' && (
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-10 text-center animate-in fade-in slide-in-from-bottom-2">
          <div className="text-4xl mb-4 text-[#D1C292]">🌐</div>
          <h3 className="text-lg font-bold text-neutral-800 mb-2">Tráfico de la Landing Page</h3>
          <p className="text-neutral-500 max-w-md mx-auto">
            Próximo paso: Instalaremos el rastreador en la landing page para ver aquí las sesiones de los visitantes anónimos y el tiempo que navegan.
          </p>
        </div>
      )}

    </div>
  );
}