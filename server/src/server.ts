import { createServer } from 'http';
import { Server } from 'socket.io';
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
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
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

    let newColor;
    do {
      newColor = this.generateRandomColor();
    } while (this.isColorTooSimilar(newColor));

    this.usedColors.add(newColor);
    return newColor;
  }

  releaseColor(color: string) {
    this.usedColors.delete(color);
  }

  private generateRandomColor(): string {
    return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
  }

  private hexToRgb(hex: string): { r: number, g: number, b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return {
      r: parseInt(result![1], 16),
      g: parseInt(result![2], 16),
      b: parseInt(result![3], 16)
    };
  }

  private isColorTooSimilar(newColor: string): boolean {
    const rgb1 = this.hexToRgb(newColor);
    return Array.from(this.usedColors).some(existingColor => {
      const rgb2 = this.hexToRgb(existingColor);
      const distance = Math.sqrt(
        Math.pow(rgb2.r - rgb1.r, 2) +
        Math.pow(rgb2.g - rgb1.g, 2) +
        Math.pow(rgb2.b - rgb1.b, 2)
      );
      return distance < 100;
    });
  }
}

class UserManager {
  private users: Map<string, UserData>;
  private usedNumbers: Set<number>;
  private disconnectTimers: Map<string, NodeJS.Timeout>;
  private colorManager: ColorManager;

  constructor() {
    this.users = new Map();
    this.usedNumbers = new Set();
    this.disconnectTimers = new Map();
    this.colorManager = new ColorManager();
  }

  getNextNumber(): number {
    let number = 1;
    while (this.usedNumbers.has(number)) {
      number++;
    }
    this.usedNumbers.add(number);
    return number;
  }

  addUser(socketId: string): UserData {
    const number = this.getNextNumber();
    const color = this.colorManager.getNextColor();
    const userData: UserData = {
      id: socketId,
      color,
      name: `User ${number}`,
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

  setColor(socketId: string, color: string): void {
    this.updateUser(socketId, user => {
      user.color = color;
    });
  }

  setName(socketId: string, name: string): void {
    this.updateUser(socketId, user => {
      user.name = name;
    });
  }

  setDrawingState(socketId: string, isDrawing: boolean): void {
    this.updateUser(socketId, user => {
      user.isDrawing = isDrawing;
    });
  }

  updateCursorPosition(socketId: string, position: Point): void {
    this.updateUser(socketId, user => {
      user.cursorPosition = position;
      user.lastActive = Date.now();
    });
  }

  updateActivity(socketId: string): void {
    this.updateUser(socketId, user => {
      user.lastActive = Date.now();
    });
  }

  handleDisconnect(socketId: string): void {
    if (this.disconnectTimers.has(socketId)) {
      clearTimeout(this.disconnectTimers.get(socketId));
      this.disconnectTimers.delete(socketId);
    }

    const timer = setTimeout(() => {
      this.removeUser(socketId);
    }, 5000); 

    this.disconnectTimers.set(socketId, timer);
  }

  removeUser(socketId: string): void {
    if (this.disconnectTimers.has(socketId)) {
      clearTimeout(this.disconnectTimers.get(socketId));
      this.disconnectTimers.delete(socketId);
    }

    const user = this.users.get(socketId);
    if (user) {
      const number = parseInt(user.name.replace('User ', ''));
      if (!isNaN(number)) {
        this.usedNumbers.delete(number);
      }
      this.colorManager.releaseColor(user.color);
      this.users.delete(socketId);
    }
  }

  getUser(socketId: string): UserData | undefined {
    return this.users.get(socketId);
  }

  getAllUsers(): UserData[] {
    return Array.from(this.users.values());
  }

  cleanup(timeout: number): string[] {
    const now = Date.now();
    const inactiveIds: string[] = [];

    this.users.forEach((user, id) => {
      if (now - (user.lastActive || 0) > timeout) {
        inactiveIds.push(id);
      }
    });

    inactiveIds.forEach(id => this.removeUser(id));
    return inactiveIds;
  }
}

const userManager = new UserManager();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  const userData = userManager.addUser(socket.id);
  socket.emit('client-ready', userData);
  socket.broadcast.emit('user-joined', userData);
  io.emit('users-updated', userManager.getAllUsers());

  socket.on('activity', () => {
    userManager.updateActivity(socket.id);
  });

  socket.on('cursor-move', (position: Point) => {
    userManager.updateCursorPosition(socket.id, position);
    socket.broadcast.emit('cursor-updated', {
      userId: socket.id,
      position
    });
  });

  socket.on('draw', (data: DrawingData) => {
    userManager.updateActivity(socket.id);
    socket.broadcast.emit('drawing', data);
  });

  socket.on('start-drawing', () => {
    userManager.setDrawingState(socket.id, true);
    socket.broadcast.emit('user-started-drawing', socket.id);
    io.emit('users-updated', userManager.getAllUsers());
  });

  socket.on('stop-drawing', () => {
    userManager.setDrawingState(socket.id, false);
    socket.broadcast.emit('user-stopped-drawing', socket.id);
    io.emit('users-updated', userManager.getAllUsers());
  });

  socket.on('set-name', (name: string) => {
    userManager.setName(socket.id, name);
    io.emit('users-updated', userManager.getAllUsers());
  });

  socket.on('color-change', (color: string) => {
    userManager.setColor(socket.id, color);
    io.emit('users-updated', userManager.getAllUsers());
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    userManager.handleDisconnect(socket.id);
    socket.broadcast.emit('user-left', socket.id);
    io.emit('users-updated', userManager.getAllUsers());
  });
});

const CLEANUP_INTERVAL = 60000;
const INACTIVE_TIMEOUT = 5 * 60 * 1000;

setInterval(() => {
  const inactiveIds = userManager.cleanup(INACTIVE_TIMEOUT);
  if (inactiveIds.length > 0) {
    inactiveIds.forEach(id => {
      io.emit('user-left', id);
    });
    io.emit('users-updated', userManager.getAllUsers());
  }
}, CLEANUP_INTERVAL);

const PORT = parseInt(process.env.PORT || '3001', 10);
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`WebSocket server running on port ${PORT}`);
});
