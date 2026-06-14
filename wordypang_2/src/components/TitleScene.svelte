<script lang="ts">
  import { onMount } from 'svelte';
  import { game } from '../lib/gameStore.svelte';
  import Mascot from './Mascot.svelte';

  // Local state to track chosen difficulty on Title Scene before launching
  let localDiff = $state<'easy' | 'normal' | 'hard'>('normal');

  onMount(() => {
    game.assignRandomTheme();
  });
</script>

<div class="scene-container">
  <!-- Title Header -->
  <header class="title-header">
    <h1 class="logo-text">Wordypang 2</h1>
    <p class="subtitle-text">가족과 함께하는 벌집 단어 퍼즐</p>
  </header>

  <!-- Cute floating mascot -->
  <div class="mascot-wrapper">
    <Mascot />
  </div>

  <!-- High Score Badge -->
  <div class="highscore-badge">
    <span class="label">최고 점수</span>
    <span class="value">{game.highScore}</span>
  </div>

  <!-- Difficulty Selection Section -->
  <div class="difficulty-section">
    <h3 class="section-title">난이도 선택</h3>
    <div class="diff-tabs">
      <button 
        class="diff-tab-btn {localDiff === 'easy' ? 'active' : ''}" 
        onclick={() => localDiff = 'easy'}
      >
        <span class="diff-title">이지</span>
        <span class="diff-desc">초등학교 저학년</span>
      </button>
      <button 
        class="diff-tab-btn {localDiff === 'normal' ? 'active' : ''}" 
        onclick={() => localDiff = 'normal'}
      >
        <span class="diff-title">노멀</span>
        <span class="diff-desc">초등고학년~중등</span>
      </button>
      <button 
        class="diff-tab-btn {localDiff === 'hard' ? 'active' : ''}" 
        onclick={() => localDiff = 'hard'}
      >
        <span class="diff-title">하드</span>
        <span class="diff-desc">고등학교 수준</span>
      </button>
    </div>
  </div>

  <!-- Buttons list -->
  <div class="button-group">
    <button class="btn btn-primary" onclick={() => game.startNewGame(localDiff)}>
      게임 시작
    </button>
    <button class="btn btn-secondary" onclick={() => game.currentScene = 'dictionary'}>
      내 단어장
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
    padding: 16px;
    text-align: center;
    box-sizing: border-box;
  }

  .title-header {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .logo-text {
    font-size: clamp(2.2rem, 8vw, 3.2rem);
    font-weight: 900;
    color: var(--color-text);
    text-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
    letter-spacing: -1.5px;
    animation: float 4s infinite ease-in-out;
  }

  .subtitle-text {
    font-size: clamp(0.9rem, 3.5vw, 1.05rem);
    font-weight: 600;
    opacity: 0.85;
    letter-spacing: -0.2px;
  }

  .mascot-wrapper {
    margin: 5px 0;
    display: flex;
    justify-content: center;
  }

  .highscore-badge {
    background: #ffffff;
    border: 3px solid var(--color-text);
    border-radius: 14px;
    padding: 6px 18px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.03);
  }
  .highscore-badge .label {
    opacity: 0.7;
    font-size: 0.85rem;
  }
  .highscore-badge .value {
    color: var(--color-accent);
    font-size: 1.1rem;
  }

  /* Difficulty Selector styles */
  .difficulty-section {
    width: 100%;
    background: #ffffff;
    border: 3px solid var(--color-text);
    border-radius: 18px;
    padding: 12px;
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.03);
    display: flex;
    flex-direction: column;
    gap: 8px;
    box-sizing: border-box;
  }
  .section-title {
    font-size: 0.9rem;
    font-weight: 800;
    color: var(--color-text);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 0;
  }
  .diff-tabs {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
  }
  .diff-tab-btn {
    font-family: inherit;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 14px;
    border-radius: 10px;
    border: 2px solid var(--color-border);
    background: var(--color-bg);
    color: var(--color-text);
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .diff-tab-btn:hover {
    background: var(--color-select);
    border-color: var(--color-text);
  }
  .diff-tab-btn.active {
    background: var(--color-select);
    border-color: var(--color-accent);
    border-width: 2.5px;
    transform: scale(1.01);
  }
  .diff-title {
    font-weight: 800;
    font-size: 0.95rem;
  }
  .diff-desc {
    font-size: 0.75rem;
    opacity: 0.85;
    font-weight: 600;
  }

  /* Button Styles */
  .button-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
  }

  .btn {
    font-family: inherit;
    font-size: 1.15rem;
    font-weight: 700;
    padding: 12px;
    border-radius: 14px;
    cursor: pointer;
    transition: transform 0.15s, box-shadow 0.15s, background-color 0.15s;
    border: 3px solid var(--color-text);
    box-shadow: 0 4px 0 var(--color-text);
    position: relative;
  }

  .btn:active {
    transform: translateY(3px);
    box-shadow: 0 1px 0 var(--color-text);
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

  /* Extreme small heights */
  @media (max-height: 700px) {
    .scene-container {
      gap: 12px;
      padding: 8px;
    }
    .logo-text {
      font-size: 1.8rem;
    }
    .mascot-wrapper {
      display: none; /* Hide mascot on main title ONLY for very short devices to fit difficulty selection */
    }
    .difficulty-section {
      padding: 8px;
    }
    .diff-tab-btn {
      padding: 6px 12px;
    }
  }
</style>
