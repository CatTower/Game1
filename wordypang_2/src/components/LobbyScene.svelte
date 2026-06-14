<script lang="ts">
  import { onMount } from 'svelte';
  import { appState } from '../lib/appStore.svelte';

  let topWordyPang2 = $derived(appState.getTopScorerWordyPang2());
  let topDodgePoop = $derived(appState.getTopScorerDodgePoop());

  let topWordChain = $derived(appState.getTopScorerWordChain());
  let topWordyPangDrop = $derived(appState.getTopScorerWordyPangDrop());
  let topBlockBlast = $derived(appState.getTopScorerBlockBlast());

  let otherUsers = $state<any[]>([]);

  onMount(() => {
    otherUsers = appState.allUsers
      .filter(u => u.nickname !== appState.user?.nickname)
      .map(u => ({
        ...u,
        x: 10 + (Math.random() * 80),
        y: 10 + (Math.random() * 60),
        delay: Math.random() * 3
      }));
  });

  function launchGame(gameId: string) {
    if (gameId === 'wordypang2') {
      appState.currentScene = 'wordypang2';
    } else if (gameId === 'dodgepoop') {
      appState.currentScene = 'dodgepoop';
    } else if (gameId === 'wordchain') {
      appState.currentScene = 'wordchain';
    } else if (gameId === 'wordypangdrop') {
      appState.currentScene = 'wordypangdrop';
    } else if (gameId === 'blockblast') {
      appState.currentScene = 'blockblast';
    } else {
      alert('준비 중인 게임입니다.');
    }
  }

  function logout() {
    if (confirm('정말 로그아웃 하시겠습니까?')) {
      appState.logout();
    }
  }
</script>

