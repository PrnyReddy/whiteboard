'use client';

import React from 'react';
import styles from './Toolbar.module.css';
import { useStore } from '@/store/useStore';

const Toolbar = () => {
  const { tool, setTool } = useStore();

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
    </div>
  );
};

export default Toolbar;
