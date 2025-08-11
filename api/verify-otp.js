import { Client, Users, ID, Query } from "node-appwrite";

const otpStore = {}; // Must be same as in send-otp

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT)
    .setKey(process.env.APPWRITE_API_KEY);

const users = new Users(client);

export async function verifyOtpHandler(req, res) {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: "Email and OTP required" });

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

    // ✅ Create session (frontend can store JWT)
    res.json({
        message: "OTP verified",
        userId,
        tempPassword
    });

    delete otpStore[email]; // Clear OTP
}
