import React, { useRef, useEffect, useCallback, useState } from 'react';
import { UserCursor } from '../UI/UserCursor';
import { useSocket } from '@/hooks/useSocket';
import { DrawingData, Point, DrawingTool } from '@/types';
import styles from './Canvas.module.css';
import { useStore } from '@/store/useStore';
import UsersList from '../UI/UsersList';

interface CanvasProps {
  width?: number;
  height?: number;
}

const Canvas: React.FC<CanvasProps> = ({
  width,
  height,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const isDrawing = useRef(false);
  const startPoint = useRef<Point | null>(null);

  const { 
    tool,
    paths,
    currentPath,
    startPath, 
    addPoint,
    updateShape, 
    endPath,
    setRemotePath,
    setColor
  } = useStore();

  const { 
    emitDrawing, 
    subscribeToDrawing, 
    userColor,
    users,
    startDrawing: notifyStartDrawing,
    stopDrawing: notifyStopDrawing,
    updateActivity,
    socket: socketRef 
  } = useSocket();

  useEffect(() => {
    if (userColor) {
      setColor(userColor);
    }
  }, [userColor, setColor]);

  const [clientWidth, setClientWidth] = useState<number>(0);
  const [clientHeight, setClientHeight] = useState<number>(0);

  useEffect(() => {
    setClientWidth(window.innerWidth);
    setClientHeight(window.innerHeight);
  }, [])

  const drawShape = useCallback((
    context: CanvasRenderingContext2D,
    startPoint: Point,
    endPoint: Point,
    tool: DrawingTool,
    color: string,
    size: number,
    style: 'stroke' | 'fill' = 'stroke'
  ) => {
    context.beginPath();
    context.strokeStyle = color;
    context.fillStyle = color;
    context.lineWidth = size;

    if (tool === 'rectangle') {
      const width = endPoint.x - startPoint.x;
      const height = endPoint.y - startPoint.y;
      if (style === 'fill') {
        context.fillRect(startPoint.x, startPoint.y, width, height);
      } else {
        context.strokeRect(startPoint.x, startPoint.y, width, height);
      }
    } else if (tool === 'circle') {
      const radius = Math.sqrt(
        Math.pow(endPoint.x - startPoint.x, 2) + 
        Math.pow(endPoint.y - startPoint.y, 2)
      ) / 2;
      const centerX = (startPoint.x + endPoint.x) / 2;
      const centerY = (startPoint.y + endPoint.y) / 2;
      
      context.beginPath();
      context.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      if (style === 'fill') {
        context.fill();
      } else {
        context.stroke();
      }
    }
  }, []);

  const draw = useCallback(() => {
    const context = contextRef.current;
    const canvas = canvasRef.current;
    if (!context || !canvas) return;

    context.clearRect(0, 0, canvas.width, canvas.height);

    paths.forEach(path => {
      context.beginPath();
      if (path.tool === 'eraser') {
        context.globalCompositeOperation = 'destination-out';
        context.strokeStyle = 'rgba(0,0,0,1)';
      } else {
        context.globalCompositeOperation = 'source-over';
        context.strokeStyle = path.color;
      }
      
      context.lineWidth = path.size;
      
      if (path.shapeData) {
        const { startPoint, endPoint, style } = path.shapeData;
        drawShape(context, startPoint, endPoint, path.tool, path.color, path.size, style);
      } else if (path.points.length > 0) {
        context.moveTo(path.points[0].x, path.points[0].y);
        path.points.slice(1).forEach(point => {
          context.lineTo(point.x, point.y);
        });
        context.stroke();
      }
      context.globalCompositeOperation = 'source-over';
    });

    if (currentPath) {
      context.beginPath();
      context.globalCompositeOperation = 'source-over';
      context.strokeStyle = currentPath.color;
      context.lineWidth = currentPath.size;

      if (currentPath.shapeData) {
        const { startPoint, endPoint, style } = currentPath.shapeData;
        drawShape(context, startPoint, endPoint, currentPath.tool, currentPath.color, currentPath.size, style);
      } else if (currentPath.points.length > 0) {
        context.moveTo(currentPath.points[0].x, currentPath.points[0].y);
        currentPath.points.slice(1).forEach(point => {
          context.lineTo(point.x, point.y);
        });
        context.stroke();
      }
    }
  }, [paths, currentPath, drawShape]);

  const handleRemoteDrawing = useCallback((data: DrawingData) => {
    console.log('Received remote drawing:', data);
    setRemotePath({
      id: Date.now().toString(),
      tool: data.tool as DrawingTool,
      points: data.points,
      color: data.color,
      size: data.size,
      shapeData: data.shapeData
    });
  }, [setRemotePath]);


  useEffect(() => {
    const unsubscribe = subscribeToDrawing(handleRemoteDrawing);
    return unsubscribe;
  }, [subscribeToDrawing, handleRemoteDrawing]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = width || clientWidth;
    canvas.height = height || clientHeight;
    const context = canvas.getContext('2d');
    if (!context) return;

    context.lineCap = 'round';
    context.lineJoin = 'round';    
    contextRef.current = context;
  }, [width, height, clientWidth, clientHeight]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();
    isDrawing.current = true;
    notifyStartDrawing();
    updateActivity();
    const canvas = canvasRef.current;
    if (!canvas) return;
  
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const point = { x, y };
    startPoint.current = point;
    startPath(point);
  }, [startPath, notifyStartDrawing, updateActivity]);

  const [otherCursors, setOtherCursors] = useState<Record<string, Point>>({});
  
  useEffect(() => {
    const handleCursorUpdate = ({ userId, position }: { userId: string, position: Point }) => {
      if (userId !== socketRef?.id) {
        setOtherCursors(prev => ({ ...prev, [userId]: position }));
      }
    };

    socketRef?.on('cursor-updated', handleCursorUpdate);
    
    return () => {
      socketRef?.off('cursor-updated', handleCursorUpdate);
    };
  }, [socketRef]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    updateActivity();
    e.preventDefault();
    e.stopPropagation();
  
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const position = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    socketRef?.emit('cursor-move', position);

    if (!isDrawing.current || !currentPath || !startPoint.current) return;

    const currentPoint = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    if (tool === 'rectangle' || tool === 'circle') {
      updateShape(currentPoint);
      draw();
    } else {
      addPoint(currentPoint);
      emitDrawing({
        points: currentPath.points,
        color: currentPath.color,
        size: currentPath.size,
        tool: currentPath.tool
      });
    }
  }, [tool, currentPath, addPoint, updateShape, draw, emitDrawing, socketRef, updateActivity]);

  const handleShapeComplete = useCallback(() => {
    if (!currentPath?.shapeData) return;

    emitDrawing({
      points: [],
      color: currentPath.color,
      size: currentPath.size,
      tool: currentPath.tool,
      shapeData: currentPath.shapeData
    });
  }, [currentPath, emitDrawing]);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDrawing.current) return;
    
    if (tool === 'rectangle' || tool === 'circle') {
      handleShapeComplete();
    }

    isDrawing.current = false;
    startPoint.current = null;
    endPath();
    notifyStopDrawing();
  }, [tool, endPath, handleShapeComplete, notifyStopDrawing, updateActivity]);

  return (
      <div className={styles.canvasContainer}>
        <UsersList users={users} />
        {Object.entries(otherCursors).map(([userId, position]) => {
          const user = users.find(u => u.id === userId);
          if (!user) return null;
          return (
            <UserCursor 
              key={userId}
              user={user}
              position={position}
            />
          );
        })}
        <canvas
        ref={canvasRef}
        className={styles.canvas}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      onMouseLeave={(e) => {
        notifyStopDrawing();
        handleMouseUp(e);
      }}
      />
    </div>
  );
};

export default Canvas;
