# Email Reception Guide for SpareMails

## 📧 How to Receive Emails in Your Temporary Email Service

There are several methods to receive emails sent to your temporary email addresses. Here are the main approaches:

## 🔧 Method 1: Webhook Integration (Recommended for Production)

### Using Third-Party Email Services

**Step 1: Set up with Mailgun, SendGrid, or similar service**

1. **Mailgun Setup:**
   ```bash
   # Add your domain to Mailgun
   # Configure MX records to point to Mailgun
   # Set up webhook URL: https://yourdomain.com/api/webhooks/mailgun
   ```

2. **Test the webhook:**
   ```bash
   # Test webhook reception
   curl -X POST http://localhost:3000/api/webhooks/email \
     -H "Content-Type: application/json" \
     -d '{
       "to": "test@temp-mail.local",
       "from": "sender@example.com", 
       "subject": "Test Email",
       "text": "Hello from webhook!",
       "html": "<p>Hello from webhook!</p>"
     }'
   ```

### Available Webhook Endpoints

- `POST /api/webhooks/mailgun` - For Mailgun webhooks
- `POST /api/webhooks/sendgrid` - For SendGrid webhooks  
- `POST /api/webhooks/email` - Generic webhook for testing

## 🔧 Method 2: SMTP Server (For Advanced Users)

### Direct SMTP Reception

The backend includes an SMTP server that can receive emails directly:

```javascript
// The SMTP server is already implemented in src/utils/smtpReceiver.ts
// It listens on port 2525 by default (configurable via SMTP_PORT env var)
```

**To enable SMTP reception:**

1. **Update your server.ts:**
```typescript
import smtpReceiver from './utils/smtpReceiver';

// In startServer function, add:
await smtpReceiver.start();
```

2. **Configure your domain's MX records:**
```dns
yourdomain.com.    IN MX 10 yourserver.com.
```

3. **Set up port forwarding (if needed):**
```bash
# Forward port 25 to 2525 (requires root)
sudo iptables -t nat -A PREROUTING -p tcp --dport 25 -j REDIRECT --to-port 2525
```

## 🧪 Method 3: Testing with curl (Development)

For testing purposes, you can simulate incoming emails:

```bash
# Create a temporary email first
curl -X POST http://localhost:3000/api/temporary-emails \
  -H "Content-Type: application/json" \
  -d '{"customName": "test", "expiryMinutes": 30}'

# Simulate receiving an email
curl -X POST http://localhost:3000/api/webhooks/email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@temp-mail.local",
    "from": "john@example.com",
    "subject": "Welcome to SpareMails!",
    "text": "This is a test email sent to your temporary address.",
    "html": "<h1>Welcome!</h1><p>This is a test email sent to your temporary address.</p>"
  }'

# Check if email was received
curl http://localhost:3000/api/temporary-emails/YOUR_EMAIL_ID/emails
```

## 📋 Production Setup Recommendations

### 1. **Using Mailgun (Easiest)**

```javascript
// Mailgun webhook configuration
const mailgunConfig = {
  domain: 'mg.yourdomain.com',
  webhookUrl: 'https://yourapi.com/api/webhooks/mailgun',
  apiKey: 'your-mailgun-api-key'
};
```

### 2. **Using Postfix + Your Server**

```bash
# Install Postfix
sudo apt-get install postfix

# Configure Postfix to forward emails to your app
echo "temp-mail.local    transport:[localhost]:2525" >> /etc/postfix/transport
sudo postmap /etc/postfix/transport
sudo systemctl reload postfix
```

### 3. **DNS Configuration**

```dns
# MX Record
yourdomain.com.        IN MX 10 mail.yourdomain.com.

# A Record for mail server
mail.yourdomain.com.   IN A  YOUR_SERVER_IP

# Wildcard subdomain (optional)
*.yourdomain.com.      IN A  YOUR_SERVER_IP
```

## 🔐 Security Considerations

### Webhook Security

```typescript
// Add webhook signature verification (example for Mailgun)
const crypto = require('crypto');

const verifyWebhookSignature = (req, res, next) => {
  const signature = req.get('X-Mailgun-Signature-V2');
  const timestamp = req.get('X-Mailgun-Timestamp');
  const token = req.get('X-Mailgun-Token');
  
  const expected = crypto
    .createHmac('sha256', process.env.MAILGUN_WEBHOOK_KEY)
    .update(timestamp + token)
    .digest('hex');
    
  if (signature !== expected) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  next();
};
```

## 📊 Monitoring Email Reception

```bash
# Check server logs for incoming emails
tail -f logs/combined.log | grep "Received email"

# Monitor webhook endpoint
curl http://localhost:3000/api/health

# Check database for received emails
# (Use your preferred database client)
```

## 🚀 Quick Start for Development

1. **Start your backend:**
   ```bash
   npm run dev
   ```

2. **Create a temporary email:**
   ```bash
   curl -X POST http://localhost:3000/api/temporary-emails \
     -H "Content-Type: application/json" \
     -d '{"customName": "mytest"}'
   ```

3. **Send a test email via webhook:**
   ```bash
   curl -X POST http://localhost:3000/api/webhooks/email \
     -H "Content-Type: application/json" \
     -d '{
       "to": "mytest@temp-mail.local",
       "from": "friend@example.com",
       "subject": "Hello!",
       "text": "This is a test message."
     }'
   ```

4. **Check received emails:**
   ```bash
   curl http://localhost:3000/api/temporary-emails/YOUR_EMAIL_ID/emails
   ```

## 📈 Scaling Considerations

- Use message queues (Redis/RabbitMQ) for high-volume email processing
- Implement rate limiting on webhook endpoints
- Use CDN for static file attachments
- Consider database sharding for large-scale deployments
- Set up monitoring and alerting for email processing failures

The webhook approach is recommended for production as it's more reliable and easier to manage than running your own SMTP server.