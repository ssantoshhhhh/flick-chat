# Flick Chat - Real-Time Messaging Application

A modern, real-time chat application built with React, Node.js, and Socket.io. Flick Chat provides secure messaging with features like user authentication, real-time messaging, file sharing, and more.

## 🚀 Features

### Core Features
- **Real-time messaging** with Socket.io
- **User authentication** with OTP verification
- **User search** by username or email
- **Message persistence** with database storage
- **Message status** (sent, delivered, read)
- **Responsive design** for mobile and desktop
- **Dark/Light theme** support

### Advanced Features
- **End-to-end encryption** (E2EE) support
- **File sharing** and media messages
- **Message reactions** and emojis
- **Message editing** and deletion
- **Read receipts** and typing indicators
- **Message threading** and replies
- **Scheduled messages**
- **Offline message sync**

### Security Features
- **JWT-based authentication**
- **OTP verification** for login/registration
- **Two-factor authentication** (2FA)
- **Password encryption** with bcrypt
- **Secure file uploads**

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Socket.io Client** for real-time communication
- **React Router** for navigation
- **Sonner** for toast notifications

### Backend
- **Node.js** with Express
- **MySQL** database
- **Socket.io** for real-time features
- **JWT** for authentication
- **Nodemailer** for email notifications
- **bcrypt** for password hashing

## 📋 Prerequisites

Before running this application, make sure you have:

- **Node.js** (v16 or higher)
- **MySQL** (v8.0 or higher)
- **npm** or **yarn** package manager

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/flick-chat.git
cd flick-chat
```

### 2. Backend Setup

```bash
cd backend
npm install
```

#### Database Setup
1. Create a MySQL database:
```sql
CREATE DATABASE flick_chat;
```

2. Import the schema:
```bash
mysql -u your_username -p flick_chat < flick_schema.sql
```

#### Environment Configuration
1. Create a `.env` file in the backend directory:
```env
# Database Configuration
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=flick_chat

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here

# Email Configuration (for OTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password

# Server Configuration
PORT=9000
NODE_ENV=development
```

3. Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd ../
npm install
```

#### Environment Configuration
Create a `.env` file in the root directory:
```env
VITE_API_URL=http://localhost:9000/api
VITE_SOCKET_URL=http://localhost:9000
```

4. Start the frontend development server:
```bash
npm run dev
```

## 📱 Usage

### Registration
1. Navigate to the application
2. Click "Sign up"
3. Enter your email, username, and display name
4. Verify your email with the OTP sent to your inbox
5. Set your password and complete registration

### Login
1. Enter your username or email
2. Verify with the OTP sent to your email
3. Access your chat dashboard

### Starting a Chat
1. Click the "+" button to start a new chat
2. Search for users by username or email
3. Click on a user to start chatting
4. Messages are sent in real-time

### Features
- **Real-time messaging**: Messages appear instantly for both users
- **Message status**: See when messages are sent, delivered, or read
- **User search**: Find users by username or email
- **Chat persistence**: Your selected chat is remembered across page refreshes
- **Responsive design**: Works on mobile and desktop

## 🔧 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "username",
  "display_name": "Display Name"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "usernameOrEmail": "username"
}
```

#### Verify OTP
```http
POST /api/auth/verify-login
Content-Type: application/json

{
  "userId": 1,
  "otp": "123456"
}
```

### Chat Endpoints

#### Get User Chats
```http
GET /api/chat/list
Authorization: Bearer <token>
```

#### Create Chat
```http
POST /api/chat/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "participantIds": [2],
  "name": "Chat Name"
}
```

#### Send Message
```http
POST /api/chat/:chatId/message
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Hello!",
  "type": "text"
}
```

#### Get Messages
```http
GET /api/chat/:chatId/messages
Authorization: Bearer <token>
```

### User Endpoints

#### Search Users
```http
GET /api/user/search?q=username
Authorization: Bearer <token>
```

## 🔒 Security Features

### Authentication
- **OTP Verification**: All logins require email verification
- **JWT Tokens**: Secure session management
- **Password Encryption**: Bcrypt hashing for passwords

### Data Protection
- **Input Validation**: All user inputs are validated
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Content sanitization

### Real-time Security
- **Socket Authentication**: Socket connections are authenticated
- **Message Validation**: All messages are validated before processing

## 🚀 Deployment

### Backend Deployment
1. Set up your production environment variables
2. Configure your MySQL database
3. Set up your email service
4. Deploy to your preferred hosting service (Heroku, AWS, etc.)

### Frontend Deployment
1. Build the application:
```bash
npm run build
```
2. Deploy the `dist` folder to your hosting service

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues:

1. Check the [Issues](https://github.com/yourusername/flick-chat/issues) page
2. Create a new issue with detailed information
3. Include your environment details and error logs

## 🗺️ Roadmap

- [ ] Voice and video calls
- [ ] Group chat management
- [ ] Message encryption
- [ ] File sharing improvements
- [ ] Mobile app development
- [ ] Advanced search features
- [ ] Message backup and export
- [ ] Custom themes and emojis

## 📊 Project Structure

```
flick-chat/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── lib/
│   │   └── index.js
│   ├── uploads/
│   └── package.json
├── src/
│   ├── components/
│   ├── hooks/
│   ├── pages/
│   └── lib/
├── public/
└── package.json
```

---

**Built with ❤️ using React, Node.js, and Socket.io**
