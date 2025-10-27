# 🔐 Passwordless Authentication System

A modern, secure full-stack passwordless authentication system built with React, TypeScript, Express.js, and MongoDB. Users authenticate via secure magic links sent to their email addresses - no passwords required!

---

## 🎥 Demo Video

Watch a quick demonstration of the passwordless authentication system:

[Watch Demo Video](./passwordless-authentication-system-video.mp4)

---

## ✨ Features

- 🚫 **No Passwords** - Eliminates password security risks
- ✉️ **Magic Link Authentication** - Secure email-based login
- 🔐 **JWT Sessions** - Secure token-based authentication
- 🔄 **Auto Token Refresh** - Seamless session renewal
- 🛡️ **Enterprise Security** - Rate limiting, input validation, XSS protection
- 📊 **User Dashboard** - Beautiful project management interface
- 🚀 **Production Ready** - Docker support included
- ⚡ **Fast & Modern** - Built with latest technologies

---

## 💻 Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Routing
- **Modern CSS** - Stylish UI

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **MongoDB + Mongoose** - Database
- **JWT** - Authentication tokens
- **Nodemailer + Gmail SMTP** - Email sending via Gmail
- **Zod** - Input validation
- **Helmet** - Security headers

---

## 📁 Project Structure

```
passwordless-auth-starter/
├── client/                 # Frontend application
│   ├── src/
│   │   ├── pages/         # React components
│   │   ├── utils/         # API utilities
│   │   └── main.tsx       # Entry point
│   └── package.json
│
├── server/                 # Backend application
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   ├── models/        # Database models
│   │   ├── services/      # Business logic
│   │   ├── middleware/    # Auth middleware
│   │   ├── utils/         # Helper functions
│   │   └── email/         # Email configuration
│   └── package.json
│
├── docker-compose.yml      # Docker configuration
└── env.example            # Environment variables template
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- MongoDB running (local or remote)
- Email account for sending magic links (Gmail recommended)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/passwordless-auth-starter.git
cd passwordless-auth-starter
```

2. **Install dependencies**

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
cd ..
```

3. **Set up environment variables**

```bash
# Copy the example environment file
cp env.example .env

# Edit .env with your configuration
```

4. **Start MongoDB**

```bash
# Make sure MongoDB is running
mongod
```

5. **Run the application**

**Option A: Docker (Recommended - Single Terminal)**

```bash
# Start all services (MongoDB, Server, Client) in one command
docker-compose up

# Or use the PowerShell script
cd server
npm run dev 

cd client
npm run dev
```

**Option B: Development Mode (Two Terminals)**

```bash
# Terminal 1 - Start backend server
cd server
npm run dev

# Terminal 2 - Start frontend client
cd client
npm run dev
```

6. **Open your browser**

```
Frontend: http://localhost:5173
Backend:  http://localhost:4000
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/passwordless-auth

# Server
PORT=4000
NODE_ENV=development
APP_URL=http://localhost:5173
API_URL=http://localhost:4000

