'use client';

import { useState, useEffect } from 'react';

export function ClientTimestamp({ date }: { date: Date }) {
  const [timeString, setTimeString] = useState('');

  useEffect(() => {
    setTimeString(date.toLocaleTimeString());
  }, [date]);

  if (!timeString) {
    return null; // Or a placeholder
  }

  return <span className="text-xs text-gray-500">{timeString}</span>;
} 