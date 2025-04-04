'use client';

import React from 'react';
import styles from './Toolbar.module.css';
import { useStore } from '@/store/useStore';

const Toolbar = () => {
  const { 
    tool, setTool, 
    size, setSize,
    history, redoStack,
    undo, redo 
  } = useStore();

  const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(e.target.value);
    setSize(newSize);
  };


  React.useEffect(() => {
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
  }, [undo, redo]);

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
      
      <div className={styles.historyControl}>
        <button 
          className={styles.historyButton}
          onClick={undo} 
          disabled={history.length === 0}
          title="Undo (Ctrl+Z)"
        >
          Undo
        </button>
        <button 
          className={styles.historyButton}
          onClick={redo} 
          disabled={redoStack.length === 0}
          title="Redo (Ctrl+Y or Ctrl+Shift+Z)"
        >
          Redo
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
