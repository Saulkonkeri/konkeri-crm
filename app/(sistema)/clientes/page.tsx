'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

interface Cliente {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  ciudad_residencia: string;
  origen_captacion: string;
  tipologia_interes: string;
  motivo_compra: string;
  ingresado_por?: string;
  estado?: string;
  temperatura?: string;
  tipo: 'prospecto' | 'cliente';
  
  // Expediente KYC Básico
  tipo_identificacion?: string;
  identificacion?: string;
  estado_civil?: string;
  nacionalidad?: string;
  fecha_nacimiento?: string;
  cargas_familiares?: number;
  dia_pago?: number;
  direccion_correspondencia?: string;
  
  // Expediente Conyugal
  nombres_conyuge?: string;
  apellidos_conyuge?: string;
  identificacion_conyuge?: string;
  nacionalidad_conyuge?: string;
  fecha_nacimiento_conyuge?: string;
  correo_conyuge?: string;
  celular_conyuge?: string;
  
  // Expediente Laboral y Patrimonial
  empresa_trabajo?: string;
  cargo?: string;
  ingresos_mensuales?: number;
  gastos_mensuales?: number;
  direccion_domicilio?: string;
  
  // Expediente Contacto Alterno / Familiar
  familiar_nombre?: string;
  familiar_telefono?: string;
  familiar_celular?: string;
  familiar_direccion?: string;
  
  // Estructuración Contractual
  emitir_contrato_a?: string;
  banco_precalificacion?: string;
  
  notas?: string;
  created_at: string;
}

