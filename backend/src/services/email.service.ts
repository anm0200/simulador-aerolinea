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
  const subject = "🔐 Código de Verificación - Simulador FlyRadar";
  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #333;">
      <h1 style="color: #1a73e8;">Verifica tu cuenta</h1>
      <p>Gracias por registrarte. Usa el siguiente código para activar tu cuenta:</p>
      <div style="background: #f1f3f4; padding: 20px; font-size: 24px; font-weight: bold; letter-spacing: 5px; text-align: center; border-radius: 10px; margin: 20px 0;">
        ${code}
      </div>
      <p>Este código caducará pronto. Si no has solicitado esto, ignora este correo.</p>
    </div>
  `;
  return sendFlightEmail(to, subject, "", html);
};
