import nodemailer from "nodemailer";

// ✅ Your in-memory or persistent OTP save function
function saveOtp(email, otp) {
  // In production, save to database (Appwrite, Firestore, Redis, etc.)
  console.log(`💾 OTP saved for ${email}: ${otp}`);
}
console.log("Using SMTP:", process.env.SMTP_HOST, process.env.SMTP_USERNAME);

// ✅ Email transporter (configure using environment variables)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD,
  },
});

// ✅ Main Vercel API Handler
export default async function handler(req, res) {
  // ✅ CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end(); // Preflight request
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const rawEmail = req.body.email;
  if (!rawEmail) {
    return res.status(400).json({ error: "Email is required" });
  }

  const email = rawEmail.trim().toLowerCase();
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  console.log(`✅ Sending OTP to ${email}: ${otp}`);
  saveOtp(email, otp);

  try {
    await transporter.sendMail({
      from: `"Appwrite OTP" <${process.env.SMTP_USERNAME}>`,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is: ${otp}`,
    });

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error(`❌ Failed to send OTP to ${email}:`, error.message);
    res.status(500).json({
      error: "Failed to send OTP",
      details: error.message,
    });
  }
}
