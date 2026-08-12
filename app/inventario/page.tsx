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
    const base = "inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide transition duration-150 ";
    
    switch (estadoLimpio) {
      case 'disponible': 
        return <span className={base + "bg-emerald-50 text-emerald-700 border border-emerald-200"}>Disponible</span>;
      case 'reservado': 
        return <span className={base + "bg-amber-50 text-amber-700 border border-amber-200"}>Reservado</span>;
      case 'bloqueado': 
        return <span className={base + "bg-neutral-100 text-neutral-600 border border-neutral-300"}>Bloqueado</span>;
      case 'vendido': 
        return <span className={base + "bg-rose-50 text-[#B94A36] border border-rose-200"}>Vendido</span>;
      default: 
        return <span className={base + "bg-gray-50 text-gray-600 border border-gray-200"}>{estado}</span>;
    }
  };

  // =========================================================================
  // IMPRESIÓN COMPACTA EN 1 SOLA HOJA CON ORDEN: PRECIO Y LUEGO $/M²
  // =========================================================================
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
            <tr class="bg-[#F2EAE4]/60">
              <td colspan="8" class="px-1.5 py-[2px] text-[7px] font-bold text-[#B94A36] uppercase tracking-widest border-y border-[#EAE3DC] leading-none">
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
            
            // ELIMINACIÓN TOTAL Y ABSOLUTA DE LA PALABRA UNIDAD
            let nombreUnidad = String(unidad.unidad || unidad.numero || '')
              .replace(/unidad/gi, '')
              .replace(/u\./gi, '')
              .trim();

            const estado = String(unidad.estado || 'Disponible').replace(/['"]/g, '').trim();
            const colorEstado = estado.toLowerCase() === 'disponible' ? 'text-emerald-600' : 
                                estado.toLowerCase() === 'vendido' ? 'text-[#B94A36]' : 
                                estado.toLowerCase() === 'reservado' ? 'text-amber-600' : 'text-neutral-500';

            filasHTML += `
              <tr class="border-b border-neutral-100">
                <td class="px-1.5 py-[2px] font-bold text-neutral-900 leading-none text-[8px]">${nombreUnidad}</td>
                <td class="px-1.5 py-[2px] text-neutral-600 leading-none truncate max-w-[80px] text-[8px]">${unidad.tipologia || '---'}</td>
                <td class="px-1.5 py-[2px] font-medium text-center leading-none text-[8px]">${unidad.area_total} m²</td>
                
                <!-- LISTA 0: PRIMERO PRECIO, LUEGO $/M2 -->
                <td class="px-1.5 py-[2px] text-right font-bold text-emerald-800 font-mono bg-emerald-50/50 leading-none text-[8px]">
                  $${precioL0.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                </td>
                <td class="px-1.5 py-[2px] text-right font-mono text-emerald-700/80 bg-emerald-50/30 leading-none text-[7.5px]">
                  ${m2L0.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})} <span class="text-[6px] text-neutral-400">$/m²</span>
                </td>

                <!-- LISTA 1: PRIMERO PRECIO, LUEGO $/M2 -->
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
                @page { 
                  size: A4 landscape; 
                  margin: 5mm 8mm; 
                }
                body { 
                  -webkit-print-color-adjust: exact !important; 
                  print-color-adjust: exact !important; 
                  font-family: ui-sans-serif, system-ui, sans-serif; 
                }
              </style>
            </head>
            <body class="bg-white text-neutral-900 p-0 m-0 text-[7px]">
              <div class="w-full">
                
                <!-- Encabezado Minimalista Ultra Reducido -->
                <div class="flex justify-between items-end border-b border-[#B94A36] pb-1 mb-1.5">
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
                    <div className="flex items-center gap-1 mb-0.5">
                      <div class="w-2 h-2 bg-white border border-neutral-200 rounded-sm"></div>
                      <span class="font-medium text-neutral-600"><strong class="text-neutral-900">Lista 1:</strong> Precio Base</span>
                    </div>
                    <div class="text-right ml-3">
                      <p class="text-[7px] font-bold text-[#B94A36] uppercase tracking-widest leading-none">Konkeri Real Estate Group</p>
                      <p class="text-[6px] text-neutral-500 mt-0.5 leading-none">Emisión: ${fechaActual}</p>
                    </div>
                  </div>
                </div>

                <!-- Tabla Principal Comprimida al Máximo -->
                <table class="w-full text-left border-collapse border border-neutral-200">
                  <thead>
                    <tr class="bg-neutral-900 text-white text-[7px] uppercase tracking-wider leading-tight">
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
      <div className="flex min-h-screen items-center justify-center bg-[#F9F9F9]">
        <p className="text-xs font-medium tracking-widest text-[#B94A36] uppercase animate-pulse">
          Sincronizando Inventario Konkeri...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F9] px-6 py-10 font-sans text-neutral-800 antialiased">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER PRINCIPAL */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between border-b border-neutral-200 pb-6 mb-8">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-[#B94A36] uppercase">
              {proyectoSeleccionado ? 'Arienzo Boutique Living' : 'Konkeri Developer Group'}
            </span>
            <h1 className="text-3xl font-light tracking-tight text-neutral-900 mt-1">
              {proyectoSeleccionado ? 'Lista de Precios e Inventario' : 'Inventario General'}
            </h1>
            <p className="text-xs text-neutral-400 mt-1">
              {proyectoSeleccionado 
                ? 'Control de disponibilidad y valores comerciales.' 
                : 'Seleccione un proyecto para desplegar sus unidades y matriz comercial.'}
            </p>
          </div>

          <div className="mt-4 md:mt-0 flex items-center gap-3">
            {proyectoSeleccionado === 'arienzo' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => imprimirInventarioSeccion('departamentos')}
                  disabled={generandoImpresion}
                  className="text-[10px] font-bold tracking-widest uppercase bg-[#B94A36] hover:bg-[#9B3B2B] text-white px-4 py-2.5 rounded-lg transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {generandoImpresion ? '⏳...' : '🏢 Imprimir Departamentos'}
                </button>
                <button
                  onClick={() => imprimirInventarioSeccion('locales')}
                  disabled={generandoImpresion}
                  className="text-[10px] font-bold tracking-widest uppercase bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2.5 rounded-lg transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5"
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
                className="text-[11px] font-bold tracking-widest uppercase bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-700 px-4 py-2.5 rounded-lg transition-all"
              >
                ← Volver
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
                  className="group relative bg-white border border-neutral-200 rounded-xl p-6 shadow-xs hover:shadow-md hover:border-neutral-400 cursor-pointer transition-all duration-300 flex flex-col justify-between min-h-[190px]"
                >
                  <div className="space-y-4">
                    <div className="w-14 h-14 rounded-lg bg-neutral-50 border border-neutral-200/60 flex items-center justify-center text-neutral-300 font-mono text-[10px] tracking-widest group-hover:bg-[#F2EAE4] group-hover:border-[#B94A36]/20 transition-colors uppercase font-bold">
                      [ Logo ]
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-neutral-900 group-hover:text-[#B94A36] transition-colors">
                        {proy.nombre}
                      </h3>
                      <p className="text-xs text-neutral-400 font-light">{proy.ubicacion}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-neutral-100 flex justify-between items-center text-[11px]">
                    <span className="text-neutral-400 font-light">Unidades en Ficha</span>
                    <span className="font-bold text-neutral-800 bg-neutral-50 border border-neutral-200 px-2 py-0.5 rounded">
                      {proy.id === 'arienzo' ? propiedades.length : 0} u.
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          
          /* GESTOR DE INVENTARIO TRADICIONAL */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* TABLA PRINCIPAL */}
            <div className={`space-y-6 transition-all duration-300 ${unidadAEditar ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
              {Object.keys(inventarioPorPisos).map((pisoKey) => {
                const unidadesDelPiso = inventarioPorPisos[pisoKey];
                if (unidadesDelPiso.length === 0) return null;

                return (
                  <div key={pisoKey} className="bg-white rounded-xl border border-neutral-200/80 shadow-sm overflow-hidden transition-all">
                    <div className="bg-neutral-50/50 px-6 py-3 border-b border-neutral-200/60 flex justify-between items-center">
                      <h2 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">{pisoKey}</h2>
                      <span className="text-[11px] text-neutral-400 font-medium">{unidadesDelPiso.length} Unidades</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-neutral-200 text-neutral-400 text-[9px] uppercase tracking-wider bg-white">
                            <th className="px-4 py-3 font-semibold">Unidad</th>
                            <th className="px-4 py-3 font-semibold">Tipología</th>
                            <th className="px-4 py-3 font-semibold text-center">Área</th>
                            <th className="px-4 py-3 font-semibold text-right text-emerald-700 bg-emerald-50/50">Lista 0 (-5%)</th>
                            <th className="px-4 py-3 font-semibold text-right text-emerald-700 bg-emerald-50/30">$/m² L0</th>
                            <th className="px-4 py-3 font-semibold text-right border-l border-neutral-100">Lista 1 (Base)</th>
                            <th className="px-4 py-3 font-semibold text-right">$/m² L1</th>
                            <th className="px-4 py-3 font-semibold text-center">Estado</th>
                            <th className="px-4 py-3 font-semibold text-right">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 text-neutral-700 bg-white">
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
                                className={`transition duration-150 ${estaSeleccionado ? 'bg-[#B94A36]/5 hover:bg-[#B94A36]/5' : 'hover:bg-neutral-50/60'}`}
                              >
                                <td className="px-4 py-3 font-bold text-neutral-900 whitespace-nowrap">
                                  {unidad.unidad.toUpperCase().startsWith('LOCAL') || unidad.unidad.toUpperCase().startsWith('PB') 
                                    ? unidad.unidad 
                                    : `Unidad ${unidad.unidad}`}
                                </td>
                                <td className="px-4 py-3 text-neutral-500 font-light truncate max-w-[120px]" title={unidad.tipologia}>{unidad.tipologia || '---'}</td>
                                <td className="px-4 py-3 font-medium text-center">{unidad.area_total}m²</td>
                                
                                <td className="px-4 py-3 text-right font-bold text-emerald-700 bg-emerald-50/50">
                                  ${precioL0.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                </td>
                                <td className="px-4 py-3 text-right font-mono text-emerald-700/80 bg-emerald-50/30 text-[11px]">
                                  ${m2L0.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                                </td>

                                <td className="px-4 py-3 text-right font-bold text-neutral-900 border-l border-neutral-100">
                                  ${precioL1.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                </td>
                                <td className="px-4 py-3 text-right font-mono text-neutral-400 text-[11px]">
                                  ${m2L1.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                                </td>
                                
                                <td className="px-4 py-3 text-center">
                                  {obtenerBadgeEstado(unidad.estado)}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <button
                                    onClick={() => setUnidadAEditar(unidad)}
                                    className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded transition whitespace-nowrap ${
                                      estaSeleccionado 
                                        ? 'bg-[#B94A36] text-white' 
                                        : 'bg-white border border-neutral-200 text-neutral-600 hover:border-[#B94A36] hover:text-[#B94A36]'
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

            {/* PANEL LATERAL DE CONTROL COMERCIAL */}
            {unidadAEditar && (
              <div className="lg:col-span-4 bg-white rounded-xl border border-neutral-200 p-6 shadow-sm sticky top-6 space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
                <div className="flex justify-between items-start border-b border-neutral-100 pb-4">
                  <div>
                    <span className="text-[9px] font-bold tracking-widest text-[#B94A36] uppercase">Gestión Comercial</span>
                    <h3 className="text-xl font-light tracking-tight text-neutral-900 mt-1">
                      {unidadAEditar.unidad.toUpperCase().startsWith('LOCAL') ? unidadAEditar.unidad : `Unidad ${unidadAEditar.unidad}`}
                    </h3>
                  </div>
                  <button 
                    onClick={() => setUnidadAEditar(null)}
                    className="text-neutral-400 hover:text-neutral-600 text-xs bg-neutral-50 hover:bg-neutral-100 p-1.5 rounded-full w-7 h-7 flex items-center justify-center transition"
                  >
                    ✕
                  </button>
                </div>

                {/* FICHA RESUMEN */}
                <div className="space-y-3 bg-neutral-50 p-5 rounded-xl border border-neutral-200/60 text-xs">
                  <div className="flex justify-between"><span className="text-neutral-400 font-light">Área Total:</span><span className="font-semibold text-neutral-700">{unidadAEditar.area_total} m²</span></div>
                  <div className="flex justify-between"><span className="text-neutral-400 font-light">Distribución:</span><span className="font-semibold text-neutral-700 truncate max-w-[150px]" title={unidadAEditar.tipologia}>{unidadAEditar.tipologia || '---'}</span></div>
                  
                  <div className="flex justify-between border-t border-neutral-200/60 pt-3 mt-3">
                    <span className="text-emerald-700 font-medium">Lista 0 (-5%):</span>
                    <span className="font-bold text-emerald-700 text-sm">
                      ${(Number(unidadAEditar.precio) * 0.95).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500 font-medium">Lista 1 (Base):</span>
                    <span className="font-bold text-neutral-900 text-sm">
                      ${Number(unidadAEditar.precio || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* BOTONES DE CAMBIO DE ESTADO */}
                <div className="space-y-2.5">
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Cambiar Estado de Unidad:</label>
                  <div className="space-y-2">
                    {[
                      { key: 'Disponible', label: '🟢 Disponible para Venta', color: 'hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300', activeClass: 'border-emerald-500 bg-emerald-50 text-emerald-700 font-semibold shadow-sm' },
                      { key: 'Reservado', label: '🟡 Reservado (Con Cuota)', color: 'hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300', activeClass: 'border-amber-500 bg-amber-50 text-amber-700 font-semibold shadow-sm' },
                      { key: 'Bloqueado', label: '⚫ Bloqueado Administrativo', color: 'hover:bg-neutral-100 hover:text-neutral-800 hover:border-neutral-400', activeClass: 'border-neutral-600 bg-neutral-100 text-neutral-800 font-semibold shadow-sm' },
                      { key: 'Vendido', label: '🔴 Vendido / Cierre Contrato', color: 'hover:bg-rose-50 hover:text-[#B94A36] hover:border-rose-300', activeClass: 'border-[#B94A36] bg-rose-50 text-[#B94A36] font-semibold shadow-sm' }
                    ].map((item) => {
                      const esEstadoActivo = String(unidadAEditar.estado || '').replace(/['"]/g, '').toLowerCase().trim() === item.key.toLowerCase();
                      return (
                        <button
                          key={item.key}
                          disabled={guardando}
                          onClick={() => actualizarEstadoPropiedad(item.key)}
                          className={`w-full text-left text-xs p-3 rounded-lg border transition-all duration-200 disabled:opacity-50 ${
                            esEstadoActivo ? item.activeClass : 'border-neutral-200 text-neutral-600 bg-white ' + item.color
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
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