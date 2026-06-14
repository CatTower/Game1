<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { appState } from '../lib/appStore.svelte';
  import { game } from '../lib/gameStore.svelte';

  // Game configuration
  const SPAWN_INTERVAL = 1500;

  let containerWidth = $state(0);
  let containerHeight = $state(0);
  
  // State
  let mode = $state<'select'|'playing'|'gameover'>('select');
  let lang = $state<'ko'|'en'>('ko');
  
  let blocks = $state<{id: number, word: string, hp: number, maxHp: number, x: number, y: number}[]>([]);
  let projectiles = $state<{id: number, targetId: number, x: number, y: number}[]>([]);
  let explosions = $state<{id: number, x: number, y: number, time: number}[]>([]);
  
  let score = $state(0);
  let lives = $state(10);
  let userInput = $state('');

  let koreanDict: string[] = [];
  let blockIdCounter = 0;
  let projIdCounter = 0;
  let explIdCounter = 0;

  let lastFrameTime = 0;
  let animationFrameId: number;
  let spawnIntervalId: number;

  onMount(async () => {
    try {
      const res = await fetch('/data/korean_words.json');
      koreanDict = await res.json();
    } catch (e) {
      koreanDict = ['사과', '과일', '지구', '기차', '나비', '바다', '개미', '사진'];
    }
  });

  onDestroy(() => {
    stopGame();
  });

  function getRandomWord() {
    if (lang === 'ko') {
      return koreanDict[Math.floor(Math.random() * koreanDict.length)];
    } else {
      if (game.words.length > 0) {
        return game.words[Math.floor(Math.random() * game.words.length)].word;
      }
      return ['APPLE', 'BANANA', 'CAR', 'DOG', 'ELEPHANT'][Math.floor(Math.random() * 5)];
    }
  }

  function startGame(selectedLang: 'ko'|'en') {
    lang = selectedLang;
    mode = 'playing';
    score = 0;
    lives = 10;
    blocks = [];
    projectiles = [];
    explosions = [];
    userInput = '';

    lastFrameTime = performance.now();
    animationFrameId = requestAnimationFrame(gameLoop);
    spawnIntervalId = window.setInterval(spawnBlock, SPAWN_INTERVAL);
  }

  function stopGame() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    if (spawnIntervalId) clearInterval(spawnIntervalId);
  }

  function gameOver() {
    mode = 'gameover';
    stopGame();
    if (appState.user) {
      if (score > (appState.user.stats.wordyPangDropHighScore || 0)) {
        appState.user.stats.wordyPangDropHighScore = score;
      }
    }
  }

  function spawnBlock() {
    const word = getRandomWord();
    const hp = word.length;
    // Keep it within screen bounds
    const padding = 60;
    const x = padding + Math.random() * (containerWidth - padding * 2);
    
    blocks.push({
      id: blockIdCounter++,
      word,
      hp,
      maxHp: hp,
      x,
      y: -50
    });
  }

  function triggerExplosion(x: number, y: number) {
    explosions.push({ id: explIdCounter++, x, y, time: performance.now() });
    
    // Shockwave damage
    const radius = 100;
    for (let i = blocks.length - 1; i >= 0; i--) {
      const b = blocks[i];
      const dx = b.x - x;
      const dy = b.y - y;
      const dist = Math.hypot(dx, dy);
      if (dist < radius) {
        b.hp -= 1;
        if (b.hp <= 0) {
          score += b.maxHp * 10;
          blocks.splice(i, 1);
          // Recursive explosion for combo? Not now as per spec
        }
      }
    }
  }

  function gameLoop(timestamp: number) {
    const dt = (timestamp - lastFrameTime) / 1000;
    lastFrameTime = timestamp;

    // Update blocks
    for (let i = blocks.length - 1; i >= 0; i--) {
      // Shorter word = falls faster. E.g. base 80, length 2 = 80, length 6 = 26
      const fallSpeed = 160 / Math.max(1, blocks[i].word.length);
      blocks[i].y += fallSpeed * dt;
      
      if (blocks[i].y > containerHeight - 80) { // Hit bottom
        lives -= blocks[i].word.length;
        blocks.splice(i, 1);
        if (lives <= 0) {
          lives = 0;
          gameOver();
          return; // Stop processing
        }
      }
    }

    // Update projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];
      const target = blocks.find(b => b.id === p.targetId);
      
      if (!target) {
        projectiles.splice(i, 1);
        continue;
      }

      const dx = target.x - p.x;
      const dy = target.y - p.y;
      const dist = Math.hypot(dx, dy);
      
      if (dist < 10) {
        // Hit
        target.hp = 0; // Instant kill on direct hit
        triggerExplosion(target.x, target.y);
        score += target.maxHp * 10;
        blocks = blocks.filter(b => b.id !== target.id);
        projectiles.splice(i, 1);
      } else {
        const speed = 500 * dt;
        p.x += (dx / dist) * speed;
        p.y += (dy / dist) * speed;
      }
    }

    // Cleanup explosions
    explosions = explosions.filter(e => timestamp - e.time < 500);

    animationFrameId = requestAnimationFrame(gameLoop);
  }

  function submitWord() {
    const input = userInput.trim().toLowerCase();
    if (!input) return;

    // Find block matching input
    // To support both Korean (exact) and English (case-insensitive)
    const targetIdx = blocks.findIndex(b => b.word.toLowerCase() === input);

    if (targetIdx !== -1) {
      const target = blocks[targetIdx];
      // Fire projectile from bottom center
      projectiles.push({
        id: projIdCounter++,
        targetId: target.id,
        x: containerWidth / 2,
        y: containerHeight - 50
      });
      // Optionally remove word from target so it can't be typed again
      // but it will be destroyed on hit. Just let it be for now.
    }

    userInput = '';
  }

  function exitGame() {
    stopGame();
    appState.currentScene = 'lobby';
  }

  function focusInput(node: HTMLInputElement) {
    if (mode === 'playing') {
      node.focus();
    }
  }
