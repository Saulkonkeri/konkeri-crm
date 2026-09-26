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

const PLANTILLAS_CORREO = [
  {
    id: 'seguimiento_premium',
    nombre: '🌟 Presentación y Venta en Planos',
    asunto: 'Oportunidad de Inversión - Arienzo Boutique Living',
    cuerpo: 'Estimado(a) {nombre},\n\nQuiero contarte acerca de Arienzo Boutique Living. Sé que estás interesado en el proyecto y no queremos que te quedes fuera de este increíble desarrollo con la mejor ubicación.\n\nA continuación, te detallo las razones por las que Arienzo es la mejor decisión inmobiliaria de la ciudad.',
    layout: 'full'
  },
  {
    id: 'invitacion_zoom',
    nombre: '🤝 Invitación a Reunión / Videollamada Zoom',
    asunto: 'Invitación Exclusiva: Conoce Arienzo Boutique Living',
    cuerpo: 'Hola {nombre},\n\nMe encantaría presentarte en detalle el estilo de vida y las amenidades que ofrece Arienzo Boutique Living.\n\nContamos con un diseño enfocado en el confort, con un Social Living y Gym Panorámico espectaculares. Me gustaría agendar una breve videollamada por Zoom para mostrarte los planos y la disponibilidad de unidades antes de que se agoten.',
    layout: 'simple'
  },
  {
    id: 'urgencia_reserva',
    nombre: '⏰ Urgencia y Cierre (Últimas Unidades)',
    asunto: 'Últimos días de precios de lanzamiento en Arienzo',
    cuerpo: 'Hola {nombre},\n\nTe escribo para avisarte que estamos cerrando la etapa de precios de lanzamiento.\n\nEl proyecto ha tenido una excelente acogida y las unidades se están moviendo muy rápido. Si estás buscando asegurar tu inversión con la máxima rentabilidad y plusvalía, este es el momento exacto para bloquear tu unidad con solo $2,500 antes del incremento de precios.',
    layout: 'simple'
  }
];

const IMAGENES_GALERIA = {
  fachada: "https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/render-Exterior-Fronta.jpg",
  ubicacion: "https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/ubicacion-arienzo-1.jpg",
  living: "https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/render-living-arienzo.jpg",
  piscina: "https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/Arienzo-Piscina-1.jpg"
};

