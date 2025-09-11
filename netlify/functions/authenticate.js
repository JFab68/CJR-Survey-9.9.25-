// Netlify serverless function for authentication
exports.handler = async (event, context) => {
    // Handle CORS preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
            },
            body: ''
        };
    }

    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({ message: 'Method not allowed' })
        };
    }

    try {
        const { password } = JSON.parse(event.body);
        
        // Use environment variables for production passwords
        // In Netlify dashboard: Settings -> Environment variables -> Add SURVEY_PASSWORDS
        const VALID_PASSWORDS = process.env.SURVEY_PASSWORDS 
            ? process.env.SURVEY_PASSWORDS.split(',').map(p => p.trim())
            : ['DefaultPassword2025']; // Default password if env var not set

        // Log for debugging (remove in production)
        console.log('Authentication attempt received');
        
        if (!password) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({ 
                    success: false,
                    message: 'Password is required'
                })
            };
        }

        if (VALID_PASSWORDS.includes(password)) {
            // Generate a secure token
            const token = generateToken();
            const expires = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Credentials': 'true',
                },
                body: JSON.stringify({ 
                    success: true, 
                    token: token,
                    expires: expires
                })
            };
        } else {
            return {
                statusCode: 401,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({ 
                    success: false,
                    message: 'Invalid access code. Please try again.'
                })
            };
        }
    } catch (error) {
        console.error('Authentication error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({ 
                success: false,
                message: 'Authentication service error. Please try again later.'
            })
        };
    }
};

function generateToken() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
}