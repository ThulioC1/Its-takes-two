import type { Timestamp } from 'firebase/firestore';

export interface ToDoItem {
    id: string;
    title: string;
    description?: string;
    status: 'Pendente' | 'Em andamento' | 'Concluído';
    creationDate: Timestamp;
    completionDate?: Timestamp | null;
}

export interface Expense {
    id: string;
    category: string;
    value: number;
    payer: string;
    date: Timestamp;
}

export interface ImportantDate {
    id: string;
    title: string;
    date: string; // Storing as 'YYYY-MM-DD' string
    type: string;
    observation?: string;
}

export interface CoupleGoal {
    id: string;
    title: string;
    description?: string;
    progress: number;
    status: 'Em andamento' | 'Concluído';
    type: string;
}

export interface Memory {
    id: string;
    imageUrl: string;
    description: string;
    date: Timestamp;
    location?: string;
}

export interface LoveLetter {
    id: string;
    userId: string; // UID of the sender
    text: string;
    timestamp: Timestamp;
    sent: boolean;
    scheduled?: boolean;
    scheduledDate?: Timestamp;
}

export interface Post {
    id: string;
    userId: string;
    name: string;
    content: string;
    time: Timestamp;
    likes: string[]; // Array of UIDs
    comments: number; // For simplicity, we'll just count them
}

export interface WatchlistItem {
    id: string;
    name: string;
    type: 'Filme' | 'Série';
    platform: string;
    status: 'to-watch' | 'watching' | 'watched';
    image?: string;
    dateWatched?: Timestamp | null;
}
