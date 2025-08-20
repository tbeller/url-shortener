const { app } = require('@azure/functions');
const { initializeServices } = require('../shared/serviceInitializer');

app.http('expand', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'expand/{shortCode}',
    handler: async (request, context) => {
        context.log('Expand URL requested');
        
        try {
            const { urlService } = await initializeServices();
            const shortCode = request.params.shortCode;
            
            const result = await urlService.getOriginalUrl(shortCode);
            
            if (!result.success) {
                return {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ error: result.error })
                };
            }

            return {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(result)
            };
            
        } catch (error) {
            context.log.error('Error expanding URL:', error.message);
            return {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: error.message })
            };
        }
    }
});