</script>

<div class="wordypang-drop-scene">
  <div class="header">
    <button class="exit-btn" onclick={exitGame}>나가기</button>
    {#if mode === 'playing' || mode === 'gameover'}
      <div class="stats">
        <span class="score">점수: {score}</span>
        <span class="lives">생명력: {'❤️'.repeat(lives)}</span>
      </div>
    {/if}
  </div>

  <div class="game-area" bind:clientWidth={containerWidth} bind:clientHeight={containerHeight}>
    {#if mode === 'select'}
      <div class="select-modal">
        <h2>워디팡 드롭</h2>
        <p>글자 블럭이 바닥에 닿기 전에 타이핑해서 파괴하세요!</p>
        <p>파괴 시 주변 글자에 충격파(데미지 1)를 줍니다.</p>
        <div class="lang-btns">
          <button onclick={() => startGame('ko')}>한글 모드</button>
          <button onclick={() => startGame('en')}>영어 모드</button>
        </div>
      </div>
    {:else if mode === 'gameover'}
      <div class="select-modal">
        <h2>게임 오버!</h2>
        <p>최종 점수: {score}</p>
        <button onclick={() => mode = 'select'}>다시하기</button>
      </div>
    {:else}
      <!-- Playing field -->
      <div class="field">
        <!-- Blocks -->
        {#each blocks as b (b.id)}
          <div class="block" style="left: {b.x}px; top: {b.y}px;">
            <div class="hp-bar">
              <div class="hp-fill" style="width: {(b.hp / b.maxHp) * 100}%"></div>
            </div>
            <span class="word">{b.word}</span>
          </div>
        {/each}

        <!-- Projectiles -->
        {#each projectiles as p (p.id)}
          <div class="projectile" style="left: {p.x}px; top: {p.y}px;"></div>
        {/each}

        <!-- Explosions -->
        {#each explosions as e (e.id)}
          <div class="explosion" style="left: {e.x}px; top: {e.y}px;"></div>
        {/each}
      </div>

      <!-- Input Bar at the bottom -->
      <div class="input-bar">
        <form onsubmit={(e) => { e.preventDefault(); submitWord(); }}>
          <input 
            type="text" 
            bind:value={userInput} 
            placeholder="단어를 입력하세요"
            use:focusInput
            autocomplete="off"
            spellcheck="false"
          />
          <button type="submit">발사</button>
        </form>
      </div>
    {/if}
  </div>
</div>

<style>
  .wordypang-drop-scene {
    width: 100%;
    height: 100%;
    background: #0f172a;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background: rgba(15, 23, 42, 0.8);
    backdrop-filter: blur(5px);
    z-index: 10;
  }

  .exit-btn {
    padding: 8px 16px;
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 700;
    cursor: pointer;
  }

  .stats {
    display: flex;
    gap: 16px;
    color: white;
    font-weight: 800;
    font-size: 18px;
  }

  .game-area {
    flex: 1;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
  }

  .select-modal {
    background: white;
    padding: 32px;
    border-radius: 24px;
    text-align: center;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    z-index: 20;
  }

  .select-modal h2 {
    margin: 0 0 16px 0;
    color: var(--color-text);
  }

  .select-modal p {
    color: #666;
    font-weight: 600;
    margin-bottom: 24px;
  }

  .lang-btns {
    display: flex;
    gap: 16px;
    justify-content: center;
  }

  .lang-btns button {
    padding: 12px 24px;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 12px;
    font-weight: 800;
    font-size: 16px;
    cursor: pointer;
    transition: transform 0.2s;
  }

  .lang-btns button:active {
    transform: scale(0.95);
  }

  .select-modal > button {
    padding: 12px 32px;
    background: var(--color-accent);
    color: white;
    border: none;
    border-radius: 12px;
    font-weight: 800;
    font-size: 16px;
    cursor: pointer;
  }

  .field {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
  }

  .block {
    position: absolute;
    transform: translate(-50%, -50%);
    background: rgba(255, 255, 255, 0.95);
    padding: 4px 10px;
    border-radius: 8px;
    border: 2px solid #38bdf8;
    box-shadow: 0 4px 8px rgba(56, 189, 248, 0.3);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .hp-bar {
    width: 100%;
    height: 6px;
    background: #e2e8f0;
    border-radius: 3px;
    overflow: hidden;
  }

  .hp-fill {
    height: 100%;
    background: #ef4444;
    transition: width 0.2s;
  }

  .word {
    font-weight: 800;
    color: #0f172a;
    font-size: 15px;
  }

  .projectile {
    position: absolute;
    width: 12px;
    height: 12px;
    background: #fde047;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 0 0 10px #fde047;
  }

  .explosion {
    position: absolute;
    width: 200px; /* Radius 100 * 2 */
    height: 200px;
    border-radius: 50%;
    border: 4px solid #38bdf8;
    transform: translate(-50%, -50%);
    animation: explode 0.5s ease-out forwards;
    pointer-events: none;
  }

  @keyframes explode {
    0% { transform: translate(-50%, -50%) scale(0); opacity: 1; border-width: 20px; }
    100% { transform: translate(-50%, -50%) scale(1); opacity: 0; border-width: 0px; }
  }

  .input-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    box-sizing: border-box;
    padding: 12px;
    background: #1e293b;
    border-top: 2px solid #334155;
    z-index: 10;
  }

  .input-bar form {
    display: flex;
    gap: 12px;
    max-width: 600px;
    margin: 0 auto;
  }

  .input-bar input {
    flex: 1;
    min-width: 0; /* allows input to shrink on flex */
    padding: 12px;
    border-radius: 8px;
    border: none;
    font-size: 16px;
    font-weight: 800;
    outline: none;
  }

  .input-bar input:focus {
    box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.5);
  }

  .input-bar button {
    padding: 0 16px;
    border-radius: 8px;
    background: #38bdf8;
    color: white;
    border: none;
    font-size: 16px;
    font-weight: 800;
    white-space: nowrap;
    cursor: pointer;
  }
  .input-bar button:active {
    transform: scale(0.95);
  }
</style>
