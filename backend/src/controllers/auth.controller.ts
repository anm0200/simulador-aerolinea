import { Request, Response } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import {
  sendVerificationEmail,
  sendWelcomeEmail,
} from "../services/email.service.js";

const prisma = new PrismaClient();
const JWT_SECRET = process.env["JWT_SECRET"] || "secret";

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
