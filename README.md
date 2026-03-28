# Arbuda Fashion

Arbuda Fashion is a full-stack e-commerce web application designed for browsing and purchasing clothing items. It includes user authentication, product catalog browsing, a shopping cart interface, and a dedicated administrator dashboard for managing inventory and orders.

## Features

- **Storefront**: Browse products by category (Men, Women, Kids, Accessories) and search by keyword.
- **Authentication**: User registration and login functionality utilizing JSON Web Tokens (JWT).
- **Checkout Process**: Interface for users to place orders and manage their profiles.
- **Admin Dashboard**: Secure panel for administrators to add, edit, or remove products and track incoming orders.
- **Email Integration**: Automated email services for OTPs and password recovery.

## Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JS
- **Backend Environment**: Node.js, Express.js
- **Database**: MongoDB (with Mongoose ORM)
- **Utilities**: JWT for authentication, bcrypt.js for password hashing, Nodemailer for email services

## Prerequisites

Before installing the application, ensure you have the following installed:

- Node.js (v14 or higher recommended)
- MongoDB instance (running locally or a MongoDB Atlas URI)

## Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/morjaykumar/arbuda_fashion.git
   cd arbuda_fashion
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root of the project with the following configuration:
   ```env
   PORT=5050
   MONGODB_URI=mongodb://localhost:27017/arbuda_fashion
   JWT_SECRET=your_jwt_secret_key
   GMAIL_USER=your_email@gmail.com
   GMAIL_PASS=your_app_password
   ```

## Usage

To start the development server, run:

```sh
npm run dev
```

The application will be accessible at `http://localhost:5050`.

## Project Structure

- `/backend` - Express.js application, containing routing, models, and middleware.
- `/frontend` - Public static assets served to the client browser.
- `server.js` - Main application entry point within the backend directory.

## License

This project is licensed under the ISC License.
