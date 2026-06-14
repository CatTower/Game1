<script lang="ts">
  import { onMount } from 'svelte';
  import { game } from '../lib/gameStore.svelte';
  import { getCellCenter, getRowLimit, isAdjacent, type Position } from '../lib/hexUtils';
  import HexTile from './HexTile.svelte';

  let isDragging = $state(false);
  let svgElement = $state<SVGSVGElement | null>(null);

  // Track all active cell positions for distance checks (mobile touch drag)
  const activeCells: Position[] = [];
  for (let c = 0; c < 5; c++) {
    const limit = getRowLimit(c);
    for (let r = 0; r < limit; r++) {
      activeCells.push({ col: c, row: r });
    }
  }

  // Mouse drag handlers
  function handleTilePress(col: number, row: number) {
    if (game.isCorrectEffectRunning || game.isTimeOverProcessing) return;
    isDragging = true;
    game.selectedPositions = [];
    game.selectedString = '';
    game.selectTile(col, row);
  }

  function handleTileHover(col: number, row: number) {
    if (!isDragging || game.isCorrectEffectRunning || game.isTimeOverProcessing) return;

    const count = game.selectedPositions.length;
    if (count === 0) return;

    const lastPos = game.selectedPositions[count - 1];

    // If hovering back to second-to-last tile, backtrack selection
    if (count >= 2) {
      const prevPos = game.selectedPositions[count - 2];
      if (prevPos.col === col && prevPos.row === row) {
        game.backtrackSelection();
        return;
      }
    }

    // If hovering over an adjacent, unselected tile, select it
    if (!game.selectedPositions.some(pos => pos.col === col && pos.row === row) && isAdjacent(lastPos, { col, row })) {
      game.selectTile(col, row);
    }
  }

  // Global mouse up / touch end handler
  function handleRelease() {
    isDragging = false;
    // If released before completing word, clear selection
    if (game.selectedString.length < game.currentWord.length) {
      game.selectedPositions = [];
      game.selectedString = '';
    }
  }

  // Touch Move drag support (for mobile KakaoTalk browsers)
  function handleTouchMove(e: TouchEvent) {
    if (!isDragging || e.touches.length === 0 || !svgElement) return;

    const touch = e.touches[0];
    const rect = svgElement.getBoundingClientRect();

    // Map screen touch coordinates to SVG coordinate system space (0..1080, 0..1120)
    const scaleX = 1080 / rect.width;
    const scaleY = 1120 / rect.height;
    const touchX = (touch.clientX - rect.left) * scaleX;
    const touchY = (touch.clientY - rect.top) * scaleY;

    // Find nearest cell center
    for (const cell of activeCells) {
      const center = getCellCenter(cell.col, cell.row);
      const dist = Math.hypot(touchX - center.x, touchY - center.y);

      // If within touch radius of a cell
      if (dist < 85) {
        const count = game.selectedPositions.length;
        if (count > 0) {
          const lastPos = game.selectedPositions[count - 1];

          // Check if hovering back (backtrack)
          if (count >= 2) {
            const prevPos = game.selectedPositions[count - 2];
            if (prevPos.col === cell.col && prevPos.row === cell.row) {
              game.backtrackSelection();
              break;
            }
          }

          // Check if selecting next adjacent
          if (!game.selectedPositions.some(pos => pos.col === cell.col && pos.row === cell.row) && isAdjacent(lastPos, cell)) {
            game.selectTile(cell.col, cell.row);
            break;
          }
        }
      }
    }
  }

  // Auto-reset dragging when quiz word changes to prevent layout leak
  $effect(() => {
    const _ = game.currentWord;
    isDragging = false;
  });
</script>

<svelte:window 
  onmouseup={handleRelease} 
  ontouchend={handleRelease} 
/>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="grid-container">
  <svg 
    bind:this={svgElement}
    class="hex-grid-svg" 
    viewBox="0 0 1080 1120"
    ontouchmove={handleTouchMove}
  >
    <!-- SVG Definitions (for styling markers/lines) -->
    <defs>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="8" stdDeviation="6" flood-opacity="0.1" />
      </filter>
    </defs>

    <!-- Connection lines between selected tiles -->
    {#if game.selectedPositions.length > 1}
      <g class="connections-group">
        {#each game.selectedPositions as pos, idx}
          {#if idx > 0}
            {@const prev = getCellCenter(game.selectedPositions[idx - 1].col, game.selectedPositions[idx - 1].row)}
            {@const curr = getCellCenter(pos.col, pos.row)}
            <line 
              x1={prev.x} 
              y1={prev.y} 
              x2={curr.x} 
              y2={curr.y} 
              stroke="var(--color-accent)" 
              stroke-width="18" 
              stroke-linecap="round"
              opacity="0.85"
            />
          {/if}
        {/each}
      </g>
    {/if}

    <!-- Render all 23 active hexagon tiles -->
    {#key game.currentWord}
      {#each Array(5) as _, c}
        {@const rowLimit = getRowLimit(c)}
        {#each Array(rowLimit) as __, r}
          <!-- Check if grid letters are ready -->
          {#if game.gridLetters[c] && game.gridLetters[c][r] !== undefined}
            <!-- Check spelling index in correct path -->
            {@const hintIdx = game.currentPath.findIndex(pos => pos.col === c && pos.row === r)}
            
            <!-- Determine if this specific letter index has been revealed by hint timer -->
            {@const isHinted = hintIdx >= 0 && hintIdx < Math.floor(game.currentWord.length * Math.min(1, Math.max(0, game.playTime - game.quizBeginTime) / (game.currentWord.length * 5)))}
            
            <HexTile 
              col={c} 
              row={r} 
              char={game.gridLetters[c][r]} 
              selected={game.selectedPositions.some(pos => pos.col === c && pos.row === r)} 
              hintIndex={isHinted ? hintIdx : -1}
              onPress={handleTilePress}
              onHover={handleTileHover}
            />
          {/if}
        {/each}
      {/each}
    {/key}
  </svg>
</div>

<style>
  .grid-container {
    width: 100%;
    max-width: 480px;
    margin: 0 auto;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .hex-grid-svg {
    width: 100%;
    height: auto;
    filter: drop-shadow(0 12px 24px rgba(0, 0, 0, 0.04));
    touch-action: none; /* Disable native scroll/pinch while dragging on mobile */
  }

  .connections-group line {
    animation: draw-line 0.1s ease-out;
  }

  @keyframes draw-line {
    from { stroke-dasharray: 100; stroke-dashoffset: 100; }
    to { stroke-dasharray: 100; stroke-dashoffset: 0; }
  }
</style>
