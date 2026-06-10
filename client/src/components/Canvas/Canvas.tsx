import React, { useRef, useEffect, useCallback, useState } from 'react';
import { UserCursor } from '../UI/UserCursor';
import { useSocket } from '@/hooks/useSocket';
import { DrawingData, Point, DrawingTool, Path } from '@/types';
import styles from './Canvas.module.css';
import { useStore } from '@/store/useStore';
import UsersList from '../UI/UsersList';
import throttle from 'lodash/throttle';

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
  const cursorRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const { 
    tool,
    paths,
    currentPath,
    startPath, 
    addPoint,
    updateShape, 
    endPath,
    setRemotePath,
    appendRemotePoint,
    setRemotePaths,
    setColor
  } = useStore();

  const { 
    emitDrawing, 
    savePath,
    subscribeToDrawing, 
    subscribeToRoomState,
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
  }, []);

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
    if (data.point) {
      const state = useStore.getState();
      const pathExists = state.paths.some(p => p.id === data.id);
      if (!pathExists) {
        setRemotePath({
          id: data.id,
          tool: data.tool as DrawingTool,
          points: data.points || [],
          color: data.color,
          size: data.size,
          shapeData: data.shapeData
        });
      }
      appendRemotePoint(data.id, data.point);
    } else {
      setRemotePath({
        id: data.id,
        tool: data.tool as DrawingTool,
        points: data.points,
        color: data.color,
        size: data.size,
        shapeData: data.shapeData
      });
    }
  }, [setRemotePath, appendRemotePoint]);

  useEffect(() => {
    const unsubDraw = subscribeToDrawing(handleRemoteDrawing);
    const unsubRoom = subscribeToRoomState((pathsData) => {
      setRemotePaths(pathsData as Path[]);
    });
    return () => {
      unsubDraw();
      unsubRoom();
    };
  }, [subscribeToDrawing, subscribeToRoomState, handleRemoteDrawing, setRemotePaths]);

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

  useEffect(() => {
    const handleCursorUpdate = ({ userId, position }: { userId: string, position: Point }) => {
      if (userId !== socketRef?.id) {
        const el = cursorRefs.current[userId];
        if (el) {
          el.style.transform = `translate(${position.x}px, ${position.y}px)`;
        }
      }
    };
    socketRef?.on('cursor-updated', handleCursorUpdate);
    return () => {
      socketRef?.off('cursor-updated', handleCursorUpdate);
    };
  }, [socketRef]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const throttledEmitCursor = useCallback(
    throttle((position: Point) => {
      socketRef?.emit('cursor-move', position);
    }, 30),
    [socketRef]
  );

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

    throttledEmitCursor(position);

    if (!isDrawing.current || !currentPath || !startPoint.current) return;

    if (tool === 'rectangle' || tool === 'circle') {
      updateShape(position);
      draw();
      emitDrawing({
        id: currentPath.id,
        points: [],
        color: currentPath.color,
        size: currentPath.size,
        tool: currentPath.tool,
        shapeData: {
          startPoint: startPoint.current,
          endPoint: position,
          style: currentPath.shapeData?.style || 'stroke'
        }
      });
    } else {
      addPoint(position);
      // Emit DELTA
      emitDrawing({
        id: currentPath.id,
        point: position,
        points: [],
        color: currentPath.color,
        size: currentPath.size,
        tool: currentPath.tool
      });
    }
  }, [tool, currentPath, addPoint, updateShape, draw, emitDrawing, throttledEmitCursor, updateActivity]);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDrawing.current || !currentPath) return;
    
    savePath({
      id: currentPath.id,
      points: currentPath.points,
      color: currentPath.color,
      size: currentPath.size,
      tool: currentPath.tool,
      shapeData: currentPath.shapeData
    });

    isDrawing.current = false;
    startPoint.current = null;
    endPath();
    notifyStopDrawing();
  }, [currentPath, savePath, endPath, notifyStopDrawing]);

  return (
    <div className={styles.canvasContainer}>
      <UsersList users={users} />
      {users.filter(u => u.id !== socketRef?.id).map((user) => (
        <div 
          key={user.id} 
          ref={el => { cursorRefs.current[user.id] = el; }} 
          style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 50, transition: 'transform 0.05s linear' }}
        >
          <UserCursor 
            user={user}
            position={{x:0, y:0}}
          />
        </div>
      ))}
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={(e) => {
          if (isDrawing.current) {
            handleMouseUp(e);
          }
        }}
      />
    </div>
  );
};

export default Canvas;
