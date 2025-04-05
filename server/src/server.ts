import { createServer } from 'http';
import { Server } from 'socket.io';
import { 
  ClientToServerEvents, 
  ServerToClientEvents, 
  InterServerEvents, 
  SocketData,
  DrawingData 
} from './types/events';

const httpServer = createServer();
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

let connectedClients = 0;

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  connectedClients++;

  io.emit('client-count', connectedClients);

  socket.on('client-ready', () => {
    console.log('Client ready:', socket.id);
  });

  socket.on('draw', (data: DrawingData) => {
    socket.broadcast.emit('drawing', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    connectedClients--;
    io.emit('client-count', connectedClients);
  });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});
