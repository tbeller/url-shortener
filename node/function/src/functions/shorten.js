const { app } = require('@azure/functions');
const { initializeServices } = require('../shared/serviceInitializer');

app.http('shorten', {
    methods: ['POST', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'shorten',
    handler: async (request, context) => {
        context.log('Shorten URL requested');
        
        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return {
                status: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                }
            };
        }
        
        try {
            const { urlService } = await initializeServices();
            
            const body = await request.json();
            const { url } = body;
            
            if (!url) {
                return {
                    status: 400,
                    headers: { 
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'POST, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type'
                    },
                    body: JSON.stringify({ error: 'URL is required' })
                };
            }

            const result = await urlService.createShortUrl(url);
            
            return {
                status: 200,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                },
                body: JSON.stringify(result)
            };
            
        } catch (error) {
            context.log.error('Error creating short URL:', error.message);
            return {
                status: 500,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                },
                body: JSON.stringify({ error: error.message })
            };
        }
    }
});
