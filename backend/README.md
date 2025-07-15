# Trashlance Backend API

A comprehensive MERN stack backend for the Trashlance waste management system.

## Features

- **User Management**: Registration, authentication, profile management
- **Service Provider System**: Verification, service offerings, availability management
- **Booking System**: Create, manage, track waste collection bookings
- **Real-time Tracking**: Live location updates and communication
- **Payment Integration**: Stripe payment processing
- **Review System**: Rating and feedback system
- **Notification System**: Multi-channel notifications (email, SMS, in-app)
- **Admin Dashboard**: System management and analytics

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT
- **File Upload**: Cloudinary
- **Email**: Nodemailer (Gmail SMTP)
- **SMS**: Twilio
- **Payments**: Stripe
- **Real-time**: Socket.IO
- **Maps**: Google Maps API

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Free accounts for external services (see setup below)

### Installation

1. **Clone and install dependencies**
```bash
cd backend
npm install
```

2. **Environment Setup**
```bash
cp .env.example .env
```

3. **Configure environment variables** (see External Services Setup below)

4. **Start the server**
```bash
# Development
npm run dev

# Production
npm start
```

## External Services Setup (All Free Tiers)

### 1. MongoDB
- **Option A**: Local MongoDB
  ```bash
  # Install MongoDB locally
  # Set MONGODB_URI=mongodb://localhost:27017/trashlance
  ```
- **Option B**: MongoDB Atlas (Free)
  - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
  - Create free cluster
  - Get connection string
  - Set `MONGODB_URI=your_atlas_connection_string`

### 2. Cloudinary (Free - 25GB storage)
- Go to [Cloudinary](https://cloudinary.com/)
- Sign up for free account
- Get credentials from dashboard
- Set in `.env`:
  ```
  CLOUDINARY_CLOUD_NAME=your_cloud_name
  CLOUDINARY_API_KEY=your_api_key
  CLOUDINARY_API_SECRET=your_api_secret
  ```

### 3. Gmail SMTP (Free)
- Enable 2-factor authentication on Gmail
- Generate App Password:
  - Go to Google Account settings
  - Security → 2-Step Verification → App passwords
  - Generate password for "Mail"
- Set in `.env`:
  ```
  EMAIL_HOST=smtp.gmail.com
  EMAIL_PORT=587
  EMAIL_USER=your_email@gmail.com
  EMAIL_PASS=your_app_password
  ```

### 4. Twilio (Free - $15 trial credit)
- Go to [Twilio](https://www.twilio.com/)
- Sign up and verify phone number
- Get credentials from console
- Set in `.env`:
  ```
  TWILIO_ACCOUNT_SID=your_account_sid
  TWILIO_AUTH_TOKEN=your_auth_token
  TWILIO_PHONE_NUMBER=your_twilio_phone
  ```

### 5. Stripe (Free - Test mode)
- Go to [Stripe](https://stripe.com/)
- Create account
- Get test API keys from dashboard
- Set in `.env`:
  ```
  STRIPE_SECRET_KEY=sk_test_your_secret_key
  STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
  ```

### 6. Google Maps API (Free - $200 monthly credit)
- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Create project and enable Maps APIs
- Create API key with restrictions
- Set in `.env`:
  ```
  GOOGLE_MAPS_API_KEY=your_api_key
  ```

## API Testing with Postman

1. **Import Collection**
   - Import `Trashlance_Postman_Collection.json`
   - Set `base_url` variable to `http://localhost:5000/api`

2. **Test Flow**
   ```
   1. Health Check → Verify API is running
   2. Register User → Get auth token
   3. Login User → Get auth token
   4. Create Service → Get service ID
   5. Create Booking → Test booking flow
   6. Test other endpoints
   ```

3. **Authentication**
   - Most endpoints require authentication
   - Token is automatically set after login/register
   - Manual token: Set `auth_token` variable

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/verify-email/:token` - Verify email
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password/:token` - Reset password

### Services
- `GET /api/services` - Get all services
- `POST /api/services` - Create service (providers only)
- `GET /api/services/:id` - Get service by ID
- `PUT /api/services/:id` - Update service
- `DELETE /api/services/:id` - Delete service

### Bookings
- `GET /api/bookings` - Get user bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/:id` - Get booking details
- `PATCH /api/bookings/:id/status` - Update booking status
- `PATCH /api/bookings/:id/location` - Update location
- `POST /api/bookings/:id/messages` - Add message
- `PATCH /api/bookings/:id/cancel` - Cancel booking

### Reviews
- `GET /api/reviews` - Get reviews
- `POST /api/reviews` - Create review
- `GET /api/reviews/:id` - Get review by ID
- `PATCH /api/reviews/:id/helpful` - Mark helpful

### Payments
- `POST /api/payments/create-intent` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment
- `POST /api/payments/webhook` - Stripe webhook

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/providers` - Get service providers

### Notifications
- `GET /api/notifications` - Get notifications
- `PATCH /api/notifications/:id/read` - Mark as read
- `PATCH /api/notifications/mark-all-read` - Mark all as read

### Admin
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/users` - Get all users
- `PATCH /api/admin/providers/:id/verify` - Verify provider

## Real-time Features

### Socket.IO Events

**Client → Server:**
- `join` - Join user room for notifications
- `location-update` - Send location update
- `booking-status` - Update booking status

**Server → Client:**
- `new-booking` - New booking notification
- `booking-status` - Booking status update
- `location-update` - Location update
- `new-message` - New message notification

## Database Schema

### User Model
- Basic info (name, email, phone)
- Authentication fields
- Address with coordinates
- Service provider specific fields
- Verification status

### Service Model
- Service details and pricing
- Availability and scheduling
- Service area definition
- Images and ratings

### Booking Model
- Customer and provider references
- Service details and location
- Status tracking and history
- Communication thread
- Payment information

### Review Model
- Multi-aspect ratings
- Review content and images
- Helpful votes system
- Response capability

### Notification Model
- Multi-channel delivery
- Read status tracking
- Categorization and priority

## Security Features

- JWT authentication
- Password hashing (bcrypt)
- Rate limiting
- Input validation
- CORS configuration
- Helmet security headers
- File upload restrictions

## Error Handling

- Centralized error handling
- Mongoose error formatting
- Validation error messages
- Development vs production errors
- Logging system

## Testing

Run the test suite:
```bash
npm test
```

Test with Postman:
1. Import collection
2. Run health check
3. Test authentication flow
4. Test main features

## Deployment

### Environment Variables for Production
```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=your_production_mongodb_uri
JWT_SECRET=your_super_secure_jwt_secret
# ... other production configs
```

### PM2 Deployment
```bash
npm install -g pm2
pm2 start server.js --name trashlance-api
pm2 startup
pm2 save
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

## Support

For issues and questions:
- Check the API documentation
- Test with Postman collection
- Review error logs
- Contact development team

## License

MIT License - see LICENSE file for details