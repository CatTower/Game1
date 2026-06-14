import { generateWordPath, type Position } from './hexUtils';

export interface WordData {
  word: string;
  meaning: string;
  level: string;
  answerCount: number;
}

export type SceneType = 'title' | 'main' | 'result' | 'dictionary';

class GameStore {
  // Reactive states using Svelte 5 Runes
  currentScene = $state<SceneType>('title');
  point = $state(0);
  level = $state(1);
  playTime = $state(0);
  remainTime = $state(60);
  tryCount = $state(0);
  correctCount = $state(0);
  themeIndex = $state(4); // Default Theme (Grape Lavender)
  difficulty = $state<'easy' | 'normal' | 'hard'>('normal');

  // Quiz states
  currentWord = $state('');
  currentMeaning = $state('');
  currentPath = $state<Position[]>([]);
  gridLetters = $state<string[][]>([]); // 5x5 grid characters
  selectedPositions = $state<Position[]>([]);
  selectedString = $state('');

  // Vocabulary stats
  words = $state<WordData[]>([]);
  highScore = $state(0);

  // Time-over and effects state
  quizBeginTime = $state(0);
  isTimeOverProcessing = $state(false);
  isCorrectEffectRunning = $state(false);

  // Derived states
  accuracy = $derived(this.tryCount > 0 ? Math.round((this.correctCount * 100) / this.tryCount) : 0);

  constructor() {
    try {
      const storedData = localStorage.getItem('wordypang_user_stats');
      if (storedData) {
        const savedStats = JSON.parse(storedData);
        this.highScore = savedStats?.highScore || 0;
      }
    } catch (e) {
      console.warn('Failed to load high score from localStorage:', e);
    }
  }

  // Assign random color theme (0-4)
  assignRandomTheme() {
    const prevTheme = this.themeIndex;
    let newTheme = Math.floor(Math.random() * 5);
    while (newTheme === prevTheme) {
      newTheme = Math.floor(Math.random() * 5);
    }
    this.themeIndex = newTheme;
    if (typeof document !== 'undefined') {
      document.body.className = `theme-${newTheme}`;
    }
  }

  // Load word database and localStorage stats
  async loadWords() {
    try {
      const response = await fetch('./data/words.json');
      const staticWords = await response.json();
      
      // Load stored answers count from localStorage safely
      let savedStats = null;
      try {
        const storedData = localStorage.getItem('wordypang_user_stats');
        savedStats = storedData ? JSON.parse(storedData) : null;
      } catch (e) {
        console.warn('LocalStorage is blocked or corrupted:', e);
      }
      
      this.highScore = savedStats?.highScore || 0;

      this.words = staticWords.map((item: any) => ({
        word: item.word.toUpperCase(),
        meaning: item.meaning,
        level: item.level,
        answerCount: savedStats?.wordStats?.[item.word.toUpperCase()]?.answerCount || 0
      }));
    } catch (e) {
      console.error('Failed to load words database:', e);
    }
  }

  // Save highScore and answer stats to localStorage safely
  saveUserData() {
    const wordStats: Record<string, { answerCount: number }> = {};
    this.words.forEach(w => {
      if (w.answerCount > 0) {
        wordStats[w.word] = { answerCount: w.answerCount };
      }
    });

    const dataToSave = {
      highScore: Math.max(this.highScore, this.point),
      wordStats
    };

    try {
      localStorage.setItem('wordypang_user_stats', JSON.stringify(dataToSave));
    } catch (e) {
      console.warn('LocalStorage write failed (privacy settings or sandbox?):', e);
    }

    if (this.point > this.highScore) {
      this.highScore = this.point;
    }
  }

  // Start new game session
  startNewGame(diff: 'easy' | 'normal' | 'hard' = 'normal') {
    this.difficulty = diff;
    this.point = 0;
    this.level = 1;
    this.playTime = 0;
    this.remainTime = 60;
    this.tryCount = 0;
    this.correctCount = 0;
    this.selectedPositions = [];
    this.selectedString = '';
    this.isTimeOverProcessing = false;
    this.isCorrectEffectRunning = false;

    this.assignRandomTheme();
    this.startNewQuiz();
    this.currentScene = 'main';
  }

