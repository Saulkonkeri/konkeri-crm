// Actualizacion para Vercel - Reserva Express (Orientacion en columnas y Planta Baja robusta)
'use client';

import { useState } from 'react';

// INVENTARIO REAL - AGOSTO 2026
const INVENTARIO = [
  // PISO 6
  { id: '604', piso: 6, tipo: '2 Dormitorios', vista: 'Wyndham Poseidón / Mar', precio: 205865, area: 106.65, estado: 'RESERVADO' },
  { id: '603', piso: 6, tipo: '3 Dorms (Esquinero)', vista: 'Panorámica a La Quadra / Umiña / Mar', precio: 293967, area: 152.72, estado: 'DISPONIBLE' },
  { id: '602', piso: 6, tipo: '1 Dormitorio', vista: 'La Quadra / Umiña / Mar', precio: 169369, area: 86.60, estado: 'DISPONIBLE' },
  { id: '601', piso: 6, tipo: '3 Dormitorios', vista: 'La Quadra / Umiña / Mar', precio: 308760, area: 158.54, estado: 'RESERVADO' },
  // PISO 5
  { id: '504', piso: 5, tipo: '2 Dormitorios', vista: 'Wyndham Poseidón / Mar', precio: 201794, area: 106.65, estado: 'RESERVADO' },
  { id: '503', piso: 5, tipo: '3 Dorms (Esquinero)', vista: 'Panorámica a La Quadra / Umiña / Mar', precio: 290840, area: 152.72, estado: 'DISPONIBLE' },
  { id: '502', piso: 5, tipo: '1 Dormitorio', vista: 'La Quadra / Umiña / Mar', precio: 165702, area: 86.60, estado: 'DISPONIBLE' },
  { id: '501', piso: 5, tipo: '3 Dormitorios', vista: 'La Quadra / Umiña / Mar', precio: 303228, area: 158.54, estado: 'DISPONIBLE' },
  // PISO 4
  { id: '404', piso: 4, tipo: '2 Dormitorios', vista: 'Wyndham Poseidón / Mar', precio: 199677, area: 106.65, estado: 'DISPONIBLE' },
  { id: '403', piso: 4, tipo: '3 Dorms (Esquinero)', vista: 'Panorámica a La Quadra / Umiña / Mar', precio: 287042, area: 152.72, estado: 'DISPONIBLE' },
  { id: '402', piso: 4, tipo: '1 Dormitorio', vista: 'La Quadra / Umiña / Mar', precio: 163257, area: 86.60, estado: 'DISPONIBLE' },
  { id: '401', piso: 4, tipo: '3 Dormitorios', vista: 'La Quadra / Umiña / Mar', precio: 299079, area: 158.54, estado: 'RESERVADO' },
  // PISO 3
  { id: '301', piso: 3, tipo: '1 Dormitorio', vista: 'Urbanización (Posterior)', precio: 131529, area: 70.25, estado: 'DISPONIBLE' },
  { id: '305', piso: 3, tipo: '1 Dormitorio', vista: 'Wyndham Poseidón / Mar', precio: 152779, area: 78.87, estado: 'DISPONIBLE' },
  { id: '304', piso: 3, tipo: '3 Dorms (Esquinero)', vista: 'Panorámica a La Quadra / Umiña / Mar', precio: 284732, area: 152.68, estado: 'DISPONIBLE' },
  { id: '303', piso: 3, tipo: '1 Dormitorio', vista: 'La Quadra / Umiña / Mar', precio: 161128, area: 86.76, estado: 'DISPONIBLE' },
  { id: '302', piso: 3, tipo: '2 Dormitorios', vista: 'La Quadra / Umiña / Mar', precio: 221487, area: 121.61, estado: 'DISPONIBLE' },
  // PISO 2
  { id: '201', piso: 2, tipo: '1 Dormitorio', vista: 'Urbanización (Posterior)', precio: 130981, area: 70.25, estado: 'DISPONIBLE' },
  { id: '205', piso: 2, tipo: '1 Dormitorio', vista: 'Wyndham Poseidón / Mar', precio: 151259, area: 78.87, estado: 'DISPONIBLE' },
  { id: '204', piso: 2, tipo: '3 Dorms (Esquinero)', vista: 'Panorámica a La Quadra / Umiña / Mar', precio: 281458, area: 152.72, estado: 'DISPONIBLE' },
  { id: '203', piso: 2, tipo: '1 Dormitorio', vista: 'La Quadra / Umiña / Mar', precio: 159095, area: 86.66, estado: 'RESERVADO' },
  { id: '202', piso: 2, tipo: '2 Dormitorios', vista: 'La Quadra / Umiña / Mar', precio: 218918, area: 121.61, estado: 'DISPONIBLE' },
];

