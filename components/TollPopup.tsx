import React, { useEffect, useState } from 'react';
import { Coins, ArrowRight, Home, Dice6 } from 'lucide-react';

interface TollPopupProps {
  visible: boolean;
  payerTeamName: string;
  receiverTeamName: string;
  tollAmount: number;
  squareIndex: number;
  onPayToll: () => void;  // 🎯 통행료 지불 버튼 클릭 핸들러
}

const TollPopup: React.FC<TollPopupProps> = ({
  visible,
  payerTeamName,
  receiverTeamName,
  tollAmount,
  squareIndex,
  onPayToll,
}) => {
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (visible) {
      setTimeout(() => setAnimateIn(true), 100);

      // 코인 효과음
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const playNote = (freq: number, startTime: number, dur: number) => {
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          osc.connect(gain);
          gain.connect(audioContext.destination);
          osc.frequency.value = freq;
          osc.type = 'sine';
          gain.gain.setValueAtTime(0.15, startTime);
          gain.gain.exponentialRampToValueAtTime(0.01, startTime + dur);
          osc.start(startTime);
          osc.stop(startTime + dur);
        };
        const now = audioContext.currentTime;
        playNote(800, now, 0.1);
        playNote(600, now + 0.1, 0.1);
        playNote(400, now + 0.2, 0.2);
        setTimeout(() => audioContext.close(), 1000);
      } catch (e) {}
    } else {
      setAnimateIn(false);
    }
  }, [visible]);

  if (!visible) return null;

  const handlePayClick = () => {
    setAnimateIn(false);
    setTimeout(onPayToll, 300);
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center backdrop-blur-sm">
      <div className={`transform transition-all duration-500 ${animateIn ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
        {/* 배경 효과 */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-80 h-80 bg-gradient-radial from-orange-400/20 to-transparent rounded-full animate-pulse" />
        </div>

        <div className="relative bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 p-1 rounded-3xl shadow-2xl">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-3xl min-w-[380px]">
            {/* 아이콘 */}
            <div className="flex justify-center gap-4 mb-4">
              <Home className="text-orange-400 animate-pulse" size={40} />
              <Coins className="text-yellow-400 animate-bounce" size={48} />
              <Home className="text-orange-400 animate-pulse" size={40} />
            </div>

            {/* 제목 */}
            <div className="text-center mb-6">
              <div className="text-orange-400 text-sm font-bold uppercase tracking-widest mb-2">
                TOLL PAYMENT
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-2">
                통행료 지불!
              </h2>
              <div className="text-lg text-orange-300">
                {squareIndex}번 칸 (이미 풀었던 역량카드)
              </div>
            </div>

            {/* 통행료 정보 */}
            <div className="bg-black/30 rounded-2xl p-5 mb-6">
              {/* 지불 팀 → 수령 팀 */}
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="bg-red-500/30 px-4 py-2 rounded-xl">
                  <span className="text-red-300 font-bold">{payerTeamName}</span>
                </div>
                <ArrowRight className="text-yellow-400" size={24} />
                <div className="bg-green-500/30 px-4 py-2 rounded-xl">
                  <span className="text-green-300 font-bold">{receiverTeamName}</span>
                </div>
              </div>

              {/* 금액 */}
              <div className="flex flex-col items-center">
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 px-8 py-4 rounded-xl flex items-center gap-3">
                  <Coins className="text-white" size={32} />
                  <div className="text-white">
                    <div className="text-4xl font-black">{tollAmount}</div>
                    <div className="text-xs opacity-80">포인트</div>
                  </div>
                </div>
              </div>

              {/* 설명 */}
              <div className="text-center text-white/60 text-sm mt-4">
                {payerTeamName}이(가) {receiverTeamName}에게 통행료를 지불합니다
              </div>
            </div>

            {/* 다음 행동 안내 */}
            <div className="bg-blue-500/20 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-center gap-2 text-blue-300">
                <Dice6 size={20} />
                <span className="font-medium">통행료 지불 후 관리자가 주사위를 입력합니다</span>
              </div>
            </div>

            {/* 🎯 통행료 지불 버튼 */}
            <button
              onClick={handlePayClick}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xl py-4 px-8 rounded-xl border-4 border-orange-300 shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-3"
            >
              <Coins size={28} />
              <span>통행료 지불</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TollPopup;
