# 👗 Arbuda Fashion — E-Commerce Platform

A full-stack e-commerce web application for **Arbuda Fashion**, built with **Node.js**, **Express**, **MongoDB**, and a responsive vanilla **HTML/CSS/JS** frontend. The platform supports customer shopping, order management, user profiles, and a dedicated admin panel for managing products, orders, and users.

---

## 📸 Features at a Glance

| Feature | Description |
| --- | --- |
| 🛍️ **Product Catalog** | Browse products with category filtering (Men, Women, Kids, Accessories) and search |
| 🛒 **Order Placement** | Purchase products with quantity, size selection, and delivery details |
| 👤 **User Authentication** | Register, login (username/email), and change password with JWT-based auth |
| 📋 **User Profile** | View/edit profile, upload profile image, manage address and phone |
| 🔐 **Admin Panel** | Full dashboard for managing products, orders, users, and generating invoices |
| 📦 **Order Management** | Track order status (Pending → Confirmed → Shipped → Delivered), cancel orders |
| 🧾 **Invoice & Packing Slip** | Generate and print invoices and packing slips for orders |
| 📧 **Email Notifications** | Send order confirmations and updates via Gmail (Nodemailer) |
| 📱 **Responsive Design** | Mobile-friendly UI with modern aesthetics using Google Fonts |

---

## 🏗️ Tech Stack

| Layer | Technology |
| --- | --- |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **Backend** | Node.js, Express.js (v5) |
| **Database** | MongoDB (Mongoose ODM) |
| **Authentication** | JWT (jsonwebtoken), bcryptjs |
| **Email** | Nodemailer (Gmail SMTP) |
| **Other** | CORS, dotenv, otp-generator |

---

## 📁 Project Structure

```
project/
│
├── backend/
│   ├── server.js          # Express server entry point
│   ├── middleware.js      # Auth middleware (protect, adminOnly)
│   ├── routes/            # Express API routes
│   │   ├── auth.js        # Register, Login, Change Password
│   │   ├── products.js    # CRUD operations for products
│   │   ├── orders.js      # CRUD operations for orders + status updates + cancellation
│   │   └── users.js       # CRUD operations for users + status toggle
│   └── models/            # Mongoose schemas
│       ├── User.js        # User model (name, email, username, password, role, etc.)
│       ├── Product.js     # Product model (name, price, image, category, stock, etc.)
│       └── Order.js       # Order model (orderId, product details, customer info, status)
│
├── frontend/
│   ├── admin.html         # Admin dashboard (products & users management)
│   ├── admin-simple.html  # Simplified admin view
│   ├── admin.css          # Admin panel styles
│   ├── admin.js           # Admin panel logic
│   ├── admin-orders.html  # Admin order management page
│   ├── admin-orders.js    # Admin order management logic
│   ├── auth.css           # Shared auth form styles
│   ├── auth.js            # Shared authentication utilities
│   ├── bill.html          # Invoice / Bill page
│   ├── bill.css           # Invoice styles
│   ├── bill.js            # Invoice generation logic
│   ├── index.html         # Homepage — Hero section + Product catalog + Purchase modal
│   ├── index.css          # Homepage styles
│   ├── index.js           # Homepage logic (product loading, filtering, ordering)
│   ├── login.html         # Login page
│   ├── login.css          # Login page styles
│   ├── login.js           # Login page logic
│   ├── profile.html       # User profile page
│   ├── profile.css        # Profile page styles
│   ├── profile.js         # Profile page logic (edit profile, view orders)
│   ├── signup.html        # Registration page
│   ├── signup.css         # Signup page styles
│   ├── signup.js          # Signup page logic
│   ├── bill.html          # Invoice page
│   ├── bill.css           # Invoice page styles
│   ├── bill.js            # Invoice logic
│   ├── script.js          # Shared utility scripts
│   ├── style.css          # Global / shared styles
│   └── ...               # Additional frontend assets
│
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables (MongoDB URI, JWT secret, etc.)
└── node_modules/          # Installed dependencies
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **MongoDB** (local installation or MongoDB Atlas cloud)
- **Git** (optional)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd project
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root (or edit the existing one):

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/arbuda_fashion
JWT_SECRET=your_jwt_secret_key_here
GMAIL_USER=your_email@gmail.com
GMAIL_PASS=your_app_password
```

