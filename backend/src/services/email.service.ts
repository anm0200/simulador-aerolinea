import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // Use HTTPS/SSL
  auth: {
    user: process.env["EMAIL_USER"],
    pass: process.env["EMAIL_PASS"],
  },
});

import path from "path";

// Path al logo que hemos copiado en assets
const logoPath = path.join(__dirname, "../assets/logo.png");

export const sendFlightEmail = async (
  to: string,
  subject: string,
  text: string,
  htmlContent?: string,
) => {
  try {
    const uniqueCid = "logo_" + Date.now();
    // Reemplazamos cid:logo por el cid único para que Gmail no lo rompa en hilos de correos
    const finalHtml = htmlContent?.replace(/cid:logo/g, "cid:" + uniqueCid);

    const info = await transporter.sendMail({
      from: `"Simulador FlyRadar" <${process.env["EMAIL_USER"]}>`,
      to,
      subject,
      text,
      html: finalHtml,
      attachments: [
        {
          filename: "logo.png",
          path: logoPath,
          cid: uniqueCid,
        },
      ],
    });
    console.log("Email enviado: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error enviando email:", error);
    return false;
  }
};

export const sendVerificationEmail = async (to: string, code: string) => {
  const subject = "🔐 Estás a un paso de despegar - Código de Verificación";
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 15px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
      <div style="background-color: #1a73e8; padding: 30px; text-align: center;">
        <img src="cid:logo" alt="FlyRadar Logo" style="width: 80px; height: auto; margin-bottom: 15px;" />
        <h1 style="color: white; margin: 0; font-size: 28px;">Verifica tu cuenta</h1>
      </div>
      <div style="padding: 40px; color: #444; line-height: 1.6;">
        <p style="font-size: 18px; font-weight: bold;">¡Hola!</p>
        <p>Gracias por unirte a <strong>Simulador FlyRadar</strong>. Estás a tan solo un paso de completar tu registro y empezar a explorar el mundo de la simulación aérea.</p>
        <p>Para activar tu cuenta, por favor utiliza el siguiente código de seguridad:</p>
        
        <div style="background: #f8f9fa; padding: 25px; font-size: 32px; font-weight: 800; letter-spacing: 8px; text-align: center; border-radius: 12px; margin: 30px 0; border: 2px dashed #1a73e8; color: #1a73e8;">
          ${code}
        </div>
        
        <p style="font-size: 14px; color: #777;">Este código tiene una validez temporal. Si no has solicitado este registro, puedes ignorar este mensaje de forma segura.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="text-align: center; font-size: 12px; color: #999;">© 2024 Simulador FlyRadar - Gestión de Tráfico Aéreo</p>
      </div>
    </div>
  `;
  return sendFlightEmail(to, subject, "", html);
};

export const sendWelcomeEmail = async (to: string, name: string) => {
  const subject = "🚀 ¡Bienvenido a bordo! Tu cuenta ha sido activada";
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 15px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
      <div style="background-color: #1a73e8; padding: 30px; text-align: center;">
        <img src="cid:logo" alt="FlyRadar Logo" style="width: 80px; height: auto; margin-bottom: 15px;" />
        <h1 style="color: white; margin: 0; font-size: 28px;">¡Cuenta Activada!</h1>
      </div>
      <div style="padding: 40px; color: #444; line-height: 1.6;">
        <p style="font-size: 18px; font-weight: bold;">¡Bienvenido, ${name}!</p>
        <p>Tu cuenta en <strong>Simulador FlyRadar</strong> ha sido verificada con éxito. Ya tienes acceso completo a nuestra plataforma de simulación y gestión aérea.</p>
        
        <div style="background: #f1f8e9; padding: 20px; border-radius: 10px; margin: 25px 0;">
          <h3 style="color: #2e7d32; margin-top: 0;">¿Qué puedes hacer ahora?</h3>
          <ul style="padding-left: 20px;">
            <li style="margin-bottom: 10px;"><strong>Seguimiento en Tiempo Real:</strong> Visualiza vuelos simulados sobre el mapa interactivo.</li>
            <li style="margin-bottom: 10px;"><strong>Gestión de Reservas:</strong> Suscríbete a tus rutas favoritas para recibir alertas personalizadas.</li>
            <li style="margin-bottom: 10px;"><strong>Notificaciones Inteligentes:</strong> Recibe avisos automáticos cuando tus vuelos despeguen o aterricen.</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 35px 0;">
          <a href="http://localhost:4200/login" style="background-color: #34a853; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Ir al Simulador</a>
        </div>
        
        <p>Estamos emocionados de tenerte con nosotros. ¡Buen vuelo!</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="text-align: center; font-size: 12px; color: #999;">© 2024 Simulador FlyRadar - Equipo de Soporte</p>
      </div>
    </div>
  `;
  return sendFlightEmail(to, subject, "", html);
};

