<script lang="ts">
  import { game } from '../lib/gameStore.svelte';
  import { appState } from '../lib/appStore.svelte';

  // Determine current mascot state based on game states
  let mascotState = $derived.by(() => {
    if (game.isCorrectEffectRunning) return 'correct';
    if (game.isTimeOverProcessing) return 'timeover';
    if (game.selectedString.length === game.currentWord.length && game.selectedString !== game.currentWord) return 'wrong';
    return 'idle';
  });
</script>

<div class="mascot-container {mascotState}">
  {#if appState.user?.avatarImage}
    <img src={appState.user.avatarImage} alt="User Avatar Mascot" class="book-mascot avatar-mascot" />
  {:else}
    <!-- Book Mascot SVG Fallback -->
    <svg class="book-mascot" viewBox="0 0 200 220" width="160" height="176">
      <!-- Shadow -->
      <ellipse cx="100" cy="205" rx="55" ry="8" fill="rgba(0,0,0,0.08)" />

      <!-- Main Book Body -->
      <g class="book-body">
        <!-- Pages thickness effect -->
        <path d="M 45 40 Q 100 50 155 40 L 155 180 Q 100 190 45 180 Z" fill="#ffffff" stroke="var(--color-border)" stroke-width="4" />
        <path d="M 47 44 Q 100 53 153 44 L 153 176 Q 100 185 47 176 Z" fill="#f5f5f5" />
        
        <!-- Book Cover (Backing) -->
        <path d="M 38 34 Q 100 45 162 34 L 162 186 Q 100 197 38 186 Z" fill="var(--color-accent)" rx="10" />

        <!-- Bookmark Ribbon -->
        <path d="M 95 38 L 95 198 L 105 198 L 105 38 Z" fill="#ef4444" />
        <polygon points="95,198 105,198 100,190" fill="#ef4444" />

        <!-- Face Elements -->
        <g class="face">
          {#if mascotState === 'idle'}
            <!-- Cute happy eyes -->
            <circle cx="70" cy="110" r="10" fill="var(--color-text)" />
            <circle cx="130" cy="110" r="10" fill="var(--color-text)" />
            <circle cx="73" cy="107" r="3" fill="#ffffff" />
            <circle cx="133" cy="107" r="3" fill="#ffffff" />
            <!-- Small smiling mouth -->
            <path d="M 95 130 Q 100 135 105 130" stroke="var(--color-text)" stroke-width="4" fill="none" stroke-linecap="round" />
          
          {:else}
            {#if mascotState === 'correct'}
              <!-- Sparkling happy eyes (arcs) -->
              <path d="M 60 115 Q 70 102 80 115" stroke="var(--color-text)" stroke-width="5" fill="none" stroke-linecap="round" />
              <path d="M 120 115 Q 130 102 140 115" stroke="var(--color-text)" stroke-width="5" fill="none" stroke-linecap="round" />
              <!-- Wide open happy mouth -->
              <path d="M 90 128 Q 100 148 110 128 Z" fill="#ef4444" stroke="var(--color-text)" stroke-width="4" stroke-linejoin="round" />
              <!-- Pink cheeks blushes -->
              <circle cx="58" cy="125" r="8" fill="#f472b6" opacity="0.6" />
              <circle cx="142" cy="125" r="8" fill="#f472b6" opacity="0.6" />
            {/if}

            {#if mascotState === 'wrong'}
              <!-- Dizzy eyes (crosses) -->
              <path d="M 63 103 L 77 117 M 77 103 L 63 117" stroke="var(--color-text)" stroke-width="5" stroke-linecap="round" />
              <path d="M 123 103 L 137 117 M 137 103 L 123 117" stroke="var(--color-text)" stroke-width="5" stroke-linecap="round" />
              <!-- Wavy worried mouth -->
              <path d="M 90 130 Q 95 125 100 130 Q 105 135 110 130" stroke="var(--color-text)" stroke-width="4" fill="none" stroke-linecap="round" />
            {/if}

            {#if mascotState === 'timeover'}
              <!-- Crying / sad eyes (downward curves) -->
              <path d="M 60 108 Q 70 118 80 108" stroke="var(--color-text)" stroke-width="5" fill="none" stroke-linecap="round" />
              <path d="M 120 108 Q 130 118 140 108" stroke="var(--color-text)" stroke-width="5" fill="none" stroke-linecap="round" />
              <!-- Crying tears -->
              <path d="M 70 115 Q 70 135 65 140 Q 60 135 70 115" fill="#38bdf8" />
              <path d="M 130 115 Q 130 135 125 140 Q 120 135 130 115" fill="#38bdf8" />
              <!-- Sad open mouth -->
              <circle cx="100" cy="132" r="7" fill="var(--color-text)" />
            {/if}
          {/if}
        </g>

        <!-- Little hands holding the sides -->
        <g class="hands">
          <circle cx="34" cy="120" r="7" fill="var(--color-text)" />
          <circle cx="166" cy="120" r="7" fill="var(--color-text)" />
        </g>
      </g>
    </svg>
  {/if}

  <!-- Speech bubble or current input indicator -->
  {#if game.selectedString}
    <div class="input-bubble animate-jiggle">
      {game.selectedString}
    </div>
  {/if}
</div>

<style>
  .mascot-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    width: 200px;
    height: 240px;
  }

  .book-mascot {
    filter: drop-shadow(0 10px 15px rgba(0, 0, 0, 0.08));
    transition: transform 0.3s ease;
  }

  .avatar-mascot {
    height: 176px;
    width: auto;
    object-fit: contain;
  }

  /* Idle Floating Animation */
  .idle .book-mascot {
    animation: float 3s infinite ease-in-out;
  }

  /* Correct Jumping Animation */
  .correct .book-mascot {
    animation: jump 0.6s ease-out;
  }
  @keyframes jump {
    0%, 100% { transform: translateY(0) scale(1); }
    30% { transform: translateY(-35px) scale(0.95, 1.05); }
    70% { transform: translateY(5px) scale(1.05, 0.95); }
  }

  /* Wrong Shaking Animation */
  .wrong .book-mascot {
    animation: shake 0.4s ease-in-out;
  }
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20%, 60% { transform: translateX(-8px); }
    40%, 80% { transform: translateX(8px); }
  }

  /* Timeover Sad Shake */
  .timeover .book-mascot {
    animation: cry-shake 1s infinite ease-in-out;
  }
  @keyframes cry-shake {
    0%, 100% { transform: translateY(0) rotate(0); }
    50% { transform: translateY(-4px) rotate(1deg); }
  }

  /* Speech Bubble style with maximum theme contrast */
  .input-bubble {
    position: absolute;
    bottom: -10px;
    background: var(--color-text); /* Maximum contrast base background */
    color: var(--color-bg);       /* Maximum contrast text color */
    font-weight: 700;
    font-size: 1.15rem;
    padding: 6px 14px;
    border-radius: 16px;
    border: 3.5px solid var(--color-accent); /* Beautiful accent border */
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    white-space: nowrap;
    letter-spacing: 1.5px;
    z-index: 10;
  }
  .input-bubble::before {
    content: '';
    position: absolute;
    top: -8px;
    left: 50%;
    transform: translateX(-50%);
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-bottom: 8px solid var(--color-accent); /* Matches accent border */
  }
</style>
