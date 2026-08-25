# NexChat — Full-Stack Realtime Chat Application

<div align="center">

![NexChat](https://img.shields.io/badge/NexChat-Chat%20App-25d366?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)
![Socket.IO](https://img.shields.io/badge/Socket.IO-Realtime-010101?style=for-the-badge&logo=socket.io)

A modern, fast, and feature-rich full-stack realtime chat application inspired by the UI and UX of WhatsApp — built from scratch with a clean, original design.

</div>

---

## ✨ Features

- 🔐 **Authentication & Profiles** — JWT-based registration/login with HTTP-only cookies, customizable display name, bio, phone, and avatar upload.
- 💬 **Real-time Messaging** — Powered by Socket.IO with instant delivery and read indicators (single ✓, double ✓✓, blue ✓✓).
- 🟢 **Online/Offline Status & Typing Indicators** — Live user presence badges and dynamic typing feedback.
- 📷 **Rich Media Uploads** — Upload photos, videos, audio clips, and documents — all stored and served through **Cloudinary** with per-type size limits and graceful error toasts.
- ↩️ **Reply & Emoji Reactions** — Quote any message with a swipe/click reply, and react with emoji.
- 👥 **Group Chats** — Create groups, customize name/avatar/description, add/remove members, and manage admin roles.
- 🗑️ **Message Management** — Delete messages for yourself or for everyone; hide entire conversations.
- 🌓 **Light & Dark Themes** — WhatsApp-inspired dark mode and a clean light mode with instant toggle.
- 📱 **Fully Responsive** — Mobile-first layout with smooth full-screen panel overlays for Contact Info, Group Info, and Edit Profile.
- 🔔 **Toast Notifications** — Non-intrusive success/error/info feedback across the entire app.
- 🔒 **Security** — Helmet.js HTTP headers, CORS, cookie-based session management.

---

## 🛠 Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, Vite, Zustand, Socket.IO Client, Lucide Icons, Emoji-Mart |
| **Backend** | Node.js, Express.js, Socket.IO, Multer, Helmet, Morgan, Dotenv |
| **Database** | MongoDB (Atlas) via Mongoose |
| **Cloud Storage** | Cloudinary (all media — images, videos, audio, documents) |
| **Auth** | JWT + HTTP-only Cookies |

---

## 📁 Project Structure

```
nexchat/
├── client/                     # React (Vite) frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── chat/           # ChatArea, MessageList, MessageInput, AttachmentMenu
│   │   │   ├── layout/         # MainLayout (responsive flex shell)
│   │   │   ├── media/          # ImageLightbox
│   │   │   ├── modals/         # NewChatModal, NewGroupModal
│   │   │   ├── panels/         # UserProfilePanel, GroupInfoPanel, EditProfilePanel
│   │   │   ├── sidebar/        # Sidebar, ConversationList, SearchBar
│   │   │   └── ui/             # Avatar, Toast, Spinner
│   │   ├── services/           # Axios API client
│   │   ├── socket/             # Socket.IO client instance
│   │   ├── store/              # Zustand stores (auth, conversation, message, toast)
│   │   └── styles/             # reset, variables, themes, typography, animations, global CSS
│   └── vite.config.js          # Proxy → backend :5000
│
└── server/                     # Node.js / Express backend
    ├── src/
    │   ├── config/             # db.js (MongoDB), cloudinary.js (verify + SDK)
    │   ├── controllers/        # auth, user, conversation, message
    │   ├── middleware/         # authMiddleware, uploadMiddleware (Multer limits)
    │   ├── models/             # User, Conversation, Message (Mongoose)
    │   ├── routes/             # API route definitions
    │   ├── services/           # cloudinaryService (upload all media types)
    │   ├── socket/             # socketManager (Socket.IO events)
    │   └── index.js            # Express app + HTTP server entry point
    ├── scripts/
    │   └── testCloudinary.js   # Standalone Cloudinary diagnostic tool
    └── .env.example            # Environment variable template
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 18
- A [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (or local MongoDB)
- A [Cloudinary](https://cloudinary.com) account (free tier works)

---

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/nexchat.git
cd nexchat
```

---

### 2. Backend Setup

```bash
cd server
npm install
```

Create a `.env` file in `server/` (use `.env.example` as reference):

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# MongoDB Atlas connection string
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/nexchat

# JWT
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d

# Cloudinary — required for all media uploads
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

> 💡 Run the Cloudinary diagnostic tool to verify credentials before starting:
> ```bash
> node scripts/testCloudinary.js
> ```

Start the backend development server:

```bash
npm run dev
```

Backend runs on `http://localhost:5000`.

---

### 3. Frontend Setup

```bash
cd ../client
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.
The Vite dev server automatically proxies `/api` and `/socket.io` requests to `http://localhost:5000`.

---

## 📦 Media Upload Limits

| Type | Max Size |
|------|----------|
| 📷 Photos | 15 MB |
| 🎬 Videos | 50 MB |
| 🎵 Audio | 20 MB |
| 📄 Documents | 30 MB |

Files exceeding these limits show a graceful error toast — no server crash.

---

## 🔐 Environment Variables Reference

### Server (`server/.env`)

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default `5000`) |
| `NODE_ENV` | `development` or `production` |
| `CLIENT_URL` | Frontend origin for CORS |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for signing JWTs |
| `JWT_EXPIRES_IN` | JWT expiry duration (e.g. `7d`) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

---

## 📜 Available Scripts

### Server

```bash
npm run dev      # Start with nodemon (auto-reload)
npm start        # Start production server
node scripts/testCloudinary.js   # Diagnose Cloudinary connectivity
```

### Client

```bash
npm run dev      # Vite dev server
npm run build    # Production bundle → dist/
npm run preview  # Preview production build locally
```

---

## 🌐 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login & set cookie |
| `POST` | `/api/auth/logout` | Clear session cookie |
| `GET` | `/api/auth/me` | Get authenticated user |
| `GET` | `/api/users/search?q=` | Search users by username |
| `PUT` | `/api/users/profile` | Update display name / bio / phone |
| `PUT` | `/api/users/avatar` | Upload avatar image |
| `GET` | `/api/conversations` | List all conversations |
| `POST` | `/api/conversations` | Start DM conversation |
| `POST` | `/api/conversations/group` | Create group chat |
| `POST` | `/api/conversations/group/:id/leave` | Leave group |
| `GET` | `/api/messages/:conversationId` | Paginated message history |
| `POST` | `/api/messages` | Send message (text or media) |
| `DELETE` | `/api/messages/:id` | Delete message |
| `POST` | `/api/messages/:id/react` | Toggle emoji reaction |
| `PUT` | `/api/messages/read/:conversationId` | Mark messages as read |

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you'd like to change.

---

## 📄 License

MIT — feel free to use and modify for personal or commercial projects.

---

<div align="center">
Built with ❤️ using React, Node.js, and Socket.IO
</div>
