// Actualizacion forzada para Vercel - Reportes BI Premium con Filtros y Tasas de Conversión
'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

export default function ReportesPage() {
  const [tabActiva, setTabActiva] = useState<'marketing' | 'conversion' | 'ventas' | 'cotizaciones'>('marketing');
  const [filtroTiempo, setFiltroTiempo] = useState<'mes' | 'trimestre' | 'ano' | 'todo'>('todo');
  const [cargando, setCargando] = useState(true);

  // Estados de datos crudos para poder filtrar localmente sin tantas peticiones
  const [rawData, setRawData] = useState({
    propiedades: [] as any[],
    clientes: [] as any[],
    cotizaciones: [] as any[],
    pasesVip: [] as any[]
  });

  useEffect(() => {
    async function extraerTodaLaData() {
      setCargando(true);
      try {
        const [propsRes, clientesRes, cotizacionesRes, pasesRes] = await Promise.all([
          supabase.from('propiedades').select('*'),
          supabase.from('clientes').select('id, created_at, origen_captacion, campana, estado, tipo, ciudad_residencia, tipologia_interes'),
          supabase.from('cotizaciones').select('id, created_at, unidad_numero'),
          supabase.from('accesos_inventario').select('id, created_at')
        ]);

        setRawData({
          propiedades: propsRes.data || [],
          clientes: clientesRes.data || [],
          cotizaciones: cotizacionesRes.data || [],
          pasesVip: pasesRes.data || []
        });
      } catch (error) {
        console.error("Error al extraer data:", error);
      } finally {
        setCargando(false);
      }
    }
    extraerTodaLaData();
  }, []);

  // FILTRADO DE DATOS POR TIEMPO Y CÁLCULO DE MÉTRICAS (MEMOIZADO)
  const dataFiltrada = useMemo(() => {
    const ahora = new Date();
    let fechaLimite = new Date(0); // Por defecto 'todo' (desde 1970)

    if (filtroTiempo === 'mes') {
      fechaLimite = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    } else if (filtroTiempo === 'trimestre') {
      fechaLimite = new Date(ahora.getFullYear(), Math.floor(ahora.getMonth() / 3) * 3, 1);
    } else if (filtroTiempo === 'ano') {
      fechaLimite = new Date(ahora.getFullYear(), 0, 1);
    }

    const isoLimite = fechaLimite.toISOString();

    const clientes = rawData.clientes.filter(c => c.created_at >= isoLimite);
    const cotizaciones = rawData.cotizaciones.filter(c => c.created_at >= isoLimite);
    const pasesVip = rawData.pasesVip.filter(p => p.created_at >= isoLimite);
    // Propiedades no se filtran por fecha de creación, siempre muestran el estado actual del inventario
    const propiedades = rawData.propiedades;

    // 1. KPIs Principales
    const inventarioTotal = propiedades.reduce((acc, p) => acc + (Number(p.precio || p.precio_lista) || 0), 0);
    const colocadas = propiedades.filter(p => p.estado === 'Reservado' || p.estado === 'Vendido');
    const montoColocado = colocadas.reduce((acc, p) => acc + (Number(p.precio || p.precio_lista) || 0), 0);
    
    const reservasCount = propiedades.filter(p => p.estado === 'Reservado').length;
    const ventasCount = propiedades.filter(p => p.estado === 'Vendido').length;

    const metricas = {
      totalLeads: clientes.length,
      totalCotizaciones: cotizaciones.length,
      totalPasesVip: pasesVip.length,
      totalReservas: reservasCount,
      totalVentas: ventasCount,
      montoColocado: montoColocado,
      montoInventario: inventarioTotal,
      tasaCierre: cotizaciones.length > 0 ? ((ventasCount / cotizaciones.length) * 100).toFixed(1) : '0'
    };

    // 2. Procesar Marketing (Orígenes)
    const origenesMap = clientes.reduce((acc: any, c) => {
      const origen = c.origen_captacion || 'No Definido / Otro';
      acc[origen] = (acc[origen] || 0) + 1;
      return acc;
    }, {});
    const datosMarketing = Object.keys(origenesMap).map(key => ({
      medio: key, leads: origenesMap[key], porcentaje: Math.round((origenesMap[key] / (clientes.length || 1)) * 100)
    })).sort((a, b) => b.leads - a.leads);

    // 3. Procesar Campañas
    const campanasMap = clientes.reduce((acc: any, c) => {
      const campana = c.campana ? c.campana.toUpperCase().trim() : 'TRÁFICO ORGÁNICO / BASE';
      acc[campana] = (acc[campana] || 0) + 1;
      return acc;
    }, {});
    const datosCampanas = Object.keys(campanasMap).map(key => ({
      campana: key, leads: campanasMap[key], porcentaje: Math.round((campanasMap[key] / (clientes.length || 1)) * 100)
    })).sort((a, b) => b.leads - a.leads);

    // 4. Ciudades
    const ciudadesMap = clientes.reduce((acc: any, c) => {
      const ciudad = c.ciudad_residencia ? c.ciudad_residencia.toUpperCase().trim() : 'NO ESPECIFICADA';
      acc[ciudad] = (acc[ciudad] || 0) + 1;
      return acc;
    }, {});
    const datosCiudades = Object.keys(ciudadesMap).map(key => ({
      ciudad: key, leads: ciudadesMap[key], porcentaje: Math.round((ciudadesMap[key] / (clientes.length || 1)) * 100)
    })).sort((a, b) => b.leads - a.leads);

    // 5. Preferencias (Tipología)
    const preferenciasMap = clientes.reduce((acc: any, c) => {
      const pref = c.tipologia_interes || 'Por definir';
      acc[pref] = (acc[pref] || 0) + 1;
      return acc;
    }, {});
    const datosPreferencias = Object.keys(preferenciasMap).map(key => ({
      tipologia: key, leads: preferenciasMap[key], porcentaje: Math.round((preferenciasMap[key] / (clientes.length || 1)) * 100)
    })).sort((a, b) => b.leads - a.leads);

    // 6. Inventario (Tipologías Reales)
    const typoMap = propiedades.reduce((acc: any, p) => {
      const typo = p.tipologia || p.categoria || 'Sin definir';
      if (!acc[typo]) acc[typo] = { total: 0, v: 0, r: 0, d: 0, monto: 0 };
      
      acc[typo].total += 1;
      const precioUnidad = Number(p.precio || p.precio_lista) || 0;

      if (p.estado === 'Vendido') { acc[typo].v += 1; acc[typo].monto += precioUnidad; } 
      else if (p.estado === 'Reservado') { acc[typo].r += 1; acc[typo].monto += precioUnidad; } 
      else { acc[typo].d += 1; }
      return acc;
    }, {});
    const datosTipologia = Object.keys(typoMap).map(key => ({ tipo: key, ...typoMap[key] }));

    // 7. Top Cotizaciones
    const quotesMap = cotizaciones.reduce((acc: any, c) => {
      const unit = c.unidad_numero || 'Sin Unidad';
      acc[unit] = (acc[unit] || 0) + 1;
      return acc;
    }, {});
    const topCotizadas = Object.keys(quotesMap).map(key => {
      const propInfo = propiedades.find(p => p.unidad === key || p.numero === key);
      return {
        unidad: `Unidad ${key}`,
        tipo: propInfo?.tipologia || propInfo?.categoria || 'Inmueble',
        vistas: propInfo?.vista || 'N/A',
        total: quotesMap[key]
      };
    }).sort((a, b) => b.total - a.total).slice(0, 3);

    return { metricas, datosMarketing, datosCampanas, datosCiudades, datosPreferencias, datosTipologia, topCotizadas };
  }, [rawData, filtroTiempo]);

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#dce3eb]">
        <p className="text-sm font-bold tracking-widest text-[#ea0029] uppercase animate-pulse">Sincronizando Business Intelligence...</p>
      </div>
    );
  }

  const { metricas, datosMarketing, datosCampanas, datosCiudades, datosPreferencias, datosTipologia, topCotizadas } = dataFiltrada;

  return (
    <div className="min-h-screen bg-[#dce3eb] p-4 md:p-8 font-sans text-[#415364] antialiased">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER CONTROL COMERCIAL */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-[#415364]/10 pb-6 gap-4">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-[#ea0029] uppercase">
              Konkeri Developer Group
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-[#415364] mt-1">
              Business Intelligence
            </h1>
            <p className="text-xs text-[#415364]/70 mt-1 font-medium">Auditoría en tiempo real de eficiencia comercial y absorción del proyecto.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
            <span className="inline-flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest bg-white text-[#415364] rounded-lg border border-[#415364]/20 shadow-sm">
              <svg className="w-4 h-4 text-[#ea0029]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
              Arienzo Boutique Living
            </span>
            
            {/* SELECTOR DE TIEMPO REAL */}
            <select 
              value={filtroTiempo} 
              onChange={(e) => setFiltroTiempo(e.target.value as any)}
              className="bg-[#21242E] text-white text-xs font-bold px-4 py-2.5 rounded-lg outline-none shadow-md cursor-pointer hover:bg-black transition-colors"
            >
              <option value="todo">Histórico Global</option>
              <option value="mes">Este Mes</option>
              <option value="trimestre">Este Trimestre</option>
              <option value="ano">Este Año</option>
            </select>
          </div>
        </div>

        {/* TARJETAS DE KPIS PRINCIPALES (DISEÑO PREMIUM KONKERI) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm hover:shadow-md transition-shadow group">
            <p className="text-[10px] font-bold text-[#415364]/50 uppercase tracking-widest">Leads Captados</p>
            <h3 className="text-3xl font-light text-[#415364] mt-2 group-hover:scale-105 transition-transform origin-left">{metricas.totalLeads}</h3>
            <span className="text-[10px] text-[#415364]/60 font-bold mt-2 block">Base de datos CRM</span>
          </div>
          
          <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm hover:shadow-md transition-shadow group">
            <p className="text-[10px] font-bold text-[#D1C292] uppercase tracking-widest">Accesos VIP Web</p>
            <h3 className="text-3xl font-light text-[#21242E] mt-2 group-hover:scale-105 transition-transform origin-left">{metricas.totalPasesVip}</h3>
            <span className="text-[10px] text-[#415364]/60 font-bold mt-2 block">Interacción autónoma</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm hover:shadow-md transition-shadow group">
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Reservas Activas</p>
            <h3 className="text-3xl font-light text-amber-600 mt-2 group-hover:scale-105 transition-transform origin-left">{metricas.totalReservas}</h3>
            <span className="text-[10px] text-amber-600/60 font-bold mt-2 block">Bloqueos de inventario</span>
          </div>

          <div className="bg-[#21242E] p-5 rounded-2xl border border-neutral-800 shadow-md group">
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex justify-between">
              Ventas Firmadas
              <span className="bg-emerald-400/20 text-emerald-400 px-1.5 py-0.5 rounded text-[8px]">Tasa: {metricas.tasaCierre}%</span>
            </p>
            <h3 className="text-3xl font-bold text-white mt-2 group-hover:scale-105 transition-transform origin-left">{metricas.totalVentas}</h3>
            <span className="text-[10px] text-white/50 font-medium mt-2 block">Promesas / Escrituras</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border-l-4 border-[#ea0029] shadow-md group">
            <p className="text-[10px] font-bold text-[#ea0029] uppercase tracking-widest">Volumen Colocado</p>
            <h3 className="text-2xl font-bold text-[#415364] mt-2 font-mono group-hover:scale-105 transition-transform origin-left">
              ${(metricas.montoColocado / 1000000).toFixed(2)}M
            </h3>
            <span className="text-[10px] text-[#415364]/70 font-bold mt-2 block">
              {metricas.montoInventario > 0 ? ((metricas.montoColocado / metricas.montoInventario) * 100).toFixed(1) : 0}% de ${(metricas.montoInventario / 1000000).toFixed(2)}M
            </span>
          </div>
        </div>

        {/* SELECTOR DE PESTAÑAS TIPO PÍLDORA */}
        <div className="flex flex-wrap gap-3 bg-white w-fit p-1.5 rounded-xl shadow-sm border border-neutral-200/60">
          {[
            { id: 'marketing', label: 'Marketing y Perfil', icon: '📢' },
            { id: 'conversion', label: 'Embudo de Ventas', icon: '🎯' },
            { id: 'ventas', label: 'Absorción de Inventario', icon: '🏢' },
            { id: 'cotizaciones', label: 'Demanda Simulada', icon: '📄' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTabActiva(tab.id as any)}
              className={`px-5 py-2.5 text-xs font-bold tracking-wider uppercase rounded-lg transition-all flex items-center gap-2 ${
                tabActiva === tab.id 
                  ? 'bg-[#ea0029] text-white shadow-md' 
                  : 'bg-transparent text-[#415364]/60 hover:text-[#415364] hover:bg-[#dce3eb]/30'
              }`}
            >
              <span className="text-sm">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* CONTENIDO DINÁMICO */}
        <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-sm p-6 md:p-8 min-h-[500px]">
          
          {/* TAB 1: MARKETING, ORIGEN Y PERFIL */}
          {tabActiva === 'marketing' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="border-b border-neutral-100 pb-4">
                <h2 className="text-sm font-bold text-[#415364] uppercase tracking-widest flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#ea0029]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path></svg>
                  Inteligencia de Audiencia y Tráfico
                </h2>
                <p className="text-xs text-[#415364]/60 mt-1 font-medium">Mide el impacto de tus canales digitales, campañas específicas y la demografía de tus leads en el periodo seleccionado.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                <div className="space-y-5 bg-[#F9F7F5] p-6 rounded-2xl border border-[#415364]/10 shadow-inner">
                  <h4 className="font-bold text-[#21242E] uppercase tracking-widest text-[10px] border-b border-neutral-200 pb-2">Rendimiento por Campaña</h4>
                  {datosCampanas.length > 0 ? datosCampanas.map((item, idx) => (
                    <div key={idx} className="text-xs space-y-1.5 group">
                      <div className="flex justify-between font-bold">
                        <span className="text-[#415364] uppercase truncate pr-2 group-hover:text-[#ea0029] transition-colors">{item.campana}</span>
                        <span className="text-[#ea0029] font-mono">{item.leads} Lds ({item.porcentaje}%)</span>
                      </div>
                      <div className="w-full bg-[#dce3eb] h-2 rounded-full overflow-hidden">
                        <div className="h-full bg-[#ea0029] transition-all duration-1000 ease-out" style={{ width: `${item.porcentaje}%`, opacity: 1 - (idx * 0.15) }}></div>
                      </div>
                    </div>
                  )) : (
                     <p className="text-xs text-[#415364]/40 italic font-bold">No hay campañas registradas.</p>
                  )}
                </div>

                <div className="space-y-5 bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm hover:border-[#ea0029]/30 transition-colors">
                  <h4 className="font-bold text-[#415364] uppercase tracking-widest text-[10px] border-b border-neutral-100 pb-2">Canal de Captación Global</h4>
                  {datosMarketing.length > 0 ? datosMarketing.map((item, idx) => (
                    <div key={idx} className="text-xs space-y-1.5">
                      <div className="flex justify-between font-bold">
                        <span className="text-[#415364] uppercase truncate pr-2">{item.medio}</span>
                        <span className="text-[#415364] font-mono">{item.leads} ({item.porcentaje}%)</span>
                      </div>
                      <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                        <div className="h-full bg-[#415364]" style={{ width: `${item.porcentaje}%`, opacity: 1 - (idx * 0.15) }}></div>
                      </div>
                    </div>
                  )) : (
                     <p className="text-xs text-[#415364]/40 italic font-bold">Sin datos de origen.</p>
                  )}
                </div>

                <div className="space-y-5 bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm hover:border-[#D1C292] transition-colors">
                  <h4 className="font-bold text-[#415364] uppercase tracking-widest text-[10px] border-b border-neutral-100 pb-2">Ciudad de Residencia (Procedencia)</h4>
                  {datosCiudades.length > 0 ? datosCiudades.map((item, idx) => (
                    <div key={idx} className="text-xs space-y-1.5">
                      <div className="flex justify-between font-bold">
                        <span className="text-[#415364] uppercase truncate pr-2">{item.ciudad}</span>
                        <span className="text-[#415364] font-mono">{item.leads} ({item.porcentaje}%)</span>
                      </div>
                      <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                        <div className="h-full bg-[#D1C292]" style={{ width: `${item.porcentaje}%` }}></div>
                      </div>
                    </div>
                  )) : (
                     <p className="text-xs text-[#415364]/40 italic font-bold">Sin datos de ciudad.</p>
                  )}
                </div>

                <div className="space-y-5 bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm hover:border-amber-400 transition-colors">
                  <h4 className="font-bold text-[#415364] uppercase tracking-widest text-[10px] border-b border-neutral-100 pb-2">Tipología Solicitada Inicialmente</h4>
                  {datosPreferencias.length > 0 ? datosPreferencias.map((item, idx) => (
                    <div key={idx} className="text-xs space-y-1.5">
                      <div className="flex justify-between font-bold">
                        <span className="text-[#415364] uppercase truncate pr-2">{item.tipologia}</span>
                        <span className="text-[#415364] font-mono">{item.leads} ({item.porcentaje}%)</span>
                      </div>
                      <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500" style={{ width: `${item.porcentaje}%` }}></div>
                      </div>
                    </div>
                  )) : (
                     <p className="text-xs text-[#415364]/40 italic font-bold">Sin preferencias registradas.</p>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: EFICIENCIA DE CONVERSIÓN */}
          {tabActiva === 'conversion' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="border-b border-neutral-100 pb-4">
                <h2 className="text-sm font-bold text-[#415364] uppercase tracking-widest flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#ea0029]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
                  Embudo Transaccional
                </h2>
                <p className="text-xs text-[#415364]/60 mt-1 font-medium">Visualiza la caída de prospectos desde la captación hasta la firma (Tasa de conversión real: <strong className="text-[#ea0029]">{metricas.tasaCierre}%</strong>).</p>
              </div>
              
              <div className="space-y-6 max-w-3xl mx-auto mt-8 bg-[#F9F7F5] p-8 rounded-2xl border border-neutral-200/50 shadow-inner">
                {[
                  { etapa: '1. Leads Captados', valor: metricas.totalLeads, ratio: '100% de la base', color: 'bg-[#21242E]', text:'text-white' },
                  { etapa: '2. Accesos VIP Creados', valor: metricas.totalPasesVip, ratio: metricas.totalLeads > 0 ? `${((metricas.totalPasesVip/metricas.totalLeads)*100).toFixed(1)}% auto-gestion` : '0%', color: 'bg-[#D1C292]', text:'text-[#21242E]' },
                  { etapa: '3. Cotizaciones Emitidas', valor: metricas.totalCotizaciones, ratio: metricas.totalLeads > 0 ? `${((metricas.totalCotizaciones/metricas.totalLeads)*100).toFixed(1)}% del tráfico` : '0%', color: 'bg-[#415364]', text:'text-white' },
                  { etapa: '4. Reservas Formales', valor: metricas.totalReservas, ratio: metricas.totalCotizaciones > 0 ? `${((metricas.totalReservas/metricas.totalCotizaciones)*100).toFixed(1)}% cotizadas` : '0%', color: 'bg-amber-500', text:'text-white' },
                  { etapa: '5. Ventas / Promesas', valor: metricas.totalVentas, ratio: metricas.totalCotizaciones > 0 ? `${((metricas.totalVentas/metricas.totalCotizaciones)*100).toFixed(1)}% cierre (Cot vs Venta)` : '0%', color: 'bg-[#ea0029]', text:'text-white' },
                ].map((f, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-3 text-xs group">
                    <div className="w-48 font-bold text-[#415364] uppercase tracking-wider text-[10px]">{f.etapa}</div>
                    <div className="flex-1 bg-white h-10 rounded-xl overflow-hidden flex items-center relative border border-neutral-200 shadow-sm">
                      <div className={`h-full ${f.color} transition-all duration-1000 ease-out`} style={{ width: metricas.totalLeads > 0 ? `${Math.max(8, (f.valor / metricas.totalLeads) * 100)}%` : '0%' }}></div>
                      <span className={`absolute left-4 font-bold font-mono text-sm ${f.text}`}>{f.valor}</span>
                    </div>
                    <div className="w-40 sm:text-right font-bold text-[#415364]/50">{f.ratio}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: VENTAS Y ABSORCIÓN */}
          {tabActiva === 'ventas' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="border-b border-neutral-100 pb-4">
                <h2 className="text-sm font-bold text-[#415364] uppercase tracking-widest flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#ea0029]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                  Velocidad de Absorción y Disponibilidad
                </h2>
                <p className="text-xs text-[#415364]/60 mt-1 font-medium">Desglose del inventario real, agrupado por tipología de unidades. (No se ve afectado por el filtro de tiempo).</p>
              </div>
              
              <div className="overflow-x-auto border border-neutral-200/60 rounded-2xl shadow-sm custom-scrollbar">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-[#21242E] text-white text-[10px] uppercase tracking-widest border-b border-neutral-800">
                      <th className="px-5 py-4 font-bold">Tipología / Agrupación</th>
                      <th className="px-5 py-4 font-bold text-center">Total Creadas</th>
                      <th className="px-5 py-4 font-bold text-center text-emerald-400">Libres</th>
                      <th className="px-5 py-4 font-bold text-center text-amber-400">Reservas</th>
                      <th className="px-5 py-4 font-bold text-center text-[#ea0029]">Ventas Firmes</th>
                      <th className="px-5 py-4 font-bold text-right">Volumen Captado ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-[#415364]">
                    {datosTipologia.length > 0 ? datosTipologia.map((row, index) => (
                      <tr key={index} className="hover:bg-[#dce3eb]/30 transition-colors">
                        <td className="px-5 py-4 font-bold text-[#415364] uppercase text-xs">{row.tipo}</td>
                        <td className="px-5 py-4 text-center font-bold text-[#415364]/50">{row.total}</td>
                        <td className="px-5 py-4 text-center font-bold text-emerald-600 bg-emerald-50/50">{row.d}</td>
                        <td className="px-5 py-4 text-center font-bold text-amber-600 bg-amber-50/50">{row.r}</td>
                        <td className="px-5 py-4 text-center font-bold text-[#ea0029] bg-[#ea0029]/10">{row.v}</td>
                        <td className="px-5 py-4 text-right font-bold text-[#415364] font-mono text-[13px]">${row.monto.toLocaleString('en-US')}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan={6} className="text-center py-10 text-[#415364]/40 font-bold uppercase tracking-widest text-[10px]">No hay inventario registrado.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: ANALÍTICA DE COTIZACIONES */}
          {tabActiva === 'cotizaciones' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="border-b border-neutral-100 pb-4">
                <h2 className="text-sm font-bold text-[#415364] uppercase tracking-widest flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#ea0029]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  Inteligencia de Demanda Financiera
                </h2>
                <p className="text-xs text-[#415364]/60 mt-1 font-medium">Ranking de las unidades específicas que mayor cantidad de propuestas comerciales han generado en el periodo.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                <div className="space-y-4">
                  <h4 className="text-[11px] font-bold text-[#415364]/50 uppercase tracking-widest">Top 3 Unidades Más Perfiladas</h4>
                  <div className="divide-y divide-neutral-100 border border-neutral-200/60 rounded-xl p-3 shadow-sm bg-white">
                    {topCotizadas.length > 0 ? topCotizadas.map((c, i) => (
                      <div key={i} className="p-4 flex justify-between items-center hover:bg-[#dce3eb]/30 rounded-lg transition-colors">
                        <div className="flex items-center gap-4">
                          <span className={`text-2xl font-black ${i === 0 ? 'text-[#D1C292]' : 'text-neutral-200'}`}>#{i+1}</span>
                          <div>
                            <p className="font-bold text-[#415364] text-sm">{c.unidad}</p>
                            <p className="text-[10px] text-[#415364]/50 uppercase tracking-wider font-bold mt-0.5">{c.tipo} — {c.vistas}</p>
                          </div>
                        </div>
                        <span className="bg-[#ea0029] text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-sm">
                          {c.total} simulaciones
                        </span>
                      </div>
                    )) : (
                      <p className="p-6 text-xs text-[#415364]/40 font-bold uppercase tracking-widest text-center">Aún no se han guardado cotizaciones en este periodo.</p>
                    )}
                  </div>
                </div>
                
                <div className="bg-[#21242E] p-8 rounded-2xl shadow-xl flex flex-col justify-center text-sm space-y-4">
                  <p className="font-bold text-[#D1C292] uppercase tracking-widest text-[11px] flex items-center gap-2 border-b border-white/10 pb-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    Auditoría de Precio Base
                  </p>
                  <p className="font-medium text-white/80 leading-relaxed text-xs">
                    Este panel permite auditar el apetito real del mercado de forma quirúrgica. 
                  </p>
                  <p className="font-medium text-white/80 leading-relaxed text-xs">
                    Si una unidad lidera sistemáticamente las cotizaciones pero no se traduce en reservas formales, indica que el cliente percibe el valor del inmueble, pero <strong className="text-white">su precio requiere un ajuste estratégico</strong> o una oferta promocional de cierre.
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