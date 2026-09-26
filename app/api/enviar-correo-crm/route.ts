import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { email, asunto, htmlCuerpo } = await request.json();

    // Validar credenciales corporativas de Arienzo
    if (!process.env.SMTP_USER_ARIENZO || !process.env.SMTP_PASS_ARIENZO) {
      console.error("❌ Faltan las credenciales SMTP_USER_ARIENZO o SMTP_PASS_ARIENZO en Vercel.");
      return NextResponse.json({ error: 'Configuración SMTP incompleta' }, { status: 500 });
    }

    // Configuración idéntica al router que funciona perfecto
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.hostinger.com',
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true, // true para puerto 465
      auth: {
        user: process.env.SMTP_USER_ARIENZO,
        pass: process.env.SMTP_PASS_ARIENZO,
      },
    });

    const mailOptions = {
      from: '"Arienzo Boutique Living" <ventas@arienzoliving.com>',
      to: email,
      bcc: 'ventas@arienzoliving.com', // Copia oculta de control
      subject: asunto,
      html: htmlCuerpo,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Correo CRM enviado con éxito:", info.messageId);

    return NextResponse.json({ success: true, message: 'Correo HTML enviado' });
    
  } catch (error: any) {
    console.error('❌ Error detallado enviando correo CRM:', error);
    return NextResponse.json({ error: error.message || 'Error al enviar el correo' }, { status: 500 });
  }
}