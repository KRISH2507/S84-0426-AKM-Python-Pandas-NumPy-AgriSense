# Automated Testing Framework

## Test Pyramid
- Unit tests: 70% coverage target
- Integration tests: API endpoints
- E2E tests: Critical user flows

## Tools
- pytest for backend testing
- pytest-cov for coverage reports
- Faker for test data generation
- Factory Boy for model fixtures

## CI/CD Integration
- Run tests on every PR
- Block merge if coverage < 80%
- Performance regression tests
- Security vulnerability scanning

## Test Categories
- Model accuracy tests (>85% threshold)
- API contract tests
- Database migration tests
- Load testing with Locust
