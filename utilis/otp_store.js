import { Client, Databases, ID, Query } from "node-appwrite";

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DATABASE_ID = process.env.DATABASE_ID;
const COLLECTION_ID = process.env.APPWRITE_OTP_COLLECTION_ID;

// Save OTP
export async function saveOtp(email, otp) {
  try {
    // Remove existing OTP
    const existing = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.equal("email", email),
    ]);

    if (existing.total > 0) {
      await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, existing.documents[0].$id);
    }

    await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
      email,
      otp,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Error saving OTP:", err.message);
  }
}

// Verify OTP
export async function verifyOtp(email, inputOtp) {
  try {
    const existing = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.equal("email", email),
    ]);

    if (existing.total === 0) return false;

    const storedOtp = existing.documents[0];
    const isMatch = storedOtp.otp === inputOtp;

    const expiryTime = new Date(storedOtp.createdAt).getTime() + 5 * 60 * 1000; // 5 mins
    const isExpired = Date.now() > expiryTime;

    return isMatch && !isExpired;
  } catch (err) {
    console.error("OTP verification failed:", err.message);
    return false;
  }
}

// Clear OTP
export async function clearOtp(email) {
  try {
    const existing = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.equal("email", email),
    ]);
    if (existing.total > 0) {
      await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, existing.documents[0].$id);
    }
  } catch (err) {
    console.error("Error clearing OTP:", err.message);
  }
}
