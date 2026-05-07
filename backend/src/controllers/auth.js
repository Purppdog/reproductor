/* eslint-disable no-undef */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { pool } from '../models/db.js';
import { Resend } from 'resend';
import { v2 as cloudinary } from 'cloudinary';

const resend = new Resend(process.env.RESEND_API_KEY);

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});
// REGISTRO
export const register = async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;

    // Validaciones
    if (!username || !email || !password || !confirmPassword) {
        return res.status(400).json({
            success: false,
            error: 'Todos los campos son obligatorios.'
        });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            error: 'El formato del email no es válido.'
        });
    }

    if (password.length < 6) {
        return res.status(400).json({
            success: false,
            error: 'La contraseña debe tener al menos 6 caracteres.'
        });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({
            success: false,
            error: 'Las contraseñas no coinciden.'
        });
    }

    try {
        // Verificar si el email ya existe
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Ya existe una cuenta con ese email.'
            });
        }

        // Verificar si el username ya existe
        const existingUsername = await pool.query(
            'SELECT id FROM users WHERE username = $1',
            [username]
        );

        if (existingUsername.rows.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Ese nombre de usuario ya está en uso.'
            });
        }

        // Encriptar contraseña
        const hashedPassword = await bcrypt.hash(password, 12);

        // Generar token de verificación
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

        // Guardar usuario
        const result = await pool.query(
            `INSERT INTO users (username, email, password, verification_token, verification_token_expires)
             VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email`,
            [username, email.toLowerCase(), hashedPassword, verificationToken, verificationTokenExpires]
        );

        const newUser = result.rows[0];

        // Enviar email de verificación
        const verificationUrl = `${process.env.BACKEND_URL}/api/auth/verify/${verificationToken}`;

        await resend.emails.send({
            from: 'Reproductor <onboarding@resend.dev>',
            to: email,
            subject: 'Verifica tu cuenta',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #111; color: #fff; padding: 30px; border-radius: 10px;">
                    <h1 style="color: #1db954;"> Reproductor</h1>
                    <h2>¡Hola ${username}!</h2>
                    <p>Gracias por registrarte. Haz click en el botón para verificar tu cuenta:</p>
                    <a href="${verificationUrl}" 
                       style="display: inline-block; background: #1db954; color: white; padding: 12px 24px; border-radius: 25px; text-decoration: none; font-weight: bold; margin: 20px 0;">
                        Verificar mi cuenta
                    </a>
                    <p style="color: #aaa; font-size: 12px;">Este link expira en 24 horas.</p>
                    <p style="color: #aaa; font-size: 12px;">Si no creaste esta cuenta, ignora este email.</p>
                </div>
            `
        });

        res.status(201).json({
            success: true,
            message: 'Registro exitoso. Revisa tu email para verificar tu cuenta.',
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email
            }
        });

    } catch (error) {
        console.error('Error en registro:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error al crear la cuenta.'
        });
    }
};

// VERIFICAR EMAIL
export const verifyEmail = async (req, res) => {
    const { token } = req.params;

    try {
        const result = await pool.query(
            `SELECT id, username FROM users 
             WHERE verification_token = $1 
             AND verification_token_expires > NOW()
             AND verified = FALSE`,
            [token]
        );

        if (result.rows.length === 0) {
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=token_invalido`);
        }

        await pool.query(
            `UPDATE users 
             SET verified = TRUE, verification_token = NULL, verification_token_expires = NULL
             WHERE id = $1`,
            [result.rows[0].id]
        );

        res.redirect(`${process.env.FRONTEND_URL}/login?verified=true`);

    } catch (error) {
        console.error('Error en verificación:', error.message);
        res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
    }
};

// LOGIN
export const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            error: 'Email y contraseña son obligatorios.'
        });
    }

    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'Email o contraseña incorrectos.'
            });
        }

        const user = result.rows[0];

        // Verificar si la cuenta está verificada
        if (!user.verified) {
            return res.status(401).json({
                success: false,
                error: 'Debes verificar tu email antes de iniciar sesión.'
            });
        }

        // Verificar contraseña
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                error: 'Email o contraseña incorrectos.'
            });
        }

        // Generar JWT
        const token = jwt.sign(
            { id: user.id, username: user.username, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Login exitoso.',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Error en login:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error al iniciar sesión.'
        });
    }
};

