# Lumi Chat

Modern real-time chat application with dark theme.

## 🚀 Quick Start

This project is split into 2 repositories:
- **Frontend (this repo):** Next.js + React + TailwindCSS
- **Backend:** [lumi-server](https://github.com/Renaldi9977/lumi-server)

### Frontend Setup

```bash
bun install
bun run dev
```

### Backend Setup

Clone the backend repo:
```bash
git clone https://github.com/Renaldi9977/lumi-server.git
cd lumi-server
bun install
bun run index.ts
```

## 🔧 Environment Variables

Create `.env` file in frontend:
```
NEXT_PUBLIC_API_URL=http://localhost:3030
```

## ✨ Features

- 🔐 JWT Authentication
- 💬 Real-time messaging (Socket.IO)
- 👥 Group chats
- 📁 File sharing
- 🎙️ Voice & Video calls (WebRTC)
- 🌙 Dark theme
- 📱 Responsive design

## 📦 Deployment

### Replit Deployment

1. Create 2 Repls:
   - **Frontend Repl:** Import this repo
   - **Backend Repl:** Import [lumi-server](https://github.com/Renaldi9977/lumi-server)

2. Set environment variable in Frontend Repl:
   - `NEXT_PUBLIC_API_URL` = Your backend Repl URL

3. Run both Repls
