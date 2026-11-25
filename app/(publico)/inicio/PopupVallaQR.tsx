'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function PopupVallaQR() {
  const [visible, setVisible] = useState(false);
  const [utmSource, setUtmSource] = useState('');
  const [nombres, setNombres] = useState('');
  const [telefono, setTelefono] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const sourceUrl = params.get('utm_source') || '';
    const mediumUrl = params.get('utm_medium') || 'impreso';
    const campaignUrl = params.get('utm_campaign') || 'valla_terreno';

    const sourceActivo = sourceUrl.toLowerCase().startsWith('qr')
      ? sourceUrl
      : sessionStorage.getItem('arienzo_qr_source') || '';

    if (!sourceActivo) return;

    setUtmSource(sourceActivo);
    sessionStorage.setItem('arienzo_qr_source', sourceActivo);

    // Registrar visita en Radar Web (1 vez por sesión)
    if (!sessionStorage.getItem('arienzo_qr_tracked')) {
      sessionStorage.setItem('arienzo_qr_tracked', '1');
      const visitorId = localStorage.getItem('arienzo_visitor_id') || `qr-${Date.now()}`;
      const sessionId = sessionStorage.getItem('arienzo_session_id') || `sess-${Date.now()}`;

      supabase.from('tracking_inventario').insert([{
        visitor_id: visitorId,
        session_id: sessionId,
        email_cliente: 'Anónimo',
        accion: 'VISITA_LANDING',
        detalle: `Escaneo QR físico (${sourceActivo})`,
        metadata: {
          utm_source: sourceActivo,
          utm_medium: mediumUrl,
          utm_campaign: campaignUrl
        }
      }]).then(() => {});
    }

    // Mostrar pop-up a los 4 segundos si no lo ha cerrado antes
    if (!sessionStorage.getItem('arienzo_qr_closed')) {
      const timer = setTimeout(() => {
        setVisible(true);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, []);

  const cerrarPopup = () => {
    setVisible(false);
    sessionStorage.setItem('arienzo_qr_closed', '1');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombres.trim() || !telefono.trim()) return;
    setEnviando(true);

    try {
      const ahora = new Date();
      const fechaStr = `${String(ahora.getDate()).padStart(2, '0')}/${String(ahora.getMonth() + 1).padStart(2, '0')}/${ahora.getFullYear()} ${ahora.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}`;
      const telLimpio = telefono.replace(/\D/g, '');
      const ultimos9 = telLimpio.slice(-9);

      let existente = null;
      if (ultimos9.length >= 8) {
        const { data } = await supabase
          .from('clientes')
          .select('id, notas')
          .ilike('telefono', `%${ultimos9}`)
          .maybeSingle();
        existente = data;
      }

      if (existente) {
        const notaActualizada = `[${fechaStr}] 📍 Escaneó QR (${utmSource}) y solicitó planos/precios.\n\n${existente.notas || ''}`;
        await supabase
          .from('clientes')
          .update({ notas: notaActualizada, campana: utmSource })
          .eq('id', existente.id);
      } else {
        await supabase.from('clientes').insert([{
          nombres: nombres.trim(),
          apellidos: '',
          telefono: telefono.trim(),
          origen_captacion: 'QR Valla Obra',
          campana: utmSource,
          estado: 'Interesado',
          temperatura: '🔥 Caliente',
          tipo: 'prospecto',
          ingresado_por: 'QR Valla Web',
          notas: `[${fechaStr}] 📍 Registrado desde QR de valla (${utmSource}). Solicitó planos y precios.`
        }]);
      }

      const visitorId = localStorage.getItem('arienzo_visitor_id') || `qr-${Date.now()}`;
      const sessionId = sessionStorage.getItem('arienzo_session_id') || `sess-${Date.now()}`;
      await supabase.from('tracking_inventario').insert([{
        visitor_id: visitorId,
        session_id: sessionId,
        email_cliente: `${nombres.trim()} (${telefono.trim()})`,
        accion: 'REGISTRO_COMPLETADO',
        detalle: `Lead captado desde QR Valla (${utmSource})`,
        metadata: { utm_source: utmSource, utm_campaign: 'valla_terreno' }
      }]);

      setEnviado(true);
      sessionStorage.setItem('arienzo_qr_closed', '1');
    } catch (error) {
      console.error('Error registrando lead QR:', error);
    } finally {
      setEnviando(false);
    }
  };

  if (!visible) return null;

  const linkWhatsAppDirecto = `https://wa.me/593985750640?text=${encodeURIComponent(
    `Hola, soy ${nombres || 'un interesado'}. Acabo de escanear el QR frente a Arienzo Living y me gustaría recibir los planos y precios de preventa.`
  )}`;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:w-[390px] z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-[#FDFCFB] border border-[#974932]/30 rounded-2xl shadow-2xl p-5 relative text-[#21242E]">
        <button
          onClick={cerrarPopup}
          aria-label="Cerrar ventana"
          className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 hover:text-[#21242E] flex items-center justify-center text-xs font-bold transition-colors"
        >
          ✕
        </button>

        {!enviado ? (
          <>
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#974932] block mb-1">
              Arienzo Living · Barbasquillo
            </span>
            <h3 className="text-base font-bold text-[#21242E] leading-snug pr-6">
              ¿Estás frente a nuestro proyecto?
            </h3>
            <p className="text-xs text-[#415364] mt-1 mb-4 leading-relaxed">
              Déjanos tu nombre y WhatsApp para enviarte al instante los planos, disponibilidad y precios de preventa.
            </p>

            <form onSubmit={handleSubmit} className="space-y-2.5">
              <input
                type="text"
                required
                placeholder="Tu nombre"
                value={nombres}
                onChange={(e) => setNombres(e.target.value)}
                className="w-full bg-white border border-neutral-300 focus:border-[#974932] rounded-xl px-3.5 py-2.5 text-xs outline-none text-[#21242E]"
              />
              <input
                type="tel"
                required
                placeholder="Tu número de WhatsApp (ej: 099...)"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full bg-white border border-neutral-300 focus:border-[#974932] rounded-xl px-3.5 py-2.5 text-xs outline-none text-[#21242E]"
              />
              <button
                type="submit"
                disabled={enviando}
                className="w-full bg-[#974932] hover:bg-[#7d3b27] text-white font-bold text-xs uppercase tracking-widest py-3 rounded-xl shadow-md transition-colors disabled:opacity-50"
              >
                {enviando ? 'Enviando...' : 'Recibir Planos y Precios'}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-2 space-y-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto font-bold text-lg">
              ✓
            </div>
            <h3 className="text-sm font-bold text-[#21242E]">
              ¡Gracias, {nombres}!
            </h3>
            <p className="text-xs text-[#415364] leading-relaxed">
              Ya registramos tu solicitud. También puedes abrir nuestro chat directo ahora mismo:
            </p>
            <a
              href={linkWhatsAppDirecto}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold text-xs uppercase tracking-widest py-3 rounded-xl shadow-sm transition-colors"
            >
              Abrir WhatsApp Ahora
            </a>
          </div>
        )}
      </div>
    </div>
  );
}