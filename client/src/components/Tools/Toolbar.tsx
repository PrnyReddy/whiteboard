'use client';

import React from 'react';
import styles from './Toolbar.module.css';
import CircularColorPicker from './CircularColorPicker';
import { useStore } from '@/store/useStore';
import { DrawingTool, ShapeStyle } from '@/types';

const tools: { name: DrawingTool; icon: string }[] = [
  { name: 'pen', icon: '✏️' },
  { name: 'eraser', icon: '🧼' },
  { name: 'rectangle', icon: '⬜' },
  { name: 'circle', icon: '⭕' },
];

const shapeStyles: { name: ShapeStyle; icon: string }[] = [
  { name: 'stroke', icon: '◻️' },
  { name: 'fill', icon: '⬛' },
];

const Toolbar = () => {
  const { 
    tool, setTool, 
    size, setSize,
    history, redoStack,
    shapeStyle, setShapeStyle,
    undo, redo 
  } = useStore();

  const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(e.target.value);
    setSize(newSize);
  };

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.ctrlKey) {
          if (e.key.toLowerCase() === 'z') {
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
          } else if (e.key === 'y') {
            e.preventDefault();
            redo();
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [undo, redo]);

  const isShapeTool = tool === 'rectangle' || tool === 'circle';

  const [copied, setCopied] = React.useState(false);
  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={styles.toolbar}>
      <button 
        className={styles.toolButton} 
        onClick={handleShare}
        style={{ 
          marginBottom: '15px', 
          width: '100%', 
          padding: '10px', 
          borderRadius: '8px', 
          background: copied ? '#43dd3bff' : '#fff', 
          color: copied ? 'white' : '#333',
          border: '1px solid #ddd',
          fontWeight: 'bold',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
      >
        {copied ? 'Copied! ✓' : '🔗 Share Room'}
      </button>

      <CircularColorPicker />
      <div className={styles.toolSection}>
        {tools.map(({ name, icon }) => (
          <button
            key={name}
            className={`${styles.toolButton} ${tool === name ? styles.active : ''}`}
            onClick={() => setTool(name)}
            title={name.charAt(0).toUpperCase() + name.slice(1)}
          >
            {icon}
          </button>
        ))}
      </div>
      
      {isShapeTool && (
        <div className={styles.shapeStyles}>
          {shapeStyles.map(({ name, icon }) => (
            <button
              key={name}
              className={`${styles.toolButton} ${shapeStyle === name ? styles.active : ''}`}
              onClick={() => setShapeStyle(name)}
              title={name.charAt(0).toUpperCase() + name.slice(1)}
            >
              {icon}
            </button>
          ))}
        </div>
      )}

      <div className={styles.historyControl}>
        <button 
          className={styles.historyButton}
          onClick={undo} 
          disabled={history.length === 0}
          title="Undo (Ctrl+Z)"
        >
          ↩️
        </button>
        <button 
          className={styles.historyButton}
          onClick={redo} 
          disabled={redoStack.length === 0}
          title="Redo (Ctrl+Y or Ctrl+Shift+Z)"
        >
          ↪️
        </button>
      </div>

      <div className={styles.sizeControl}>
        <span className={styles.sizeLabel}>
          {tool === 'eraser' ? 'Eraser Size' : isShapeTool ? 'Border Size' : 'Brush Size'}
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
