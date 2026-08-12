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
      // 1. Obtener todos los clientes activos (excluyendo 'Descartado' utilizando la columna correcta 'estado')
      const { data: clientesActivos, error: errorClientes } = await supabase
        .from('clientes')
        .select('*')
        .neq('estado', 'Descartado');

      if (errorClientes) throw errorClientes;

      if (clientesActivos) {
        setTotalLeads(clientesActivos.length);
        const calientes = clientesActivos.filter(c => c.temperatura?.includes('Caliente')).length;
        setLeadsCalientes(calientes);

        // 2. Filtrar las tareas programadas exactamente para hoy
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
      <div className="flex min-h-screen items-center justify-center bg-[#F4F4F4]">
        <p className="text-sm font-light tracking-widest text-[#B94A36] uppercase animate-pulse">Iniciando Sistema...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F4F4] px-4 md:px-8 py-10 font-sans text-neutral-800 flex flex-col items-center">
      
      <div className="w-full max-w-5xl space-y-8">
        
        {/* ENCABEZADO */}
        <div className="bg-white rounded-xl border border-neutral-200 p-8 shadow-sm">
          <span className="text-xs font-bold tracking-widest text-[#B94A36] uppercase">Arienzo Boutique Living</span>
          <h1 className="text-3xl font-light tracking-tight text-neutral-900 mt-2">Centro de Operaciones</h1>
          <p className="text-sm text-neutral-500 mt-2">Bienvenido. Este es el resumen de tu embudo comercial de alto valor hoy.</p>
        </div>

        {/* MÉTRICAS PRINCIPALES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm flex flex-col justify-center">
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Total Prospectos Activos</p>
            <p className="text-4xl font-light text-neutral-900 mt-2">{totalLeads}</p>
          </div>
          <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm flex flex-col justify-center">
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Prospectos Calientes 🔥</p>
            <p className="text-4xl font-light text-[#B94A36] mt-2">{leadsCalientes}</p>
          </div>
          <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm flex flex-col justify-center">
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Inventario Total</p>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-4xl font-light text-neutral-900">22</p>
              <p className="text-xs text-neutral-400 font-medium">Unidades</p>
            </div>
          </div>
        </div>

        {/* AGENDA DEL DÍA */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-neutral-100 bg-neutral-50 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-neutral-900">Agenda de Hoy</h2>
              <p className="text-xs text-neutral-500 mt-0.5">Contactos estratégicos programados para el día.</p>
            </div>
            <div className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
              {tareasHoy.length} Pendientes
            </div>
          </div>
          
          <div className="p-0">
            {tareasHoy.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-sm text-neutral-400 italic">No tienes llamadas ni tareas agendadas para hoy.</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {tareasHoy.map((tarea) => (
                  <div key={tarea.id} className="p-6 hover:bg-neutral-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-neutral-900 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                          {tarea.tipo_accion}
                        </span>
                        {tarea.temperatura && (
                          <span className="text-[10px] text-neutral-500 font-medium">{tarea.temperatura}</span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-neutral-900">{tarea.nombres} {tarea.apellidos}</h3>
                      <p className="text-xs text-neutral-600 mt-1 max-w-md">{tarea.detalle_accion || 'Sin detalles adicionales.'}</p>
                    </div>
                    
                    <Link href="/crm" className="px-5 py-2.5 bg-white border border-neutral-200 text-neutral-700 rounded-lg text-xs font-bold hover:bg-neutral-100 transition shadow-sm text-center flex-shrink-0">
                      Ir al CRM &rarr;
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ACCESOS RÁPIDOS */}
        <h2 className="text-sm font-bold tracking-widest text-neutral-500 uppercase mt-8 mb-4">Herramientas Comerciales</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <Link href="/crm" className="group bg-white rounded-xl border border-neutral-200 p-6 shadow-sm hover:shadow-md hover:border-[#B94A36] transition-all cursor-pointer flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-neutral-900 group-hover:text-[#B94A36] transition-colors">Pipeline / CRM</h3>
              <p className="text-xs text-neutral-500 mt-1">Gestiona prospectos, envía WhatsApp y revisa seguimientos.</p>
            </div>
            <span className="text-2xl opacity-50 group-hover:opacity-100 transition-opacity group-hover:translate-x-1 duration-300">📊</span>
          </Link>

          <Link href="/cotizador" className="group bg-white rounded-xl border border-neutral-200 p-6 shadow-sm hover:shadow-md hover:border-[#B94A36] transition-all cursor-pointer flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-neutral-900 group-hover:text-[#B94A36] transition-colors">Generar Cotización</h3>
              <p className="text-xs text-neutral-500 mt-1">Calculadora de planes de pago y generación de PDF.</p>
            </div>
            <span className="text-2xl opacity-50 group-hover:opacity-100 transition-opacity group-hover:translate-x-1 duration-300">📄</span>
          </Link>

        </div>

      </div>
    </div>
  );
}