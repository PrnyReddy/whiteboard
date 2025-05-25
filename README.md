# Collaborative Whiteboard

A real-time collaborative whiteboard using Next.js and Socket.IO.

## Development Setup

1. Clone the repository
```bash
git clone https://github.com/PrnyReddy/whiteboard.git
cd whiteboard
```

2. Install dependencies for both client and server
```bash
# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

3. Start development servers
```bash
cd client
npm run dev

cd server
npm run dev
```

## Features
- Real-time drawing collaboration
- Multiple drawing tools (pen, eraser, shapes)
- Color picker
- Adjustable brush sizes
- Cross-device support

## Tech Stack
- Frontend: Next.js, TypeScript
- Backend: Node.js, Socket.IO
- Deployment: GitHub Pages (frontend), Render (backend)
