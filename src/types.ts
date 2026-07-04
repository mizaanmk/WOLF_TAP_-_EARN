export interface TapParticle {
  id: number;
  startX: number;
  startY: number;
  offsetX: number;
  rotationDirection: number;
  value: string;
  type: 'text' | 'coin' | 'sparkle';
}

export interface Milestone {
  id: string;
  name: string;
  requirement: number;
  reward: number;
  description: string;
  type: 'taps' | 'coins';
}

export interface WorthCardRequest {
  id: string;
  userId: string;
  username: string;
  cardId: string;
  cardName: string;
  value: number; // e.g. 500
  cost: number;  // e.g. 1000000
  handle: string; // user input UPI/Address
  status: 'Processing' | 'Dispatched';
  timestamp: number;
}

export const MILESTONES: Milestone[] = [
  { id: 'taps_100', name: 'Lone Wolf scout', requirement: 100, reward: 500, description: 'Hit the sacred wolf button 100 times', type: 'taps' },
  { id: 'taps_500', name: 'Alphas Vanguard', requirement: 500, reward: 2500, description: 'Complete 500 precision taps', type: 'taps' },
  { id: 'taps_2500', name: 'Apex Pack Leader', requirement: 2500, reward: 15000, description: 'Master 2,500 taps with standard speed', type: 'taps' },
  { id: 'coins_10000', name: 'Cyber Fortune King', requirement: 10000, reward: 5000, description: 'Collect a total of 10,000 active coins', type: 'coins' },
  { id: 'coins_50000', name: 'Vault Overlord', requirement: 50000, reward: 25000, description: 'Amass a heavy vault of 50,000 active coins', type: 'coins' }
];
