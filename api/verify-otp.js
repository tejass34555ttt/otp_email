const express = require('express');
const router = express.Router();
const transporter = require('../utilis/mailer');
const { saveOtp, verifyOtp, clearOtp } = require('../utilis/otp_store');
const { users } = require('../services/appwriteClient');
const { ID, Query } = require('node-appwrite');

// ------------------- SEND OTP -------------------
router.post('/send-otp', async (req, res) => {
  const rawEmail = req.body.email;
  const email = rawEmail.trim().toLowerCase(); // normalize email
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  console.log(`✅ Sending OTP to ${email}: ${otp}`);
  saveOtp(email, otp);

  try {
    await transporter.sendMail({
      from: `"Appwrite OTP" <${process.env.SMTP_USERNAME}>`,
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP is: ${otp}`,
    });

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error(`❌ Failed to send OTP to ${email}:`, error.message);
    res.status(500).json({ error: 'Failed to send OTP', details: error.message });
  }
});

// ------------------- VERIFY OTP & LOGIN -------------------
router.post('/verify-otp', async (req, res) => {
  const rawEmail = req.body.email;
  const otp = req.body.otp;
  const email = rawEmail.trim().toLowerCase(); // normalize

  if (!verifyOtp(email, otp)) {
    return res.status(403).json({ error: 'Invalid OTP' });
  }

  try {
    // Check if user exists
    const existing = await users.list([
      Query.equal('email', email)
    ]);

    let userId;
    if (existing.total === 0) {
      const newUser = await users.create(ID.unique(), email, 'Default@1234!');
      userId = newUser.$id;
    } else {
      userId = existing.users[0].$id;
    }

    const jwt = await users.createJWT(userId);
    clearOtp(email);

    res.json({
      message: 'OTP verified. Login successful',
      userId,
      jwt: jwt.jwt
    });
  } catch (error) {
    console.error(`❌ OTP verified but login failed for ${email}:`, error.message);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

module.exports = router;
