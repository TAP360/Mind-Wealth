import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

export type PersonalityType =
  | 'Money Vigilance'
  | 'Money Worship'
  | 'Money Status'
  | 'Money Avoidance'
  | 'Money Obligation'
  | null;

export type MoodType = 'great' | 'good' | 'neutral' | 'stressed' | 'anxious';

interface UserProfile {
  name: string;
  email: string;
  personalityType: PersonalityType;
  subscription: 'free' | 'premium' | 'premium_plus';
  joinDate: string;
  wellnessScore: number;
  efiScore: number;
  confidenceScore: number;
}

interface Transaction {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  type: 'expense' | 'income';
  emotionTag?: string;
}

interface Goal {
  id: string;
  title: string;
  target: number;
  current: number;
  icon: string;
  deadline: string;
  color: string;
}

interface AppState {
  hasOnboarded: boolean;
  profile: UserProfile;
  mood: MoodType | null;
  transactions: Transaction[];
  goals: Goal[];
  streak: number;
  nudgesCount: number;
}

interface AppContextValue extends AppState {
  completeOnboarding: (
    personality: PersonalityType,
    name?: string,
  ) => Promise<void>;
  setMood: (mood: MoodType) => void;
  addTransaction: (t: Omit<Transaction, 'id'>) => void;
  updateGoal: (id: string, amount: number) => void;
  addGoal: (g: Omit<Goal, 'id'>) => void;
}

const defaultProfile: UserProfile = {
  name: 'Ahmed',
  email: 'ahmed@example.com',
  personalityType: null,
  subscription: 'free',
  joinDate: 'Jan 2025',
  wellnessScore: 72,
  efiScore: 68,
  confidenceScore: 75,
};

const defaultTransactions: Transaction[] = [
  {
    id: '1',
    title: 'Morning Coffee',
    category: 'Food & Drink',
    amount: -85,
    date: 'Today',
    type: 'expense',
    emotionTag: 'routine',
  },
  {
    id: '2',
    title: 'Salary Deposit',
    category: 'Income',
    amount: 15000,
    date: 'Yesterday',
    type: 'income',
  },
  {
    id: '3',
    title: 'Online Shopping',
    category: 'Shopping',
    amount: -420,
    date: '2 days ago',
    type: 'expense',
    emotionTag: 'impulse',
  },
  {
    id: '4',
    title: 'Gym Membership',
    category: 'Health',
    amount: -200,
    date: '3 days ago',
    type: 'expense',
    emotionTag: 'planned',
  },
  {
    id: '5',
    title: 'Freelance Payment',
    category: 'Income',
    amount: 3500,
    date: '4 days ago',
    type: 'income',
  },
];

const defaultGoals: Goal[] = [
  {
    id: '1',
    title: 'Emergency Fund',
    target: 30000,
    current: 18500,
    icon: 'shield',
    deadline: 'Dec 2025',
    color: '#22C55E',
  },
  {
    id: '2',
    title: 'New Car',
    target: 120000,
    current: 45000,
    icon: 'car',
    deadline: 'Jun 2026',
    color: '#2E3192',
  },
  {
    id: '3',
    title: 'Travel Fund',
    target: 15000,
    current: 8200,
    icon: 'airplane',
    deadline: 'Mar 2026',
    color: '#F37021',
  },
  {
    id: '4',
    title: 'Education',
    target: 50000,
    current: 12000,
    icon: 'book',
    deadline: 'Sep 2026',
    color: '#92278F',
  },
];

const defaultState: AppState = {
  hasOnboarded: false,
  profile: defaultProfile,
  mood: null,
  transactions: defaultTransactions,
  goals: defaultGoals,
  streak: 12,
  nudgesCount: 3,
};

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_KEY = '@mindwealth_state';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadState();
  }, []);

  const loadState = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<AppState>;
        setState((prev) => ({ ...prev, ...saved }));
      }
    } catch {
    } finally {
      setLoaded(true);
    }
  };

  const saveState = async (newState: AppState) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          hasOnboarded: newState.hasOnboarded,
          profile: newState.profile,
          goals: newState.goals,
          streak: newState.streak,
        }),
      );
    } catch {}
  };

  const completeOnboarding = useCallback(
    async (personality: PersonalityType, name?: string) => {
      setState((prev) => {
        const next: AppState = {
          ...prev,
          hasOnboarded: true,
          profile: {
            ...prev.profile,
            personalityType: personality,
            name: name ?? prev.profile.name,
          },
        };
        saveState(next);
        return next;
      });
    },
    [],
  );

  const setMood = useCallback((mood: MoodType) => {
    setState((prev) => ({ ...prev, mood }));
  }, []);

  const addTransaction = useCallback((t: Omit<Transaction, 'id'>) => {
    const tx: Transaction = {
      ...t,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
    };
    setState((prev) => ({
      ...prev,
      transactions: [tx, ...prev.transactions],
    }));
  }, []);

  const updateGoal = useCallback((id: string, amount: number) => {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((g) =>
        g.id === id
          ? { ...g, current: Math.min(g.current + amount, g.target) }
          : g,
      ),
    }));
  }, []);

  const addGoal = useCallback((g: Omit<Goal, 'id'>) => {
    const goal: Goal = {
      ...g,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
    };
    setState((prev) => ({ ...prev, goals: [...prev.goals, goal] }));
  }, []);

  if (!loaded) return null;

  return (
    <AppContext.Provider
      value={{
        ...state,
        completeOnboarding,
        setMood,
        addTransaction,
        updateGoal,
        addGoal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
