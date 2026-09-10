import { NextResponse } from 'next/server';
import crypto from 'crypto';

const META_PIXEL_ID = '1698482924903057';
const META_ACCESS_TOKEN = 'EAAPhFTv9UC0BSUZCvqInmwsSLf8H8zEqx3QpG737bkVFdaFnMtF69qMbEjQCVVfhIMFsBxatU3PII3nZCfkwUy7pjDyhKgfV5KMlSicCUW2xTX440xZCgOTFEaLSPcuZAFd0GL4E7H1pZCDXnqa45uBZC2EzRwM6ZBYYPCkxodt2p3sGeVeiemyf6H9usjz1QZDZD';

// Meta exige que los datos personales viajen encriptados (SHA256) por seguridad
function hashData(data: string) {
  if (!data) return undefined;
  return crypto.createHash('sha256').update(data.trim().toLowerCase()).digest('hex');
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { eventName, eventId, email, telefono, eventUrl, userAgent, clientIp } = body;

    const userData: any = {
      client_ip_address: clientIp || req.headers.get('x-forwarded-for') || '0.0.0.0',
      client_user_agent: userAgent || req.headers.get('user-agent') || '',
    };

    // Si tenemos correo o teléfono, los encriptamos y los enviamos
    if (email) userData.em = [hashData(email)];
    if (telefono) {
      const cleanPhone = telefono.replace(/\D/g, ''); // Deja solo los números
      if (cleanPhone) userData.ph = [hashData(cleanPhone)];
    }

    const payload = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          action_source: 'website',
          event_id: eventId, // Identificador clave para evitar eventos duplicados
          event_source_url: eventUrl || 'https://arienzoliving.com',
          user_data: userData,
        }
      ]
    };

    const response = await fetch(`https://graph.facebook.com/v19.0/${META_PIXEL_ID}/events?access_token=${META_ACCESS_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const fbResult = await response.json();
    return NextResponse.json({ success: true, fbResult });

  } catch (error) {
    console.error('Error enviando a Meta CAPI:', error);
    return NextResponse.json({ error: 'Error interno conectando con Meta' }, { status: 500 });
  }
}