const PISOS_EDIFICIO = [6, 5, 4, 3, 2];

// Mapeo exacto de posiciones para la grilla de 5 columnas
const LAYOUT_FACHADA: Record<number, (string | null)[]> = {
  6: [null, '604', '603', '602', '601'],
  5: [null, '504', '503', '502', '501'],
  4: [null, '404', '403', '402', '401'],
  3: ['301', '305', '304', '303', '302'],
  2: ['201', '205', '204', '203', '202'],
};

export default function ReservaExpressPage() {
  const [paso, setPaso] = useState<'filtro' | 'mapa' | 'formulario' | 'exito'>('filtro');
  const [filtroTipo, setFiltroTipo] = useState<string | null>(null);
  const [unidadSeleccionada, setUnidadSeleccionada] = useState<any>(null);

  const [formData, setFormData] = useState({ nombres: '', cedula: '', email: '', telefono: '' });
  const [cargando, setCargando] = useState(false);

  const procesarReserva = (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setTimeout(() => {
      setCargando(false);
      setPaso('exito');
    }, 2000);
  };

  const seleccionarFiltro = (tipo: string) => {
    setFiltroTipo(tipo);
    setPaso('mapa');
  };

  const obtenerDatosUnidad = (id: string | null) => {
    if (!id) return null;
    return INVENTARIO.find(u => u.id === id) || null;
  };

  return (
    <div className="min-h-screen bg-[#F9F7F5] font-sans pb-20">
      
      {/* HEADER PÚBLICO */}
      <header className="bg-white border-b border-[#EAE3DC] px-6 py-4 sticky top-0 z-50 flex justify-center shadow-sm">
        <div className="text-center cursor-pointer" onClick={() => setPaso('filtro')}>
          <h1 className="text-lg font-light tracking-[0.2em] text-neutral-900 uppercase">Arienzo</h1>
          <p className="text-[9px] font-bold tracking-widest text-[#B94A36] uppercase mt-0.5">Boutique Living</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-3 md:px-4 mt-6">
        
        {/* PASO 1: EL FILTRO INICIAL */}
        {paso === 'filtro' && (
          <div className="max-w-lg mx-auto text-center space-y-8 animate-in zoom-in-95 duration-500 mt-10 md:mt-20">
            <div>
              <h2 className="text-3xl font-light text-neutral-900 mb-2">Bienvenido a tu próximo hogar.</h2>
              <p className="text-sm text-neutral-500">Para comenzar a explorar el edificio, indícanos qué espacio se adapta mejor a tu estilo de vida.</p>
            </div>
            
            <div className="flex flex-col gap-4 px-2">
              <button onClick={() => seleccionarFiltro('1 Dormitorio')} className="w-full bg-white border border-[#EAE3DC] p-6 rounded-2xl shadow-sm hover:border-[#B94A36] hover:shadow-md transition-all group relative overflow-hidden text-left">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#B94A36] transform -translate-x-full group-hover:translate-x-0 transition-transform"></div>
                <h3 className="text-xl font-bold text-neutral-800 uppercase tracking-wide">Suite / 1 Dormitorio</h3>
                <p className="text-xs text-neutral-400 mt-1">Ideal para ejecutivos o inversión dinámica.</p>
              </button>

              <button onClick={() => seleccionarFiltro('2 Dormitorios')} className="w-full bg-white border border-[#EAE3DC] p-6 rounded-2xl shadow-sm hover:border-[#B94A36] hover:shadow-md transition-all group relative overflow-hidden text-left">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#B94A36] transform -translate-x-full group-hover:translate-x-0 transition-transform"></div>
                <h3 className="text-xl font-bold text-neutral-800 uppercase tracking-wide">2 Dormitorios</h3>
                <p className="text-xs text-neutral-400 mt-1">Equilibrio perfecto de espacio y confort.</p>
              </button>

              <button onClick={() => seleccionarFiltro('3 Dormitorios')} className="w-full bg-white border border-[#EAE3DC] p-6 rounded-2xl shadow-sm hover:border-[#B94A36] hover:shadow-md transition-all group relative overflow-hidden text-left">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#B94A36] transform -translate-x-full group-hover:translate-x-0 transition-transform"></div>
                <h3 className="text-xl font-bold text-neutral-800 uppercase tracking-wide">3 Dormitorios</h3>
                <p className="text-xs text-neutral-400 mt-1">Amplitud máxima para familias y comodidad total.</p>
              </button>
            </div>
          </div>
        )}

        {/* PASO 2: EL MAPA INTERACTIVO */}
        {paso === 'mapa' && (
          <div className="space-y-4 md:space-y-6 animate-in slide-in-from-bottom-8 duration-500 w-full max-w-4xl mx-auto">
            
            <div className="flex flex-col md:flex-row md:justify-between md:items-end px-1 gap-4">
              <div>
                <button onClick={() => setPaso('filtro')} className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2 hover:text-[#B94A36] flex items-center gap-1">
                  ← Volver a opciones
                </button>
                <h2 className="text-xl md:text-2xl font-light text-neutral-800 uppercase tracking-wide">Unidades de {filtroTipo?.replace('s (Esquinero)', 's')}</h2>
                <p className="text-[10px] md:text-xs text-neutral-500 mt-1">Navega por la fachada. Toca una unidad para ver su precio.</p>
              </div>

              {/* LEYENDA (NOMENCLATURA VISUAL) */}
              <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl border border-neutral-200 shadow-sm w-full md:w-auto justify-center">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 md:w-4 md:h-4 bg-white border-2 border-[#B94A36] rounded inline-block shadow-sm"></span>
                  <span className="text-[9px] md:text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Disponible</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 md:w-4 md:h-4 bg-neutral-100 border border-neutral-200 rounded inline-block"></span>
                  <span className="text-[9px] md:text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Vendido</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-3 md:p-8 rounded-2xl md:rounded-3xl border border-[#EAE3DC] shadow-sm relative w-full">
              
              {/* EDIFICIO */}
              <div className="flex flex-col w-full">
                
                {/* FILA DE ORIENTACIÓN (CABECERAS DE COLUMNA) */}
                <div className="flex items-stretch gap-1 md:gap-2 mb-2 md:mb-3 w-full">
                  <div className="w-6 md:w-10 flex items-center justify-end pr-1 md:pr-2">
                    <span className="text-[5px] md:text-[8px] font-bold text-neutral-400 uppercase text-right leading-tight tracking-widest">
                      Orientación
                    </span>
                  </div>
                  <div className="flex-1 grid grid-cols-[1fr_1fr_1.5fr_1fr_1.5fr] gap-1 md:gap-2">
                    <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-1 md:p-2 flex items-center justify-center shadow-sm text-center">
                      <span className="text-[5px] md:text-[7px] uppercase tracking-widest text-neutral-500 leading-tight">Vista a la<br/>Urbanización</span>
                    </div>
                    <div className="bg-sky-50/50 border border-sky-100 rounded-lg p-1 md:p-2 flex items-center justify-center shadow-sm text-center">
                      <span className="text-[5px] md:text-[7px] uppercase tracking-widest text-sky-700 leading-tight">Vista al<br/>Wyndham / Mar</span>
                    </div>
                    <div className="bg-amber-50/30 border border-amber-100 rounded-lg p-1 md:p-2 flex items-center justify-center shadow-sm text-center">
                      <span className="text-[5px] md:text-[7px] font-bold uppercase tracking-widest text-amber-700 leading-tight">Esquinero<br/>(Vista Amplia)</span>
                    </div>
                    <div className="col-span-2 bg-teal-50/30 border border-teal-100 rounded-lg p-1 md:p-2 flex items-center justify-center shadow-sm text-center">
                      <span className="text-[5px] md:text-[7px] font-bold uppercase tracking-widest text-teal-700 leading-tight">Vista Panorámica Frontal<br/>La Quadra / Umiña / Mar</span>
                    </div>
                  </div>
                </div>

                {/* ROOFTOP */}
                <div className="flex items-stretch gap-1 md:gap-2 mb-1 md:mb-2 w-full">
                  <div className="w-6 md:w-10 text-[7px] md:text-[9px] font-bold text-neutral-400 uppercase flex items-center justify-end pr-1 md:pr-2">
                    Cima
                  </div>
                  <div className="flex-1 bg-[#D1C292]/30 border border-[#D1C292]/50 p-2 md:p-3 rounded-t-xl text-center flex items-center justify-center">
                    <span className="text-[8px] md:text-[10px] font-bold text-[#8A7A55] uppercase tracking-widest">
                      Rooftop & Amenidades Exclusivas
                    </span>
                  </div>
                </div>

                {/* FILAS DE PISOS RESIDENCIALES */}
                {PISOS_EDIFICIO.map(piso => (
                  <div key={piso} className="flex items-stretch gap-1 md:gap-2 mb-1 md:mb-2 w-full">
                    {/* Número de Piso */}
                    <div className="w-6 md:w-10 flex items-center justify-end pr-1 md:pr-2 text-[8px] md:text-[10px] font-medium text-neutral-400 uppercase">
                      P{piso}
                    </div>
                    
                    {/* Departamentos */}
                    <div className="flex-1 grid gap-1 md:gap-2 grid-cols-[1fr_1fr_1.5fr_1fr_1.5fr]">
                      {LAYOUT_FACHADA[piso].map((idUnidad, colIndex) => {
                        
                        if (!idUnidad) {
                          return <div key={`empty-${piso}-${colIndex}`} className="invisible"></div>;
                        }

                        const unidad = obtenerDatosUnidad(idUnidad);
                        if (!unidad) return null;

                        const tipoBase = unidad.tipo.includes('3 Dorms') ? '3 Dormitorios' : unidad.tipo;
                        const noCoincide = tipoBase !== filtroTipo;
                        const reservado = unidad.estado === 'RESERVADO';
                        
                        let botonEstilo = "";
                        let textoIdEstilo = "";
                        let textoTipoEstilo = "";

                        if (reservado) {
                          botonEstilo = "bg-neutral-100 border border-neutral-200 cursor-not-allowed";
                          textoIdEstilo = "text-neutral-400 line-through";
                          textoTipoEstilo = "text-neutral-400";
                        } else if (noCoincide) {
                          botonEstilo = "bg-neutral-50 border border-neutral-100 cursor-pointer hover:bg-neutral-100";
                          textoIdEstilo = "text-neutral-600";
                          textoTipoEstilo = "text-neutral-400";
                        } else {
                          botonEstilo = "bg-white border-[2px] border-[#B94A36] shadow-md cursor-pointer transform hover:-translate-y-1 hover:shadow-lg hover:bg-orange-50/20";
                          textoIdEstilo = "text-[#B94A36] font-bold";
                          textoTipoEstilo = "text-neutral-800 font-medium";
                        }

                        return (
                          <button
                            key={unidad.id}
                            disabled={reservado}
                            onClick={() => { if(!reservado) setUnidadSeleccionada(unidad) }}
                            className={`flex flex-col items-center justify-center p-1 md:p-2 rounded-lg transition-all duration-300 min-h-[45px] md:min-h-[70px] ${botonEstilo}`}
                          >
                            <span className={`text-[12px] md:text-lg font-light leading-none ${textoIdEstilo}`}>
                              {unidad.id}
                            </span>
                            
                            {reservado ? (
                              <span className="mt-1 text-[5px] md:text-[7px] font-bold text-neutral-400 uppercase tracking-widest">Vendido</span>
                            ) : (
                              <span className={`mt-0.5 md:mt-1 text-[5px] md:text-[8px] text-center leading-tight ${textoTipoEstilo}`}>
                                {unidad.tipo}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* PLANTA BAJA CON MAYOR PESO VISUAL */}
                <div className="flex items-stretch gap-1 md:gap-2 mt-1 w-full">
                  <div className="w-6 md:w-10 text-[8px] md:text-[10px] font-bold text-neutral-400 uppercase flex items-center justify-end pr-1 md:pr-2">
                    PB
                  </div>
                  <div className="flex-1 bg-neutral-800 text-neutral-300 p-3 md:p-5 rounded-b-2xl text-center flex flex-col justify-center shadow-md">
                    <span className="text-[8px] md:text-[11px] font-bold text-white uppercase tracking-widest">
                      Planta Baja
                    </span>
                    <span className="text-[6px] md:text-[8px] mt-1 md:mt-1.5 uppercase tracking-widest opacity-80">
                      Ingreso Vehicular • Locales Comerciales • Lobby Design
                    </span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* 3. MODAL FLOTANTE (LA FICHA EXPRESS) */}
        {unidadSeleccionada && paso === 'mapa' && (
          <div className="fixed inset-0 bg-neutral-900/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 transform transition-transform animate-in slide-in-from-bottom-8">
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[10px] font-bold tracking-widest text-[#B94A36] uppercase bg-[#B94A36]/10 px-2 py-1 rounded">Unidad Seleccionada</span>
                  <h3 className="text-3xl font-light text-neutral-900 mt-2">Dpto. {unidadSeleccionada.id}</h3>
                </div>
                <button onClick={() => setUnidadSeleccionada(null)} className="bg-neutral-100 text-neutral-500 w-8 h-8 rounded-full flex items-center justify-center font-bold hover:bg-neutral-200">&times;</button>
              </div>

              <div className="space-y-3 bg-[#F9F7F5] p-4 rounded-xl border border-[#EAE3DC] text-sm">
                <div className="flex justify-between border-b border-neutral-200/60 pb-2">
                  <span className="text-neutral-500">Distribución</span>
                  <span className="font-bold text-neutral-800">{unidadSeleccionada.tipo}</span>
                </div>
                <div className="flex justify-between border-b border-neutral-200/60 pb-2">
                  <span className="text-neutral-500">Área Total</span>
                  <span className="font-bold text-neutral-800">{unidadSeleccionada.area} m²</span>
                </div>
                <div className="flex justify-between border-b border-neutral-200/60 pb-2">
                  <span className="text-neutral-500">Orientación</span>
                  <span className="font-bold text-neutral-800 text-right w-1/2 leading-tight">{unidadSeleccionada.vista}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-neutral-500 font-medium mt-1">Inversión Total</span>
                  <span className="text-2xl font-bold text-[#B94A36] font-mono">${unidadSeleccionada.precio.toLocaleString('en-US')}</span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button onClick={() => setPaso('formulario')} className="w-full bg-neutral-900 text-white font-bold uppercase tracking-widest text-xs py-4 rounded-xl hover:bg-black transition-colors shadow-lg shadow-neutral-900/20">
                  Bloquear Unidad por $2,500
                </button>
                <p className="text-center text-[10px] text-neutral-400">El pago se realiza mediante transferencia posterior a la validación de tus datos.</p>
              </div>
            </div>
          </div>
        )}

        {/* 4. FORMULARIO KYC EXPRESS */}
        {paso === 'formulario' && (
          <div className="max-w-md mx-auto bg-white p-6 md:p-8 rounded-2xl border border-[#EAE3DC] shadow-sm animate-in slide-in-from-right-8 mt-10">
            <button onClick={() => setPaso('mapa')} className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-6 hover:text-[#B94A36] flex items-center gap-1">
              ← Volver al plano
            </button>
            
            <h3 className="text-xl font-light text-neutral-900 mb-1">Registro de Inversionista</h3>
            <p className="text-xs text-neutral-500 mb-6 border-b border-neutral-100 pb-4">Ingresa tus datos legales para asignar el bloqueo de la <strong>Unidad {unidadSeleccionada.id}</strong> a tu nombre.</p>

            <form onSubmit={procesarReserva} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Nombres Completos</label>
                <input required type="text" value={formData.nombres} onChange={e => setFormData({...formData, nombres: e.target.value})} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-sm focus:outline-none focus:border-[#B94A36]" placeholder="Tal como aparece en tu documento" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Cédula / Pasaporte</label>
                <input required type="text" value={formData.cedula} onChange={e => setFormData({...formData, cedula: e.target.value})} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-sm focus:outline-none focus:border-[#B94A36]" placeholder="Número de identidad" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">WhatsApp</label>
                  <input required type="tel" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-sm focus:outline-none focus:border-[#B94A36]" placeholder="099..." />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Correo Electrónico</label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-sm focus:outline-none focus:border-[#B94A36]" placeholder="tucorreo@email.com" />
                </div>
              </div>

              <div className="pt-6 mt-2 border-t border-neutral-100">
                <button type="submit" disabled={cargando} className="w-full bg-[#B94A36] text-white font-bold uppercase tracking-widest text-xs py-4 rounded-xl hover:bg-[#9B3B2B] transition-colors shadow-lg shadow-[#B94A36]/20 disabled:opacity-70 flex justify-center items-center">
                  {cargando ? <span className="animate-pulse">Asegurando Unidad...</span> : 'Confirmar Reserva Oficial'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 5. PANTALLA DE ÉXITO Y URGENCIA */}
        {paso === 'exito' && (
          <div className="max-w-md mx-auto bg-white p-8 rounded-2xl border-2 border-emerald-500 shadow-xl text-center animate-in zoom-in-95 duration-500 mb-10 mt-10">
            <h2 className="text-2xl font-light text-neutral-900 mb-2">¡Unidad Asegurada!</h2>
            <p className="text-sm text-neutral-600 mb-6">Hola {formData.nombres}, la <strong>Unidad {unidadSeleccionada.id}</strong> ha sido bloqueada exitosamente a tu nombre en nuestro sistema.</p>
            
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse"></div>
              <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-1">Tiempo Restante para Formalizar</p>
              <p className="text-3xl font-mono font-bold text-red-700">23:59:59</p>
              <p className="text-xs text-red-800/70 mt-2">Tienes 24 horas para realizar la transferencia de $2,500 y evitar que la unidad vuelva al mercado.</p>
            </div>

            <div className="text-left bg-neutral-50 p-4 rounded-lg border border-neutral-200 text-xs text-neutral-700 space-y-2 font-mono">
              <p className="font-bold text-neutral-900 font-sans uppercase text-[10px] border-b pb-2 mb-2">Datos Bancarios (Konkeri S.A.S.)</p>
              <p><strong>Banco:</strong> Banco Pichincha</p>
              <p><strong>Cuenta Corriente:</strong> 2100084592</p>
              <p><strong>RUC:</strong> 1391928475001</p>
              <p><strong>Monto:</strong> $2,500.00 USD</p>
            </div>

            <button onClick={() => window.location.reload()} className="mt-8 text-xs font-bold text-neutral-400 hover:text-neutral-800 uppercase underline">
              Finalizar y salir
            </button>
          </div>
        )}

      </main>
    </div>
  );
}