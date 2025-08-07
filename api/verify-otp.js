import { verifyOtp, clearOtp } from "../utilis/otp_store.js";
import { Client, Users, ID, Query, Account } from "node-appwrite";

export default async function handler(req, res) {
  // ✅ Allow all origins (development only – secure this in production)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ✅ Handle preflight (OPTIONS) request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { email: rawEmail, otp } = req.body;
    const email = rawEmail?.trim().toLowerCase();

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    const isValid = verifyOtp(email, otp);
    if (!isValid) {
      return res.status(403).json({ error: "Invalid OTP" });
    }

    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT)
      .setKey(process.env.APPWRITE_API_KEY);

    const users = new Users(client);

    let userId;
    const existing = await users.list([Query.equal("email", email)]);

    if (existing.total === 0) {
      const newUser = await users.create(ID.unique(), email, "TempPass@123");
      userId = newUser.$id;
    } else {
      userId = existing.users[0].$id;
    }

    const account = new Account(client);
    const jwtSession = await account.createJWT();
    const jwt = jwtSession.jwt;

    clearOtp(email);

    return res.status(200).json({ message: "OTP verified", userId, jwt });

  } catch (error) {
    console.error("❌ Login failed:", error);
    return res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
}
