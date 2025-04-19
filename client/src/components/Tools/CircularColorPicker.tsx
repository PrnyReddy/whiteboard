'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import styles from './CircularColorPicker.module.css';
import { useStore } from '@/store/useStore';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useSocket } from '@/hooks/useSocket';

const CircularColorPicker: React.FC = () => {
  const { color, setColor } = useStore();
  const { socket: socketRef } = useSocket();
  const [showPicker, setShowPicker] = useState(false);
  const containerRef = useClickOutside(() => setShowPicker(false));
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [saturation, setSaturation] = useState(100);
  const [lightness, setLightness] = useState(50);

  const updateColor = useCallback((newColor: string) => {
    setColor(newColor);
    socketRef?.emit('color-change', newColor);
  }, [setColor, socketRef]);

  const drawColorWheel = useCallback((canvas: HTMLCanvasElement, s = saturation, l = lightness) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 5;

    for (let angle = 0; angle < 360; angle++) {
      const startAngle = (angle - 2) * Math.PI / 180;
      const endAngle = (angle + 2) * Math.PI / 180;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();

      const gradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, radius
      );

      const hue = angle;
      gradient.addColorStop(0, '#fff');
      gradient.addColorStop(1, `hsl(${hue}, ${s}%, ${l}%)`);

      ctx.fillStyle = gradient;
      ctx.fill();
    }
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const selectedColor = `#${[pixel[0], pixel[1], pixel[2]]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('')}`;

    updateColor(selectedColor);
    setShowPicker(false);
  }, [updateColor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !showPicker) return;
    drawColorWheel(canvas, saturation, lightness);
  }, [drawColorWheel, showPicker, saturation, lightness]);

  const handleSaturationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newSaturation = parseInt(e.target.value);
    setSaturation(newSaturation);
    const canvas = canvasRef.current;
    if (canvas) {
      drawColorWheel(canvas, newSaturation, lightness);
    }
  }, [drawColorWheel, lightness]);

  const handleLightnessChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newLightness = parseInt(e.target.value);
    setLightness(newLightness);
    const canvas = canvasRef.current;
    if (canvas) {
      drawColorWheel(canvas, saturation, newLightness);
    }
  }, [drawColorWheel, saturation]);

  return (
    <div className={styles.container} ref={containerRef}>
      <button 
        className={styles.colorButton}
        onClick={() => setShowPicker(!showPicker)}
        style={{ backgroundColor: color }}
      >
        <span className={styles.circle} style={{ backgroundColor: color }} />
      </button>
      {showPicker && (
        <div className={styles.pickerContainer}>
          <div className={styles.controls}>
            <div className={styles.sliderContainer}>
              <label>Saturation</label>
              <input
                type="range"
                min="0"
                max="100"
                value={saturation}
                onChange={handleSaturationChange}
                className={styles.slider}
              />
            </div>
            <div className={styles.sliderContainer}>
              <label>Lightness</label>
              <input
                type="range"
                min="0"
                max="100"
                value={lightness}
                onChange={handleLightnessChange}
                className={styles.slider}
              />
            </div>
          </div>
          <canvas
            ref={canvasRef}
            width={200}
            height={200}
            className={styles.colorWheel}
            onClick={handleCanvasClick}
          />
          <input
            type="color"
            value={color}
            onChange={(e) => {
              updateColor(e.target.value);
              setShowPicker(false);
            }}
            className={styles.colorInput}
          />
        </div>
      )}
    </div>
  );
};

export default CircularColorPicker;
