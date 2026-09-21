// Actualizacion forzada para Vercel - CRM Premium Konkeri con Módulo de Email
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
  campana?: string;
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

interface Actividad {
  id?: string;
  cliente_id: string;
  agente: string;
  tipo_contacto: string; 
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
  const [filtroPendientes, setFiltroPendientes] = useState(false);

  const [vista, setVista] = useState<'lista' | 'kanban' | 'actividad'>('kanban');

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
  const [nuevoCampana, setNuevoCampana] = useState(''); 
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

  const [filtroTiempo, setFiltroTiempo] = useState<'hoy' | 'ayer' | 'semana' | 'mes'>('hoy');
  const [actividadesDia, setActividadesDia] = useState<Actividad[]>([]);
  
  const [llamadaClienteId, setLlamadaClienteId] = useState('');
  const [llamadaAgente, setLlamadaAgente] = useState('Saúl Intriago');
  const [tipoContacto, setTipoContacto] = useState('Llamada');
  const [llamadaResultado, setLlamadaResultado] = useState('Contestó');
  const [llamadaNota, setLlamadaNota] = useState('');
  const [guardandoActividadRapida, setGuardandoActividadRapida] = useState(false);

  const [proximaFechaRapida, setProximaFechaRapida] = useState('');
  const [proximaAccionRapida, setProximaAccionRapida] = useState('');

  const [busquedaLlamada, setBusquedaLlamada] = useState('');
  const [mostrarOpcionesLlamada, setMostrarOpcionesLlamada] = useState(false);

  // PLANTILLAS WHATSAPP
  const [plantillaMensaje, setPlantillaMensaje] = useState(
    "Hola {nombre}, le saluda Saúl Intriago de Arienzo Boutique Living. Recibí su solicitud de información y le comparto el brochure del proyecto. ¿A qué hora le viene bien que conversemos unos minutos?"
  );
  const [plantillaCampana, setPlantillaCampana] = useState(
    "Hola {nombre}, le escribo de Arienzo Boutique Living. Hoy lanzamos un beneficio especial para elegir las mejores unidades. ¿Le gustaría que le envíe el inventario actualizado?"
  );

  // PLANTILLAS CORREO (NUEVO)
  const [plantillaCorreoAsunto, setPlantillaCorreoAsunto] = useState("Información Exclusiva - Arienzo Boutique Living");
  const [plantillaCorreoCuerpo, setPlantillaCorreoCuerpo] = useState(
    "Hola {nombre},\n\nGracias por su interés en Arienzo Boutique Living. Adjunto la información detallada del proyecto para que pueda revisarla con calma.\n\nQuedo a su entera disposición para agendar una breve llamada y resolver cualquier inquietud.\n\nSaludos cordiales,\nSaúl Intriago\nKonkeri Real Estate"
  );

  // ESTADOS VIP
  const [activandoVIP, setActivandoVIP] = useState(false);
  const [tiempoVIP, setTiempoVIP] = useState<number>(24); // Valor por defecto 24 horas

  const estados = ['Interesado', 'Contactado', 'Cotizado', 'En Negociación', 'Reserva', 'Cierre (Ganado)', 'Descartado'];
  const origenes = ['Página Web / Landing Page', 'Referido / Directo', 'Llamada Telefónica', 'WhatsApp Orgánico', 'Instagram / Facebook', 'Meta Ads', 'Feria / Evento', 'Otro'];
  const motivos = ['Por definir', 'Para Vivir', 'Para Invertir', 'Segunda Residencia'];
  const intereses = ['Por definir', 'Suite', '2 Dormitorios', '3 Dormitorios', 'Local Comercial', 'Penthouse'];
  const tiposAccion = ['Llamada Telefónica', 'Reunión Presencial', 'Mensaje WhatsApp', 'Enviar Cotización', 'Enviar Correo'];

  useEffect(() => {
    cargarClientes();
    const plantillaGuardada = localStorage.getItem('plantilla_bienvenida_arienzo');
    const campanaGuardada = localStorage.getItem('plantilla_campana_arienzo');
    const correoAsuntoGuardado = localStorage.getItem('plantilla_correo_asunto');
    const correoCuerpoGuardado = localStorage.getItem('plantilla_correo_cuerpo');
    
    if (plantillaGuardada) setPlantillaMensaje(plantillaGuardada);
    if (campanaGuardada) setPlantillaCampana(campanaGuardada);
    if (correoAsuntoGuardado) setPlantillaCorreoAsunto(correoAsuntoGuardado);
    if (correoCuerpoGuardado) setPlantillaCorreoCuerpo(correoCuerpoGuardado);
  }, []);

  useEffect(() => {
    cargarBitacoraRango();
  }, [filtroTiempo]);

  useEffect(() => {
    if (clienteSeleccionado) {
      setFechaAccion(clienteSeleccionado.proximo_contacto || '');
      setTipoAccion(clienteSeleccionado.tipo_accion || 'Llamada Telefónica');
      setDetalleAccion(clienteSeleccionado.detalle_accion || '');
      setNuevaNotaTexto('');
    }
  }, [clienteSeleccionado]);

  // OTORGAR ACCESO VIP DINÁMICO
  const otorgarAccesoVIP = async (emailCliente?: string) => {
    if (!emailCliente) {
      alert("El prospecto no tiene un correo electrónico registrado. Actualiza sus datos primero.");
      return;
    }
    setActivandoVIP(true);
    try {
      const fechaExpiracion = new Date();
      fechaExpiracion.setHours(fechaExpiracion.getHours() + tiempoVIP); 

      const { error } = await supabase
        .from('accesos_inventario')
        .upsert({ 
          email: emailCliente.toLowerCase().trim(), 
          expira_en: fechaExpiracion.toISOString() 
        });

      if (error) throw error;
      
      alert(`¡Acceso VIP otorgado por ${tiempoVIP} horas!\n\nEl correo autorizado es: ${emailCliente}`);
      
    } catch (error: any) {
      alert(`Error al generar el pase: ${error.message}`);
    } finally {
      setActivandoVIP(false);
    }
  };

  const cargarClientes = async () => {
    try {
      const { data, error } = await supabase.from('clientes').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setClientes(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setCargando(false);
    }
  };

  const cargarBitacoraRango = async () => {
    try {
      const start = new Date();
      const end = new Date();

      if (filtroTiempo === 'hoy') {
        start.setHours(0,0,0,0);
        end.setHours(23,59,59,999);
      } else if (filtroTiempo === 'ayer') {
        start.setDate(start.getDate() - 1);
        start.setHours(0,0,0,0);
        end.setDate(end.getDate() - 1);
        end.setHours(23,59,59,999);
      } else if (filtroTiempo === 'semana') {
        start.setDate(start.getDate() - 7);
        start.setHours(0,0,0,0);
        end.setHours(23,59,59,999);
      } else if (filtroTiempo === 'mes') {
        start.setDate(start.getDate() - 30);
        start.setHours(0,0,0,0);
        end.setHours(23,59,59,999);
      }
      
      const { data, error } = await supabase
        .from('registro_llamadas')
        .select('*, clientes(nombres, apellidos)')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at', { ascending: false });
        
      if (!error && data) setActividadesDia(data);
    } catch (error) {
      console.error('Error cargando bitácora:', error);
    }
  };

  const registrarActividadRapida = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!llamadaClienteId) { alert("Selecciona un prospecto de la lista usando el buscador."); return; }
    
