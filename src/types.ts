export type UserRole = 'client' | 'plug';

export type TradeType = 'electrician' | 'plumber';

export type FlowStep =
  | 'splash'
  | 'role_selection'
  | 'phone_entry'
  | 'verification_code'
  | 'profile_setup'
  | 'nin_verification'
  | 'liveness_check'
  | 'dashboard';

export interface Booking {
  id: string;
  clientName: string;
  clientPhone: string;
  trade: TradeType;
  description: string;
  status: 'pending' | 'accepted' | 'declined' | 'in_progress' | 'completed';
  location: string;
  price: number;
  createdAt: string;
}

export interface PlugProfile {
  firstName: string;
  lastName: string;
  city: string;
  trade: TradeType;
  photoUrl?: string;
  nin?: string;
  ninVerified: boolean;
  livenessVerified: boolean;
  phone: string;
  rating: number;
  completedJobs: number;
}

export interface ClientProfile {
  firstName: string;
  lastName: string;
  city: string;
  photoUrl?: string;
  phone: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'other';
  text: string;
  timestamp: string;
}
interface JobRequest {
  id: string;
  clientName: string;
  clientPhone: string;
  trade: TradeType;
  description: string;
  location: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}