import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { email, nombres, horas } = await request.json();

    // 1. Configurar el servidor de salida (Hostinger)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true, // true para el puerto 465
      auth: {
        user: process.env.SMTP_USER_ARIENZO, // <-- CORREGIDO: Ahora usa el usuario de Arienzo
        pass: process.env.SMTP_PASS_ARIENZO, // <-- CORREGIDO: Ahora usa la contraseña de Arienzo
      },
    });

    // Extraer solo el primer nombre para mayor cercanía
    const primerNombre = nombres.split(' ')[0];

    // 2. Plantilla HTML Corporativa
    const htmlCorporativo = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #F9F7F5; margin: 0; padding: 40px 20px; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #EAE3DC; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
          .header { background-color: #21242E; padding: 35px 20px; text-align: center; border-bottom: 3px solid #D1C292; }
          .header img { width: 160px; height: auto; }
          .content { padding: 40px; color: #333333; line-height: 1.6; }
          .greeting { font-size: 20px; font-weight: 400; color: #21242E; margin-bottom: 20px; }
          .highlight { color: #964B36; font-weight: bold; }
          .box-info { background-color: #F9F7F5; border-left: 4px solid #964B36; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0; }
          .btn-container { text-align: center; margin: 35px 0; }
          .btn { background-color: #964B36; color: #ffffff !important; text-decoration: none; padding: 16px 32px; border-radius: 50px; font-size: 13px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; display: inline-block; }
          .footer { padding: 30px 40px; background-color: #FAFAFA; border-top: 1px solid #EAE3DC; font-size: 12px; color: #777777; text-align: center; }
          .signature { margin-top: 30px; border-top: 1px solid #EAE3DC; padding-top: 20px; }
          .signature-name { font-size: 16px; font-weight: bold; color: #21242E; margin: 0; }
          .signature-title { font-size: 12px; color: #D1C292; letter-spacing: 1px; text-transform: uppercase; margin: 5px 0 0 0; font-weight: bold; }
          .signature-company { font-size: 12px; color: #777; margin: 2px 0 0 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- CABECERA -->
          <div class="header">
            <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/arienzo-logo-blanco.svg" alt="Arienzo Boutique Living">
          </div>
          
          <!-- CUERPO -->
          <div class="content">
            <div class="greeting">Estimado/a ${primerNombre},</div>
            <p>Es un gusto saludarte. Hemos recibido tu solicitud para acceder a la información confidencial de nuestro nuevo desarrollo en Barbasquillo, Manta.</p>
            
            <p>Tu perfil ha sido validado exitosamente. A partir de este momento, tienes acceso directo a nuestra plataforma para revisar <strong>planos arquitectónicos, tipologías y los precios especiales de lanzamiento</strong>.</p>
            
            <div class="box-info">
              <p style="margin: 0; font-size: 14px;">
                <strong>Tu Pase de Acceso:</strong> Habilitado<br>
                <strong>Vigencia:</strong> ${horas === '999' ? 'Ilimitada' : horas + ' horas'}<br>
                <strong>Usuario:</strong> ${email}
              </p>
            </div>

            <div class="btn-container">
              <a href="https://reserva.arienzoliving.com" class="btn">Ingresar al Inventario</a>
            </div>

            <p style="font-size: 14px;">Si requieres asistencia durante tu navegación o deseas agendar una presentación personalizada, puedes responder directamente a este correo.</p>
            
            <div class="signature">
              <p class="signature-name">Saúl Intriago</p>
              <p class="signature-title">Dirección Comercial</p>
              <p class="signature-company">Konkeri S.A.S.</p>
            </div>
          </div>
          
          <!-- PIE DE PÁGINA -->
          <div class="footer">
            <p>Este es un mensaje automático generado por el sistema de Arienzo Boutique Living.<br>
            Si no solicitaste este acceso, puedes ignorar este correo.</p>
            <p>&copy; ${new Date().getFullYear()} Konkeri. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // 3. Opciones del correo
    const mailOptions = {
      from: '"Arienzo Boutique Living" <ventas@arienzoliving.com>',
      to: email,
      bcc: 'ventas@arienzoliving.com', // Una copia oculta para ti, para saber qué se envió
      subject: 'Acceso Aprobado: Inventario Exclusivo Arienzo',
      html: htmlCorporativo,
    };

    // 4. Enviar
    await transporter.sendMail(mailOptions);
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error enviando correo de acceso:', error);
    return NextResponse.json({ error: 'Fallo al enviar el correo' }, { status: 500 });
  }
}