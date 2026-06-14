<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { appState } from '../lib/appStore.svelte';
  import { game } from '../lib/gameStore.svelte';

  // Game configuration
  const SPAWN_INTERVAL = 1500;
  
  // State
  let mode = $state<'select'|'playing'|'gameover'>('select');
  let lang = $state<'ko'|'en'>('ko');
  
  let blocks = $state<{id: number, word: string, hp: number, maxHp: number, x: number, y: number, z: number}[]>([]);
  let projectiles = $state<{id: number, targetId: number, x: number, y: number, z: number}[]>([]);
  let explosions = $state<{id: number, x: number, y: number, z: number, time: number}[]>([]);
  
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
    // Sea horizon effect: Ground level Y, wide X spread, far Z
    const x = (Math.random() - 0.5) * 1600; 
    const y = 150 + Math.random() * 100; // Fixed Y (below horizon). As it comes closer, it drops down.
    const z = -4000; // Far away
    
    blocks.push({
      id: blockIdCounter++,
      word,
      hp,
      maxHp: hp,
      x,
      y,
      z
    });
  }

  function triggerExplosion(x: number, y: number, z: number) {
    explosions.push({ id: explIdCounter++, x, y, z, time: performance.now() });
    
    // Shockwave damage (based on 3D distance)
    const radius = 600;
    for (let i = blocks.length - 1; i >= 0; i--) {
      const b = blocks[i];
      const dx = b.x - x;
      const dy = b.y - y;
      const dz = b.z - z;
      const dist = Math.hypot(dx, dy, dz);
      if (dist < radius) {
        b.hp -= 1;
        if (b.hp <= 0) {
          score += b.maxHp * 10;
          blocks.splice(i, 1);
        }
      }
    }
  }

  function gameLoop(timestamp: number) {
    const dt = (timestamp - lastFrameTime) / 1000;
    lastFrameTime = timestamp;

    // Update blocks (moving towards camera, increasing Z)
    for (let i = blocks.length - 1; i >= 0; i--) {
      const approachSpeed = 1200 / Math.max(1, blocks[i].word.length);
      blocks[i].z += approachSpeed * dt;
      
      if (blocks[i].z > 600) { // Hit screen/camera
        lives -= blocks[i].word.length;
        blocks.splice(i, 1);
        if (lives <= 0) {
          lives = 0;
          gameOver();
          return;
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
      const dz = target.z - p.z;
      const dist = Math.hypot(dx, dy, dz);
      
      if (dist < 200) { // Collision threshold
        target.hp = 0;
        triggerExplosion(target.x, target.y, target.z);
        score += target.maxHp * 10;
        blocks = blocks.filter(b => b.id !== target.id);
        projectiles.splice(i, 1);
      } else {
        const speed = 4000 * dt;
        p.x += (dx / dist) * speed;
        p.y += (dy / dist) * speed;
        p.z += (dz / dist) * speed;
      }
    }

    explosions = explosions.filter(e => timestamp - e.time < 500);

    animationFrameId = requestAnimationFrame(gameLoop);
  }

  function submitWord() {
    const input = userInput.trim().toLowerCase();
    if (!input) return;

    const targetIdx = blocks.findIndex(b => b.word.toLowerCase() === input);

    if (targetIdx !== -1) {
      const target = blocks[targetIdx];
      // Fire projectile from player position (camera)
      projectiles.push({
        id: projIdCounter++,
        targetId: target.id,
        x: 0,
        y: 200, // Bottom of view
        z: 400 // Slightly in front of camera
      });
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

  <!-- Game Area Fixed Size for Keyboard Safety -->
  <div class="game-area">
    {#if mode === 'select'}
      <div class="select-modal">
        <h2>워디팡 3D (Drop)</h2>
        <p>멀리서 다가오는 글자를 키보드로 타이핑해서 파괴하세요!</p>
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
      <div class="field">
        {#each blocks as b (b.id)}
          <!-- 3D Transform -->
          <div class="block" style="transform: translate3d(calc(-50% + {b.x}px), calc(-50% + {b.y}px), {b.z}px); opacity: {Math.min(1, (b.z + 4000) / 2000)};">
            <div class="hp-bar">
              <div class="hp-fill" style="width: {(b.hp / b.maxHp) * 100}%"></div>
            </div>
            <span class="word">{b.word}</span>
          </div>
        {/each}

        {#each projectiles as p (p.id)}
          <div class="projectile" style="transform: translate3d(calc(-50% + {p.x}px), calc(-50% + {p.y}px), {p.z}px);"></div>
        {/each}

        {#each explosions as e (e.id)}
          <div class="explosion" style="transform: translate3d(calc(-50% + {e.x}px), calc(-50% + {e.y}px), {e.z}px);"></div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Input Area ALWAYS at the bottom -->
  {#if mode === 'playing'}
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
    background: rgba(0,0,0,0.5);
    color: white;
    z-index: 10;
  }

  .exit-btn {
    background: #ef4444;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
  }

  .stats {
    display: flex;
    gap: 16px;
    font-size: 18px;
    font-weight: bold;
  }

  /* Fixed 50vh height ensures keyboard popping up doesn't crush the 3D game area */
  .game-area {
    width: 100%;
    height: 55vh; /* Key fixed height */
    min-height: 300px;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-shrink: 0;
    overflow: hidden;
  }

  .select-modal {
    background: rgba(255,255,255,0.1);
    backdrop-filter: blur(10px);
    padding: 32px;
    border-radius: 24px;
    color: white;
    text-align: center;
    border: 1px solid rgba(255,255,255,0.2);
    z-index: 20;
  }

  .select-modal h2 {
    margin: 0 0 16px 0;
    font-size: 32px;
  }

  .lang-btns {
    display: flex;
    gap: 16px;
    margin-top: 24px;
    justify-content: center;
  }

  .lang-btns button, .select-modal > button {
    padding: 12px 24px;
    border-radius: 12px;
    border: none;
    background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
    color: #333;
    font-weight: bold;
    font-size: 18px;
    cursor: pointer;
    transition: transform 0.2s;
  }
  .lang-btns button:active { transform: scale(0.95); }

  /* 3D Field setup */
  .field {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    perspective: 800px;
    transform-style: preserve-3d;
    overflow: hidden;
  }

  /* Blocks inside 3D space */
  .block {
    position: absolute;
    left: 50%;
    top: 50%;
    background: rgba(30, 41, 59, 0.9);
    border: 2px solid #38bdf8;
    border-radius: 12px;
    padding: 12px 24px;
    color: white;
    font-size: 32px;
    font-weight: bold;
    box-shadow: 0 0 20px rgba(56, 189, 248, 0.5);
    text-align: center;
    /* transition: transform is NOT used because we update every frame */
  }

  .hp-bar {
    position: absolute;
    top: -10px;
    left: 10%;
    width: 80%;
    height: 6px;
    background: rgba(255,255,255,0.2);
    border-radius: 3px;
    overflow: hidden;
  }

  .hp-fill {
    height: 100%;
    background: #10b981;
    transition: width 0.1s;
  }

  .projectile {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 20px;
    height: 20px;
    background: #f59e0b;
    border-radius: 50%;
    box-shadow: 0 0 20px #f59e0b;
  }

  .explosion {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 100px;
    height: 100px;
    background: radial-gradient(circle, rgba(239,68,68,1) 0%, rgba(239,68,68,0) 70%);
    border-radius: 50%;
    animation: explodeAnim 0.5s ease-out forwards;
  }

  @keyframes explodeAnim {
    0% { transform: translate3d(-50%, -50%, 0) scale(0.5); opacity: 1; }
    100% { transform: translate3d(-50%, -50%, 0) scale(2); opacity: 0; }
  }

  /* Input bar flexes to fill bottom space */
  .input-bar {
    flex: 1;
    background: rgba(255,255,255,0.05);
    padding: 16px;
    display: flex;
    justify-content: center;
    align-items: flex-start;
  }

  .input-bar form {
    display: flex;
    gap: 12px;
    width: 100%;
    max-width: 600px;
  }

  .input-bar input {
    flex: 1;
    padding: 16px 24px;
    font-size: 24px;
    border-radius: 16px;
    border: 2px solid rgba(255,255,255,0.2);
    background: rgba(255,255,255,0.1);
    color: white;
    outline: none;
    text-align: center;
  }

  .input-bar input:focus {
    border-color: #38bdf8;
    box-shadow: 0 0 15px rgba(56, 189, 248, 0.3);
  }

  .input-bar button {
    padding: 0 32px;
    border-radius: 16px;
    border: none;
    background: #38bdf8;
    color: white;
    font-size: 20px;
    font-weight: bold;
    cursor: pointer;
  }
  .input-bar button:active {
    transform: scale(0.95);
  }
</style>
