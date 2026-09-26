import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    // La API ahora solo recibe el HTML final armado por el CRM
    const { email, asunto, htmlCuerpo } = await request.json();

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.hostinger.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `"Arienzo Comercial" <${process.env.SMTP_USER}>`,
      to: email,
      subject: asunto,
      html: htmlCuerpo,
    };

    await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true, message: 'Correo HTML enviado' });
    
  } catch (error) {
    console.error('Error enviando correo CRM:', error);
    return NextResponse.json({ error: 'Error al enviar el correo' }, { status: 500 });
  }
}