  // Start a new quiz round
  startNewQuiz() {
    if (this.words.length === 0) return;

    this.selectedPositions = [];
    this.selectedString = '';
    this.quizBeginTime = this.playTime;

    // Filter by difficulty
    const filtered = this.words.filter(w => w.level === this.difficulty);
    const targetPool = filtered.length > 0 ? filtered : this.words;

    // Pick random word
    const randWordIdx = Math.floor(Math.random() * targetPool.length);
    const item = targetPool[randWordIdx];
    this.currentWord = item.word;
    this.currentMeaning = item.meaning;

    // Generate path
    const path = generateWordPath(item.word);
    if (!path) {
      // Retry if path generation fails due to deadlocks
      this.startNewQuiz();
      return;
    }
    this.currentPath = path;

    // Populate grid letters
    const letters: string[][] = Array(5).fill(null).map((_, c) => {
      const limit = c % 2 === 0 ? 5 : 4;
      return Array(limit).fill('');
    });

    // Place correct word letters along the path
    path.forEach((pos, idx) => {
      letters[pos.col][pos.row] = item.word[idx];
    });

    // Populate remaining empty tiles with random alphabets
    for (let c = 0; c < 5; c++) {
      const limit = c % 2 === 0 ? 5 : 4;
      for (let r = 0; r < limit; r++) {
        if (!letters[c][r]) {
          const randChar = String.fromCharCode(65 + Math.floor(Math.random() * 26)); // A-Z
          letters[c][r] = randChar;
        }
      }
    }

    this.gridLetters = letters;
  }

  // Check if position is already selected
  isSelected(col: number, row: number): boolean {
    return this.selectedPositions.some(pos => pos.col === col && pos.row === row);
  }

  // Add tile to selection
  selectTile(col: number, row: number) {
    if (this.selectedString.length >= this.currentWord.length) return;

    const char = this.gridLetters[col][row];
    this.selectedPositions = [...this.selectedPositions, { col, row }];
    this.selectedString += char;

    // Check if word is completed
    if (this.selectedString.length === this.currentWord.length) {
      this.tryCount++;
      if (this.selectedString === this.currentWord) {
        // Correct answer!
        this.correctCount++;
        this.point += this.currentWord.length * 10;
        
        // Increase count in vocabulary stats
        const wordObj = this.words.find(w => w.word === this.currentWord);
        if (wordObj) {
          wordObj.answerCount++;
        }
        this.saveUserData();

        // Run correct animation effect
        this.runCorrectEffect();
      } else {
        // Incorrect answer: flash error, then deselect after a short delay
        this.runIncorrectEffect();
      }
    }
  }

  // Handle backtrack (de-selecting last tile by hovering back to previous)
  backtrackSelection() {
    if (this.selectedPositions.length < 2) return;
    this.selectedPositions = this.selectedPositions.slice(0, -1);
    this.selectedString = this.selectedString.slice(0, -1);
  }

  // Web Speech API TTS helper for pronunciation
  speakWord(word: string) {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'en-US';
        utterance.rate = 0.85; // Clearer for students
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('TTS Speech synthesis failed:', e);
      }
    }
  }

  async runCorrectEffect() {
    this.isCorrectEffectRunning = true;
    
    // TTS Pronunciation
    this.speakWord(this.currentWord);
    
    // Time bonus: +0.5s per letter
    this.remainTime += this.currentWord.length * 0.5;

    // Wait a brief moment to show visual effect & hear TTS
    await new Promise(resolve => setTimeout(resolve, 1000));

    this.isCorrectEffectRunning = false;
    this.startNewQuiz();
  }

  async runIncorrectEffect() {
    // Wait brief moment, then deselect all
    await new Promise(resolve => setTimeout(resolve, 500));
    this.selectedPositions = [];
    this.selectedString = '';
  }

  // Handle quiz timeout
  async triggerQuizTimeout() {
    if (this.isTimeOverProcessing) return;
    this.isTimeOverProcessing = true;
    
    // Wait for mascot animation
    await new Promise(resolve => setTimeout(resolve, 800));
    
    this.startNewQuiz();
    this.isTimeOverProcessing = false;
  }
}

export const game = new GameStore();
