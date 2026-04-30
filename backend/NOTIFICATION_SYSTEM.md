# Push Notification Service

## Notification Types
- Price alerts: When crop price changes > 5%
- Weather warnings: Severe weather in farm area
- Harvest reminders: Based on crop calendar
- Weekly insights: Sunday morning digest

## Delivery Channels
- Push notifications (FCM for mobile)
- Email (SendGrid/AWS SES)
- SMS (Twilio for critical alerts)
- In-app notifications

## User Preferences
- Notification frequency settings
- Channel preferences per alert type
- Quiet hours (10 PM - 7 AM)
- Geofencing for location-based alerts

## Implementation
- Message queue (RabbitMQ) for async delivery
- Retry logic with exponential backoff
- Delivery status tracking
- Unsubscribe management
