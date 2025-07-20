# Trashlance – Waste Management Platform

A full-stack MERN application connecting users with reliable waste management services. Book collectors, report issues, chat, and track your environmental impact.

---

## Table of Contents

- [Features](#features)
- [User Flow](#user-flow)
- [Tech Stack](#tech-stack)
- [Setup & Installation](#setup--installation)
- [API Overview](#api-overview)
- [Frontend Overview](#frontend-overview)
- [Security](#security)
- [Testing](#testing)
- [Can Be Added Later](#can-be-added-later)

---

## Features

### For Users
- **Sign Up & Login:** Register as a user or collector, with secure authentication.
- **Book Waste Collection:** Find and book certified collectors in your area.
- **Flexible Scheduling:** Choose collection times and payment methods (cash, M-Pesa, card).
- **Track Bookings:** Real-time status updates for your pickups.
- **Report Illegal Dumpsites:** Submit reports with photos and location pins.
- **Leaderboard:** Earn points for positive actions and climb the community leaderboard.
- **Notifications:** Receive updates via email, SMS, and in-app.
- **Profile Management:** Update your info, view booking history, and manage settings.
- **Chat:** In-app messaging with collectors for updates or clarifications.

### For Collectors (Service Providers)
- **Onboarding Flow:** Multi-step onboarding for business info, service area, pricing, and document uploads.
- **Service Management:** Add, edit, and manage offered services.
- **Booking Management:** View and manage incoming bookings, update statuses, and communicate with users.
- **Subscription Plans:** Choose from Freemium, Standard, or Premium plans for more features and visibility.
- **Analytics:** View booking stats, earnings, and performance.
- **Profile & Availability:** Set working hours, service radius, and manage business documents.
- **In-site chat:** Communicate with clients directly inapp.

### For Admins
- **Dashboard:** System analytics and quick stats.
- **User Management:** View, verify, or moderate users and collectors.
- **Booking Oversight:** Monitor all bookings and reported issues.
- **Content Moderation:** Manage posts and reports.
- **Create Government Accounts:** For official oversight and reporting.

### For Government/Authorities
- **Reports Dashboard:** View and act on illegal dumping reports.
- **Location Management:** Oversee service areas and coverage.

### General
- **Real-Time Features:** Live chat, booking status, and notifications via Socket.IO.
- **Multi-Channel Notifications:** Email, SMS (Twilio), and in-app.
- **Secure Payments:** Stripe integration for card payments.
- **Location Services:** OpenStreetMap, Nominatim, and OSRM for geolocation and routing.
- **Responsive UI:** Modern, mobile-friendly React frontend.

---

## User Flow

### 1. Landing & Registration
- Users land on the homepage and can sign up as a regular user or a collector.
- Collectors go through a multi-step onboarding (business info, services, documents, subscription).

### 2. Authentication
- Secure login with JWT.
- Password reset and email verification supported.

### 3. Booking & Reporting
- Users search for collectors, book pickups, or report illegal dumpsites.
- Flexible scheduling and payment options.
- Users can track booking status and communicate with collectors.

### 4. Service Management (Collectors)
- Collectors manage their services, bookings, and availability.
- Subscription plans unlock more features.

### 5. Admin & Government
- Admins manage users, bookings, and content.
- Government accounts focus on oversight and reporting.

### 6. Gamification & Analytics
- Users and collectors earn points for positive actions.
- Leaderboards and analytics dashboards for engagement and performance tracking.

---

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Node.js, Express.js, MongoDB (Mongoose)
- **Authentication:** JWT
- **Payments:** Stripe
- **Notifications:** Nodemailer (Email), Twilio (SMS), Socket.IO (in-app)
- **Maps/Location:** OpenStreetMap, Nominatim, OSRM
- **File Uploads:** Cloudinary

---

## Setup & Installation

### Prerequisites
- Node.js (v14+)
- MongoDB (local or Atlas)
- Accounts for Cloudinary, Gmail SMTP, Twilio, Stripe

### Backend
```bash
cd backend
pnpm install
cp .env.example .env
# Fill in environment variables
pnpm run dev
```

### Frontend
```bash
cd client
pnpm install
pnpm run dev
```

---

## API Overview

See `backend/README.md` for a full list of endpoints, including:

- **Auth:** Register, login, password reset, email verification
- **Services:** CRUD for waste collection services
- **Bookings:** Create, update, track, and cancel bookings
- **Reviews:** Leave and view feedback
- **Payments:** Stripe integration
- **Notifications:** Multi-channel support
- **Admin:** User, booking, and content management

---

## Frontend Overview

- **Routing:** React Router for public and protected routes
- **State Management:** Context API for auth, notifications, and theme
- **Pages:** Dashboard, Bookings, Profile, Chat, Leaderboard, Analytics, Admin, and more
- **Onboarding:** Multi-step for collectors
- **UI:** Responsive, accessible, and modern design

---

## Security

- JWT authentication
- Password hashing (bcrypt)
- Rate limiting
- Input validation
- CORS and security headers
- File upload restrictions

---

## Testing

- Manual testing via Postman (see `backend/trashlance-postman-collection.json`)
- End-to-end flows for registration, booking, and payments

---

## Can Be Added Later

- More advanced gamification (badges, streaks, etc.)
- More detailed analytics or reporting
- Automated tests (for even more confidence)
- More public-facing marketing pages (if you want to grow the user base)
- Full SMS integration (if you want to scale notifications)
- Any additional polish or features based on user feedback 