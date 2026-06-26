# 🍽️ Akio — Food Ordering System

A full-stack food ordering application with customer-facing frontend, admin panel, and secure payment integration.

## Tech Stack

**Backend:** Node.js, Express 5, PostgreSQL, JWT, Razorpay, Zod, Cloudinary  
**Frontend:** React 19, Vite, Tailwind CSS 4, GSAP, Sonner, Axios  
**Security:** Helmet, CORS whitelist, Rate limiting, Account lockout, HTTP-only cookies, Input sanitization, Token blacklist

## Project Structure

```
├── backend/           # Express API server
│   ├── src/
│   │   ├── config/        # Cloudinary, DB test
│   │   ├── controllers/   # Auth, Cart, Orders, Payments, Profile, Upload, Admin
│   │   ├── db/            # PostgreSQL connection + migrations
│   │   ├── middleware/    # Auth, Validate, Sanitize, Rate limit, Upload, Error handler
│   │   ├── routes/        # Customer + Admin API routes
│   │   ├── scripts/       # Database seed scripts
│   │   └── utils/         # Validation schemas, Token blacklist
│   └── server.js
├── frontend/          # React (Vite) client
│   ├── src/
│   │   ├── components/    # Navbar, Footer, SplitText, Admin layout
│   │   ├── context/       # Auth, Cart, Admin auth
│   │   ├── pages/         # Home, Menu, Cart, Orders, Profile, Contact
│   │   ├── pages/admin/   # Dashboard, Orders, Menu Items, Categories, Tables, Analytics
│   │   └── services/      # API client, Auth, Cart, Menu, Order services
│   └── index.html
└── README.md
```

## Features

### Customer Side
- User registration & login with JWT
- Browse menu by categories
- Search with live suggestions (autocomplete)
- Item detail modal with quantity selector
- Veg/Non-Veg food type choice for dual-type items
- Cart with bill summary & discount display
- Razorpay payment integration
- Order history with payment details
- Order cancellation (restores cart)
- Profile management & password change

### Admin Side
- Separate admin authentication with role-based access
- Menu item CRUD (create, edit, delete, toggle availability)
- Featured items toggle (controls home page popular section)
- Category management
- Restaurant table management
- Order management with status flow (pending → accepted → preparing → ready → completed)
- Payment status visibility per order
- Analytics dashboard
- Image upload via Cloudinary

### Security (18 layers)
- Helmet (secure HTTP headers)
- CORS whitelist (only frontend origin allowed)
- Rate limiting (30 auth / 200 API per 15 min)
- Account lockout (10 failed logins = 30 min lock)
- Input validation (Zod schemas)
- Input sanitization (XSS prevention)
- HTTP-only cookies for JWT
- Token blacklist (real logout)
- Parameterized SQL queries
- Bcrypt password hashing (12 rounds)
- Generic error messages (no user enumeration)
- Request body size limit (10kb)
- HPP prevention
- Request logging (Morgan)
- Global error handler
- Ownership verification on all resources
- Database transactions for critical operations
- Razorpay webhook signature verification

## API Endpoints

### Auth
- `POST /api/auth/register` — Register
- `POST /api/auth/login` — Login
- `POST /api/auth/logout` — Logout

### Menu (Public)
- `GET /api/menu/categories` — All categories
- `GET /api/menu/items` — All items (filter by category)
- `GET /api/menu/featured` — Featured items for home page

### Cart (Protected)
- `GET /api/cart` — Get cart with item details
- `POST /api/cart/add` — Add item (supports food_type_choice)
- `PUT /api/cart/update` — Update quantity
- `DELETE /api/cart/remove/:itemId` — Remove item
- `DELETE /api/cart/clear` — Clear cart

### Orders (Protected)
- `POST /api/orders/place` — Place order from cart
- `GET /api/orders` — Order history with items
- `GET /api/orders/:id` — Order details
- `GET /api/orders/:id/status` — Order status
- `POST /api/orders/:id/cancel` — Cancel & restore cart

### Payments (Protected)
- `POST /api/payments/create-order` — Create Razorpay order
- `POST /api/payments/verify` — Verify payment signature
- `GET /api/payments/:orderId` — Payment status
- `POST /api/payments/refund` — Refund payment

### Profile (Protected)
- `GET /api/profile` — Get profile
- `PUT /api/profile` — Update name & phone
- `PUT /api/profile/password` — Change password
- `GET /api/profile/orders` — Order history with payment details

### Webhooks
- `POST /api/webhooks/razorpay` — Razorpay payment events

### Admin
- `POST /api/admin/auth/login` — Admin login
- `GET/POST/PUT/DELETE /api/admin/categories` — Category CRUD
- `GET/POST/PUT/DELETE /api/admin/menu-items` — Menu item CRUD
- `PUT /api/admin/menu-items/:id/featured` — Toggle featured
- `PUT /api/admin/menu-items/:id/availability` — Toggle availability
- `GET/PUT /api/admin/orders` — View & update order status
- `GET/POST/PUT/DELETE /api/admin/tables` — Table management
- `GET /api/admin/analytics` — Analytics data
- `POST /api/admin/upload` — Image upload (Cloudinary)

## Setup

### Backend
```bash
cd backend
npm install
# Copy .env.example to .env and fill in your values
npm run dev
```

### Frontend
```bash
cd frontend
npm install
# Create .env with: VITE_API_URL=http://localhost:5000
npm run dev
```

### Database
```bash
# Run migrations in order
psql -U postgres -d food_ordering_db -f backend/src/db/migrations/001_create_users.sql
# ... through 014
```

### Seed Admin
```bash
cd backend
node src/scripts/seedAdmin.js
```

## Environment Variables

See `backend/.env.example` for all required variables:
- Database credentials
- JWT secret
- Razorpay keys
- Cloudinary keys
- Frontend URL

## Team

- **Customer side (Backend + Frontend):** Nikunj
- **Admin side:** Bhavya
