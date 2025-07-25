# TrashLance - Waste Management Platform

**MERN Stack Implementation for SDG 11 (Sustainable Cities)**

## 1. Introduction

TrashLance is a MERN stack web application that connects citizens, certified waste collectors, and government cleanup teams to improve waste management in Kenya. The platform enables efficient waste reporting, collection scheduling, and community engagement through gamification.

### Key Value Proposition:
- Direct citizen-to-collector connections with zero middleman fees  
- Government oversight of illegal dumping hotspots  
- Gamified rewards system for community engagement  
- Real-time email and SMS notifications  
- Flexible pricing models for different collection schedules  

## 2. Problem Statement & Business Model

### Kenya Faces Significant Waste Management Challenges:
- Poor coordination between citizens and collectors  
- Illegal dumping due to lack of proper disposal options  
- No incentives for proper waste disposal  
- Weak enforcement against environmental violations  

### TrashLance Solution:
- Streamlined pickup request system with trust-building features  
- Flexible pricing for different collection schedules (weekly, monthly)  
- Government monitoring dashboard for illegal dumping  
- Community engagement through points and leaderboards  
- Freemium model with optional premium features for collectors  

### Payment & Monetization Strategy:
- **MVP Approach:** External payments (M-Pesa, cash) with in-app confirmation  
- **Revenue Model:** Freemium with premium collector subscriptions  
- **Retention Strategy:** Gamification + loyalty rewards + network effects  

## 3. Target Users & Roles

| User Type         | Key Actions |
|-------------------|-------------|
| **Citizens**      | Report trash, request pickups, earn points, track collection status |
| **Waste Collectors** | Register with service types, set flexible pricing schedules, accept pickup requests, confirm disposal |
| **Government Teams** | Monitor illegal dumping alerts, dispatch cleanup crews, verify disposal sites |

### Collector Service Types:
- **General Waste:** Regular household/commercial trash collection with flexible scheduling  
- **Recyclables:** Paper, plastic, glass, metal materials  
- **E-Waste:** Electronics, batteries, electronic components  
- **Organic Waste:** Food waste, garden waste (compostable materials)  

## 4. MERN Stack Architecture

### Frontend (React.js)
- **Components:** User dashboards, waste reporting forms, interactive maps  
- **Libraries:**  
  - OpenStreetMap for maps  
  - React Router for navigation  
  - React Hook Form for form handling  
- **Deployment:** Vercel (free tier)  

### Backend (Node.js + Express)
- **API Routes:** Authentication, waste reports, user management, notifications  
- **Middleware:** JWT authentication, file upload handling, email/SMS services  
- **Deployment:** Render.com (free tier)  

### Database (MongoDB)
- **Collections:** Users, WasteReports, Collectors, Transactions  
- **Hosting:** MongoDB Atlas (512MB free storage)  
- **Features:** Geospatial queries for location-based matching  

### Communication Services
- **Email:** Nodemailer + Gmail (500 emails/day free)  
- **SMS Providers:**  
  - TextBelt (Free Tier: 1 SMS/day)  
  - Twilio (Free trial: $15 credit, then pay-as-you-go)  
  - Africa's Talking (Competitive rates in Kenya)  
- **Image Storage:** Cloudinary (25 uploads/month free)  
- **Maps:** OpenStreetMap (free and open-source)  

## 5. Core Features (MVP)

### A. For Citizens
- Waste Reporting: Upload photos with location pins  
- Pickup Requests: View/select nearby collectors with pricing options  
- Real-time Tracking: Monitor pickup status  
- Gamification: Earn points for reports and pickups  
- Leaderboard: Community ranking system  

### B. For Waste Collectors
- Service Registration: Profile with service types  
- Flexible Pricing Models:
  - Weekly collection rates  
  - Monthly collection rates  
  - Zone-based pricing variations  
- Smart Filtering: Only receive relevant requests  
- Service Analytics: Track performance by waste category  
- Communication Dashboard: Manage notifications  

### C. For Government Teams
- Monitoring Dashboard: Illegal dumping reports  
- Alert System: Notifications for priority areas  
- Cleanup Coordination: Assign teams  

## 6. Implementation Timeline

### Phase 1: Foundation (Days 1–2)
**Setup & Authentication**
- MERN boilerplate setup  
- JWT user registration/login  
- Database schema design  
- Basic API routing  

**Deliverables:**
- Role-based auth system  
- User profile management  
- MongoDB schema  

### Phase 2: Core Functionality (Days 3–4)
**Waste Reporting & Collection**
- Map integration with Leaflet.js  
- Cloudinary photo uploads  
- Waste type + pricing form  
- Collector matching algorithm  
- Email + SMS notifications  

