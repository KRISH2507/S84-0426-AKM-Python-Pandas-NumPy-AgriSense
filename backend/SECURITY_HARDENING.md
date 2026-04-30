# Security Hardening Checklist

## Authentication & Authorization
- JWT token expiration: 24 hours
- Refresh token rotation
- Role-based access control (RBAC)
- Multi-factor authentication (MFA)

## Data Protection
- Encrypt sensitive fields at rest (AES-256)
- TLS 1.3 for data in transit
- Password hashing with bcrypt (cost factor 12)
- PII data masking in logs

## API Security
- CORS whitelist for production domains
- Content Security Policy headers
- Rate limiting per endpoint
- Input validation with Pydantic
- SQL injection prevention (parameterized queries)

## Compliance
- GDPR data export/deletion endpoints
- Audit logs for data access
- Regular security audits
- Dependency vulnerability scanning
