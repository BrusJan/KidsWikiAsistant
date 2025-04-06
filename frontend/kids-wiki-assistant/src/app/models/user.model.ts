export interface UserData {
  email: string;
  subscriptionStatus: 'free' | 'premium' | 'cancelled';
  stripeCustomerId?: string;
  lastLoginAt?: string;
  createdAt?: string;
  apiCallsUsed?: number;
}