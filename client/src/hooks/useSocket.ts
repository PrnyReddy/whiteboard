import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { DrawingData, UserData } from '@/types';

const SOCKET_URL = 'http://localhost:3001';
let globalSocket: Socket | null = null;

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
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
      console.log('Created new global socket, ID:', globalSocket.id);
    }

    globalSocket.io.on('reconnect', () => {
      console.log('Socket reconnected, ID:', globalSocket?.id);
      globalSocket?.emit('client-ready');
    });

    globalSocket.io.on('reconnect_attempt', () => {
      console.log('Attempting to reconnect...');
    });

    globalSocket.io.on('reconnect_failed', () => {
      console.log('Reconnection failed');
      globalSocket?.disconnect();
      globalSocket = null;
    });

    socketRef.current = globalSocket;

    const handleConnect = () => {
      const socketId = socketRef.current?.id;
      console.log('Connected to server with ID:', socketId);
      console.log('Active users:', users.length);
      socketRef.current?.emit('client-ready');
    };

    const handleClientReady = (userData: UserData) => {
      console.log('Received user data:', userData);
      setUserColor(userData.color);
    };

    const handleUsersUpdate = (updatedUsers: UserData[]) => {
      console.log('Users updated:', updatedUsers);
      setUsers(updatedUsers);
    };

    const handleUserJoin = (userData: UserData) => {
      console.log('User joined:', userData.name, 'ID:', userData.id);
      console.log('Updated users count:', users.length + 1);
    };

    const handleUserLeave = (userId: string) => {
      console.log('User left:', userId);
      console.log('Updated users count:', users.length - 1);
    };

    const handleError = (error: Error) => {
      console.error('Socket connection error:', error);
    };

    socketRef.current.on('connect', handleConnect);
    socketRef.current.on('client-ready', handleClientReady);
    socketRef.current.on('users-updated', handleUsersUpdate);
    socketRef.current.on('user-joined', handleUserJoin);
    socketRef.current.on('user-left', handleUserLeave);
    socketRef.current.on('connect_error', handleError);

    return () => {
      if (socketRef.current) {
        socketRef.current.off('connect', handleConnect);
        socketRef.current.off('client-ready', handleClientReady);
        socketRef.current.off('users-updated', handleUsersUpdate);
        socketRef.current.off('user-joined', handleUserJoin);
        socketRef.current.off('user-left', handleUserLeave);
        socketRef.current.off('connect_error', handleError);
        socketRef.current = null;
      }
      setUsers([]);
      setUserColor('#000000');
    };
  }, []);

  useEffect(() => {
    const cleanup = setupSocket();
    return () => {
      cleanup();
      if (globalSocket && document.visibilityState === 'hidden') {
        globalSocket.disconnect();
        globalSocket = null;
      }
    };
  }, [setupSocket]);

  const emitDrawing = useCallback((drawingData: DrawingData) => {
    if (socketRef.current) {
      console.log('Emitting drawing data:', drawingData);
      socketRef.current.emit('draw', drawingData);
    } else {
      console.warn('Socket not initialized');
    }
  }, []);

  const subscribeToDrawing = useCallback((callback: (data: DrawingData) => void) => {
    if (!socketRef.current) return () => {};

    console.log('Subscribing to drawing events');
    const handleDrawing = (data: DrawingData) => {
      console.log('Received drawing data:', data);
      callback(data);
    };
    socketRef.current.on('drawing', handleDrawing);
    
    return () => {
      if (socketRef.current) {
        console.log('Unsubscribing from drawing events');
        socketRef.current.off('drawing', handleDrawing);
      }
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
    updateActivity
  };
};
