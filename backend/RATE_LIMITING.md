# API Rate Limiting Implementation

## Rate Limit Tiers
- Free tier: 100 requests/hour
- Premium: 1000 requests/hour
- Enterprise: Unlimited

## Implementation
- Use Redis for distributed rate limiting
- Implement sliding window algorithm
- Return 429 status with Retry-After header

## Endpoints
- /api/predict/*: 10 req/min per user
- /api/farms: 30 req/min per user
- /api/auth/login: 5 req/min per IP
