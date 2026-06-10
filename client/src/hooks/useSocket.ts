import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  DrawingData, 
  UserData, 
  ClientToServerEvents, 
  ServerToClientEvents 
} from '@/types';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

export const globalSocket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SOCKET_URL, {
  transports: ['websocket'],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export const useSocket = () => {
  const [userColor, setUserColor] = useState<string>('#000000');
  const [users, setUsers] = useState<UserData[]>([]);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);

  useEffect(() => {
    const handleConnect = () => {
      console.log('Connected to server with ID:', globalSocket.id);
      globalSocket.emit('client-ready');
      if (currentRoomId) {
        globalSocket.emit('join-room', currentRoomId);
      }
    };

    const handleReconnect = () => {
      console.log('Reconnected, requesting latest state');
      globalSocket.emit('client-ready');
      if (currentRoomId) {
        globalSocket.emit('join-room', currentRoomId);
      }
    };

    const handleClientReady = (userData: UserData) => {
      console.log('Received initial user data:', userData);
      setUserColor(userData.color);
      setUsers(prevUsers => {
        const newUsers = prevUsers.filter(u => u.id !== userData.id);
        return [...newUsers, userData];
      });
    };

    const handleUsersUpdate = (updatedUsers: UserData[]) => {
      console.log('Users list updated:', updatedUsers);
      setUsers(updatedUsers);
    };

    const handleUserJoin = (userData: UserData) => {
      console.log('User joined:', userData.name);
      setUsers(prevUsers => {
        const filteredUsers = prevUsers.filter(u => u.id !== userData.id);
        return [...filteredUsers, userData];
      });
    };

    const handleUserLeave = (userId: string) => {
      console.log('User left:', userId);
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
    };

    const handleError = (error: Error) => {
      console.error('Socket error:', error);
    };

    // If already connected when hook mounts, trigger client-ready manually
    if (globalSocket.connected) {
      globalSocket.emit('client-ready');
      if (currentRoomId) {
        globalSocket.emit('join-room', currentRoomId);
      }
    }

    globalSocket.on('connect', handleConnect);
    globalSocket.io.on('reconnect', handleReconnect);
    globalSocket.on('client-ready', handleClientReady);
    globalSocket.on('users-updated', handleUsersUpdate);
    globalSocket.on('user-joined', handleUserJoin);
    globalSocket.on('user-left', handleUserLeave);
    globalSocket.on('connect_error', handleError);

    return () => {
      globalSocket.off('connect', handleConnect);
      globalSocket.io.off('reconnect', handleReconnect);
      globalSocket.off('client-ready', handleClientReady);
      globalSocket.off('users-updated', handleUsersUpdate);
      globalSocket.off('user-joined', handleUserJoin);
      globalSocket.off('user-left', handleUserLeave);
      globalSocket.off('connect_error', handleError);
    };
  }, [currentRoomId]);

  const joinRoom = useCallback((roomId: string) => {
    setCurrentRoomId(roomId);
    if (globalSocket.connected) {
      globalSocket.emit('join-room', roomId);
    }
  }, []);

  const emitDrawing = useCallback((drawingData: DrawingData) => {
    globalSocket.emit('draw', drawingData);
  }, []);

  const savePath = useCallback((drawingData: DrawingData) => {
    globalSocket.emit('save-path', drawingData);
  }, []);

  const subscribeToDrawing = useCallback((callback: (data: DrawingData) => void) => {
    const handleDrawing = (data: DrawingData) => {
      callback(data);
    };
    globalSocket.on('drawing', handleDrawing);
    return () => {
      globalSocket.off('drawing', handleDrawing);
    };
  }, []);

  const subscribeToRoomState = useCallback((callback: (paths: DrawingData[]) => void) => {
    const handleRoomState = (paths: DrawingData[]) => {
      callback(paths);
    };
    globalSocket.on('room-state', handleRoomState);
    return () => {
      globalSocket.off('room-state', handleRoomState);
    };
  }, []);

  const setName = useCallback((name: string) => {
    globalSocket.emit('set-name', name);
  }, []);

  const startDrawing = useCallback(() => {
    globalSocket.emit('start-drawing');
  }, []);

  const stopDrawing = useCallback(() => {
    globalSocket.emit('stop-drawing');
  }, []);

  const updateActivity = useCallback(() => {
    globalSocket.emit('activity');
  }, []);

  const setupSocket = useCallback(() => {}, []);

  return {
    setupSocket,
    emitDrawing,
    savePath,
    subscribeToDrawing,
    subscribeToRoomState,
    joinRoom,
    userColor,
    users,
    setName,
    startDrawing,
    stopDrawing,
    updateActivity,
    socket: globalSocket
  };
};
