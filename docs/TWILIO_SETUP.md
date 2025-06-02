# Twilio SMS OTP Authentication for Electrophilic

This document provides information on how to set up and use the Twilio SMS OTP authentication system in the Electrophilic e-commerce application.

## Setup Instructions

1. **Create a Twilio Account**
   - Sign up at [https://www.twilio.com/](https://www.twilio.com/)
   - Purchase a phone number with SMS capabilities
   - Get your Account SID and Auth Token from the Twilio Console dashboard

2. **Set Environment Variables**
   Update your `.env.local` file with your Twilio credentials:
   ```
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_phone_number
   ```

3. **Test the Integration**
   - In development mode, OTPs will be logged to the console
   - In production, Twilio will send real SMS messages to user phones

## Usage

The system is ready to use with the following components:

- `/api/auth/phone/send-otp` - API endpoint for sending OTPs
- `/api/auth/phone/verify-otp` - API endpoint for verifying OTPs
- `MobileVerificationForm` - React component for phone verification UI
- `/account/verify-phone` - Page for verifying phone numbers

## Troubleshooting

- **SMS Not Sending**
  - Verify your Twilio credentials are correct
  - Ensure the phone number is in E.164 format (e.g., +919876543210)
  - Check the Twilio console for any error messages or failed deliveries

- **International Numbers**
  - By default, the system assumes Indian phone numbers (+91)
  - For other countries, ensure the phone number includes the country code

## Security Considerations

- OTPs are hashed before storage in the database
- OTPs expire after 10 minutes
- Failed verification attempts are logged for security monitoring
- Production environments should use HTTPS for all API requests

## Mobile Implementation

For the mobile app implementation, use the same API endpoints from the native mobile app, calling:

```
POST /api/auth/phone/send-otp
POST /api/auth/phone/verify-otp
```

The response format is consistent between web and mobile platforms.