**Deliverables:**
- Waste reporting UI  
- Collector dashboard  
- Smart matching system  
- Notification triggers  

### Phase 3: Enhanced Features (Days 5–6)
**Gamification & Pricing**
- Points reward system  
- Leaderboard  
- Flexible weekly/monthly pricing  
- Zone-based pricing  

**Deliverables:**
- Gamified dashboard  
- Dynamic pricing model  

### Phase 4: Polish & Deployment (Day 7)
**Final Integration**
- Full testing and bug fixes  
- Performance tuning  
- Vercel + Render deployment  
- Documentation  

**Deliverables:**
- Production-ready app  
- User feedback fixes  
- Deployment complete  

## 7. Communication System Implementation

### Email + SMS Strategy

**Free MVP Implementation:**
- Email: Nodemailer + Gmail (500 emails/day)  
- SMS: TextBelt (1 SMS/day per number)  
- Combined alerts for key actions  

**Scaling Plan:**
- Use Twilio or Africa’s Talking for production  
- TextBelt for early testing  

**SMS Provider Options:**
- TextBelt (free)  
- Twilio (free trial, scalable)  
- Africa’s Talking (affordable in Kenya)  

## 8. Flexible Pricing System for General Waste Collectors

### Enhanced Collector Pricing Model:
- **Service Types:** General, recyclable, e-waste, organic  
- **Pricing Options:**
  - Weekly  
  - Monthly  
  - One-time pickups  
- **Zone-Based Pricing:** Area-specific pricing  
- **Service Descriptions:** Pickup schedules, requirements  

### Collector Pricing Dashboard Features:
- Enable/disable service frequencies  
- Set different rates per schedule/type  
- Add pickup requirements  
- Set min/max load quantities  
- Add special notes  

## 9. Enhanced User Retention Strategy

### For Citizens: Advanced Gamification System

| Action | Points |
|--------|--------|
| Report waste | 10 |
| Successful pickup | 25 |
| Weekly subscription | 50 |
| Monthly subscription | 100 |
| Recycling bonus | 15 |
| Monthly streak | 50 |
| Refer friend | 100 |
| Community challenge | 200 |
| Environmental impact | 30 |

### Multi-Tier Rewards Program:
- **Bronze (0–200):** Basic profile  
- **Silver (201–500):** 10% discount, priority alerts  
- **Gold (501–1000):** KES 50 airtime/month  
- **Platinum (1000+):** VIP support, exclusive perks  

### For Collectors: Business Growth Tools
- CRM features  
- Price optimization suggestions  
- Schedule management  
- Analytics per pricing model  
- Customer retention tracking  

**Premium Business (KES 500/month):**
- Advanced analytics  
- Automated email/SMS marketing  
- Priority listing in results  
- Custom packages  
- Business verification badge  

## 10. Notification System Examples

### Notification Types

**Pickup Request Notifications:**
- New request alert with details  
- Confirmation after collector accepts  
- Pre-pickup reminders to both users  

**System Notifications:**
- Registration confirmation  
- Pricing updates  
- Points achievements  
- Area-wide alerts & promotions  

### Notification Content Examples

**To Citizens:**
- "New pickup accepted by [Collector Name]. Schedule: [Date/Time], Rate: KES [Amount]"  
- "Reminder: Your pickup is scheduled for tomorrow. Prepare your waste."  
- "Congrats! You earned 25 points for pickup completion."  

**To Collectors:**
- "New request in [Zone] for [Waste Type]. Rate: KES [Amount]"  
- "Reminder: Pickup at [Address] tomorrow. Client: [Name]"  
- "Your pricing structure has been updated."  

## 11. Competitive Advantages

### Unique Features:
- Flexible weekly/monthly/one-time pricing  
- Dual email + SMS communications  
- Zone-based pricing per collector  
- Scheduled pickup subscriptions  
- Multi-channel notification strategy  

### Technical Advantages:
- Free-tier SMS/email for MVP  
- Scalable to premium providers  
- Mobile-first design  
- Real-time notifications  
- Modular pricing engine  

## 12. Success Metrics

### Key Performance Indicators:
- 100+ user registrations  
- 50+ pickup requests  
- 30+ completed pickups  
- 10+ weekly/monthly subscribers  
- Active daily user growth  
- Coverage across zones  
- 95%+ notification delivery success  

### Technical Metrics:
- 99%+ uptime  
- Page load < 3s  
- API response < 500ms  
- 95%+ SMS/email delivery  
- High mobile responsiveness  

---