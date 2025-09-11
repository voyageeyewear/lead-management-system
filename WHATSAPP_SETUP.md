# WhatsApp Integration Setup Guide

This guide will help you set up WhatsApp messaging using the Interakt API.

## Prerequisites

1. **Interakt Account**: Sign up at [https://www.interakt.ai/](https://www.interakt.ai/)
2. **WhatsApp Business API**: Get approved for WhatsApp Business API through Interakt
3. **API Key**: Obtain your Interakt API key from the dashboard

## Setup Instructions

### 1. Get Your Interakt API Key

1. Log in to your Interakt dashboard
2. Go to Settings → API Keys
3. Copy your API key

### 2. Configure Environment Variables

Add your Interakt API key to the `.env` file:

```env
INTERAKT_API_KEY="bDVDRnJXb1NUVmRxX0xTcTZBNVJBczJoQVFkOXhqWDVnaDAxUVQtU3NQazo="
```

**✅ Your API Key**: `bDVDRnJXb1NUVmRxX0xTcTZBNVJBczJoQVFkOXhqWDVnaDAxUVQtU3NQazo=`

**✅ Webhook Configuration**:
- **Webhook URL**: `https://wp-nknwilort-varuns-projects-9232e32d.vercel.app/webhook/interakt`
- **Secret Key**: `2e0f0a2b-f141-4b52-8b0d-f4973f6a7400`

### 3. WhatsApp Business Number Setup

1. In Interakt dashboard, configure your WhatsApp Business number
2. Complete the verification process
3. Set up message templates (optional but recommended)

## Features

### Individual Messaging
- Send WhatsApp messages to individual leads
- Available from lead detail view and activities page
- Personalization with lead name, company, and phone

### Bulk Messaging
- Send messages to multiple leads at once
- Select leads using checkboxes
- Bulk messaging from leads page and activities page

### Message Templates
The system includes pre-built templates:
- **Welcome Message**: "Hello {{name}}, welcome to our service!"
- **Follow Up**: "Hi {{name}}, just following up on our previous conversation."
- **Reminder**: "Hi {{name}}, this is a friendly reminder about your appointment."
- **Thank You**: "Thank you {{name}} for your interest in our services!"

### Personalization Variables
Use these variables in your messages:
- `{{name}}` - Lead's full name
- `{{company}}` - Lead's company name
- `{{phone}}` - Lead's phone number

## Usage

### From Leads Page
1. **Individual**: Click the WhatsApp icon (💬) next to any lead with a phone number
2. **Bulk**: Select multiple leads → Click "Bulk Actions" → Click "WhatsApp"

### From Activities Page
1. Click "WhatsApp Messaging" button
2. Select leads from the list
3. Choose message type and template
4. Send messages

## Message Types

### Text Messages
- Simple text messages with personalization
- No template approval required
- Instant delivery

### Template Messages
- Pre-approved message templates
- Required for promotional content
- Better delivery rates

## Activity Logging

All WhatsApp messages are automatically logged as activities:
- Individual messages create individual activity records
- Bulk campaigns create a summary activity record
- Includes message content and delivery status

## API Endpoints

### Send WhatsApp Message
```
POST /api/messaging/whatsapp
```

**Request Body:**
```json
{
  "leads": [
    {
      "id": "lead_id",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "9876543210",
      "company": "Acme Corp"
    }
  ],
  "message": "Hello {{name}}, welcome to our service!",
  "messageType": "text",
  "mode": "individual"
}
```

**Response:**
```json
{
  "success": true,
  "successCount": 1,
  "failedCount": 0,
  "totalCount": 1,
  "message": "Messages processed: 1 sent successfully, 0 failed"
}
```

## Phone Number Format

The system automatically handles phone number formatting:
- Removes non-numeric characters
- Extracts country code (defaults to +91 for India)
- Formats for Interakt API requirements

**Examples:**
- Input: `+91 98765 43210` → Output: Country Code: `91`, Phone: `9876543210`
- Input: `9876543210` → Output: Country Code: `91`, Phone: `9876543210`

## Error Handling

The system handles various error scenarios:
- Invalid phone numbers
- API rate limiting
- Network failures
- Insufficient credits

Failed messages are logged with error details for troubleshooting.

## Rate Limiting

- Small delay (100ms) between messages to avoid rate limiting
- Bulk messages are sent sequentially
- Monitor your Interakt dashboard for usage limits

## Troubleshooting

### Common Issues

1. **Messages not sending**
   - Check API key configuration
   - Verify phone number format
   - Check Interakt account credits

2. **Template messages failing**
   - Ensure templates are approved in Interakt dashboard
   - Use correct template names and parameters

3. **Phone number errors**
   - Ensure leads have valid phone numbers
   - Check country code settings

### Support

For technical issues:
1. Check browser console for errors
2. Review server logs
3. Contact Interakt support for API-related issues

## Security Notes

- API keys are stored securely in environment variables
- Messages are sent server-side to protect credentials
- User permissions are enforced for messaging access

## Compliance

- Ensure compliance with WhatsApp Business Policy
- Obtain proper consent before sending messages
- Follow local regulations for business messaging
- Use opt-out mechanisms as required

---

**Note**: Replace `your_actual_interakt_api_key_here` with your real API key from Interakt dashboard.
