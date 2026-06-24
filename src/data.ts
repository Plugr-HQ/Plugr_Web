import { PlugProfile, Booking } from './types';

export const MOCK_PLUGS: PlugProfile[] = [
  {
    firstName: "Chidi",
    lastName: "Okonkwo",
    city: "Lagos",
    trade: "electrician",
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300&h=300",
    nin: "4829 1938 128",
    ninVerified: true,
    livenessVerified: true,
    phone: "+234 803 111 2222",
    rating: 4.9,
    completedJobs: 142
  },
  {
    firstName: "Amina",
    lastName: "Yusuf",
    city: "Abuja",
    trade: "electrician",
    photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300&h=300",
    nin: "9021 3812 743",
    ninVerified: true,
    livenessVerified: true,
    phone: "+234 812 333 4444",
    rating: 4.8,
    completedJobs: 98
  },
  {
    firstName: "Tunde",
    lastName: "Bakare",
    city: "Lagos",
    trade: "plumber",
    photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300&h=300",
    nin: "1234 5678 901",
    ninVerified: true,
    livenessVerified: true,
    phone: "+234 905 555 6666",
    rating: 4.7,
    completedJobs: 215
  },
  {
    firstName: "Nneka",
    lastName: "Eze",
    city: "Port Harcourt",
    trade: "plumber",
    photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300&h=300",
    nin: "7531 5942 680",
    ninVerified: true,
    livenessVerified: true,
    phone: "+234 703 777 8888",
    rating: 4.9,
    completedJobs: 84
  },
  {
    firstName: "Emeka",
    lastName: "Nwachukwu",
    city: "Ibadan",
    trade: "electrician",
    photoUrl: "https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&q=80&w=300&h=300",
    nin: "8841 9502 113",
    ninVerified: true,
    livenessVerified: true,
    phone: "+234 818 999 0000",
    rating: 4.6,
    completedJobs: 110
  },
  {
    firstName: "Fatima",
    lastName: "Bello",
    city: "Abuja",
    trade: "plumber",
    photoUrl: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=300&h=300",
    nin: "3679 2814 550",
    ninVerified: true,
    livenessVerified: true,
    phone: "+234 809 222 1111",
    rating: 4.7,
    completedJobs: 73
  }
];

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: "B-8349",
    clientName: "Kunle Adebayo",
    clientPhone: "+234 802 999 8888",
    trade: "electrician",
    description: "Distribution board tripping and sparkling whenever the AC is switched on.",
    status: "pending",
    location: "Ikeja, Lagos",
    price: 15000,
    createdAt: "Just now"
  },
  {
    id: "B-7721",
    clientName: "Sarah Alabi",
    clientPhone: "+234 901 123 4567",
    trade: "plumber",
    description: "Kitchen undersink pipe leaking and water flowing into the living room.",
    status: "pending",
    location: "Maitama, Abuja",
    price: 12000,
    createdAt: "20 minutes ago"
  }
];

export const FAQ_LIST = [
  {
    q: "How does NIN verification work?",
    a: "Your National Identity Number (NIN) is verified directly against the NIMC database to confirm your identity, building instant trust with clients."
  },
  {
    q: "What is a Liveness Check?",
    a: "A 3D facial scan to ensure that the individual creating the account is truly matching the identity provided, preventing identity theft."
  },
  {
    q: "When do I get paid?",
    a: "Clients pay into a secure escrow. Once jobs are completed and confirmed, your earnings are instantly available in your digital wallet."
  }
];
