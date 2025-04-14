import React, { useRef, useEffect, useCallback } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { DrawingData, Point, DrawingTool } from '@/types';
import styles from './Canvas.module.css';
import { useStore } from '@/store/useStore';

interface CanvasProps {
  width?: number;
  height?: number;
}

const Canvas: React.FC<CanvasProps> = ({
  width = window.innerWidth,
  height = window.innerHeight,
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

  const { initSocket, emitDrawing, subscribeToDrawing, userColor } = useSocket();

  useEffect(() => {
    if (userColor) {
      setColor(userColor);
    }
  }, [userColor, setColor]);

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
    const cleanup = initSocket();
    return cleanup;
  }, [initSocket]);

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

    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return;

    context.lineCap = 'round';
    context.lineJoin = 'round';    
    contextRef.current = context;
  }, [width, height]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    isDrawing.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
  
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const point = { x, y };
    startPoint.current = point;
    startPath(point);
  }, [startPath]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing.current || !currentPath || !startPoint.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
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
  }, [tool, currentPath, addPoint, updateShape, draw, emitDrawing]);

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
    if (!isDrawing.current) return;
    
    if (tool === 'rectangle' || tool === 'circle') {
      handleShapeComplete();
    }

    isDrawing.current = false;
    startPoint.current = null;
    endPath();
  }, [tool, endPath, handleShapeComplete]);

  return (
    <div className={styles.canvasContainer}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  );
};

export default Canvas;
