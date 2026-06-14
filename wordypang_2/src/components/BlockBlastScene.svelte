<script lang="ts">
  import { onMount } from 'svelte';
  import { appState } from '../lib/appStore.svelte';

  const GRID_SIZE = 8;
  // Cell stores color string, empty string means empty
  let board = $state<string[][]>(Array(GRID_SIZE).fill('').map(() => Array(GRID_SIZE).fill('')));
  
  type BlockShape = {
    shape: number[][]; // 2D array of 1s and 0s
    color: string;
  };

  const SHAPES: BlockShape[] = [
    { shape: [[1]], color: '#ef4444' }, // 1x1
    { shape: [[1,1],[1,1]], color: '#f97316' }, // 2x2
    { shape: [[1,1,1],[1,1,1],[1,1,1]], color: '#f59e0b' }, // 3x3
    { shape: [[1,1]], color: '#84cc16' }, // 2x1
    { shape: [[1],[1]], color: '#84cc16' }, // 1x2
    { shape: [[1,1,1]], color: '#10b981' }, // 3x1
    { shape: [[1],[1],[1]], color: '#10b981' }, // 1x3
    { shape: [[1,1,1,1]], color: '#06b6d4' }, // 4x1
    { shape: [[1],[1],[1],[1]], color: '#06b6d4' }, // 1x4
    { shape: [[1,1,1,1,1]], color: '#3b82f6' }, // 5x1
    { shape: [[1],[1],[1],[1],[1]], color: '#3b82f6' }, // 1x5
    { shape: [[1,0],[1,1]], color: '#8b5cf6' }, // 2x2 L
    { shape: [[0,1],[1,1]], color: '#8b5cf6' }, // 2x2 L
    { shape: [[1,1],[1,0]], color: '#8b5cf6' }, // 2x2 L
    { shape: [[1,1],[0,1]], color: '#8b5cf6' }, // 2x2 L
    { shape: [[1,0,0],[1,0,0],[1,1,1]], color: '#d946ef' }, // 3x3 L
    { shape: [[0,0,1],[0,0,1],[1,1,1]], color: '#d946ef' }, // 3x3 L
    { shape: [[1,1,1],[1,0,0],[1,0,0]], color: '#d946ef' }, // 3x3 L
    { shape: [[1,1,1],[0,0,1],[0,0,1]], color: '#d946ef' }, // 3x3 L
  ];

  let selectableBlocks = $state<(BlockShape | null)[]>([null, null]);
  let nextPreviewBlock = $state<BlockShape | null>(null);
  
  let score = $state(0);
  let comboMsg = $state('');
  let gameOver = $state(false);

  // Drag state
  let draggingIndex = $state<number | null>(null);
  let dragPos = $state({ x: 0, y: 0 });
  let gridElement: HTMLElement;

  function getRandomShape(): BlockShape {
    return SHAPES[Math.floor(Math.random() * SHAPES.length)];
  }

  onMount(() => {
    initGame();
  });

  function initGame() {
    board = Array(GRID_SIZE).fill('').map(() => Array(GRID_SIZE).fill(''));
    score = 0;
    gameOver = false;
    comboMsg = '';
    
    selectableBlocks = [getRandomShape(), getRandomShape()];
    nextPreviewBlock = getRandomShape();
    
    checkGameOver();
  }

  function handlePointerDown(e: PointerEvent, index: number) {
    if (gameOver || !selectableBlocks[index]) return;
    
    // Prevent default scrolling on touch
    if (e.pointerType === 'touch') {
      (e.target as Element)?.releasePointerCapture(e.pointerId); // Allows window to handle events
    }
    
    draggingIndex = index;
    // Offset the drag pos so the finger is near the bottom of the shape to not obscure it
    dragPos = { x: e.clientX, y: e.clientY - 60 };
  }

  function handlePointerMove(e: PointerEvent) {
    if (draggingIndex === null) return;
    // Offset so finger doesn't hide the block
    dragPos = { x: e.clientX, y: e.clientY - 60 };
  }

  function handlePointerUp(e: PointerEvent) {
    if (draggingIndex === null) return;
    
    // Find if we dropped over a valid grid cell
    if (gridElement) {
      const rect = gridElement.getBoundingClientRect();
      const cellWidth = rect.width / GRID_SIZE;
      const cellHeight = rect.height / GRID_SIZE;

      // Check if dragPos (center of dragged shape) is within grid
      // Actually we should check relative to the top-left of the shape to match placement
      // Assuming dragPos is the center of the first block of the shape approximately.
      
      const relativeX = dragPos.x - rect.left;
      const relativeY = dragPos.y - rect.top;

      if (relativeX >= 0 && relativeX < rect.width && relativeY >= 0 && relativeY < rect.height) {
        const c = Math.floor(relativeX / cellWidth);
        const r = Math.floor(relativeY / cellHeight);

        placeBlock(r, c, draggingIndex);
      }
    }

    draggingIndex = null;
  }

  function canPlace(shape: number[][], startR: number, startC: number): boolean {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] === 1) {
          const boardR = startR + r;
          const boardC = startC + c;
          if (boardR >= GRID_SIZE || boardC >= GRID_SIZE) return false;
          if (board[boardR][boardC] !== '') return false;
        }
      }
    }
    return true;
  }

  function placeBlock(r: number, c: number, index: number) {
    if (gameOver) return;
    
    const block = selectableBlocks[index];
    if (!block) return;

    if (!canPlace(block.shape, r, c)) {
      // Cannot place
      return;
    }

    // Place it
    for (let br = 0; br < block.shape.length; br++) {
      for (let bc = 0; bc < block.shape[br].length; bc++) {
        if (block.shape[br][bc] === 1) {
          board[r + br][c + bc] = block.color;
        }
      }
    }

    // Score for placement
    let blocksPlaced = block.shape.flat().reduce((a, b) => a + b, 0);
    score += blocksPlaced * 2;

    // Check lines
    checkLines();

    // Consume block
    selectableBlocks[index] = nextPreviewBlock;
    nextPreviewBlock = getRandomShape();

    checkGameOver();
  }

  function checkLines() {
    let rowsToClear: number[] = [];
    let colsToClear: number[] = [];

    // Check rows
    for (let r = 0; r < GRID_SIZE; r++) {
      let full = true;
      for (let c = 0; c < GRID_SIZE; c++) {
        if (board[r][c] === '') { full = false; break; }
      }
      if (full) rowsToClear.push(r);
    }

    // Check cols
    for (let c = 0; c < GRID_SIZE; c++) {
      let full = true;
      for (let r = 0; r < GRID_SIZE; r++) {
        if (board[r][c] === '') { full = false; break; }
      }
      if (full) colsToClear.push(c);
    }

    const linesCleared = rowsToClear.length + colsToClear.length;
    if (linesCleared > 0) {
      // Bonus score: non-linear scaling for multiple lines
      const lineScore = linesCleared * linesCleared * 10;
      score += lineScore;
      
      comboMsg = linesCleared >= 3 ? 'SUPER COMBO!' : (linesCleared === 2 ? 'DOUBLE!' : '');
      setTimeout(() => comboMsg = '', 1500);

      // Clear the cells
      for (let r of rowsToClear) {
        for (let c = 0; c < GRID_SIZE; c++) board[r][c] = '';
      }
      for (let c of colsToClear) {
        for (let r = 0; r < GRID_SIZE; r++) board[r][c] = '';
      }
    }
  }

  function checkGameOver() {
    let hasMove = false;
    for (const block of selectableBlocks) {
      if (!block) continue;
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (canPlace(block.shape, r, c)) {
            hasMove = true;
            break;
          }
        }
        if (hasMove) break;
      }
      if (hasMove) break;
    }

    if (!hasMove) {
      gameOver = true;
      if (appState.user) {
        if (score > (appState.user.stats.blockBlastHighScore || 0)) {
          appState.user.stats.blockBlastHighScore = score;
        }
      }
    }
  }

  function exitGame() {
    appState.currentScene = 'lobby';
  }

