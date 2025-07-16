# Trashlance API Testing Guide

## Quick Setup Instructions

1. **Import Collection**: Import the `trashlance-postman-collection.json` into Postman
2. **Set Base URL**: Ensure the `baseUrl` variable is set to `http://localhost:5000/api`
3. **Run Tests in Order**: Follow the numbered sequence for best results

## Testing Sequence

### Phase 1: Basic Authentication & Setup
1. **Health Check** - Verify server is running
2. **Register Customer** - Creates a customer account and saves auth token
3. **Register Service Provider** - Creates a provider account
4. **Login Customer** - Login and update auth token
5. **Get Current User** - Verify authentication works

### Phase 2: Core Functionality
6. **Create Service** - Service provider creates a service
7. **Get All Services** - Verify service listing works
8. **Get Service by ID** - Test individual service retrieval

### Phase 3: Posts System (Illegal Dumping Reports)
9. **Create Post** - Create illegal dumping report (requires image file)
10. **Get All Posts** - List all posts with pagination
11. **Get Post by ID** - Retrieve specific post
12. **Upvote Post** - Test upvoting functionality
13. **Add Comment** - Add comment to post

### Phase 4: Booking System
14. **Create Booking** - Create a service booking
15. **Get User Bookings** - List user's bookings
16. **Get Booking by ID** - Retrieve specific booking

### Phase 5: Additional Features
17. **Get User by ID** - User profile retrieval
18. **Get Leaderboard** - Gamification leaderboard
19. **Get Available Plans** - Subscription plans
20. **Subscribe to Plan** - Test subscription
21. **Get Notifications** - User notifications

## Important Notes

### For Image Upload Tests:
- In "Create Post" test, you need to add an actual image file
- Go to Body → form-data → images → Select File
- Choose any JPG/PNG image from your computer

### Authentication:
- The collection automatically saves and uses auth tokens
- If a test fails due to authentication, re-run the login test

### Variables Used:
- `baseUrl`: API base URL
- `authToken`: JWT authentication token
- `userId`: Current user ID
- `serviceId`: Created service ID
- `bookingId`: Created booking ID
- `postId`: Created post ID

## Expected Results

### Successful Tests Should Return:
- **200/201 status codes** for successful operations
- **JSON responses** with `success: true`
- **Proper data structures** as defined in the API

### Common Issues:
- **401 Unauthorized**: Re-run login test
- **404 Not Found**: Check if required resources exist
- **400 Bad Request**: Verify request body format
