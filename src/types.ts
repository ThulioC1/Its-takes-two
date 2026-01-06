import type { Timestamp } from 'firebase/firestore';

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    coupleId: string;
}

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
    payer: string; // This is the UID of the user who paid
    date: Timestamp;
    observation?: string;
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
    image: string;
    description: string;
    date: Timestamp;
    location?: string;
}

export interface LoveLetter {
    id: string;
    senderId: string; // UID of the sender
    recipientId: string; // UID of the recipient
    message: string;
    scheduledDate: Timestamp;
    isVisible: boolean;
    timestamp: Timestamp; // Redundant? scheduledDate could be used
}

export interface Post {
    id: string;
    userId: string; // UID of the author
    name: string; // display name of the author
    text: string;
    dateTime: Timestamp;
    likes: string[]; // Array of UIDs
    comments: number; // For simplicity, we'll just count them
}

export interface MovieSeries {
    id: string;
    name: string;
    type: 'Movie' | 'Series';
    platform: string;
    link?: string;
    status: 'To Watch' | 'Watching' | 'Watched';
    dateWatched?: Timestamp | null;
}
