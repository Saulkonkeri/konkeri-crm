'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

export default function PaginaAccesoDirecto() {
  const [formData, setFormData] = useState({ nombres: '', telefono: '', email: '' });
  const [cargando, setCargando] = useState(false);
  const [solicitudEnviada, setSolicitudEnviada] = useState(false);

  // ==========================================
  // TRACKING SILENCIOSO (Radar, Meta, GA4)
  // ==========================================
  const trackEvent = async (accion: string, detalle: string) => {
    try {
      let visitorId = localStorage.getItem('arienzo_visitor_id');
      if (!visitorId) {
        visitorId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'id-' + Math.random().toString(36).substring(2, 10);
        localStorage.setItem('arienzo_visitor_id', visitorId);
      }

      let sessionId = sessionStorage.getItem('arienzo_session_id');
      if (!sessionId) {
        sessionId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'sess-' + Math.random().toString(36).substring(2, 10);
        sessionStorage.setItem('arienzo_session_id', sessionId);
      }

      const eventId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'evt-' + Date.now();
      const emailConocido = formData.email || localStorage.getItem('arienzo_lead_email') || 'Anónimo';

      await supabase.from('tracking_inventario').insert([{
        visitor_id: visitorId,
        session_id: sessionId,
        email_cliente: emailConocido,
        accion,
        detalle,
        metadata: { fuente: 'Página de Acceso Directo (Squeeze Page)' }
      }]);

      if (typeof window !== 'undefined' && (window as any).fbq) {
        const fbq = (window as any).fbq;
        if (accion === 'REGISTRO_COMPLETADO') {
          fbq('track', 'Lead', { content_name: 'Registro VIP Directo', em: formData.email, ph: formData.telefono }, { eventID: eventId });
        } else {
          fbq('trackCustom', accion, { detalle }, { eventID: eventId });
        }
      }

      if (['REGISTRO_COMPLETADO'].includes(accion)) {
        fetch('/api/meta-capi', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventName: 'Lead',
            eventId: eventId,
            email: formData.email,
            telefono: formData.telefono,
            eventUrl: window.location.href,
            userAgent: navigator.userAgent
          })
        }).catch(() => {});
      }

      if (typeof window !== 'undefined' && typeof (window as any).gtag !== 'undefined') {
        const gtag = (window as any).gtag;
        if (accion === 'REGISTRO_COMPLETADO') {
          gtag('event', 'generate_lead', { event_category: 'engagement', event_label: 'Acceso Directo' });
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    trackEvent('VISITA_LANDING_DIRECTA', 'Ingresó al link directo de captura (/acceso)');
  }, []);

  const procesarSolicitudVIP = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    const correoLimpio = formData.email.trim().toLowerCase();

    try {
      // 1. Guardar en Supabase directo al tablero Kanban
      const { error: errorCliente } = await supabase.from('clientes').upsert([{
        nombres: formData.nombres,
        telefono: formData.telefono,
        email: correoLimpio,
        tipo: 'prospecto',
        origen: 'Web Pública - Solicitud Acceso Exclusivo', 
        origen_captacion: 'Link Directo (Redes Sociales)', // Identificador especial
        campana: 'Captura Directa',
        estado: 'Interesado', // Va a tu Kanban
        temperatura: '☀️ Tibio',
        estado_acceso: 'pendiente'
      }], { onConflict: 'email' });

      if (errorCliente) {
        await supabase.from('clientes').update({ 
          estado_acceso: 'pendiente', 
          nombres: formData.nombres, 
          telefono: formData.telefono, 
          estado: 'Interesado',
          temperatura: '☀️ Tibio'
        }).eq('email', correoLimpio);
      }

      localStorage.setItem('arienzo_lead_email', correoLimpio);
      await trackEvent('REGISTRO_COMPLETADO', `Se registró desde link directo. Correo: ${correoLimpio}`);

      setSolicitudEnviada(true);
    } catch (error) {
      alert("Hubo un problema procesando tu solicitud.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#21242E] flex flex-col items-center justify-center p-4 relative overflow-hidden" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      
      {/* Fondo elegante borroso */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <Image 
          src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/render-Exterior-Fronta.jpg" 
          alt="Fondo Arienzo" fill className="object-cover blur-sm"
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo Superior */}
        <div className="flex justify-center mb-8">
          <Image 
            src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/arienzo-logo-blanco.svg" 
            alt="Arienzo" width={180} height={40} className="h-auto drop-shadow-xl"
          />
        </div>

        {/* Tarjeta del Formulario */}
        <div className="bg-white w-full p-8 md:p-10 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-500">
          {!solicitudEnviada ? (
            <>
              <div className="text-center mb-8">
                <div className="w-12 h-1 bg-[#964B36] mx-auto mb-6 rounded-full"></div>
                {/* AQUÍ ESTÁ EL CAMBIO DE TÍTULO PARA DIFERENCIARLO */}
                <h1 className="text-2xl font-medium text-neutral-900 mb-2 tracking-tight">Registro Directo VIP</h1>
                <p className="text-xs text-neutral-500 font-medium">
                  Validaremos tu perfil para habilitar el acceso seguro a los <strong>planos, disponibilidad y precios de lanzamiento.</strong>
                </p>
              </div>

              <form onSubmit={procesarSolicitudVIP} className="space-y-4">
                <div>
                  {/* AUTOFILL + BLOQUEO DE NÚMEROS */}
                  <input 
                    required type="text" placeholder="Nombres Completos" autoComplete="name"
                    value={formData.nombres} 
                    onChange={e => setFormData({...formData, nombres: e.target.value.replace(/[0-9!@#$%^&*()_+=\[\]{};':"\\|,.<>/?]/g, '')})} 
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm font-medium focus:outline-none focus:border-[#964B36] transition-colors" 
                  />
                </div>
                <div>
                  {/* AUTOFILL + BLOQUEO DE LETRAS + MÁX 10 DÍGITOS */}
                  <input 
                    required type="tel" placeholder="WhatsApp (Solo números)" autoComplete="tel"
                    value={formData.telefono} 
                    onChange={e => setFormData({...formData, telefono: e.target.value.replace(/\D/g, '').slice(0, 10)})} 
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm font-medium focus:outline-none focus:border-[#964B36] transition-colors" 
                  />
                </div>
                <div>
                  {/* AUTOFILL + VALIDACIÓN ESTRICTA DE CORREO */}
                  <input 
                    required type="email" placeholder="Correo Electrónico" autoComplete="email"
                    pattern="^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$" title="Debe incluir @ y un dominio válido (ej. correo@gmail.com)"
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm font-medium focus:outline-none focus:border-[#964B36] transition-colors invalid:focus:border-red-400" 
                  />
                </div>
                
                <button 
                  type="submit" disabled={cargando}
                  className="w-full bg-[#964B36] text-white py-4 rounded-xl text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-[#7d3e2c] transition-all mt-4 shadow-[0_4px_20px_rgba(150,75,54,0.3)] disabled:opacity-70 flex justify-center items-center gap-2 hover:-translate-y-0.5"
                >
                  {cargando ? 'Procesando...' : 'Solicitar Pase Exclusivo'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl shadow-inner">✓</div>
              <h3 className="text-2xl font-medium text-neutral-900 mb-3 tracking-tight">Solicitud Recibida</h3>
              <p className="text-sm text-neutral-500 font-medium leading-relaxed mb-8">
                Nuestro equipo comercial validará tu información y te contactará brevemente por WhatsApp para entregarte tu pase de acceso.
              </p>
              <a 
                href="/"
                className="block w-full bg-neutral-900 text-white rounded-xl px-8 py-4 text-[11px] font-bold uppercase tracking-widest hover:bg-neutral-800 transition-colors"
              >
                Cerrar y volver al inicio
              </a>
            </div>
          )}
        </div>

        {/* Link de retorno abajo */}
        {!solicitudEnviada && (
          <div className="mt-8 text-center">
            <a href="/" className="text-[10px] text-white/60 hover:text-white uppercase tracking-widest font-bold transition-colors">
              ← Volver a la página principal
            </a>
          </div>
        )}
      </div>
    </div>
  );
}