export default function ClientesPage() {
  const [vistaActual, setVistaActual] = useState<'hub' | 'lista_general' | 'lista_clientes'>('hub');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busquedaTexto, setBusquedaTexto] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTipo, setModalTipo] = useState<'prospecto' | 'cliente'>('prospecto');
  const [modoModal, setModoModal] = useState<'crear' | 'editar'>('crear');
  const [clienteSeleccionadoId, setClienteSeleccionadoId] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  
  // --- ESTADOS: DATOS DE INGRESO Y CAMPAÑA ---
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [ciudadResidencia, setCiudadResidencia] = useState('');
  const [origenCaptacion, setOrigenCaptacion] = useState('Meta Ads');
  const [tipologiaInteres, setTipologiaInteres] = useState('Suite');
  const [motivoCompra, setMotivoCompra] = useState('Para Invertir');
  const [ingresadoPor, setIngresadoPor] = useState('Saúl Intriago / Debbi Mera');
  const [notas, setNotas] = useState('');

  // --- ESTADOS: EXPEDIENTE CLIENTE KYC ---
  const [tipoIdentificacion, setTipoIdentificacion] = useState('Cédula');
  const [identificacion, setIdentificacion] = useState('');
  const [estadoCivil, setEstadoCivil] = useState('Soltero/a');
  const [nacionalidad, setNacionalidad] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [cargasFamiliares, setCargasFamiliares] = useState('');
  const [diaPago, setDiaPago] = useState('');
  const [direccionCorrespondencia, setDireccionCorrespondencia] = useState('Domicilio');
  
  // --- ESTADOS: CÓNYUGE ---
  const [nombresConyuge, setNombresConyuge] = useState('');
  const [apellidosConyuge, setApellidosConyuge] = useState('');
  const [identificacionConyuge, setIdentificacionConyuge] = useState('');
  const [nacionalidadConyuge, setNacionalidadConyuge] = useState('');
  const [fechaNacimientoConyuge, setFechaNacimientoConyuge] = useState('');
  const [correoConyuge, setCorreoConyuge] = useState('');
  const [celularConyuge, setCelularConyuge] = useState('');

  // --- ESTADOS: LABORAL ---
  const [empresaTrabajo, setEmpresaTrabajo] = useState('');
  const [cargo, setCargo] = useState('');
  const [ingresosMensuales, setIngresosMensuales] = useState('');
  const [gastosMensuales, setGastosMensuales] = useState('');
  const [direccionDomicilio, setDireccionDomicilio] = useState('');

  // --- ESTADOS: CONTACTO ALTERNO ---
  const [familiarNombre, setFamiliarNombre] = useState('');
  const [familiarTelefono, setFamiliarTelefono] = useState('');
  const [familiarCelular, setFamiliarCelular] = useState('');
  const [familiarDireccion, setFamiliarDireccion] = useState('');

  // --- ESTADOS: CONTRATO ---
  const [emitirContratoA, setEmitirContratoA] = useState('');
  const [bancoPrecalificacion, setBancoPrecalificacion] = useState('');

  const fetchClientes = async () => {
    setCargando(true);
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setClientes(data);
      }
    } catch (err) {
      console.error('Error al mapear Supabase:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const limpiarFormulario = () => {
    setNombres(''); setApellidos(''); setEmail(''); setTelefono(''); setCiudadResidencia('');
    setIdentificacion(''); setNacionalidad(''); setFechaNacimiento(''); setCargasFamiliares(''); 
    setDiaPago(''); setDireccionCorrespondencia('Domicilio');
    setNombresConyuge(''); setApellidosConyuge(''); setIdentificacionConyuge('');
    setNacionalidadConyuge(''); setFechaNacimientoConyuge(''); setCorreoConyuge(''); setCelularConyuge('');
    setEmpresaTrabajo(''); setCargo(''); setIngresosMensuales(''); setGastosMensuales(''); setDireccionDomicilio('');
    setFamiliarNombre(''); setFamiliarTelefono(''); setFamiliarCelular(''); setFamiliarDireccion('');
    setEmitirContratoA(''); setBancoPrecalificacion('');
    setNotas('');
    setOrigenCaptacion('Meta Ads'); setTipologiaInteres('Suite'); setMotivoCompra('Para Invertir');
    setIngresadoPor('Saúl Intriago / Debbi Mera');
    setTipoIdentificacion('Cédula'); setEstadoCivil('Soltero/a');
    setClienteSeleccionadoId(null);
  };

  const cargarDatosEnFormulario = (cliente: Cliente) => {
    setNombres(cliente.nombres || '');
    setApellidos(cliente.apellidos || '');
    setEmail(cliente.email || '');
    setTelefono(cliente.telefono || '');
    setCiudadResidencia(cliente.ciudad_residencia || '');
    setOrigenCaptacion(cliente.origen_captacion || 'Meta Ads');
    setTipologiaInteres(cliente.tipologia_interes || 'Suite');
    setMotivoCompra(cliente.motivo_compra || 'Para Invertir');
    setIngresadoPor(cliente.ingresado_por || 'Saúl Intriago / Debbi Mera');
    setNotas(cliente.notas || '');

    setTipoIdentificacion(cliente.tipo_identificacion || 'Cédula');
    setIdentificacion(cliente.identificacion || '');
    setEstadoCivil(cliente.estado_civil || 'Soltero/a');
    setNacionalidad(cliente.nacionalidad || '');
    setFechaNacimiento(cliente.fecha_nacimiento || '');
    setCargasFamiliares(cliente.cargas_familiares?.toString() || '');
    setDiaPago(cliente.dia_pago?.toString() || '');
    setDireccionCorrespondencia(cliente.direccion_correspondencia || 'Domicilio');

    setNombresConyuge(cliente.nombres_conyuge || '');
    setApellidosConyuge(cliente.apellidos_conyuge || '');
    setIdentificacionConyuge(cliente.identificacion_conyuge || '');
    setNacionalidadConyuge(cliente.nacionalidad_conyuge || '');
    setFechaNacimientoConyuge(cliente.fecha_nacimiento_conyuge || '');
    setCorreoConyuge(cliente.correo_conyuge || '');
    setCelularConyuge(cliente.celular_conyuge || '');

    setEmpresaTrabajo(cliente.empresa_trabajo || '');
    setCargo(cliente.cargo || '');
    setIngresosMensuales(cliente.ingresos_mensuales?.toString() || '');
    setGastosMensuales(cliente.gastos_mensuales?.toString() || '');
    setDireccionDomicilio(cliente.direccion_domicilio || '');

    setFamiliarNombre(cliente.familiar_nombre || '');
    setFamiliarTelefono(cliente.familiar_telefono || '');
    setFamiliarCelular(cliente.familiar_celular || '');
    setFamiliarDireccion(cliente.familiar_direccion || '');

    setEmitirContratoA(cliente.emitir_contrato_a || '');
    setBancoPrecalificacion(cliente.banco_precalificacion || '');
  };

  const abrirEditarModal = (cliente: Cliente) => {
    setModoModal('editar');
    setModalTipo(cliente.tipo || 'prospecto');
    setClienteSeleccionadoId(cliente.id);
    cargarDatosEnFormulario(cliente);
    setIsModalOpen(true);
  };

  const convertirACliente = (cliente: Cliente) => {
    setModoModal('editar'); 
    setModalTipo('cliente'); 
    setClienteSeleccionadoId(cliente.id);
    cargarDatosEnFormulario(cliente);
    setIsModalOpen(true);
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizarTelefono = (tel: string) => {
      if (!tel) return '';
      let num = tel.replace(/\D/g, '');
      if (num.startsWith('593')) num = num.substring(3);
      if (num.startsWith('0')) num = num.substring(1);
      return num;
    };

    const telefonoNormalizadoNuevo = normalizarTelefono(telefono);

    const clienteDuplicadoTelefono = clientes.find(c => 
      c.telefono && 
      normalizarTelefono(c.telefono) === telefonoNormalizadoNuevo &&
      c.id !== clienteSeleccionadoId
    );

    if (clienteDuplicadoTelefono) {
      alert(`⚠️ ¡ATENCIÓN! Este número de teléfono ya está registrado.\n\nPertenece a: ${clienteDuplicadoTelefono.nombres} ${clienteDuplicadoTelefono.apellidos}\nTipo: ${clienteDuplicadoTelefono.tipo === 'cliente' ? 'Inversionista' : 'Prospecto'}\n\nPor favor, búscalo en el directorio para actualizarlo en lugar de duplicarlo.`);
      return;
    }

    const clienteDuplicadoEmail = email 
      ? clientes.find(c => c.email && c.email.toLowerCase() === email.toLowerCase().trim() && c.id !== clienteSeleccionadoId)
      : null;

    if (clienteDuplicadoEmail) {
      alert(`⚠️ ¡ATENCIÓN! Este correo electrónico ya está registrado.\n\nPertenece a: ${clienteDuplicadoEmail.nombres} ${clienteDuplicadoEmail.apellidos}\nTipo: ${clienteDuplicadoEmail.tipo === 'cliente' ? 'Inversionista' : 'Prospecto'}\n\nPor favor, búscalo en el directorio para actualizarlo en lugar de duplicarlo.`);
      return;
    }
    
    const datosRegistro: any = {
      nombres: nombres.trim(), 
      apellidos: apellidos.trim(),
      email: email ? email.trim().toLowerCase() : null,
      telefono: telefono.trim() || null,
      tipo: modalTipo, 
      estado: modalTipo === 'prospecto' ? 'Interesado' : 'Reserva',
      ciudad_residencia: ciudadResidencia ? ciudadResidencia.trim() : null,
      origen_captacion: origenCaptacion,
      tipologia_interes: tipologiaInteres,
      motivo_compra: motivoCompra,
      ingresado_por: ingresadoPor,
      notas: notas || null
    };

    if (modalTipo === 'cliente') {
      datosRegistro.tipo_identificacion = tipoIdentificacion;
      datosRegistro.identificacion = identificacion || null;
      datosRegistro.estado_civil = estadoCivil;
      datosRegistro.nacionalidad = nacionalidad || null;
      datosRegistro.fecha_nacimiento = fechaNacimiento || null;
      datosRegistro.cargas_familiares = cargasFamiliares ? parseInt(cargasFamiliares) : null;
      datosRegistro.dia_pago = diaPago ? parseInt(diaPago) : null;
      datosRegistro.direccion_correspondencia = direccionCorrespondencia;
      
      if (estadoCivil === 'Casado/a' || estadoCivil === 'Unión de Hecho') {
        datosRegistro.nombres_conyuge = nombresConyuge || null;
        datosRegistro.apellidos_conyuge = apellidosConyuge || null;
        datosRegistro.identificacion_conyuge = identificacionConyuge || null;
        datosRegistro.nacionalidad_conyuge = nacionalidadConyuge || null;
        datosRegistro.fecha_nacimiento_conyuge = fechaNacimientoConyuge || null;
        datosRegistro.correo_conyuge = correoConyuge || null;
        datosRegistro.celular_conyuge = celularConyuge || null;
      } else {
        datosRegistro.nombres_conyuge = null; datosRegistro.apellidos_conyuge = null; datosRegistro.identificacion_conyuge = null;
        datosRegistro.nacionalidad_conyuge = null; datosRegistro.fecha_nacimiento_conyuge = null; datosRegistro.correo_conyuge = null; datosRegistro.celular_conyuge = null;
      }
      
      datosRegistro.empresa_trabajo = empresaTrabajo || null;
      datosRegistro.cargo = cargo || null;
      datosRegistro.ingresos_mensuales = ingresosMensuales ? parseFloat(ingresosMensuales) : 0.00;
      datosRegistro.gastos_mensuales = gastosMensuales ? parseFloat(gastosMensuales) : 0.00;
      datosRegistro.direccion_domicilio = direccionDomicilio || null;

      datosRegistro.familiar_nombre = familiarNombre || null;
      datosRegistro.familiar_telefono = familiarTelefono || null;
      datosRegistro.familiar_celular = familiarCelular || null;
      datosRegistro.familiar_direccion = familiarDireccion || null;

      datosRegistro.emitir_contrato_a = emitirContratoA || null;
      datosRegistro.banco_precalificacion = bancoPrecalificacion || null;
    }

    let resultado;
    if (modoModal === 'crear') {
      resultado = await supabase.from('clientes').insert([datosRegistro]);
    } else {
      resultado = await supabase.from('clientes').update(datosRegistro).eq('id', clienteSeleccionadoId);
    }

    if (!resultado.error) {
      limpiarFormulario();
      setIsModalOpen(false);
      fetchClientes(); 
    } else {
      alert('Error al procesar en Supabase: ' + resultado.error.message);
    }
  };

  const totalProspectos = clientes.filter(c => c.estado !== 'Descartado').length;
  const totalClientes = clientes.filter(c => c.tipo === 'cliente' || c.estado === 'Cierre (Ganado)').length;

  const listadoFiltrado = useMemo(() => {
    let base = vistaActual === 'lista_clientes' 
      ? clientes.filter(c => c.tipo === 'cliente' || c.estado === 'Cierre (Ganado)')
      : clientes.filter(c => c.estado !== 'Descartado');

    if (!busquedaTexto.trim()) return base;
    
    const b = busquedaTexto.toLowerCase();
    return base.filter(c => 
      `${c.nombres || ''} ${c.apellidos || ''}`.toLowerCase().includes(b) ||
      (c.telefono && c.telefono.includes(b)) ||
      (c.email && c.email.toLowerCase().includes(b)) ||
      (c.ingresado_por && c.ingresado_por.toLowerCase().includes(b))
    );
  }, [clientes, vistaActual, busquedaTexto]);

  return (
    <div className="p-4 md:p-8 font-sans text-[#415364] w-full max-w-7xl mx-auto">
      
      {/* NAVEGACIÓN SUPERIOR */}
      {vistaActual !== 'hub' && (
        <div className="mb-4">
          <button 
            onClick={() => { setVistaActual('hub'); setBusquedaTexto(''); }}
            className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#415364]/50 hover:text-[#ea0029] transition-colors"
          >
            ← Volver al Hub
          </button>
        </div>
      )}

      {/* ENCABEZADO Y BUSCADOR */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#415364]/10 pb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#415364]">
            {vistaActual === 'hub' && 'Gestión de Contactos'}
            {vistaActual === 'lista_general' && 'Directorio de Prospectos'}
            {vistaActual === 'lista_clientes' && 'Expedientes Inversionistas'}
          </h1>
          <p className="text-sm text-[#415364]/70 mt-1">
            {vistaActual === 'hub' && 'Administra perfiles y documentos KYC.'}
            {vistaActual !== 'hub' && 'Busca y edita la información de tus leads.'}
          </p>
        </div>

        {vistaActual !== 'hub' && (
          <div className="relative w-full md:w-80">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#415364]/40">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </span>
            <input 
              type="text" 
              placeholder="Buscar nombre, teléfono, asesor..." 
              value={busquedaTexto} 
              onChange={(e) => setBusquedaTexto(e.target.value)}
              className="w-full bg-white/60 backdrop-blur-sm border border-[#415364]/20 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium focus:outline-none focus:border-[#ea0029] focus:ring-1 focus:ring-[#ea0029]/20 transition-all text-[#415364]"
            />
          </div>
        )}
      </div>

      {/* --- HUB DE CLIENTES (TARJETAS GRANDES) --- */}
      {vistaActual === 'hub' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Tarjeta Leads */}
          <div className="bg-white rounded-2xl border border-neutral-200/60 p-6 sm:p-8 flex flex-col justify-between shadow-sm hover:shadow-lg transition-all group overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#415364]"></div>
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="bg-[#415364]/5 p-3 rounded-xl text-[#415364]">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                </div>
                <span className="text-[10px] font-bold text-[#415364] bg-[#415364]/10 px-3 py-1 rounded-full uppercase tracking-widest">
                  {cargando ? '...' : `${totalProspectos} registros`}
                </span>
              </div>
              <h2 className="text-xl font-bold text-[#415364] mb-2">Directorio de Prospectos</h2>
              <p className="text-sm text-[#415364]/60 leading-relaxed mb-6">
                Administra los perfiles de todos los leads que entran por campañas. Actualiza su información de contacto y preferencias de compra.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => { limpiarFormulario(); setModoModal('crear'); setModalTipo('prospecto'); setIsModalOpen(true); }}
                className="flex-1 bg-[#415364] text-white py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#21242E] transition-colors shadow-sm"
              >
                + Nuevo Lead
              </button>
              <button
                onClick={() => { setBusquedaTexto(''); setVistaActual('lista_general'); }}
                className="flex-1 bg-white border border-[#415364]/20 text-[#415364] py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#415364]/5 transition-colors"
              >
                Ver Directorio
              </button>
            </div>
          </div>

          {/* Tarjeta Inversionistas */}
          <div className="bg-[#21242E] rounded-2xl border border-neutral-800 p-6 sm:p-8 flex flex-col justify-between shadow-sm hover:shadow-lg transition-all group overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#ea0029]"></div>
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="bg-white/5 p-3 rounded-xl text-white">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                </div>
                <span className="text-[10px] font-bold text-[#ea0029] bg-[#ea0029]/10 px-3 py-1 rounded-full uppercase tracking-widest border border-[#ea0029]/20">
                  {cargando ? '...' : `${totalClientes} formalizados`}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Expedientes KYC</h2>
              <p className="text-sm text-white/50 leading-relaxed mb-6">
                Documentación profunda de inversionistas. Incluye registros patrimoniales, información conyugal y estructuración contractual.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => { limpiarFormulario(); setModoModal('crear'); setModalTipo('cliente'); setIsModalOpen(true); }}
                className="flex-1 bg-[#ea0029] text-white py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#c90022] transition-colors shadow-sm"
              >
                + Nuevo KYC
              </button>
              <button
                onClick={() => { setBusquedaTexto(''); setVistaActual('lista_clientes'); }}
                className="flex-1 bg-transparent border border-white/20 text-white py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-colors"
              >
                Ver Expedientes
              </button>
            </div>
          </div>

        </div>
      )}

      {/* --- TABLAS DE DATOS (ESTILO LISTA MODERNA) --- */}
      {vistaActual !== 'hub' && (
        <div className="space-y-4">
          {listadoFiltrado.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#415364]/10 p-12 text-center">
              <p className="text-sm font-medium text-[#415364]/50">No hay registros que coincidan con tu búsqueda.</p>
            </div>
          ) : (
            listadoFiltrado.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl border border-[#415364]/10 p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-widest ${item.tipo === 'cliente' ? 'bg-[#ea0029]/10 text-[#ea0029]' : 'bg-[#415364]/5 text-[#415364]/60'}`}>
                      {item.tipo === 'cliente' ? 'INVERSIONISTA KYC' : (item.estado || 'PROSPECTO')}
                    </span>
                    <span className="text-[10px] font-bold text-[#ea0029] uppercase">
                      • {item.ingresado_por || 'Origen Web'}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-[#415364]">{item.nombres} {item.apellidos}</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-[#415364]/70 font-medium">
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                      {item.telefono || 'Sin número'}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                      {item.email || 'Sin correo'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch md:items-end lg:items-center gap-2 md:w-auto">
                  {item.tipo === 'prospecto' && (
                    <button
                      onClick={() => convertirACliente(item)}
                      className="px-4 py-2 bg-[#ea0029]/10 text-[#ea0029] hover:bg-[#ea0029] hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors whitespace-nowrap"
                    >
                      Convertir a KYC
                    </button>
                  )}
                  <button
                    onClick={() => abrirEditarModal(item)}
                    className="px-4 py-2 bg-white border border-[#415364]/20 text-[#415364] hover:bg-[#415364] hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors whitespace-nowrap text-center"
                  >
                    Editar Perfil
                  </button>
                </div>

              </div>
            ))
          )}
        </div>
      )}

      {/* --- MODAL DE EXPEDIENTE --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#21242E]/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            {/* Header del Modal */}
            <div className="px-6 py-5 bg-[#21242E] flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {modoModal === 'crear' 
                    ? (modalTipo === 'prospecto' ? 'Alta de Nuevo Lead' : 'Expediente Único KYC')
                    : `Editando: ${nombres} ${apellidos}`}
                </h2>
                <p className="text-[10px] text-white/50 uppercase tracking-widest mt-1">Gestión Segura de Datos Konkeri</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-white/50 hover:text-white bg-white/10 rounded-full w-8 h-8 flex items-center justify-center transition-colors">✕</button>
            </div>
            
            {/* Cuerpo del Formulario */}
            <form onSubmit={handleGuardar} className="flex-1 overflow-y-auto p-6 space-y-8 bg-[#dce3eb]/30 text-left custom-scrollbar">
              
              {/* Sección 1 */}
              <div className="bg-white p-6 rounded-2xl border border-[#415364]/10 shadow-sm space-y-4">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#415364] border-b border-[#415364]/10 pb-2">1. Datos Personales y Contacto</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-bold text-[#415364]/60 uppercase mb-1.5">Nombres *</label>
                    <input type="text" required value={nombres} onChange={(e) => setNombres(e.target.value)} className="w-full px-4 py-2.5 border border-[#415364]/20 rounded-xl text-sm bg-white focus:border-[#ea0029] focus:ring-1 focus:ring-[#ea0029]/20 outline-none transition-all text-[#415364]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#415364]/60 uppercase mb-1.5">Apellidos *</label>
                    <input type="text" required value={apellidos} onChange={(e) => setApellidos(e.target.value)} className="w-full px-4 py-2.5 border border-[#415364]/20 rounded-xl text-sm bg-white focus:border-[#ea0029] focus:ring-1 focus:ring-[#ea0029]/20 outline-none transition-all text-[#415364]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#415364]/60 uppercase mb-1.5">WhatsApp / Celular *</label>
                    <input type="tel" required value={telefono} onChange={(e) => setTelefono(e.target.value)} className="w-full px-4 py-2.5 border border-[#415364]/20 rounded-xl text-sm bg-white focus:border-[#ea0029] focus:ring-1 focus:ring-[#ea0029]/20 outline-none transition-all text-[#415364] font-medium" placeholder="Ej. 0991234567" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#415364]/60 uppercase mb-1.5">Correo Electrónico</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2.5 border border-[#415364]/20 rounded-xl text-sm bg-white focus:border-[#ea0029] focus:ring-1 focus:ring-[#ea0029]/20 outline-none transition-all text-[#415364]" placeholder="cliente@correo.com" />
                  </div>
                </div>
              </div>

              {/* BLOQUE KYC EXTENDIDO (SOLO CLIENTES) */}
              {modalTipo === 'cliente' && (
                <>
                  {/* Sección 2 */}
                  <div className="bg-white p-6 rounded-2xl border border-[#415364]/10 shadow-sm space-y-4">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#ea0029] border-b border-[#ea0029]/20 pb-2">2. Documentación Oficial (KYC)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      <div>
                        <label className="block text-[10px] font-bold text-[#415364]/60 uppercase mb-1.5">Tipo ID</label>
                        <select value={tipoIdentificacion} onChange={(e) => setTipoIdentificacion(e.target.value)} className="w-full px-4 py-2.5 border border-[#415364]/20 rounded-xl text-sm bg-white focus:border-[#ea0029] outline-none font-medium text-[#415364]">
                          <option value="Cédula">Cédula</option>
                          <option value="RUC">RUC</option>
                          <option value="Pasaporte">Pasaporte</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-[#415364]/60 uppercase mb-1.5">Número de Documento *</label>
                        <input type="text" required={modalTipo === 'cliente'} value={identificacion} onChange={(e) => setIdentificacion(e.target.value)} className="w-full px-4 py-2.5 border border-[#415364]/20 rounded-xl text-sm bg-white focus:border-[#ea0029] outline-none transition-all font-mono text-[#415364]" placeholder="Ej. 131..." />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#415364]/60 uppercase mb-1.5">Nacionalidad</label>
                        <input type="text" value={nacionalidad} onChange={(e) => setNacionalidad(e.target.value)} className="w-full px-4 py-2.5 border border-[#415364]/20 rounded-xl text-sm bg-white focus:border-[#ea0029] outline-none transition-all text-[#415364]" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#415364]/60 uppercase mb-1.5">Fecha Nacimiento</label>
                        <input type="date" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} className="w-full px-4 py-2.5 border border-[#415364]/20 rounded-xl text-sm bg-white focus:border-[#ea0029] outline-none transition-all text-[#415364]" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#415364]/60 uppercase mb-1.5">Estado Civil</label>
                        <select value={estadoCivil} onChange={(e) => setEstadoCivil(e.target.value)} className="w-full px-4 py-2.5 border border-[#415364]/20 rounded-xl text-sm bg-white focus:border-[#ea0029] outline-none font-medium text-[#415364]">
                          <option value="Soltero/a">Soltero/a</option>
                          <option value="Casado/a">Casado/a</option>
                          <option value="Divorciado/a">Divorciado/a</option>
                          <option value="Unión de Hecho">Unión de Hecho</option>
                          <option value="Viudo/a">Viudo/a</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-[#415364]/60 uppercase mb-1.5">Dirección Domiciliaria Exacta</label>
                        <input type="text" value={direccionDomicilio} onChange={(e) => setDireccionDomicilio(e.target.value)} className="w-full px-4 py-2.5 border border-[#415364]/20 rounded-xl text-sm bg-white focus:border-[#ea0029] outline-none text-[#415364]" placeholder="Ciudad, calles, número" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#415364]/60 uppercase mb-1.5">Cargas Familiares</label>
                        <input type="number" min="0" value={cargasFamiliares} onChange={(e) => setCargasFamiliares(e.target.value)} className="w-full px-4 py-2.5 border border-[#415364]/20 rounded-xl text-sm bg-white focus:border-[#ea0029] outline-none text-[#415364]" placeholder="0" />
                      </div>
                    </div>

                    {/* Sub-sección Cónyuge */}
                    {(estadoCivil === 'Casado/a' || estadoCivil === 'Unión de Hecho') && (
                      <div className="bg-[#415364]/5 p-5 rounded-xl border border-[#415364]/10 mt-4">
                        <span className="text-[10px] font-bold text-[#415364] uppercase tracking-widest block mb-4">Información del Cónyuge</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[9px] font-bold text-[#415364]/60 uppercase mb-1">Nombres Completos</label>
                            <input type="text" value={nombresConyuge} onChange={(e) => setNombresConyuge(e.target.value)} className="w-full px-3 py-2 border border-[#415364]/20 rounded-lg text-sm bg-white outline-none focus:border-[#ea0029] text-[#415364]" />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-[#415364]/60 uppercase mb-1">Apellidos Completos</label>
                            <input type="text" value={apellidosConyuge} onChange={(e) => setApellidosConyuge(e.target.value)} className="w-full px-3 py-2 border border-[#415364]/20 rounded-lg text-sm bg-white outline-none focus:border-[#ea0029] text-[#415364]" />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-[#415364]/60 uppercase mb-1">Identificación</label>
                            <input type="text" value={identificacionConyuge} onChange={(e) => setIdentificacionConyuge(e.target.value)} className="w-full px-3 py-2 border border-[#415364]/20 rounded-lg text-sm bg-white outline-none font-mono focus:border-[#ea0029] text-[#415364]" />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-[#415364]/60 uppercase mb-1">Celular de Contacto</label>
                            <input type="tel" value={celularConyuge} onChange={(e) => setCelularConyuge(e.target.value)} className="w-full px-3 py-2 border border-[#415364]/20 rounded-lg text-sm bg-white outline-none font-mono focus:border-[#ea0029] text-[#415364]" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sección 3 */}
                  <div className="bg-white p-6 rounded-2xl border border-[#415364]/10 shadow-sm space-y-4">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#415364] border-b border-[#415364]/10 pb-2">3. Perfil Financiero y Respaldo</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[10px] font-bold text-[#415364]/60 uppercase mb-1.5">Empresa de Trabajo</label>
                        <input type="text" value={empresaTrabajo} onChange={(e) => setEmpresaTrabajo(e.target.value)} className="w-full px-4 py-2.5 border border-[#415364]/20 rounded-xl text-sm bg-white focus:border-[#ea0029] outline-none text-[#415364]" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#415364]/60 uppercase mb-1.5">Cargo que Ocupa</label>
                        <input type="text" value={cargo} onChange={(e) => setCargo(e.target.value)} className="w-full px-4 py-2.5 border border-[#415364]/20 rounded-xl text-sm bg-white focus:border-[#ea0029] outline-none text-[#415364]" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#415364]/60 uppercase mb-1.5">Ingresos Mensuales ($)</label>
                        <input type="number" step="0.01" value={ingresosMensuales} onChange={(e) => setIngresosMensuales(e.target.value)} className="w-full px-4 py-2.5 border border-[#415364]/20 rounded-xl text-sm bg-white focus:border-[#ea0029] outline-none font-mono text-[#415364]" placeholder="0.00" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#415364]/60 uppercase mb-1.5">Gastos Mensuales ($)</label>
                        <input type="number" step="0.01" value={gastosMensuales} onChange={(e) => setGastosMensuales(e.target.value)} className="w-full px-4 py-2.5 border border-[#415364]/20 rounded-xl text-sm bg-white focus:border-[#ea0029] outline-none font-mono text-[#415364]" placeholder="0.00" />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Sección 4: Configuración Comercial */}
              <div className="bg-white p-6 rounded-2xl border border-[#415364]/10 shadow-sm space-y-4">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#415364] border-b border-[#415364]/10 pb-2">
                  {modalTipo === 'prospecto' ? '2. Gestión Comercial' : '4. Trazabilidad Comercial'}
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-bold text-[#415364]/60 uppercase mb-1.5">Ciudad Residencia</label>
                    <input type="text" placeholder="Ej. Manta, Quito" value={ciudadResidencia} onChange={(e) => setCiudadResidencia(e.target.value)} className="w-full px-4 py-2.5 border border-[#415364]/20 rounded-xl text-sm bg-white focus:border-[#ea0029] outline-none text-[#415364]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#415364]/60 uppercase mb-1.5">Asesor Responsable</label>
                    <input type="text" value={ingresadoPor} onChange={(e) => setIngresadoPor(e.target.value)} className="w-full px-4 py-2.5 border border-[#415364]/20 rounded-xl text-sm font-bold bg-[#415364]/5 focus:border-[#ea0029] outline-none text-[#415364]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#415364]/60 uppercase mb-1.5">Canal de Captación</label>
                    <select value={origenCaptacion} onChange={(e) => setOrigenCaptacion(e.target.value)} className="w-full px-4 py-2.5 border border-[#415364]/20 rounded-xl text-sm bg-white focus:border-[#ea0029] outline-none font-medium text-[#415364]">
                      <option value="Meta Ads">Meta Ads (FB/IG)</option>
                      <option value="Sitio Web">Landing Page</option>
                      <option value="Valla Publicitaria">Valla Obra</option>
                      <option value="Referido">Referido</option>
                      <option value="Broker">Broker Inmobiliario</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#415364]/60 uppercase mb-1.5">Tipología Buscada</label>
                    <select value={tipologiaInteres} onChange={(e) => setTipologiaInteres(e.target.value)} className="w-full px-4 py-2.5 border border-[#415364]/20 rounded-xl text-sm bg-white focus:border-[#ea0029] outline-none font-medium text-[#415364]">
                      <option value="Suite">Suite (1 Dormitorio)</option>
                      <option value="2 Dormitorios">2 Dormitorios</option>
                      <option value="3 Dormitorios">3 Dormitorios</option>
                      <option value="Penthouse">Penthouse</option>
                      <option value="Local Comercial">Local Comercial</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-[#415364]/60 uppercase mb-1.5">Notas del Asesor</label>
                    <textarea rows={3} value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Agrega requerimientos específicos, historial de llamadas o dudas del cliente..." className="w-full px-4 py-3 border border-[#415364]/20 rounded-xl text-sm bg-white focus:border-[#ea0029] outline-none resize-none transition-all text-[#415364]" />
                  </div>
                </div>
              </div>

            </form>

            {/* Footer Botones */}
            <div className="px-6 py-5 bg-white border-t border-[#415364]/10 flex justify-end gap-4 shrink-0">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 border border-[#415364]/20 rounded-xl text-sm font-bold text-[#415364] hover:bg-[#415364]/5 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleGuardar}
                className="px-8 py-2.5 bg-[#ea0029] hover:bg-[#c90022] text-white rounded-xl text-sm font-bold tracking-wider transition-colors shadow-md"
              >
                {modoModal === 'crear' ? 'Guardar Expediente' : 'Actualizar Datos'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}