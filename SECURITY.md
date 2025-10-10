# Security Policy

## Supported Versions

We currently support the following versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in this portfolio application, please report it responsibly:

### How to Report

1. **Email**: Send details to [your-email@example.com]
2. **GitHub**: Create a private security advisory in this repository
3. **Include**: 
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- **Response Time**: We will acknowledge receipt within 48 hours
- **Investigation**: We will investigate and respond within 7 days
- **Resolution**: Security fixes will be prioritized and released as soon as possible
- **Credit**: We will credit security researchers (unless anonymity is requested)

## Security Features

This application implements several security measures:

### Authentication & Authorization
- JWT-based authentication with secure token handling
- Refresh token rotation with automatic cleanup
- Rate limiting on authentication endpoints
- Secure password hashing with BCrypt

### API Security
- CORS configuration for controlled cross-origin access
- Input validation and sanitization
- SQL injection prevention through JPA/Hibernate
- XSS protection headers

### Infrastructure Security
- HTTPS enforcement in production
- Security headers (CSP, HSTS, etc.)
- Database connection security
- Container security best practices

### Data Protection
- Sensitive data encryption at rest
- Secure session management
- Personal data handling compliance
- Regular security dependency updates

## Security Best Practices

When deploying this application:

1. **Environment Variables**: Never commit secrets to version control
2. **Database**: Use strong passwords and restrict access
3. **HTTPS**: Always use HTTPS in production
4. **Updates**: Keep dependencies updated
5. **Monitoring**: Monitor for suspicious activity
6. **Backups**: Maintain secure backups
7. **Access Control**: Implement proper user access controls

## Vulnerability Disclosure Timeline

- **Day 0**: Vulnerability reported
- **Day 1-2**: Acknowledgment and initial assessment
- **Day 3-7**: Investigation and reproduction
- **Day 8-14**: Fix development and testing
- **Day 15+**: Public disclosure after fix deployment

Thank you for helping keep our portfolio application secure!