import { verifyOtp, clearOtp } from "../utilis/otp_store.js";
import { Client, Users, ID, Query, Account } from "node-appwrite";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const { email: rawEmail, otp } = req.body;
  const email = rawEmail?.trim().toLowerCase();
  const tempPassword = "TempPass@123";

  if (!email || !otp) return res.status(400).json({ error: "Email and OTP are required" });

  if (!verifyOtp(email, otp)) return res.status(403).json({ error: "Invalid OTP" });

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT)
    .setKey(process.env.APPWRITE_API_KEY);

  const users = new Users(client);

  try {
    const existing = await users.list([Query.equal("email", email)]);
    let userId;

    if (existing.total === 0) {
      const newUser = await users.create(ID.unique(), email, tempPassword);
      userId = newUser.$id;
    } else {
      userId = existing.users[0].$id;
    }

    // Create a session to get JWT
    const account = new Account(client);

    // ⚠️ IMPORTANT: Set session using email & password
    const session = await account.createEmailSession(email, tempPassword);

    clearOtp(email);

    return res.status(200).json({
      message: "OTP verified",
      userId,
      jwt: session?.jwt ?? null,
      sessionId: session?.$id ?? null
    });
  } catch (error) {
    console.error("❌ Login failed:", error);
    return res.status(500).json({ error: "OTP verified, but login failed", details: error.message });
  }
}
