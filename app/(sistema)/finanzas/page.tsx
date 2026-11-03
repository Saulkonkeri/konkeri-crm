'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function FinanzasDashboardPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'movimientos' | 'socios' | 'cuentas'>('movimientos');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // ================= ESTADOS: MOVIMIENTOS GENERALES =================
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const hoyStr = new Date().toISOString().split('T')[0];
  
  const [movForm, setMovForm] = useState({
    fecha_transaccion: hoyStr,
    entidad: 'Arienzo',
    tipo: 'Egreso',
    categoria: 'Marketing y Publicidad',
    descripcion: '',
    monto: '',
    metodo_pago: 'Transferencia',
    estado_facturacion: 'No Facturado'
  });

  // ================= ESTADOS: CUENTA SOCIOS =================
  const [retirosSocios, setRetirosSocios] = useState<any[]>([]);
  
  const [socioForm, setSocioForm] = useState({
    fecha_retiro: hoyStr,
    socio: 'Saúl',
    origen_fondos: 'Konkeri',
    concepto: 'Anticipo Honorarios Comerciales',
    monto: ''
  });

  // ================= CARGA DE DATOS =================
  useEffect(() => {
    cargarDatosFinancieros();
  }, []);

  const cargarDatosFinancieros = async () => {
    setCargando(true);
    try {
      // Cargar Movimientos
      const { data: dataMovs, error: errMovs } = await supabase
        .from('finanzas_movimientos')
        .select('*')
        .order('fecha_transaccion', { ascending: false })
        .limit(50);
      
      if (!errMovs && dataMovs) setMovimientos(dataMovs);

      // Cargar Retiros Socios
      const { data: dataSocios, error: errSocios } = await supabase
        .from('finanzas_cuenta_socios')
        .select('*')
        .order('fecha_retiro', { ascending: false })
        .limit(50);
      
      if (!errSocios && dataSocios) setRetirosSocios(dataSocios);
      
    } catch (error) {
      console.error("Error al cargar finanzas:", error);
    } finally {
      setCargando(false);
    }
  };

  // ================= GUARDADO DE DATOS =================
  const registrarMovimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movForm.monto || Number(movForm.monto) <= 0) return alert("Ingrese un monto válido.");
    
    setGuardando(true);
    try {
      const { error } = await supabase.from('finanzas_movimientos').insert([{
        ...movForm,
        monto: Number(movForm.monto)
      }]);
      
      if (error) throw error;
      
      alert("✅ Movimiento registrado con éxito.");
      setMovForm({ ...movForm, descripcion: '', monto: '' }); // Limpiar campos clave
      cargarDatosFinancieros();
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`);
    } finally {
      setGuardando(false);
    }
  };

  const registrarRetiroSocio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!socioForm.monto || Number(socioForm.monto) <= 0) return alert("Ingrese un monto válido.");
    
    setGuardando(true);
    try {
      // 1. Guardar en la tabla de socios
      const { data: socioData, error: socioErr } = await supabase.from('finanzas_cuenta_socios').insert([{
        ...socioForm,
        monto: Number(socioForm.monto),
        estado_regularizacion: 'Pendiente'
      }]).select();
      
      if (socioErr) throw socioErr;

      // 2. Reflejar automáticamente como un EGRESO en la tabla de movimientos generales para cuadrar caja
      await supabase.from('finanzas_movimientos').insert([{
        fecha_transaccion: socioForm.fecha_retiro,
        entidad: socioForm.origen_fondos,
        tipo: 'Egreso',
        categoria: 'Anticipo Socios',
        descripcion: `Retiro: ${socioForm.socio} - ${socioForm.concepto}`,
        monto: Number(socioForm.monto),
        metodo_pago: 'Transferencia',
        estado_facturacion: 'No Facturado'
      }]);

      alert("✅ Retiro registrado y descontado de la caja exitosamente.");
      setSocioForm({ ...socioForm, concepto: '', monto: '' });
      cargarDatosFinancieros();
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`);
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9F7F5]">
        <p className="text-sm font-bold tracking-widest text-[#B94A36] uppercase animate-pulse">Cargando Libros Financieros...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F7F5] p-4 md:p-8 font-sans text-[#415364]">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* CABECERA FINANCIERA */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center border-b border-neutral-200 pb-6 gap-4">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-[#B94A36] uppercase block">Control Operativo</span>
            <h1 className="text-3xl font-bold tracking-tight text-[#21242E] mt-1">Libro de Entradas y Salidas</h1>
            <p className="text-xs text-neutral-500 mt-1">Ingreso manual de movimientos para conciliación.</p>
          </div>

          <div className="flex bg-white p-1.5 rounded-xl border border-neutral-200 shadow-sm gap-1 overflow-x-auto w-full lg:w-auto">
            <button onClick={() => setActiveTab('movimientos')} className={`px-4 py-2.5 text-[11px] font-bold tracking-wider uppercase rounded-lg transition-all whitespace-nowrap ${activeTab === 'movimientos' ? 'bg-[#21242E] text-[#D1C292] shadow-md' : 'text-[#415364]/70 hover:bg-neutral-50'}`}>
              1. Libro Diario (General)
            </button>
            <button onClick={() => setActiveTab('socios')} className={`px-4 py-2.5 text-[11px] font-bold tracking-wider uppercase rounded-lg transition-all whitespace-nowrap ${activeTab === 'socios' ? 'bg-[#B94A36] text-white shadow-md' : 'text-[#B94A36]/70 hover:bg-red-50'}`}>
              2. Retiros y Anticipos (Socios)
            </button>
            <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2.5 text-[11px] font-bold tracking-wider uppercase rounded-lg transition-all whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-neutral-100 text-neutral-400' : 'text-neutral-400 hover:bg-neutral-50'}`}>
              Dashboard (Próximamente)
            </button>
          </div>
        </div>

        {/* =======================================================
            PANTALLA 1: MOVIMIENTOS GENERALES
           ======================================================= */}
        {activeTab === 'movimientos' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
            
            {/* FORMULARIO DE INGRESO */}
            <div className="lg:col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 h-fit sticky top-6">
              <h2 className="text-[11px] font-bold text-[#21242E] uppercase tracking-widest border-b border-neutral-100 pb-3 mb-5 flex items-center gap-2">
                <svg className="w-4 h-4 text-[#D1C292]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                Nuevo Registro
              </h2>
              
              <form onSubmit={registrarMovimiento} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Tipo</label>
                    <select value={movForm.tipo} onChange={e => setMovForm({...movForm, tipo: e.target.value})} className={`w-full text-xs font-bold p-2.5 rounded-lg border outline-none ${movForm.tipo === 'Ingreso' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                      <option value="Ingreso">INGRESO (+)</option>
                      <option value="Egreso">EGRESO (-)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Entidad (Caja)</label>
                    <select value={movForm.entidad} onChange={e => setMovForm({...movForm, entidad: e.target.value})} className="w-full text-xs font-bold p-2.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none text-[#21242E]">
                      <option value="Arienzo">Arienzo S.A.S.</option>
                      <option value="Konkeri">Konkeri S.A.S.</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Monto ($)</label>
                  <input type="number" step="0.01" required value={movForm.monto} onChange={e => setMovForm({...movForm, monto: e.target.value})} className="w-full text-lg font-mono font-bold p-2.5 rounded-lg border border-neutral-200 bg-white outline-none focus:border-[#B94A36] text-[#21242E]" placeholder="0.00" />
                </div>

                <div>
                  <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Categoría</label>
                  <select value={movForm.categoria} onChange={e => setMovForm({...movForm, categoria: e.target.value})} className="w-full text-xs font-medium p-2.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none text-[#415364]">
                    {movForm.tipo === 'Ingreso' ? (
                      <>
                        <option>Abono de Cliente (Reserva/Cuota)</option>
                        <option>Aporte de Capital (Inversionista)</option>
                        <option>Préstamo Bancario</option>
                        <option>Otros Ingresos</option>
                      </>
                    ) : (
                      <>
                        <option>Marketing y Publicidad (Meta/Google)</option>
                        <option>Honorarios Profesionales (Legal/Arqui)</option>
                        <option>Permisos y Trámites Municipales</option>
                        <option>Tecnología y Servidores</option>
                        <option>Anticipo Socios</option>
                        <option>Gastos Administrativos</option>
                        <option>Otros Egresos</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Descripción / Proveedor / Cliente</label>
                  <input type="text" required value={movForm.descripcion} onChange={e => setMovForm({...movForm, descripcion: e.target.value})} className="w-full text-xs font-medium p-2.5 rounded-lg border border-neutral-200 bg-white outline-none focus:border-[#B94A36]" placeholder="Ej. Pago diseño Diez+Müller Fase 1" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Fecha</label>
                    <input type="date" required value={movForm.fecha_transaccion} onChange={e => setMovForm({...movForm, fecha_transaccion: e.target.value})} className="w-full text-xs font-medium p-2.5 rounded-lg border border-neutral-200 bg-white outline-none" />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Facturación</label>
                    <select value={movForm.estado_facturacion} onChange={e => setMovForm({...movForm, estado_facturacion: e.target.value})} className="w-full text-xs font-medium p-2.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none">
                      <option value="No Facturado">No Facturado ⚠️</option>
                      <option value="Facturado">Facturado (SRI) ✅</option>
                      <option value="No Aplica">No Aplica</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3">
                  <button type="submit" disabled={guardando} className="w-full bg-[#21242E] text-white font-bold uppercase tracking-widest text-[10px] py-3.5 rounded-xl hover:bg-black transition-all shadow-md disabled:opacity-50">
                    {guardando ? 'Guardando...' : 'Registrar Movimiento'}
                  </button>
                </div>
              </form>
            </div>

            {/* TABLA DE MOVIMIENTOS (LIBRO DIARIO) */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 overflow-hidden flex flex-col">
              <h2 className="text-[11px] font-bold text-[#B94A36] uppercase tracking-widest border-b border-neutral-100 pb-3 mb-2">Últimos Registros</h2>
              
              {movimientos.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-3 border border-neutral-100">
                    <svg className="w-8 h-8 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  </div>
                  <p className="text-sm font-bold text-neutral-400">Libro Diario Vacío</p>
                  <p className="text-xs text-neutral-400 mt-1">Comienza a registrar movimientos en el panel lateral.</p>
                </div>
              ) : (
                <div className="overflow-auto custom-scrollbar flex-1 -mx-2 px-2">
                  <table className="w-full text-left text-[11px] whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-neutral-200 text-neutral-400 uppercase tracking-wider">
                        <th className="py-3 px-2 font-semibold">Fecha</th>
                        <th className="py-3 px-2 font-semibold">Caja</th>
                        <th className="py-3 px-2 font-semibold">Categoría / Detalle</th>
                        <th className="py-3 px-2 font-semibold text-center">Fact.</th>
                        <th className="py-3 px-2 font-semibold text-right">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {movimientos.map(mov => (
                        <tr key={mov.id} className="hover:bg-neutral-50">
                          <td className="py-3 px-2 font-mono text-neutral-500">{new Date(mov.fecha_transaccion).toLocaleDateString('es-ES')}</td>
                          <td className="py-3 px-2">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${mov.entidad === 'Arienzo' ? 'bg-[#D1C292]/20 text-[#8A7A55]' : 'bg-neutral-100 text-neutral-600'}`}>
                              {mov.entidad}
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            <p className="font-bold text-[#415364] truncate max-w-[180px]" title={mov.categoria}>{mov.categoria}</p>
                            <p className="text-[9px] text-neutral-500 truncate max-w-[180px]" title={mov.descripcion}>{mov.descripcion}</p>
                          </td>
                          <td className="py-3 px-2 text-center text-[14px]">
                            {mov.estado_facturacion === 'Facturado' ? '📄' : mov.estado_facturacion === 'No Aplica' ? '-' : '⚠️'}
                          </td>
                          <td className={`py-3 px-2 text-right font-mono font-bold ${mov.tipo === 'Ingreso' ? 'text-emerald-600' : 'text-[#ea0029]'}`}>
                            {mov.tipo === 'Ingreso' ? '+' : '-'}${Number(mov.monto).toLocaleString('en-US', {minimumFractionDigits: 2})}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =======================================================
            PANTALLA 2: CUENTA DE SOCIOS (RETIROS)
           ======================================================= */}
        {activeTab === 'socios' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
            
            {/* FORMULARIO DE RETIRO SOCIOS */}
            <div className="lg:col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-[#B94A36]/20 h-fit sticky top-6">
              <h2 className="text-[11px] font-bold text-[#B94A36] uppercase tracking-widest border-b border-neutral-100 pb-3 mb-5 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                Registrar Anticipo
              </h2>
              
              <div className="bg-[#B94A36]/5 p-3 rounded-lg border border-[#B94A36]/10 mb-4 text-[9px] text-[#B94A36] uppercase tracking-wide font-bold text-justify">
                Nota: Todo registro aquí se descontará automáticamente como egreso de la caja general para mantener el balance cuadrado.
              </div>

              <form onSubmit={registrarRetiroSocio} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Socio / Beneficiario</label>
                    <select value={socioForm.socio} onChange={e => setSocioForm({...socioForm, socio: e.target.value})} className="w-full text-xs font-bold p-2.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none text-[#21242E]">
                      <option>Saúl</option>
                      <option>Debbi</option>
                      <option>Ambos / Compartido</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Caja Origen</label>
                    <select value={socioForm.origen_fondos} onChange={e => setSocioForm({...socioForm, origen_fondos: e.target.value})} className="w-full text-xs font-bold p-2.5 rounded-lg border border-neutral-200 bg-neutral-50 outline-none text-[#21242E]">
                      <option value="Konkeri">Konkeri S.A.S.</option>
                      <option value="Arienzo">Arienzo S.A.S.</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Monto Retirado ($)</label>
                  <input type="number" step="0.01" required value={socioForm.monto} onChange={e => setSocioForm({...socioForm, monto: e.target.value})} className="w-full text-lg font-mono font-bold p-2.5 rounded-lg border border-neutral-200 bg-white outline-none focus:border-[#B94A36] text-[#B94A36]" placeholder="0.00" />
                </div>

                <div>
                  <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Justificación (Concepto)</label>
                  <input type="text" required value={socioForm.concepto} onChange={e => setSocioForm({...socioForm, concepto: e.target.value})} className="w-full text-xs font-medium p-2.5 rounded-lg border border-neutral-200 bg-white outline-none focus:border-[#B94A36]" placeholder="Ej. Retiro de utilidad mensual, Anticipo honorarios..." />
                </div>

                <div>
                  <label className="text-[9px] font-bold text-neutral-500 uppercase block mb-1">Fecha de Retiro</label>
                  <input type="date" required value={socioForm.fecha_retiro} onChange={e => setSocioForm({...socioForm, fecha_retiro: e.target.value})} className="w-full text-xs font-medium p-2.5 rounded-lg border border-neutral-200 bg-white outline-none" />
                </div>

                <div className="pt-3">
                  <button type="submit" disabled={guardando} className="w-full bg-[#B94A36] text-white font-bold uppercase tracking-widest text-[10px] py-3.5 rounded-xl hover:bg-[#9a3d2c] transition-all shadow-md disabled:opacity-50">
                    {guardando ? 'Guardando...' : 'Descontar de Caja'}
                  </button>
                </div>
              </form>
            </div>

            {/* TABLA DE RETIROS (HISTORIAL SOCIOS) */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 overflow-hidden flex flex-col">
              <h2 className="text-[11px] font-bold text-[#415364] uppercase tracking-widest border-b border-neutral-100 pb-3 mb-2">Estado de Cuenta Socios</h2>
              
              {retirosSocios.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-3 border border-neutral-100">
                    <svg className="w-8 h-8 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                  </div>
                  <p className="text-sm font-bold text-neutral-400">Sin retiros registrados</p>
                </div>
              ) : (
                <div className="overflow-auto custom-scrollbar flex-1 -mx-2 px-2">
                  <table className="w-full text-left text-[11px] whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-neutral-200 text-neutral-400 uppercase tracking-wider">
                        <th className="py-3 px-2 font-semibold">Fecha</th>
                        <th className="py-3 px-2 font-semibold">Socio</th>
                        <th className="py-3 px-2 font-semibold">Origen</th>
                        <th className="py-3 px-2 font-semibold">Concepto</th>
                        <th className="py-3 px-2 font-semibold text-center">Estado Legal</th>
                        <th className="py-3 px-2 font-semibold text-right">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {retirosSocios.map(retiro => (
                        <tr key={retiro.id} className="hover:bg-neutral-50">
                          <td className="py-3 px-2 font-mono text-neutral-500">{new Date(retiro.fecha_retiro).toLocaleDateString('es-ES')}</td>
                          <td className="py-3 px-2 font-bold text-[#21242E]">{retiro.socio}</td>
                          <td className="py-3 px-2 text-neutral-500">{retiro.origen_fondos}</td>
                          <td className="py-3 px-2">
                            <p className="font-medium text-[#415364] truncate max-w-[150px]" title={retiro.concepto}>{retiro.concepto}</p>
                          </td>
                          <td className="py-3 px-2 text-center">
                             <span className="bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider">
                               {retiro.estado_regularizacion}
                             </span>
                          </td>
                          <td className="py-3 px-2 text-right font-mono font-bold text-[#B94A36]">
                            ${Number(retiro.monto).toLocaleString('en-US', {minimumFractionDigits: 2})}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}