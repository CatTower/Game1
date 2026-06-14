<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { appState } from '../lib/appStore.svelte';

  // Game state
  let isPlaying = $state(false);
  let isGameOver = $state(false);
  let score = $state(0);
  let containerWidth = $state(0);
  let containerHeight = $state(0);
  
  // Constrain play area for wide screens
  let playAreaWidth = $derived(Math.min(containerWidth, 450));
  let playAreaOffset = $derived((containerWidth - playAreaWidth) / 2);

  // Player state
  let targetX = $state(0);
  let playerX = $state(0);
  let playerY = $state(0);
  const playerW = 80;
  const playerH = 106;
  const headRadius = 20; // Forgiving hitbox

  // Poops state
  type Poop = { id: number; x: number; y: number; speed: number; size: number };
  let poops = $state<Poop[]>([]);
  let poopIdSeq = 0;

  // Difficulty
  let baseSpeed = 3;
  let spawnRate = 1000; // ms
  let lastSpawnTime = 0;
  let difficultyTimer = 0;
  let level = 1;

  let reqId: number;

  function initGame() {
    isPlaying = true;
    isGameOver = false;
    score = 0;
    poops = [];
    baseSpeed = 3;
    spawnRate = 1000;
    level = 1;
    
    // Set initial player pos
    playerY = containerHeight - 100; // 100px from bottom for control pad
    playerX = containerWidth / 2;
    targetX = playerX;
    
    lastSpawnTime = performance.now();
    difficultyTimer = performance.now();

    reqId = requestAnimationFrame(gameLoop);
  }

  function spawnPoop(now: number) {
    if (now - lastSpawnTime > spawnRate) {
      lastSpawnTime = now;
      
      let poopsToSpawn = 1;
      // 난이도 레벨이 오를수록 2개, 3개가 동시에 떨어질 확률 증가
      if (level >= 3 && Math.random() < 0.4) poopsToSpawn = 2;
      if (level >= 5 && Math.random() < 0.5) poopsToSpawn = 2;
      if (level >= 7 && Math.random() < 0.4) poopsToSpawn = 3;

      for (let i = 0; i < poopsToSpawn; i++) {
        const size = 45; // 똥 크기 고정
        const x = playAreaOffset + size / 2 + Math.random() * (playAreaWidth - size);
        // 속도에 약간의 랜덤성을 부여하여 동시에 떨어져도 겹치지 않는 느낌을 줌
        const speed = baseSpeed + Math.random() * 2.5;
        // 여러 개가 떨어질 때 Y 좌표에도 약간의 차이를 둠
        const yOffset = -size - (Math.random() * 40);
        poops.push({ id: poopIdSeq++, x, y: yOffset, speed, size });
      }
    }
  }

  function gameLoop(now: number) {
    if (!isPlaying) return;

    // 1. Difficulty increase every 5 seconds
    if (now - difficultyTimer > 5000) {
      difficultyTimer = now;
      baseSpeed += 0.5;
      spawnRate = Math.max(300, spawnRate - 100);
      level += 1;
    }

    // 2. Player Movement (Lerp)
    playerX += (targetX - playerX) * 0.2;
    // Bound to play area
    const minX = playAreaOffset + playerW / 2;
    const maxX = playAreaOffset + playAreaWidth - playerW / 2;
    if (playerX < minX) playerX = minX;
    if (playerX > maxX) playerX = maxX;

    // Head center for collision
    // Avatar is drawn from top-left (playerX - playerW/2, playerY - playerH)
    // Head center is roughly at top + 30 (scaled for 80x106)
    const headCX = playerX;
    const headCY = playerY - playerH + 30;

    // 3. Poops update & Collision
    spawnPoop(now);
    
    let toRemove = new Set<number>();
    for (let i = 0; i < poops.length; i++) {
      let p = poops[i];
      p.y += p.speed;

      // Check collision
      const poopRadius = p.size / 2 - 5; // forgiving hitbox
      const dist = Math.hypot(p.x - headCX, p.y - headCY);
      if (dist < headRadius + poopRadius) {
        gameOver();
        return;
      }

      // Check ground
      if (p.y > playerY) {
        toRemove.add(p.id);
        score += 1;
      }
    }

    if (toRemove.size > 0) {
      poops = poops.filter(p => !toRemove.has(p.id));
    }

    reqId = requestAnimationFrame(gameLoop);
  }

  function gameOver() {
    isPlaying = false;
    isGameOver = true;
    appState.updateDodgePoopStats(score);
    cancelAnimationFrame(reqId);
  }

  // Controls
  let isDragging = false;
  let dragOffsetX = 0;

  function onPointerDown(e: PointerEvent) {
    if (!isPlaying) return;
    isDragging = true;
    dragOffsetX = playerX - e.clientX;
  }

  function onPointerMove(e: PointerEvent) {
    if (!isDragging || !isPlaying) return;
    targetX = e.clientX + dragOffsetX;
  }

  function onPointerUp() {
    isDragging = false;
  }

  onMount(() => {
    // Wait for container to size
    setTimeout(() => {
      if (!isGameOver && !isPlaying) {
        playerY = containerHeight - 100;
        playerX = containerWidth / 2;
        targetX = playerX;
      }
    }, 100);
  });

  onDestroy(() => {
    if (reqId) cancelAnimationFrame(reqId);
  });
</script>

