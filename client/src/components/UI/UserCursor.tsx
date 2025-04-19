'use client';

import React from 'react';
import { UserData } from '@/types';
import styles from './UserCursor.module.css';

interface UserCursorProps {
  user: UserData;
  position: { x: number; y: number };
}

export const UserCursor: React.FC<UserCursorProps> = ({ user, position }) => {
  return (
    <div 
      className={`${styles.cursor} ${user.isDrawing ? styles.drawing : ''}`}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        backgroundColor: user.color,
      }}
    >
      <div className={styles.name}>
        {user.name} {user.isDrawing ? '(drawing)' : ''}
      </div>
    </div>
  );
};
