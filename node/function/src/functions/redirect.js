const { app } = require('@azure/functions');
const { initializeServices } = require('../shared/serviceInitializer');

app.http('redirect', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: '{shortCode}',
    handler: async (request, context) => {
        context.log('Redirect requested');
        
        try {
            const { urlService } = await initializeServices();
            const shortCode = request.params.shortCode;
            
            // Skip if this is an API route or health check
            if (shortCode === 'health' || shortCode === 'shorten' || 
                shortCode === 'expand' || shortCode === 'urls' || 
                shortCode.startsWith('api')) {
                return {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ error: 'Not found' })
                };
            }
            
            const result = await urlService.getOriginalUrl(shortCode);
            
            if (!result.success) {
                return {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ error: result.error })
                };
            }

            // Redirect to the original URL
            return {
                status: 302,
                headers: {
                    'Location': result.originalUrl
                }
            };
            
        } catch (error) {
            context.log.error('Error redirecting:', error.message);
            return {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: error.message })
            };
        }
    }
});
