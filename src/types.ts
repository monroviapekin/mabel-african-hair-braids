import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  displayName?: string;
  email: string;
  photoURL?: string;
  role: 'client' | 'admin';
  createdAt: Timestamp;
}

export interface Appointment {
  id: string;
  userId: string;
  serviceId: string;
  serviceName: string;
  stylist: string;
  date: Timestamp;
  status: 'pending' | 'confirmed' | 'cancelled';
  notes?: string;
  createdAt: Timestamp;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  priceRange: string;
  category: 'Braids' | 'Locs' | 'Twists' | 'Other';
  imageUrl?: string;
}

export interface GalleryImage {
  id: string;
  url: string;
  title: string;
  category: string;
}

export interface Message {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: Timestamp;
}
