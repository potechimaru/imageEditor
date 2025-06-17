// src/components/FreeDrawingWrapper.tsx
'use client';

import dynamic from 'next/dynamic';

const FreeDrawingComponent = dynamic(() => import('../../app/index'), {
  ssr: false,
});

export default function FreeDrawingWrapper() {
  return <FreeDrawingComponent />;
}
