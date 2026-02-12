const CryptoJS = require('crypto-js');
const url = require('url');

// Vercel Serverless Function Handler
module.exports = (req, res) => {
    // Enable CORS just in case, though usually not needed for redirects
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Check method
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Get Secret
    const SECRET_KEY = process.env.OAUTH_STATE_SECRET;
    if (!SECRET_KEY) {
        console.error('Configuration Error: OAUTH_STATE_SECRET is missing');
        return res.status(500).json({ error: 'Server Configuration Error' });
    }

    // Parse Query
    // Vercel req.query is already parsed object
    const { code, state } = req.query;

    if (!code || !state) {
        return res.status(400).json({ error: 'Missing code or state parameter' });
    }

    try {
        // Decrypt State
        // IMPORTANT: The state passed from VoiceHub must be URL-safe encoded if needed, 
        // but here we assume standard encrypted string which might contain special chars.
        // Usually OAuth providers return state exactly as sent.
        
        // Handle potential space vs plus issue in URL decoding if not handled by framework
        const rawState = state.replace(/ /g, '+');
        
        const bytes = CryptoJS.AES.decrypt(rawState, SECRET_KEY);
        const jsonStr = bytes.toString(CryptoJS.enc.Utf8);

        if (!jsonStr) {
            throw new Error('Decryption resulted in empty string');
        }

        const payload = JSON.parse(jsonStr);
        const target = payload.target;

        if (!target) {
            throw new Error('No target origin found in state payload');
        }

        // Security Check (Optional but Recommended)
        // You can restrict targets to your specific domains if needed
        // const ALLOWED_DOMAINS = ['.vercel.app', '.netlify.app', 'localhost'];
        // if (!ALLOWED_DOMAINS.some(d => target.includes(d))) { ... }

        // Construct Redirect URL
        // We preserve the code and state to pass them back to the original app
        const redirectUrl = `${target}/api/auth/github/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(rawState)}`;

        // Perform Redirect
        res.statusCode = 302;
        res.setHeader('Location', redirectUrl);
        res.end();

    } catch (error) {
        console.error('Broker Logic Error:', error.message);
        console.error('State received:', state);
        
        return res.status(400).json({ 
            error: 'Invalid request', 
            details: 'Failed to validate state parameter. The link may have expired or is invalid.' 
        });
    }
};
