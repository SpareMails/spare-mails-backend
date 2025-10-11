# SpareMails Backend - Development Notes

## Project Overview

SpareMails is a temporary email service similar to 10minutemail or Guerrilla Mail. Users can generate disposable email addresses that automatically expire after a specified time period.

## Architecture Overview

### Core Components

1. **Temporary Email Management**
   - Create temporary email addresses with custom or random usernames
   - Support multiple domains
   - Configurable expiry times (1 minute to 24 hours)
   - Automatic cleanup of expired addresses

2. **Email Reception & Processing**
   - Parse incoming emails using mailparser
   - Store text and HTML content
   - Handle attachments with file system storage
   - Extract sender information

3. **Database Design**
   - **domains**: Available email domains
   - **temporary_emails**: Generated temporary email addresses
   - **received_emails**: Emails received at temporary addresses
   - **email_attachments**: File attachments metadata

4. **Scheduled Tasks**
   - Cleanup expired temporary emails (every 5 minutes)
   - Remove old received emails (every hour)
   - Delete old attachments (daily)
   - Database maintenance (weekly)

### API Design Principles

- RESTful endpoints following standard conventions
- Consistent response format with success/error status
- Proper HTTP status codes
- Pagination for list endpoints
- Input validation and sanitization
- Comprehensive error handling

### Security Considerations

- Input validation on all endpoints
- File upload restrictions
- SQL injection prevention via ORM
- XSS protection through content sanitization
- CORS configuration
- Security headers

## Development Setup

1. Install dependencies and set up environment
2. Configure MySQL database
3. Run database migrations/seeding
4. Start development server with auto-reload

## Testing Strategy

- Unit tests for utilities and helpers
- Integration tests for API endpoints
- Database tests for model operations
- Email processing tests

## Production Considerations

- Environment-specific configurations
- Database connection pooling
- Logging and monitoring
- File storage optimization
- Backup strategies
- Performance monitoring

## Future Enhancements

- Rate limiting
- Admin dashboard
- Email forwarding
- Webhook notifications
- Multi-language support
- Docker containerization