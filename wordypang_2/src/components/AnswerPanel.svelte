<script lang="ts">
  import { game } from '../lib/gameStore.svelte';
  import Mascot from './Mascot.svelte';

  // Derived calculations for the hint revealing gauge
  let elapsed = $derived(Math.max(0, game.playTime - game.quizBeginTime));
  let totalHintTime = $derived(game.currentWord.length * 5); // 5 seconds per letter
  let hintRatio = $derived(totalHintTime > 0 ? Math.min(1, elapsed / totalHintTime) : 0);

  // Number of hint letters currently revealed
  let isCorrectEffectRunning = $derived(game.isCorrectEffectRunning);

  // Auto-trigger timeover when hint expires
  $effect(() => {
    if (elapsed >= totalHintTime + 1.0 && !game.isTimeOverProcessing && game.currentScene === 'main' && !game.isCorrectEffectRunning) {
      game.triggerQuizTimeout();
    }
  });
</script>

<div class="answer-container">
  <!-- Top: Question Cloud & Mascot -->
  <div class="character-dialog">
    <!-- Korean Question Cloud -->
    <div class="question-cloud animate-float">
      <svg class="cloud-tail" viewBox="0 0 20 16" preserveAspectRatio="none">
        <polygon points="0,0 10,16 20,0" fill="var(--color-text)" />
        <polygon points="3.5,0 10,11.5 16.5,0" fill="var(--color-surface)" />
      </svg>
      <div class="question-text">{game.currentMeaning || '대기 중...'}</div>
    </div>
    
    <div class="mascot-wrapper">
      <Mascot />
    </div>
  </div>

  <!-- English Word Hint Panel -->
  <div class="word-panel">
    <!-- Masked Letters Container -->
    <div class="mask-container">
      <div class="letters-row">
        {#each game.currentWord.split('') as char, i}
          <div class="letter-box {isCorrectEffectRunning ? 'revealed' : ''}">
            <span class="char">{char}</span>
          </div>
        {/each}
      </div>
      <!-- Masking layer that shrinks to the right -->
      {#if !isCorrectEffectRunning}
        <div class="masking-layer" style="width: {100 - (hintRatio * 100)}%">
          <div class="letters-row masking-row">
            {#each game.currentWord.split('') as char, i}
              <div class="letter-box masked">
                <span class="char">*</span>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .answer-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    width: 100%;
    max-width: 480px;
  }

  .character-dialog {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
    padding-left: 20px;
  }

  .mascot-wrapper {
    margin-left: 8px;
    margin-top: 12px;
  }

  /* Question Cloud */
  .question-cloud {
    background: var(--color-surface);
    border: 3.5px solid var(--color-text);
    border-radius: 24px;
    padding: 16px 28px;
    position: relative;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
    z-index: 2;
  }
  .question-text {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-text);
    letter-spacing: -0.5px;
    text-align: center;
  }
  .cloud-tail {
    position: absolute;
    bottom: -16px;
    left: 28px;
    width: 22px;
    height: 17px;
    z-index: 3;
  }

  /* Word Panel */
  .word-panel {
    background: var(--color-surface);
    border: 3.5px solid var(--color-text);
    border-radius: 20px;
    padding: 20px;
    width: 100%;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.04);
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* Letter boxes */
  .letters-row {
    display: flex;
    justify-content: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .letter-box {
    width: 42px;
    height: 48px;
    border: 2.5px solid var(--color-border);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-bg);
    transition: background-color 0.3s, border-color 0.3s, transform 0.2s;
  }
  .letter-box.revealed {
    background: var(--color-select);
    border-color: var(--color-accent);
    transform: scale(1.05);
  }
  .char {
    font-size: 1.3rem;
    font-weight: 700;
    color: var(--color-text);
  }

  /* Mask Container for Hint Revealing */
  .mask-container {
    position: relative;
    display: inline-flex;
    align-self: center;
    border-radius: 8px;
  }

  .masking-layer {
    position: absolute;
    top: 0;
    right: 0;
    height: 100%;
    overflow: hidden;
    transition: width 0.1s linear;
    z-index: 5;
    opacity: 1; /* completely hide background */
  }

  .masking-row {
    position: absolute;
    top: 0;
    right: 0;
    flex-wrap: nowrap;
    width: max-content;
  }

  .letter-box.masked {
    background: var(--color-accent);
    border-color: var(--color-accent);
    flex-shrink: 0;
  }

  .letter-box.masked .char {
    color: white;
  }


</style>