# JWT Secrets (Generate strong random strings!)
JWT_ACCESS_SECRET=your-super-secret-access-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Email Configuration (Gmail SMTP via Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_FROM=your-email@gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Gmail Setup Instructions:
# 1. Enable 2-factor authentication on your Google account
# 2. Go to Google Account > Security > 2-Step Verification > App passwords
# 3. Generate an "App Password" (16 characters)
# 4. Use this App Password as EMAIL_PASS (NOT your regular Gmail password)
```

### 🔑 Generating JWT Secrets

```bash
# Generate secure random strings
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 📖 Usage

### User Registration

1. Navigate to `http://localhost:5173`
2. Click "Register"
3. Fill in your details (First Name, Last Name, Username, Email)
4. Click "Create Account"
5. Check your email for the magic link
6. Click the link to complete registration and access the dashboard

### User Login

1. Navigate to `http://localhost:5173`
2. Enter your email address
3. Click "Send Magic Link"
4. Check your email for the magic link
5. Click the link to log in to the dashboard

### Dashboard

- View project metrics and summaries
- Track active projects
- Manage resources
- Monitor financial data

---

## 🌐 API Endpoints

### Authentication

#### `POST /auth/register`
Register a new user and send magic link

```json
Request:
{
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe",
  "email": "john@example.com"
}

Response: { "ok": true }
```

#### `POST /auth/passwordless/request`
Request a passwordless login link

```json
Request: { "email": "john@example.com" }
Response: { "ok": true }
```

#### `GET /auth/passwordless/verify?token=xxx`
Verify magic link and log user in

#### `POST /auth/refresh`
Refresh expired access token

#### `POST /auth/logout`
Log out user (clears cookies)

### User

#### `GET /me`
Get current authenticated user

```json
Response:
{
  "user": {
    "sub": "user_id",
    "email": "john@example.com",
    "iat": 1234567890,
    "exp": 1234567890
  }
}
```

---

## 🛡️ Security Features

- ✅ **Cryptographically Secure Tokens** - 32-byte random tokens
- ✅ **Hashed Token Storage** - Tokens stored as SHA-256 hashes
- ✅ **Single-Use Tokens** - Magic links can only be used once
- ✅ **Time-Limited Tokens** - 15-minute expiry for magic links
- ✅ **JWT in HTTP-Only Cookies** - Prevents XSS attacks
- ✅ **Separate Access/Refresh Tokens** - Enhanced security
- ✅ **Rate Limiting** - Prevents brute force attacks
- ✅ **Input Validation** - Zod schema validation
- ✅ **CORS Protection** - Configured origin whitelisting
- ✅ **Security Headers** - Helmet.js integration
- ✅ **HTTPS Ready** - Secure cookies in production

---

## 🐳 Docker Deployment

### Quick Start with Docker

Run everything (MongoDB, Server, Client) in a single terminal:

```bash
# Build and run with Docker Compose
docker-compose up

# Or in detached mode (runs in background)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

### Environment Setup for Docker

The Docker setup automatically handles:
- MongoDB connection
- Environment variables
- Port mapping
- Container networking

---

## 🧪 Testing

```bash
# Run server tests
cd server
npm test

# Run client tests
cd client
npm test
```

---

## 📊 Project Flow

### Registration Flow

```
1. User fills registration form
   ↓
2. Server creates user account
   ↓
3. Server generates secure token
   ↓
4. Server sends email with magic link
   ↓
5. User clicks magic link
   ↓
6. Server validates token
   ↓
7. Server issues JWT tokens (access + refresh)
   ↓
8. User redirected to dashboard
```

### Login Flow (Existing User)

```
1. User enters email
   ↓
2. Server finds or creates user
   ↓
3. Server generates secure token
   ↓
4. Server sends email with magic link
   ↓
5. User clicks magic link
   ↓
6. Server validates token
   ↓
7. Server issues JWT tokens
   ↓
8. User redirected to dashboard
```

---

## 🎯 Key Features Explained

### Passwordless Authentication

No more passwords to remember or reset! Users simply click a link in their email to authenticate. Magic links are:
- Single-use (can't be reused)
- Time-limited (15 minutes)
- Secure (cryptographically random)

### Automatic Token Refresh

The system automatically refreshes expired access tokens using refresh tokens, providing a seamless user experience:
- Access token expires every 15 minutes
- Refresh token lasts 7 days
- Auto-refresh happens in the background

### Session Management

- **Access Token** (15 min) - For API authentication
- **Refresh Token** (7 days) - For getting new access tokens
- **HTTP-Only Cookies** - Secure storage, XSS protection



### Building for Production

```bash
# Build server
cd server
npm run build

# Build client
cd client
npm run build
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🆘 Troubleshooting

### Email Not Sending

1. Check your email credentials in `.env`
2. For Gmail: Enable 2FA and use App Password
3. Check email service logs

### MongoDB Connection Issues

1. Ensure MongoDB is running
2. Check MONGODB_URI in `.env`
3. Verify network connectivity

### Token Expiry Issues

1. Check JWT secrets are set
2. Verify token expiry times in `.env`
3. Check browser cookies are enabled

---

## 📧 Support

For questions or support, please open an issue on GitHub.

---

##  Acknowledgments

- Built with modern web technologies
- Inspired by passwordless authentication best practices
- Secure by design

---
