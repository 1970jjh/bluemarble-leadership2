import React from 'react';
import { GameVersion } from '../types';

interface GameRulesModalProps {
  visible: boolean;
  onClose: () => void;
  gameMode: GameVersion;
}

export default function GameRulesModal({
  visible,
  onClose,
  gameMode,
}: GameRulesModalProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white border-4 border-black w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        {/* Header */}
        <div className="sticky top-0 bg-blue-500 border-b-4 border-black px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-black text-white">
            게임 규칙 ({gameMode})
          </h2>
          <button
            onClick={onClose}
            className="bg-white hover:bg-gray-100 text-black font-black text-lg px-4 py-1 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all active:translate-x-1 active:translate-y-1"
          >
            X
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Game overview */}
          <section>
            <div className="bg-yellow-300 border-4 border-black px-4 py-2 mb-3 inline-block shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="text-xl font-black text-black">게임 개요</h3>
            </div>
            <ul className="space-y-2 text-base font-black text-gray-800">
              <li className="border-2 border-black p-3 bg-gray-50">
                보드에는 총 32개의 칸이 있습니다.
              </li>
              <li className="border-2 border-black p-3 bg-gray-50">
                각 팀은 주사위를 굴려 말을 이동시킵니다.
              </li>
              <li className="border-2 border-black p-3 bg-gray-50">
                도착한 칸에 해당하는 역량 카드의 상황에 답변합니다.
              </li>
              <li className="border-2 border-black p-3 bg-gray-50">
                AI가 답변을 평가하여 점수를 부여합니다.
              </li>
            </ul>
          </section>

          {/* Dice rules */}
          <section>
            <div className="bg-green-400 border-4 border-black px-4 py-2 mb-3 inline-block shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="text-xl font-black text-black">주사위 규칙</h3>
            </div>
            <ul className="space-y-2 text-base font-black text-gray-800">
              <li className="border-2 border-black p-3 bg-gray-50">
                주사위 2개를 굴려 나온 합만큼 이동합니다.
              </li>
              <li className="border-2 border-black p-3 bg-gray-50">
                더블(같은 숫자)이 나오면 한 번 더 굴릴 수 있습니다.
              </li>
            </ul>
          </section>

          {/* Territory system */}
          <section>
            <div className="bg-purple-400 border-4 border-black px-4 py-2 mb-3 inline-block shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="text-xl font-black text-black">영토 시스템</h3>
            </div>
            <ul className="space-y-2 text-base font-black text-gray-800">
              <li className="border-2 border-black p-3 bg-gray-50">
                문제를 잘 풀면 해당 칸의 영토를 획득합니다.
              </li>
              <li className="border-2 border-black p-3 bg-gray-50">
                다른 팀이 이미 소유한 칸에 도착하면 통행료를 지불합니다.
              </li>
              <li className="border-2 border-black p-3 bg-gray-50">
                더 높은 점수를 받으면 영토를 빼앗을 수 있습니다.
              </li>
            </ul>
          </section>

          {/* Toll system */}
          <section>
            <div className="bg-red-400 border-4 border-black px-4 py-2 mb-3 inline-block shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="text-xl font-black text-black">통행료 시스템</h3>
            </div>
            <ul className="space-y-2 text-base font-black text-gray-800">
              <li className="border-2 border-black p-3 bg-gray-50">
                다른 팀의 영토에 도착하면 통행료를 지불해야 합니다.
              </li>
              <li className="border-2 border-black p-3 bg-gray-50">
                통행료는 영토 소유 팀에게 점수로 전달됩니다.
              </li>
            </ul>
          </section>

          {/* Lap bonus */}
          <section>
            <div className="bg-orange-400 border-4 border-black px-4 py-2 mb-3 inline-block shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="text-xl font-black text-black">한 바퀴 보너스</h3>
            </div>
            <ul className="space-y-2 text-base font-black text-gray-800">
              <li className="border-2 border-black p-3 bg-gray-50">
                보드를 한 바퀴 돌면 보너스 점수를 받습니다.
              </li>
              <li className="border-2 border-black p-3 bg-gray-50">
                출발점을 지날 때마다 보너스가 지급됩니다.
              </li>
            </ul>
          </section>

          {/* Scoring */}
          <section>
            <div className="bg-teal-400 border-4 border-black px-4 py-2 mb-3 inline-block shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="text-xl font-black text-black">점수 시스템</h3>
            </div>
            <ul className="space-y-2 text-base font-black text-gray-800">
              <li className="border-2 border-black p-3 bg-gray-50">
                각 팀은 100점으로 시작합니다.
              </li>
              <li className="border-2 border-black p-3 bg-gray-50">
                AI 평가 결과에 따라 점수가 증감합니다.
              </li>
              <li className="border-2 border-black p-3 bg-gray-50">
                게임 종료 시 가장 높은 점수의 팀이 승리합니다.
              </li>
            </ul>
          </section>

          {/* Tips */}
          <section>
            <div className="bg-pink-400 border-4 border-black px-4 py-2 mb-3 inline-block shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="text-xl font-black text-black">팁</h3>
            </div>
            <ul className="space-y-2 text-base font-black text-gray-800">
              <li className="border-2 border-black p-3 bg-gray-50">
                구체적인 사례와 함께 답변하면 더 높은 점수를 받습니다.
              </li>
              <li className="border-2 border-black p-3 bg-gray-50">
                리더십 역량의 핵심 원칙을 이해하고 답변하세요.
              </li>
              <li className="border-2 border-black p-3 bg-gray-50">
                팀원들과 충분히 토론한 후 답변을 제출하세요.
              </li>
            </ul>
          </section>
        </div>

        {/* Footer close button */}
        <div className="sticky bottom-0 bg-white border-t-4 border-black p-4">
          <button
            onClick={onClose}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-black text-lg py-3 px-6 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all active:translate-x-1 active:translate-y-1"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
