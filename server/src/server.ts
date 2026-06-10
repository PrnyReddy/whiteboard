import { createServer } from 'http';
import { Server } from 'socket.io';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import dotenv from 'dotenv';
dotenv.config();
import { 
  ClientToServerEvents, 
  ServerToClientEvents, 
  InterServerEvents, 
  SocketData,
  DrawingData,
  UserData,
  Point 
} from './types/events';

const httpServer = createServer((req, res) => {
  if (req.url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
  } else {
    res.writeHead(404);
    res.end();
  }
});

const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"]
  }
});

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const pubClient = createClient({ url: REDIS_URL });
const subClient = pubClient.duplicate();
const stateClient = createClient({ url: REDIS_URL });

Promise.all([
  pubClient.connect(),
  subClient.connect(),
  stateClient.connect()
]).then(() => {
  io.adapter(createAdapter(pubClient, subClient));
  console.log('Connected to Redis and initialized adapter');
}).catch(err => {
  console.error('Failed to connect to Redis', err);
});

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB',
  '#E74C3C', '#2ECC71', '#F1C40F', '#1ABC9C'
];

class ColorManager {
  private usedColors: Set<string>;

  constructor() {
    this.usedColors = new Set();
  }

  getNextColor(): string {
    const availableColor = COLORS.find(color => !this.usedColors.has(color));
    if (availableColor) {
      this.usedColors.add(availableColor);
      return availableColor;
    }
    return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
  }

  releaseColor(color: string) {
    this.usedColors.delete(color);
  }
}

class UserManager {
  private users: Map<string, UserData>;
  private disconnectTimers: Map<string, NodeJS.Timeout>;
  private colorManager: ColorManager;

  constructor() {
    this.users = new Map();
    this.disconnectTimers = new Map();
    this.colorManager = new ColorManager();
  }

  addUser(socketId: string): UserData {
    const color = this.colorManager.getNextColor();
    const userData: UserData = {
      id: socketId,
      color,
      name: `User ${Math.floor(Math.random() * 1000)}`,
      isDrawing: false,
      lastActive: Date.now()
    };
    this.users.set(socketId, userData);
    return userData;
  }

  updateUser(socketId: string, updateFn: (user: UserData) => void): void {
    const user = this.users.get(socketId);
    if (user) {
      updateFn(user);
      this.users.set(socketId, user);
    }
  }

  handleDisconnect(socketId: string, onRemove: (user: UserData) => void): void {
    if (this.disconnectTimers.has(socketId)) {
      clearTimeout(this.disconnectTimers.get(socketId));
    }
    const timer = setTimeout(() => {
      const user = this.users.get(socketId);
      if (user) {
        this.colorManager.releaseColor(user.color);
        this.users.delete(socketId);
        onRemove(user);
      }
    }, 5000); 
    this.disconnectTimers.set(socketId, timer);
  }

  getUser(socketId: string): UserData | undefined {
    return this.users.get(socketId);
  }

  getUsersInRoom(roomId: string): UserData[] {
    return Array.from(this.users.values()).filter(u => u.roomId === roomId);
  }

  cleanup(timeout: number, onRemove: (user: UserData) => void): void {
    const now = Date.now();
    this.users.forEach((user, id) => {
      if (now - (user.lastActive || 0) > timeout) {
        this.colorManager.releaseColor(user.color);
        this.users.delete(id);
        onRemove(user);
      }
    });
  }
}

const userManager = new UserManager();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-room', async (roomId: string) => {
    socket.join(roomId);
    socket.data.roomId = roomId;

    let userData = userManager.getUser(socket.id);
    if (!userData) {
      userData = userManager.addUser(socket.id);
    }
    userManager.updateUser(socket.id, u => {
      u.roomId = roomId;
    });

    socket.emit('client-ready', userData);
    socket.to(roomId).emit('user-joined', userData);
    io.to(roomId).emit('users-updated', userManager.getUsersInRoom(roomId));

    try {
      const stateStr = await stateClient.get(`room:${roomId}:state`);
      if (stateStr) {
        const paths = JSON.parse(stateStr);
        socket.emit('room-state', paths);
      }
    } catch (err) {
      console.error('Error fetching state', err);
    }
  });

  socket.on('activity', () => {
    userManager.updateUser(socket.id, u => { u.lastActive = Date.now(); });
  });

  socket.on('cursor-move', (position: Point) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    userManager.updateUser(socket.id, u => { 
      u.cursorPosition = position; 
      u.lastActive = Date.now();
    });
    socket.to(roomId).emit('cursor-updated', { userId: socket.id, position });
  });

  socket.on('draw', (data: DrawingData) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    userManager.updateUser(socket.id, u => { u.lastActive = Date.now(); });
    socket.to(roomId).emit('drawing', data);
  });

  socket.on('save-path', async (data: DrawingData) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    try {
      const stateStr = await stateClient.get(`room:${roomId}:state`);
      const paths = stateStr ? JSON.parse(stateStr) : [];
      paths.push(data);
      await stateClient.set(`room:${roomId}:state`, JSON.stringify(paths));
    } catch (err) {
      console.error('Error saving path', err);
    }
  });

  socket.on('start-drawing', () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    userManager.updateUser(socket.id, u => { u.isDrawing = true; });
    socket.to(roomId).emit('user-started-drawing', socket.id);
    io.to(roomId).emit('users-updated', userManager.getUsersInRoom(roomId));
  });

  socket.on('stop-drawing', () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    userManager.updateUser(socket.id, u => { u.isDrawing = false; });
    socket.to(roomId).emit('user-stopped-drawing', socket.id);
    io.to(roomId).emit('users-updated', userManager.getUsersInRoom(roomId));
  });

  socket.on('set-name', (name: string) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    userManager.updateUser(socket.id, u => { u.name = name; });
    io.to(roomId).emit('users-updated', userManager.getUsersInRoom(roomId));
  });

  socket.on('color-change', (color: string) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    userManager.updateUser(socket.id, u => { u.color = color; });
    io.to(roomId).emit('users-updated', userManager.getUsersInRoom(roomId));
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    userManager.handleDisconnect(socket.id, (user) => {
      if (user.roomId) {
        io.to(user.roomId).emit('user-left', user.id);
        io.to(user.roomId).emit('users-updated', userManager.getUsersInRoom(user.roomId));
      }
    });
  });
});

const CLEANUP_INTERVAL = 60000;
const INACTIVE_TIMEOUT = 5 * 60 * 1000;

setInterval(() => {
  userManager.cleanup(INACTIVE_TIMEOUT, (user) => {
    if (user.roomId) {
      io.to(user.roomId).emit('user-left', user.id);
      io.to(user.roomId).emit('users-updated', userManager.getUsersInRoom(user.roomId));
    }
  });
}, CLEANUP_INTERVAL);

const PORT = parseInt(process.env.PORT || '3001', 10);
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`WebSocket server running on port ${PORT}`);
});