<div class="game-wrapper" bind:clientWidth={containerWidth} bind:clientHeight={containerHeight}>
  <!-- Background -->
  <div class="bg"></div>
  <div class="ground-platform" style="left: {playAreaOffset}px; width: {playAreaWidth}px;"></div>

  <!-- Score -->
  <div class="score-display">피한 개수: {score}</div>

  <!-- Game Canvas / Elements -->
  <div class="game-area">
    <!-- Player -->
    {#if appState.user?.avatarImage}
      <img 
        src={appState.user.avatarImage} 
        alt="Player" 
        class="player-avatar" 
        style="left: {playerX}px; top: {playerY}px; width: {playerW}px; height: {playerH}px;"
      />
    {/if}

    <!-- Poops -->
    {#each poops as p (p.id)}
      <div 
        class="poop" 
        style="left: {p.x}px; top: {p.y}px; width: {p.size}px; height: {p.size}px; font-size: {p.size * 0.8}px;"
      >
        💩
      </div>
    {/each}
  </div>

  <!-- Control Pad -->
  <div 
    class="control-pad" 
    onpointerdown={onPointerDown}
    onpointermove={onPointerMove}
    onpointerup={onPointerUp}
    onpointercancel={onPointerUp}
    onpointerleave={onPointerUp}
  >
    <div class="instruction" style="opacity: {isPlaying ? 0 : 1}">
      이곳을 터치하고 좌우로 드래그하세요
    </div>
  </div>

  <!-- UI Overlays -->
  {#if !isPlaying && !isGameOver}
    <div class="overlay">
      <div class="modal">
        <h2>똥 피하기</h2>
        <p>머리에 똥을 맞으면 게임 오버!</p>
        <button class="btn btn-primary" onclick={initGame}>게임 시작</button>
        <button class="btn btn-secondary" onclick={() => appState.currentScene = 'lobby'}>로비로 돌아가기</button>
      </div>
    </div>
  {/if}

  {#if isGameOver}
    <div class="overlay">
      <div class="modal result-modal">
        <h2>게임 오버!</h2>
        <div class="score-card">
          <div class="label">피한 개수</div>
          <div class="value">{score}</div>
          <div class="best">최고 기록: {appState.user?.stats.dodgePoopHighScore}</div>
        </div>
        <button class="btn btn-primary" onclick={initGame}>다시 하기</button>
        <button class="btn btn-secondary" onclick={() => appState.currentScene = 'lobby'}>로비로 돌아가기</button>
      </div>
    </div>
  {/if}
</div>

<style>
  .game-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: linear-gradient(180deg, #87CEEB 0%, #E0F6FF 100%);
    touch-action: none; /* Prevent scrolling during drag */
  }

  .bg {
    position: absolute;
    bottom: 0;
    width: 100%;
    height: 120px;
    background: #5c3a21; /* darker outside area */
  }

  .ground-platform {
    position: absolute;
    bottom: 0;
    height: 120px;
    background: #8B4513; /* ground */
    border-top: 10px solid #556B2F; /* grass */
    border-left: 2px solid #3e2615;
    border-right: 2px solid #3e2615;
    box-shadow: 0 0 20px rgba(0,0,0,0.5);
  }

  .score-display {
    position: absolute;
    top: 24px;
    left: 24px;
    font-size: 24px;
    font-weight: 900;
    color: #333;
    z-index: 10;
    text-shadow: 2px 2px 0px white;
  }

  .game-area {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none; /* Let clicks pass to control pad */
  }

  .player-avatar {
    position: absolute;
    transform: translate(-50%, -100%);
    object-fit: contain;
    filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
    will-change: left;
  }

  .poop {
    position: absolute;
    transform: translate(-50%, -50%);
    display: flex;
    justify-content: center;
    align-items: center;
    will-change: top;
  }

  .control-pad {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 40%;
    z-index: 20;
    display: flex;
    justify-content: center;
    align-items: flex-end;
    padding-bottom: 24px;
    cursor: grab;
  }

  .control-pad:active {
    cursor: grabbing;
  }

  .instruction {
    background: rgba(0,0,0,0.5);
    color: white;
    padding: 12px 24px;
    border-radius: 24px;
    font-weight: 700;
    pointer-events: none;
    transition: opacity 0.3s;
  }

  .overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 30;
    backdrop-filter: blur(5px);
  }

  .modal {
    background: white;
    padding: 32px;
    border-radius: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    text-align: center;
  }

  .modal h2 {
    margin: 0;
    font-size: 32px;
    font-weight: 900;
    color: #333;
  }

  .modal p {
    margin: 0;
    color: #666;
    font-weight: 600;
  }

  .score-card {
    background: #f8f9fa;
    border-radius: 16px;
    padding: 24px;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 8px;
    border: 3px solid #eee;
  }

  .score-card .label {
    font-size: 16px;
    font-weight: 700;
    color: #666;
  }

  .score-card .value {
    font-size: 48px;
    font-weight: 900;
    color: var(--color-primary);
    line-height: 1;
  }

  .score-card .best {
    font-size: 14px;
    font-weight: 700;
    color: var(--color-accent);
    margin-top: 8px;
  }

  .btn {
    width: 100%;
    padding: 16px;
    border-radius: 16px;
    font-size: 18px;
    font-weight: 800;
    border: none;
    cursor: pointer;
    transition: transform 0.2s;
  }

  .btn:active {
    transform: scale(0.95);
  }

  .btn-primary {
    background: var(--color-primary);
    color: white;
  }

  .btn-secondary {
    background: #eee;
    color: #333;
  }
</style>
