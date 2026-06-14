<script lang="ts">
  import { getCellCenter, getHexagonPoints } from '../lib/hexUtils';
  import { game } from '../lib/gameStore.svelte';

  // Svelte 5 Props
  let { 
    col, 
    row, 
    char, 
    selected = false, 
    hintIndex = -1, // -1 means not hinted, >= 0 is the spelling index (0 = 1st letter)
    onPress, 
    onHover 
  } = $props<{
    col: number;
    row: number;
    char: string;
    selected: boolean;
    hintIndex: number;
    onPress: (c: number, r: number) => void;
    onHover: (c: number, r: number) => void;
  }>();

  const radius = 112; // Radius of outer circle (leaves a small, elegant gap between tiles)

  // Get cell center coordinates reactively to satisfy Svelte 5 compiler rules
  let center = $derived(getCellCenter(col, row));
  let points = $derived(getHexagonPoints(center.x, center.y, radius));
  let shadowPoints = $derived(getHexagonPoints(center.x, center.y + 6, radius));

  let isHinted = $derived(hintIndex >= 0);

  // Mouse / Touch handlers to propagate to parent grid
  function handleStart(e: Event) {
    e.preventDefault();
    onPress(col, row);
  }

  // Hover triggers when touch dragging or dragging
  function handleEnter() {
    onHover(col, row);
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<g 
  class="tile-group {selected ? 'selected' : ''} {isHinted ? 'hinted' : ''}"
  onmousedown={handleStart}
  ontouchstart={handleStart}
  onmouseenter={handleEnter}
>
  <!-- Shadow (Offset hexagon) -->
  <polygon 
    points={shadowPoints} 
    fill="rgba(0, 0, 0, 0.06)" 
  />

  <!-- Main Hexagon Polygon -->
  <polygon 
    class="hex-shape" 
    {points} 
    stroke="var(--color-text)"
    stroke-width="4.5"
  />

  <!-- Letter Text -->
  <text 
    class="hex-text" 
    x={center.x} 
    y={center.y} 
    dominant-baseline="central" 
    text-anchor="middle"
  >
    {char}
  </text>

  <!-- Hint Sequence Badge (1, 2, 3...) at top right of hexagon -->
  {#if isHinted && !selected}
    <g class="hint-badge">
      <circle 
        cx={center.x + 52} 
        cy={center.y - 82} 
        r="22" 
        fill="var(--color-accent)" 
        stroke="var(--color-text)"
        stroke-width="3"
      />
      <text 
        x={center.x + 52} 
        y={center.y - 82} 
        dominant-baseline="central" 
        text-anchor="middle"
        fill="var(--color-bg)"
        font-size="24"
        font-weight="900"
      >
        {hintIndex + 1}
      </text>
    </g>
  {/if}
</g>

<style>
  .tile-group {
    cursor: pointer;
  }

  .hex-shape {
    fill: var(--color-bg);
    transition: fill 0.3s ease, stroke 0.3s ease, stroke-width 0.2s ease, transform 0.2s ease;
    transform-origin: center;
  }

  /* SVG Native Coordinates font size to scale perfectly with SVG viewBox */
  .hex-text {
    font-size: 72px; /* Set directly in SVG pixels so it scales with layout */
    font-weight: 900;
    fill: var(--color-text);
    transition: fill 0.3s ease;
    pointer-events: none;
  }

  /* Hover states */
  .tile-group:hover .hex-shape {
    fill: var(--color-select);
    opacity: 0.9;
  }

  /* Hinted State (Thick outline, default background to avoid clash with selection) */
  .hinted .hex-shape {
    stroke: var(--color-accent);
    stroke-width: 9px; /* Make the outline very thick and prominent */
  }

  /* Selected State (Overrides Hinted completely when tile is selected) */
  .selected .hex-shape {
    fill: var(--color-select) !important;
    stroke: var(--color-accent) !important;
    stroke-width: 4.5px !important;
    animation: bounce 0.15s ease-out;
  }
  .selected .hex-text {
    fill: var(--color-text) !important;
  }

  .hint-badge text {
    font-family: inherit;
    pointer-events: none;
  }

  @keyframes bounce {
    0% { transform: scale(0.9); }
    50% { transform: scale(1.06); }
    100% { transform: scale(1); }
  }
</style>
