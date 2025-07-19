import { useState, useEffect } from 'react';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if ('Notification' in window) {
      const status = await Notification.requestPermission();
      setPermission(status);
      return status;
    }
    return 'denied' as NotificationPermission;
  };

  const showNotification = async (title: string, options?: NotificationOptions) => {
    if (!('Notification' in window)) {
      return false;
    }

    let currentPermission = permission;

    // If permission is default, request it first
    if (currentPermission === 'default') {
      currentPermission = await requestPermission();
    }

    // Only show notification if permission is granted
    if (currentPermission === 'granted') {
      new Notification(title, options);
      return true;
    }

    return false;
  };

  return { permission, requestPermission, showNotification };
} 