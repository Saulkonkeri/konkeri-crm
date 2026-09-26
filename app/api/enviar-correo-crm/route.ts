import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { email, nombres, asunto, cuerpo, tipoPlantilla } = await request.json();

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.hostinger.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const imagenes = {
      portada: "https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/render-Exterior-Fronta.jpg",
      ubicacion: "https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/ubicacion-arienzo-1.jpg",
      arquitectura: "https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/render-Exterior-Derecho-A4.jpg",
      amenidades: "https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/Arienzo-Piscina-1.jpg",
      living: "https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/render-living-arienzo.jpg"
    };
    
    const cuerpoHtmlFormateado = cuerpo.replace(/\n/g, '<br/>');
    const enlaceWhatsApp = `https://wa.me/593979469472?text=${encodeURIComponent(`Hola Saúl, recibí tu correo sobre Arienzo y me gustaría más información.`)}`;
    const enlaceCalendly = `https://calendly.com/saul-intriago/asesoria-inmobiliaria`;

    // ==========================================
    // ESTRUCTURA BASE HTML
    // ==========================================
    const cabeceraHTML = `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 0; background-color: #dce3eb; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #dce3eb; padding: 40px 10px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
                <!-- CABECERA NEGRA CON LOGO -->
                <tr>
                  <td align="center" style="background-color: #21242E; padding: 35px 20px;">
                    <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/arienzo-logo-blanco.svg" alt="Arienzo Boutique Living" width="180" style="display: block; margin: 0 auto;">
                  </td>
                </tr>
                <!-- FOTO PORTADA (SIEMPRE LA FACHADA FRONTAL) -->
                <tr>
                  <td>
                    <img src="${imagenes.portada}" alt="Arienzo Vista" width="600" style="display: block; width: 100%; max-height: 300px; object-fit: cover;">
                  </td>
                </tr>
                <!-- PÁRRAFO INTRODUCTORIO -->
                <tr>
                  <td style="padding: 40px; color: #415364; font-size: 16px; line-height: 1.6;">
                    ${cuerpoHtmlFormateado}
                  </td>
                </tr>
    `;

    // El Correo "Largo" como de Revista
    const pilaresVentaHTML = `
                <!-- SEPARADOR -->
                <tr>
                  <td align="center" style="padding: 0 40px;">
                    <hr style="border: none; border-top: 1px solid #D1C292; margin: 0;">
                    <h3 style="color: #964B36; font-size: 15px; text-transform: uppercase; letter-spacing: 2px; margin-top: 25px;">El privilegio de vivir bien</h3>
                  </td>
                </tr>
                <!-- PILAR 1: UBICACIÓN -->
                <tr>
                  <td style="padding: 20px 40px;">
                    <img src="${imagenes.ubicacion}" width="100%" style="border-radius: 8px; display: block; margin-bottom: 15px;">
                    <h4 style="margin: 0 0 10px 0; color: #21242E; font-size: 18px;">Ubicación Estratégica</h4>
                    <p style="margin: 0; color: #415364; font-size: 15px; line-height: 1.5;">En el corazón de Barbasquillo, Manta. A pasos de La Quadra y Riocentro Plaza. La zona de mayor prestigio, conectividad y plusvalía de la ciudad.</p>
                  </td>
                </tr>
                <!-- PILAR 2: ARQUITECTURA -->
                <tr>
                  <td style="padding: 20px 40px;">
                    <img src="${imagenes.arquitectura}" width="100%" style="border-radius: 8px; display: block; margin-bottom: 15px;">
                    <h4 style="margin: 0 0 10px 0; color: #21242E; font-size: 18px;">Arquitectura de Autor</h4>
                    <p style="margin: 0; color: #415364; font-size: 15px; line-height: 1.5;">Desarrollado por el reconocido estudio <strong>Diez + Muller</strong>. Una colección limitada de solo 22 departamentos con ventanales de piso a techo y acabados premium.</p>
                  </td>
                </tr>
                <!-- PILAR 3: AMENIDADES -->
                <tr>
                  <td style="padding: 20px 40px 40px 40px;">
                    <img src="${imagenes.amenidades}" width="100%" style="border-radius: 8px; display: block; margin-bottom: 15px;">
                    <h4 style="margin: 0 0 10px 0; color: #21242E; font-size: 18px;">Rooftop y Amenidades Exclusivas</h4>
                    <p style="margin: 0; color: #415364; font-size: 15px; line-height: 1.5;">Disfruta de un Social Living con Coworking, Gym Panorámico y una espectacular piscina concebida para elevar tu experiencia diaria.</p>
                  </td>
                </tr>
    `;

    // Cierre con Botón a WhatsApp (Venta y Urgencia)
    const botonWhatsAppHTML = `
                <tr>
                  <td align="center" style="background-color: #F9F7F5; padding: 40px 20px; border-top: 1px solid #EAE3DC; border-bottom: 1px solid #EAE3DC;">
                    <h2 style="margin: 0 0 15px 0; color: #964B36; font-size: 24px;">Asegura tu unidad en Planos</h2>
                    <p style="margin: 0 0 25px 0; color: #415364; font-size: 16px; font-weight: bold;">Reservas abiertas con solo $2,500 USD</p>
                    <a href="${enlaceWhatsApp}" style="background-color: #25D366; color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 30px; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; display: inline-block;">Hablemos por WhatsApp</a>
                  </td>
                </tr>
    `;

    // Cierre con Botón a Calendly (Zoom)
    const botonZoomHTML = `
                <tr>
                  <td align="center" style="background-color: #F9F7F5; padding: 40px 20px; border-top: 1px solid #EAE3DC; border-bottom: 1px solid #EAE3DC;">
                    <h2 style="margin: 0 0 15px 0; color: #21242E; font-size: 22px;">Conoce los planos y disponibilidad</h2>
                    <p style="margin: 0 0 25px 0; color: #415364; font-size: 15px;">Selecciona la fecha y hora que mejor se adapte a tu agenda.</p>
                    <a href="${enlaceCalendly}" style="background-color: #ea0029; color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; display: inline-block;">🗓️ Agendar Videollamada</a>
                  </td>
                </tr>
    `;

    const firmaYFooterHTML = `
                <!-- FIRMA PROFESIONAL -->
                <tr>
                  <td style="padding: 40px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="60" style="padding-right: 15px;">
                          <img src="https://ijzqqbybubruthargcnq.supabase.co/storage/v1/object/public/imagenes%20para%20web%20arienzo/logo-dorado-arienzo.svg" width="50" style="display: block; background-color: #964B36; padding: 5px; border-radius: 5px;">
                        </td>
                        <td>
                          <p style="margin: 0; font-size: 14px; font-weight: bold; color: #21242E;">Saúl Intriago</p>
                          <p style="margin: 2px 0 0 0; font-size: 12px; color: #964B36; letter-spacing: 1px; text-transform: uppercase;">Director Comercial</p>
                          <p style="margin: 2px 0 0 0; font-size: 12px; color: #415364;">arienzoliving.com | Konkeri Real Estate</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- FOOTER LEGAL -->
                <tr>
                  <td align="center" style="background-color: #21242E; padding: 20px; text-align: center;">
                    <p style="margin: 0; font-size: 10px; color: #ffffff; opacity: 0.5; text-transform: uppercase; letter-spacing: 1px;">© ${new Date().getFullYear()} Arienzo Boutique Living. Manta, Ecuador.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // LÓGICA: Ensamblaje
    let htmlFinal = '';

    if (tipoPlantilla === 'seguimiento_premium') {
      htmlFinal = cabeceraHTML + pilaresVentaHTML + botonWhatsAppHTML + firmaYFooterHTML;
    } else if (tipoPlantilla === 'invitacion_zoom') {
      htmlFinal = cabeceraHTML + botonZoomHTML + firmaYFooterHTML;
    } else if (tipoPlantilla === 'urgencia_reserva') {
      htmlFinal = cabeceraHTML + botonWhatsAppHTML + firmaYFooterHTML;
    }

    const mailOptions = {
      from: `"Arienzo Comercial" <${process.env.SMTP_USER}>`,
      to: email,
      subject: asunto,
      html: htmlFinal,
    };

    await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true, message: 'Correo HTML enviado' });
    
  } catch (error) {
    console.error('Error enviando correo CRM:', error);
    return NextResponse.json({ error: 'Error al enviar el correo' }, { status: 500 });
  }
}