<div class="lobby-scene scene">
  <!-- Top Bar: My Profile -->
  <div class="top-bar">
    <div class="profile">
      {#if appState.user?.avatarImage}
        <img src={appState.user.avatarImage} alt="My Avatar" class="my-avatar" />
      {/if}
      <div class="profile-info">
        <div class="nickname">{appState.user?.nickname}</div>
        <div class="stats">워디팡 점수: {appState.user?.stats.wordyPang2HighScore}</div>
      </div>
    </div>
    <button class="logout-btn" onclick={logout}>나가기</button>
  </div>

  <!-- Environment area (Floating avatars) -->
  <div class="environment">
    <!-- Render My Avatar floating in the center -->
    {#if appState.user?.avatarImage}
      <div class="floating-avatar my-floating" style="--float-delay: 0s;">
        <img src={appState.user.avatarImage} alt="Me" />
        <span class="avatar-name">나</span>
      </div>
    {/if}

    <!-- Render other users -->
    {#each otherUsers as u}
      <div class="floating-avatar other" style="left: {u.x}%; top: {u.y}%; --float-delay: {u.delay}s;">
        <img src={u.avatarImage} alt={u.nickname} />
        <span class="avatar-name">{u.nickname}</span>
      </div>
    {/each}
  </div>

  <!-- Mini-game Portal (Bottom) -->
  <div class="portal-container">
    <h2 class="portal-title">플레이할 게임을 선택하세요!</h2>
    <div class="game-list">
      
      <!-- Wordypang 2 -->
      <button class="game-card active" onclick={() => launchGame('wordypang2')}>
        <div class="game-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>
        </div>
        <div class="game-info">
          <h3>워디팡 2</h3>
          <p>영어 단어 퍼즐</p>
          {#if topWordyPang2 && topWordyPang2.stats.wordyPang2HighScore > 0}
            <div class="top-scorer">🏆 {topWordyPang2.nickname} ({topWordyPang2.stats.wordyPang2HighScore}점)</div>
          {/if}
        </div>
      </button>

      <!-- Word Chain -->
      <button class="game-card active" onclick={() => launchGame('wordchain')}>
        <div class="game-icon" style="background: linear-gradient(135deg, #10b981 0%, #34d399 100%);">
          <span style="font-size: 32px;">💬</span>
        </div>
        <div class="game-info">
          <h3>끝말잇기</h3>
          <p>비동기 대전</p>
          {#if topWordChain && topWordChain.stats.wordChainHighScore > 0}
            <div class="top-scorer">🏆 {topWordChain.nickname} ({topWordChain.stats.wordChainHighScore}승)</div>
          {/if}
        </div>
      </button>

      <!-- WordyPang Drop -->
      <button class="game-card active" onclick={() => launchGame('wordypangdrop')}>
        <div class="game-icon" style="background: linear-gradient(135deg, #f43f5e 0%, #fb7185 100%);">
          <span style="font-size: 32px;">☄️</span>
        </div>
        <div class="game-info">
          <h3>워디팡 드롭</h3>
          <p>타자 디펜스</p>
          {#if topWordyPangDrop && topWordyPangDrop.stats.wordyPangDropHighScore > 0}
            <div class="top-scorer">🏆 {topWordyPangDrop.nickname} ({topWordyPangDrop.stats.wordyPangDropHighScore}점)</div>
          {/if}
        </div>
      </button>

      <!-- Dodge the Poop -->
      <button class="game-card active" onclick={() => launchGame('dodgepoop')}>
        <div class="game-icon" style="background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%);">
          <span style="font-size: 32px;">💩</span>
        </div>
        <div class="game-info">
          <h3>똥 피하기</h3>
          <p>순발력 아케이드</p>
          {#if topDodgePoop && topDodgePoop.stats.dodgePoopHighScore > 0}
            <div class="top-scorer">🏆 {topDodgePoop.nickname} ({topDodgePoop.stats.dodgePoopHighScore}점)</div>
          {/if}
        </div>
      </button>

      <!-- Block Blast -->
      <button class="game-card active" onclick={() => launchGame('blockblast')}>
        <div class="game-icon" style="background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);">
          <span style="font-size: 32px;">🟦</span>
        </div>
        <div class="game-info">
          <h3>블록 블라스트</h3>
          <p>전략 퍼즐</p>
          {#if topBlockBlast && topBlockBlast.stats.blockBlastHighScore > 0}
            <div class="top-scorer">🏆 {topBlockBlast.nickname} ({topBlockBlast.stats.blockBlastHighScore}점)</div>
          {/if}
        </div>
      </button>

    </div>
  </div>
</div>

<style>
  .lobby-scene {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    /* Soft garden-like background */
    background: linear-gradient(to bottom, #8fd3f4 0%, #84fab0 100%);
    position: relative;
    overflow: hidden;
  }

  .top-bar {
    position: absolute;
    top: 16px;
    left: 16px;
    right: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    padding: 12px 16px;
    border-radius: 20px;
    z-index: 10;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }

  .profile {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .my-avatar {
    width: 40px;
    height: 40px;
    object-fit: contain;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
  }

  .profile-info {
    display: flex;
    flex-direction: column;
  }

  .nickname {
    font-weight: 800;
    font-size: 16px;
    color: var(--color-text);
  }

  .stats {
    font-size: 12px;
    color: var(--color-text-muted, #666);
    font-weight: 600;
  }

  .logout-btn {
    background: none;
    border: none;
    color: var(--color-wrong);
    font-weight: 700;
    cursor: pointer;
    padding: 8px;
  }

  /* Environment (Floating Avatars) */
  .environment {
    flex: 1;
    position: relative;
  }

  .floating-avatar {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    animation: float 4s ease-in-out infinite alternate;
    animation-delay: var(--float-delay);
  }

  .my-floating {
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    z-index: 5;
  }

  .floating-avatar img {
    height: 120px;
    width: auto;
    object-fit: contain;
    filter: drop-shadow(0 8px 12px rgba(0,0,0,0.2));
  }

  .my-floating img {
    height: 160px;
  }

  .avatar-name {
    background: rgba(0,0,0,0.5);
    color: white;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 700;
  }

  @keyframes float {
    0% { transform: translateY(0px); }
    100% { transform: translateY(-15px); }
  }

  /* Portal Area */
  .portal-container {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(20px);
    border-top-left-radius: 32px;
    border-top-right-radius: 32px;
    padding: 24px;
    padding-bottom: calc(24px + env(safe-area-inset-bottom, 0px));
    box-shadow: 0 -10px 30px rgba(0,0,0,0.1);
    z-index: 10;
  }

  .portal-title {
    margin: 0 0 16px 0;
    font-size: 18px;
    font-weight: 800;
    color: var(--color-text);
    text-align: center;
  }

  .game-list {
    display: flex;
    gap: 16px;
    overflow-x: auto;
    padding-bottom: 8px;
    scroll-snap-type: x mandatory;
  }

  .game-list::-webkit-scrollbar {
    display: none; 
  }

  .game-card {
    flex: 0 0 200px;
    scroll-snap-align: center;
    background: white;
    border: 2px solid var(--color-border);
    border-radius: 20px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
  }

  .game-card.active {
    border-color: var(--color-primary);
  }

  .game-card:active {
    transform: scale(0.95);
  }

  .game-card.disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .game-card.disabled:active {
    transform: none;
  }

  .game-icon {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .game-card.active .game-icon {
    background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  }

  .game-card.disabled .game-icon {
    background: #ccc;
  }

  .game-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .game-info h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 800;
    color: var(--color-text);
  }

  .game-info p {
    margin: 4px 0 0 0;
    font-size: 12px;
    color: var(--color-text-muted, #666);
    font-weight: 600;
  }

  .top-scorer {
    margin-top: 8px;
    background: #fffbea;
    color: #d97706;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 800;
    border: 1px solid #fde68a;
  }
</style>