// OBTENER PERFIL
export const getProfile = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, username, email, created_at FROM users WHERE id = $1',
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado.'
            });
        }

        res.json({
            success: true,
            user: result.rows[0]
        });
    } catch {
        res.status(500).json({
            success: false,
            error: 'Error al obtener perfil.'
        });
    }
};

// ELIMINAR CUENTA
export const deleteAccount = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Obtener todas las canciones del usuario para eliminarlas de Cloudinary
        const songsResult = await client.query(
            'SELECT cloudinary_public_id FROM songs WHERE user_id = $1',
            [req.user.id]
        );

        // 2. Eliminar cada canción de Cloudinary
        for (const song of songsResult.rows) {
            if (song.cloudinary_public_id) {
                await cloudinary.uploader.destroy(song.cloudinary_public_id, {
                    resource_type: 'video'
                });
            }
        }

        // 3. Eliminar canciones de la BD
        await client.query('DELETE FROM songs WHERE user_id = $1', [req.user.id]);

        // 4. Eliminar usuario
        await client.query('DELETE FROM users WHERE id = $1', [req.user.id]);

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Cuenta eliminada correctamente'
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al eliminar cuenta:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error al eliminar la cuenta'
        });
    } finally {
        client.release();
    }
};

// OLVIDÉ MI CONTRASEÑA
export const forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            success: false,
            error: 'El email es obligatorio.'
        });
    }

    try {
        const result = await pool.query(
            'SELECT id, username FROM users WHERE email = $1 AND verified = TRUE',
            [email.toLowerCase()]
        );

        // Siempre responder igual por seguridad (no revelar si el email existe)
        if (result.rows.length === 0) {
            return res.json({
                success: true,
                message: 'Si ese email existe, recibirás un enlace para restablecer tu contraseña.'
            });
        }

        const user = result.rows[0];

        // Generar token de recuperación
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hora

        await pool.query(
            'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
            [resetToken, resetTokenExpires, user.id]
        );

        // Enviar email
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

        await resend.emails.send({
            from: 'Reproductor <onboarding@resend.dev>',
            to: email,
            subject: 'Restablecer contraseña',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #111; color: #fff; padding: 30px; border-radius: 10px;">
                    <h1 style="color: #1db954;">🎵 Reproductor</h1>
                    <h2>¡Hola ${user.username}!</h2>
                    <p>Recibimos una solicitud para restablecer tu contraseña. Haz click en el botón:</p>
                    <a href="${resetUrl}" 
                       style="display: inline-block; background: #1db954; color: white; padding: 12px 24px; border-radius: 25px; text-decoration: none; font-weight: bold; margin: 20px 0;">
                        Restablecer contraseña
                    </a>
                    <p style="color: #aaa; font-size: 12px;">Este link expira en 1 hora.</p>
                    <p style="color: #aaa; font-size: 12px;">Si no solicitaste esto, ignora este email.</p>
                </div>
            `
        });

        res.json({
            success: true,
            message: 'Si ese email existe, recibirás un enlace para restablecer tu contraseña.'
        });

    } catch (error) {
        console.error('Error en forgotPassword:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error al procesar la solicitud.'
        });
    }
};

// RESTABLECER CONTRASEÑA
export const resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
        return res.status(400).json({
            success: false,
            error: 'Todos los campos son obligatorios.'
        });
    }

    if (password.length < 6) {
        return res.status(400).json({
            success: false,
            error: 'La contraseña debe tener al menos 6 caracteres.'
        });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({
            success: false,
            error: 'Las contraseñas no coinciden.'
        });
    }

    try {
        const result = await pool.query(
            `SELECT id FROM users 
             WHERE reset_token = $1 
             AND reset_token_expires > NOW()`,
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'El link es inválido o expiró.'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        await pool.query(
            `UPDATE users 
             SET password = $1, reset_token = NULL, reset_token_expires = NULL 
             WHERE id = $2`,
            [hashedPassword, result.rows[0].id]
        );

        res.json({
            success: true,
            message: 'Contraseña restablecida correctamente.'
        });

    } catch (error) {
        console.error('Error en resetPassword:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error al restablecer la contraseña.'
        });
    }
};