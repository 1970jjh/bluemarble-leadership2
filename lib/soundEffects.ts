// Sound Effects - no-op implementations (console.log only)

export const soundEffects = {
  playDiceRoll() {
    console.log('[SoundEffect] Dice roll');
  },
  playDiceResult() {
    console.log('[SoundEffect] Dice result');
  },
  playMove() {
    console.log('[SoundEffect] Move');
  },
  playGameStart() {
    console.log('[SoundEffect] Game start');
  },
  playCelebration() {
    console.log('[SoundEffect] Celebration');
  },
  playPause() {
    console.log('[SoundEffect] Pause');
  },
  playCardDraw() {
    console.log('[SoundEffect] Card draw');
  },
};
