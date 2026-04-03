import React, { useEffect, useRef } from 'react';
import { GameCard, BoardSquare } from '../types';

interface CompetencyCardPreviewProps {
  visible: boolean;
  card: GameCard | null;
  square: BoardSquare | null;
  onComplete: () => void;
  duration: number;
}

export default function CompetencyCardPreview({
  visible,
  card,
  square,
  onComplete,
  duration,
}: CompetencyCardPreviewProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) return;

    timerRef.current = setTimeout(() => {
      onComplete();
    }, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible, duration]);

  if (!visible || !card) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white border-4 border-black p-8 max-w-md w-full mx-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        {/* Competency badge */}
        {card.competency && (
          <div className="bg-blue-500 border-4 border-black px-4 py-2 inline-block mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <span className="text-white font-black text-sm uppercase tracking-wider">
              {card.competency}
            </span>
          </div>
        )}

        {/* Card title */}
        <h2 className="text-2xl font-black text-black mb-3 leading-tight">
          {card.title}
        </h2>

        {/* Square info */}
        {square && (
          <div className="bg-gray-100 border-4 border-black px-4 py-2 mt-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <span className="text-sm font-black text-gray-700">
              📍 {square.name}
            </span>
          </div>
        )}

        {/* Progress bar */}
        <div className="mt-6 bg-gray-200 border-2 border-black h-2 overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all ease-linear"
            style={{
              animation: `shrink ${duration}ms linear forwards`,
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