export default function CRMPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  
  const [filtroCiudad, setFiltroCiudad] = useState('Todas');
  const [filtroTipologia, setFiltroTipologia] = useState('Todas');
  const [filtroOrigen, setFiltroOrigen] = useState('Todos');
  const [filtroPendientes, setFiltroPendientes] = useState(false);

  const [vista, setVista] = useState<'lista' | 'kanban' | 'actividad'>('kanban');
  const [columnasExpandidas, setColumnasExpandidas] = useState<Record<string, boolean>>({
    'Interesado': true, 'Contactado': true, 'Cotizado': false, 'En Negociación': false, 'Reserva': false, 'Cierre (Ganado)': false, 'Descartado': false
  });

  const toggleColumna = (estado: string) => {
    setColumnasExpandidas(prev => ({ ...prev, [estado]: !prev[estado] }));
  };

  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false);
  const [mostrarModalPlantilla, setMostrarModalPlantilla] = useState(false);
  const [mostrarModalHistorial, setMostrarModalHistorial] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);

  // ESTADOS DEL ESTUDIO DE DISEÑO DE CORREO
  const [mostrarModalPreviewCorreo, setMostrarModalPreviewCorreo] = useState(false);
  const [plantillaActivaId, setPlantillaActivaId] = useState('seguimiento_premium');
  const [imagenPortada, setImagenPortada] = useState<'fachada'|'ubicacion'|'living'|'piscina'>('fachada');
  const [temaColor, setTemaColor] = useState<'terracota'|'dorado'|'navy'>('terracota');
  
  const [incluirFirma, setIncluirFirma] = useState(true);
  const [nombreRemitente, setNombreRemitente] = useState('Saúl Intriago');
  const [cargoRemitente, setCargoRemitente] = useState('Director Comercial');

  const [textoIntroPersonalizado, setTextoIntroPersonalizado] = useState('');
  const [textoUbicacion, setTextoUbicacion] = useState('En el corazón de Barbasquillo, Manta. A pasos de La Quadra y Riocentro Plaza. La zona de mayor prestigio y conectividad de la ciudad[cite: 1].');
  const [textoArquitectura, setTextoArquitectura] = useState('Desarrollado por el reconocido estudio Diez + Muller[cite: 1]. Una colección limitada de solo 22 departamentos con ventanales de piso a techo y acabados premium.');
  const [textoAmenidades, setTextoAmenidades] = useState('Disfruta de un Social Living con Coworking, Gym Panorámico y una espectacular piscina concebida para elevar tu experiencia diaria.');
  
  const [enviandoCorreoCRM, setEnviandoCorreoCRM] = useState(false);

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

  const [plantillaMensaje, setPlantillaMensaje] = useState("Hola {nombre}, le saluda Saúl Intriago de Arienzo Boutique Living. Recibí su solicitud de información y le comparto el brochure del proyecto. ¿A qué hora le viene bien que conversemos unos minutos?");
  const [plantillaCampana, setPlantillaCampana] = useState("Hola {nombre}, le escribo de Arienzo Boutique Living. Hoy lanzamos un beneficio especial para elegir las mejores unidades. ¿Le gustaría que le envíe el inventario actualizado?");

  const [activandoVIP, setActivandoVIP] = useState(false);
  const [tiempoVIP, setTiempoVIP] = useState<number>(24);

  const estados = ['Interesado', 'Contactado', 'Cotizado', 'En Negociación', 'Reserva', 'Cierre (Ganado)', 'Descartado'];
  const origenes = ['Página Web / Landing Page', 'Referido / Directo', 'Llamada Telefónica', 'WhatsApp Orgánico', 'Instagram / Facebook', 'Meta Ads', 'Feria / Evento', 'Otro'];
  const motivos = ['Por definir', 'Para Vivir', 'Para Invertir', 'Segunda Residencia'];
  const intereses = ['Por definir', 'Suite', '2 Dormitorios', '3 Dormitorios', 'Local Comercial', 'Penthouse'];
  const tiposAccion = ['Llamada Telefónica', 'Reunión Presencial', 'Mensaje WhatsApp', 'Enviar Cotización', 'Enviar Correo'];

  useEffect(() => {
    cargarClientes();
    const pG = localStorage.getItem('plantilla_bienvenida_arienzo');
    const cG = localStorage.getItem('plantilla_campana_arienzo');
    if (pG) setPlantillaMensaje(pG);
    if (cG) setPlantillaCampana(cG);
  }, []);

  useEffect(() => { cargarBitacoraRango(); }, [filtroTiempo]);

  useEffect(() => {
    if (clienteSeleccionado) {
      setFechaAccion(clienteSeleccionado.proximo_contacto || '');
      setTipoAccion(clienteSeleccionado.tipo_accion || 'Llamada Telefónica');
      setDetalleAccion(clienteSeleccionado.detalle_accion || '');
      setNuevaNotaTexto('');
    }
  }, [clienteSeleccionado]);

  useEffect(() => {
    const p = PLANTILLAS_CORREO.find(x => x.id === plantillaActivaId);
    if (p) setTextoIntroPersonalizado(p.cuerpo);
  }, [plantillaActivaId]);

  const otorgarAccesoVIP = async (emailCliente?: string) => {
    if (!emailCliente) { alert("El prospecto no tiene un correo electrónico registrado."); return; }
    setActivandoVIP(true);
    try {
      const fechaExpiracion = new Date();
      fechaExpiracion.setHours(fechaExpiracion.getHours() + tiempoVIP); 
      const { error } = await supabase.from('accesos_inventario').upsert({ email: emailCliente.toLowerCase().trim(), expira_en: fechaExpiracion.toISOString() });
      if (error) throw error;
      alert(`¡Acceso VIP otorgado por ${tiempoVIP} horas!`);
    } catch (e: any) { alert(`Error al generar el pase: ${e.message}`); } finally { setActivandoVIP(false); }
  };

  const cargarClientes = async () => {
    try {
      const { data, error } = await supabase.from('clientes').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setClientes(data);
    } catch (e) { console.error(e); } finally { setCargando(false); }
  };

  const cargarBitacoraRango = async () => {
    try {
      const start = new Date(); const end = new Date();
      if (filtroTiempo === 'hoy') { start.setHours(0,0,0,0); end.setHours(23,59,59,999); }
      else if (filtroTiempo === 'ayer') { start.setDate(start.getDate() - 1); start.setHours(0,0,0,0); end.setDate(end.getDate() - 1); end.setHours(23,59,59,999); }
      else if (filtroTiempo === 'semana') { start.setDate(start.getDate() - 7); start.setHours(0,0,0,0); end.setHours(23,59,59,999); }
      else if (filtroTiempo === 'mes') { start.setDate(start.getDate() - 30); start.setHours(0,0,0,0); end.setHours(23,59,59,999); }
      
      const { data, error } = await supabase.from('registro_llamadas').select('*, clientes(nombres, apellidos)').gte('created_at', start.toISOString()).lte('created_at', end.toISOString()).order('created_at', { ascending: false });
      if (!error && data) setActividadesDia(data);
    } catch (e) { console.error(e); }
  };

  const registrarActividadRapida = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!llamadaClienteId) { alert("Selecciona un prospecto."); return; }
    setGuardandoActividadRapida(true);
    try {
      const payload = { cliente_id: llamadaClienteId, agente: llamadaAgente, tipo_contacto: tipoContacto, resultado: llamadaResultado, notas: llamadaNota };
      const { data, error } = await supabase.from('registro_llamadas').insert([payload]).select('*, clientes(nombres, apellidos)');
      if (error) throw error;
      if (filtroTiempo === 'hoy' && data) setActividadesDia([data[0], ...actividadesDia]);
      setLlamadaClienteId(''); setBusquedaLlamada(''); setLlamadaNota('');
    } catch (e: any) { alert(`Error: ${e.message}`); } finally { setGuardandoActividadRapida(false); }
  };

  const extraerFechaUltimaNota = (notas: string | null) => {
    if (!notas) return null;
    const match = notas.match(/\[(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (match) return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
    return null;
  };

  const obtenerDiasInactivos = (notas: string | null) => {
    const ultima = extraerFechaUltimaNota(notas);
    if (!ultima) return 999;
    const hoy = new Date(); hoy.setHours(0,0,0,0); ultima.setHours(0,0,0,0);
    return Math.max(0, Math.floor((hoy.getTime() - ultima.getTime()) / (1000 * 60 * 60 * 24)));
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
        if (!c.proximo_contacto) coincidePendiente = false;
        else {
          const hoy = new Date(); hoy.setHours(23, 59, 59, 999);
          coincidePendiente = new Date(c.proximo_contacto + 'T00:00:00') <= hoy;
        }
      }
      return coincideBusqueda && coincideCiudad && coincideTipologia && coincideOrigen && coincidePendiente;
    });
  }, [clientes, busqueda, filtroCiudad, filtroTipologia, filtroOrigen, filtroPendientes]);

  const prospectosFiltradosParaLlamada = useMemo(() => {
    if (!busquedaLlamada) return clientes.slice(0, 50);
    const b = busquedaLlamada.toLowerCase();
    return clientes.filter(c => `${c.nombres} ${c.apellidos}`.toLowerCase().includes(b) || (c.telefono && c.telefono.includes(b))).slice(0, 50);
  }, [clientes, busquedaLlamada]);

  const ciudadesDisponibles = useMemo(() => {
    const s = new Set<string>(); clientes.forEach(c => { if (c.ciudad_residencia) s.add(c.ciudad_residencia.trim()); });
    return Array.from(s).sort();
  }, [clientes]);

  const campanasDisponibles = useMemo(() => {
    const s = new Set<string>(); clientes.forEach(c => { if (c.campana) s.add(c.campana.trim()); });
    return Array.from(s).sort();
  }, [clientes]);

  const handleDragStart = (e: React.DragEvent, id: string) => { e.dataTransfer.setData('clienteId', id); };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };

  const handleDrop = async (e: React.DragEvent, nuevoEstado: string) => {
    e.preventDefault();
    const clienteId = e.dataTransfer.getData('clienteId');
    if (!clienteId) return;
    setClientes(prev => prev.map(c => c.id === clienteId ? { ...c, estado: nuevoEstado } : c));
    if (clienteSeleccionado?.id === clienteId) setClienteSeleccionado(prev => prev ? { ...prev, estado: nuevoEstado } : prev);
    await supabase.from('clientes').update({ estado: nuevoEstado }).eq('id', clienteId);
  };

  const guardarNuevoCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardandoCliente(true);
    try {
      const notaInicial = `[${new Date().toLocaleDateString('es-EC')}] Ingresado por ${nuevoIngresadoPor}.`;
      const payload: any = {
        nombres: nuevoNombre.trim(), apellidos: nuevoApellido.trim(), telefono: nuevoTelefono.trim(),
        email: nuevoEmail ? nuevoEmail.trim().toLowerCase() : null, ciudad_residencia: nuevaCiudad.trim() || null, 
        motivo_compra: nuevoMotivo, tipologia_interes: nuevoInteres, origen_captacion: nuevoOrigen, campana: nuevoCampana.trim() || null,
        notas: notaInicial, estado: 'Interesado', tipo: 'prospecto', temperatura: '❄️ Frío', ingresado_por: nuevoIngresadoPor.trim()
      };
      const { data, error } = await supabase.from('clientes').insert([payload]).select();
      if (error) throw error;
      if (data && data.length > 0) {
        setClientes([data[0], ...clientes]);
        setMostrarModalNuevo(false);
        setNuevoNombre(''); setNuevoApellido(''); setNuevoTelefono(''); setNuevoEmail(''); setNuevaCiudad(''); setNuevoCampana('');
      }
    } catch (e: any) { alert(`Error: ${e.message}`); } finally { setGuardandoCliente(false); }
  };

  const guardarPlantilla = () => {
    localStorage.setItem('plantilla_bienvenida_arienzo', plantillaMensaje);
    localStorage.setItem('plantilla_campana_arienzo', plantillaCampana);
    setMostrarModalPlantilla(false); alert('Mensajes guardados.');
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
      await supabase.from('clientes').update(updates).eq('id', clienteSeleccionado.id);
      setClientes(prev => prev.map(c => c.id === clienteSeleccionado.id ? { ...c, ...updates } as any : c));
      setClienteSeleccionado(prev => prev ? { ...prev, ...updates } : prev);
    } catch (e: any) { alert(`Error: ${e.message}`); } finally { setGuardandoTarea(false); }
  };

  const agregarNotaBitacora = async () => {
    if (!clienteSeleccionado || !nuevaNotaTexto.trim()) return;
    setGuardandoNota(true);
    try {
      const fecha = new Date().toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' });
      const notaFinal = `[${fecha}] ${nuevaNotaTexto}\n\n${clienteSeleccionado.notas || ''}`;
      await supabase.from('clientes').update({ notas: notaFinal }).eq('id', clienteSeleccionado.id);
      setClientes(prev => prev.map(c => c.id === clienteSeleccionado.id ? { ...c, notas: notaFinal } : c));
      setClienteSeleccionado(prev => prev ? { ...prev, notas: notaFinal } : prev);
      setNuevaNotaTexto('');
    } catch (e: any) { alert(`Error: ${e.message}`); } finally { setGuardandoNota(false); }
  };

  const abrirWhatsApp = (cliente: Cliente, tipoMensaje: 'bienvenida' | 'campana' | 'libre') => {
    if (!cliente.telefono) { alert("Sin número."); return; }
    let num = cliente.telefono.replace(/\D/g, '');
    if (num.startsWith('09') && num.length === 10) num = '593' + num.substring(1);
    let txt = '';
    if (tipoMensaje === 'bienvenida') txt = `?text=${encodeURIComponent(plantillaMensaje.replace('{nombre}', cliente.nombres))}`;
    else if (tipoMensaje === 'campana') txt = `?text=${encodeURIComponent(plantillaCampana.replace('{nombre}', cliente.nombres))}`;
    window.open(`https://wa.me/${num}${txt}`, '_blank');
  };

  const abrirCorreo = (cliente: Cliente) => {
    if (!cliente.email) { alert("Este cliente no tiene correo electrónico registrado."); return; }
    setPlantillaActivaId(PLANTILLAS_CORREO[0].id);
    setImagenPortada('fachada');
    setTemaColor('terracota');
    setIncluirFirma(true);
    setMostrarModalPreviewCorreo(true);
  };

  // ==========================================
  // GENERADOR HTML COMPLETO Y SEGURO (CON CONFIRMACIÓN DE ENVÍO)
  // ==========================================
  const generarCodigoHTMLCorreo = () => {
    const plantillaConfig = PLANTILLAS_CORREO.find(p => p.id === plantillaActivaId) || PLANTILLAS_CORREO[0];
    const nombreCliente = clienteSeleccionado?.nombres || 'Cliente';
    const cuerpoFormateado = textoIntroPersonalizado.replace(/{nombre}/g, nombreCliente).replace(/\n/g, '<br/>');
    const urlPortada = IMAGENES_GALERIA[imagenPortada] || IMAGENES_GALERIA.fachada;
    
    const enlaceWhatsApp = `https://wa.me/593979469472?text=${encodeURIComponent(`Hola Saúl, recibí tu correo sobre Arienzo y me gustaría más información.`)}`;
    const enlaceCalendly = `https://calendly.com/saul-intriago/asesoria-inmobiliaria`;

    let colorFondoCabecera = '#21242E';
    let colorAcento = '#D1C292'; 
    let colorBoton = '#964B36'; 
    let colorTextoBoton = '#ffffff';

    if (temaColor === 'terracota') { colorFondoCabecera = '#964B36'; colorAcento = '#964B36'; colorBoton = '#21242E'; } 
    else if (temaColor === 'dorado') { colorFondoCabecera = '#21242E'; colorAcento = '#D1C292'; colorBoton = '#D1C292'; colorTextoBoton = '#21242E'; } 
    else if (temaColor === 'navy') { colorFondoCabecera = '#21242E'; colorAcento = '#21242E'; colorBoton = '#964B36'; }

    const htmlCabecera = `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 0; background-color: #F9F7F5; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F9F7F5; padding: 20px 10px;">
          <tr>
            <td align="center">
              <table width="100%" max-width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1); width: 100%; max-width: 600px;">
                <tr><td align="center" style="background-color: ${colorFondoCabecera}; padding: 35px 20px;"><img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/arienzo-logo-blanco.svg" alt="Arienzo" width="180" style="display: block; margin: 0 auto;"></td></tr>
                <tr><td><img src="${urlPortada}" width="100%" style="display: block; width: 100%; max-height: 280px; object-fit: cover;"></td></tr>
                <tr><td style="padding: 40px; color: #415364; font-size: 16px; line-height: 1.6;">${cuerpoFormateado}</td></tr>
    `;

    const htmlPilares = `
                <tr><td align="center" style="padding: 0 40px;"><hr style="border: none; border-top: 1px solid ${colorAcento}; margin: 0;"><h3 style="color: ${colorAcento}; font-size: 15px; text-transform: uppercase; letter-spacing: 2px; margin-top: 25px;">El privilegio de vivir bien</h3></td></tr>
                <tr><td style="padding: 20px 40px;"><img src="${IMAGENES_GALERIA.ubicacion}" width="100%" style="border-radius: 8px; display: block; margin-bottom: 15px;"><h4 style="margin: 0 0 10px 0; color: #21242E; font-size: 18px;">Ubicación Estratégica</h4><p style="margin: 0; color: #415364; font-size: 15px; line-height: 1.5;">${textoUbicacion}</p></td></tr>
                <tr><td style="padding: 20px 40px;"><img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/render-Exterior-Derecho-A4.jpg" width="100%" style="border-radius: 8px; display: block; margin-bottom: 15px;"><h4 style="margin: 0 0 10px 0; color: #21242E; font-size: 18px;">Arquitectura de Autor</h4><p style="margin: 0; color: #415364; font-size: 15px; line-height: 1.5;">${textoArquitectura}</p></td></tr>
                <tr><td style="padding: 20px 40px 40px 40px;"><img src="${IMAGENES_GALERIA.piscina}" width="100%" style="border-radius: 8px; display: block; margin-bottom: 15px;"><h4 style="margin: 0 0 10px 0; color: #21242E; font-size: 18px;">Rooftop y Amenidades Exclusivas</h4><p style="margin: 0; color: #415364; font-size: 15px; line-height: 1.5;">${textoAmenidades}</p></td></tr>
    `;

    const htmlBotonWhatsApp = `<tr><td align="center" style="background-color: #FDFCFB; padding: 40px 20px; border-top: 1px solid #EAE3DC; border-bottom: 1px solid #EAE3DC;"><h2 style="margin: 0 0 15px 0; color: ${colorAcento}; font-size: 24px;">Asegura tu unidad en Planos</h2><p style="margin: 0 0 25px 0; color: #415364; font-size: 16px; font-weight: bold;">Reservas abiertas con solo $2,500 USD</p><a href="${enlaceWhatsApp}" style="background-color: #25D366; color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 30px; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; display: inline-block;">Hablar por WhatsApp</a></td></tr>`;
    const htmlBotonZoom = `<tr><td align="center" style="background-color: #FDFCFB; padding: 40px 20px; border-top: 1px solid #EAE3DC; border-bottom: 1px solid #EAE3DC;"><h2 style="margin: 0 0 15px 0; color: #21242E; font-size: 22px;">Conoce los planos y disponibilidad</h2><p style="margin: 0 0 25px 0; color: #415364; font-size: 15px;">Selecciona la fecha y hora que mejor se adapte a tu agenda.</p><a href="${enlaceCalendly}" style="background-color: ${colorBoton}; color: ${colorTextoBoton}; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; display: inline-block;">🗓️ Agendar Videollamada</a></td></tr>`;
    
    const htmlFirma = incluirFirma ? `
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0; font-size: 15px; font-weight: bold; color: #21242E;">${nombreRemitente}</p>
                    <p style="margin: 3px 0 0 0; font-size: 12px; color: ${colorAcento}; letter-spacing: 1px; text-transform: uppercase; font-weight: bold;">${cargoRemitente}</p>
                    <p style="margin: 3px 0 0 0; font-size: 12px; color: #415364;">arienzoliving.com | Konkeri Real Estate</p>
                  </td>
                </tr>
    ` : `
                <tr>
                  <td style="padding: 30px 40px; text-align: center;">
                    <p style="margin: 0; font-size: 13px; font-weight: bold; color: #21242E; text-transform: uppercase; letter-spacing: 2px;">Arienzo Boutique Living</p>
                    <p style="margin: 4px 0 0 0; font-size: 11px; color: ${colorAcento};">arienzoliving.com</p>
                  </td>
                </tr>
    `;

    const htmlFooter = `
                <tr><td align="center" style="background-color: #21242E; padding: 20px; text-align: center;"><p style="margin: 0; font-size: 10px; color: #ffffff; opacity: 0.5; text-transform: uppercase; letter-spacing: 1px;">© ${new Date().getFullYear()} Arienzo Boutique Living. Manta, Ecuador.</p></td></tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    let htmlCompleto = '';
    if (plantillaConfig.layout === 'full') {
      htmlCompleto = htmlCabecera + htmlPilares + htmlBotonWhatsApp + htmlFirma + htmlFooter;
    } else if (plantillaActivaId === 'invitacion_zoom') {
      htmlCompleto = htmlCabecera + htmlBotonZoom + htmlFirma + htmlFooter;
    } else {
      htmlCompleto = htmlCabecera + htmlBotonWhatsApp + htmlFirma + htmlFooter;
    }

    return htmlCompleto;
  };

  const enviarCorreoFinal = async () => {
    if (!clienteSeleccionado) return;
    
    // CAJITA DE CONFIRMACIÓN ANTES DE ENVIAR
    const confirmarEnvio = window.confirm(`¿Estás seguro de que deseas enviar este correo a ${clienteSeleccionado.email}?`);
    if (!confirmarEnvio) return;

    setEnviandoCorreoCRM(true);
    try {
      const htmlAEnviar = generarCodigoHTMLCorreo();
      const asunto = PLANTILLAS_CORREO.find(p => p.id === plantillaActivaId)?.asunto || 'Arienzo Boutique Living';
      
      const response = await fetch('/api/enviar-correo-crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: clienteSeleccionado.email, asunto, htmlCuerpo: htmlAEnviar })
      });

      if (response.ok) {
        alert("¡Correo enviado con éxito!");
        setMostrarModalPreviewCorreo(false);
        const fecha = new Date().toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' });
        const notaFinal = `[${fecha}] 📧 Correo Enviado Exitosamente (${incluirFirma ? `Firma: ${nombreRemitente}` : 'Masivo'})\n\n${clienteSeleccionado.notas || ''}`;
        await supabase.from('clientes').update({ notas: notaFinal }).eq('id', clienteSeleccionado.id);
        setClientes(prev => prev.map(c => c.id === clienteSeleccionado.id ? { ...c, notas: notaFinal } : c));
      } else {
        alert("Error al enviar desde el servidor.");
      }
    } catch (e) {
      alert("Error de conexión.");
    } finally {
      setEnviandoCorreoCRM(false);
    }
  };

  const tituloActividad = { hoy: 'Actividad de Hoy', ayer: 'Actividad de Ayer', semana: 'Últimos 7 Días', mes: 'Últimos 30 Días' };

  if (cargando) return <div className="flex min-h-screen items-center justify-center bg-[#dce3eb]"><p className="text-sm font-bold tracking-widest text-[#ea0029] uppercase animate-pulse">Sincronizando CRM...</p></div>;

  return (
    <div className="min-h-screen bg-[#dce3eb] p-4 md:p-6 font-sans text-[#415364] flex flex-col h-screen overflow-hidden">
      
      {/* 1. HEADER PRINCIPAL Y VISTAS */}
      <div className="w-full flex-shrink-0 mb-4 space-y-3">
        <div className="bg-white rounded-2xl border border-neutral-200/60 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-[#ea0029] uppercase">Gestión Comercial Arienzo</span>
            <h1 className="text-2xl font-bold tracking-tight text-[#415364] mt-1">CRM / Pipeline</h1>
          </div>
          
          <div className="flex bg-[#dce3eb]/50 p-1.5 rounded-xl border border-[#415364]/10 overflow-x-auto custom-scrollbar w-full md:w-auto">
            <button onClick={() => setVista('kanban')} className={`flex-1 md:flex-auto px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${vista === 'kanban' ? 'bg-white text-[#ea0029] shadow-sm' : 'text-[#415364]/70 hover:text-[#415364]'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"></path></svg>
              Tablero
            </button>
            <button onClick={() => setVista('lista')} className={`flex-1 md:flex-auto px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${vista === 'lista' ? 'bg-white text-[#ea0029] shadow-sm' : 'text-[#415364]/70 hover:text-[#415364]'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
              Lista
            </button>
            <button onClick={() => setVista('actividad')} className={`flex-1 md:flex-auto px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${vista === 'actividad' ? 'bg-[#ea0029] text-white shadow-sm' : 'text-[#415364]/70 hover:text-[#415364]'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              Actividad
            </button>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setMostrarModalPlantilla(true)} className="px-4 py-2.5 bg-white border border-[#415364]/20 text-[#415364] text-xs font-bold rounded-xl hover:bg-[#415364]/5 transition-colors flex items-center gap-2 shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              Mensajes Rápidos
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
          <div className="flex flex-col md:flex-row md:overflow-x-auto md:snap-x gap-3 md:gap-4 h-full pb-4 custom-scrollbar px-1 items-start overflow-y-auto md:overflow-y-hidden">
            {estados.map(estado => {
              const leads = clientesFiltrados.filter(c => c.estado === estado);
              const estaExpandida = columnasExpandidas[estado];

              return (
                <div key={estado} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, estado)} 
                     className={`w-full md:w-[280px] lg:w-[22vw] xl:w-[280px] flex-shrink-0 md:snap-center bg-white/50 backdrop-blur-sm rounded-2xl p-3 flex flex-col overflow-hidden border border-[#415364]/10 shadow-sm transition-all duration-300 ${estaExpandida ? 'max-h-[60vh] md:max-h-full md:h-full' : 'h-auto md:h-full'}`}>
                  
                  <div 
                    onClick={() => toggleColumna(estado)}
                    className="flex justify-between items-center px-1.5 flex-shrink-0 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2">
                      <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#415364] truncate pr-2">{estado}</h3>
                      <span className="bg-[#415364] text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">{leads.length}</span>
                    </div>
                    <div className="md:hidden text-[#415364]/50 bg-white p-1 rounded-md shadow-sm border border-[#415364]/10">
                      <svg className={`w-4 h-4 transition-transform duration-300 ${estaExpandida ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                  
                  <div className={`space-y-3 overflow-y-auto flex-1 pr-1 custom-scrollbar transition-all duration-300 ${estaExpandida ? 'mt-3 opacity-100 block' : 'hidden opacity-0 md:block md:mt-3 md:opacity-100'}`}>
                    {leads.map(cliente => {
                      const diasInactivos = obtenerDiasInactivos(cliente.notas);
                      const abandonado = diasInactivos > 4 && cliente.estado !== 'Descartado' && cliente.estado !== 'Cierre (Ganado)';
                      const agendadoVencido = esFechaVencida(cliente.proximo_contacto);

                      return (
                        <div 
                          key={cliente.id} draggable onDragStart={(e) => handleDragStart(e, cliente.id)} onClick={() => setClienteSeleccionado(cliente)} 
                          className={`bg-white p-3.5 rounded-xl shadow-sm cursor-pointer transition-all relative cursor-grab border-[1.5px] group hover:shadow-md ${agendadoVencido ? 'border-[#ea0029]/60' : abandonado ? 'border-amber-400' : 'border-transparent hover:border-[#ea0029]/30'}`}
                        >
                          {cliente.temperatura && <span className="absolute top-3 right-3 text-[10px] bg-[#dce3eb]/50 rounded-full px-1.5 py-0.5">{cliente.temperatura.split(' ')[0]}</span>}
                          <h4 className="font-bold text-[#415364] text-[12px] pr-5 leading-tight group-hover:text-[#ea0029] transition-colors">{cliente.nombres} {cliente.apellidos}</h4>
                          <p className="text-[9px] text-[#415364]/60 font-mono mt-1 mb-2 font-medium">{cliente.telefono || 'Sin celular'}</p>
                          
                          {cliente.tipologia_interes && cliente.tipologia_interes !== 'Por definir' && (
                            <span className="inline-block bg-[#415364]/5 text-[#415364] border border-[#415364]/10 text-[9px] font-bold px-2 py-0.5 rounded-md mr-1 uppercase tracking-wider">{cliente.tipologia_interes}</span>
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

        {vista === 'actividad' && (
          <div className="flex flex-col h-full gap-5 overflow-y-auto">
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
                <p className="text-4xl font-light text-green-600 mt-2 group-hover:scale-105 transition-transform">{actividadesDia.filter(a => a.resultado === 'Contestó' || a.resultado === 'Respondio' || a.resultado === 'Efectivo').length}</p>
              </div>
              <div className="bg-[#21242E] p-5 rounded-2xl border border-neutral-800 shadow-sm flex flex-col justify-center space-y-2 text-white">
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest text-center border-b border-white/10 pb-1.5 mb-1.5">Impacto Por Canal</p>
                <div className="flex justify-between items-center"><span className="text-[11px] font-bold text-white/80">Llamadas / Zoom</span><span className="text-sm font-bold text-[#ea0029]">{actividadesDia.filter(a => a.tipo_contacto === 'Llamada' || a.tipo_contacto === 'Zoom').length}</span></div>
                <div className="flex justify-between items-center"><span className="text-[11px] font-bold text-white/80">WhatsApp / Email</span><span className="text-sm font-bold text-[#ea0029]">{actividadesDia.filter(a => a.tipo_contacto === 'WhatsApp' || a.tipo_contacto === 'Email').length}</span></div>
              </div>
              <div className="bg-[#21242E] p-5 rounded-2xl border border-neutral-800 shadow-sm flex flex-col justify-center space-y-2 text-white">
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest text-center border-b border-white/10 pb-1.5 mb-1.5">Rendimiento Agente</p>
                <div className="flex justify-between items-center"><span className="text-[11px] font-bold text-white/80">Saúl Intriago</span><span className="text-sm font-bold text-[#dce3eb]">{actividadesDia.filter(a => a.agente.includes('Saúl')).length}</span></div>
                <div className="flex justify-between items-center"><span className="text-[11px] font-bold text-white/80">Debbi Mera</span><span className="text-sm font-bold text-[#dce3eb]">{actividadesDia.filter(a => a.agente.includes('Debbi') || a.agente.includes('Debbie') || a.agente.includes('Débora')).length}</span></div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-5 flex-1 min-h-0">
              <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-sm p-6 w-full md:w-[35%] flex flex-col flex-shrink-0 overflow-y-auto custom-scrollbar">
                <h3 className="text-sm font-bold text-[#415364] uppercase tracking-wider border-b border-neutral-100 pb-3 mb-5 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#ea0029]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg> Registro Rápido
                </h3>
                <form onSubmit={registrarActividadRapida} className="flex-1 flex flex-col space-y-4">
                  <div className="relative">
                    <label className="block text-[10px] font-bold text-[#415364]/60 uppercase mb-1.5">Buscar Cliente</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#415364]/40"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg></span>
                      <input type="text" placeholder="Escribe nombre o teléfono..." value={busquedaLlamada} onChange={(e) => { setBusquedaLlamada(e.target.value); setMostrarOpcionesLlamada(true); setLlamadaClienteId(''); }} onFocus={() => setMostrarOpcionesLlamada(true)} className="w-full bg-[#dce3eb]/30 border border-[#415364]/20 rounded-xl py-2.5 pl-9 pr-3 text-xs font-medium focus:outline-none focus:border-[#ea0029] text-[#415364]"/>
                    </div>
                    {busquedaLlamada && !llamadaClienteId && <p className="text-[9px] text-[#ea0029] mt-1.5 font-bold">⚠️ Haz clic en un prospecto abajo</p>}
                    {mostrarOpcionesLlamada && !llamadaClienteId && (
                      <ul className="absolute z-10 w-full mt-1.5 bg-white border border-neutral-200/80 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar">
                        {prospectosFiltradosParaLlamada.length > 0 ? (
                          prospectosFiltradosParaLlamada.map(c => (
                            <li key={c.id} className="p-3 text-xs hover:bg-[#dce3eb]/30 cursor-pointer border-b border-neutral-100 last:border-0 flex flex-col transition-colors" onClick={() => { setLlamadaClienteId(c.id); setBusquedaLlamada(`${c.nombres} ${c.apellidos}`); setMostrarOpcionesLlamada(false); }}>
                              <span className="font-bold text-[#415364]">{c.nombres} {c.apellidos}</span><span className="text-[10px] text-[#415364]/60 font-mono mt-0.5">{c.telefono}</span>
                            </li>
                          ))
                        ) : (<li className="p-3 text-xs text-[#415364]/40 text-center font-medium">No encontrado</li>)}
                      </ul>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-[#415364]/60 uppercase mb-1.5">Asesor</label>
                      <select value={llamadaAgente} onChange={(e) => setLlamadaAgente(e.target.value)} className="w-full bg-white border border-[#415364]/20 rounded-xl p-2.5 text-xs font-bold text-[#415364] focus:outline-none focus:border-[#ea0029]"><option value="Saúl Intriago">Saúl</option><option value="Debbi Mera">Debbi</option></select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#415364]/60 uppercase mb-1.5">Canal</label>
                      <select value={tipoContacto} onChange={(e) => setTipoContacto(e.target.value)} className="w-full bg-white border border-[#415364]/20 rounded-xl p-2.5 text-xs font-bold text-[#415364] focus:outline-none focus:border-[#ea0029]"><option value="Llamada">Llamada</option><option value="WhatsApp">WhatsApp</option><option value="Zoom">Zoom</option><option value="Email">Email</option><option value="Reunión">Presencial</option></select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#415364]/60 uppercase mb-1.5">Resultado</label>
                    <select value={llamadaResultado} onChange={(e) => setLlamadaResultado(e.target.value)} className="w-full bg-[#dce3eb]/30 border border-[#415364]/20 rounded-xl p-2.5 text-xs font-bold text-[#415364] focus:outline-none focus:border-[#ea0029]">
                      {tipoContacto === 'Llamada' || tipoContacto === 'Zoom' ? (<><option value="Contestó">✅ Contestó / Asistió</option><option value="No contestó">❌ No contestó / Faltó</option><option value="Equivocado">🚫 Número Erróneo</option></>) : tipoContacto === 'WhatsApp' ? (<><option value="Respondio">✅ Respondió el chat</option><option value="Enviado">✔️ Enviado (Sin resp)</option><option value="Leido">👀 Leído (Visto)</option></>) : (<><option value="Efectivo">✅ Efectivo / Realizado</option><option value="Fallido">❌ Cancelado</option></>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#415364]/60 uppercase mb-1.5">Notas del Contacto</label>
                    <textarea rows={2} value={llamadaNota} onChange={(e) => setLlamadaNota(e.target.value)} placeholder="Ej: Le gustó la suite..." className="w-full bg-white border border-[#415364]/20 rounded-xl p-3 text-xs font-medium text-[#415364] focus:outline-none focus:border-[#ea0029] resize-none transition-all"></textarea>
                  </div>
                  <div className="bg-[#415364]/5 border border-[#415364]/10 p-4 rounded-xl mt-2">
                    <label className="block text-[10px] font-bold text-[#415364] uppercase mb-2.5 flex items-center gap-1.5"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> Agendar Siguiente Paso</label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <input type="date" value={proximaFechaRapida} onChange={(e) => setProximaFechaRapida(e.target.value)} className="w-full bg-white border border-[#415364]/20 rounded-lg p-2 text-[11px] font-bold text-[#415364] outline-none focus:border-[#ea0029]" />
                      <select value={proximaAccionRapida} onChange={(e) => setProximaAccionRapida(e.target.value)} className="w-full bg-white border border-[#415364]/20 rounded-lg p-2 text-[11px] font-bold text-[#415364] outline-none focus:border-[#ea0029]"><option value="">-- Acción --</option><option value="Llamar">Llamar</option><option value="WhatsApp">WhatsApp</option><option value="Reunión">Reunión / Zoom</option><option value="Cotización">Cotización</option></select>
                    </div>
                  </div>
                  <button type="submit" disabled={guardandoActividadRapida || !llamadaClienteId} className={`w-full py-3.5 mt-auto text-white text-[11px] font-bold uppercase tracking-widest rounded-xl transition shadow-md ${!llamadaClienteId ? 'bg-[#415364]/30 cursor-not-allowed' : 'bg-[#ea0029] hover:bg-[#c90022]'}`}>{guardandoActividadRapida ? 'Procesando...' : 'Guardar y Actualizar'}</button>
                </form>
              </div>

              <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#415364] uppercase tracking-wide flex items-center gap-2"><svg className="w-5 h-5 text-[#ea0029]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg> {tituloActividad[filtroTiempo]}</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                  {actividadesDia.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6"><svg className="w-12 h-12 text-[#415364]/20 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><p className="text-[#415364]/50 text-xs font-bold uppercase tracking-wider">No hay flujo registrado<br/>para este periodo.</p></div>
                  ) : (
                    <div className="space-y-4">
                      {actividadesDia.map((act) => (
                        <div key={act.id} className="flex gap-4 p-4 bg-white border border-[#415364]/10 rounded-xl hover:shadow-md transition-shadow group">
                          <div className="text-center pt-1 min-w-[55px]">
                            {filtroTiempo !== 'hoy' && filtroTiempo !== 'ayer' ? (<><span className="block text-[10px] font-bold text-[#415364]/60 mb-0.5">{new Date(act.created_at).toLocaleDateString('es-EC', {day:'2-digit', month:'short'})}</span><span className="text-[10px] font-mono font-bold text-[#ea0029]">{new Date(act.created_at).toLocaleTimeString('es-EC', {hour: '2-digit', minute:'2-digit'})}</span></>) : (<span className="text-[11px] font-mono font-bold text-[#ea0029]">{new Date(act.created_at).toLocaleTimeString('es-EC', {hour: '2-digit', minute:'2-digit'})}</span>)}
                          </div>
                          <div className="flex-1 border-l border-[#415364]/10 pl-4">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className="text-sm font-bold text-[#415364]">{act.clientes?.nombres} {act.clientes?.apellidos}</span><span className="text-[12px] opacity-70 group-hover:opacity-100 transition-opacity">{act.tipo_contacto === 'WhatsApp' ? '💬' : act.tipo_contacto === 'Email' ? '📧' : act.tipo_contacto === 'Zoom' ? '📹' : act.tipo_contacto === 'Reunión' ? '🤝' : '📞'}</span><span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border ${act.resultado.includes('Contestó') || act.resultado.includes('Respondio') || act.resultado.includes('Efectivo') ? 'bg-green-50 text-green-700 border-green-200' : 'bg-neutral-100 text-neutral-600 border-neutral-200'}`}>{act.resultado}</span>
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

      {/* --- MODALES Y PANEL LATERAL --- */}
      {clienteSeleccionado && <div className="fixed inset-0 bg-[#21242E]/80 z-40 transition-opacity backdrop-blur-sm" onClick={() => setClienteSeleccionado(null)}></div>}
      <div className={`fixed top-0 right-0 h-full w-full max-w-[400px] bg-[#F9F7F5] shadow-2xl border-l border-neutral-200 transform transition-transform duration-300 z-50 flex flex-col ${clienteSeleccionado ? 'translate-x-0' : 'translate-x-full'}`}>
        {clienteSeleccionado && (
          <>
            <div className="p-6 bg-[#21242E] relative flex-shrink-0 shadow-md">
              <button onClick={() => setClienteSeleccionado(null)} className="absolute top-4 right-4 text-white/50 hover:text-white bg-white/10 rounded-full w-8 h-8 flex items-center justify-center transition-colors">✕</button>
              <h2 className="text-xl font-bold text-white pr-8 leading-tight flex items-center gap-2">{clienteSeleccionado.nombres} {clienteSeleccionado.apellidos}</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              <div className="bg-white p-4 rounded-xl border border-neutral-200/60 shadow-sm space-y-3">
                <p className="text-[10px] font-bold text-[#415364]/60 uppercase tracking-widest border-b border-neutral-100 pb-2">Acciones de Contacto</p>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => abrirWhatsApp(clienteSeleccionado, 'bienvenida')} className="flex flex-col items-center justify-center gap-1 bg-[#25D366] text-white py-2.5 rounded-xl shadow-sm"><span className="text-[11px] font-bold uppercase tracking-wider">Welcome</span></button>
                  <button onClick={() => abrirWhatsApp(clienteSeleccionado, 'campana')} className="flex flex-col items-center justify-center gap-1 bg-[#128C7E] text-white py-2.5 rounded-xl shadow-sm"><span className="text-[11px] font-bold uppercase tracking-wider">Campaña</span></button>
                  <button onClick={() => abrirWhatsApp(clienteSeleccionado, 'libre')} className="flex flex-col items-center justify-center gap-1 bg-white text-[#415364] border border-[#415364]/20 py-2.5 rounded-xl shadow-sm"><span className="text-[11px] font-bold uppercase tracking-wider">Chat Libre</span></button>
                  <button onClick={() => abrirCorreo(clienteSeleccionado)} className="flex flex-col items-center justify-center gap-1 bg-[#415364] text-white py-2.5 rounded-xl shadow-sm"><span className="text-[11px] font-bold uppercase tracking-wider">Diseñar Correo</span></button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-neutral-200/60 shadow-sm">
                  <label className="block text-[9px] font-bold text-[#415364]/60 uppercase tracking-widest mb-1.5">Fase Embudo</label>
                  <select value={clienteSeleccionado.estado} onChange={(e) => actualizarCampoRapido(clienteSeleccionado.id, 'estado', e.target.value)} className="w-full bg-[#dce3eb]/30 border border-[#415364]/10 rounded-lg p-2 text-[11px] font-bold text-[#415364] outline-none focus:border-[#ea0029]">{estados.map(est => <option key={est} value={est}>{est}</option>)}</select>
                </div>
                <div className="bg-white p-4 rounded-xl border border-neutral-200/60 shadow-sm">
                  <label className="block text-[9px] font-bold text-[#415364]/60 uppercase tracking-widest mb-1.5">Termómetro</label>
                  <select value={clienteSeleccionado.temperatura || '❄️ Frío'} onChange={(e) => actualizarCampoRapido(clienteSeleccionado.id, 'temperatura', e.target.value)} className="w-full bg-[#dce3eb]/30 border border-[#415364]/10 rounded-lg p-2 text-[11px] font-bold text-[#415364] outline-none focus:border-[#ea0029]"><option value="🔥 Caliente">🔥 Caliente</option><option value="☀️ Tibio">☀️ Tibio</option><option value="❄️ Frío">❄️ Frío</option></select>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* === ESTUDIO DE DISEÑO PROFESIONAL CON FIRMA MANUAL === */}
      {mostrarModalPreviewCorreo && clienteSeleccionado && (() => {
        const htmlAEnviar = generarCodigoHTMLCorreo();

        return (
          <div className="fixed inset-0 bg-[#21242E]/90 z-[90] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#F9F7F5] rounded-2xl shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[95vh] h-full">
              
              <div className="bg-white p-5 border-b border-neutral-200 flex justify-between items-center z-10 flex-shrink-0">
                <div>
                  <h2 className="text-sm font-bold text-[#415364] uppercase tracking-widest">Estudio de Diseño Profesional</h2>
                  <p className="text-xs text-[#415364]/60 mt-1">Para: <strong>{clienteSeleccionado.email}</strong></p>
                </div>
                <button onClick={() => setMostrarModalPreviewCorreo(false)} className="text-[#415364]/40 hover:text-[#ea0029] text-2xl transition-colors leading-none">&times;</button>
              </div>

              <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                
                {/* PANEL IZQUIERDO: CONTROLES Y TEXTOS EDITABLES */}
                <div className="w-full md:w-[380px] bg-white border-r border-neutral-200 p-5 flex flex-col gap-5 overflow-y-auto custom-scrollbar flex-shrink-0">
                  
                  {/* 1. Estrategia */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-[#415364] uppercase tracking-widest">1. Seleccionar Estrategia</label>
                    <select value={plantillaActivaId} onChange={(e) => setPlantillaActivaId(e.target.value)} className="w-full bg-[#dce3eb]/30 border border-[#415364]/20 rounded-xl p-2.5 text-xs font-bold text-[#ea0029] outline-none">
                      {PLANTILLAS_CORREO.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                  </div>

                  {/* 2. Tema de Color */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-[#415364] uppercase tracking-widest">2. Tema de Color (Branding)</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button onClick={()=>setTemaColor('terracota')} className={`p-2 rounded-lg border-2 ${temaColor==='terracota' ? 'border-[#964B36] bg-[#964B36]/10' : 'border-transparent bg-neutral-50'}`}><div className="w-full h-5 bg-[#964B36] rounded mb-1"></div><span className="text-[9px] font-bold text-[#415364]">Terracota</span></button>
                      <button onClick={()=>setTemaColor('dorado')} className={`p-2 rounded-lg border-2 ${temaColor==='dorado' ? 'border-[#D1C292] bg-[#D1C292]/10' : 'border-transparent bg-neutral-50'}`}><div className="w-full h-5 bg-[#D1C292] rounded mb-1"></div><span className="text-[9px] font-bold text-[#415364]">Dorado</span></button>
                      <button onClick={()=>setTemaColor('navy')} className={`p-2 rounded-lg border-2 ${temaColor==='navy' ? 'border-[#21242E] bg-[#21242E]/10' : 'border-transparent bg-neutral-50'}`}><div className="w-full h-5 bg-[#21242E] rounded mb-1"></div><span className="text-[9px] font-bold text-[#415364]">Navy</span></button>
                    </div>
                  </div>

                  {/* 3. Firma Personalizada o Masivo */}
                  <div className="space-y-3 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                    <label className="block text-[10px] font-bold text-[#415364] uppercase tracking-widest">3. Configuración de Firma</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={()=>setIncluirFirma(true)} className={`p-2 rounded-lg border-2 text-[9px] font-bold uppercase ${incluirFirma ? 'border-[#ea0029] bg-[#ea0029]/10 text-[#ea0029]' : 'border-neutral-200 text-neutral-600'}`}>Con Firma</button>
                      <button onClick={()=>setIncluirFirma(false)} className={`p-2 rounded-lg border-2 text-[9px] font-bold uppercase ${!incluirFirma ? 'border-[#ea0029] bg-[#ea0029]/10 text-[#ea0029]' : 'border-neutral-200 text-neutral-600'}`}>Sin Firma (Masivo)</button>
                    </div>

                    {incluirFirma && (
                      <div className="space-y-2 pt-2 border-t border-neutral-200">
                        <div>
                          <span className="text-[9px] font-bold text-neutral-500 uppercase">Nombre del Remitente:</span>
                          <input type="text" value={nombreRemitente} onChange={(e)=>setNombreRemitente(e.target.value)} className="w-full mt-1 bg-white border border-neutral-200 rounded-lg p-2 text-xs font-bold text-[#415364] outline-none focus:border-[#ea0029]" />
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-neutral-500 uppercase">Cargo / Título Manual:</span>
                          <input type="text" value={cargoRemitente} onChange={(e)=>setCargoRemitente(e.target.value)} className="w-full mt-1 bg-white border border-neutral-200 rounded-lg p-2 text-xs font-bold text-[#415364] outline-none focus:border-[#ea0029]" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 4. Portada */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-[#415364] uppercase tracking-widest">4. Foto de Portada</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'fachada', label: 'Fachada', img: IMAGENES_GALERIA.fachada },
                        { id: 'ubicacion', label: 'Ubicación', img: IMAGENES_GALERIA.ubicacion },
                        { id: 'living', label: 'Living', img: IMAGENES_GALERIA.living },
                        { id: 'piscina', label: 'Piscina', img: IMAGENES_GALERIA.piscina }
                      ].map(foto => (
                        <div key={foto.id} onClick={() => setImagenPortada(foto.id as any)} className={`cursor-pointer rounded-lg overflow-hidden border-2 ${imagenPortada === foto.id ? 'border-[#ea0029]' : 'border-transparent opacity-70'}`}>
                          <img src={foto.img} className="w-full h-10 object-cover" />
                          <div className="bg-[#21242E] text-white text-[8px] font-bold text-center py-1 uppercase">{foto.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 5. Edición de Textos */}
                  <div className="space-y-3 pt-2 border-t border-neutral-100">
                    <label className="block text-[10px] font-bold text-[#ea0029] uppercase tracking-widest">5. Edición de Textos</label>
                    <div>
                      <span className="text-[9px] font-bold text-neutral-500 uppercase">Párrafo Principal:</span>
                      <textarea rows={3} value={textoIntroPersonalizado} onChange={(e)=>setTextoIntroPersonalizado(e.target.value)} className="w-full mt-1 bg-[#dce3eb]/30 border border-neutral-200 rounded-lg p-2 text-xs font-medium text-[#415364] outline-none focus:border-[#ea0029] resize-none" />
                    </div>
                    {plantillaActivaId === 'seguimiento_premium' && (
                      <>
                        <div>
                          <span className="text-[9px] font-bold text-neutral-500 uppercase">Texto Ubicación:</span>
                          <textarea rows={2} value={textoUbicacion} onChange={(e)=>setTextoUbicacion(e.target.value)} className="w-full mt-1 bg-[#dce3eb]/30 border border-neutral-200 rounded-lg p-2 text-xs font-medium text-[#415364] outline-none focus:border-[#ea0029] resize-none" />
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-neutral-500 uppercase">Texto Arquitectura:</span>
                          <textarea rows={2} value={textoArquitectura} onChange={(e)=>setTextoArquitectura(e.target.value)} className="w-full mt-1 bg-[#dce3eb]/30 border border-neutral-200 rounded-lg p-2 text-xs font-medium text-[#415364] outline-none focus:border-[#ea0029] resize-none" />
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-neutral-500 uppercase">Texto Amenidades:</span>
                          <textarea rows={2} value={textoAmenidades} onChange={(e)=>setTextoAmenidades(e.target.value)} className="w-full mt-1 bg-[#dce3eb]/30 border border-neutral-200 rounded-lg p-2 text-xs font-medium text-[#415364] outline-none focus:border-[#ea0029] resize-none" />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* PANEL DERECHO: VISTA PREVIA EXACTA */}
                <div className="flex-1 bg-[#dce3eb] p-0 md:p-6 overflow-hidden flex justify-center">
                  <div className="w-full max-w-[600px] h-full bg-white shadow-2xl overflow-y-auto custom-scrollbar border border-neutral-300">
                     <div dangerouslySetInnerHTML={{ __html: htmlAEnviar }} />
                  </div>
                </div>
              </div>

              {/* Footer de Acciones del Modal */}
              <div className="bg-white p-5 border-t border-neutral-200 flex justify-end gap-4 flex-shrink-0">
                <button onClick={() => setMostrarModalPreviewCorreo(false)} className="px-6 py-2.5 text-xs font-bold text-[#415364] border border-[#415364]/20 rounded-xl hover:bg-[#415364]/5 transition-colors">Cancelar</button>
                <button onClick={enviarCorreoFinal} disabled={enviandoCorreoCRM} className="px-8 py-3 bg-[#ea0029] text-white text-xs font-bold uppercase tracking-widest rounded-xl shadow-md hover:bg-[#c90022] transition-colors disabled:opacity-50">
                  {enviandoCorreoCRM ? 'Enviando Correo...' : 'Aprobar y Enviar Correo'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}