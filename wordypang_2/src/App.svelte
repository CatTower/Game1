<script lang="ts">
  import { onMount } from 'svelte';
  import { game } from './lib/gameStore.svelte';
  import { appState } from './lib/appStore.svelte';
  
  import TitleScene from './components/TitleScene.svelte';
  import MainGamePlay from './components/MainGamePlay.svelte';
  import ResultScene from './components/ResultScene.svelte';
  import DictionaryScene from './components/DictionaryScene.svelte';
  
  import RegisterScene from './components/RegisterScene.svelte';
  import LobbyScene from './components/LobbyScene.svelte';
  import DodgePoopScene from './components/DodgePoopScene.svelte';
  import WordChainScene from './components/WordChainScene.svelte';
  import WordyPangDropScene from './components/WordyPangDropScene.svelte';
  import BlockBlastScene from './components/BlockBlastScene.svelte';

  let isLoading = $state(true);

  onMount(async () => {
    // Load the static word database on startup
    await game.loadWords();
    isLoading = false;
  });
</script>

<main id="app-wrapper">
  {#if appState.globalNotice}
    <div class="global-notice">
      {appState.globalNotice}
    </div>
  {/if}

  {#if isLoading}
    <div class="loading-screen">
      <div class="spinner"></div>
      <p>단어 데이터를 불러오는 중...</p>
    </div>
  {:else}
    <!-- Top-Level App Router -->
    {#if appState.currentScene === 'register'}
      <RegisterScene />
    {:else if appState.currentScene === 'lobby'}
      <LobbyScene />
    {:else if appState.currentScene === 'dodgepoop'}
      <DodgePoopScene />
    {:else if appState.currentScene === 'wordchain'}
      <WordChainScene />
    {:else if appState.currentScene === 'wordypangdrop'}
      <WordyPangDropScene />
    {:else if appState.currentScene === 'blockblast'}
      <BlockBlastScene />
    {:else if appState.currentScene === 'wordypang2'}
      <!-- Wordypang 2 Sub-Router -->
      <div class="game-container">
        <!-- Temporary exit button for testing/dev -->
        <button class="exit-btn" onclick={() => appState.currentScene = 'lobby'}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
        </button>

        {#if game.currentScene === 'title'}
          <TitleScene />
        {:else if game.currentScene === 'main'}
          <MainGamePlay />
        {:else if game.currentScene === 'result'}
          <ResultScene />
        {:else if game.currentScene === 'dictionary'}
          <DictionaryScene />
        {/if}
      </div>
    {/if}
  {/if}
</main>

<style>
  #app-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%; /* Use 100% to inherit 100dvh from parent #app */
    overflow: hidden;
  }

  .game-container {
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .exit-btn {
    position: absolute;
    top: 16px;
    right: 16px;
    z-index: 1000;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background-color: var(--color-surface);
    border: 2px solid var(--color-border);
    color: var(--color-text);
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    transition: transform 0.2s;
  }

  .exit-btn:active {
    transform: scale(0.95);
  }

  .loading-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    font-weight: 700;
    color: var(--color-text);
  }

  .spinner {
    width: 50px;
    height: 50px;
    border: 6px solid var(--color-border);
    border-top-color: var(--color-accent);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .global-notice {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    background-color: #f43f5e;
    color: white;
    text-align: center;
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 800;
    z-index: 9999;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    animation: slideDown 0.3s ease-out;
  }

  @keyframes slideDown {
    from { transform: translateY(-100%); }
    to { transform: translateY(0); }
  }
</style>
