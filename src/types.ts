import meluzaImg from './assets/images/meluza_1780775025973.png';
import schoolbianImg from './assets/images/schoolbian_1780775040988.png';
import catfishImg from './assets/images/catfish_1780775056502.png';

export interface User {
  telegram_id: string;
  name?: string;
  phone?: string;
  bankName?: string;
  accountNumber?: string;
  walletBalance: number;
  referralCode: string;
  referredBy?: string | null;
  streakCount: number;
  level: 'Beginner Farmer' | 'Farmer' | 'Pro Farmer' | 'Master Farmer';
  points: number;
  lastCheckIn?: string | null;
  virtualAccountNumber: string;
  createdAt: string;
  status?: string;
}

export type FishType = string;

export interface FishSpecs {
  name: string;
  displayName: string;
  price: number;
  weeklyProfit: number;
  dailyProfit: number;
  color: string;
  image: string;
}

export interface FishHolding {
  id: string;
  userId: string;
  fishType: FishType;
  quantity: number;
  stakedDay: string;
  stakedAt: string;
  cycleId: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdraw' | 'buy' | 'referral';
  amount: number;
  status: 'Paid' | 'Pending' | 'Failed';
  createdAt: string;
}

export const FISH_SPECS: Record<FishType, FishSpecs> = {
  meluza: {
    name: 'meluza',
    displayName: 'Meluza',
    price: 1500,
    weeklyProfit: 300,
    dailyProfit: 50,
    color: '#38bdf8', // sky blue
    image: meluzaImg
  },
  schoolbian: {
    name: 'schoolbian',
    displayName: 'Schoolbian',
    price: 3500,
    weeklyProfit: 700,
    dailyProfit: 116.67,
    color: '#4ade80', // green
    image: schoolbianImg
  },
  catfish: {
    name: 'catfish',
    displayName: 'Catfish',
    price: 7000,
    weeklyProfit: 1400,
    dailyProfit: 233.33,
    color: '#fb923c', // orange
    image: catfishImg
  },
};

export const LEVEL_RULES = [
  { level: 'Master Farmer', minStaked: 200000, color: '#ec4899', emoji: '👑' },
  { level: 'Pro Farmer', minStaked: 50000, color: '#a855f7', emoji: '🔱' },
  { level: 'Farmer', minStaked: 10000, color: '#3b82f6', emoji: '🧑‍🌾' },
  { level: 'Beginner Farmer', minStaked: 0, color: '#6b7280', emoji: '🌱' },
] as const;
