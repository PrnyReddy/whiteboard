'use client';

import React from 'react';
import styles from './UsersList.module.css';
import { UserData } from '@/types';

interface UsersListProps {
  users: UserData[];
}

const INACTIVE_THRESHOLD = 30 * 1000;

const UsersList: React.FC<UsersListProps> = ({ users }) => {
  const [now, setNow] = React.useState(Date.now());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const sortedUsers = React.useMemo(() => {
    return [...users].sort((a, b) => {
      if (a.lastActive && b.lastActive) {
        return b.lastActive - a.lastActive;
      }
      return 0;
    });
  }, [users]);

  return (
    <div className={styles.usersList}>
      <h3 className={styles.title}>Connected Users ({users.length})</h3>
      <div className={styles.users}>
        {sortedUsers.map((user) => (
          <div 
            key={user.id} 
            className={`${styles.user} ${now - (user.lastActive || 0) > INACTIVE_THRESHOLD ? styles.inactive : ''}`}
          >
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
              title={user.isDrawing 
                ? 'Currently drawing' 
                : `Last active: ${new Date(user.lastActive || Date.now()).toLocaleTimeString()} (${Math.floor((now - (user.lastActive || 0)) / 1000)}s ago)`}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default UsersList;
