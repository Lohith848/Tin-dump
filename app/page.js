'use client';

import AuthProvider from './components/AuthProvider';
import Canvas from './components/Canvas';

export default function Home() {
  return (
    <AuthProvider>
      <Canvas />
    </AuthProvider>
  );
}