> **Note:** For Gmail, you need to generate an [App Password](https://support.google.com/accounts/answer/185833) if you have 2FA enabled.

### 4. Start MongoDB

Make sure MongoDB is running locally:

```bash
mongod
```

Or use **MongoDB Atlas** by updating `MONGODB_URI` in your `.env` file.

### 5. Run the Server

**Production:**
```bash
npm start
```

**Development (with auto-reload):**
```bash
node backend/server.js
npm run dev
```

The server entry point is now `backend/server.js`, and the frontend static files are served from the `frontend/` folder.

> **Deployment note:** In production/Render, the frontend should use relative API paths (`/api/...`) instead of `http://localhost:5050`. This ensures the app works correctly when the backend is deployed on a real domain.

### 6. Open in Browser

Navigate to:

```
http://localhost:5050
```

---

## 🔌 API Endpoints

### Authentication — `/api/auth`

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login with username/email + password |
| `POST` | `/api/auth/change-password` | Change user password |

### Products — `/api/products`

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/products` | Get all products |
| `GET` | `/api/products/:id` | Get a single product |
| `POST` | `/api/products` | Add a new product |
| `PATCH` | `/api/products/:id` | Update a product |
| `PATCH` | `/api/products/:id/stock` | Update product stock |
| `DELETE` | `/api/products/:id` | Delete a product |
| `DELETE` | `/api/products` | Delete all products |

### Orders — `/api/orders`

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/orders` | Get all orders (sorted newest first) |
| `GET` | `/api/orders/:id` | Get a single order |
| `POST` | `/api/orders` | Place a new order |
| `PATCH` | `/api/orders/:id/status` | Update order status |
| `PATCH` | `/api/orders/:id/cancel` | Cancel a pending order (restores stock) |
| `DELETE` | `/api/orders/:id` | Delete an order |

### Users — `/api/users`

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/users` | Get all users (excluding passwords) |
| `GET` | `/api/users/:id` | Get a single user |
| `PATCH` | `/api/users/:id` | Update user profile |
| `PATCH` | `/api/users/:id/status` | Toggle user active/inactive status |
| `DELETE` | `/api/users/:id` | Delete a user (admin cannot be deleted) |

---

## 🔐 Authentication & Authorization

- **JWT-based authentication** — Tokens are issued on login and expire after **7 days**.
- **Middleware:**
  - `protect` — Verifies JWT token and attaches user to the request.
  - `adminOnly` — Restricts routes to users with the `admin` role.
- **Password hashing** — All passwords are hashed using **bcryptjs** with 10 salt rounds.

---

## 📊 Database Models

### User

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `name` | String | ✅ | |
| `email` | String | ✅ | Unique |
| `username` | String | ✅ | Unique |
| `password` | String | ✅ | Hashed with bcrypt |
| `phone` | String | ✅ | Unique |
| `role` | String | ❌ | Default: `"user"` |
| `profileImage` | String | ❌ | Base64 or URL |
| `address` | String | ❌ | |
| `isActive` | Boolean | ❌ | Default: `true` |

### Product

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `name` | String | ✅ | |
| `price` | Number | ✅ | |
| `image` | String | ❌ | Base64 or URL |
| `category` | String | ❌ | Default: `"all"` |
| `description` | String | ❌ | |
| `stock` | Number | ❌ | Default: `50` |
| `orderCount` | Number | ❌ | Default: `0` |

### Order

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `user` | ObjectId | ❌ | Reference to User |
| `orderId` | String | ✅ | Unique (e.g., `ORD-1234567890`) |
| `product` | String | ✅ | Product name |
| `productId` | ObjectId | ❌ | Reference to Product |
| `productImage` | String | ❌ | |
| `productPrice` | Number | ✅ | |
| `quantity` | Number | ✅ | |
| `size` | String | ❌ | S / M / L / XL |
| `customerName` | String | ✅ | |
| `customerEmail` | String | ✅ | |
| `customerPhone` | String | ❌ | |
| `customerAddress` | String | ❌ | |
| `totalAmount` | Number | ✅ | |
| `status` | String | ❌ | Default: `"Pending"` |

> All models include automatic `createdAt` and `updatedAt` timestamps.

---

## 🖥️ Frontend Pages

| Page | File | Description |
| --- | --- | --- |
| **Home** | `index.html` | Hero banner, product catalog with search & category filter, purchase modal |
| **Login** | `login.html` | Login form (username or email + password) |
| **Sign Up** | `signup.html` | User registration form |
| **Profile** | `profile.html` | User profile with editable fields and order history |
| **Admin Dashboard** | `admin.html` | Manage products, view users, dashboard stats |
| **Admin Orders** | `admin-orders.html` | Manage orders, update statuses, generate invoices |
| **Invoice / Bill** | `bill.html` | Printable invoice and packing slip |

---

## 🛠️ Available Scripts

| Script | Command | Description |
| --- | --- | --- |
| **Start** | `npm start` | Start the server with Node.js |
| **Dev** | `npm run dev` | Start with Nodemon (auto-reload on changes) |
| **Seed** | `npm run seed` | Run the database seeder script |

---

## 📧 Email Configuration

The application uses **Nodemailer** with Gmail SMTP to send order confirmation emails. To configure:

1. Enable **2-Step Verification** on your Google Account.
2. Generate an **App Password** at [Google App Passwords](https://myaccount.google.com/apppasswords).
3. Set the credentials in your `.env` file:
   ```env
   GMAIL_USER=your_email@gmail.com
   GMAIL_PASS=your_16_character_app_password
   ```

---

## 🔄 Order Status Flow

```
Pending → Confirmed → Shipped → Delivered
   ↓
Cancelled (only from Pending — restores stock automatically)
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the **ISC License**.

---

## 📬 Contact

**Arbuda Fashion**
- 📍 G-52, Shukan Plaza, Vadgam, Gujarat 385410
- 📞 +91 23456 78901
- 📧 contact@arbudafashion.com

---

> Built with ❤️ by the Arbuda Fashion team

---

## 🌐 Netlify Deployment

This project has been adapted to run on **Netlify** using Netlify Functions. The Express backend has been converted into a serverless function powered by `serverless-http`.

### What Changed for Deployment:

1. **Serverless Function**: A new Netlify Function (`netlify/functions/api.js`) wraps the Express app. It includes a MongoDB connection caching strategy to reuse existing connections across warm invocations.
2. **Netlify Config**: A `netlify.toml` file routes all `/api/*` frontend requests to the serverless function transparently.
3. **Frontend API Paths**: All JavaScript files (`script.js`, `login.js`, etc.) use relative `/api` paths instead of hardcoded `http://localhost:5050`, ensuring the app runs perfectly both locally and in production.

### Required Environment Variables

The following environment variables **must be configured** in your Netlify site settings (Site Settings > Environment Variables) for the app to work:

*   **`MONGODB_URI`** — Your MongoDB connection string (e.g., `mongodb+srv://username:password@cluster.mongodb.net/your-database`). This is the most critical variable required to load your data.
*   **`JWT_SECRET`** — A secret key for signing JWT tokens.
*   **`GMAIL_USER`** — Gmail address for sending OTPs and emails.
*   **`GMAIL_PASS`** — Gmail App Password for the email above.

You can set these via the Netlify CLI:

```bash
netlify env:set MONGODB_URI "mongodb+srv://your-connection-string"
netlify env:set JWT_SECRET "your-secret-key"
```

Once `MONGODB_URI` is set, the deployed site will automatically connect to your existing database and instantly serve all your dynamic products, users, and orders!
