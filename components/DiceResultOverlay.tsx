import React, { useEffect, useState, useRef } from 'react';

interface DiceResultOverlayProps {
  visible: boolean;
  dice1: number;
  dice2: number;
  isRolling: boolean;
  onRollComplete: () => void;
  onShowResultComplete: () => void;
  isDouble: boolean;
}

const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

export default function DiceResultOverlay({
  visible,
  dice1,
  dice2,
  isRolling,
  onRollComplete,
  onShowResultComplete,
  isDouble,
}: DiceResultOverlayProps) {
  const [displayDice1, setDisplayDice1] = useState(0);
  const [displayDice2, setDisplayDice2] = useState(0);
  const [rollCompleted, setRollCompleted] = useState(false);
  const rollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animFrameRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Rolling animation
  useEffect(() => {
    if (!visible || !isRolling) return;

    setRollCompleted(false);

    // Animate dice faces rapidly
    animFrameRef.current = setInterval(() => {
      setDisplayDice1(Math.floor(Math.random() * 6));
      setDisplayDice2(Math.floor(Math.random() * 6));
    }, 80);

    // Stop rolling after 2 seconds
    rollTimerRef.current = setTimeout(() => {
      if (animFrameRef.current) clearInterval(animFrameRef.current);
      setDisplayDice1(dice1 - 1);
      setDisplayDice2(dice2 - 1);
      setRollCompleted(true);
      onRollComplete();
    }, 2000);

    return () => {
      if (animFrameRef.current) clearInterval(animFrameRef.current);
      if (rollTimerRef.current) clearTimeout(rollTimerRef.current);
    };
  }, [visible, isRolling]);

  // Show result then dismiss
  useEffect(() => {
    if (!visible || !rollCompleted) return;

    showTimerRef.current = setTimeout(() => {
      onShowResultComplete();
    }, 2000);

    return () => {
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
    };
  }, [visible, rollCompleted]);

  // Reset on hide
  useEffect(() => {
    if (!visible) {
      setRollCompleted(false);
    }
  }, [visible]);

  if (!visible) return null;

  const total = dice1 + dice2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="text-center">
        {/* Dice display */}
        <div className="flex items-center justify-center gap-8 mb-6">
          <div
            className={`text-[120px] leading-none select-none ${
              isRolling && !rollCompleted ? 'animate-bounce' : ''
            }`}
            style={{
              textShadow: '4px 4px 0px rgba(0,0,0,0.5)',
              transform: isRolling && !rollCompleted ? 'rotate(15deg)' : 'rotate(0deg)',
              transition: 'transform 0.1s',
            }}
          >
            {DICE_FACES[displayDice1]}
          </div>
          <div
            className={`text-[120px] leading-none select-none ${
              isRolling && !rollCompleted ? 'animate-bounce' : ''
            }`}
            style={{
              textShadow: '4px 4px 0px rgba(0,0,0,0.5)',
              transform: isRolling && !rollCompleted ? 'rotate(-15deg)' : 'rotate(0deg)',
              transition: 'transform 0.1s',
              animationDelay: '0.1s',
            }}
          >
            {DICE_FACES[displayDice2]}
          </div>
        </div>

        {/* Result text */}
        {rollCompleted && (
          <div className="space-y-4 animate-pulse">
            <div className="bg-white border-4 border-black px-8 py-4 inline-block shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <span className="text-4xl font-black text-black">
                {dice1} + {dice2} = {total}
              </span>
            </div>
            {isDouble && (
              <div className="bg-yellow-400 border-4 border-black px-6 py-3 inline-block shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <span className="text-3xl font-black text-black">
                  DOUBLE!
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
