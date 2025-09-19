// Cache Statistics Endpoint
// Add this to server.js to monitor cache effectiveness

// Add these variables near the top of server.js:
let cacheStats = {
    preGenerated: 0,
    memoryHits: 0,
    apiCalls: 0,
    totalRequests: 0
};

// Add this endpoint to server.js:
app.get('/api/cache-stats', (req, res) => {
    const hitRate = cacheStats.totalRequests > 0
        ? ((cacheStats.preGenerated + cacheStats.memoryHits) / cacheStats.totalRequests * 100).toFixed(2)
        : 0;

    res.json({
        ...cacheStats,
        hitRate: `${hitRate}%`,
        memoryCacheSize: ttsCache.size,
        message: `${hitRate}% of requests served from cache (no API calls)`
    });
});

// Update the TTS endpoint to track stats:
// When serving pre-generated: cacheStats.preGenerated++;
// When serving from memory: cacheStats.memoryHits++;
// When calling API: cacheStats.apiCalls++;
// Always: cacheStats.totalRequests++;