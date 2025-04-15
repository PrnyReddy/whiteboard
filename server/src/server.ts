import { createServer } from 'http';
import { Server } from 'socket.io';
import { 
  ClientToServerEvents, 
  ServerToClientEvents, 
  InterServerEvents, 
  SocketData,
  DrawingData,
  UserData 
} from './types/events';

const httpServer = createServer();
const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});


const users = new Map<string, UserData>();

const getRandomColor = () => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB',
    '#E74C3C', '#2ECC71', '#F1C40F', '#1ABC9C'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const broadcastUsers = () => {
  io.emit('users-updated', Array.from(users.values()));
};

const updateUserActivity = (userId: string) => {
  const user = users.get(userId);
  if (user) {
    user.lastActive = Date.now();
    users.set(userId, user);
  }
};

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  const userColor = getRandomColor();
  const userData: UserData = {
    id: socket.id,
    color: userColor,
    isDrawing: false,
    lastActive: Date.now(),
    name: `User ${users.size + 1}`
  };

  users.set(socket.id, userData);
  socket.data.userColor = userColor;
  socket.emit('client-ready', userData);
  socket.broadcast.emit('user-joined', userData);
  broadcastUsers();
  socket.on('draw', (data: DrawingData) => {
    updateUserActivity(socket.id);
    socket.broadcast.emit('drawing', data);
  });

  socket.on('start-drawing', () => {
    const user = users.get(socket.id);
    if (user) {
      user.isDrawing = true;
      users.set(socket.id, user);
      socket.broadcast.emit('user-started-drawing', socket.id);
      broadcastUsers();
    }
  });

  socket.on('stop-drawing', () => {
    const user = users.get(socket.id);
    if (user) {
      user.isDrawing = false;
      users.set(socket.id, user);
      socket.broadcast.emit('user-stopped-drawing', socket.id);
      broadcastUsers();
    }
  });

  socket.on('set-name', (name: string) => {
    const user = users.get(socket.id);
    if (user) {
      user.name = name;
      users.set(socket.id, user);
      broadcastUsers();
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    users.delete(socket.id);
    socket.broadcast.emit('user-left', socket.id);
    broadcastUsers();
  });
});

const INACTIVE_TIMEOUT = 5 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [userId, user] of users.entries()) {
    if (now - (user.lastActive || 0) > INACTIVE_TIMEOUT) {
      users.delete(userId);
      io.emit('user-left', userId);
      broadcastUsers();
    }
  }
}, 60000);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});
