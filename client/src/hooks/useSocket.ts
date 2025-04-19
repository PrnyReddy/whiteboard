import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  DrawingData, 
  UserData, 
  ClientToServerEvents, 
  ServerToClientEvents 
} from '@/types';

const SOCKET_URL = 'http://localhost:3001';
let globalSocket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export const useSocket = () => {
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [userColor, setUserColor] = useState<string>('#000000');
  const [users, setUsers] = useState<UserData[]>([]);

  const setupSocket = useCallback(() => {
    if (!globalSocket) {
      globalSocket = io(SOCKET_URL, {
        transports: ['websocket'],
        forceNew: false,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000
      });
      console.log('Created new global socket');
    }

    socketRef.current = globalSocket;

    const handleConnect = () => {
      console.log('Connected to server with ID:', socketRef.current?.id);
      socketRef.current?.emit('client-ready');
    };

    const handleReconnect = () => {
      console.log('Reconnected, requesting latest state');
      socketRef.current?.emit('client-ready');
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

    const socket = socketRef.current;
    if (socket) {
      socket.on('connect', handleConnect);
      socket.io.on('reconnect', handleReconnect);
      socket.on('client-ready', handleClientReady);
      socket.on('users-updated', handleUsersUpdate);
      socket.on('user-joined', handleUserJoin);
      socket.on('user-left', handleUserLeave);
      socket.on('connect_error', handleError);

      return () => {
        socket.off('connect', handleConnect);
        socket.io.off('reconnect', handleReconnect);
        socket.off('client-ready', handleClientReady);
        socket.off('users-updated', handleUsersUpdate);
        socket.off('user-joined', handleUserJoin);
        socket.off('user-left', handleUserLeave);
        socket.off('connect_error', handleError);
      };
    }
    return () => {};
  }, []);

  useEffect(() => {
    const cleanup = setupSocket();
    return () => {
      if (cleanup) cleanup();
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        globalSocket = null;
      }
    };
  }, [setupSocket]);

  const emitDrawing = useCallback((drawingData: DrawingData) => {
    if (socketRef.current) {
      socketRef.current.emit('draw', drawingData);
    }
  }, []);

  const subscribeToDrawing = useCallback((callback: (data: DrawingData) => void) => {
    if (!socketRef.current) return () => {};

    const handleDrawing = (data: DrawingData) => {
      callback(data);
    };

    socketRef.current.on('drawing', handleDrawing);
    return () => {
      socketRef.current?.off('drawing', handleDrawing);
    };
  }, []);

  const setName = useCallback((name: string) => {
    if (socketRef.current) {
      socketRef.current.emit('set-name', name);
    }
  }, []);

  const startDrawing = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('start-drawing');
    }
  }, []);

  const stopDrawing = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('stop-drawing');
    }
  }, []);

  const updateActivity = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('activity');
    }
  }, []);

  return {
    setupSocket,
    emitDrawing,
    subscribeToDrawing,
    userColor,
    users,
    setName,
    startDrawing,
    stopDrawing,
    updateActivity,
    socket: socketRef.current
  };
};
