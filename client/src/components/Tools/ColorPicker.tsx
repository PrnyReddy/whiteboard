'use client';

import React, { useState, useCallback, useEffect } from 'react';
import styles from './ColorPicker.module.css';
import { useStore } from '@/store/useStore';
import { useClickOutside } from '@/hooks/useClickOutside';

const ColorPicker: React.FC = () => {
  const { color, setColor } = useStore();
  const [showPicker, setShowPicker] = useState(false);

  const handleClose = useCallback(() => setShowPicker(false), []);
  const containerRef = useClickOutside(handleClose);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showPicker) {
        setShowPicker(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPicker]);

  return (
    <div className={styles.colorPickerContainer} ref={containerRef}>
      <button 
        className={styles.currentColor}
        onClick={() => setShowPicker(!showPicker)}
        style={{ backgroundColor: color }}
        title="Change Color"
      >
        <span className={styles.circle} style={{ backgroundColor: color }} />
      </button>
      {showPicker && (
        <div className={styles.pickerPopup}>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className={styles.colorInput}
          />
        </div>
      )}
    </div>
  );
};

export default ColorPicker;
