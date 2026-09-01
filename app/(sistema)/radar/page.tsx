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

export default function RadarInventario() {
  const [sesiones, setSesiones] = useState<SesionCliente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [sesionExpandida, setSesionExpandida] = useState<string | null>(null);

  // ==========================================
  // 🧠 MOTOR DE INFERENCIA COMERCIAL (Pseudo-IA)
  // ==========================================
  const generarAnalisisComercial = (sesion: SesionCliente) => {
    if (sesion.eventos.length === 0) return "Sin datos suficientes para analizar.";

    let analisis = "";

    // 1. Análisis de Tiempo y Profundidad
    if (sesion.minutos < 2) {
      analisis += "Vistazo rápido. Exploró la plataforma superficialmente. ";
    } else if (sesion.minutos < 10) {
      analisis += "Exploración moderada. Se tomó el tiempo para navegar por el inventario. ";
    } else {
      analisis += "Alto nivel de interés. Pasó bastante tiempo analizando el proyecto detalladamente. ";
    }

    // 2. Patrón de búsqueda (Filtros)
    const filtros = sesion.eventos.filter(e => e.accion === 'USO_FILTRO');
    if (filtros.length > 0) {
      const ultFiltro = filtros[0].detalle?.replace('Buscó: ', '') || '';
      analisis += `Mostró inclinación directa por la tipología de ${ultFiltro}. `;
    }

    // 3. Análisis de Unidades
    if (sesion.unidadesVistas.length === 1) {
      analisis += `Se enfocó exclusivamente en la unidad ${sesion.unidadesVistas[0]}, lo que indica una búsqueda muy específica. `;
    } else if (sesion.unidadesVistas.length > 1) {
      analisis += `Comparó ${sesion.unidadesVistas.length} unidades distintas (${sesion.unidadesVistas.join(', ')}). `;
    }

    // 4. Comportamiento y Temperatura (Intención)
    const vioPlanos = sesion.eventos.some(e => e.accion === 'VIO_PLANO_INTERNO');
    const vioVistas = sesion.eventos.some(e => e.accion === 'VIO_IMAGEN_VISTA');
    const clicWa = sesion.eventos.some(e => e.accion === 'CLIC_WHATSAPP');
    const reserva = sesion.eventos.some(e => e.accion === 'RESERVA_COMPLETADA');

    if (reserva) {
      analisis += "🎯 ¡ALERTA DE CIERRE! El cliente completó un bloqueo de unidad web.";
    } else if (clicWa) {
      analisis += "🔥 INTENCIÓN CALIENTE: Intentó contactar por WhatsApp para cotizar.";
    } else if (vioPlanos && vioVistas) {
      analisis += "Tiene un perfil analítico: revisó tanto la distribución interna (planos) como las vistas reales.";
    } else if (vioPlanos) {
      analisis += "Le dio más importancia a conocer la distribución interna y metrajes.";
    } else if (vioVistas) {
      analisis += "Parece darle mucha importancia a la panorámica y vistas del edificio.";
    }

    return analisis;
  };

  const cargarRadar = async () => {
    setCargando(true);
    try {
      const { data, error } = await supabase
        .from('tracking_inventario')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;

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
      console.error("Error cargando el radar", error);
    }
    setCargando(false);
  };

  useEffect(() => {
    cargarRadar();
  }, []);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto bg-[#F4F4F4] min-h-screen">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-light text-neutral-900 tracking-tight">Radar de Inventario</h1>
          <p className="text-sm text-neutral-500 mt-1">Monitoreo de actividad de prospectos en tiempo real</p>
        </div>
        <button 
          onClick={cargarRadar} 
          className="bg-white border border-neutral-200 text-neutral-700 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-neutral-100 transition-colors shadow-sm flex items-center gap-2"
        >
          {cargando ? 'Actualizando...' : '↻ Refrescar Datos'}
        </button>
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
        {cargando && sesiones.length === 0 ? (
          <div className="p-10 text-center text-neutral-500">Cargando radar...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-100 text-neutral-500 border-b border-neutral-200">
                  <th className="p-4 text-[10px] uppercase tracking-widest font-bold">Prospecto</th>
                  <th className="p-4 text-[10px] uppercase tracking-widest font-bold">Tiempo en Plataforma</th>
                  <th className="p-4 text-[10px] uppercase tracking-widest font-bold">Unidades de Interés</th>
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
                            'Prospecto Web'
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
                          {sesionExpandida === sesion.idSesion ? 'Ocultar Clics' : 'Ver Detalles'}
                        </button>
                      </td>
                    </tr>
                    
                    {/* HUELLA DETALLADA DEL CLIENTE */}
                    {sesionExpandida === sesion.idSesion && (
                      <tr className="bg-neutral-50 border-b border-neutral-200 shadow-inner">
                        <td colSpan={5} className="p-6">
                          
                          {/* PANEL DE ANÁLISIS COMERCIAL */}
                          <div className="mb-6 bg-white border border-[#D1C292] rounded-xl p-4 shadow-sm flex items-start gap-4">
                            <div className="bg-[#D1C292]/20 text-[#8A7A55] w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0">
                              🧠
                            </div>
                            <div>
                              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#8A7A55] mb-1">Análisis de Comportamiento</h4>
                              <p className="text-sm text-neutral-700 leading-relaxed font-medium">
                                {generarAnalisisComercial(sesion)}
                              </p>
                            </div>
                          </div>

                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-4 pl-1">Línea de tiempo exacta</h4>
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
                
                {sesiones.length === 0 && !cargando && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-neutral-400">Aún no hay actividad registrada en el inventario.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}