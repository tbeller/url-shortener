const { app } = require('@azure/functions');
const { initializeServices } = require('../shared/serviceInitializer');

app.http('getAllUrls', {
    methods: ['GET', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'urls',
    handler: async (request, context) => {
        context.log('Get all URLs requested');
        
        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return {
                status: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                }
            };
        }
        
        try {
            const { urlService } = await initializeServices();
            const result = await urlService.getAllUrls();
            
            return {
                status: 200,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                },
                body: JSON.stringify(result)
            };
            
        } catch (error) {
            context.log.error('Error getting all URLs:', error.message);
            return {
                status: 500,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                },
                body: JSON.stringify({ error: error.message })
            };
        }
    }
});
