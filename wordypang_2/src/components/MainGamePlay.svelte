<script lang="ts">
  import { onMount } from 'svelte';
  import { game } from '../lib/gameStore.svelte';
  import AnswerPanel from './AnswerPanel.svelte';
  import HexGrid from './HexGrid.svelte';

  let animId: number;
  let lastTimestamp = 0;

  // Frame-rate independent game loop
  function loop(timestamp: number) {
    if (game.currentScene !== 'main') return;

    if (!lastTimestamp) lastTimestamp = timestamp;
    const dt = (timestamp - lastTimestamp) / 1000; // delta time in seconds
    lastTimestamp = timestamp;

    // Run timer only when animations/effects are not locking gameplay
    if (!game.isTimeOverProcessing && !game.isCorrectEffectRunning) {
      game.playTime += dt;
      game.remainTime -= dt;

      if (game.remainTime <= 0) {
        game.remainTime = 0;
        game.currentScene = 'result';
        return;
      }
    }

    animId = requestAnimationFrame(loop);
  }

  onMount(() => {
    lastTimestamp = 0;
    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
    };
  });
</script>

<div class="game-layout">
  <!-- Top Header bar -->
  <header class="game-header">
    <button class="back-btn" onclick={() => game.currentScene = 'title'}>
      ◀ 홈
    </button>
    <div class="score-display">
      <span class="label">SCORE</span>
      <span class="value">{game.point}</span>
    </div>
    <!-- Rounded Timer Badge -->
    <div class="timer-display {game.remainTime < 10 ? 'low-time' : ''}">
      <span class="time-value">{Math.ceil(game.remainTime)}</span>
      <span class="sec-label">초</span>
    </div>
  </header>

  <!-- Answer Panel Section (Mascot is now inside) -->
  <div class="quiz-info-section">
    <div class="panel-box">
      <AnswerPanel />
    </div>
  </div>

  <!-- Master Hexagon Grid -->
  <div class="grid-section">
    <HexGrid />
  </div>
</div>

<style>
  .game-layout {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    max-width: 520px;
    height: 100%;
    padding: 16px 20px;
    box-sizing: border-box;
    gap: 16px;
  }

  /* Header Styles */
  .game-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    z-index: 5;
  }

  .back-btn {
    font-family: inherit;
    font-size: 0.95rem;
    font-weight: 700;
    color: #333; /* Always dark text on white button */
    background: #ffffff;
    border: 2.5px solid var(--color-text);
    padding: 6px 14px;
    border-radius: 10px;
    cursor: pointer;
    box-shadow: 0 4px 0 var(--color-text);
    transition: transform 0.1s, box-shadow 0.1s;
  }
  .back-btn:active {
    transform: translateY(3px);
    box-shadow: 0 1px 0 var(--color-text);
  }

  .score-display {
    display: flex;
    flex-direction: column;
    align-items: center;
    font-weight: 800;
  }
  .score-display .label {
    font-size: 0.75rem;
    opacity: 0.6;
    letter-spacing: 0.5px;
  }
  .score-display .value {
    font-size: 1.6rem;
    color: var(--color-accent);
  }

  /* Round Timer Badge */
  .timer-display {
    background: #ffffff;
    border: 3px solid var(--color-text);
    border-radius: 50%;
    width: 54px;
    height: 54px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    box-shadow: 0 4px 0 var(--color-text);
    font-weight: 800;
    color: #333; /* Always dark text on white bg */
  }
  .timer-display .time-value {
    font-size: 1.25rem;
    line-height: 1.1;
  }
  .timer-display .sec-label {
    font-size: 0.65rem;
    opacity: 0.7;
  }
  .timer-display.low-time {
    border-color: #ef4444;
    color: #ef4444;
    animation: pulse-red 0.5s infinite alternate;
  }
  @keyframes pulse-red {
    0% { transform: scale(1); }
    100% { transform: scale(1.08); }
  }

  /* Mid quiz Section */
  .quiz-info-section {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: center;
  }
  .panel-box {
    flex-grow: 1;
    display: flex;
    justify-content: center;
    min-width: 0;
  }

  /* Hexagon Grid Section */
  .grid-section {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>
