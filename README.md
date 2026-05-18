# Worknoon Chat Backend

Real-time chat backend for the Worknoon eCommerce platform, enabling authenticated users to communicate with customer support agents, designers, and merchants.

## 🛠️ Technologies

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose ODM)
- **Authentication:** JWT (JSON Web Tokens)
- **Real-time:** Socket.IO
- **File Uploads:** Multer
- **Security:** bcryptjs, CORS, helmet

## 📁 Project Structure

```
src/
├── config/          # Database connection
├── controllers/     # Business logic (like Django views)
│   ├── authController.js
│   ├── userController.js
│   ├── conversationController.js
│   └── messageController.js
├── middleware/       # Auth, roles, error handling
│   ├── auth.js
│   ├── roleCheck.js
│   └── errorHandler.js
├── models/          # Database schemas (like Django models)
│   ├── User.js
│   ├── Conversation.js
│   └── Message.js
├── routes/          # API endpoints (like Django urls.py)
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── conversationRoutes.js
│   ├── messageRoutes.js
│   └── uploadRoutes.js
└── socket/          # Real-time event handlers
    └── socketHandler.js
```

## 🚀 Setup & Installation

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas account (free tier works)

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/worknoon-chat-backend.git
   cd worknoon-chat-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your MongoDB URI and JWT secret.

4. **Start development server**
   ```bash
   npm run dev
   ```
   Server will start at `http://localhost:5000`

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login and get JWT |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/me` | Get current user profile |
| PUT | `/api/users/me` | Update profile |
| GET | `/api/users` | List all users |
| GET | `/api/users/:id` | Get user by ID |
| GET | `/api/users/admin/all` | Admin: all users + stats |

### Conversations
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/conversations` | Create conversation |
| GET | `/api/conversations` | List my conversations |
| GET | `/api/conversations/:id` | Get conversation + messages |
| DELETE | `/api/conversations/:id` | Delete conversation |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/messages` | Send message |
| GET | `/api/messages/:conversationId` | Get messages (paginated) |
| PATCH | `/api/messages/:id/read` | Mark message as read |
| PATCH | `/api/messages/read-all/:conversationId` | Mark all as read |

### File Upload
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload file (10MB max) |

## 🔌 Socket.IO Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `join:room` | `conversationId` | Join a chat room |
| `leave:room` | `conversationId` | Leave a chat room |
| `message:send` | `{ conversationId, content, type }` | Send message |
| `typing:start` | `conversationId` | Typing indicator on |
| `typing:stop` | `conversationId` | Typing indicator off |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `message:received` | `message object` | New message in room |
| `conversation:updated` | `{ conversationId, lastMessage }` | Inbox update |
| `user:online` | `{ userId, isOnline }` | User presence |
| `typing:start` | `{ userId, name }` | Someone is typing |
| `typing:stop` | `{ userId }` | Stopped typing |

## 👤 User Roles

- **admin** — Full access, user management
- **agent** — Customer support agent
- **customer** — Buyer / end user
- **designer** — Product designer
- **merchant** — Seller / vendor

## 🧪 Challenges & Solutions

1. **Real-time + REST hybrid:** Messages are saved via both REST API and Socket.IO to ensure data persistence even if WebSocket connection drops.
2. **Unread counts:** Used MongoDB Map type to efficiently track per-user unread message counts within conversations.
3. **Socket authentication:** JWT tokens are verified during the Socket.IO handshake to ensure only authenticated users can connect.

## 📹 Demo Video

[Link to demo video walkthrough]

## 📄 License

ISC
