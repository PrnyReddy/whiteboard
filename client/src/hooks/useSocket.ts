import { useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { DrawingData } from '@/types';

const SOCKET_URL = 'http://localhost:3001';

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);

  const initSocket = useCallback(() => {
    if (socketRef.current?.connected) {
      console.log('Socket already connected:', socketRef.current.id);
      return () => {};
    }
    if (!socketRef.current?.connected) {
      console.log('Initializing socket connection...');
      socketRef.current = io(SOCKET_URL);

      socketRef.current.on('connect', () => {
        console.log('Connected to server with ID:', socketRef.current?.id);
        socketRef.current?.emit('client-ready');
      });

      socketRef.current.on('client-count', (count: number) => {
        console.log('Connected clients:', count);
      });

      socketRef.current.on('connect_error', (error: Error) => {
        console.error('Socket connection error:', error);
      });
    }

    return () => {
      if (socketRef.current?.connected) {
        console.log('Cleaning up socket connection:', socketRef.current.id);
        socketRef.current.disconnect();
      }
      socketRef.current = null;
    };
  }, []); 

  const emitDrawing = useCallback((drawingData: DrawingData) => {
    if (socketRef.current) {
      console.log('Emitting drawing data:', drawingData);
      socketRef.current.emit('draw', drawingData);
    } else {
      console.warn('Socket not initialized');
    }
  }, []);

  const subscribeToDrawing = useCallback((callback: (data: DrawingData) => void) => {
    if (socketRef.current) {
      console.log('Subscribing to drawing events');
      socketRef.current.on('drawing', (data: DrawingData) => {
        console.log('Received drawing data:', data);
        callback(data);
      });
    }
    return () => {
      if (socketRef.current) {
        console.log('Unsubscribing from drawing events');
        socketRef.current.off('drawing', callback);
      }
    };
  }, []);

  return {
    initSocket,
    emitDrawing,
    subscribeToDrawing,
  };
};
