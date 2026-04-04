import React, { useEffect, useState } from 'react';
import { Trophy, Coins, PartyPopper } from 'lucide-react';

interface LapBonusPopupProps {
  visible: boolean;
  teamName: string;
  lapCount: number;
  bonusAmount?: number;  // 완주 보너스 점수 (기본 60)
  onPayBonus: () => void;  // 🎯 보너스 지급 버튼 클릭 핸들러
}

const LapBonusPopup: React.FC<LapBonusPopupProps> = ({
  visible,
  teamName,
  lapCount,
  bonusAmount = 60,
  onPayBonus,
}) => {
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (visible) {
      // 애니메이션 시작
      setTimeout(() => setAnimateIn(true), 100);

      // 축하 음향 효과
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

        // 팡파레 효과음
        const playNote = (freq: number, startTime: number, duration: number) => {
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          osc.connect(gain);
          gain.connect(audioContext.destination);
          osc.frequency.value = freq;
          osc.type = 'sine';
          gain.gain.setValueAtTime(0.2, startTime);
          gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
          osc.start(startTime);
          osc.stop(startTime + duration);
        };

        const now = audioContext.currentTime;
        playNote(523, now, 0.15);       // C5
        playNote(659, now + 0.15, 0.15); // E5
        playNote(784, now + 0.3, 0.15);  // G5
        playNote(1047, now + 0.45, 0.4); // C6

        setTimeout(() => audioContext.close(), 1500);
      } catch (e) {}
    } else {
      setAnimateIn(false);
    }
  }, [visible]);

  if (!visible) return null;

  const handlePayClick = () => {
    setAnimateIn(false);
    setTimeout(onPayBonus, 300);
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center backdrop-blur-sm">
      <div className={`transform transition-all duration-500 ${animateIn ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
        {/* 배경 빛 효과 */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-96 h-96 bg-gradient-radial from-yellow-400/30 to-transparent rounded-full animate-pulse" />
        </div>

        <div className="relative bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500 p-1 rounded-3xl shadow-2xl">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-3xl min-w-[350px]">
            {/* 파티 아이콘 */}
            <div className="flex justify-center gap-4 mb-4">
              <PartyPopper className="text-yellow-400 animate-bounce" size={40} />
              <Trophy className="text-yellow-400 animate-pulse" size={48} />
              <PartyPopper className="text-yellow-400 animate-bounce" size={40} style={{ animationDelay: '0.2s' }} />
            </div>

            {/* 제목 */}
            <div className="text-center mb-6">
              <div className="text-yellow-400 text-sm font-bold uppercase tracking-widest mb-2">
                LAP COMPLETE!
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-2">
                한 바퀴 완주!
              </h2>
              <div className="text-xl text-yellow-300 font-bold">
                {teamName} - {lapCount}바퀴 완료
              </div>
            </div>

            {/* 보너스 표시 - 완주 팀에게만 +60점 */}
            <div className="bg-black/30 rounded-2xl p-5 mb-6">
              <div className="text-center text-white/70 text-sm uppercase tracking-wider mb-4">
                완주 보너스
              </div>

              {/* 보너스 금액 */}
              <div className="flex flex-col items-center">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-8 py-4 rounded-xl flex items-center gap-4 shadow-lg">
                  <Coins className="text-yellow-300" size={36} />
                  <div className="text-white">
                    <div className="text-4xl font-black">+{bonusAmount}</div>
                    <div className="text-sm opacity-80">포인트 획득!</div>
                  </div>
                </div>
              </div>

              {/* 설명 */}
              <div className="text-center text-white/60 text-sm mt-4">
                한 바퀴를 완주하여 보너스 점수를 획득합니다!
              </div>
            </div>

            {/* 🎯 완주 보너스 지급 버튼 */}
            <button
              onClick={handlePayClick}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-black text-xl py-4 px-8 rounded-xl border-4 border-green-300 shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-3"
            >
              <Trophy size={28} />
              <span>완주 보너스 지급</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LapBonusPopup;
