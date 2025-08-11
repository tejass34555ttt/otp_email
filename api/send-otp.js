import { Client, Users, ID, Query } from "node-appwrite";
import nodemailer from "nodemailer";

// Temporary OTP store (replace with Redis or DB in production)
const otpStore = {};

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT)
    .setKey(process.env.APPWRITE_API_KEY);

const users = new Users(client);

export async function sendOtpHandler(req, res) {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = { otp, expires: Date.now() + 5 * 60 * 1000 };

    // Send email (via SMTP, or replace with Resend)
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

    await transporter.sendMail({
        from: '"My App" <no-reply@myapp.com>',
        to: email,
        subject: "Your OTP Code",
        text: `Your OTP code is ${otp}. It expires in 5 minutes.`
    });

    res.json({ message: "OTP sent" });
}
