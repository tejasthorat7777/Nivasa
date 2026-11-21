# Nivasa — Property Management System

## MVP Release Notes

**Version:** 1.0.0  
**Status:** Functional MVP — All Critical Features Implemented

---

## 📱 **Overview**

Nivasa is a full-stack property management system enabling landlords, managers, and students to manage PG (Paying Guest) accommodations with room billing, payments, checkout workflows, and announcements.

---

## 🏃 **Quick Start — Local Development**

### **Backend**
```bash
cd backend
npm install          # Install dependencies
npm run dev          # Start the TypeScript API with nodemon (port 4000)
```

Set `MONGODB_URI` in `backend/.env` to a reachable MongoDB instance before
starting the backend. The API listens on port 4000 while MongoDB reconnects;
`GET /health` reports whether the database is ready. API requests return 503
until MongoDB is connected. Use `npm run build` followed by `npm start` for production.

### **Mobile**
```bash
cd mobile
npm install          # Install dependencies
npx expo start       # Start Expo development server
```

---

## 🔐 **Authentication**

Three user roles with invitation-based registration:

- **Landlord** — PG owner, manages rooms, students, bills, expenses, announcements
- **Manager** — Assists landlord, handles complaints, maintenance, checkout confirmation
- **Student** — Registers with invitation code, PENDING approval, views bills and room details

---

## 🏠 **Core Workflows**

### **Student Registration**
1. Register using a PG invitation code
2. Account created with PENDING approval status
3. Landlord approves/rejects registration
4. Student can access dashboard after approval

### **Room Management**
- Landlords can create rooms with capacity limits
- Room occupancy tracked in real-time
- Cannot exceed room capacity

### **Billing & Payments**
- Landlords create bills for students
- Students submit payment claims
- Landlords/Managers verify payments
- Revenue only counts PAID/PARTIALLY_PAID bills

### **Checkout Workflow**
1. Student submits checkout notice
2. Landlord reviews and approves
3. Manager confirms actual move-out
4. Room occupancy recalculated (decremented by 1)
5. Room status updated (AVAILABLE/PARTIALLY_OCCUPIED)

### **Announcements**
- Landlords can publish announcements
- Target audience: ALL, LANDLORD, MANAGER, or STUDENT
- Students/Managers see only relevant announcements

---

## 🛠 **API Endpoints (Key)**

### **Authentication**
- `POST /api/auth/register/landlord` — Landlord registration
- `POST /api/auth/register/manager` — Manager registration (invitation code)
- `POST /api/auth/register/student` — Student registration (invitation code)
- `POST /api/auth/login` — Login
- `POST /api/auth/logout` — Logout

### **Dashboard**
- `GET /api/dashboard/landlord` — Landlord dashboard data
- `GET /api/dashboard/manager` — Manager dashboard data
- `GET /api/dashboard/student` — Student dashboard data

### **Payments**
- `POST /api/payments` — Create payment (PG-owned only)
- `POST /api/payments/:id/verify` — Verify payment
- `GET /api/payments` — List payments (PG-filtered)

### **Checkout**
- `POST /api/checkout` — Student submits checkout request
- `GET /api/checkout/requests` — Landlord views pending requests
- `PATCH /api/checkout/:id/approve` — Landlord approves
- `PATCH /api/checkout/:id/confirm` — Manager confirms

### **Equipment**
- `GET /api/equipment` — List equipment
- `POST /api/equipment` — Create equipment (landlord only)
- `PATCH /api/equipment/:id/status` — Update status

### **Announcements**
- `GET /api/announcements` — List announcements (filtered by audience)
- `POST /api/announcements` — Create announcement (landlord only)
- `DELETE /api/announcements/:id` — Delete announcement (landlord only)

---

## 📊 **Database**

- **MongoDB** — NoSQL database
- **Mongoose** — ODM for MongoDB
- **Models:** User, PG, StudentProfile, Room, Bill, Payment, Complaint, MaintenanceTask, Expense, Equipment, Announcement

---

## 🧪 **Testing**

```bash
# Install test dependencies
cd backend
npm install --save-dev jest supertest ts-jest @types/jest @types/supertest

# Run tests
npx jest --no-coverage

# Test scenarios (12 prioritized):
# 1. Successful login
# 2. Invalid login
# 3. Student cannot access landlord APIs (403)
# 4. Manager cannot access another PG (403)
# 5. Student cannot view another student's bills
# 6. Room capacity cannot be exceeded
# 7. Pending payment does not update revenue
# 8. Verified payment updates bill balance correctly
# 9. Duplicate payment verification prevented
# 10. Checkout does not change occupancy before confirmation
# 11. Invalid requests rejected
# 12. Expired JWT rejected
```

---

## 📱 **Mobile Setup**

```bash
cd mobile
npm install
npx expo start
```

**Environment Configuration:**
- `.env.example` provides API_BASE_URL options:
  - Android Emulator: `http://10.0.2.2:4000/api`
  - Physical Device (LAN): `http://<your-ip>:4000/api`

---

## 📁 **Project Structure**

```
/nivasa/
├── backend/           # Node.js + Express + TypeScript + MongoDB
│   ├── src/           # Source code
│   ├── dist/          # Compiled JavaScript
│   ├── .env.example   # Environment variables
│   ├── jest.config.js # Test configuration
│   └── package.json   # Dependencies
│
├── mobile/            # React Native + Expo + TypeScript
│   ├── src/           # Source code
│   ├── .env.example   # API configuration
│   └── package.json   # Dependencies
│
├── PROJECT_AUDIT.md   # Comprehensive audit report
└── IMPLEMENTATION_PROGRESS.md  # Progress tracker
```

---

## 📦 **Production Deployment**

### **Backend Options:**
- **Render.com** — Free tier, automatic deployments from GitHub
- **Heroku** — Easy deployment, add-on marketplace for MongoDB
- **Railway.app** — Simple deployment, good free tier
- **Self-hosted** — Any VPS with Node.js and MongoDB

### **Environment Variables (.env):**
```
MONGODB_URI=mongodb://your-mongodb-url/nivasa
JWT_SECRET=your-32-plus-character-secret
PORT=4000
CLIENT_URL=http://your-frontend-url.com
CORS_ORIGIN=http://your-frontend-url.com,http://10.0.2.2:3000
BCRYPT_SALT=10
PAYMENT_METHODS=cash,bank_transfer,upi
```

### **Mobile Deployment:**
- **Expo Go** — For testing and development
- **Expo Application Services (EAS)** — For building production APKs
- **Android Studio** — For generating signed APKs

---

## 📞 **Contact & Support**

For issues, questions, or contributions, please refer to the project audit report or open an issue in the repository.

---

**Nivasa — StayNest Student Living**