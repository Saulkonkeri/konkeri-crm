'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Tipo de dato para agrupar las sesiones
type SesionCliente = {
  email: string;
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
  const [clienteExpandido, setClienteExpandido] = useState<string | null>(null);

  const cargarRadar = async () => {
    setCargando(true);
    try {
      // Traemos los últimos 500 clics de la base de datos
      const { data, error } = await supabase
        .from('tracking_inventario')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;

      if (data) {
        // Agrupamos los clics por cliente
        const agrupado = data.reduce((acc: Record<string, SesionCliente>, row) => {
          const email = row.email_cliente;
          if (!acc[email]) {
            acc[email] = {
              email: email,
              inicio: new Date(row.created_at),
              fin: new Date(row.created_at),
              minutos: 0,
              eventos: [],
              ultimaAccion: '',
              unidadesVistas: []
            };
          }

          // Agregamos el evento a su historial
          acc[email].eventos.push(row);

          // Actualizamos la hora de inicio o fin para calcular el tiempo
          const fechaRow = new Date(row.created_at);
          if (fechaRow > acc[email].fin) acc[email].fin = fechaRow;
          if (fechaRow < acc[email].inicio) acc[email].inicio = fechaRow;

          // Recopilamos qué unidades revisó
          if (row.unidad_id && !acc[email].unidadesVistas.includes(row.unidad_id)) {
            acc[email].unidadesVistas.push(row.unidad_id);
          }

          return acc;
        }, {});

        // Calculamos el tiempo total de cada uno y formateamos para mostrar
        const listaSesiones = Object.values(agrupado).map((sesion) => {
          const diffMs = sesion.fin.getTime() - sesion.inicio.getTime();
          sesion.minutos = Math.round(diffMs / 60000);
          sesion.ultimaAccion = sesion.eventos[0]?.detalle || sesion.eventos[0]?.accion || 'Desconocido';
          return sesion;
        });

        // Ordenamos para que los más recientes salgan arriba
        listaSesiones.sort((a, b) => b.fin.getTime() - a.fin.getTime());
        
        setSesiones(listaSesiones);
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
    <div className="p-6 md:p-10 max-w-7xl mx-auto bg-neutral-50 min-h-screen">
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
                {sesiones.map((sesion, index) => (
                  <React.Fragment key={index}>
                    <tr className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                      <td className="p-4">
                        <span className="font-medium text-neutral-900 block">{sesion.email}</span>
                        <span className="text-[10px] text-neutral-400">Hace {Math.round((new Date().getTime() - sesion.fin.getTime()) / 60000)} min</span>
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
                          onClick={() => setClienteExpandido(clienteExpandido === sesion.email ? null : sesion.email)}
                          className="text-xs font-bold text-[#B94A36] hover:underline uppercase tracking-wider"
                        >
                          {clienteExpandido === sesion.email ? 'Ocultar Clics' : 'Ver Detalles'}
                        </button>
                      </td>
                    </tr>
                    
                    {/* HUELLA DETALLADA DEL CLIENTE (Línea de tiempo) */}
                    {clienteExpandido === sesion.email && (
                      <tr className="bg-neutral-50 border-b border-neutral-200">
                        <td colSpan={5} className="p-6">
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-4">Registro exacto de acciones</h4>
                          <div className="space-y-3 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-neutral-200 before:to-transparent">
                            {sesion.eventos.map((evento, i) => (
                              <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                <div className="flex items-center justify-center w-2 h-2 rounded-full border border-white bg-[#B94A36] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow sm:mx-0 mx-4 z-10"></div>
                                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-3 rounded-lg border border-neutral-200 shadow-sm flex flex-col">
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