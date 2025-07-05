const otpMemoryStore = {};       // Stores OTPs
const otpTimestampStore = {};   // Stores timestamps for rate limiting

// Save OTP with 5-minute expiry
function saveOtp(email, otp) {
  console.log(`[OTP] Saving OTP for ${email}: ${otp}`);
  otpMemoryStore[email] = otp;
  otpTimestampStore[email] = Date.now();

  // Auto-delete after 5 mins
  setTimeout(() => {
    console.log(`[OTP] Expired OTP for ${email}`);
    delete otpMemoryStore[email];
    delete otpTimestampStore[email];
  }, 5 * 60 * 1000);
}

// Check if we can send OTP (1-minute cooldown)
function canSendOtp(email) {
  const lastSent = otpTimestampStore[email];
  const now = Date.now();
  if (lastSent && now - lastSent < 60 * 1000) {
    return false;
  }
  return true;
}

// Verify OTP
function verifyOtp(email, otp) {
  return otpMemoryStore[email] === otp;
}

// Manually clear OTP (after verification)
function clearOtp(email) {
  delete otpMemoryStore[email];
  delete otpTimestampStore[email];
}

module.exports = { saveOtp, verifyOtp, clearOtp, canSendOtp };
