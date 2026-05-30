import { Request, Response } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import {
  sendVerificationEmail,
  sendWelcomeEmail,
} from "../services/email.service.js";
import { OAuth2Client } from "google-auth-library";

const prisma = new PrismaClient();
const JWT_SECRET = process.env["JWT_SECRET"] || "secret123";
const GOOGLE_CLIENT_ID =
  process.env["GOOGLE_CLIENT_ID"] ||
  "206099058419-sicqal0lftqkb2i8aodff7ervii0c12k.apps.googleusercontent.com";
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const validatePassword = (password: string) => {
  // Ahora permite puntos, guiones y otros símbolos comunes
  const regex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.,\-_#])[A-Za-z\d@$!%*?&.,\-_#]{8,12}$/;
  return regex.test(password);
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!validatePassword(password)) {
      return res.status(400).json({
        error:
          "La contraseña debe tener entre 8 y 12 caracteres, incluir una mayúscula, una minúscula, un número y un símbolo.",
      });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "El usuario ya existe" });
    }

    const verificationCode = crypto.randomInt(100000, 1000000).toString();
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: "CLIENTE", // Siempre cliente al registrarse públicamente
        isVerified: false,
        verificationCode,
      },
    });

    await sendVerificationEmail(email, verificationCode);

    res.status(201).json({
      message:
        "Usuario registrado. Revisa tu email para el código de verificación.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al registrar usuario" });
  }
};

export const verify = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.verificationCode !== code) {
      return res
        .status(400)
        .json({ error: "Código de verificación incorrecto" });
    }

    await prisma.user.update({
      where: { email },
      data: { isVerified: true, verificationCode: null },
    });

    // Enviar correo de bienvenida profesional
    await sendWelcomeEmail(user.email, user.name);

    res.json({
      message: "Cuenta verificada con éxito. Ya puedes iniciar sesión.",
    });
  } catch (error) {
    res.status(500).json({ error: "Error al verificar cuenta" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    if (!user.isVerified) {
      return res
        .status(403)
        .json({ error: "Debes verificar tu cuenta antes de iniciar sesión" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "1d",
    });
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
};

export const createResponsable = async (req: Request, res: Response) => {
  try {
    // Este endpoint debe estar protegido por authorizeRole(['RESPONSABLE'])
    const { email, password, name } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser)
      return res.status(400).json({ error: "El usuario ya existe" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: "RESPONSABLE",
        isVerified: true, // Responsables creados por otro responsable se asumen verificados
      },
    });

    res.status(201).json({
      message: "Responsable creado con éxito",
      user: { email: user.email, name: user.name },
    });
  } catch (error) {
    res.status(500).json({ error: "Error al crear responsable" });
  }
};

export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { token: credential } = req.body;

    if (!credential) {
      return res
        .status(400)
        .json({ error: "No se proporcionó token de Google" });
    }

    // Validamos el JWT de Google
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ error: "Token de Google inválido" });
    }

    const { email, name, sub: googleId } = payload;

    let user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      // Si existe y no tiene googleId, lo vinculamos
      if (!user.googleId) {
        await prisma.user.update({
          where: { email },
          data: { googleId },
        });
      }

      // Si no estaba verificado, la autenticación de Google lo verifica implícitamente
      if (!user.isVerified) {
        // Enviar código de verificación de todas formas según el requisito
        const verificationCode = crypto.randomInt(100000, 1000000).toString();
        await prisma.user.update({
          where: { email },
          data: { verificationCode },
        });
        await sendVerificationEmail(email, verificationCode);
        return res.status(200).json({
          message:
            "Usuario existente. Se ha enviado un código de verificación a tu correo.",
          requiresVerification: true,
        });
      }

      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
        expiresIn: "1d",
      });
      return res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } else {
      // Si no existe, creamos el usuario
      const verificationCode = crypto.randomInt(100000, 1000000).toString();
      const randomPassword = crypto.randomBytes(16).toString("hex"); // Contraseña dummy
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: "CLIENTE",
          isVerified: false,
          verificationCode,
          googleId,
        },
      });

      await sendVerificationEmail(email, verificationCode);

      res.status(201).json({
        message:
          "Cuenta de Google registrada. Revisa tu email para el código de verificación.",
        requiresVerification: true,
      });
    }
  } catch (error) {
    console.error("Error en google auth:", error);
    res.status(500).json({ error: "Error en autenticación con Google" });
  }
};

export const recoverPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Por seguridad, no decimos si el email existe o no
      return res.json({
        message: "Si el correo está registrado, recibirás instrucciones.",
      });
    }

    // Generar contraseña temporal
    const tempPassword = crypto.randomBytes(4).toString("hex") + "A1!"; // Ej: 1a2b3c4dA1!
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    // Importaremos sendPasswordRecoveryEmail desde email.service
    const { sendPasswordRecoveryEmail } =
      await import("../services/email.service.js");
    await sendPasswordRecoveryEmail(email, user.name, tempPassword);

    res.json({
      message: "Si el correo está registrado, recibirás instrucciones.",
    });
  } catch (error) {
    console.error("Error al recuperar contraseña:", error);
    res.status(500).json({ error: "Error al recuperar la contraseña" });
  }
};
