// Actualizacion forzada para Vercel - Reportes con Inteligencia de Campañas y Landing Page
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function ReportesPage() {
  const [tabActiva, setTabActiva] = useState<'marketing' | 'conversion' | 'ventas' | 'cotizaciones'>('marketing');
  const [filtroTiempo, setFiltroTiempo] = useState('este_mes');
  const [cargando, setCargando] = useState(true);

  // Estados de datos reales
  const [metricas, setMetricas] = useState({
    totalLeads: 0,
    totalCotizaciones: 0,
    totalReservas: 0,
    totalVentas: 0,
    montoColocado: 0,
    montoInventario: 0
  });

  const [datosMarketing, setDatosMarketing] = useState<any[]>([]);
  const [datosCampanas, setDatosCampanas] = useState<any[]>([]);       // NUEVO: Inteligencia de Campañas
  const [datosCiudades, setDatosCiudades] = useState<any[]>([]);       
  const [datosPreferencias, setDatosPreferencias] = useState<any[]>([]); 
  const [datosTipologia, setDatosTipologia] = useState<any[]>([]);
  const [topCotizadas, setTopCotizadas] = useState<any[]>([]);

  useEffect(() => {
    async function cargarInteligenciaComercial() {
      setCargando(true);
      try {
        // 1. Extraer toda la información en crudo (AHORA INCLUYE CAMPAÑA)
        const [propsRes, clientesRes, cotizacionesRes] = await Promise.all([
          supabase.from('propiedades').select('*'),
          supabase.from('clientes').select('id, origen_captacion, campana, estado, tipo, ciudad_residencia, tipologia_interes'),
          supabase.from('cotizaciones').select('id, unidad_numero')
        ]);

        const propiedades = propsRes.data || [];
        const clientes = clientesRes.data || [];
        const cotizaciones = cotizacionesRes.data || [];

        // 2. Procesar KPIs Principales
        const inventarioTotal = propiedades.reduce((acc, p) => acc + (Number(p.precio || p.precio_lista) || 0), 0);
        const colocadas = propiedades.filter(p => p.estado === 'Reservado' || p.estado === 'Vendido');
        const montoColocado = colocadas.reduce((acc, p) => acc + (Number(p.precio || p.precio_lista) || 0), 0);
        
        const reservasCount = propiedades.filter(p => p.estado === 'Reservado').length;
        const ventasCount = propiedades.filter(p => p.estado === 'Vendido').length;

        setMetricas({
          totalLeads: clientes.length,
          totalCotizaciones: cotizaciones.length,
          totalReservas: reservasCount,
          totalVentas: ventasCount,
          montoColocado: montoColocado,
          montoInventario: inventarioTotal
        });

        // 3. Procesar Marketing (Agrupación de Canales / Orígenes)
        const origenesMap = clientes.reduce((acc: any, c) => {
          const origen = c.origen_captacion || 'No Definido / Otro';
          acc[origen] = (acc[origen] || 0) + 1;
          return acc;
        }, {});

        const arrayMarketing = Object.keys(origenesMap).map(key => ({
          medio: key,
          leads: origenesMap[key],
          porcentaje: Math.round((origenesMap[key] / (clientes.length || 1)) * 100),
          color: 'bg-[#B94A36]'
        })).sort((a, b) => b.leads - a.leads);
        
        setDatosMarketing(arrayMarketing);

        // NUEVO 3.1: Procesar Rendimiento de Campañas
        const campanasMap = clientes.reduce((acc: any, c) => {
          const campana = c.campana ? c.campana.toUpperCase().trim() : 'TRÁFICO ORGÁNICO / BASE';
          acc[campana] = (acc[campana] || 0) + 1;
          return acc;
        }, {});

        const arrayCampanas = Object.keys(campanasMap).map(key => ({
          campana: key,
          leads: campanasMap[key],
          porcentaje: Math.round((campanasMap[key] / (clientes.length || 1)) * 100)
        })).sort((a, b) => b.leads - a.leads);

        setDatosCampanas(arrayCampanas);

        // 3.2: Procesar Ciudades de Origen
        const ciudadesMap = clientes.reduce((acc: any, c) => {
          const ciudad = c.ciudad_residencia ? c.ciudad_residencia.toUpperCase().trim() : 'NO ESPECIFICADA';
          acc[ciudad] = (acc[ciudad] || 0) + 1;
          return acc;
        }, {});

        const arrayCiudades = Object.keys(ciudadesMap).map(key => ({
          ciudad: key,
          leads: ciudadesMap[key],
          porcentaje: Math.round((ciudadesMap[key] / (clientes.length || 1)) * 100)
        })).sort((a, b) => b.leads - a.leads);

        setDatosCiudades(arrayCiudades);

        // 3.3: Procesar Preferencias de Tipología
        const preferenciasMap = clientes.reduce((acc: any, c) => {
          const pref = c.tipologia_interes || 'Por definir';
          acc[pref] = (acc[pref] || 0) + 1;
          return acc;
        }, {});

        const arrayPreferencias = Object.keys(preferenciasMap).map(key => ({
          tipologia: key,
          leads: preferenciasMap[key],
          porcentaje: Math.round((preferenciasMap[key] / (clientes.length || 1)) * 100)
        })).sort((a, b) => b.leads - a.leads);

        setDatosPreferencias(arrayPreferencias);

        // 4. Procesar Ventas por Tipología Dinámica (Inventario)
        const typoMap = propiedades.reduce((acc: any, p) => {
          const typo = p.tipologia || p.categoria || 'Sin definir';
          if (!acc[typo]) acc[typo] = { total: 0, v: 0, r: 0, d: 0, monto: 0 };
          
          acc[typo].total += 1;
          const precioUnidad = Number(p.precio || p.precio_lista) || 0;

          if (p.estado === 'Vendido') { 
            acc[typo].v += 1; 
            acc[typo].monto += precioUnidad; 
          } else if (p.estado === 'Reservado') { 
            acc[typo].r += 1; 
            acc[typo].monto += precioUnidad; 
          } else { 
            acc[typo].d += 1; 
          }
          return acc;
        }, {});

        const arrayTipologias = Object.keys(typoMap).map(key => ({
          tipo: key,
          ...typoMap[key]
        }));
        
        setDatosTipologia(arrayTipologias);

        // 5. Procesar Top Cotizaciones
        const quotesMap = cotizaciones.reduce((acc: any, c) => {
          const unit = c.unidad_numero || 'Sin Unidad';
          acc[unit] = (acc[unit] || 0) + 1;
          return acc;
        }, {});

        const arrayTopQuotes = Object.keys(quotesMap).map(key => {
          const propInfo = propiedades.find(p => p.unidad === key || p.numero === key);
          return {
            unidad: `Unidad ${key}`,
            tipo: propInfo?.tipologia || propInfo?.categoria || 'Inmueble',
            vistas: propInfo?.vista || 'N/A',
            total: quotesMap[key]
          };
        }).sort((a, b) => b.total - a.total).slice(0, 3);

        setTopCotizadas(arrayTopQuotes);

      } catch (error) {
        console.error("Error al procesar BI:", error);
      } finally {
        setCargando(false);
      }
    }

    cargarInteligenciaComercial();
  }, []);

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9F9F9]">
        <p className="text-[10px] font-bold tracking-[0.2em] text-[#B94A36] uppercase animate-pulse">Sincronizando Base de Datos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F9] px-6 py-10 font-sans text-neutral-800 antialiased">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER CONTROL COMERCIAL */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-neutral-200 pb-6">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-[#B94A36] uppercase">
              Konkeri Developer Group
            </span>
            <h1 className="text-2xl font-light tracking-tight text-neutral-900 mt-1">
              Business Intelligence & Reportes
            </h1>
            <p className="text-xs text-neutral-400 mt-0.5">Evaluación en tiempo real de eficiencia comercial y absorción.</p>
          </div>
          
          <div className="flex items-center gap-3 mt-4 md:mt-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium bg-neutral-100 text-neutral-600 rounded-lg border border-neutral-200/60 shadow-sm">
              Proyecto: <span className="font-bold text-neutral-900">Arienzo Boutique Living</span>
            </span>
          </div>
        </div>

        {/* TARJETAS DE KPIS PRINCIPALES */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-5 rounded-xl border border-neutral-200/80 shadow-sm">
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Leads / Base de Datos</p>
            <h3 className="text-2xl font-semibold text-neutral-900 mt-1">{metricas.totalLeads}</h3>
            <span className="text-[11px] text-neutral-500 font-light mt-1 block">Registros históricos totales</span>
          </div>
          
          <div className="bg-white p-5 rounded-xl border border-neutral-200/80 shadow-sm">
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Unidades Reservadas</p>
            <h3 className="text-2xl font-semibold text-amber-600 mt-1">{metricas.totalReservas}</h3>
            <span className="text-[11px] text-neutral-400 font-light mt-1 block">Bloqueos comerciales activos</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-neutral-200/80 shadow-sm">
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Ventas Prometidas</p>
            <h3 className="text-2xl font-semibold text-emerald-600 mt-1">{metricas.totalVentas}</h3>
            <span className="text-[11px] text-neutral-400 font-light mt-1 block">Contratos formalizados</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-neutral-200/80 shadow-sm">
            <p className="text-[10px] font-bold text-[#B94A36] uppercase tracking-wider">Volumen Colocado</p>
            <h3 className="text-2xl font-bold text-neutral-900 mt-1">${(metricas.montoColocado / 1000000).toFixed(2)}M</h3>
            <span className="text-[11px] text-[#B94A36] font-medium mt-1 block">
              {metricas.montoInventario > 0 ? ((metricas.montoColocado / metricas.montoInventario) * 100).toFixed(1) : 0}% Absorción de ${(metricas.montoInventario / 1000000).toFixed(2)}M
            </span>
          </div>
        </div>

        {/* SELECTOR DE PESTAÑAS */}
        <div className="border-b border-neutral-200 flex flex-wrap gap-2">
          {[
            { id: 'marketing', label: 'Marketing, Origen y Perfil' },
            { id: 'conversion', label: 'Embudo de Conversión' },
            { id: 'ventas', label: 'Absorción de Inventario' },
            { id: 'cotizaciones', label: 'Demanda de Cotizaciones' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTabActiva(tab.id as any)}
              className={`px-4 py-2.5 text-xs font-medium tracking-wide border-b-2 transition duration-150 -mb-[2px] ${
                tabActiva === tab.id 
                  ? 'border-[#B94A36] text-[#B94A36] font-semibold' 
                  : 'border-transparent text-neutral-400 hover:text-neutral-600 hover:border-neutral-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* CONTENIDO DINÁMICO */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
          
          {/* TAB 1: MARKETING, ORIGEN Y PERFIL (NUEVO DISEÑO 2x2) */}
          {tabActiva === 'marketing' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h2 className="text-sm font-bold text-neutral-800 uppercase tracking-wider">Inteligencia de Audiencia y Tráfico</h2>
                <p className="text-xs text-neutral-400 mt-0.5">Mide el impacto de tus canales digitales, campañas específicas y la demografía de tus leads.</p>
              </div>

              {/* GRID 2x2 PARA ACOMODAR LAS CAMPAÑAS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* 1. Origen del Tráfico (Canales) */}
                <div className="space-y-4 bg-neutral-50/50 p-5 rounded-xl border border-neutral-200/60 shadow-sm hover:border-neutral-300 transition-colors">
                  <h4 className="font-bold text-neutral-800 uppercase tracking-wider text-[11px] border-b pb-2 flex justify-between items-center">
                    <span>Canal de Captación</span>
                    <span className="text-[14px]">📱</span>
                  </h4>
                  {datosMarketing.length > 0 ? datosMarketing.map((item, idx) => (
                    <div key={idx} className="text-xs space-y-1">
                      <div className="flex justify-between font-medium">
                        <span className="text-neutral-700 uppercase truncate pr-2">{item.medio}</span>
                        <span className="text-neutral-900 font-bold whitespace-nowrap">{item.leads} ({item.porcentaje}%)</span>
                      </div>
                      <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color}`} style={{ width: `${item.porcentaje}%`, opacity: 1 - (idx * 0.15) }}></div>
                      </div>
                    </div>
                  )) : (
                     <p className="text-xs text-neutral-400 italic">Sin datos de origen.</p>
                  )}
                </div>

                {/* 2. Rendimiento de Campañas (NUEVO) */}
                <div className="space-y-4 bg-purple-50/20 p-5 rounded-xl border border-purple-100 shadow-sm hover:border-purple-200 transition-colors">
                  <h4 className="font-bold text-purple-900 uppercase tracking-wider text-[11px] border-b border-purple-100 pb-2 flex justify-between items-center">
                    <span>Rendimiento por Campaña</span>
                    <span className="text-[14px]">📢</span>
                  </h4>
                  {datosCampanas.length > 0 ? datosCampanas.map((item, idx) => (
                    <div key={idx} className="text-xs space-y-1">
                      <div className="flex justify-between font-medium">
                        <span className="text-purple-800 uppercase truncate pr-2">{item.campana}</span>
                        <span className="text-purple-950 font-bold whitespace-nowrap">{item.leads} ({item.porcentaje}%)</span>
                      </div>
                      <div className="w-full bg-purple-100 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-600" style={{ width: `${item.porcentaje}%`, opacity: 1 - (idx * 0.15) }}></div>
                      </div>
                    </div>
                  )) : (
                     <p className="text-xs text-purple-400 italic">No hay campañas registradas.</p>
                  )}
                </div>

                {/* 3. Ciudades de Origen */}
                <div className="space-y-4 bg-neutral-50/50 p-5 rounded-xl border border-neutral-200/60 shadow-sm hover:border-neutral-300 transition-colors">
                  <h4 className="font-bold text-neutral-800 uppercase tracking-wider text-[11px] border-b pb-2 flex justify-between items-center">
                    <span>Ciudad de Residencia</span>
                    <span className="text-[14px]">📍</span>
                  </h4>
                  {datosCiudades.length > 0 ? datosCiudades.map((item, idx) => (
                    <div key={idx} className="text-xs space-y-1">
                      <div className="flex justify-between font-medium">
                        <span className="text-neutral-700 uppercase truncate pr-2">{item.ciudad}</span>
                        <span className="text-neutral-900 font-bold whitespace-nowrap">{item.leads} ({item.porcentaje}%)</span>
                      </div>
                      <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-neutral-800" style={{ width: `${item.porcentaje}%` }}></div>
                      </div>
                    </div>
                  )) : (
                     <p className="text-xs text-neutral-400 italic">Sin datos de ciudad.</p>
                  )}
                </div>

                {/* 4. Tipología de Interés */}
                <div className="space-y-4 bg-amber-50/20 p-5 rounded-xl border border-amber-100 shadow-sm hover:border-amber-200 transition-colors">
                  <h4 className="font-bold text-amber-900 uppercase tracking-wider text-[11px] border-b border-amber-100 pb-2 flex justify-between items-center">
                    <span>Tipología Solicitada</span>
                    <span className="text-[14px]">🏢</span>
                  </h4>
                  {datosPreferencias.length > 0 ? datosPreferencias.map((item, idx) => (
                    <div key={idx} className="text-xs space-y-1">
                      <div className="flex justify-between font-medium">
                        <span className="text-amber-800 uppercase truncate pr-2">{item.tipologia}</span>
                        <span className="text-amber-950 font-bold whitespace-nowrap">{item.leads} ({item.porcentaje}%)</span>
                      </div>
                      <div className="w-full bg-amber-100 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-600" style={{ width: `${item.porcentaje}%` }}></div>
                      </div>
                    </div>
                  )) : (
                     <p className="text-xs text-amber-500 italic">Sin preferencias registradas.</p>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: EFICIENCIA DE CONVERSIÓN */}
          {tabActiva === 'conversion' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <h2 className="text-sm font-bold text-neutral-800 uppercase tracking-wider">Embudo Transaccional del Ecosistema</h2>
                <p className="text-xs text-neutral-400 mt-0.5">Rastrea la caída de prospectos en cada hito crítico hasta la firma.</p>
              </div>
              <div className="space-y-4 max-w-2xl mt-4">
                {[
                  { etapa: '1. Prospectos Registrados', valor: metricas.totalLeads, ratio: '100% de la base', color: 'bg-neutral-800' },
                  { etapa: '2. Cotizaciones Emitidas', valor: metricas.totalCotizaciones, ratio: metricas.totalLeads > 0 ? `${((metricas.totalCotizaciones/metricas.totalLeads)*100).toFixed(1)}% del tráfico` : '0%', color: 'bg-neutral-600' },
                  { etapa: '3. Unidades en Reserva', valor: metricas.totalReservas, ratio: metricas.totalCotizaciones > 0 ? `${((metricas.totalReservas/metricas.totalCotizaciones)*100).toFixed(1)}% cotizadas` : '0%', color: 'bg-amber-600' },
                  { etapa: '4. Ventas Formales', valor: metricas.totalVentas, ratio: metricas.totalReservas > 0 ? `${((metricas.totalVentas/metricas.totalReservas)*100).toFixed(1)}% firmadas` : '0%', color: 'bg-[#B94A36]' },
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-4 text-xs">
                    <div className="w-44 font-bold text-neutral-600 uppercase tracking-wider text-[10px]">{f.etapa}</div>
                    <div className="flex-1 bg-neutral-100 h-8 rounded-lg overflow-hidden flex items-center relative border border-neutral-200/50 shadow-sm">
                      <div className={`h-full ${f.color} transition-all`} style={{ width: metricas.totalLeads > 0 ? `${Math.max(5, (f.valor / metricas.totalLeads) * 100)}%` : '0%' }}></div>
                      <span className="absolute left-3 font-bold text-white mix-blend-difference">{f.valor}</span>
                    </div>
                    <div className="w-32 text-right font-medium text-neutral-500">{f.ratio}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: VENTAS Y ABSORCIÓN */}
          {tabActiva === 'ventas' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <h2 className="text-sm font-bold text-neutral-800 uppercase tracking-wider">Velocidad de Absorción Inmobiliaria</h2>
                <p className="text-xs text-neutral-400 mt-0.5">Desglose de disponibilidad y volumen financiero agrupado por tipología real.</p>
              </div>
              <div className="overflow-x-auto border border-neutral-200 rounded-lg shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-neutral-50 text-neutral-500 text-[10px] uppercase tracking-wider border-b border-neutral-200">
                      <th className="px-4 py-3 font-bold">Tipología / Agrupación</th>
                      <th className="px-4 py-3 font-bold text-center">Total</th>
                      <th className="px-4 py-3 font-bold text-center">Disponibles</th>
                      <th className="px-4 py-3 font-bold text-center">Reservadas</th>
                      <th className="px-4 py-3 font-bold text-center">Vendidas</th>
                      <th className="px-4 py-3 font-bold text-right">Volumen Captado ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-neutral-700">
                    {datosTipologia.length > 0 ? datosTipologia.map((row, index) => (
                      <tr key={index} className="hover:bg-neutral-50/60 transition">
                        <td className="px-4 py-3.5 font-bold text-neutral-900 uppercase">{row.tipo}</td>
                        <td className="px-4 py-3.5 text-center font-medium text-neutral-500">{row.total}</td>
                        <td className="px-4 py-3.5 text-center font-bold text-emerald-600 bg-emerald-50/30">{row.d}</td>
                        <td className="px-4 py-3.5 text-center font-bold text-amber-600 bg-amber-50/30">{row.r}</td>
                        <td className="px-4 py-3.5 text-center font-bold text-[#B94A36] bg-[#B94A36]/10">{row.v}</td>
                        <td className="px-4 py-3.5 text-right font-bold text-neutral-900 font-mono">${row.monto.toLocaleString('en-US')}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan={6} className="text-center py-8 text-neutral-400 italic">No hay inventario registrado.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: ANALÍTICA DE COTIZACIONES */}
          {tabActiva === 'cotizaciones' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <h2 className="text-sm font-bold text-neutral-800 uppercase tracking-wider">Inteligencia de Demanda Financiera</h2>
                <p className="text-xs text-neutral-400 mt-0.5">Ranking de las unidades específicas que mayor cantidad de PDF impresos / enviados han generado.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Top 3 Unidades Más Buscadas</h4>
                  <div className="divide-y divide-neutral-100 border border-neutral-100 rounded-lg p-2 shadow-sm">
                    {topCotizadas.length > 0 ? topCotizadas.map((c, i) => (
                      <div key={i} className="p-3 flex justify-between items-center text-xs hover:bg-neutral-50 rounded transition">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-black text-neutral-200">#{i+1}</span>
                          <div>
                            <p className="font-bold text-neutral-900">{c.unidad}</p>
                            <p className="text-[10px] text-neutral-500 uppercase tracking-wider">{c.tipo} — {c.vistas}</p>
                          </div>
                        </div>
                        <span className="bg-[#B94A36]/10 text-[#B94A36] font-bold px-2.5 py-1 rounded-lg border border-[#B94A36]/20">
                          {c.total} simulaciones
                        </span>
                      </div>
                    )) : (
                      <p className="p-4 text-xs text-neutral-400 italic text-center">Aún no se han guardado cotizaciones en el sistema.</p>
                    )}
                  </div>
                </div>
                <div className="bg-[#F4F4F4] p-5 rounded-xl border border-neutral-200 flex flex-col justify-center text-xs space-y-3 text-neutral-600 shadow-inner">
                  <p className="font-bold text-[#B94A36] uppercase tracking-wider text-[10px]">Lectura de Precio Base</p>
                  <p className="font-light leading-relaxed">
                    Este panel permite auditar el apetito real del mercado de forma quirúrgica. Si una unidad lidera sistemáticamente las cotizaciones pero no se traduce en reservas formales, indica que su precio requiere un ajuste estratégico o una oferta promocional específica para destrabar el cierre.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}