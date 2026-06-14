export type AppScene = 'register' | 'lobby' | 'wordypang2' | 'dodgepoop' | 'wordchain' | 'wordypangdrop' | 'blockblast';

export interface UserProfile {
  nickname: string;
  pin: string;
  avatarImage: string; // Base64 or Blob URL of the created face avatar
  stats: {
    wordyPang2HighScore: number;
    wordyPang2WordsCleared: number;
    dodgePoopHighScore: number;
    wordChainHighScore: number;
    wordyPangDropHighScore: number;
    blockBlastHighScore: number;
  };
}

class AppStore {
  currentScene = $state<AppScene>('register');
  user = $state<UserProfile | null>(null);
  allUsers = $state<UserProfile[]>([]);
  globalNotice = $state<string>('');

  constructor() {
    this.loadUsers();
  }

  loadUsers() {
    try {
      const savedUsers = localStorage.getItem('wordy_portal_users');
      if (savedUsers) {
        let parsed = JSON.parse(savedUsers);
        if (Array.isArray(parsed)) {
          this.allUsers = parsed;
        }
      } else {
        // Fallback migration for single user
        const oldUser = localStorage.getItem('wordy_portal_user');
        if (oldUser) {
          const parsed = JSON.parse(oldUser);
          if (parsed) {
            this.allUsers = [parsed];
            this.saveUsers();
            localStorage.removeItem('wordy_portal_user');
          }
        }
      }
      
      // Ensure all users have stats
      this.allUsers.forEach(u => {
        if (!u.stats) {
          u.stats = { 
            wordyPang2HighScore: 0, 
            wordyPang2WordsCleared: 0, 
            dodgePoopHighScore: 0,
            wordChainHighScore: 0,
            wordyPangDropHighScore: 0,
            blockBlastHighScore: 0
          };
        } else {
          if (u.stats.dodgePoopHighScore === undefined) u.stats.dodgePoopHighScore = 0;
          if (u.stats.wordChainHighScore === undefined) u.stats.wordChainHighScore = 0;
          if (u.stats.wordyPangDropHighScore === undefined) u.stats.wordyPangDropHighScore = 0;
          if (u.stats.blockBlastHighScore === undefined) u.stats.blockBlastHighScore = 0;
        }
      });

      this.currentScene = 'register'; // Always start at register/login screen
    } catch (e) {
      console.error('Failed to load users', e);
      this.allUsers = [];
      this.currentScene = 'register';
    }
  }

  saveUsers() {
    localStorage.setItem('wordy_portal_users', JSON.stringify(this.allUsers));
  }

  loginUser(nickname: string, pin: string): boolean {
    const found = this.allUsers.find(u => u.nickname === nickname && u.pin === pin);
    if (found) {
      this.user = found;
      this.currentScene = 'lobby';
      return true;
    }
    return false;
  }

  registerUser(nickname: string, pin: string, avatarImage: string) {
    const newUser = {
      nickname,
      pin,
      avatarImage,
      stats: {
        wordyPang2HighScore: 0,
        wordyPang2WordsCleared: 0,
        dodgePoopHighScore: 0,
        wordChainHighScore: 0,
        wordyPangDropHighScore: 0,
        blockBlastHighScore: 0,
      }
    };
    this.allUsers.push(newUser);
    this.user = newUser;
    this.saveUsers();
    this.currentScene = 'lobby';
  }

  updateWordyPang2Stats(score: number, wordsCleared: number) {
    if (this.user) {
      if (score > this.user.stats.wordyPang2HighScore) {
        this.user.stats.wordyPang2HighScore = score;
      }
      this.user.stats.wordyPang2WordsCleared += wordsCleared;
      
      // Update in allUsers array to keep ref sync (should be same obj, but to be safe)
      const idx = this.allUsers.findIndex(u => u.nickname === this.user!.nickname);
      if (idx !== -1) this.allUsers[idx] = this.user;
      
      this.saveUsers();
    }
  }

  updateDodgePoopStats(score: number) {
    if (this.user) {
      if (score > this.user.stats.dodgePoopHighScore) {
        this.user.stats.dodgePoopHighScore = score;
        
        const idx = this.allUsers.findIndex(u => u.nickname === this.user!.nickname);
        if (idx !== -1) this.allUsers[idx] = this.user;
        
        this.saveUsers();
      }
    }
  }

  logout() {
    this.user = null;
    this.currentScene = 'register';
  }

  // Getters for High Scores
  getTopScorerWordyPang2() {
    if (this.allUsers.length === 0) return null;
    return this.allUsers.reduce((prev, current) => 
      (current.stats.wordyPang2HighScore > prev.stats.wordyPang2HighScore) ? current : prev
    );
  }

  getTopScorerDodgePoop() {
    if (this.allUsers.length === 0) return null;
    return this.allUsers.reduce((prev, current) => 
      (current.stats.dodgePoopHighScore > prev.stats.dodgePoopHighScore) ? current : prev
    );
  }

  getTopScorerWordChain() {
    if (this.allUsers.length === 0) return null;
    return this.allUsers.reduce((prev, current) => 
      (current.stats.wordChainHighScore > prev.stats.wordChainHighScore) ? current : prev
    );
  }

  getTopScorerWordyPangDrop() {
    if (this.allUsers.length === 0) return null;
    return this.allUsers.reduce((prev, current) => 
      (current.stats.wordyPangDropHighScore > prev.stats.wordyPangDropHighScore) ? current : prev
    );
  }

  getTopScorerBlockBlast() {
    if (this.allUsers.length === 0) return null;
    return this.allUsers.reduce((prev, current) => 
      (current.stats.blockBlastHighScore > prev.stats.blockBlastHighScore) ? current : prev
    );
  }
}

export const appState = new AppStore();
