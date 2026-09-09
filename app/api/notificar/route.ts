import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// ESTA FUNCIÓN NUEVA NOS PERMITIRÁ VER AL CARTERO EN EL NAVEGADOR
export async function GET() {
  return NextResponse.json({ 
    estado: "¡BINGO! El cartero está vivo, respirando en Vercel y listo para enviar correos." 
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tipo, datos } = body;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST, 
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true, 
      auth: {
        user: process.env.SMTP_USER_ARIENZO, 
        pass: process.env.SMTP_PASS_ARIENZO, 
      },
    });

    let asunto = '';
    let htmlFormato = '';

    if (tipo === 'nueva_solicitud_web') {
      asunto = '🚨 Nuevo Lead: Solicitud de Acceso VIP - Arienzo';
      htmlFormato = `
        <h2 style="color: #964B36;">Nueva Solicitud de Acceso al Inventario</h2>
        <p>Un prospecto acaba de solicitar acceso exclusivo desde la Landing Page.</p>
        <ul style="font-size: 16px;">
          <li><strong>Nombre:</strong> ${datos.nombres}</li>
          <li><strong>WhatsApp:</strong> ${datos.telefono}</li>
          <li><strong>Correo:</strong> ${datos.email}</li>
        </ul>
        <p>Ingresa a tu CRM para aprobar su acceso y enviarle el pase.</p>
      `;
    }
    else if (tipo === 'ingreso_vip') {
      asunto = `👁️ ALERTA: Nuevo ingreso al Inventario Arienzo`;
      htmlFormato = `
        <h2 style="color: #B94A36;">Alerta de Ingreso VIP</h2>
        <p>Un cliente acaba de ingresar a ver los precios y disponibilidad de Arienzo.</p>
        <p><strong>Correo autorizado:</strong> ${datos.email}</p>
        <p><strong>Fecha y Hora:</strong> ${datos.fecha}</p>
      `;
    } 
    else if (tipo === 'reserva') {
      asunto = `🚨 ¡NUEVA RESERVA! Unidad ${datos.unidadId} bloqueada por ${datos.nombres}`;
      htmlFormato = `
        <h2 style="color: #25D366;">¡Tenemos una nueva reserva en línea!</h2>
        <p><strong>Cliente:</strong> ${datos.nombres}</p>
        <p><strong>Cédula:</strong> ${datos.cedula}</p>
        <p><strong>Teléfono:</strong> ${datos.telefono}</p>
        <p><strong>Email:</strong> ${datos.email}</p>
        <hr/>
        <p><strong>Unidad Reservada:</strong> ${datos.unidadId} (${datos.tipoUnidad})</p>
        <p><strong>Precio Total:</strong> $${datos.precio}</p>
        <br/>
        <p><i>A la espera del comprobante de transferencia bancaria para bloqueo oficial.</i></p>
      `;
    }

    await transporter.sendMail({
      from: `"Notificaciones Arienzo" <${process.env.SMTP_USER_ARIENZO}>`, 
      to: 'saul@konkeri.com, ventas@arienzoliving.com', 
      subject: asunto,
      html: htmlFormato,
    });

    return NextResponse.json({ success: true, mensaje: "Correo enviado exitosamente" });

  } catch (error) {
    console.error("Error enviando correo:", error);
    return NextResponse.json({ success: false, error: 'Hubo un error al enviar el correo' }, { status: 500 });
  }
}