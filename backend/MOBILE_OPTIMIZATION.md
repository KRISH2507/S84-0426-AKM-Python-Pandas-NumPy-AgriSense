# Mobile API Optimization

## Response Compression
- Gzip compression for responses > 1KB
- Brotli compression for static assets
- Reduce payload size by 60%

## Pagination
- Cursor-based pagination for large datasets
- Default page size: 20 items
- Max page size: 100 items

## Offline Support
- ETag headers for cache validation
- Last-Modified headers
- 304 Not Modified responses

## Network Efficiency
- GraphQL endpoint for flexible queries
- Batch API requests
- Delta sync for incremental updates
- Image optimization (WebP format)

## Mobile-Specific Endpoints
- /api/mobile/dashboard (optimized payload)
- /api/mobile/sync (delta updates)
