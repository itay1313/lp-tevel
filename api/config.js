export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Only return the app ID, the secret should never be exposed to the client
  res.status(200).json({
    appId: process.env.UPLOADTHING_APP_ID
  });
} 