<script lang="ts">
  import { game, type WordData } from '../lib/gameStore.svelte';

  let currentAlphabetIdx = $state(0);
  const alphabets = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)); // A-Z

  let currentLetter = $derived(alphabets[currentAlphabetIdx]);

  // Filter words that start with the selected letter AND have been answered at least once
  let filteredWords = $derived(
    game.words.filter(w => w.word.startsWith(currentLetter) && w.answerCount >= 1)
  );

  // Stats: correct words / total words
  let solvedCount = $derived(game.words.filter(w => w.answerCount >= 1).length);
  let totalCount = $derived(game.words.length);

  function prevAlphabet() {
    currentAlphabetIdx = (currentAlphabetIdx - 1 + 26) % 26;
  }

  function nextAlphabet() {
    currentAlphabetIdx = (currentAlphabetIdx + 1) % 26;
  }

  // Native Web Speech Synthesis (TTS)
  function speak(text: string) {
    if ('speechSynthesis' in window) {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      
      const voices = window.speechSynthesis.getVoices();
      const enVoice = voices.find(v => v.lang.startsWith('en-US') || v.lang.startsWith('en'));
      if (enVoice) {
        utterance.voice = enVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn('Speech synthesis not supported in this browser.');
    }
  }
</script>

<div class="scene-container">
  <header class="header">
    <h1 class="title">내 단어장</h1>
    <div class="stat-badge">
      학습 완료: {solvedCount} / {totalCount}
    </div>
  </header>

  <!-- Alphabet Selector -->
  <div class="alphabet-selector">
    <button class="selector-btn" onclick={prevAlphabet}>◀</button>
    <div class="alphabet-display">
      <span class="alphabet-shadow">{currentLetter}</span>
      <span class="alphabet-main">{currentLetter}</span>
    </div>
    <button class="selector-btn" onclick={nextAlphabet}>▶</button>
  </div>

  <!-- Words List Scroll -->
  <div class="words-list-container">
    {#if filteredWords.length > 0}
      <div class="words-list">
        {#each filteredWords as item}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div class="word-card" onclick={() => speak(item.word)}>
            <div class="word-info">
              <span class="english">{item.word}</span>
              <span class="meaning">{item.meaning}</span>
            </div>
            <div class="word-meta">
              <span class="badge">Lv.{item.level === 'elementary' ? '초등' : item.level === 'middle' ? '중등' : '고등'}</span>
              <span class="count">정답: {item.answerCount}회</span>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="empty-state">
        <p>'{currentLetter}'로 시작하는 맞춘 단어가 아직 없습니다.</p>
        <p class="hint">게임을 플레이해 단어장을 채워보세요!</p>
      </div>
    {/if}
  </div>

  <!-- Home Button -->
  <button class="btn btn-secondary" onclick={() => game.currentScene = 'title'}>
    돌아가기
  </button>
</div>

<style>
  .scene-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    width: 100%;
    max-width: 480px;
    height: 100%;
    padding: 24px;
  }

  .header {
    display: flex;
    width: 100%;
    justify-content: space-between;
    align-items: center;
  }
  .title {
    font-size: 1.8rem;
    font-weight: 800;
    color: var(--color-text);
  }
  .stat-badge {
    background: #ffffff;
    border: 2.5px solid var(--color-text);
    border-radius: 10px;
    padding: 4px 12px;
    font-weight: 700;
    font-size: 0.85rem;
  }

  /* Alphabet Selector */
  .alphabet-selector {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    background: #ffffff;
    border: 3.5px solid var(--color-text);
    border-radius: 20px;
    padding: 10px 20px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.02);
  }
  .selector-btn {
    font-size: 1.5rem;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--color-text);
    transition: transform 0.1s;
  }
  .selector-btn:active {
    transform: scale(0.9);
  }
  .alphabet-display {
    position: relative;
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .alphabet-main {
    font-size: 2.5rem;
    font-weight: 900;
    color: var(--color-text);
    z-index: 1;
  }
  .alphabet-shadow {
    position: absolute;
    font-size: 2.5rem;
    font-weight: 900;
    color: var(--color-select);
    transform: translate(2px, 2px);
    z-index: 0;
  }

  /* Words List Container */
  .words-list-container {
    flex-grow: 1;
    width: 100%;
    height: 320px; /* fixed height for scroll area */
    background: #ffffff;
    border: 3.5px solid var(--color-text);
    border-radius: 20px;
    overflow-y: auto;
    padding: 12px;
    box-shadow: inset 0 2px 8px rgba(0,0,0,0.03);
  }

  .words-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .word-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border: 2px solid var(--color-border);
    border-radius: 12px;
    cursor: pointer;
    background: var(--color-bg);
    transition: transform 0.15s, background-color 0.15s;
  }
  .word-card:hover {
    transform: translateY(-2px);
    background: var(--color-select);
  }
  .word-card:active {
    transform: translateY(0);
  }

  .word-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }
  .word-info .english {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--color-text);
    letter-spacing: 0.5px;
  }
  .word-info .meaning {
    font-size: 0.9rem;
    font-weight: 500;
    opacity: 0.75;
  }

  .word-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
    font-size: 0.75rem;
    font-weight: 700;
  }
  .word-meta .badge {
    background: var(--color-accent);
    color: var(--color-bg);
    padding: 2px 6px;
    border-radius: 4px;
  }
  .word-meta .count {
    opacity: 0.6;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 8px;
    color: var(--color-text);
    opacity: 0.6;
    font-weight: 600;
    font-size: 0.95rem;
    text-align: center;
    padding: 20px;
  }
  .empty-state .hint {
    font-size: 0.8rem;
    font-weight: 500;
  }

  /* Back Button */
  .btn {
    font-family: inherit;
    font-size: 1.15rem;
    font-weight: 700;
    padding: 12px;
    border-radius: 16px;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    border: 3.5px solid var(--color-text);
    box-shadow: 0 5px 0 var(--color-text);
    width: 100%;
  }
  .btn:active {
    transform: translateY(3px);
    box-shadow: 0 2px 0 var(--color-text);
  }
  .btn-secondary {
    background: #ffffff;
    color: var(--color-text);
  }
  .btn-secondary:hover {
    background: var(--color-bg);
  }
</style>
