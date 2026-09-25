import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { email, nombres } = await request.json();

    // Conexión al servidor de Hostinger usando las mismas credenciales de tu `.env`
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.hostinger.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const htmlCuerpo = `
      <div style="font-family: Arial, sans-serif; color: #415364; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #21242E; padding: 20px; text-align: center;">
          <h2 style="color: #ffffff; margin: 0;">Actualización de Contacto</h2>
        </div>
        <div style="padding: 30px 20px; background-color: #ffffff;">
          <p style="font-size: 16px;">Hola <strong>${nombres}</strong>,</p>
          <p style="font-size: 15px; line-height: 1.5;">Gracias por tu interés en <strong>Arienzo Boutique Living</strong>.</p>
          <p style="font-size: 15px; line-height: 1.5;">Hemos intentado comunicarnos al número de teléfono que registraste en nuestra página, pero parece no estar disponible o es incorrecto.</p>
          <p style="font-size: 15px; line-height: 1.5; background-color: #f9f7f5; padding: 15px; border-left: 4px solid #ea0029;">
            Para poder otorgarte tu <strong>Pase VIP</strong> y enviarte la lista de precios, planos e inventario, por favor indícanos tu <strong>número de WhatsApp actual respondiendo directamente a este correo.</strong>
          </p>
          <p style="font-size: 15px; line-height: 1.5;">Quedamos a la espera de tu respuesta para habilitar tu acceso exclusivo.</p>
          <br/>
          <p style="font-size: 13px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 15px;">
            Saludos cordiales,<br/>
            <strong>Equipo Comercial Arienzo</strong><br/>
            Konkeri Real Estate
          </p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"Arienzo Boutique Living" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Arienzo Boutique Living - Actualización de Contacto',
      html: htmlCuerpo,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: 'Correo enviado' });
    
  } catch (error) {
    console.error('Error enviando correo de actualización:', error);
    return NextResponse.json({ error: 'Error al enviar el correo' }, { status: 500 });
  }
}