'use client';

import Canvas from '@/components/Canvas/Canvas';
import Toolbar from '@/components/Tools/Toolbar';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Canvas />
      <Toolbar />
    </main>
  );
}
