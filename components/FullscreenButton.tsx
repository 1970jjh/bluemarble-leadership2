import React, { useState, useEffect, useCallback } from 'react';

const FullscreenButton: React.FC = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const updateState = useCallback(() => {
    setIsFullscreen(!!document.fullscreenElement);
  }, []);

  useEffect(() => {
    document.addEventListener('fullscreenchange', updateState);
    return () => document.removeEventListener('fullscreenchange', updateState);
  }, [updateState]);

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
      className="fixed bottom-4 right-4 z-[9999] bg-black text-white border-2 border-white px-3 py-2 text-sm font-bold shadow-lg hover:bg-gray-800 transition-colors rounded"
      title={isFullscreen ? '전체화면 해제' : '전체화면'}
    >
      {isFullscreen ? '⛶ 전체화면 해제' : '⛶ 전체화면'}
    </button>
  );
};

export default FullscreenButton;
