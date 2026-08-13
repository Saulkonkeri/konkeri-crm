// Actualizacion forzada para Vercel - CRM con Bitácora de Llamadas (Buscador + Sincronización)
'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

interface Cliente {
  id: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  email?: string;
  ciudad_residencia?: string;
  motivo_compra?: string;
  tipologia_interes?: string;
  estado: string;
  origen_captacion?: string;
  ingresado_por?: string;
  notas: string;
  temperatura?: string; 
  proximo_contacto?: string | null; 
  tipo_accion?: string;
  detalle_accion?: string | null;
  tipo?: string; 
}

interface Cotizacion {
  id: string;
  unidad_numero: string;
  precio_total: number;
  estado: string;
  created_at: string;
  motivo_descuento: string;
}

// INTERFAZ PARA LLAMADAS
interface Llamada {
  id?: string;
  cliente_id: string;
  agente: string;
  resultado: string;
  notas: string;
  created_at: string;
  clientes?: { nombres: string; apellidos: string };
}

export default function CRMPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  
  const [filtroCiudad, setFiltroCiudad] = useState('Todas');
  const [filtroTipologia, setFiltroTipologia] = useState('Todas');
  const [filtroOrigen, setFiltroOrigen] = useState('Todos');

  const [vista, setVista] = useState<'lista' | 'kanban' | 'llamadas'>('kanban');

  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false);
  const [mostrarModalPlantilla, setMostrarModalPlantilla] = useState(false);
  const [mostrarModalHistorial, setMostrarModalHistorial] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);

  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoApellido, setNuevoApellido] = useState('');
  const [nuevoTelefono, setNuevoTelefono] = useState('');
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [nuevaCiudad, setNuevaCiudad] = useState('');
  const [nuevoOrigen, setNuevoOrigen] = useState('Meta Ads');
  const [nuevoMotivo, setNuevoMotivo] = useState('Para Invertir');
  const [nuevoInteres, setNuevoInteres] = useState('Suite');
  const [nuevoIngresadoPor, setNuevoIngresadoPor] = useState('Saúl Intriago / Debbi Mera'); 
  const [guardandoCliente, setGuardandoCliente] = useState(false);

  const [nuevaNotaTexto, setNuevaNotaTexto] = useState('');
  const [guardandoNota, setGuardandoNota] = useState(false);
  
  const [fechaAccion, setFechaAccion] = useState('');
  const [tipoAccion, setTipoAccion] = useState('Llamada Telefónica');
  const [detalleAccion, setDetalleAccion] = useState('');
  const [guardandoTarea, setGuardandoTarea] = useState(false);

  const [cotizacionesCliente, setCotizacionesCliente] = useState<Cotizacion[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  // --- ESTADOS PARA LA BITÁCORA DE LLAMADAS ---
  const [llamadasDelDia, setLlamadasDelDia] = useState<Llamada[]>([]);
  const [llamadaClienteId, setLlamadaClienteId] = useState('');
  const [llamadaAgente, setLlamadaAgente] = useState('Saúl Intriago');
  const [llamadaResultado, setLlamadaResultado] = useState('Contestó');
  const [llamadaNota, setLlamadaNota] = useState('');
  const [guardandoLlamadaRapida, setGuardandoLlamadaRapida] = useState(false);

  // --- NUEVOS ESTADOS PARA EL BUSCADOR DE LLAMADAS ---
  const [busquedaLlamada, setBusquedaLlamada] = useState('');
  const [mostrarOpcionesLlamada, setMostrarOpcionesLlamada] = useState(false);

  const [plantillaMensaje, setPlantillaMensaje] = useState(
    "Hola {nombre}, le saluda Saúl Intriago de Arienzo Boutique Living. Recibí su solicitud de información y le comparto el brochure del proyecto. ¿A qué hora le viene bien que conversemos unos minutos?"
  );
  
  const [plantillaCampana, setPlantillaCampana] = useState(
    "Hola {nombre}, le escribo de Arienzo Boutique Living. Hoy lanzamos un beneficio especial para elegir las mejores unidades. ¿Le gustaría que le envíe el inventario actualizado?"
  );

  const estados = ['Interesado', 'Contactado', 'Cotizado', 'En Negociación', 'Reserva', 'Cierre (Ganado)', 'Descartado'];
  const origenes = ['Referido / Directo', 'Llamada Telefónica', 'WhatsApp Orgánico', 'Instagram / Facebook', 'Meta Ads', 'Feria / Evento', 'Otro'];
  const motivos = ['Por definir', 'Para Vivir', 'Para Invertir', 'Segunda Residencia'];
  const intereses = ['Por definir', 'Suite', '2 Dormitorios', '3 Dormitorios', 'Local Comercial', 'Penthouse'];
  const tiposAccion = ['Llamada Telefónica', 'Reunión Presencial', 'Mensaje WhatsApp', 'Enviar Cotización'];

  useEffect(() => {
    cargarClientes();
    cargarLlamadasHoy();
    const plantillaGuardada = localStorage.getItem('plantilla_bienvenida_arienzo');
    const campanaGuardada = localStorage.getItem('plantilla_campana_arienzo');
    
    if (plantillaGuardada) setPlantillaMensaje(plantillaGuardada);
    if (campanaGuardada) setPlantillaCampana(campanaGuardada);
  }, []);

  useEffect(() => {
    if (clienteSeleccionado) {
      setFechaAccion(clienteSeleccionado.proximo_contacto || '');
      setTipoAccion(clienteSeleccionado.tipo_accion || 'Llamada Telefónica');
      setDetalleAccion(clienteSeleccionado.detalle_accion || '');
      setNuevaNotaTexto('');
    }
  }, [clienteSeleccionado]);

  const cargarClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setClientes(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setCargando(false);
    }
  };

  const cargarLlamadasHoy = async () => {
    try {
      const start = new Date(); 
      start.setHours(0,0,0,0);
      const { data, error } = await supabase
        .from('registro_llamadas')
        .select('*, clientes(nombres, apellidos)')
        .gte('created_at', start.toISOString())
        .order('created_at', { ascending: false });
        
      if (!error && data) setLlamadasDelDia(data);
    } catch (error) {
      console.error('Error cargando llamadas:', error);
    }
  };

  // --- FUNCIÓN REGISTRAR LLAMADA (CON SINCRONIZACIÓN) ---
  const registrarLlamadaRapida = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!llamadaClienteId) { alert("Selecciona un prospecto de la lista usando el buscador."); return; }
    
    setGuardandoLlamadaRapida(true);
    try {
      // 1. Guardar en la tabla de bitácora de llamadas
      const payload = {
        cliente_id: llamadaClienteId,
        agente: llamadaAgente,
        resultado: llamadaResultado,
        notas: llamadaNota
      };

      const { data, error } = await supabase.from('registro_llamadas').insert([payload]).select('*, clientes(nombres, apellidos)');
      if (error) throw error;

      if (data) {
        setLlamadasDelDia([data[0], ...llamadasDelDia]);
      }

      // 2. Sincronizar nota en el perfil general del cliente
      const clienteActual = clientes.find(c => c.id === llamadaClienteId);
      if (clienteActual) {
        const fechaStr = new Date().toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' });
        const prefijo = `[${fechaStr}] Llamada (${llamadaResultado}) por ${llamadaAgente}`;
        const textoNota = llamadaNota ? `: ${llamadaNota}` : '';
        const notaSincronizada = `${prefijo}${textoNota}\n\n${clienteActual.notas || ''}`;

        await supabase.from('clientes').update({ notas: notaSincronizada }).eq('id', llamadaClienteId);
        
        setClientes(prev => prev.map(c => c.id === llamadaClienteId ? { ...c, notas: notaSincronizada } : c));
        if (clienteSeleccionado?.id === llamadaClienteId) {
          setClienteSeleccionado(prev => prev ? { ...prev, notas: notaSincronizada } : prev);
        }
      }
      
      // 3. Limpiar formulario
      setLlamadaClienteId('');
      setBusquedaLlamada('');
      setLlamadaNota('');
      
    } catch (error: any) {
      alert(`Error al registrar llamada: ${error.message}`);
    } finally {
      setGuardandoLlamadaRapida(false);
    }
  };

  // --- FILTRO EN VIVO PARA EL BUSCADOR DE LLAMADAS ---
  const prospectosFiltradosParaLlamada = useMemo(() => {
    if (!busquedaLlamada) return clientes.slice(0, 50);
    const b = busquedaLlamada.toLowerCase();
    return clientes.filter(c => 
      `${c.nombres} ${c.apellidos}`.toLowerCase().includes(b) ||
      (c.telefono && c.telefono.includes(b))
    ).slice(0, 50);
  }, [clientes, busquedaLlamada]);

  const ciudadesDisponibles = useMemo(() => {
    const setCiudades = new Set<string>();
    clientes.forEach(c => {
      if (c.ciudad_residencia) setCiudades.add(c.ciudad_residencia.trim());
    });
    return Array.from(setCiudades).sort();
  }, [clientes]);

  const tipologiasDisponibles = useMemo(() => {
    const setTipos = new Set<string>();
    clientes.forEach(c => {
      if (c.tipologia_interes) setTipos.add(c.tipologia_interes.trim());
    });
    return Array.from(setTipos).sort();
  }, [clientes]);

  const origenesDisponibles = useMemo(() => {
    const setOrigenes = new Set<string>();
    clientes.forEach(c => {
      if (c.origen_captacion) setOrigenes.add(c.origen_captacion.trim());
    });
    return Array.from(setOrigenes).sort();
  }, [clientes]);

  const handleDragStart = (e: React.DragEvent, clienteId: string) => { e.dataTransfer.setData('clienteId', clienteId); };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };

  const handleDrop = async (e: React.DragEvent, nuevoEstado: string) => {
    e.preventDefault();
    const clienteId = e.dataTransfer.getData('clienteId');
    if (!clienteId) return;

    setClientes(prev => prev.map(c => c.id === clienteId ? { ...c, estado: nuevoEstado } : c));
    if (clienteSeleccionado?.id === clienteId) {
      setClienteSeleccionado(prev => prev ? { ...prev, estado: nuevoEstado } : prev);
    }

    try {
      const { error } = await supabase.from('clientes').update({ estado: nuevoEstado }).eq('id', clienteId);
      if (error) throw error;
    } catch (error: any) {
      console.error("Error moviendo lead:", error);
      cargarClientes();
    }
  };

  const guardarNuevoCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizarTelefono = (tel: string) => {
      if (!tel) return '';
      let num = tel.replace(/\D/g, '');
      if (num.startsWith('593')) num = num.substring(3);
      if (num.startsWith('0')) num = num.substring(1);
      return num;
    };

    const telefonoNormalizadoNuevo = normalizarTelefono(nuevoTelefono);
    const clienteDuplicadoTelefono = clientes.find(c => c.telefono && normalizarTelefono(c.telefono) === telefonoNormalizadoNuevo);

    if (clienteDuplicadoTelefono) {
      alert(`⚠️ ¡ATENCIÓN! Este número ya está registrado.\nPertenece a: ${clienteDuplicadoTelefono.nombres} ${clienteDuplicadoTelefono.apellidos}`);
      return; 
    }

    setGuardandoCliente(true);
    try {
      const notaInicial = `[${new Date().toLocaleDateString('es-EC')}] Cliente ingresado por ${nuevoIngresadoPor || 'Sistema'}.`;
      const payload: any = {
        nombres: nuevoNombre.trim(), apellidos: nuevoApellido.trim(), telefono: nuevoTelefono.trim(),
        email: nuevoEmail ? nuevoEmail.trim().toLowerCase() : null, ciudad_residencia: nuevaCiudad.trim() || null, 
        motivo_compra: nuevoMotivo, tipologia_interes: nuevoInteres, origen_captacion: nuevoOrigen, 
        notas: notaInicial, estado: 'Interesado', tipo: 'prospecto', temperatura: '❄️ Frío'
      };
      if (nuevoIngresadoPor.trim()) payload.ingresado_por = nuevoIngresadoPor.trim();

      const { data, error } = await supabase.from('clientes').insert([payload]).select();
      if (error) throw error;
      if (data && data.length > 0) {
        setClientes([data[0], ...clientes]);
        setMostrarModalNuevo(false);
        setNuevoNombre(''); setNuevoApellido(''); setNuevoTelefono(''); setNuevoEmail(''); setNuevaCiudad(''); 
      }
    } catch (error: any) { alert(`Error al guardar: ${error.message}`); } finally { setGuardandoCliente(false); }
  };

  const guardarPlantilla = () => {
    localStorage.setItem('plantilla_bienvenida_arienzo', plantillaMensaje);
    localStorage.setItem('plantilla_campana_arienzo', plantillaCampana);
    setMostrarModalPlantilla(false);
    alert('Mensajes actualizados correctamente.');
  };

  const actualizarCampoRapido = async (id: string, campo: string, valor: string) => {
    setClientes(prev => prev.map(c => c.id === id ? { ...c, [campo]: valor } : c));
    if (clienteSeleccionado?.id === id) setClienteSeleccionado(prev => prev ? { ...prev, [campo]: valor } : prev);
    await supabase.from('clientes').update({ [campo]: valor }).eq('id', id);
  };

  const guardarProximaTarea = async () => {
    if (!clienteSeleccionado) return;
    setGuardandoTarea(true);
    try {
      const updates = { proximo_contacto: fechaAccion || null, tipo_accion: tipoAccion, detalle_accion: detalleAccion || null };
      const { error } = await supabase.from('clientes').update(updates).eq('id', clienteSeleccionado.id);
      if (error) throw error;

     setClientes(prev => prev.map(c => c.id === clienteSeleccionado.id ? { ...c, ...updates } as any : c));
      setClienteSeleccionado(prev => prev ? { ...prev, ...updates } : prev);
      
      const btn = document.getElementById('btn-guardar-tarea');
      if (btn) {
        const originalText = btn.innerText; btn.innerText = '¡Guardado!'; btn.classList.add('bg-green-600');
        setTimeout(() => { btn.innerText = originalText; btn.classList.remove('bg-green-600'); }, 2000);
      }
    } catch (error: any) { alert(`Error al guardar: ${error.message}`); } finally { setGuardandoTarea(false); }
  };

  const agregarNotaBitacora = async () => {
    if (!clienteSeleccionado || !nuevaNotaTexto.trim()) return;
    setGuardandoNota(true);
    try {
      const fecha = new Date().toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' });
      const notaFinal = `[${fecha}] ${nuevaNotaTexto}\n\n${clienteSeleccionado.notas || ''}`;
      
      const { error } = await supabase.from('clientes').update({ notas: notaFinal }).eq('id', clienteSeleccionado.id);
      if (error) throw error;

      setClientes(prev => prev.map(c => c.id === clienteSeleccionado.id ? { ...c, notas: notaFinal } : c));
      setClienteSeleccionado(prev => prev ? { ...prev, notas: notaFinal } : prev);
      setNuevaNotaTexto('');
    } catch (error: any) { alert(`Error: ${error.message}`); } finally { setGuardandoNota(false); }
  };

  const abrirWhatsApp = (cliente: Cliente, tipoMensaje: 'bienvenida' | 'campana' | 'libre') => {
    if (!cliente.telefono) { alert("Sin número registrado."); return; }
    let num = cliente.telefono.replace(/\D/g, '');
    if (num.startsWith('09') && num.length === 10) num = '593' + num.substring(1);
    
    let txt = '';
    if (tipoMensaje === 'bienvenida') txt = `?text=${encodeURIComponent(plantillaMensaje.replace('{nombre}', cliente.nombres))}`;
    else if (tipoMensaje === 'campana') txt = `?text=${encodeURIComponent(plantillaCampana.replace('{nombre}', cliente.nombres))}`;
    
    window.open(`https://wa.me/${num}${txt}`, '_blank');
  };

  const verHistorialCotizaciones = async (cliente: Cliente) => {
    setMostrarModalHistorial(true);
    setCargandoHistorial(true);
    try {
      const { data, error } = await supabase.from('cotizaciones').select('*').eq('cliente_id', cliente.id).order('created_at', { ascending: false });
      if (error) throw error;
      setCotizacionesCliente(data || []);
    } catch (error) { console.error(error); } finally { setCargandoHistorial(false); }
  };

  const clientesFiltrados = useMemo(() => {
    return clientes.filter(c => {
      const b = busqueda.toLowerCase();
      const coincideBusqueda = !b || `${c.nombres || ''} ${c.apellidos || ''}`.toLowerCase().includes(b) || (c.telefono && c.telefono.includes(b));
      const coincideCiudad = filtroCiudad === 'Todas' || (c.ciudad_residencia && c.ciudad_residencia.toLowerCase().trim() === filtroCiudad.toLowerCase().trim());
      const coincideTipologia = filtroTipologia === 'Todas' || (c.tipologia_interes && c.tipologia_interes.toLowerCase().trim() === filtroTipologia.toLowerCase().trim());
      const coincideOrigen = filtroOrigen === 'Todos' || (c.origen_captacion && c.origen_captacion.toLowerCase().trim() === filtroOrigen.toLowerCase().trim());
      return coincideBusqueda && coincideCiudad && coincideTipologia && coincideOrigen;
    });
  }, [clientes, busqueda, filtroCiudad, filtroTipologia, filtroOrigen]);

  const esFechaVencida = (fecha?: string | null) => {
    if (!fecha) return false;
    const hoy = new Date(); hoy.setHours(0,0,0,0);
    return new Date(fecha + 'T00:00:00') <= hoy;
  };

  if (cargando) return <div className="flex min-h-screen items-center justify-center bg-[#F4F4F4]"><p className="text-sm font-light tracking-widest text-[#B94A36] uppercase animate-pulse">Sincronizando...</p></div>;

  return (
    <div className="min-h-screen bg-[#F4F4F4] px-4 md:px-6 py-6 font-sans text-neutral-800 flex flex-col h-screen overflow-hidden">
      
      {/* HEADER PRINCIPAL */}
      <div className="w-full flex-shrink-0 mb-4 space-y-3">
        <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-[#B94A36] uppercase">Gestión Comercial Arienzo</span>
            <h1 className="text-xl font-medium tracking-tight text-neutral-900 mt-1">Pipeline de Prospectos</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setMostrarModalPlantilla(true)} className="px-3 py-2 bg-neutral-100 text-neutral-700 text-xs font-bold rounded-lg hover:bg-neutral-200 transition">⚙️ Plantillas WhatsApp</button>
            <button onClick={() => setMostrarModalNuevo(true)} className="px-4 py-2 bg-[#B94A36] text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[#9B3B2B] transition shadow-md">+ Prospecto</button>
          </div>
        </div>

        {/* BARRA DE BÚSQUEDA Y FILTROS ESTRUCTURADOS */}
        <div className="bg-white p-3 rounded-xl border border-neutral-200 shadow-sm flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">🔍</span>
            <input 
              type="text" 
              placeholder="Buscar prospecto..." 
              value={busqueda} 
              onChange={(e) => setBusqueda(e.target.value)} 
              className="w-full bg-neutral-50 border border-neutral-200 rounded-lg py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-[#B94A36]" 
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-neutral-400 font-medium text-[10px] uppercase">Ciudad:</span>
            <select value={filtroCiudad} onChange={(e) => setFiltroCiudad(e.target.value)} className="bg-neutral-50 border border-neutral-200 rounded-lg py-2 px-2.5 text-xs font-semibold text-neutral-700 outline-none focus:border-[#B94A36]">
              <option value="Todas">Todas</option>
              {ciudadesDisponibles.map(ciu => <option key={ciu} value={ciu}>{ciu}</option>)}
            </select>
          </div>

          <div className="flex bg-neutral-100 p-1 rounded-lg border border-neutral-200 flex-shrink-0 ml-auto">
            <button onClick={() => setVista('kanban')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${vista === 'kanban' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500'}`}>📋 Tablero</button>
            <button onClick={() => setVista('lista')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${vista === 'lista' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500'}`}>🗄️ Lista</button>
            <button onClick={() => setVista('llamadas')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${vista === 'llamadas' ? 'bg-[#B94A36] text-white shadow-xs' : 'text-neutral-500 hover:text-neutral-700'}`}>📞 Llamadas</button>
          </div>
        </div>
      </div>

      {/* ÁREA DE TRABAJO DINÁMICA */}
      <div className="w-full flex-1 min-h-0 overflow-hidden relative">
        
        {vista === 'kanban' && (
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-2 h-full overflow-y-auto pb-4 custom-scrollbar px-1">
            {estados.map(estado => {
              const leads = clientesFiltrados.filter(c => c.estado === estado);
              return (
                <div key={estado} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, estado)} className="bg-neutral-200/40 rounded-xl p-2 flex flex-col h-full overflow-hidden border border-neutral-200/60">
                  <div className="flex justify-between items-center mb-2 px-1 flex-shrink-0">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-neutral-600 truncate pr-2">{estado}</h3>
                    <span className="bg-white text-neutral-500 text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">{leads.length}</span>
                  </div>
                  <div className="space-y-2 overflow-y-auto flex-1 pr-1 custom-scrollbar">
                    {leads.map(cliente => (
                      <div key={cliente.id} draggable onDragStart={(e) => handleDragStart(e, cliente.id)} onClick={() => setClienteSeleccionado(cliente)} className={`bg-white p-2.5 rounded-lg shadow-sm border ${cliente.tipo === 'cliente' ? 'border-[#B94A36]/40' : 'border-neutral-200'} hover:border-[#B94A36] cursor-pointer transition-all relative cursor-grab`}>
                        {cliente.temperatura && <span className="absolute top-2 right-2 text-[10px]">{cliente.temperatura.split(' ')[0]}</span>}
                        <h4 className="font-bold text-neutral-900 text-[11px] pr-4 leading-tight">{cliente.nombres} {cliente.apellidos}</h4>
                        <p className="text-[9px] text-neutral-500 font-mono mt-0.5">{cliente.telefono || 'Sin celular'}</p>
                        {cliente.proximo_contacto && (
                          <div className={`mt-1.5 text-[8px] font-bold px-1.5 py-0.5 inline-block rounded border ${esFechaVencida(cliente.proximo_contacto) ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                            📅 {new Date(cliente.proximo_contacto).toLocaleDateString('es-EC', {day:'2-digit', month:'short'})}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {vista === 'lista' && (
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm h-full overflow-auto w-full">
            <table className="w-full text-left text-sm border-collapse min-w-[800px]">
              <thead className="sticky top-0 bg-neutral-900 z-10">
                <tr className="text-white text-[10px] uppercase tracking-wider">
                  <th className="px-4 py-3 font-semibold">Prospecto</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold">Tarea Pendiente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700">
                {clientesFiltrados.map((cliente) => (
                  <tr key={cliente.id} onClick={() => setClienteSeleccionado(cliente)} className="hover:bg-neutral-50 cursor-pointer">
                    <td className="px-4 py-3">
                      <div className="font-bold text-neutral-900 text-xs">{cliente.nombres} {cliente.apellidos}</div>
                      <div className="text-[10px] text-neutral-400 font-mono">{cliente.telefono}</div>
                    </td>
                    <td className="px-4 py-3"><div className="text-[10px] font-bold text-neutral-700 bg-neutral-100 inline-block px-1.5 py-0.5 rounded">{cliente.estado}</div></td>
                    <td className="px-4 py-3">
                      {cliente.proximo_contacto ? (
                         <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${esFechaVencida(cliente.proximo_contacto) ? 'bg-red-100 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                           {new Date(cliente.proximo_contacto).toLocaleDateString('es-EC')}
                         </span>
                      ) : <span className="text-[10px] text-neutral-400">Sin agendar</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* === VISTA 3: BITÁCORA DE LLAMADAS === */}
        {vista === 'llamadas' && (
          <div className="flex flex-col h-full gap-4">
            
            <div className="grid grid-cols-3 gap-4 flex-shrink-0">
              <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Total Llamadas Hoy</p>
                <p className="text-3xl font-light text-neutral-900 mt-1">{llamadasDelDia.length}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
                <p className="text-[10px] font-bold text-[#128C7E] uppercase tracking-widest">Contactos Efectivos</p>
                <p className="text-3xl font-light text-[#128C7E] mt-1">
                  {llamadasDelDia.filter(ll => ll.resultado === 'Contestó' || ll.resultado === 'Efectiva').length}
                </p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex flex-col justify-center space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-neutral-600 uppercase">Saúl Intriago</span>
                  <span className="text-sm font-bold text-neutral-900">{llamadasDelDia.filter(ll => ll.agente.includes('Saúl')).length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-neutral-600 uppercase">Débora Mera</span>
                  <span className="text-sm font-bold text-neutral-900">{llamadasDelDia.filter(ll => ll.agente.includes('Débora') || ll.agente.includes('Debbi')).length}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-0">
              
              <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-5 w-full md:w-1/3 flex flex-col flex-shrink-0">
                <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wide border-b border-neutral-100 pb-3 mb-4">📞 Registrar Nueva Llamada</h3>
                <form onSubmit={registrarLlamadaRapida} className="space-y-4 flex-1">
                  
                  {/* BUSCADOR DE PROSPECTO (Autocomplete) */}
                  <div className="relative">
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Prospecto Marcado</label>
                    <input 
                      type="text" 
                      placeholder="🔍 Escribe nombre o teléfono..."
                      value={busquedaLlamada}
                      onChange={(e) => {
                        setBusquedaLlamada(e.target.value);
                        setMostrarOpcionesLlamada(true);
                        setLlamadaClienteId(''); 
                      }}
                      onFocus={() => setMostrarOpcionesLlamada(true)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-md p-2 text-xs focus:outline-none focus:border-[#B94A36]"
                    />
                    
                    {mostrarOpcionesLlamada && !llamadaClienteId && (
                      <ul className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-md shadow-lg max-h-48 overflow-y-auto custom-scrollbar">
                        {prospectosFiltradosParaLlamada.length > 0 ? (
                          prospectosFiltradosParaLlamada.map(c => (
                            <li 
                              key={c.id} 
                              className="p-2 text-xs hover:bg-neutral-50 cursor-pointer border-b border-neutral-100 last:border-0 flex flex-col"
                              onClick={() => {
                                setLlamadaClienteId(c.id);
                                setBusquedaLlamada(`${c.nombres} ${c.apellidos}`);
                                setMostrarOpcionesLlamada(false);
                              }}
                            >
                              <span className="font-bold text-neutral-800">{c.nombres} {c.apellidos}</span>
                              <span className="text-[10px] text-neutral-500 font-mono">{c.telefono}</span>
                            </li>
                          ))
                        ) : (
                          <li className="p-2 text-xs text-neutral-400 text-center">No se encontraron resultados</li>
                        )}
                      </ul>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Agente</label>
                      <select value={llamadaAgente} onChange={(e) => setLlamadaAgente(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-md p-2 text-xs focus:outline-none">
                        <option value="Saúl Intriago">Saúl</option>
                        <option value="Débora Mera">Débora</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Resultado</label>
                      <select value={llamadaResultado} onChange={(e) => setLlamadaResultado(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-md p-2 text-xs font-bold focus:outline-none">
                        <option value="Contestó">✅ Contestó</option>
                        <option value="No contestó">❌ No contestó</option>
                        <option value="Equivocado">🚫 Número Erróneo</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Nota Rápida</label>
                    <textarea rows={4} value={llamadaNota} onChange={(e) => setLlamadaNota(e.target.value)} placeholder="Ej: Me pidió que le envíe planos..." className="w-full bg-neutral-50 border border-neutral-200 rounded-md p-2 text-xs focus:outline-none resize-none"></textarea>
                  </div>
                  <button type="submit" disabled={guardandoLlamadaRapida} className="w-full py-3 mt-4 bg-[#B94A36] hover:bg-[#9B3B2B] text-white text-[11px] font-bold uppercase tracking-widest rounded-lg transition disabled:opacity-50">
                    {guardandoLlamadaRapida ? 'Guardando...' : '💾 Guardar Registro'}
                  </button>
                </form>
              </div>

              <div className="bg-white rounded-xl border border-neutral-200 shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="p-4 border-b border-neutral-100 bg-neutral-50">
                  <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wide">📋 Actividad en Tiempo Real</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  {llamadasDelDia.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-neutral-400 text-xs text-center">Aún no se han registrado llamadas el día de hoy.<br/>¡A marcar números!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {llamadasDelDia.map((ll) => (
                        <div key={ll.id} className="flex gap-4 p-3 bg-neutral-50 border border-neutral-100 rounded-lg">
                          <div className="text-center pt-1">
                            <span className="text-[10px] font-mono text-neutral-400">{new Date(ll.created_at).toLocaleTimeString('es-EC', {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-neutral-900">{ll.clientes?.nombres} {ll.clientes?.apellidos}</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${ll.resultado === 'Contestó' ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>{ll.resultado}</span>
                            </div>
                            <p className="text-[11px] text-neutral-600">{ll.notas || 'Sin notas'}</p>
                            <p className="text-[9px] font-bold text-neutral-400 mt-1 uppercase">Marcado por: {ll.agente}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* --- MODALES Y PANEL LATERAL (INFERIOR) --- */}
      {clienteSeleccionado && (
        <div className="fixed inset-0 bg-neutral-900/40 z-40 transition-opacity backdrop-blur-[2px]" onClick={() => setClienteSeleccionado(null)}></div>
      )}

      <div className={`fixed top-0 right-0 h-full w-full max-w-[360px] bg-white shadow-2xl border-l border-neutral-200 transform transition-transform duration-300 z-50 flex flex-col ${clienteSeleccionado ? 'translate-x-0' : 'translate-x-full'}`}>
        {clienteSeleccionado && (
          <>
            <div className="p-5 border-b border-neutral-100 bg-neutral-50 relative flex-shrink-0">
              <button onClick={() => setClienteSeleccionado(null)} className="absolute top-3 right-4 text-neutral-400 hover:text-neutral-900 text-xl font-bold">&times;</button>
              <h2 className="text-lg font-bold text-neutral-900 pr-6 leading-tight">
                {clienteSeleccionado.tipo === 'cliente' && <span className="text-[#B94A36] mr-1" title="Inversionista Formal">👑</span>}
                {clienteSeleccionado.nombres} {clienteSeleccionado.apellidos}
              </h2>
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="bg-white border border-neutral-200 text-neutral-600 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">{clienteSeleccionado.origen_captacion || 'Sin origen'}</span>
                {clienteSeleccionado.ciudad_residencia && (
                  <span className="bg-neutral-100 text-neutral-700 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">📍 {clienteSeleccionado.ciudad_residencia}</span>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Acciones de Contacto</p>
                <div className="flex gap-2">
                  <button onClick={() => abrirWhatsApp(clienteSeleccionado, 'bienvenida')} className="flex-1 flex flex-col items-center justify-center gap-1 bg-[#25D366] hover:bg-[#1DA851] text-white py-2 rounded-lg transition shadow-sm border border-transparent">
                    <span className="text-xs font-bold leading-none mt-1">👋 Welcome</span>
                  </button>
                  <button onClick={() => abrirWhatsApp(clienteSeleccionado, 'campana')} className="flex-1 flex flex-col items-center justify-center gap-1 bg-[#128C7E] hover:bg-[#075E54] text-white py-2 rounded-lg transition shadow-sm border border-transparent">
                    <span className="text-xs font-bold leading-none mt-1">📢 Campaña</span>
                  </button>
                  <button onClick={() => abrirWhatsApp(clienteSeleccionado, 'libre')} className="flex-1 flex flex-col items-center justify-center gap-1 bg-white hover:bg-neutral-50 text-neutral-700 py-2 rounded-lg transition shadow-sm border border-neutral-200">
                    <span className="text-xs font-bold leading-none mt-1">💬 Chat</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Fase Embudo</label>
                  <select value={clienteSeleccionado.estado} onChange={(e) => actualizarCampoRapido(clienteSeleccionado.id, 'estado', e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-md p-1.5 text-[11px] font-bold text-neutral-800 outline-none focus:border-[#B94A36]">
                    {estados.map(est => <option key={est} value={est}>{est}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Termómetro</label>
                  <select value={clienteSeleccionado.temperatura || '❄️ Frío'} onChange={(e) => actualizarCampoRapido(clienteSeleccionado.id, 'temperatura', e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-md p-1.5 text-[11px] font-bold text-neutral-800 outline-none focus:border-[#B94A36]">
                    <option value="🔥 Caliente">🔥 Caliente</option>
                    <option value="☀️ Tibio">☀️ Tibio</option>
                    <option value="❄️ Frío">❄️ Frío</option>
                  </select>
                </div>
              </div>

              <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl space-y-3">
                <h3 className="text-[11px] font-bold text-blue-800 flex items-center gap-1.5 uppercase tracking-wider mb-2">
                  📅 Agendar Siguiente Paso
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-neutral-500 uppercase mb-1">Fecha</label>
                    <input type="date" value={fechaAccion} onChange={(e) => setFechaAccion(e.target.value)} className="w-full bg-white border border-neutral-200 rounded-md p-1.5 text-[11px] font-medium outline-none focus:border-blue-400" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-neutral-500 uppercase mb-1">Tipo de Acción</label>
                    <select value={tipoAccion} onChange={(e) => setTipoAccion(e.target.value)} className="w-full bg-white border border-neutral-200 rounded-md p-1.5 text-[11px] font-medium outline-none focus:border-blue-400">
                      {tiposAccion.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-neutral-500 uppercase mb-1">Objetivo / Detalles</label>
                  <input type="text" value={detalleAccion} onChange={(e) => setDetalleAccion(e.target.value)} placeholder="Ej: Preguntar qué opinó la mamá..." className="w-full bg-white border border-neutral-200 rounded-md p-2 text-[11px] outline-none focus:border-blue-400" />
                </div>
                <div className="flex justify-end pt-1">
                  <button id="btn-guardar-tarea" onClick={guardarProximaTarea} disabled={guardandoTarea} className="px-3 py-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-md hover:bg-blue-700 transition shadow-sm">
                    {guardandoTarea ? 'Guardando...' : '💾 Guardar Tarea'}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-[11px] font-bold text-neutral-900 tracking-wider mb-2 uppercase">Log de Seguimiento</label>
                <div className="flex flex-col gap-2 mb-3">
                  <textarea rows={2} value={nuevaNotaTexto} onChange={(e) => setNuevaNotaTexto(e.target.value)} placeholder="¿Qué ocurrió en el contacto de hoy?" className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2 text-xs focus:outline-none focus:border-neutral-400 resize-none" />
                  <button onClick={agregarNotaBitacora} disabled={!nuevaNotaTexto.trim() || guardandoNota} className="self-end px-3 py-1 bg-neutral-800 text-white text-[10px] font-bold rounded-md disabled:opacity-50 hover:bg-black transition">
                    {guardandoNota ? 'Registrando...' : '+ Agregar Registro'}
                  </button>
                </div>
                <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 h-[150px] overflow-y-auto custom-scrollbar shadow-inner">
                  {clienteSeleccionado.notas ? (
                    <div className="text-[11px] text-neutral-700 whitespace-pre-wrap leading-relaxed">{clienteSeleccionado.notas}</div>
                  ) : (
                    <p className="text-[11px] text-neutral-400 text-center italic mt-10">Sin actividad registrada aún.</p>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 pb-6">
                <button onClick={() => verHistorialCotizaciones(clienteSeleccionado)} className="w-full py-2 bg-neutral-100 text-neutral-700 rounded-lg text-[11px] font-bold hover:bg-neutral-200 transition">
                  📄 Ver Cotizaciones Generadas
                </button>
              </div>

            </div>
          </>
        )}
      </div>

      {mostrarModalNuevo && (
        <div className="fixed inset-0 bg-neutral-900/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6">
            <div className="flex justify-between items-center mb-4 border-b border-neutral-100 pb-3">
              <h2 className="text-lg font-bold text-neutral-900">Registro de Prospecto</h2>
              <button onClick={() => setMostrarModalNuevo(false)} className="text-neutral-400 hover:text-neutral-900 text-xl font-bold">&times;</button>
            </div>
            <form onSubmit={guardarNuevoCliente} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Nombres <span className="text-[#B94A36]">*</span></label>
                  <input required type="text" value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-md p-2 text-xs focus:outline-none focus:border-[#B94A36]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Apellidos</label>
                  <input type="text" value={nuevoApellido} onChange={e => setNuevoApellido(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-md p-2 text-xs focus:outline-none focus:border-[#B94A36]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Teléfono <span className="text-[#B94A36]">*</span></label>
                  <input required type="tel" value={nuevoTelefono} onChange={e => setNuevoTelefono(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-md p-2 text-xs focus:outline-none focus:border-[#B94A36]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Email</label>
                  <input type="email" value={nuevoEmail} onChange={e => setNuevoEmail(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-md p-2 text-xs focus:outline-none focus:border-[#B94A36]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Ciudad Residencia</label>
                  <input type="text" value={nuevaCiudad} onChange={e => setNuevaCiudad(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-md p-2 text-xs focus:outline-none focus:border-[#B94A36]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Ingresado Por (Asesor)</label>
                  <input type="text" value={nuevoIngresadoPor} onChange={e => setNuevoIngresadoPor(e.target.value)} placeholder="Ej: Saúl Intriago" className="w-full bg-neutral-50 border border-neutral-200 rounded-md p-2 text-xs font-semibold focus:outline-none focus:border-[#B94A36]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Origen</label>
                  <select value={nuevoOrigen} onChange={e => setNuevoOrigen(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-md p-2 text-xs focus:outline-none focus:border-[#B94A36]">
                    {origenes.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Motivo Compra</label>
                  <select value={nuevoMotivo} onChange={e => setNuevoMotivo(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-md p-2 text-xs focus:outline-none focus:border-[#B94A36]">
                    {motivos.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Interés</label>
                  <select value={nuevoInteres} onChange={e => setNuevoInteres(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-md p-2 text-xs focus:outline-none focus:border-[#B94A36]">
                    {intereses.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setMostrarModalNuevo(false)} className="px-4 py-2 text-xs font-semibold text-neutral-500">Cancelar</button>
                <button type="submit" disabled={guardandoCliente} className="px-5 py-2 bg-[#B94A36] text-white rounded-md text-xs font-bold uppercase tracking-wider hover:bg-[#9B3B2B] disabled:opacity-50">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mostrarModalPlantilla && (
        <div className="fixed inset-0 bg-neutral-900/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
            <h2 className="text-lg font-bold text-neutral-900 mb-2">Configuración de Plantillas WhatsApp</h2>
            <p className="text-[10px] text-neutral-500 mb-4">Usa <strong className="text-neutral-800">{`{nombre}`}</strong> donde deba aparecer el prospecto.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">👋 Mensaje Inicial / Bienvenida</label>
                <textarea rows={3} value={plantillaMensaje} onChange={e => setPlantillaMensaje(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-sm focus:outline-none focus:border-[#B94A36]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#128C7E] mb-1">📢 Mensaje de Campaña / Seguimiento Masivo</label>
                <textarea rows={3} value={plantillaCampana} onChange={e => setPlantillaCampana(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-sm focus:outline-none focus:border-[#128C7E]" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setMostrarModalPlantilla(false)} className="px-4 py-2 text-xs font-semibold text-neutral-600">Cancelar</button>
              <button onClick={guardarPlantilla} className="px-5 py-2 bg-neutral-900 text-white text-xs font-bold rounded-lg hover:bg-neutral-800">Guardar Plantillas</button>
            </div>
          </div>
        </div>
      )}

      {mostrarModalHistorial && clienteSeleccionado && (
        <div className="fixed inset-0 bg-neutral-900/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6">
            <div className="flex justify-between items-center mb-4 border-b border-neutral-100 pb-3">
              <h2 className="text-lg font-bold text-neutral-900">Cotizaciones Emitidas</h2>
              <button onClick={() => setMostrarModalHistorial(false)} className="text-neutral-400 hover:text-neutral-900 text-xl font-bold">&times;</button>
            </div>
            <div className="min-h-[150px] max-h-[400px] overflow-y-auto">
              {cargandoHistorial ? (
                <p className="text-center text-xs text-neutral-400 mt-10">Buscando...</p>
              ) : cotizacionesCliente.length === 0 ? (
                <p className="text-center text-xs text-neutral-400 mt-10">Sin cotizaciones generadas.</p>
              ) : (
                <div className="space-y-3">
                  {cotizacionesCliente.map((cot, i) => (
                    <div key={i} className="flex justify-between items-center bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                      <div>
                        <p className="text-sm font-bold text-neutral-900">Unidad {cot.unidad_numero}</p>
                        <p className="text-[10px] text-neutral-500 mt-0.5">{new Date(cot.created_at).toLocaleDateString('es-EC')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-neutral-400 uppercase tracking-wider mb-0.5">Precio Cierre</p>
                        <p className="text-sm font-mono font-bold text-[#B94A36]">${cot.precio_total.toLocaleString('en-US')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}