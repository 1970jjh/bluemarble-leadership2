import React, { useState, useEffect } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

export default function FullscreenButton() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <button
      onClick={toggleFullscreen}
      className="fixed bottom-4 right-4 z-40 bg-white hover:bg-gray-100 border-4 border-black p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all active:translate-x-1 active:translate-y-1"
      title={isFullscreen ? '전체화면 해제' : '전체화면'}
    >
      {isFullscreen ? (
        <Minimize2 className="w-5 h-5 text-black" strokeWidth={3} />
      ) : (
        <Maximize2 className="w-5 h-5 text-black" strokeWidth={3} />
      )}
    </button>
  );
}
