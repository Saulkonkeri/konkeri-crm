'use client';

import { useState } from 'react';

// INVENTARIO REAL - AGOSTO 2026 (Basado en el PDF Oficial)
const INVENTARIO = [
  // PISO 6
  { id: '604', piso: 6, tipo: '2 Dormitorios', vista: 'Wyndham Poseidón / Mar', precio: 205865, area: 106.65, estado: 'RESERVADO' },
  { id: '603', piso: 6, tipo: '3 Dormitorios', vista: 'La Quadra / Umiña / Mar', precio: 293967, area: 152.72, estado: 'DISPONIBLE' },
  { id: '602', piso: 6, tipo: '1 Dormitorio', vista: 'La Quadra / Umiña / Mar', precio: 169369, area: 86.60, estado: 'DISPONIBLE' },
  { id: '601', piso: 6, tipo: '3 Dormitorios', vista: 'La Quadra / Umiña / Mar', precio: 308760, area: 158.54, estado: 'RESERVADO' },
  // PISO 5
  { id: '504', piso: 5, tipo: '2 Dormitorios', vista: 'Wyndham Poseidón / Mar', precio: 201794, area: 106.65, estado: 'RESERVADO' },
  { id: '503', piso: 5, tipo: '3 Dormitorios', vista: 'La Quadra / Umiña / Mar', precio: 290840, area: 152.72, estado: 'DISPONIBLE' },
  { id: '502', piso: 5, tipo: '1 Dormitorio', vista: 'La Quadra / Umiña / Mar', precio: 165702, area: 86.60, estado: 'DISPONIBLE' },
  { id: '501', piso: 5, tipo: '3 Dormitorios', vista: 'La Quadra / Umiña / Mar', precio: 303228, area: 158.54, estado: 'DISPONIBLE' },
  // PISO 4
  { id: '404', piso: 4, tipo: '2 Dormitorios', vista: 'Wyndham Poseidón / Mar', precio: 199677, area: 106.65, estado: 'DISPONIBLE' },
  { id: '403', piso: 4, tipo: '3 Dormitorios', vista: 'La Quadra / Umiña / Mar', precio: 287042, area: 152.72, estado: 'DISPONIBLE' },
  { id: '402', piso: 4, tipo: '1 Dormitorio', vista: 'La Quadra / Umiña / Mar', precio: 163257, area: 86.60, estado: 'DISPONIBLE' },
  { id: '401', piso: 4, tipo: '3 Dormitorios', vista: 'La Quadra / Umiña / Mar', precio: 299079, area: 158.54, estado: 'RESERVADO' },
  // PISO 3
  { id: '305', piso: 3, tipo: '1 Dormitorio', vista: 'Wyndham Poseidón / Mar', precio: 152779, area: 78.87, estado: 'DISPONIBLE' },
  { id: '304', piso: 3, tipo: '3 Dormitorios', vista: 'La Quadra / Umiña / Mar', precio: 284732, area: 152.68, estado: 'DISPONIBLE' },
  { id: '303', piso: 3, tipo: '1 Dormitorio', vista: 'La Quadra / Umiña / Mar', precio: 161128, area: 86.76, estado: 'DISPONIBLE' },
  { id: '302', piso: 3, tipo: '2 Dormitorios', vista: 'La Quadra / Umiña / Mar', precio: 221487, area: 121.61, estado: 'DISPONIBLE' },
  // PISO 2
  { id: '205', piso: 2, tipo: '1 Dormitorio', vista: 'Wyndham Poseidón / Mar', precio: 151259, area: 78.87, estado: 'DISPONIBLE' },
  { id: '204', piso: 2, tipo: '3 Dormitorios', vista: 'La Quadra / Umiña / Mar', precio: 281458, area: 152.72, estado: 'DISPONIBLE' },
  { id: '203', piso: 2, tipo: '1 Dormitorio', vista: 'La Quadra / Umiña / Mar', precio: 159095, area: 86.66, estado: 'RESERVADO' },
  { id: '202', piso: 2, tipo: '2 Dormitorios', vista: 'La Quadra / Umiña / Mar', precio: 218918, area: 121.61, estado: 'DISPONIBLE' },
];

