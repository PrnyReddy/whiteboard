'use client';

import React from 'react';
import styles from './Toolbar.module.css';
import { useStore } from '@/store/useStore';

const Toolbar = () => {
  const { tool, setTool, size, setSize } = useStore();

  const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(e.target.value);
    setSize(newSize);
  };

  return (
    <div className={styles.toolbar}>
      <div className={styles.toolSection}>
        <button
          className={`${styles.toolButton} ${tool === 'pen' ? styles.active : ''}`}
          onClick={() => setTool('pen')}
        >
          Pen
        </button>
        <button
          className={`${styles.toolButton} ${tool === 'eraser' ? styles.active : ''}`}
          onClick={() => setTool('eraser')}
        >
          Eraser
        </button>
      </div>
      <div className={styles.sizeControl}>
        <span className={styles.sizeLabel}>
          {tool === 'eraser' ? 'Eraser Size' : 'Brush Size'}
        </span>
        <div
          style={{
            width: Math.max(12, size),
            height: Math.max(12, size),
            borderRadius: '50%',
            background: tool === 'eraser' ? '#ddd' : '#666',
            border: '1px solid #666',
            margin: '10px 0',
          }}
        />
        <input
          type="range"
          min="1"
          max="50"
          value={size}
          onChange={handleSizeChange}
          className={styles.sizeSlider}
        />
        <span className={styles.sizeValue}>{size}px</span>
      </div>
    </div>
  );
};

export default Toolbar;
