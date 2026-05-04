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
