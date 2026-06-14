<script lang="ts">
  import { onMount } from 'svelte';
  import { game } from '../lib/gameStore.svelte';
  import { appState } from '../lib/appStore.svelte';
  import Mascot from './Mascot.svelte';

  onMount(() => {
    // Update global user stats
    appState.updateWordyPang2Stats(game.point, 1); // Mock words cleared as 1 per game for now or from game.score
  });
</script>

<div class="scene-container">
  <header class="result-header">
    <h1 class="logo-text">게임 종료!</h1>
    <p class="subtitle-text">가족 카톡방에 기록을 자랑해 보세요!</p>
  </header>

  <!-- Mascot displays celebration/sad based on performance -->
  <div class="mascot-wrapper">
    <Mascot />
  </div>

  <!-- Score Board Card -->
  <div class="score-card">
    <div class="stat-row">
      <span class="label">최종 점수</span>
      <span class="value score-highlight">{game.point}</span>
    </div>
    <div class="divider"></div>
    <div class="stats-grid">
      <div class="stat-col">
        <span class="sub-label">플레이 시간</span>
        <span class="sub-value">{Math.round(game.playTime)}초</span>
      </div>
      <div class="stat-col">
        <span class="sub-label">정답률</span>
        <span class="sub-value">{game.accuracy}%</span>
      </div>
    </div>
  </div>

  <!-- Buttons -->
  <div class="button-group">
    <button class="btn btn-primary" onclick={() => game.startNewGame()}>
      다시 도전
    </button>
    <button class="btn btn-secondary" onclick={() => game.currentScene = 'title'}>
      메인 화면으로
    </button>
  </div>
</div>

<style>
  .scene-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 24px;
    width: 100%;
    max-width: 480px;
    height: 100%;
    padding: 24px;
    text-align: center;
  }

  .result-header {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .logo-text {
    font-size: 3rem;
    font-weight: 900;
    color: var(--color-text);
  }

  .subtitle-text {
    font-size: 1rem;
    font-weight: 500;
    opacity: 0.8;
  }

  .mascot-wrapper {
    margin: 5px 0;
  }

  /* Score Card Card */
  .score-card {
    background: #ffffff;
    border: 3.5px solid var(--color-text);
    border-radius: 20px;
    padding: 24px;
    width: 100%;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.04);
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .stat-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 700;
  }
  .stat-row .label {
    font-size: 1.1rem;
    opacity: 0.85;
  }
  .stat-row .score-highlight {
    font-size: 2.2rem;
    color: var(--color-accent);
    letter-spacing: -1px;
  }

  .divider {
    height: 3px;
    background: var(--color-border);
  }

  .stats-grid {
    display: flex;
    justify-content: space-around;
  }
  .stat-col {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .stat-col .sub-label {
    font-size: 0.85rem;
    font-weight: 600;
    opacity: 0.6;
  }
  .stat-col .sub-value {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-text);
  }

  /* Button Styles */
  .button-group {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
  }

  .btn {
    font-family: inherit;
    font-size: 1.2rem;
    font-weight: 700;
    padding: 14px;
    border-radius: 16px;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    border: 3.5px solid var(--color-text);
    box-shadow: 0 6px 0 var(--color-text);
  }

  .btn:active {
    transform: translateY(4px);
    box-shadow: 0 2px 0 var(--color-text);
  }

  .btn-primary {
    background: var(--color-accent);
    color: var(--color-bg);
  }
  .btn-primary:hover {
    background: var(--color-character);
  }

  .btn-secondary {
    background: #ffffff;
    color: var(--color-text);
  }
  .btn-secondary:hover {
    background: var(--color-bg);
  }
</style>