    setGuardandoActividadRapida(true);
    try {
      const payload = {
        cliente_id: llamadaClienteId,
        agente: llamadaAgente,
        tipo_contacto: tipoContacto,
        resultado: llamadaResultado,
        notas: llamadaNota
      };

      const { data, error } = await supabase.from('registro_llamadas').insert([payload]).select('*, clientes(nombres, apellidos)');
      if (error) throw error;

      if (filtroTiempo === 'hoy' && data) {
        setActividadesDia([data[0], ...actividadesDia]);
      }

      const clienteActual = clientes.find(c => c.id === llamadaClienteId);
      if (clienteActual) {
        const fechaStr = new Date().toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' });
        const icono = tipoContacto === 'WhatsApp' ? '💬' : tipoContacto === 'Email' ? '📧' : tipoContacto === 'Zoom' ? '📹' : tipoContacto === 'Reunión' ? '🤝' : '📞';
        const prefijo = `[${fechaStr}] ${icono} ${tipoContacto} (${llamadaResultado}) por ${llamadaAgente}`;
        const textoNota = llamadaNota ? `: ${llamadaNota}` : '';
        const notaSincronizada = `${prefijo}${textoNota}\n\n${clienteActual.notas || ''}`;

        const updates: any = { notas: notaSincronizada };

        if (proximaFechaRapida) {
          updates.proximo_contacto = proximaFechaRapida;
          updates.tipo_accion = proximaAccionRapida || 'Seguimiento';
        }

        await supabase.from('clientes').update(updates).eq('id', llamadaClienteId);
        
        setClientes(prev => prev.map(c => c.id === llamadaClienteId ? { ...c, ...updates } : c));
        if (clienteSeleccionado?.id === llamadaClienteId) {
          setClienteSeleccionado(prev => prev ? { ...prev, ...updates } : prev);
        }
      }
      
      setLlamadaClienteId('');
      setBusquedaLlamada('');
      setLlamadaNota('');
      setProximaFechaRapida('');
      setProximaAccionRapida('');
      
    } catch (error: any) {
      alert(`Error al registrar actividad: ${error.message}`);
    } finally {
      setGuardandoActividadRapida(false);
    }
  };

  const extraerFechaUltimaNota = (notas: string | null) => {
    if (!notas) return null;
    const match = notas.match(/\[(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const year = parseInt(match[3], 10);
      return new Date(year, month, day);
    }
    return null;
  };

  const obtenerDiasInactivos = (notas: string | null) => {
    const ultimaFecha = extraerFechaUltimaNota(notas);
    if (!ultimaFecha) return 999;
    const hoy = new Date();
    hoy.setHours(0,0,0,0);
    ultimaFecha.setHours(0,0,0,0);
    const diffTime = hoy.getTime() - ultimaFecha.getTime();
    return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  };

  const esFechaVencida = (fecha?: string | null) => {
    if (!fecha) return false;
    const hoy = new Date(); hoy.setHours(0,0,0,0);
    return new Date(fecha + 'T00:00:00') <= hoy;
  };

  const clientesFiltrados = useMemo(() => {
    return clientes.filter(c => {
      const b = busqueda.toLowerCase();
      const coincideBusqueda = !b || `${c.nombres || ''} ${c.apellidos || ''}`.toLowerCase().includes(b) || (c.telefono && c.telefono.includes(b));
      const coincideCiudad = filtroCiudad === 'Todas' || (c.ciudad_residencia && c.ciudad_residencia.toLowerCase().trim() === filtroCiudad.toLowerCase().trim());
      const coincideTipologia = filtroTipologia === 'Todas' || (c.tipologia_interes && c.tipologia_interes.toLowerCase().trim() === filtroTipologia.toLowerCase().trim());
      const coincideOrigen = filtroOrigen === 'Todos' || (c.origen_captacion && c.origen_captacion.toLowerCase().trim() === filtroOrigen.toLowerCase().trim());
      
      let coincidePendiente = true;
      if (filtroPendientes) {
        if (!c.proximo_contacto) {
          coincidePendiente = false;
        } else {
          const hoy = new Date();
          hoy.setHours(23, 59, 59, 999);
          const fechaContacto = new Date(c.proximo_contacto + 'T00:00:00');
          coincidePendiente = fechaContacto <= hoy;
        }
      }

      return coincideBusqueda && coincideCiudad && coincideTipologia && coincideOrigen && coincidePendiente;
    });
  }, [clientes, busqueda, filtroCiudad, filtroTipologia, filtroOrigen, filtroPendientes]);

  const prospectosFiltradosParaLlamada = useMemo(() => {
    if (!busquedaLlamada) return clientes.slice(0, 50);
    const b = busquedaLlamada.toLowerCase();
    return clientes.filter(c => 
      `${c.nombres} ${c.apellidos}`.toLowerCase().includes(b) || (c.telefono && c.telefono.includes(b))
    ).slice(0, 50);
  }, [clientes, busquedaLlamada]);

  const ciudadesDisponibles = useMemo(() => {
    const setCiudades = new Set<string>();
    clientes.forEach(c => { if (c.ciudad_residencia) setCiudades.add(c.ciudad_residencia.trim()); });
    return Array.from(setCiudades).sort();
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
        campana: nuevoCampana.trim() || null,
        notas: notaInicial, estado: 'Interesado', tipo: 'prospecto', temperatura: '❄️ Frío'
      };
      if (nuevoIngresadoPor.trim()) payload.ingresado_por = nuevoIngresadoPor.trim();

      const { data, error } = await supabase.from('clientes').insert([payload]).select();
      if (error) throw error;
      if (data && data.length > 0) {
        setClientes([data[0], ...clientes]);
        setMostrarModalNuevo(false);
        setNuevoNombre(''); setNuevoApellido(''); setNuevoTelefono(''); setNuevoEmail(''); setNuevaCiudad(''); setNuevoCampana('');
      }
    } catch (error: any) { alert(`Error al guardar: ${error.message}`); } finally { setGuardandoCliente(false); }
  };

  const guardarPlantilla = () => {
    localStorage.setItem('plantilla_bienvenida_arienzo', plantillaMensaje);
    localStorage.setItem('plantilla_campana_arienzo', plantillaCampana);
    localStorage.setItem('plantilla_correo_asunto', plantillaCorreoAsunto);
    localStorage.setItem('plantilla_correo_cuerpo', plantillaCorreoCuerpo);
    setMostrarModalPlantilla(false);
    alert('Mensajes y plantillas actualizadas correctamente.');
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

  // FUNCIÓN PARA ENVIAR CORREO (NUEVA)
  const abrirCorreo = (cliente: Cliente) => {
    if (!cliente.email) { alert("Este cliente no tiene correo electrónico registrado."); return; }
    const asunto = encodeURIComponent(plantillaCorreoAsunto.replace('{nombre}', cliente.nombres));
    const cuerpo = encodeURIComponent(plantillaCorreoCuerpo.replace('{nombre}', cliente.nombres));
    window.location.href = `mailto:${cliente.email}?subject=${asunto}&body=${cuerpo}`;
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

  const tituloActividad = {
    hoy: 'Actividad de Hoy',
    ayer: 'Actividad de Ayer',
    semana: 'Últimos 7 Días',
    mes: 'Últimos 30 Días'
  };

  if (cargando) return <div className="flex min-h-screen items-center justify-center bg-[#dce3eb]"><p className="text-sm font-bold tracking-widest text-[#ea0029] uppercase animate-pulse">Sincronizando Radar...</p></div>;

  return (
    <div className="min-h-screen bg-[#dce3eb] p-4 md:p-6 font-sans text-[#415364] flex flex-col h-screen overflow-hidden">
      
      {/* 1. HEADER PRINCIPAL Y VISTAS */}
      <div className="w-full flex-shrink-0 mb-4 space-y-3">
        <div className="bg-white rounded-2xl border border-neutral-200/60 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-[#ea0029] uppercase">Gestión Comercial Arienzo</span>
            <h1 className="text-2xl font-bold tracking-tight text-[#415364] mt-1">Radar de Leads</h1>
          </div>
          
          <div className="flex bg-[#dce3eb]/50 p-1.5 rounded-xl border border-[#415364]/10">
            <button onClick={() => setVista('kanban')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 ${vista === 'kanban' ? 'bg-white text-[#ea0029] shadow-sm' : 'text-[#415364]/70 hover:text-[#415364]'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"></path></svg>
              Tablero
            </button>
            <button onClick={() => setVista('lista')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 ${vista === 'lista' ? 'bg-white text-[#ea0029] shadow-sm' : 'text-[#415364]/70 hover:text-[#415364]'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
              Lista
            </button>
            <button onClick={() => setVista('actividad')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 ${vista === 'actividad' ? 'bg-[#ea0029] text-white shadow-sm' : 'text-[#415364]/70 hover:text-[#415364]'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              Actividad
            </button>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setMostrarModalPlantilla(true)} className="px-4 py-2.5 bg-white border border-[#415364]/20 text-[#415364] text-xs font-bold rounded-xl hover:bg-[#415364]/5 transition-colors flex items-center gap-2 shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              Mensajes
            </button>
            <button onClick={() => setMostrarModalNuevo(true)} className="px-5 py-2.5 bg-[#415364] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#21242E] transition-colors shadow-md flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              Prospecto
            </button>
          </div>
        </div>

        {/* 2. BARRA DE FILTROS */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200/60 shadow-sm flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[220px]">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-[#415364]/40">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </span>
            <input 
              type="text" 
              placeholder="Buscar prospecto por nombre, ciudad o teléfono..." 
              value={busqueda} 
              onChange={(e) => setBusqueda(e.target.value)} 
              className="w-full bg-[#dce3eb]/30 border border-[#415364]/10 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium focus:outline-none focus:border-[#ea0029] focus:ring-1 focus:ring-[#ea0029]/20 transition-all text-[#415364]" 
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#415364]/50 font-bold text-[10px] uppercase tracking-widest">Ciudad:</span>
            <select value={filtroCiudad} onChange={(e) => setFiltroCiudad(e.target.value)} className="bg-white border border-[#415364]/20 rounded-lg py-2 px-3 text-xs font-bold text-[#415364] outline-none focus:border-[#ea0029] cursor-pointer">
              <option value="Todas">Todas</option>
              {ciudadesDisponibles.map(ciu => <option key={ciu} value={ciu}>{ciu}</option>)}
            </select>
          </div>

          <div className="flex items-center border-l border-[#415364]/10 pl-4">
            <button 
              onClick={() => setFiltroPendientes(!filtroPendientes)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${filtroPendientes ? 'bg-[#ea0029]/10 text-[#ea0029] border-[#ea0029]/30 shadow-sm' : 'bg-white text-[#415364]/60 border-[#415364]/20 hover:bg-[#415364]/5'}`}
            >
              <svg className={`w-4 h-4 ${filtroPendientes ? 'animate-pulse' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
              {filtroPendientes ? 'Filtrando Tareas de Hoy' : 'Modo Cacería (Off)'}
            </button>
          </div>
        </div>
      </div>

      {/* ÁREA DE TRABAJO DINÁMICA */}
      <div className="w-full flex-1 min-h-0 overflow-hidden relative">
        
        {vista === 'kanban' && (
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-3 h-full overflow-y-auto pb-4 custom-scrollbar pr-1">
            {estados.map(estado => {
              const leads = clientesFiltrados.filter(c => c.estado === estado);
              return (
                <div key={estado} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, estado)} className="bg-white/50 backdrop-blur-sm rounded-2xl p-2.5 flex flex-col h-full overflow-hidden border border-[#415364]/10 shadow-sm">
                  <div className="flex justify-between items-center mb-3 px-1.5 flex-shrink-0">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#415364] truncate pr-2">{estado}</h3>
                    <span className="bg-[#415364] text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">{leads.length}</span>
                  </div>
                  <div className="space-y-3 overflow-y-auto flex-1 pr-1 custom-scrollbar">
                    {leads.map(cliente => {
                      const diasInactivos = obtenerDiasInactivos(cliente.notas);
                      const abandonado = diasInactivos > 4 && cliente.estado !== 'Descartado' && cliente.estado !== 'Cierre (Ganado)';
                      const agendadoVencido = esFechaVencida(cliente.proximo_contacto);

                      return (
                        <div 
                          key={cliente.id} 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, cliente.id)} 
                          onClick={() => setClienteSeleccionado(cliente)} 
                          className={`bg-white p-3.5 rounded-xl shadow-sm cursor-pointer transition-all relative cursor-grab border-[1.5px] group hover:shadow-md ${agendadoVencido ? 'border-[#ea0029]/60' : abandonado ? 'border-amber-400' : 'border-transparent hover:border-[#ea0029]/30'}`}
                        >
                          {cliente.temperatura && <span className="absolute top-3 right-3 text-[10px] bg-[#dce3eb]/50 rounded-full px-1.5 py-0.5">{cliente.temperatura.split(' ')[0]}</span>}
                          <h4 className="font-bold text-[#415364] text-[12px] pr-5 leading-tight group-hover:text-[#ea0029] transition-colors">{cliente.nombres} {cliente.apellidos}</h4>
                          <p className="text-[9px] text-[#415364]/60 font-mono mt-1 mb-2 font-medium">{cliente.telefono || 'Sin celular'}</p>
                          
                          {cliente.tipologia_interes && cliente.tipologia_interes !== 'Por definir' && (
                            <span className="inline-block bg-[#415364]/5 text-[#415364] border border-[#415364]/10 text-[9px] font-bold px-2 py-0.5 rounded-md mr-1 uppercase tracking-wider">
                               {cliente.tipologia_interes}
                            </span>
                          )}

                          {cliente.proximo_contacto && (
                            <div className={`mt-2 text-[9px] font-bold px-2 py-1 flex items-center gap-1.5 rounded-md border ${agendadoVencido ? 'bg-[#ea0029]/10 text-[#ea0029] border-[#ea0029]/20' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                              {new Date(cliente.proximo_contacto).toLocaleDateString('es-EC', {day:'2-digit', month:'short'})}
                            </div>
                          )}

                          <div className="mt-2.5 pt-2 border-t border-[#415364]/5 flex justify-between items-center">
                            <span className={`text-[9px] font-bold tracking-wide ${abandonado ? 'text-amber-600' : 'text-[#415364]/40'}`}>
                              {diasInactivos === 0 ? 'Actividad: Hoy' : diasInactivos === 1 ? 'Actividad: Ayer' : diasInactivos > 300 ? 'Sin registros' : `Inactivo: ${diasInactivos} días`}
                            </span>
                            {abandonado && <span className="text-[10px] animate-pulse" title="Lead enfriándose">⚠️</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {vista === 'lista' && (
          <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-sm h-full overflow-auto w-full">
            <table className="w-full text-left text-sm border-collapse min-w-[800px]">
              <thead className="sticky top-0 bg-[#21242E] z-10 shadow-sm">
                <tr className="text-white text-[10px] uppercase tracking-widest">
                  <th className="px-5 py-4 font-bold">Prospecto</th>
                  <th className="px-5 py-4 font-bold">Interés</th>
                  <th className="px-5 py-4 font-bold">Fase de Venta</th>
                  <th className="px-5 py-4 font-bold">Tarea Pendiente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-[#415364]">
                {clientesFiltrados.map((cliente) => (
                  <tr key={cliente.id} onClick={() => setClienteSeleccionado(cliente)} className="hover:bg-[#dce3eb]/30 cursor-pointer transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-[#415364] text-[13px]">{cliente.nombres} {cliente.apellidos}</div>
                      <div className="text-[10px] text-[#415364]/60 font-mono mt-0.5 font-medium">{cliente.telefono}</div>
                    </td>
                    <td className="px-5 py-4 text-xs font-bold text-[#ea0029]">{cliente.tipologia_interes}</td>
                    <td className="px-5 py-4"><div className="text-[10px] font-bold text-[#415364] bg-[#415364]/10 inline-block px-2.5 py-1 rounded-md uppercase tracking-wider">{cliente.estado}</div></td>
                    <td className="px-5 py-4">
                      {cliente.proximo_contacto ? (
                         <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${esFechaVencida(cliente.proximo_contacto) ? 'bg-[#ea0029]/10 text-[#ea0029]' : 'bg-blue-50 text-blue-700'}`}>
                           {new Date(cliente.proximo_contacto).toLocaleDateString('es-EC')}
                         </span>
                      ) : <span className="text-[10px] text-[#415364]/40 font-bold uppercase tracking-wider">Sin agendar</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* === VISTA 3: BITÁCORA MULTICANAL CON AGENDAMIENTO === */}
        {vista === 'actividad' && (
          <div className="flex flex-col h-full gap-5">
            
            <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm flex flex-col md:flex-row items-center justify-between flex-shrink-0 gap-4">
               <div>
                 <h2 className="text-lg font-bold text-[#415364] tracking-tight">Reporte de Productividad</h2>
                 <p className="text-[11px] text-[#415364]/60 mt-0.5">Analiza el rendimiento del equipo de ventas.</p>
               </div>
               
               <div className="flex bg-[#dce3eb]/50 p-1.5 rounded-xl border border-[#415364]/10">
                 <button onClick={() => setFiltroTiempo('hoy')} className={`px-4 py-2 rounded-lg text-[11px] font-bold transition-all ${filtroTiempo === 'hoy' ? 'bg-white shadow-sm text-[#ea0029]' : 'text-[#415364]/70 hover:text-[#415364]'}`}>Hoy</button>
                 <button onClick={() => setFiltroTiempo('ayer')} className={`px-4 py-2 rounded-lg text-[11px] font-bold transition-all ${filtroTiempo === 'ayer' ? 'bg-white shadow-sm text-[#ea0029]' : 'text-[#415364]/70 hover:text-[#415364]'}`}>Ayer</button>
                 <button onClick={() => setFiltroTiempo('semana')} className={`px-4 py-2 rounded-lg text-[11px] font-bold transition-all ${filtroTiempo === 'semana' ? 'bg-white shadow-sm text-[#ea0029]' : 'text-[#415364]/70 hover:text-[#415364]'}`}>7 Días</button>
                 <button onClick={() => setFiltroTiempo('mes')} className={`px-4 py-2 rounded-lg text-[11px] font-bold transition-all ${filtroTiempo === 'mes' ? 'bg-white shadow-sm text-[#ea0029]' : 'text-[#415364]/70 hover:text-[#415364]'}`}>30 Días</button>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 flex-shrink-0">
              <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm text-center transition-all hover:border-[#415364]/30 group">
                <p className="text-[10px] font-bold text-[#415364]/50 uppercase tracking-widest">Total Acciones</p>
                <p className="text-4xl font-light text-[#415364] mt-2 group-hover:scale-105 transition-transform">{actividadesDia.length}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm text-center transition-all hover:border-green-300 group">
                <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Éxito / Efectivas</p>
                <p className="text-4xl font-light text-green-600 mt-2 group-hover:scale-105 transition-transform">
                  {actividadesDia.filter(a => a.resultado === 'Contestó' || a.resultado === 'Respondio' || a.resultado === 'Efectivo').length}
                </p>
              </div>
              <div className="bg-[#21242E] p-5 rounded-2xl border border-neutral-800 shadow-sm flex flex-col justify-center space-y-2 text-white">
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest text-center border-b border-white/10 pb-1.5 mb-1.5">Impacto Por Canal</p>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-white/80">Llamadas / Zoom</span>
                  <span className="text-sm font-bold text-[#ea0029]">{actividadesDia.filter(a => a.tipo_contacto === 'Llamada' || a.tipo_contacto === 'Zoom').length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-white/80">WhatsApp / Email</span>
                  <span className="text-sm font-bold text-[#ea0029]">{actividadesDia.filter(a => a.tipo_contacto === 'WhatsApp' || a.tipo_contacto === 'Email').length}</span>
                </div>
              </div>
              <div className="bg-[#21242E] p-5 rounded-2xl border border-neutral-800 shadow-sm flex flex-col justify-center space-y-2 text-white">
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest text-center border-b border-white/10 pb-1.5 mb-1.5">Rendimiento Agente</p>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-white/80">Saúl Intriago</span>
                  <span className="text-sm font-bold text-[#dce3eb]">{actividadesDia.filter(a => a.agente.includes('Saúl')).length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-white/80">Debbi Mera</span>
                  <span className="text-sm font-bold text-[#dce3eb]">{actividadesDia.filter(a => a.agente.includes('Debbi') || a.agente.includes('Debbie') || a.agente.includes('Débora')).length}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-5 flex-1 min-h-0">
              
              <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-sm p-6 w-full md:w-[35%] flex flex-col flex-shrink-0 overflow-y-auto custom-scrollbar">
                <h3 className="text-sm font-bold text-[#415364] uppercase tracking-wider border-b border-neutral-100 pb-3 mb-5 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#ea0029]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  Registro Rápido
                </h3>
                <form onSubmit={registrarActividadRapida} className="flex-1 flex flex-col space-y-4">
                  
                  <div className="relative">
                    <label className="block text-[10px] font-bold text-[#415364]/60 uppercase mb-1.5">Buscar Cliente</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#415364]/40">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                      </span>
                      <input 
                        type="text" 
                        placeholder="Escribe nombre o teléfono..."
                        value={busquedaLlamada}
                        onChange={(e) => {
                          setBusquedaLlamada(e.target.value);
                          setMostrarOpcionesLlamada(true);
                          setLlamadaClienteId(''); 
                        }}
                        onFocus={() => setMostrarOpcionesLlamada(true)}
                        className="w-full bg-[#dce3eb]/30 border border-[#415364]/20 rounded-xl py-2.5 pl-9 pr-3 text-xs font-medium focus:outline-none focus:border-[#ea0029] text-[#415364]"
                      />
                    </div>
                    {busquedaLlamada && !llamadaClienteId && <p className="text-[9px] text-[#ea0029] mt-1.5 font-bold">⚠️ Haz clic en un prospecto abajo</p>}
                    {mostrarOpcionesLlamada && !llamadaClienteId && (
                      <ul className="absolute z-10 w-full mt-1.5 bg-white border border-neutral-200/80 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar">
                        {prospectosFiltradosParaLlamada.length > 0 ? (
                          prospectosFiltradosParaLlamada.map(c => (
                            <li 
                              key={c.id} 
                              className="p-3 text-xs hover:bg-[#dce3eb]/30 cursor-pointer border-b border-neutral-100 last:border-0 flex flex-col transition-colors"
                              onClick={() => {
                                setLlamadaClienteId(c.id);
                                setBusquedaLlamada(`${c.nombres} ${c.apellidos}`);
                                setMostrarOpcionesLlamada(false);
                              }}
                            >
                              <span className="font-bold text-[#415364]">{c.nombres} {c.apellidos}</span>
                              <span className="text-[10px] text-[#415364]/60 font-mono mt-0.5">{c.telefono}</span>
                            </li>
                          ))
                        ) : (
                          <li className="p-3 text-xs text-[#415364]/40 text-center font-medium">No encontrado</li>
                        )}
                      </ul>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-[#415364]/60 uppercase mb-1.5">Asesor</label>
                      <select value={llamadaAgente} onChange={(e) => setLlamadaAgente(e.target.value)} className="w-full bg-white border border-[#415364]/20 rounded-xl p-2.5 text-xs font-bold text-[#415364] focus:outline-none focus:border-[#ea0029]">
                        <option value="Saúl Intriago">Saúl</option>
                        <option value="Debbi Mera">Debbi</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#415364]/60 uppercase mb-1.5">Canal</label>
                      <select value={tipoContacto} onChange={(e) => setTipoContacto(e.target.value)} className="w-full bg-white border border-[#415364]/20 rounded-xl p-2.5 text-xs font-bold text-[#415364] focus:outline-none focus:border-[#ea0029]">
                        <option value="Llamada">Llamada</option>
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="Zoom">Zoom</option>
                        <option value="Email">Email</option>
                        <option value="Reunión">Presencial</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#415364]/60 uppercase mb-1.5">Resultado</label>
                    <select value={llamadaResultado} onChange={(e) => setLlamadaResultado(e.target.value)} className="w-full bg-[#dce3eb]/30 border border-[#415364]/20 rounded-xl p-2.5 text-xs font-bold text-[#415364] focus:outline-none focus:border-[#ea0029]">
                      {tipoContacto === 'Llamada' || tipoContacto === 'Zoom' ? (
                        <>
                          <option value="Contestó">✅ Contestó / Asistió</option>
                          <option value="No contestó">❌ No contestó / Faltó</option>
                          <option value="Equivocado">🚫 Número Erróneo</option>
                        </>
                      ) : tipoContacto === 'WhatsApp' ? (
                        <>
                          <option value="Respondio">✅ Respondió el chat</option>
                          <option value="Enviado">✔️ Enviado (Sin resp)</option>
                          <option value="Leido">👀 Leído (Visto)</option>
                        </>
                      ) : (
                        <>
                          <option value="Efectivo">✅ Efectivo / Realizado</option>
                          <option value="Fallido">❌ Cancelado</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#415364]/60 uppercase mb-1.5">Notas del Contacto</label>
                    <textarea rows={2} value={llamadaNota} onChange={(e) => setLlamadaNota(e.target.value)} placeholder="Ej: Le gustó la suite, pide descuento..." className="w-full bg-white border border-[#415364]/20 rounded-xl p-3 text-xs font-medium text-[#415364] focus:outline-none focus:border-[#ea0029] resize-none transition-all"></textarea>
                  </div>
                  
                  <div className="bg-[#415364]/5 border border-[#415364]/10 p-4 rounded-xl mt-2">
                    <label className="block text-[10px] font-bold text-[#415364] uppercase mb-2.5 flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      Agendar Siguiente Paso
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <input 
                        type="date" 
                        value={proximaFechaRapida} 
                        onChange={(e) => setProximaFechaRapida(e.target.value)} 
                        className="w-full bg-white border border-[#415364]/20 rounded-lg p-2 text-[11px] font-bold text-[#415364] outline-none focus:border-[#ea0029]" 
                      />
                      <select 
                        value={proximaAccionRapida} 
                        onChange={(e) => setProximaAccionRapida(e.target.value)} 
                        className="w-full bg-white border border-[#415364]/20 rounded-lg p-2 text-[11px] font-bold text-[#415364] outline-none focus:border-[#ea0029]"
                      >
                        <option value="">-- Acción --</option>
                        <option value="Llamar">Llamar</option>
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="Reunión">Reunión / Zoom</option>
                        <option value="Cotización">Cotización</option>
                      </select>
                    </div>
                  </div>

                  <button type="submit" disabled={guardandoActividadRapida || !llamadaClienteId} className={`w-full py-3.5 mt-auto text-white text-[11px] font-bold uppercase tracking-widest rounded-xl transition shadow-md ${!llamadaClienteId ? 'bg-[#415364]/30 cursor-not-allowed' : 'bg-[#ea0029] hover:bg-[#c90022]'}`}>
                    {guardandoActividadRapida ? 'Procesando...' : 'Guardar y Actualizar'}
                  </button>
                </form>
              </div>

              <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#415364] uppercase tracking-wide flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#ea0029]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                    {tituloActividad[filtroTiempo]}
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                  {actividadesDia.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6">
                      <svg className="w-12 h-12 text-[#415364]/20 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      <p className="text-[#415364]/50 text-xs font-bold uppercase tracking-wider">No hay flujo registrado<br/>para este periodo.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {actividadesDia.map((act) => (
                        <div key={act.id} className="flex gap-4 p-4 bg-white border border-[#415364]/10 rounded-xl hover:shadow-md transition-shadow group">
                          <div className="text-center pt-1 min-w-[55px]">
                            {filtroTiempo !== 'hoy' && filtroTiempo !== 'ayer' ? (
                              <>
                                <span className="block text-[10px] font-bold text-[#415364]/60 mb-0.5">{new Date(act.created_at).toLocaleDateString('es-EC', {day:'2-digit', month:'short'})}</span>
                                <span className="text-[10px] font-mono font-bold text-[#ea0029]">{new Date(act.created_at).toLocaleTimeString('es-EC', {hour: '2-digit', minute:'2-digit'})}</span>
                              </>
                            ) : (
                              <span className="text-[11px] font-mono font-bold text-[#ea0029]">{new Date(act.created_at).toLocaleTimeString('es-EC', {hour: '2-digit', minute:'2-digit'})}</span>
                            )}
                          </div>
                          <div className="flex-1 border-l border-[#415364]/10 pl-4">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className="text-sm font-bold text-[#415364]">{act.clientes?.nombres} {act.clientes?.apellidos}</span>
                              <span className="text-[12px] opacity-70 group-hover:opacity-100 transition-opacity">{act.tipo_contacto === 'WhatsApp' ? '💬' : act.tipo_contacto === 'Email' ? '📧' : act.tipo_contacto === 'Zoom' ? '📹' : act.tipo_contacto === 'Reunión' ? '🤝' : '📞'}</span>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border ${act.resultado.includes('Contestó') || act.resultado.includes('Respondio') || act.resultado.includes('Efectivo') ? 'bg-green-50 text-green-700 border-green-200' : 'bg-neutral-100 text-neutral-600 border-neutral-200'}`}>{act.resultado}</span>
                            </div>
                            <p className="text-[12px] text-[#415364]/80 leading-relaxed font-medium">{act.notas || 'Sin notas adicionales'}</p>
                            <p className="text-[9px] font-bold text-[#415364]/40 mt-2 uppercase tracking-widest">Agente: {act.agente}</p>
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

      {/* --- MODALES Y PANEL LATERAL (DRAWER PREMIUM) --- */}
      {clienteSeleccionado && (
        <div className="fixed inset-0 bg-[#21242E]/80 z-40 transition-opacity backdrop-blur-sm" onClick={() => setClienteSeleccionado(null)}></div>
      )}

      <div className={`fixed top-0 right-0 h-full w-full max-w-[400px] bg-[#F9F7F5] shadow-2xl border-l border-neutral-200 transform transition-transform duration-300 z-50 flex flex-col ${clienteSeleccionado ? 'translate-x-0' : 'translate-x-full'}`}>
        {clienteSeleccionado && (
          <>
            <div className="p-6 bg-[#21242E] relative flex-shrink-0 shadow-md">
              <button onClick={() => setClienteSeleccionado(null)} className="absolute top-4 right-4 text-white/50 hover:text-white bg-white/10 rounded-full w-8 h-8 flex items-center justify-center transition-colors">✕</button>
              <h2 className="text-xl font-bold text-white pr-8 leading-tight">
                {clienteSeleccionado.tipo === 'cliente' && <span className="text-[#D1C292] mr-1" title="Inversionista KYC">👑</span>}
                {clienteSeleccionado.nombres} {clienteSeleccionado.apellidos}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="bg-white/10 text-white border border-white/20 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">{clienteSeleccionado.origen_captacion || 'Sin origen'}</span>
                {clienteSeleccionado.ciudad_residencia && (
                  <span className="bg-[#ea0029]/20 text-[#ea0029] border border-[#ea0029]/30 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">📍 {clienteSeleccionado.ciudad_residencia}</span>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              
              {/* BOTONES DE CONTACTO DIRECTO (AHORA CON EMAIL) */}
              <div className="bg-white p-4 rounded-xl border border-neutral-200/60 shadow-sm space-y-3">
                <p className="text-[10px] font-bold text-[#415364]/60 uppercase tracking-widest border-b border-neutral-100 pb-2">Acciones de Contacto</p>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => abrirWhatsApp(clienteSeleccionado, 'bienvenida')} className="flex flex-col items-center justify-center gap-1 bg-[#25D366] hover:bg-[#1DA851] text-white py-2.5 rounded-xl transition shadow-sm border border-transparent">
                    <span className="text-[11px] font-bold uppercase tracking-wider mt-1">👋 Welcome</span>
                  </button>
                  <button onClick={() => abrirWhatsApp(clienteSeleccionado, 'campana')} className="flex flex-col items-center justify-center gap-1 bg-[#128C7E] hover:bg-[#075E54] text-white py-2.5 rounded-xl transition shadow-sm border border-transparent">
                    <span className="text-[11px] font-bold uppercase tracking-wider mt-1">📢 Campaña</span>
                  </button>
                  <button onClick={() => abrirWhatsApp(clienteSeleccionado, 'libre')} className="flex flex-col items-center justify-center gap-1 bg-white hover:bg-neutral-50 text-[#415364] py-2.5 rounded-xl transition shadow-sm border border-[#415364]/20">
                    <span className="text-[11px] font-bold uppercase tracking-wider mt-1">💬 Chat Libre</span>
                  </button>
                  {/* NUEVO BOTON EMAIL */}
                  <button onClick={() => abrirCorreo(clienteSeleccionado)} className="flex flex-col items-center justify-center gap-1 bg-[#415364] hover:bg-[#21242E] text-white py-2.5 rounded-xl transition shadow-sm border border-transparent">
                    <span className="text-[11px] font-bold uppercase tracking-wider mt-1">✉️ Enviar Correo</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-neutral-200/60 shadow-sm">
                  <label className="block text-[9px] font-bold text-[#415364]/60 uppercase tracking-widest mb-1.5">Fase Embudo</label>
                  <select value={clienteSeleccionado.estado} onChange={(e) => actualizarCampoRapido(clienteSeleccionado.id, 'estado', e.target.value)} className="w-full bg-[#dce3eb]/30 border border-[#415364]/10 rounded-lg p-2 text-[11px] font-bold text-[#415364] outline-none focus:border-[#ea0029]">
                    {estados.map(est => <option key={est} value={est}>{est}</option>)}
                  </select>
                </div>
                <div className="bg-white p-4 rounded-xl border border-neutral-200/60 shadow-sm">
                  <label className="block text-[9px] font-bold text-[#415364]/60 uppercase tracking-widest mb-1.5">Termómetro</label>
                  <select value={clienteSeleccionado.temperatura || '❄️ Frío'} onChange={(e) => actualizarCampoRapido(clienteSeleccionado.id, 'temperatura', e.target.value)} className="w-full bg-[#dce3eb]/30 border border-[#415364]/10 rounded-lg p-2 text-[11px] font-bold text-[#415364] outline-none focus:border-[#ea0029]">
                    <option value="🔥 Caliente">🔥 Caliente</option>
                    <option value="☀️ Tibio">☀️ Tibio</option>
                    <option value="❄️ Frío">❄️ Frío</option>
                  </select>
                </div>
              </div>

              {/* === PASE VIP CON OPCIÓN DE 2 HORAS === */}
              <div className="bg-white border border-[#D1C292] p-5 rounded-2xl shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#D1C292]"></div>
                <h3 className="text-[11px] font-bold text-[#21242E] flex items-center gap-2 uppercase tracking-widest mb-1">
                  <svg className="w-4 h-4 text-[#D1C292]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg>
                  Pase VIP: Inventario
                </h3>
                <p className="text-[10px] text-[#415364]/70 leading-relaxed mb-3">Autoriza el email del prospecto para ver precios y planos arquitectónicos en la web.</p>
                <div className="flex gap-2">
                  <select
                    value={tiempoVIP}
                    onChange={(e) => setTiempoVIP(Number(e.target.value))}
                    className="w-[35%] bg-[#dce3eb]/30 border border-[#415364]/20 text-[#415364] rounded-xl p-2 text-[11px] font-bold outline-none focus:border-[#ea0029]"
                  >
                    <option value={1}>1 Hora</option>
                    <option value={2}>2 Horas</option>
                    <option value={12}>12 Horas</option>
                    <option value={24}>24 Horas</option>
                    <option value={48}>48 Horas</option>
                  </select>
                  <button 
                    onClick={() => otorgarAccesoVIP(clienteSeleccionado.email)}
                    disabled={activandoVIP || !clienteSeleccionado.email}
                    className={`w-[65%] py-2.5 text-white rounded-xl text-[10px] font-bold transition-all shadow-md uppercase tracking-wider ${!clienteSeleccionado.email ? 'bg-[#415364]/30 cursor-not-allowed' : 'bg-[#21242E] hover:bg-black border border-[#D1C292]/30'}`}
                  >
                    {activandoVIP ? 'Generando...' : !clienteSeleccionado.email ? '❌ Sin Email' : 'Generar Pase'}
                  </button>
                </div>
              </div>

              <div className="bg-white border border-neutral-200/60 p-5 rounded-2xl shadow-sm space-y-3">
                <h3 className="text-[11px] font-bold text-[#ea0029] flex items-center gap-1.5 uppercase tracking-widest border-b border-neutral-100 pb-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  Agendar Siguiente Paso
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-[#415364]/60 uppercase mb-1">Fecha</label>
                    <input type="date" value={fechaAccion} onChange={(e) => setFechaAccion(e.target.value)} className="w-full bg-[#dce3eb]/30 border border-[#415364]/20 rounded-lg p-2 text-[11px] font-bold text-[#415364] outline-none focus:border-[#ea0029]" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-[#415364]/60 uppercase mb-1">Tipo de Acción</label>
                    <select value={tipoAccion} onChange={(e) => setTipoAccion(e.target.value)} className="w-full bg-[#dce3eb]/30 border border-[#415364]/20 rounded-lg p-2 text-[11px] font-bold text-[#415364] outline-none focus:border-[#ea0029]">
                      {tiposAccion.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-[#415364]/60 uppercase mb-1">Objetivo / Detalles</label>
                  <input type="text" value={detalleAccion} onChange={(e) => setDetalleAccion(e.target.value)} placeholder="Ej: Llamar para confirmar cita..." className="w-full bg-[#dce3eb]/30 border border-[#415364]/20 rounded-lg p-2 text-[11px] font-medium text-[#415364] outline-none focus:border-[#ea0029]" />
                </div>
                <div className="flex justify-end pt-1">
                  <button id="btn-guardar-tarea" onClick={guardarProximaTarea} disabled={guardandoTarea} className="px-4 py-2 bg-[#415364] text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-[#21242E] transition-colors shadow-sm">
                    {guardandoTarea ? 'Guardando...' : 'Guardar Tarea'}
                  </button>
                </div>
              </div>

              <div className="bg-white border border-neutral-200/60 p-5 rounded-2xl shadow-sm">
                <label className="block text-[11px] font-bold text-[#415364] tracking-widest mb-3 uppercase flex items-center gap-2 border-b border-neutral-100 pb-2">
                  <svg className="w-4 h-4 text-[#ea0029]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                  Log de Seguimiento
                </label>
                <div className="flex flex-col gap-3 mb-4">
                  <textarea rows={2} value={nuevaNotaTexto} onChange={(e) => setNuevaNotaTexto(e.target.value)} placeholder="Escribe aquí el resumen de tu conversación..." className="w-full bg-[#dce3eb]/30 border border-[#415364]/20 rounded-xl p-3 text-xs font-medium text-[#415364] focus:outline-none focus:border-[#ea0029] resize-none transition-colors" />
                  <button onClick={agregarNotaBitacora} disabled={!nuevaNotaTexto.trim() || guardandoNota} className="self-end px-4 py-2 bg-[#ea0029] text-white text-[10px] font-bold uppercase tracking-widest rounded-lg disabled:opacity-50 hover:bg-[#c90022] transition-colors shadow-sm">
                    {guardandoNota ? 'Registrando...' : 'Agregar Registro'}
                  </button>
                </div>
                <div className="bg-[#F9F7F5] p-4 rounded-xl border border-[#415364]/10 h-[180px] overflow-y-auto custom-scrollbar shadow-inner">
                  {clienteSeleccionado.notas ? (
                    <div className="text-[11px] text-[#415364] whitespace-pre-wrap leading-relaxed font-medium">{clienteSeleccionado.notas}</div>
                  ) : (
                    <p className="text-[11px] text-[#415364]/40 text-center italic mt-12 font-bold">Sin actividad registrada aún.</p>
                  )}
                </div>
              </div>

              <div className="pb-6">
                <button onClick={() => verHistorialCotizaciones(clienteSeleccionado)} className="w-full py-3.5 bg-white border border-[#415364]/20 text-[#415364] rounded-xl text-[11px] font-bold uppercase tracking-widest hover:border-[#ea0029] hover:text-[#ea0029] transition-colors shadow-sm flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  Ver Cotizaciones Generadas
                </button>
              </div>

            </div>
          </>
        )}
      </div>

      {mostrarModalNuevo && (
        <div className="fixed inset-0 bg-[#21242E]/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8">
            <div className="flex justify-between items-center mb-6 border-b border-neutral-100 pb-4">
              <h2 className="text-xl font-bold text-[#415364]">Registro de Prospecto</h2>
              <button onClick={() => setMostrarModalNuevo(false)} className="text-[#415364]/40 hover:text-[#ea0029] text-2xl font-bold transition-colors">&times;</button>
            </div>
            <form onSubmit={guardarNuevoCliente} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-bold text-[#415364]/60 uppercase mb-1.5">Nombres <span className="text-[#ea0029]">*</span></label>
                  <input required type="text" value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} className="w-full bg-[#dce3eb]/30 border border-[#415364]/20 rounded-xl p-2.5 text-xs text-[#415364] font-medium focus:outline-none focus:border-[#ea0029]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#415364]/60 uppercase mb-1.5">Apellidos</label>
                  <input type="text" value={nuevoApellido} onChange={e => setNuevoApellido(e.target.value)} className="w-full bg-[#dce3eb]/30 border border-[#415364]/20 rounded-xl p-2.5 text-xs text-[#415364] font-medium focus:outline-none focus:border-[#ea0029]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#415364]/60 uppercase mb-1.5">Teléfono <span className="text-[#ea0029]">*</span></label>
                  <input required type="tel" value={nuevoTelefono} onChange={e => setNuevoTelefono(e.target.value)} className="w-full bg-[#dce3eb]/30 border border-[#415364]/20 rounded-xl p-2.5 text-xs text-[#415364] font-medium focus:outline-none focus:border-[#ea0029]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#415364]/60 uppercase mb-1.5">Email</label>
                  <input type="email" value={nuevoEmail} onChange={e => setNuevoEmail(e.target.value)} className="w-full bg-[#dce3eb]/30 border border-[#415364]/20 rounded-xl p-2.5 text-xs text-[#415364] font-medium focus:outline-none focus:border-[#ea0029]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#415364]/60 uppercase mb-1.5">Ciudad Residencia</label>
                  <input type="text" value={nuevaCiudad} onChange={e => setNuevaCiudad(e.target.value)} className="w-full bg-[#dce3eb]/30 border border-[#415364]/20 rounded-xl p-2.5 text-xs text-[#415364] font-medium focus:outline-none focus:border-[#ea0029]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#415364]/60 uppercase mb-1.5">Ingresado Por (Asesor)</label>
                  <input type="text" value={nuevoIngresadoPor} onChange={e => setNuevoIngresadoPor(e.target.value)} className="w-full bg-[#415364]/5 border border-[#415364]/20 rounded-xl p-2.5 text-xs text-[#415364] font-bold focus:outline-none focus:border-[#ea0029]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#415364]/60 uppercase mb-1.5">Origen</label>
                  <select value={nuevoOrigen} onChange={e => setNuevoOrigen(e.target.value)} className="w-full bg-white border border-[#415364]/20 rounded-xl p-2.5 text-xs text-[#415364] font-bold focus:outline-none focus:border-[#ea0029]">
                    {origenes.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#415364]/60 uppercase mb-1.5">Campaña (Opcional)</label>
                  <input type="text" list="lista-campanas" value={nuevoCampana} onChange={e => setNuevoCampana(e.target.value)} className="w-full bg-white border border-[#415364]/20 rounded-xl p-2.5 text-xs text-[#415364] font-bold focus:outline-none focus:border-[#ea0029]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#415364]/60 uppercase mb-1.5">Motivo Compra</label>
                  <select value={nuevoMotivo} onChange={e => setNuevoMotivo(e.target.value)} className="w-full bg-white border border-[#415364]/20 rounded-xl p-2.5 text-xs text-[#415364] font-bold focus:outline-none focus:border-[#ea0029]">
                    {motivos.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#415364]/60 uppercase mb-1.5">Interés</label>
                  <select value={nuevoInteres} onChange={e => setNuevoInteres(e.target.value)} className="w-full bg-white border border-[#415364]/20 rounded-xl p-2.5 text-xs text-[#415364] font-bold focus:outline-none focus:border-[#ea0029]">
                    {intereses.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
              </div>
              <div className="pt-6 flex justify-end gap-4 border-t border-neutral-100">
                <button type="button" onClick={() => setMostrarModalNuevo(false)} className="px-6 py-2.5 text-xs font-bold text-[#415364] border border-[#415364]/20 rounded-xl hover:bg-[#415364]/5 transition-colors">Cancelar</button>
                <button type="submit" disabled={guardandoCliente} className="px-8 py-2.5 bg-[#ea0029] text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#c90022] transition-colors shadow-md disabled:opacity-50">Guardar Prospecto</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* === NUEVO MODAL DE PLANTILLAS (INCLUYE EMAILS) === */}
      {mostrarModalPlantilla && (
        <div className="fixed inset-0 bg-[#21242E]/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h2 className="text-xl font-bold text-[#415364] mb-1">Configuración de Plantillas y Automatización</h2>
            <p className="text-[11px] text-[#415364]/60 font-medium mb-6 pb-4 border-b border-[#415364]/10">Usa el código <strong className="text-[#ea0029] bg-[#ea0029]/10 px-1 py-0.5 rounded">{`{nombre}`}</strong> donde deba insertarse el nombre del cliente automáticamente.</p>
            
            <div className="space-y-6">
              {/* Sección WhatsApp */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#25D366] flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                  Plantillas de WhatsApp
                </h3>
                <div>
                  <label className="block text-[10px] font-bold text-[#415364]/60 mb-1.5 uppercase">Mensaje Inicial / Bienvenida</label>
                  <textarea rows={3} value={plantillaMensaje} onChange={e => setPlantillaMensaje(e.target.value)} className="w-full bg-[#dce3eb]/30 border border-[#415364]/20 rounded-xl p-3 text-xs font-medium text-[#415364] focus:outline-none focus:border-[#25D366] resize-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#415364]/60 mb-1.5 uppercase">Mensaje de Campaña (Promociones)</label>
                  <textarea rows={3} value={plantillaCampana} onChange={e => setPlantillaCampana(e.target.value)} className="w-full bg-[#dce3eb]/30 border border-[#415364]/20 rounded-xl p-3 text-xs font-medium text-[#415364] focus:outline-none focus:border-[#25D366] resize-none" />
                </div>
              </div>

              {/* Sección Correo Electrónico */}
              <div className="space-y-4 pt-4 border-t border-[#415364]/10">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#415364] flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                  Plantilla de Correo de Seguimiento
                </h3>
                <div>
                  <label className="block text-[10px] font-bold text-[#415364]/60 mb-1.5 uppercase">Asunto del Correo</label>
                  <input type="text" value={plantillaCorreoAsunto} onChange={e => setPlantillaCorreoAsunto(e.target.value)} className="w-full bg-[#dce3eb]/30 border border-[#415364]/20 rounded-xl p-3 text-xs font-bold text-[#415364] focus:outline-none focus:border-[#415364]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#415364]/60 mb-1.5 uppercase">Cuerpo del Correo</label>
                  <textarea rows={6} value={plantillaCorreoCuerpo} onChange={e => setPlantillaCorreoCuerpo(e.target.value)} className="w-full bg-[#dce3eb]/30 border border-[#415364]/20 rounded-xl p-3 text-xs font-medium text-[#415364] focus:outline-none focus:border-[#415364] resize-none" />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-4 mt-8">
              <button onClick={() => setMostrarModalPlantilla(false)} className="px-6 py-2.5 text-xs font-bold text-[#415364] border border-[#415364]/20 rounded-xl hover:bg-[#415364]/5 transition-colors">Cancelar</button>
              <button onClick={guardarPlantilla} className="px-8 py-2.5 bg-[#415364] text-white text-xs font-bold uppercase tracking-widest rounded-xl shadow-md hover:bg-[#21242E] transition-colors">Guardar Plantillas</button>
            </div>
          </div>
        </div>
      )}

      {mostrarModalHistorial && clienteSeleccionado && (
        <div className="fixed inset-0 bg-[#21242E]/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8">
            <div className="flex justify-between items-center mb-6 border-b border-neutral-100 pb-4">
              <h2 className="text-xl font-bold text-[#415364] flex items-center gap-2">
                <svg className="w-5 h-5 text-[#ea0029]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                Cotizaciones Emitidas
              </h2>
              <button onClick={() => setMostrarModalHistorial(false)} className="text-[#415364]/40 hover:text-[#ea0029] text-2xl font-bold transition-colors">&times;</button>
            </div>
            <div className="min-h-[150px] max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
              {cargandoHistorial ? (
                <p className="text-center text-xs font-bold tracking-widest uppercase text-[#415364]/40 mt-10">Buscando documentos...</p>
              ) : cotizacionesCliente.length === 0 ? (
                <p className="text-center text-xs font-bold tracking-widest uppercase text-[#415364]/40 mt-10">Sin cotizaciones generadas.</p>
              ) : (
                <div className="space-y-4">
                  {cotizacionesCliente.map((cot, i) => (
                    <div key={i} className="flex justify-between items-center bg-[#dce3eb]/30 p-4 rounded-xl border border-[#415364]/10 hover:shadow-md transition-shadow">
                      <div>
                        <p className="text-sm font-bold text-[#415364]">Unidad {cot.unidad_numero}</p>
                        <p className="text-[10px] font-bold text-[#415364]/50 mt-1">{new Date(cot.created_at).toLocaleDateString('es-EC')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-bold text-[#415364]/40 uppercase tracking-wider mb-0.5">Precio de Cierre</p>
                        <p className="text-base font-mono font-bold text-[#ea0029]">${cot.precio_total.toLocaleString('en-US')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <datalist id="lista-campanas">
        {campanasDisponibles.map(c => <option key={c} value={c} />)}
      </datalist>

    </div>
  );
}