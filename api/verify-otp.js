import { Client, Users, ID, Query } from "node-appwrite";

const otpStore = {}; // Must be same as in send-otp

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT)
    .setKey(process.env.APPWRITE_API_KEY);

const users = new Users(client);

export default async function verifyOtpHandler(req, res) {
    // ✅ CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*"); // Or restrict to your domain
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    // ✅ Handle preflight OPTIONS request
    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    // Only allow POST
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { email, otp } = req.body;
    if (!email || !otp) {
        return res.status(400).json({ error: "Email and OTP required" });
    }

    const record = otpStore[email];
    if (!record || record.otp !== otp || Date.now() > record.expires) {
        return res.status(403).json({ error: "Invalid or expired OTP" });
    }

    // Check if user exists
    const existing = await users.list([Query.equal("email", email)]);
    let userId;
    const tempPassword = "TempPass@123"; // For session creation

    if (existing.total === 0) {
        const newUser = await users.create(ID.unique(), email, tempPassword);
        userId = newUser.$id;
    } else {
        userId = existing.users[0].$id;
    }

    // Return success
    res.json({
        message: "OTP verified",
        userId,
        tempPassword
    });

    delete otpStore[email]; // Clear OTP
}
