import React, { useEffect, useRef } from 'react';

interface LotteryBonusPopupProps {
  visible: boolean;
  teamName: string;
  chanceCardNumber: number;
  onComplete: () => void;
  duration: number;
}

export default function LotteryBonusPopup({
  visible,
  teamName,
  chanceCardNumber,
  onComplete,
  duration,
}: LotteryBonusPopupProps) {
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

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white border-4 border-black p-8 max-w-sm w-full mx-4 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        {/* Lottery icon */}
        <div className="text-5xl mb-4">🎰</div>
        <h2 className="text-3xl font-black text-black mb-2">
          복권 당첨!
        </h2>

        {/* Team name */}
        <div className="bg-purple-400 border-4 border-black px-4 py-3 mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-xl font-black text-white">{teamName}</p>
        </div>

        {/* Chance card number */}
        <div className="bg-yellow-300 border-4 border-black px-6 py-3 mb-4 inline-block shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <span className="text-lg font-black text-black">
            찬스카드 #{chanceCardNumber}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-4 bg-gray-200 border-2 border-black h-2 overflow-hidden">
          <div
            className="h-full bg-purple-500"
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
