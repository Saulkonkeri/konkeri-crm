import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tipo, datos } = body;

    // Conectamos Vercel con el correo de tu Hosting (SMTP)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST, 
      port: 465,
      secure: true, // true para el puerto 465
      auth: {
        user: process.env.SMTP_USER, 
        pass: process.env.SMTP_PASS, 
      },
    });

    let asunto = '';
    let htmlFormato = '';

    // ALERTA 1: INGRESO VIP
    if (tipo === 'ingreso_vip') {
      asunto = `👁️ ALERTA: Nuevo ingreso al Inventario Arienzo`;
      htmlFormato = `
        <h2 style="color: #B94A36;">Alerta de Ingreso VIP</h2>
        <p>Un cliente acaba de ingresar a ver los precios y disponibilidad de Arienzo.</p>
        <p><strong>Correo autorizado:</strong> ${datos.email}</p>
        <p><strong>Fecha y Hora:</strong> ${datos.fecha}</p>
      `;
    } 
    // ALERTA 2: RESERVA COMPLETADA
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
        <p><i>A la espera del comprobante de transferencia bancaria.</i></p>
      `;
    }

    // Enviamos el correo a tu bandeja principal
    await transporter.sendMail({
      from: `"Arienzo Bot" <${process.env.SMTP_USER}>`, 
      to: 'saul@konkeri.com', // AQUÍ PONES EL CORREO DONDE QUIERES RECIBIR LAS ALERTAS
      subject: asunto,
      html: htmlFormato,
    });

    return NextResponse.json({ success: true, mensaje: "Correo enviado exitosamente" });

  } catch (error) {
    console.error("Error enviando correo:", error);
    return NextResponse.json({ success: false, error: 'Hubo un error al enviar el correo' }, { status: 500 });
  }
}