# WhatsApp Templates for Lead Management System

## 🎯 Ready-to-Use Templates for Interakt

### Template 1: Welcome Message
```
Template Name: welcome_message
Language: English (en)
Category: MARKETING
Header: None
Body: Hello {{1}}! 👋 Welcome to our optical services. We're excited to help you find the perfect eyewear solution. Our team is here to assist you with any questions you may have.
Footer: Thank you for choosing us!
Buttons: None
```

### Template 2: Follow Up
```
Template Name: follow_up
Language: English (en)
Category: MARKETING
Header: None
Body: Hi {{1}}! 😊 Following up on our previous conversation about your optical needs. Do you have any questions about our products or services? We're here to help!
Footer: Best regards, Team
Buttons: None
```

### Template 3: Appointment Reminder
```
Template Name: appointment_reminder
Language: English (en)
Category: UTILITY
Header: None
Body: Hi {{1}}! 📅 This is a friendly reminder about your appointment scheduled for {{2}}. Please let us know if you need to reschedule. Looking forward to seeing you!
Footer: Thank you
Buttons: None
```

### Template 4: Product Inquiry
```
Template Name: product_inquiry
Language: English (en)
Category: MARKETING
Header: None
Body: Hello {{1}}! 👓 Thank you for your interest in our optical products. We have a wide range of frames and lenses available. Would you like to schedule a consultation to find the perfect fit for you?
Footer: Contact us anytime!
Buttons: None
```

### Template 5: Order Confirmation
```
Template Name: order_confirmation
Language: English (en)
Category: UTILITY
Header: None
Body: Hi {{1}}! ✅ Your order #{{2}} has been confirmed. We'll process it within 24 hours and keep you updated on the progress. Thank you for your business!
Footer: Team Optical Services
Buttons: None
```

### Template 6: Special Offer
```
Template Name: special_offer
Language: English (en)
Category: MARKETING
Header: None
Body: Hello {{1}}! 🎉 Special offer just for you! Get 20% off on all premium frames this month. Visit our store or call us to avail this exclusive discount. Limited time offer!
Footer: Terms and conditions apply
Buttons: None
```

## 📋 How to Create These Templates in Interakt

### Step 1: Login to Interakt Dashboard
1. Go to [https://app.interakt.ai](https://app.interakt.ai)
2. Login with your credentials

### Step 2: Navigate to Templates
1. Click on "Templates" in the left sidebar
2. Click "Create Template" or "Add New Template"

### Step 3: Fill Template Details
For each template above:
1. **Template Name**: Use the exact name provided (e.g., `welcome_message`)
2. **Language**: Select "English (en)"
3. **Category**: Choose MARKETING or UTILITY as specified
4. **Header**: Leave blank (select "None")
5. **Body**: Copy the exact body text provided
6. **Footer**: Add the footer text if provided
7. **Buttons**: Select "None" for now

### Step 4: Submit for Approval
1. Click "Submit for Review"
2. Wait for WhatsApp approval (usually 24-48 hours)
3. Check approval status in your dashboard

### Step 5: Test Templates
Once approved, test with this format:
```bash
curl -X POST "https://api.interakt.ai/v1/public/message/" \
  -H "Content-Type: application/json" \
  -u "l5CFrWoSTVdq_LSq6A5RAs2hAQd9xjX5gh01QT-SsPk:" \
  -d '{
    "countryCode": "91",
    "phoneNumber": "8852968844",
    "type": "Template",
    "template": {
      "name": "welcome_message",
      "languageCode": "en",
      "headerValues": [],
      "bodyValues": ["John Doe"],
      "buttonValues": {}
    }
  }'
```

## 🎯 Template Usage in Your LMS

Once templates are approved, your Lead Management System will automatically use them:

### Individual Messages
- Click WhatsApp button next to any lead
- Select template from dropdown
- System will replace {{1}} with lead's name
- Message sent automatically

### Bulk Messages
- Select multiple leads
- Click bulk WhatsApp button
- Choose template
- System sends personalized messages to all selected leads

## 📱 Template Variables

Your system will automatically fill these variables:
- `{{1}}` = Lead's full name (firstName + lastName)
- `{{2}}` = Custom data (appointment time, order number, etc.)
- `{{3}}` = Additional custom data

## ⚡ Quick Start Templates

For immediate use, create these 3 essential templates first:

### 1. Basic Welcome (Simplest)
```
Name: basic_welcome
Body: Hello {{1}}! Welcome to our optical services. How can we help you today?
```

### 2. Simple Follow Up
```
Name: simple_followup
Body: Hi {{1}}! Following up on your optical needs. Any questions for us?
```

### 3. Quick Reminder
```
Name: quick_reminder
Body: Hi {{1}}! Just a quick reminder about your appointment. See you soon!
```

## 🚀 After Templates are Approved

1. Your LMS WhatsApp integration will work perfectly
2. All 100 imported leads can receive messages
3. Bulk messaging will be fully functional
4. Activity logging will track all sent messages
5. Webhook will provide delivery status updates

## 📞 Support

If you need help with template approval:
1. Contact Interakt support
2. Ensure templates follow WhatsApp Business Policy
3. Use simple, clear language
4. Avoid promotional content in UTILITY templates

---

**Ready to send WhatsApp messages to all your 100 leads once templates are approved!** 🎉
