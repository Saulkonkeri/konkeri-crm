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

    // --- PROTECCIÓN ANTI-DUPLICADOS ---
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
    // --- FIN PROTECCIÓN ANTI-DUPLICADOS ---
    
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
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans text-neutral-800">
      
      {vistaActual !== 'hub' && (
        <div className="flex justify-between items-center">
          <button 
            onClick={() => { setVistaActual('hub'); setBusquedaTexto(''); }}
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-neutral-900 transition"
          >
            ← Volver al Panel de Clientes
          </button>
        </div>
      )}

      <div className="border-b border-neutral-200 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-widest text-[#B94A36] uppercase">Arienzo Boutique Living</span>
          <h1 className="text-3xl font-light tracking-tight text-neutral-900 mt-1">
            {vistaActual === 'hub' && 'Gestión de Clientes y Leads'}
            {vistaActual === 'lista_general' && 'Directorio General de Leads Activos'}
            {vistaActual === 'lista_clientes' && 'Expedientes de Clientes Inversionistas'}
          </h1>
        </div>

        {vistaActual !== 'hub' && (
          <div className="relative w-full md:w-80">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400 text-xs">🔍</span>
            <input 
              type="text" 
              placeholder="Buscar por nombre, teléfono, asesor..." 
              value={busquedaTexto} 
              onChange={(e) => setBusquedaTexto(e.target.value)}
              className="w-full bg-white border border-neutral-200 rounded-lg py-2 pl-9 pr-3 text-xs font-medium focus:outline-none focus:border-[#B94A36] shadow-xs"
            />
          </div>
        )}
      </div>

      {/* --- HUB DE CLIENTES --- */}
      {vistaActual === 'hub' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          
          <div className="bg-white border border-neutral-200 rounded-xl p-6 flex flex-col justify-between space-y-6 shadow-xs hover:border-neutral-300 transition-all">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-2xl">💼</span>
                <span className="text-xs font-medium text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-full">
                  {cargando ? '...' : `${totalProspectos} registros`}
                </span>
              </div>
              <h2 className="text-lg font-semibold text-neutral-900">Directorio General de Leads</h2>
              <p className="text-sm text-neutral-500 font-light leading-relaxed">
                Administra los perfiles de todos los prospectos activos, verifica quién los ingresó y actualiza su información comercial.
              </p>
            </div>
            <div className="flex gap-3 pt-2 text-sm font-medium">
              <button
                onClick={() => { limpiarFormulario(); setModoModal('crear'); setModalTipo('prospecto'); setIsModalOpen(true); }}
                className="flex-1 bg-neutral-950 text-white py-2.5 px-4 rounded-lg hover:bg-neutral-800 transition"
              >
                + Registrar Lead
              </button>
              <button
                onClick={() => { setBusquedaTexto(''); setVistaActual('lista_general'); }}
                className="flex-1 border border-neutral-200 text-neutral-700 py-2.5 px-4 rounded-lg hover:bg-neutral-50 transition"
              >
                Ver Directorio
              </button>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl p-6 flex flex-col justify-between space-y-6 shadow-xs hover:border-neutral-300 transition-all">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-2xl">🏢</span>
                <span className="text-xs font-medium text-[#B94A36] bg-[#B94A36]/10 px-2.5 py-1 rounded-full">
                  {cargando ? '...' : `${totalClientes} formalizados`}
                </span>
              </div>
              <h2 className="text-lg font-semibold text-neutral-900">Expedientes de Inversionistas</h2>
              <p className="text-sm text-neutral-500 font-light leading-relaxed">
                Registros patrimoniales, datos conyugales y documentación de compradores que avanzaron hacia el cierre o reserva.
              </p>
            </div>
            <div className="flex gap-3 pt-2 text-sm font-medium">
              <button
                onClick={() => { limpiarFormulario(); setModoModal('crear'); setModalTipo('cliente'); setIsModalOpen(true); }}
                className="flex-1 bg-neutral-950 text-white py-2.5 px-4 rounded-lg hover:bg-neutral-800 transition"
              >
                + Registrar Cliente
              </button>
              <button
                onClick={() => { setBusquedaTexto(''); setVistaActual('lista_clientes'); }}
                className="flex-1 border border-neutral-200 text-neutral-700 py-2.5 px-4 rounded-lg hover:bg-neutral-50 transition"
              >
                Ver Inversionistas
              </button>
            </div>
          </div>

        </div>
      )}

      {/* --- TABLAS DE DATOS --- */}
      {vistaActual !== 'hub' && (
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs animate-in fade-in duration-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 text-left text-xs sm:text-sm">
              <thead className="bg-neutral-50 text-neutral-500 font-medium uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5">Nombre Completo</th>
                  <th className="px-6 py-3.5">Contacto</th>
                  <th className="px-6 py-3.5">Asesor Emisor</th>
                  <th className="px-6 py-3.5">Fase / Estado</th>
                  <th className="px-6 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700">
                {listadoFiltrado.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-neutral-400 italic font-light">
                      No se encontraron registros en esta sección.
                    </td>
                  </tr>
                ) : (
                  listadoFiltrado.map((item) => (
                    <tr key={item.id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="px-6 py-4 font-semibold text-neutral-900">{item.nombres} {item.apellidos}</td>
                      <td className="px-6 py-4 space-y-0.5">
                        <span className="block text-neutral-800 font-medium">{item.telefono || '—'}</span>
                        <span className="block text-neutral-400 text-xs font-light">{item.email || '—'}</span>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-[#B94A36]">
                        {item.ingresado_por || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold border ${item.tipo === 'cliente' ? 'bg-[#B94A36]/10 text-[#B94A36] border-[#B94A36]/20' : 'bg-neutral-100 text-neutral-800 border-neutral-200/60'}`}>
                          {item.tipo === 'cliente' ? 'Inversionista' : (item.estado || 'Interesado')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-3">
                        {item.tipo === 'prospecto' && (
                          <button
                            onClick={() => convertirACliente(item)}
                            className="text-[#B94A36] hover:text-[#9B3B2B] font-bold text-xs transition"
                          >
                            + Convertir a Inversionista
                          </button>
                        )}
                        <button
                          onClick={() => abrirEditarModal(item)}
                          className="text-neutral-500 hover:text-neutral-950 font-medium underline text-xs transition"
                        >
                          Editar perfil
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          {/* Ajuste de max-w-3xl para que no se vea tan ancho en pantallas grandes */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-2xl max-w-3xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 bg-neutral-50 border-b border-neutral-200 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-base font-bold text-neutral-900">
                  {modoModal === 'crear' 
                    ? (modalTipo === 'prospecto' ? 'Alta de Prospecto Comercial' : 'Expediente Único de Cliente Inversionista')
                    : `Modificar Perfil: ${nombres} ${apellidos}`}
                </h2>
                <p className="text-[11px] text-neutral-400 font-light mt-0.5">Asegura ingresar la información verídica para auditorías del proyecto.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-neutral-600 text-sm p-1">✕</button>
            </div>
            
            <form onSubmit={handleGuardar} className="flex-1 overflow-y-auto p-6 space-y-6 text-left custom-scrollbar">
              
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 border-b pb-1">1. Datos Personales de Contacto</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Nombres *</label>
                    <input type="text" required value={nombres} onChange={(e) => setNombres(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:border-[#B94A36] outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Apellidos *</label>
                    <input type="text" required value={apellidos} onChange={(e) => setApellidos(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:border-[#B94A36] outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">WhatsApp / Celular *</label>
                    <input type="tel" required value={telefono} onChange={(e) => setTelefono(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:border-[#B94A36] outline-none transition-all" placeholder="Ej. 0991234567" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Correo Electrónico</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:border-[#B94A36] outline-none transition-all" placeholder="cliente@correo.com" />
                  </div>
                </div>
              </div>

              {/* BLOQUE KYC EXTENDIDO (SOLO CLIENTES) */}
              {modalTipo === 'cliente' && (
                <>
                  <div className="space-y-4 pt-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#B94A36] border-b pb-1">2. Documentación e Identidad (KYC)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Tipo ID</label>
                        <select value={tipoIdentificacion} onChange={(e) => setTipoIdentificacion(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:border-[#B94A36] outline-none font-medium">
                          <option value="Cédula">Cédula</option>
                          <option value="RUC">RUC</option>
                          <option value="Pasaporte">Pasaporte</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Número de Documento *</label>
                        <input type="text" required={modalTipo === 'cliente'} value={identificacion} onChange={(e) => setIdentificacion(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:border-[#B94A36] outline-none transition-all font-mono" placeholder="Ej. 131xxxxxxx" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Nacionalidad</label>
                        <input type="text" value={nacionalidad} onChange={(e) => setNacionalidad(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:border-[#B94A36] outline-none transition-all" placeholder="Ej. Ecuatoriana" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Fecha Nacimiento</label>
                        <input type="date" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:border-[#B94A36] outline-none transition-all" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Estado Civil</label>
                        <select value={estadoCivil} onChange={(e) => setEstadoCivil(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:border-[#B94A36] outline-none font-medium">
                          <option value="Soltero/a">Soltero/a</option>
                          <option value="Casado/a">Casado/a</option>
                          <option value="Divorciado/a">Divorciado/a</option>
                          <option value="Unión de Hecho">Unión de Hecho</option>
                          <option value="Viudo/a">Viudo/a</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Dirección Domiciliaria Exacta</label>
                        <input type="text" value={direccionDomicilio} onChange={(e) => setDireccionDomicilio(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:border-[#B94A36] outline-none" placeholder="Ciudad, calles, número" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Cargas Familiares</label>
                        <input type="number" min="0" value={cargasFamiliares} onChange={(e) => setCargasFamiliares(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:border-[#B94A36] outline-none" placeholder="0" />
                      </div>
                    </div>

                    {(estadoCivil === 'Casado/a' || estadoCivil === 'Unión de Hecho') && (
                      <div className="bg-neutral-50 p-5 rounded-lg border border-neutral-200 space-y-4">
                        <span className="text-[10px] font-bold text-[#B94A36] uppercase tracking-wider block border-b border-neutral-200 pb-1.5">Información de la Cónyuge / Esposa</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[9px] font-bold text-neutral-500 uppercase mb-1">Nombres Completos</label>
                            <input type="text" value={nombresConyuge} onChange={(e) => setNombresConyuge(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white outline-none focus:border-[#B94A36]" />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-neutral-500 uppercase mb-1">Apellidos Completos</label>
                            <input type="text" value={apellidosConyuge} onChange={(e) => setApellidosConyuge(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white outline-none focus:border-[#B94A36]" />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-neutral-500 uppercase mb-1">Identificación</label>
                            <input type="text" value={identificacionConyuge} onChange={(e) => setIdentificacionConyuge(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white outline-none font-mono focus:border-[#B94A36]" />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-neutral-500 uppercase mb-1">Nacionalidad</label>
                            <input type="text" value={nacionalidadConyuge} onChange={(e) => setNacionalidadConyuge(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white outline-none focus:border-[#B94A36]" />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-neutral-500 uppercase mb-1">Fecha Nacimiento</label>
                            <input type="date" value={fechaNacimientoConyuge} onChange={(e) => setFechaNacimientoConyuge(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white outline-none focus:border-[#B94A36]" />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-neutral-500 uppercase mb-1">Celular de Contacto</label>
                            <input type="tel" value={celularConyuge} onChange={(e) => setCelularConyuge(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white outline-none font-mono focus:border-[#B94A36]" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 pt-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 border-b pb-1">3. Perfil Laboral y Contacto Alterno</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Empresa de Trabajo</label>
                        <input type="text" value={empresaTrabajo} onChange={(e) => setEmpresaTrabajo(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:border-[#B94A36] outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Cargo que Ocupa</label>
                        <input type="text" value={cargo} onChange={(e) => setCargo(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:border-[#B94A36] outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Ingresos Mensuales ($)</label>
                        <input type="number" step="0.01" value={ingresosMensuales} onChange={(e) => setIngresosMensuales(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:border-[#B94A36] outline-none font-mono" placeholder="0.00" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Gastos Mensuales ($)</label>
                        <input type="number" step="0.01" value={gastosMensuales} onChange={(e) => setGastosMensuales(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:border-[#B94A36] outline-none font-mono" placeholder="0.00" />
                      </div>
                    </div>

                    <div className="bg-neutral-50 p-5 rounded-lg border border-neutral-200 space-y-4">
                      <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider block border-b border-neutral-200 pb-1.5">Familiar de Contacto (Que no viva con usted)</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                          <label className="block text-[9px] font-bold text-neutral-500 uppercase mb-1">Nombre Completo del Familiar</label>
                          <input type="text" value={familiarNombre} onChange={(e) => setFamiliarNombre(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white outline-none focus:border-[#B94A36]" />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-neutral-500 uppercase mb-1">Celular / Teléfono</label>
                          <input type="tel" value={familiarCelular} onChange={(e) => setFamiliarCelular(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white outline-none font-mono focus:border-[#B94A36]" />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-neutral-500 uppercase mb-1">Dirección de Domicilio</label>
                          <input type="text" value={familiarDireccion} onChange={(e) => setFamiliarDireccion(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white outline-none focus:border-[#B94A36]" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 border-b pb-1">4. Estructuración y Notificaciones</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Emitir Contrato a Nombre de:</label>
                        <input type="text" value={emitirContratoA} onChange={(e) => setEmitirContratoA(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:border-[#B94A36] outline-none" placeholder="Titular o Empresa" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Banco para Precalificación (Si aplica)</label>
                        <input type="text" value={bancoPrecalificacion} onChange={(e) => setBancoPrecalificacion(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:border-[#B94A36] outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Día de Pago Preferido (Mes)</label>
                        <input type="number" min="1" max="31" value={diaPago} onChange={(e) => setDiaPago(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:border-[#B94A36] outline-none" placeholder="Ej. 5" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Envío de Correspondencia a:</label>
                        <select value={direccionCorrespondencia} onChange={(e) => setDireccionCorrespondencia(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:border-[#B94A36] outline-none font-medium">
                          <option value="Domicilio">Domicilio</option>
                          <option value="Trabajo">Trabajo</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 border-b pb-1">
                  {modalTipo === 'prospecto' ? '2. Preferencias de Compra e Ingreso' : '5. Trazabilidad de Campaña y Asesor'}
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Ciudad de Origen</label>
                    <input type="text" placeholder="Ej. Manta, Quito" value={ciudadResidencia} onChange={(e) => setCiudadResidencia(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:border-[#B94A36] outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Ingresado Por (Asesor)</label>
                    <input type="text" value={ingresadoPor} onChange={(e) => setIngresadoPor(e.target.value)} placeholder="Ej. Saúl Intriago" className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm font-semibold bg-neutral-50 focus:bg-white focus:border-[#B94A36] outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Origen de Captación</label>
                    <select value={origenCaptacion} onChange={(e) => setOrigenCaptacion(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:border-[#B94A36] outline-none font-medium text-neutral-700">
                      <option value="Meta Ads">Meta Ads</option>
                      <option value="Instagram Ads">Instagram Ads</option>
                      <option value="Facebook Ads">Facebook Ads</option>
                      <option value="Valla Publicitaria">Valla Publicitaria</option>
                      <option value="Referido">Referido</option>
                      <option value="Corredor / Broker">Corredor / Broker</option>
                      <option value="Sitio Web">Sitio Web</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Tipología Solicitada</label>
                    <select value={tipologiaInteres} onChange={(e) => setTipologiaInteres(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:border-[#B94A36] outline-none font-medium text-neutral-700">
                      <option value="Suite">Suite</option>
                      <option value="2 Dormitorios">2 Dormitorios</option>
                      <option value="3 Dormitorios">3 Dormitorios</option>
                      <option value="Penthouse">Penthouse</option>
                      <option value="Local Comercial">Local Comercial</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Motivo Comercial</label>
                    <select value={motivoCompra} onChange={(e) => setMotivoCompra(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:border-[#B94A36] outline-none font-medium text-neutral-700">
                      <option value="Para Invertir">Para Invertir</option>
                      <option value="Para Vivir">Para Vivir</option>
                      <option value="Segunda Residencia">Segunda Residencia</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Notas y Minuta de Seguimiento</label>
                    <textarea rows={3} value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Requerimientos específicos..." className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:border-[#B94A36] outline-none resize-none transition-all" />
                  </div>
                </div>
              </div>

            </form>

            <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 flex justify-end gap-3 text-sm font-medium shrink-0">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-neutral-200 rounded-lg text-neutral-600 hover:bg-neutral-100 transition"
              >
                Cancelar
              </button>
              <button 
                onClick={handleGuardar}
                className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg transition shadow-sm"
              >
                {modoModal === 'crear' ? 'Guardar Nuevo ' : 'Actualizar '}
                {modalTipo === 'prospecto' ? 'Prospecto' : 'Expediente'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}