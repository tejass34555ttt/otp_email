// services/appwriteClient.js
require('dotenv').config(); // ✅ This is MANDATORY here

const { Client, Users } = require('node-appwrite');

// Debug log (optional)
console.log('📡 APPWRITE_ENDPOINT:', process.env.APPWRITE_ENDPOINT);

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT)
  .setKey(process.env.APPWRITE_API_KEY);

const users = new Users(client);

module.exports = { client, users };