export const sendDepartureEmail = async (
  to: string,
  name: string,
  flight: any,
) => {
  const subject = `🚀 Tu vuelo ${flight.id} está en el aire`;
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 15px; overflow: hidden;">
      <div style="background-color: #1a73e8; padding: 20px; text-align: center; color: white;">
        <img src="cid:logo" alt="FlyRadar Logo" style="width: 60px; height: auto; margin-bottom: 10px;" />
        <h2 style="margin: 0;">Notificación de Despegue</h2>
      </div>
      <div style="padding: 30px; color: #444;">
        <p>Hola <strong>${name}</strong>,</p>
        <p>Te informamos que el vuelo al que estás suscrito acaba de despegar puntual.</p>
        
        <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 5px solid #1a73e8;">
          <div style="font-size: 24px; font-weight: bold; color: #1a73e8; margin-bottom: 10px;">${flight.id}</div>
          <div style="margin-bottom: 10px;">
            <span><strong>Origen:</strong> ${flight.origin.city} (${flight.origin.id})</span><br>
            <span><strong>Salida:</strong> ${flight.departureTime}</span>
          </div>
          <div>
            <span><strong>Destino:</strong> ${flight.destination.city} (${flight.destination.id})</span><br>
            <span><strong>Duración:</strong> ${flight.durationMinutes} min</span>
          </div>
        </div>
        
        <p style="text-align: center; font-style: italic; color: #666;">¡Gracias por confiar en Simulador FlyRadar!</p>
      </div>
    </div>
  `;
  return sendFlightEmail(to, subject, "", html);
};

export const sendArrivalEmail = async (
  to: string,
  name: string,
  flight: any,
) => {
  const subject = `🛬 Tu vuelo ${flight.id} ha aterrizado en ${flight.destination.city}`;
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 15px; overflow: hidden;">
      <div style="background-color: #1a73e8; padding: 20px; text-align: center; color: white;">
        <img src="cid:logo" alt="FlyRadar Logo" style="width: 60px; height: auto; margin-bottom: 10px;" />
        <h2 style="margin: 0;">Notificación de Aterrizaje</h2>
      </div>
      <div style="padding: 30px; color: #444;">
        <p>Hola <strong>${name}</strong>,</p>
        <p>El vuelo <strong>${flight.id}</strong> ha completado su trayecto y acaba de aterrizar con éxito.</p>
        
        <div style="background: #f1f8e9; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
          <div style="font-size: 18px; color: #2e7d32; font-weight: bold;">¡Bienvenido a ${flight.destination.city}!</div>
          <p style="margin: 10px 0 0 0;">El avión ha tomado tierra en ${flight.destination.name}.</p>
        </div>
        
        <p style="text-align: center; color: #666;">Esperamos que la información te haya sido de utilidad.</p>
      </div>
    </div>
  `;
  return sendFlightEmail(to, subject, "", html);
};

export const sendPasswordRecoveryEmail = async (
  to: string,
  name: string,
  tempPassword: string,
) => {
  const subject = "🔒 Recuperación de Contraseña";
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 15px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
      <div style="background-color: #1a73e8; padding: 30px; text-align: center;">
        <img src="cid:logo" alt="FlyRadar Logo" style="width: 80px; height: auto; margin-bottom: 15px;" />
        <h1 style="color: white; margin: 0; font-size: 28px;">Recuperación de Contraseña</h1>
      </div>
      <div style="padding: 40px; color: #444; line-height: 1.6;">
        <p style="font-size: 18px; font-weight: bold;">¡Hola, ${name}!</p>
        <p>Hemos recibido una solicitud para recuperar tu contraseña en <strong>Simulador FlyRadar</strong>.</p>
        <p>Tu nueva contraseña temporal generada de forma segura es:</p>
        
        <div style="background: #f8f9fa; padding: 25px; font-size: 28px; font-weight: 800; letter-spacing: 4px; text-align: center; border-radius: 12px; margin: 30px 0; border: 2px dashed #1a73e8; color: #1a73e8;">
          ${tempPassword}
        </div>
        
        <p>Te recomendamos que, por tu propia comodidad, utilices el inicio de sesión con Google si tienes tu cuenta de Gmail vinculada, ¡es mucho más rápido y seguro!</p>
        <p style="font-size: 14px; color: #777;">Si no has solicitado este cambio, por favor contáctanos de inmediato.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="text-align: center; font-size: 12px; color: #999;">© 2024 Simulador FlyRadar - Seguridad</p>
      </div>
    </div>
  `;
  return sendFlightEmail(to, subject, "", html);
};
