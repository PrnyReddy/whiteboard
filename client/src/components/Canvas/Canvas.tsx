'use client';

import React, { useRef, useEffect } from 'react';
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

  const { 
    tool,
    paths,
    currentPath,
    startPath, 
    addPoint, 
    endPath 
  } = useStore();

  const draw = () => {
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
      
      const points = path.points;
      if (points.length > 0) {
        context.moveTo(points[0].x, points[0].y);
        points.slice(1).forEach(point => {
          context.lineTo(point.x, point.y);
        });
        context.stroke();
      }
      context.globalCompositeOperation = 'source-over';
    });

    if (currentPath && currentPath.points.length > 0) {
      context.beginPath();
      
      if (currentPath.tool === 'eraser') {
        context.globalCompositeOperation = 'destination-out';
        context.strokeStyle = 'rgba(0,0,0,1)';
      } else {
        context.globalCompositeOperation = 'source-over';
        context.strokeStyle = currentPath.color;
      }
      
      context.lineWidth = currentPath.size;
      
      const points = currentPath.points;
      context.moveTo(points[0].x, points[0].y);
      points.slice(1).forEach(point => {
        context.lineTo(point.x, point.y);
      });
      context.stroke();
      context.globalCompositeOperation = 'source-over';
    }
  };

  useEffect(() => {
    draw();
  }, [paths, currentPath]);

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

  useEffect(() => {
    const context = contextRef.current;
    if (!context) return;

    if (tool === 'eraser') {
      context.globalCompositeOperation = 'destination-out';
      context.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      context.globalCompositeOperation = 'source-over';
      context.strokeStyle = '#000000';
    }
  }, [tool]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDrawing.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
  
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    startPath(); 
    addPoint({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    addPoint({ x, y });
  };

  const handleMouseUp = () => {
    if (!isDrawing.current) return;
    
    isDrawing.current = false;
    endPath();
  };

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
