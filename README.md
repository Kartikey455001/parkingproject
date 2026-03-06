# Smart Campus Parking Management System

A comprehensive web-based parking management solution featuring distinct role-based access for Admins, Parking Staff, and Users (Students/Faculty).

## 🚀 Features

### 🛠️ Admin Dashboard
- **User Management**: Control roles and access for all system users.
- **Slot Management**: Create, delete, and configure individual parking slots.
- **Dynamic Pricing**: Real-time configuration of base rates, staff discounts, and EV premiums.
- **Analytics**: Live tracking of revenue, occupancy, and slot distribution.

### 🛡️ Parking Staff (Ops Desk)
- **Manual Operations**: Check-in vehicles by Booking ID and Check-out by Session ID.
- **Verification**: View list of active and upcoming reservations.
- **Complaint Handling Desk**: Review and resolve "Wrong Parking" reports.

### 🚗 User Portal
- **Interactive Tower Grid**: Book slots visually in a 5-level parking tower.
- **Automated Pricing**: Staff/Faculty members automatically receive configured discounts.
- **Reporting**: Report vehicles parked in reserved slots.
- **Demo Payments**: Integrated workflow for slot reservations.

## 🛠️ Technology Stack
- **Backend**: Node.js, Express, MongoDB (Mongoose)
- **Frontend**: Vanilla JS, HTML, CSS (Glassmorphism design)
- **Features**: JWT Authentication, Role-based Middleware, Dynamic Settings.

## ⚙️ Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Kartikey455001/parkingproject.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file and add your MongoDB URI:
   ```env
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   PORT=5000
   ```
4. Start the server:
   ```bash
   npm run start
   ```

## 🔐 Credentials (Demo)
- **Admin**: `ADMIN@gmail.com` / `ADMIN123`
- **Parking Staff**: `parkingstaff@gmail.com` / `Parkingstaff123`