export default function ReservaExpressPage() {
  const [filtroTipo, setFiltroTipo] = useState<string | null>(null);
  const [unidadSeleccionada, setUnidadSeleccionada] = useState<any>(null);
  const [paso, setPaso] = useState<'mapa' | 'formulario' | 'exito'>('mapa');

  // Datos del Cliente (KYC Express)
  const [formData, setFormData] = useState({ nombres: '', cedula: '', email: '', telefono: '' });
  const [cargando, setCargando] = useState(false);

  const procesarReserva = (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    // Aquí iría la conexión a Supabase para guardar el lead. Por ahora simulamos 2 segundos.
    setTimeout(() => {
      setCargando(false);
      setPaso('exito');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#F9F7F5] font-sans pb-20">
      
      {/* HEADER PÚBLICO */}
      <header className="bg-white border-b border-[#EAE3DC] px-6 py-4 sticky top-0 z-50 flex justify-center shadow-sm">
        <div className="text-center">
          <h1 className="text-lg font-light tracking-[0.2em] text-neutral-900 uppercase">Arienzo</h1>
          <p className="text-[9px] font-bold tracking-widest text-[#B94A36] uppercase mt-0.5">Boutique Living</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-6">
        
        {paso === 'mapa' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            
            {/* 1. SECCIÓN DE FILTRO GUIADO */}
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-light text-neutral-800">¿Qué espacio buscas?</h2>
              <p className="text-xs text-neutral-500">Selecciona el tamaño ideal para iluminar tus opciones en el edificio.</p>
              
              <div className="flex flex-wrap justify-center gap-3 mt-4">
                <button 
                  onClick={() => setFiltroTipo(filtroTipo === '1 Dormitorio' ? null : '1 Dormitorio')}
                  className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all border ${filtroTipo === '1 Dormitorio' ? 'bg-[#B94A36] text-white border-[#B94A36] shadow-md' : 'bg-white text-neutral-600 border-neutral-200 hover:border-[#B94A36]'}`}
                >
                  🏢 1 Dormitorio
                </button>
                <button 
                  onClick={() => setFiltroTipo(filtroTipo === '2 Dormitorios' ? null : '2 Dormitorios')}
                  className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all border ${filtroTipo === '2 Dormitorios' ? 'bg-[#B94A36] text-white border-[#B94A36] shadow-md' : 'bg-white text-neutral-600 border-neutral-200 hover:border-[#B94A36]'}`}
                >
                  🛏️ 2 Dormitorios
                </button>
                <button 
                  onClick={() => setFiltroTipo(filtroTipo === '3 Dormitorios' ? null : '3 Dormitorios')}
                  className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all border ${filtroTipo === '3 Dormitorios' ? 'bg-[#B94A36] text-white border-[#B94A36] shadow-md' : 'bg-white text-neutral-600 border-neutral-200 hover:border-[#B94A36]'}`}
                >
                  👑 3 Dormitorios
                </button>
              </div>
            </div>

            {/* 2. MATRIZ INTERACTIVA (LA FACHADA) */}
            <div className="bg-white p-6 rounded-2xl border border-[#EAE3DC] shadow-sm relative overflow-hidden">
              
              {/* Indicadores de Vistas */}
              <div className="flex justify-between text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-6 border-b border-neutral-100 pb-3">
                <span>⬅️ Hacia Wyndham Poseidón</span>
                <span>Hacia La Quadra / Umiña ➡️</span>
              </div>

              {/* Grid del Edificio (4 columnas simulando el plano) */}
              <div className="grid grid-cols-4 gap-2 md:gap-4 relative z-10">
                {INVENTARIO.map((unidad) => {
                  const noCoincide = filtroTipo && unidad.tipo !== filtroTipo;
                  const reservado = unidad.estado === 'RESERVADO';
                  
                  return (
                    <button
                      key={unidad.id}
                      disabled={reservado}
                      onClick={() => setUnidadSeleccionada(unidad)}
                      className={`
                        relative flex flex-col items-center justify-center p-3 md:p-4 rounded-xl border-2 transition-all duration-300
                        ${reservado ? 'bg-neutral-100 border-neutral-200 opacity-60 cursor-not-allowed' : 
                          noCoincide ? 'bg-white border-neutral-100 opacity-40 hover:opacity-100' : 
                          'bg-[#B94A36]/5 border-[#B94A36]/30 hover:border-[#B94A36] hover:bg-[#B94A36]/10 shadow-sm cursor-pointer transform hover:-translate-y-1'}
                      `}
                    >
                      <span className={`text-lg md:text-xl font-light ${reservado ? 'text-neutral-400 line-through' : noCoincide ? 'text-neutral-500' : 'text-[#B94A36] font-bold'}`}>
                        {unidad.id}
                      </span>
                      {reservado ? (
                        <span className="mt-1 text-[8px] font-bold text-neutral-400 uppercase bg-neutral-200 px-2 py-0.5 rounded">Vendido</span>
                      ) : (
                        <span className={`mt-1 text-[8px] md:text-[9px] font-medium text-center ${noCoincide ? 'text-neutral-400' : 'text-[#B94A36]'}`}>
                          {unidad.tipo}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Base del Edificio (Lobby) */}
              <div className="mt-4 bg-neutral-800 text-neutral-400 text-[10px] font-bold uppercase tracking-widest text-center py-3 rounded-b-xl">
                Ingreso Parqueos - Locales - Lobby
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
                  <span className="text-neutral-500">Vista / Orientación</span>
                  <span className="font-bold text-neutral-800 text-right">{unidadSeleccionada.vista}</span>
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
          <div className="max-w-md mx-auto bg-white p-6 md:p-8 rounded-2xl border border-[#EAE3DC] shadow-sm animate-in slide-in-from-right-8">
            <button onClick={() => setPaso('mapa')} className="text-xs font-bold text-neutral-400 uppercase hover:text-neutral-800 flex items-center gap-1 mb-6">
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

        {/* 5. PANTALLA DE ÉXITO Y URGENCIA (CRONÓMETRO) */}
        {paso === 'exito' && (
          <div className="max-w-md mx-auto bg-white p-8 rounded-2xl border-2 border-emerald-500 shadow-xl text-center animate-in zoom-in-95 duration-500">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✅</span>
            </div>
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