</script>

<svelte:window 
  onpointermove={handlePointerMove} 
  onpointerup={handlePointerUp} 
  onpointercancel={handlePointerUp} 
/>

<div class="block-blast-scene">
  <div class="header">
    <button class="exit-btn" onclick={exitGame}>나가기</button>
    <div class="score">점수: {score}</div>
  </div>

  <div class="game-area">
    {#if comboMsg}
      <div class="combo-msg">{comboMsg}</div>
    {/if}

    <!-- Grid -->
    <div class="grid-container">
      <div class="grid" bind:this={gridElement}>
        {#each board as row, r}
          {#each row as cellColor, c}
            <div 
              class="cell {cellColor !== '' ? 'filled' : ''}" 
              style="background-color: {cellColor !== '' ? cellColor : 'rgba(255,255,255,0.05)'};"
            ></div>
          {/each}
        {/each}
      </div>
      {#if gameOver}
        <div class="game-over-overlay">
          <h2>게임 오버!</h2>
          <p>더 이상 놓을 수 있는 블록이 없습니다.</p>
          <button class="retry-btn" onclick={initGame}>다시하기</button>
        </div>
      {/if}
    </div>

    <!-- UI Divider -->
    <div class="panels">
      <!-- Selectable Blocks -->
      <div class="selectable-panel">
        <div class="panel-title">끌어서 놓으세요</div>
        <div class="blocks-row">
          {#each selectableBlocks as block, i}
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div 
              class="block-slot {draggingIndex === i ? 'dragging-source' : ''}"
              onpointerdown={(e) => handlePointerDown(e, i)}
              style="touch-action: none;"
            >
              {#if block}
                <div class="mini-shape" style="grid-template-columns: repeat({block.shape[0].length}, 1fr);">
                  {#each block.shape as sRow}
                    {#each sRow as sCell}
                      <div class="mini-cell" style="background-color: {sCell === 1 ? block.color : 'transparent'};"></div>
                    {/each}
                  {/each}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>

      <!-- Preview Block -->
      <div class="preview-panel">
        <div class="panel-title">다음 블록</div>
        <div class="block-slot preview">
          {#if nextPreviewBlock}
            <div class="mini-shape" style="grid-template-columns: repeat({nextPreviewBlock.shape[0].length}, 1fr);">
              {#each nextPreviewBlock.shape as sRow}
                {#each sRow as sCell}
                  <div class="mini-cell" style="background-color: {sCell === 1 ? nextPreviewBlock.color : 'transparent'};"></div>
                {/each}
              {/each}
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>

  <!-- Dragging Ghost -->
  {#if draggingIndex !== null && selectableBlocks[draggingIndex]}
    <div 
      class="drag-ghost" 
      style="
        left: {dragPos.x}px; 
        top: {dragPos.y}px;
      "
    >
      <div class="mini-shape ghost-shape" style="grid-template-columns: repeat({selectableBlocks[draggingIndex]!.shape[0].length}, 1fr);">
        {#each selectableBlocks[draggingIndex]!.shape as sRow}
          {#each sRow as sCell}
            <div class="mini-cell ghost-cell" style="background-color: {sCell === 1 ? selectableBlocks[draggingIndex]!.color : 'transparent'};"></div>
          {/each}
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .block-blast-scene {
    width: 100%;
    height: 100%;
    background: #1e1b4b; /* Deep indigo background */
    display: flex;
    flex-direction: column;
    overflow: hidden;
    touch-action: none; /* Prevent pull-to-refresh / scrolling during drag */
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background: rgba(30, 27, 75, 0.8);
    backdrop-filter: blur(10px);
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

  .score {
    font-size: 20px;
    font-weight: 900;
    color: white;
  }

  .combo-msg {
    position: absolute;
    top: 50px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 28px;
    font-weight: 900;
    color: #fde047;
    text-shadow: 0 4px 10px rgba(253, 224, 71, 0.5);
    z-index: 20;
    animation: popOut 1.5s forwards;
    pointer-events: none;
  }

  @keyframes popOut {
    0% { transform: translate(-50%, 0) scale(0.5); opacity: 0; }
    20% { transform: translate(-50%, -20px) scale(1.2); opacity: 1; }
    80% { transform: translate(-50%, -30px) scale(1); opacity: 1; }
    100% { transform: translate(-50%, -40px) scale(0.8); opacity: 0; }
  }

  .game-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 16px;
    position: relative;
    max-height: 100%;
    overflow: hidden;
  }

  .grid-container {
    position: relative;
    padding: 8px;
    background: rgba(255,255,255,0.02);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    width: 100%;
    max-width: 360px;
    aspect-ratio: 1 / 1;
    box-sizing: border-box;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    grid-template-rows: repeat(8, 1fr);
    gap: 2px;
    width: 100%;
    height: 100%;
  }

  .cell {
    border-radius: 4px;
    background-clip: padding-box;
    /* Removed large borders/inset shadows to make filled blocks align cleanly */
  }

  .cell.filled {
    box-shadow: inset 0 2px 4px rgba(255,255,255,0.2), 0 1px 2px rgba(0,0,0,0.4);
  }

  .game-over-overlay {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(15, 23, 42, 0.85);
    backdrop-filter: blur(4px);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: white;
    z-index: 10;
  }

  .game-over-overlay h2 {
    font-size: 28px;
    margin: 0 0 8px 0;
    color: #ef4444;
  }

  .game-over-overlay p {
    font-size: 14px;
    color: #cbd5e1;
    margin-bottom: 24px;
  }

  .retry-btn {
    padding: 12px 24px;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 800;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  }

  .panels {
    display: flex;
    gap: 12px;
    width: 100%;
    max-width: 360px;
  }

  .panel-title {
    font-size: 12px;
    font-weight: 700;
    color: #94a3b8;
    margin-bottom: 8px;
    text-align: center;
  }

  .selectable-panel {
    flex: 2;
    background: rgba(255,255,255,0.05);
    padding: 12px;
    border-radius: 16px;
  }

  .blocks-row {
    display: flex;
    justify-content: space-around;
    align-items: center;
    height: 70px;
  }

  .preview-panel {
    flex: 1;
    background: rgba(255,255,255,0.02);
    padding: 12px;
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .block-slot {
    width: 60px;
    height: 60px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 12px;
    cursor: grab;
    transition: transform 0.2s;
  }

  .block-slot:active {
    cursor: grabbing;
  }

  .block-slot.dragging-source {
    opacity: 0.2;
  }

  .block-slot.preview {
    cursor: default;
    opacity: 0.5;
    transform: scale(0.9);
  }

  .mini-shape {
    display: grid;
    gap: 2px;
    pointer-events: none; /* Let events pass to slot */
  }

  .mini-cell {
    width: 16px;
    height: 16px;
    border-radius: 2px;
    box-shadow: inset 0 1px 2px rgba(255,255,255,0.2);
  }

  .drag-ghost {
    position: fixed;
    pointer-events: none;
    z-index: 100;
    transform: translate(-16px, -16px); /* Center the first cell under pointer roughly */
  }

  .ghost-shape {
    gap: 3px;
  }

  /* Make ghost cells larger to match grid size roughly */
  .ghost-cell {
    width: 32px; 
    height: 32px;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.2);
  }
</style>
