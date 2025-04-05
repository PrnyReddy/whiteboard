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

const rooms = new Map<string, Set<string>>();

const userColors = new Map<string, string>();

const getRandomColor = () => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB',
    '#E74C3C', '#2ECC71', '#F1C40F', '#1ABC9C'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  const userColor = getRandomColor();
  userColors.set(socket.id, userColor);
  socket.data.userColor = userColor;

  socket.emit('client-ready', {
    id: socket.id,
    color: userColor
  } as UserData);

  socket.on('draw', (data: DrawingData) => {
    const drawingWithColor = {
      ...data,
      color: data.color || socket.data.userColor || '#000000'
    };
    socket.broadcast.emit('drawing', drawingWithColor);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    userColors.delete(socket.id);

    if (socket.data.roomId) {
      const room = rooms.get(socket.data.roomId);
      if (room) {
        room.delete(socket.id);
        if (room.size === 0) {
          rooms.delete(socket.data.roomId);
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});
