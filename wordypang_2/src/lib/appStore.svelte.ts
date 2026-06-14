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

import { db } from './db';
import { collection, doc, setDoc, onSnapshot, updateDoc, query } from 'firebase/firestore';

class AppStore {
  currentScene = $state<AppScene>('register');
  user = $state<UserProfile | null>(null);
  allUsers = $state<UserProfile[]>([]);
  globalNotice = $state<string>('');
  isLoaded = $state<boolean>(false);

  constructor() {
    this.loadUsers();
  }

  loadUsers() {
    try {
      const q = query(collection(db, "users"));
      onSnapshot(q, (querySnapshot) => {
        const users: UserProfile[] = [];
        querySnapshot.forEach((doc) => {
          users.push(doc.data() as UserProfile);
        });
        this.allUsers = users;
        this.isLoaded = true;
        
        if (this.user) {
          const updatedMe = users.find(u => u.nickname === this.user?.nickname);
          if (updatedMe) {
            this.user = updatedMe;
          }
        }
      });
      this.currentScene = 'register';
    } catch (e) {
      console.error('Failed to load users from Firebase', e);
      this.allUsers = [];
      this.currentScene = 'register';
    }
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

  async registerUser(nickname: string, pin: string, avatarImage: string) {
    const newUser: UserProfile = {
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
    
    try {
      await setDoc(doc(db, "users", nickname), newUser);
      this.user = newUser;
      this.currentScene = 'lobby';
    } catch(e) {
      console.error('Error registering user:', e);
      alert('회원가입 중 오류가 발생했습니다.');
    }
  }

  async updateWordyPang2Stats(score: number, wordsCleared: number) {
    if (this.user) {
      let updated = false;
      if (score > this.user.stats.wordyPang2HighScore) {
        this.user.stats.wordyPang2HighScore = score;
        updated = true;
      }
      this.user.stats.wordyPang2WordsCleared += wordsCleared;
      
      await updateDoc(doc(db, "users", this.user.nickname), {
        "stats.wordyPang2HighScore": this.user.stats.wordyPang2HighScore,
        "stats.wordyPang2WordsCleared": this.user.stats.wordyPang2WordsCleared
      });
    }
  }

  async updateDodgePoopStats(score: number) {
    if (this.user) {
      if (score > this.user.stats.dodgePoopHighScore) {
        this.user.stats.dodgePoopHighScore = score;
        await updateDoc(doc(db, "users", this.user.nickname), {
          "stats.dodgePoopHighScore": score
        });
      }
    }
  }

  async updateWordChainStats(score: number) {
    if (this.user) {
      if (score > this.user.stats.wordChainHighScore) {
        this.user.stats.wordChainHighScore = score;
        await updateDoc(doc(db, "users", this.user.nickname), {
          "stats.wordChainHighScore": score
        });
      }
    }
  }

  async updateWordyPangDropStats(score: number) {
    if (this.user) {
      if (score > this.user.stats.wordyPangDropHighScore) {
        this.user.stats.wordyPangDropHighScore = score;
        await updateDoc(doc(db, "users", this.user.nickname), {
          "stats.wordyPangDropHighScore": score
        });
      }
    }
  }

  async updateBlockBlastStats(score: number) {
    if (this.user) {
      if (score > this.user.stats.blockBlastHighScore) {
        this.user.stats.blockBlastHighScore = score;
        await updateDoc(doc(db, "users", this.user.nickname), {
          "stats.blockBlastHighScore": score
        });
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
