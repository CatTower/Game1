<script lang="ts">
  import { onMount } from 'svelte';
  import { appState, type UserProfile } from '../lib/appStore.svelte';

  let dictionary = $state<string[]>([]);
  let usedWords = $state<string[]>([]);
  
  let opponent = $state<UserProfile | null>(null);
  let currentWord = $state('');
  
  let myTurn = $state(true);
  let userInput = $state('');
  let message = $state('게임을 준비 중입니다...');
  let gameOver = $state(false);
  let timeRemaining = $state(10);
  let timerInterval: number | null = null;
  let score = $state(0);

  // Setup opponent and dictionary
  onMount(async () => {
    try {
      const res = await fetch('/data/korean_words.json');
      const data = await res.json();
      dictionary = data;
    } catch (e) {
      console.error('Failed to load dictionary:', e);
      dictionary = ['사과', '과일', '일기', '기차', '차표', '표지', '지구', '구슬', '슬픔'];
    }

    const others = appState.allUsers.filter(u => u.nickname !== appState.user?.nickname);
    if (others.length > 0) {
      opponent = others[Math.floor(Math.random() * others.length)];
    } else {
      // Dummy opponent if no one else is registered
      opponent = {
        nickname: '컴퓨터봇',
        pin: '0000',
        avatarImage: '',
        stats: { wordyPang2HighScore: 0, wordyPang2WordsCleared: 0, dodgePoopHighScore: 0, wordChainHighScore: 0, wordyPangDropHighScore: 0, blockBlastHighScore: 0 }
      };
    }

    startGame();
  });

  function startGame() {
    usedWords = [];
    score = 0;
    gameOver = false;
    myTurn = true;
    const startWords = dictionary.filter(w => w.length > 1);
    currentWord = startWords[Math.floor(Math.random() * startWords.length)];
    usedWords.push(currentWord);
    message = `시작 단어: "${currentWord}" - 당신의 차례입니다!`;
    startTimer();
  }

  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timeRemaining = 10;
    timerInterval = window.setInterval(() => {
      timeRemaining--;
      if (timeRemaining <= 0) {
        clearInterval(timerInterval!);
        handleTimeout();
      }
    }, 1000) as unknown as number;
  }

  function handleTimeout() {
    gameOver = true;
    if (myTurn) {
      message = '시간 초과! 패배했습니다.';
    } else {
      message = '상대방 시간 초과! 당신의 승리입니다.';
      updateHighScore();
    }
  }

  function updateHighScore() {
    if (appState.user) {
      if (score > (appState.user.stats.wordChainHighScore || 0)) {
        appState.user.stats.wordChainHighScore = score;
      }
    }
  }

  function getNextWords(word: string) {
    const lastChar = word.charAt(word.length - 1);
    // Simple matching (ignoring dueum rule for simplicity right now)
    return dictionary.filter(w => w.startsWith(lastChar) && !usedWords.includes(w));
  }

  function submitWord() {
    if (gameOver || !myTurn) return;
    
    const input = userInput.trim();
    if (!input) return;

    const lastChar = currentWord.charAt(currentWord.length - 1);
    if (!input.startsWith(lastChar)) {
      message = `"${lastChar}"(으)로 시작하는 단어를 입력하세요!`;
      return;
    }

    if (input.length < 2) {
      message = '두 글자 이상의 단어를 입력하세요!';
      return;
    }

    // 서버 DB가 빈약하므로, 사용자의 입력은 일단 끝말이 맞고 2글자 이상이면 통과 (오타 검증 우회)
    // if (!dictionary.includes(input)) {
    //   message = '사전에 없는 단어입니다.';
    //   return;
    // }

    if (usedWords.includes(input)) {
      message = '이미 사용된 단어입니다.';
      return;
    }

    // Valid word
    currentWord = input;
    usedWords.push(currentWord);
    userInput = '';
    score++;
    myTurn = false;
    message = `상대방의 차례입니다...`;
    
    if (timerInterval) clearInterval(timerInterval);

    // Opponent turn
    setTimeout(opponentTurn, 1000 + Math.random() * 2000); // 1~3 sec delay
  }

  function opponentTurn() {
    if (gameOver) return;

    const possibleWords = getNextWords(currentWord);
    if (possibleWords.length === 0) {
      gameOver = true;
      message = '상대방이 단어를 찾지 못했습니다. 당신의 승리입니다!';
      updateHighScore();
      return;
    }

    // Pick a random word
    currentWord = possibleWords[Math.floor(Math.random() * possibleWords.length)];
    usedWords.push(currentWord);
    myTurn = true;
    message = `상대방: "${currentWord}" - 당신의 차례입니다!`;
    startTimer();
  }

  function exitGame() {
    if (timerInterval) clearInterval(timerInterval);
    appState.currentScene = 'lobby';
  }

  // Focus input automatically
  function focusInput(node: HTMLInputElement) {
    node.focus();
  }
