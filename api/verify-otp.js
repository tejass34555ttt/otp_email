import { verifyOtp, clearOtp } from "../utilis/otp_store.js";
import { Client, Users, ID, Query } from "node-appwrite";

export default async function handler(req, res) {
  // ✅ Handle CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ✅ Handle Preflight
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  // ✅ Validate input
  const { email: rawEmail, otp } = req.body;
  const email = rawEmail?.trim().toLowerCase();
  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP are required" });
  }

  // ✅ Verify OTP
  if (!verifyOtp(email, otp)) {
    return res.status(403).json({ error: "Invalid OTP" });
  }

  // ✅ Init Appwrite
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const users = new Users(client);

  try {
    // ✅ Check if user exists
    const existing = await users.list([Query.equal("email", email)]);
    let userId;

    if (existing.total === 0) {
      const newUser = await users.create(ID.unique(), email, "TempPass@123");
      userId = newUser.$id;
    } else {
      userId = existing.users[0].$id;
    }

    // ✅ Generate JWT
    const jwt = await users.createJWT(userId);
    clearOtp(email); // Clear stored OTP

    return res.status(200).json({ message: "OTP verified", jwt: jwt.jwt, userId });
  } catch (error) {
    console.error("❌ Login failed:", error.message);
    return res.status(500).json({ error: "OTP verified, but login failed", details: error.message });
  }
}
