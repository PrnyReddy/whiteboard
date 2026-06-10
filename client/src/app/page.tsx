'use client';

import Canvas from '@/components/Canvas/Canvas';
import Toolbar from '@/components/Tools/Toolbar';
import { useEffect, useState, Suspense } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useSearchParams, useRouter } from 'next/navigation';

function WhiteboardApp() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { joinRoom } = useSocket();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const room = searchParams.get('room');
    if (!room) {
      const newRoom = Math.random().toString(36).substring(2, 8);
      router.replace(`/?room=${newRoom}`);
    } else {
      joinRoom(room);
      setIsReady(true);
    }
  }, [searchParams, router, joinRoom]);

  if (!isReady) return null;

  return (
    <main className="min-h-screen bg-gray-50">
      <Canvas />
      <Toolbar />
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading Room...</div>}>
      <WhiteboardApp />
    </Suspense>
  );
}

