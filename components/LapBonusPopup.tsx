import React from 'react';

interface LapBonusPopupProps {
  visible: boolean;
  teamName: string;
  lapCount: number;
  bonusAmount: number;
  onPayBonus: () => void;
}

export default function LapBonusPopup({
  visible,
  teamName,
  lapCount,
  bonusAmount,
  onPayBonus,
}: LapBonusPopupProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white border-4 border-black p-8 max-w-sm w-full mx-4 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        {/* Celebration header */}
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-3xl font-black text-black mb-2">
          한 바퀴 완주!
        </h2>

        {/* Team info */}
        <div className="bg-yellow-300 border-4 border-black px-4 py-3 mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-xl font-black text-black">{teamName}</p>
        </div>

        {/* Lap count */}
        <p className="text-lg font-black text-gray-700 mb-2">
          {lapCount}바퀴 완주!
        </p>

        {/* Bonus amount */}
        <div className="bg-green-400 border-4 border-black px-6 py-3 mb-6 inline-block shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <span className="text-2xl font-black text-black">
            +{bonusAmount}점
          </span>
        </div>

        {/* Pay bonus button */}
        <button
          onClick={onPayBonus}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-black text-lg py-3 px-6 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all active:translate-x-1 active:translate-y-1"
        >
          보너스 받기 (+{bonusAmount}점)
        </button>
      </div>
    </div>
  );
}
