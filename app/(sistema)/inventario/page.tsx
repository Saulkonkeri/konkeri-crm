'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

interface Proyecto {
  id: string;
  nombre: string;
  ubicacion: string;
}

export default function InventarioPage() {
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState<string | null>(null);
  const [propiedades, setPropiedades] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  
  const [unidadAEditar, setUnidadAEditar] = useState<any>(null);
  const [guardando, setGuardando] = useState(false);
  const [generandoImpresion, setGenerandoImpresion] = useState(false);

  const proyectos: Proyecto[] = [
    {
      id: 'arienzo',
      nombre: 'Arienzo',
      ubicacion: 'Barbasquillo, Manta'
    }
  ];

  const obtenerDatos = async () => {
    setCargando(true);
    try {
      const { data, error } = await supabase
        .from('propiedades')
        .select('*');
        
      if (error) {
        console.error('Error al conectar con Supabase:', error);
      } else if (data) {
        const datosOrdenados = data.sort((a, b) => {
          const numA = parseInt(a.unidad || a.numero, 10) || 0;
          const numB = parseInt(b.unidad || b.numero, 10) || 0;
          return numA - numB;
        });
        setPropiedades(datosOrdenados);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    obtenerDatos();
  }, []);

  const inventarioPorPisos = useMemo(() => {
    const pisos: { [key: string]: any[] } = {
      'Planta Baja (Comercial)': [],
      'Piso 2': [],
      'Piso 3': [],
      'Piso 4': [],
      'Piso 5': [],
      'Piso 6': [],
    };

    propiedades.forEach((prop) => {
      const unidadStr = String(prop.unidad || prop.numero || '').toUpperCase().trim();
      const categoriaStr = String(prop.categoria || '').toUpperCase().trim();
      const tipologiaStr = String(prop.tipologia || '').toUpperCase().trim();
      const tipoStr = String(prop.tipo || '').toUpperCase().trim();
      
      if (
        categoriaStr === 'COMERCIO' || 
        categoriaStr === 'COMERCIAL' || 
        tipoStr === 'LOCAL' || 
        tipologiaStr === 'LOCAL' ||
        unidadStr.startsWith('PB') ||
        unidadStr.startsWith('LOCAL')
      ) {
        pisos['Planta Baja (Comercial)'].push(prop);
      } else {
        const primerDigito = unidadStr.charAt(0);
        const llavePiso = `Piso ${primerDigito}`;
        
        if (pisos[llavePiso]) {
          pisos[llavePiso].push(prop);
        } else if (prop.piso && pisos[`Piso ${prop.piso}`]) {
          pisos[`Piso ${prop.piso}`].push(prop);
        }
      }
    });

    return pisos;
  }, [propiedades]);

  const actualizarEstadoPropiedad = async (nuevoEstado: string) => {
    setGuardando(true);
    try {
      const { error } = await supabase
        .from('propiedades')
        .update({ estado: nuevoEstado })
        .eq('id', unidadAEditar.id);

      if (!error) {
        setPropiedades((prev) =>
          prev.map((p) => (p.id === unidadAEditar.id ? { ...p, estado: nuevoEstado } : p))
        );
        setUnidadAEditar((prev: any) => prev ? { ...prev, estado: nuevoEstado } : null);
      } else {
        alert(`Error al guardar en Supabase: ${error.message}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGuardando(false);
    }
  };

  const obtenerBadgeEstado = (estado: string) => {
    const estadoLimpio = String(estado || 'Disponible').replace(/['"]/g, '').toLowerCase().trim();
    const base = "inline-flex items-center justify-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ";
    
    switch (estadoLimpio) {
      case 'disponible': 
        return <span className={base + "bg-emerald-50 text-emerald-700 border border-emerald-200"}>Disponible</span>;
      case 'reservado': 
        return <span className={base + "bg-amber-50 text-amber-700 border border-amber-200"}>Reservado</span>;
      case 'bloqueado': 
        return <span className={base + "bg-neutral-100 text-neutral-600 border border-neutral-300"}>Bloqueado</span>;
      case 'vendido': 
        return <span className={base + "bg-[#ea0029]/10 text-[#ea0029] border border-[#ea0029]/20"}>Vendido</span>;
      default: 
        return <span className={base + "bg-gray-50 text-gray-600 border border-gray-200"}>{estado}</span>;
    }
  };

  const imprimirInventarioSeccion = (tipoSeccion: 'locales' | 'departamentos') => {
    setGenerandoImpresion(true);
    
    setTimeout(() => {
      try {
        const ventanaImpresion = window.open('', '_blank');
        if (!ventanaImpresion) {
          alert("Por favor, permite las ventanas emergentes del navegador.");
          setGenerandoImpresion(false);
          return;
        }

        const urlLogo = `${window.location.origin}/logo-arienzo.png`;
        const fechaActual = new Date().toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' });
        const tituloSeccion = tipoSeccion === 'locales' ? 'Locales Comerciales (Planta Baja)' : 'Departamentos Residenciales (Pisos 2 al 6)';

        let filasHTML = '';
        
        Object.keys(inventarioPorPisos).forEach(piso => {
          const unidades = inventarioPorPisos[piso];
          if (unidades.length === 0) return;

          const esPlantaBaja = piso.includes('Planta Baja');
          
          if (tipoSeccion === 'locales' && !esPlantaBaja) return;
          if (tipoSeccion === 'departamentos' && esPlantaBaja) return;

          filasHTML += `
            <tr class="bg-[#dce3eb]/40">
              <td colspan="8" class="px-1.5 py-[2px] text-[7px] font-bold text-[#ea0029] uppercase tracking-widest border-y border-[#415364]/10 leading-none">
                ${piso}
              </td>
            </tr>
          `;

          unidades.forEach(unidad => {
            const precioL1 = Number(unidad.precio || 0);
            const precioL0 = precioL1 * 0.95; 
            const area = Number(unidad.area_total || 1); 
            
            const m2L1 = precioL1 / area;
            const m2L0 = precioL0 / area;
            
            let nombreUnidad = String(unidad.unidad || unidad.numero || '')
              .replace(/unidad/gi, '')
              .replace(/u\./gi, '')
              .trim();

            const estado = String(unidad.estado || 'Disponible').replace(/['"]/g, '').trim();
            const colorEstado = estado.toLowerCase() === 'disponible' ? 'text-emerald-600' : 
                                estado.toLowerCase() === 'vendido' ? 'text-[#ea0029]' : 
                                estado.toLowerCase() === 'reservado' ? 'text-amber-600' : 'text-neutral-500';

            filasHTML += `
              <tr class="border-b border-neutral-100">
                <td class="px-1.5 py-[2px] font-bold text-neutral-900 leading-none text-[8px]">${nombreUnidad}</td>
                <td class="px-1.5 py-[2px] text-neutral-600 leading-none truncate max-w-[80px] text-[8px]">${unidad.tipologia || '---'}</td>
                <td class="px-1.5 py-[2px] font-medium text-center leading-none text-[8px]">${unidad.area_total} m²</td>
                
                <td class="px-1.5 py-[2px] text-right font-bold text-emerald-800 font-mono bg-emerald-50/50 leading-none text-[8px]">
                  $${precioL0.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                </td>
                <td class="px-1.5 py-[2px] text-right font-mono text-emerald-700/80 bg-emerald-50/30 leading-none text-[7.5px]">
                  ${m2L0.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})} <span class="text-[6px] text-neutral-400">$/m²</span>
                </td>

                <td class="px-1.5 py-[2px] text-right font-bold text-neutral-900 font-mono leading-none text-[8px] border-l border-neutral-200">
                  $${precioL1.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                </td>
                <td class="px-1.5 py-[2px] text-right font-mono text-neutral-500 leading-none text-[7.5px]">
                  ${m2L1.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})} <span class="text-[6px] text-neutral-400">$/m²</span>
                </td>
                
                <td class="px-1.5 py-[2px] text-center font-bold ${colorEstado} text-[7px] uppercase tracking-wider leading-none">${estado}</td>
              </tr>
            `;
          });
        });

        ventanaImpresion.document.write(`
          <html>
            <head>
              <title>Inventario_${tipoSeccion}_Arienzo</title>
              <script src="https://cdn.tailwindcss.com"></script>
              <style>
                @page { size: A4 landscape; margin: 5mm 8mm; }
                body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; font-family: ui-sans-serif, system-ui, sans-serif; }
              </style>
            </head>
            <body class="bg-white text-neutral-900 p-0 m-0 text-[7px]">
              <div class="w-full">
                <div class="flex justify-between items-end border-b border-[#ea0029] pb-1 mb-1.5">
                  <div class="flex items-center gap-2.5">
                    <img src="${urlLogo}" alt="Arienzo Logo" class="h-5 w-auto object-contain" />
                    <div class="border-l pl-2.5 border-neutral-300">
                      <h1 class="text-[8.5px] font-bold tracking-widest text-neutral-800 uppercase leading-none">Matriz de Precios — ${tituloSeccion}</h1>
                      <p class="text-[6px] text-neutral-500 uppercase tracking-widest mt-0.5 leading-none">Arienzo Boutique Living</p>
                    </div>
                  </div>
                  <div class="flex items-end gap-5 text-[7px]">
                    <div class="flex items-center gap-1 mb-0.5">
                      <div class="w-2 h-2 bg-emerald-100 border border-emerald-200 rounded-sm"></div>
                      <span class="font-medium text-neutral-600"><strong class="text-neutral-900">Lista 0:</strong> Descuento 5%</span>
                    </div>
                    <div class="flex items-center gap-1 mb-0.5">
                      <div class="w-2 h-2 bg-white border border-neutral-200 rounded-sm"></div>
                      <span class="font-medium text-neutral-600"><strong class="text-neutral-900">Lista 1:</strong> Precio Base</span>
                    </div>
                    <div class="text-right ml-3">
                      <p class="text-[7px] font-bold text-[#ea0029] uppercase tracking-widest leading-none">Konkeri Real Estate Group</p>
                      <p class="text-[6px] text-neutral-500 mt-0.5 leading-none">Emisión: ${fechaActual}</p>
                    </div>
                  </div>
                </div>

                <table class="w-full text-left border-collapse border border-neutral-200">
                  <thead>
                    <tr class="bg-[#21242E] text-white text-[7px] uppercase tracking-wider leading-tight">
                      <th class="px-1.5 py-1 font-semibold w-1/12 border border-neutral-700">Unidad</th>
                      <th class="px-1.5 py-1 font-semibold w-2/12 border border-neutral-700">Tipología</th>
                      <th class="px-1.5 py-1 font-semibold text-center border border-neutral-700">Área</th>
                      <th class="px-1.5 py-1 font-semibold text-right border border-emerald-800 bg-emerald-900 text-emerald-100">Precio Lista 0</th>
                      <th class="px-1.5 py-1 font-semibold text-right border border-emerald-800 bg-emerald-900 text-emerald-100">$/m² (L0)</th>
                      <th class="px-1.5 py-1 font-semibold text-right border border-neutral-700">Precio Lista 1</th>
                      <th class="px-1.5 py-1 font-semibold text-right border border-neutral-700">$/m² (L1)</th>
                      <th class="px-1.5 py-1 font-semibold text-center border border-neutral-700">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${filasHTML}
                  </tbody>
                </table>
              </div>
              <script>
                setTimeout(() => { window.print(); window.close(); }, 800);
              </script>
            </body>
          </html>
        `);
        
        ventanaImpresion.document.close();
      } catch (error) {
        console.error('Error al generar la impresión:', error);
        alert('Error al generar el documento PDF.');
      } finally {
        setGenerandoImpresion(false);
      }
    }, 300);
  };

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#dce3eb]">
        <p className="text-sm font-bold tracking-widest text-[#ea0029] uppercase animate-pulse">
          Sincronizando Inventario Konkeri...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#dce3eb] p-4 md:p-8 font-sans text-[#415364] antialiased">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER PRINCIPAL */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between border-b border-[#415364]/10 pb-6 mb-8">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-[#ea0029] uppercase">
              {proyectoSeleccionado ? 'Arienzo Boutique Living' : 'Konkeri Developer Group'}
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-[#415364] mt-1">
              {proyectoSeleccionado ? 'Lista de Precios e Inventario' : 'Inventario General'}
            </h1>
            <p className="text-xs text-[#415364]/70 mt-1 font-medium">
              {proyectoSeleccionado 
                ? 'Control de disponibilidad y valores comerciales actualizados.' 
                : 'Seleccione un proyecto para desplegar sus unidades y matriz comercial.'}
            </p>
          </div>

          <div className="mt-4 md:mt-0 flex items-center gap-3">
            {proyectoSeleccionado === 'arienzo' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => imprimirInventarioSeccion('departamentos')}
                  disabled={generandoImpresion}
                  className="text-[10px] font-bold tracking-widest uppercase bg-[#ea0029] hover:bg-[#c90022] text-white px-4 py-2.5 rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
                >
                  {generandoImpresion ? '⏳...' : '🏢 Imprimir Departamentos'}
                </button>
                <button
                  onClick={() => imprimirInventarioSeccion('locales')}
                  disabled={generandoImpresion}
                  className="text-[10px] font-bold tracking-widest uppercase bg-[#415364] hover:bg-[#21242E] text-white px-4 py-2.5 rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
                >
                  {generandoImpresion ? '⏳...' : '🏬 Imprimir Locales'}
                </button>
              </div>
            )}
            
            {proyectoSeleccionado && (
              <button
                onClick={() => {
                  setProyectoSeleccionado(null);
                  setUnidadAEditar(null);
                }}
                className="text-[10px] font-bold tracking-widest uppercase bg-white border border-[#415364]/20 hover:bg-[#415364]/5 text-[#415364] px-4 py-2.5 rounded-xl transition-all shadow-sm"
              >
                ← Volver al Hub
              </button>
            )}
          </div>
        </div>

        {/* HUB DE SELECCIÓN DE PROYECTO */}
        {!proyectoSeleccionado ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {proyectos.map((proy) => (
                <div
                  key={proy.id}
                  onClick={() => setProyectoSeleccionado(proy.id)}
                  className="group relative bg-white border border-neutral-200/60 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-[#ea0029]/40 cursor-pointer transition-all duration-300 flex flex-col justify-between min-h-[190px]"
                >
                  <div className="space-y-4">
                    <div className="w-14 h-14 rounded-xl bg-[#415364]/5 border border-[#415364]/10 flex items-center justify-center text-[#415364] font-mono text-[10px] tracking-widest group-hover:bg-[#ea0029] group-hover:text-white group-hover:border-transparent transition-all uppercase font-bold">
                      [ Logo ]
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#415364] group-hover:text-[#ea0029] transition-colors">
                        {proy.nombre}
                      </h3>
                      <p className="text-xs text-[#415364]/60 font-medium">{proy.ubicacion}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#415364]/10 flex justify-between items-center text-xs">
                    <span className="text-[#415364]/60 font-medium">Unidades en Ficha</span>
                    <span className="font-bold text-[#415364] bg-[#dce3eb]/50 border border-[#415364]/10 px-2.5 py-1 rounded-md">
                      {proy.id === 'arienzo' ? propiedades.length : 0} u.
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          
          /* GESTOR DE INVENTARIO TRADICIONAL */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* TABLA PRINCIPAL */}
            <div className={`space-y-6 transition-all duration-300 ${unidadAEditar ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
              {Object.keys(inventarioPorPisos).map((pisoKey) => {
                const unidadesDelPiso = inventarioPorPisos[pisoKey];
                if (unidadesDelPiso.length === 0) return null;

                return (
                  <div key={pisoKey} className="bg-white rounded-2xl border border-neutral-200/60 shadow-sm overflow-hidden transition-all">
                    <div className="bg-white px-6 py-4 border-b border-neutral-100 flex justify-between items-center">
                      <h2 className="text-xs font-bold text-[#415364] uppercase tracking-widest">{pisoKey}</h2>
                      <span className="text-[10px] text-[#415364]/60 font-bold bg-[#415364]/5 px-2.5 py-1 rounded-md uppercase tracking-wider">{unidadesDelPiso.length} Unidades</span>
                    </div>

                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-neutral-100 text-[#415364]/60 text-[9px] uppercase tracking-widest bg-neutral-50/50">
                            <th className="px-5 py-3.5 font-bold">Unidad</th>
                            <th className="px-5 py-3.5 font-bold">Tipología</th>
                            <th className="px-5 py-3.5 font-bold text-center">Área</th>
                            <th className="px-5 py-3.5 font-bold text-right text-emerald-800 bg-emerald-50/40">Lista 0 (-5%)</th>
                            <th className="px-5 py-3.5 font-bold text-right text-emerald-800 bg-emerald-50/20">$/m² L0</th>
                            <th className="px-5 py-3.5 font-bold text-right border-l border-neutral-200/60">Lista 1 (Base)</th>
                            <th className="px-5 py-3.5 font-bold text-right">$/m² L1</th>
                            <th className="px-5 py-3.5 font-bold text-center">Estado</th>
                            <th className="px-5 py-3.5 font-bold text-right">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 text-[#415364] bg-white">
                          {unidadesDelPiso.map((unidad) => {
                            const estaSeleccionado = unidadAEditar?.id === unidad.id;
                            
                            const precioL1 = Number(unidad.precio || 0);
                            const precioL0 = precioL1 * 0.95;
                            const area = Number(unidad.area_total || 1);
                            const m2L1 = precioL1 / area;
                            const m2L0 = precioL0 / area;

                            return (
                              <tr 
                                key={unidad.id} 
                                className={`transition-colors ${estaSeleccionado ? 'bg-[#ea0029]/5' : 'hover:bg-[#dce3eb]/30'}`}
                              >
                                <td className="px-5 py-4 font-bold text-[#415364] whitespace-nowrap text-xs">
                                  {unidad.unidad.toUpperCase().startsWith('LOCAL') || unidad.unidad.toUpperCase().startsWith('PB') 
                                    ? unidad.unidad 
                                    : `Unidad ${unidad.unidad}`}
                                </td>
                                <td className="px-5 py-4 text-[#415364]/70 font-medium truncate max-w-[120px]" title={unidad.tipologia}>{unidad.tipologia || '---'}</td>
                                <td className="px-5 py-4 font-bold text-center">{unidad.area_total}m²</td>
                                
                                <td className="px-5 py-4 text-right font-bold text-emerald-800 bg-emerald-50/40 font-mono text-xs">
                                  ${precioL0.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                </td>
                                <td className="px-5 py-4 text-right font-mono text-emerald-700/80 bg-emerald-50/20 text-[11px] font-bold">
                                  ${m2L0.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                                </td>

                                <td className="px-5 py-4 text-right font-bold text-[#415364] border-l border-neutral-200/60 font-mono text-xs">
                                  ${precioL1.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                </td>
                                <td className="px-5 py-4 text-right font-mono text-[#415364]/50 text-[11px] font-bold">
                                  ${m2L1.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                                </td>
                                
                                <td className="px-5 py-4 text-center">
                                  {obtenerBadgeEstado(unidad.estado)}
                                </td>
                                <td className="px-5 py-4 text-right">
                                  <button
                                    onClick={() => setUnidadAEditar(unidad)}
                                    className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                                      estaSeleccionado 
                                        ? 'bg-[#ea0029] text-white shadow-sm' 
                                        : 'bg-white border border-[#415364]/20 text-[#415364] hover:border-[#ea0029] hover:text-[#ea0029]'
                                    }`}
                                  >
                                    Editar
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* PANEL LATERAL DE CONTROL COMERCIAL (DRAWER) */}
            {unidadAEditar && (
              <div className="lg:col-span-4 bg-white rounded-2xl border border-neutral-200/60 shadow-xl sticky top-6 space-y-6 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-200">
                
                {/* Cabecera Oscura Estilo CRM */}
                <div className="p-6 bg-[#21242E] text-white relative flex justify-between items-center shadow-md">
                  <div>
                    <span className="text-[9px] font-bold tracking-widest text-[#ea0029] uppercase">Gestión Comercial</span>
                    <h3 className="text-xl font-bold tracking-tight mt-0.5">
                      {unidadAEditar.unidad.toUpperCase().startsWith('LOCAL') ? unidadAEditar.unidad : `Unidad ${unidadAEditar.unidad}`}
                    </h3>
                  </div>
                  <button 
                    onClick={() => setUnidadAEditar(null)}
                    className="text-white/50 hover:text-white bg-white/10 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* FICHA RESUMEN */}
                  <div className="space-y-3 bg-[#dce3eb]/30 p-5 rounded-xl border border-[#415364]/10 text-xs">
                    <div className="flex justify-between"><span className="text-[#415364]/60 font-bold uppercase tracking-wider text-[9px]">Área Total:</span><span className="font-bold text-[#415364]">{unidadAEditar.area_total} m²</span></div>
                    <div className="flex justify-between"><span className="text-[#415364]/60 font-bold uppercase tracking-wider text-[9px]">Distribución:</span><span className="font-bold text-[#415364] truncate max-w-[150px]" title={unidadAEditar.tipologia}>{unidadAEditar.tipologia || '---'}</span></div>
                    
                    <div className="flex justify-between border-t border-[#415364]/10 pt-3 mt-3">
                      <span className="text-emerald-800 font-bold uppercase tracking-wider text-[9px]">Lista 0 (-5%):</span>
                      <span className="font-bold text-emerald-800 text-sm font-mono">
                        ${(Number(unidadAEditar.precio) * 0.95).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#415364]/70 font-bold uppercase tracking-wider text-[9px]">Lista 1 (Base):</span>
                      <span className="font-bold text-[#415364] text-sm font-mono">
                        ${Number(unidadAEditar.precio || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* BOTONES DE CAMBIO DE ESTADO */}
                  <div className="space-y-2.5">
                    <label className="block text-[10px] font-bold text-[#415364]/60 uppercase tracking-widest">Cambiar Estado de Unidad:</label>
                    <div className="space-y-2.5">
                      {[
                        { key: 'Disponible', label: '🟢 Disponible para Venta', color: 'hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300', activeClass: 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold shadow-sm' },
                        { key: 'Reservado', label: '🟡 Reservado (Con Cuota)', color: 'hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300', activeClass: 'border-amber-500 bg-amber-50 text-amber-700 font-bold shadow-sm' },
                        { key: 'Bloqueado', label: '⚫ Bloqueado Administrativo', color: 'hover:bg-neutral-100 hover:text-neutral-800 hover:border-neutral-400', activeClass: 'border-neutral-600 bg-neutral-100 text-neutral-800 font-bold shadow-sm' },
                        { key: 'Vendido', label: '🔴 Vendido / Cierre Contrato', color: 'hover:bg-[#ea0029]/10 hover:text-[#ea0029] hover:border-[#ea0029]/30', activeClass: 'border-[#ea0029] bg-[#ea0029]/10 text-[#ea0029] font-bold shadow-sm' }
                      ].map((item) => {
                        const esEstadoActivo = String(unidadAEditar.estado || '').replace(/['"]/g, '').toLowerCase().trim() === item.key.toLowerCase();
                        return (
                          <button
                            key={item.key}
                            disabled={guardando}
                            onClick={() => actualizarEstadoPropiedad(item.key)}
                            className={`w-full text-left text-xs p-3.5 rounded-xl border transition-all duration-200 disabled:opacity-50 font-medium ${
                              esEstadoActivo ? item.activeClass : 'border-[#415364]/20 text-[#415364] bg-white ' + item.color
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}