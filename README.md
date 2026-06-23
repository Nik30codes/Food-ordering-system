# Food Ordering System

A full-stack food ordering application built with Node.js, Express, PostgreSQL, React, and Tailwind CSS.

## Project Structure

```
├── backend/        # Express API server
├── frontend/       # React (Vite) client
└── README.md
```

## Backend

- **Tech:** Node.js, Express, PostgreSQL, JWT, Razorpay
- **Features:** Authentication, Cart, Orders, Payments, Profile

### Setup

```bash
cd backend
npm install
# Create .env file using .env.example as reference
npm run dev
```

## Frontend

- **Tech:** React, Vite, Tailwind CSS
- **Features:** (In development)

### Setup

```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

### Auth
- `POST /api/auth/register` — Register a new user
- `POST /api/auth/login` — Login

### Cart
- `GET /api/cart` — Get cart
- `POST /api/cart/add` — Add item to cart
- `PUT /api/cart/update` — Update item quantity
- `DELETE /api/cart/remove/:itemId` — Remove item
- `DELETE /api/cart/clear` — Clear cart

### Orders
- `POST /api/orders/place` — Place order from cart
- `GET /api/orders` — Order history
- `GET /api/orders/:orderId` — Order details
- `GET /api/orders/:orderId/status` — Order status
- `POST /api/orders/:orderId/cancel` — Cancel order (restores cart)

### Payments (Razorpay)
- `POST /api/payments/create-order` — Create payment order
- `POST /api/payments/verify` — Verify payment signature
- `GET /api/payments/:orderId` — Payment status
- `POST /api/payments/refund` — Refund payment

### Profile
- `GET /api/profile` — Get profile
- `PUT /api/profile` — Update profile
- `PUT /api/profile/password` — Change password
- `GET /api/profile/orders` — Order history with payment details

## Environment Variables

See `backend/.env.example` for required environment variables.

## Team

- **Customer side (Backend + Frontend):** Nikunj
- **Admin side:** Team member
