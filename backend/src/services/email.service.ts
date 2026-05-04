import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env["EMAIL_USER"],
    pass: process.env["EMAIL_PASS"],
  },
});

export const sendFlightEmail = async (
  to: string,
  subject: string,
  text: string,
  html?: string,
) => {
  try {
    const info = await transporter.sendMail({
      from: `"Simulador FlyRadar" <${process.env["EMAIL_USER"]}>`,
      to,
      subject,
      text,
      html,
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
      <div style="background-color: #34a853; padding: 30px; text-align: center;">
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