</script>

<div class="word-chain-scene">
  <div class="header">
    <button class="exit-btn" onclick={exitGame}>나가기</button>
    <div class="score">점수: {score}</div>
  </div>

  <div class="game-area">
    <!-- Opponent Area -->
    <div class="character opponent {!myTurn && !gameOver ? 'active-turn' : ''}">
      <div class="avatar-wrap">
        {#if opponent?.avatarImage}
          <img src={opponent.avatarImage} alt="Opponent" />
        {:else}
          <div class="dummy-avatar">🤖</div>
        {/if}
      </div>
      <div class="name">{opponent?.nickname}</div>
      {#if !myTurn && !gameOver}
        <div class="typing-indicator">생각 중...</div>
      {/if}
    </div>

    <!-- Center Status -->
    <div class="status-board">
      <div class="time-bar-container">
        <div class="time-bar {myTurn ? 'player' : 'opponent'}" style="width: {(timeRemaining / 10) * 100}%"></div>
      </div>
      <div class="current-word">{currentWord}</div>
      <div class="message">{message}</div>
    </div>

    <!-- Player Area -->
    <div class="character player {myTurn && !gameOver ? 'active-turn' : ''}">
      <div class="avatar-wrap">
        {#if appState.user?.avatarImage}
          <img src={appState.user.avatarImage} alt="Me" />
        {/if}
      </div>
      <div class="name">나 ({appState.user?.nickname})</div>
      
      {#if myTurn && !gameOver}
        <div class="input-area">
          <input 
            type="text" 
            bind:value={userInput} 
            placeholder="단어를 입력하세요"
            onkeydown={(e) => { if(e.key === 'Enter') submitWord(); }}
            use:focusInput
          />
          <button class="send-btn" onclick={submitWord}>입력</button>
        </div>
      {/if}
      {#if gameOver}
        <button class="retry-btn" onclick={startGame}>다시하기</button>
      {/if}
    </div>
  </div>
</div>

<style>
  .word-chain-scene {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%);
    display: flex;
    flex-direction: column;
    padding: 20px;
    box-sizing: border-box;
    overflow: hidden;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
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
    font-size: 18px;
    font-weight: 800;
    color: var(--color-text);
  }

  .game-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    gap: 16px;
    align-items: center;
    max-width: 500px;
    margin: 0 auto;
    width: 100%;
  }

  .character {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 12px;
    border-radius: 20px;
    background: white;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    width: 100%;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .character.active-turn {
    transform: scale(1.05);
    box-shadow: 0 8px 24px rgba(124, 58, 237, 0.2);
    border: 2px solid var(--color-primary);
  }

  .avatar-wrap {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: #f0f0f0;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 3px solid var(--color-border);
  }

  .avatar-wrap img {
    width: 150%;
    height: 150%;
    object-fit: cover;
    object-position: top;
  }

  .dummy-avatar {
    font-size: 40px;
  }

  .name {
    font-weight: 800;
    color: var(--color-text);
  }

  .status-board {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    width: 100%;
    margin: 8px 0;
  }

  .current-word {
    font-size: 36px;
    font-weight: 900;
    color: var(--color-primary);
    text-shadow: 0 4px 12px rgba(124, 58, 237, 0.2);
    animation: pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  @keyframes pop {
    0% { transform: scale(0.5); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }

  .message {
    font-size: 16px;
    font-weight: 700;
    color: #666;
    text-align: center;
    min-height: 24px;
  }

  .time-bar-container {
    width: 100%;
    height: 12px;
    background: #e2e8f0;
    border-radius: 6px;
    overflow: hidden;
  }

  .time-bar {
    height: 100%;
    transition: width 1s linear;
  }

  .time-bar.player {
    background: #3b82f6;
  }

  .time-bar.opponent {
    background: #ef4444;
  }

  .input-area {
    display: flex;
    gap: 8px;
    width: 100%;
    margin-top: 8px;
  }

  .input-area input {
    flex: 1;
    padding: 12px 16px;
    border: 2px solid var(--color-border);
    border-radius: 12px;
    font-size: 16px;
    font-weight: 700;
    outline: none;
  }

  .input-area input:focus {
    border-color: var(--color-primary);
  }

  .send-btn {
    padding: 0 20px;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 12px;
    font-weight: 800;
    cursor: pointer;
  }

  .retry-btn {
    margin-top: 12px;
    padding: 12px 24px;
    background: var(--color-accent);
    color: white;
    border: none;
    border-radius: 12px;
    font-weight: 800;
    cursor: pointer;
    width: 100%;
  }

  .typing-indicator {
    font-size: 14px;
    color: #888;
    font-style: italic;
    animation: blink 1s infinite;
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
</style>
