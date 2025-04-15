'use client';

import React from 'react';
import styles from './UsersList.module.css';
import { UserData } from '@/types';

interface UsersListProps {
  users: UserData[];
}

const UsersList: React.FC<UsersListProps> = ({ users }) => {
  return (
    <div className={styles.usersList}>
      <h3 className={styles.title}>Connected Users</h3>
      <div className={styles.users}>
        {users.map((user) => (
          <div key={user.id} className={styles.user}>
            <div 
              className={styles.userColor}
              style={{ backgroundColor: user.color }}
            />
            <span className={styles.userName}>
              {user.name || `User ${user.id.slice(0, 4)}`}
            </span>
            {user.isDrawing && (
              <span className={styles.drawingIndicator}>
                ✏️
              </span>
            )}
            <span 
              className={`${styles.status} ${user.isDrawing ? styles.active : ''}`}
              title={user.isDrawing ? 'Currently drawing' : 'Idle'}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default UsersList;
