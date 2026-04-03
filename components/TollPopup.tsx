import React from 'react';

interface TollPopupProps {
  visible: boolean;
  payerTeamName: string;
  receiverTeamName: string;
  tollAmount: number;
  squareIndex: number;
  onPayToll: () => void;
}

export default function TollPopup({
  visible,
  payerTeamName,
  receiverTeamName,
  tollAmount,
  squareIndex,
  onPayToll,
}: TollPopupProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white border-4 border-black p-8 max-w-sm w-full mx-4 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        {/* Toll icon */}
        <div className="text-5xl mb-4">💰</div>
        <h2 className="text-3xl font-black text-black mb-4">
          통행료!
        </h2>

        {/* Payer -> Receiver */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="bg-red-400 border-4 border-black px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <span className="font-black text-white text-lg">{payerTeamName}</span>
          </div>
          <span className="text-2xl font-black text-black">→</span>
          <div className="bg-green-400 border-4 border-black px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <span className="font-black text-white text-lg">{receiverTeamName}</span>
          </div>
        </div>

        {/* Amount */}
        <div className="bg-yellow-300 border-4 border-black px-6 py-3 mb-2 inline-block shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <span className="text-2xl font-black text-black">
            {tollAmount}점
          </span>
        </div>

        {/* Square info */}
        <p className="text-sm font-black text-gray-500 mb-6">
          칸 #{squareIndex}
        </p>

        {/* Pay toll button */}
        <button
          onClick={onPayToll}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-black text-lg py-3 px-6 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all active:translate-x-1 active:translate-y-1"
        >
          통행료 지불
        </button>
      </div>
    </div>
  );
}
