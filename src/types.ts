import type { Timestamp } from 'firebase/firestore';

export interface Author {
    uid: string;
    displayName: string;
}

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
    author: Author;
}

export interface Expense {
    id: string;
    category: string;
    value: number;
    payer: string; // This is the UID of the user who paid
    date: Timestamp;
    observation?: string;
    author: Author;
}

export interface ImportantDate {
    id: string;
    title: string;
    date: string; // Storing as 'YYYY-MM-DD' string
    type: string;
    observation?: string;
    author: Author;
}

export interface CoupleGoal {
    id: string;
    title: string;
    description?: string;
    progress: number;
    status: 'Em andamento' | 'Concluído';
    type: string;
    author: Author;
}

export interface Memory {
    id: string;
    image: string;
    description: string;
    date: Timestamp;
    location?: string;
    author: Author;
}

export interface LoveLetter {
    id: string;
    senderId: string; // UID of the sender
    recipientId: string; // UID of the recipient
    message: string;
    scheduledDate: Timestamp;
    isVisible: boolean;
    timestamp: Timestamp; // Redundant? scheduledDate could be used
    author: Author;
}

export interface Post {
    id: string;
    text: string;
    dateTime: Timestamp;
    likes: string[]; // Array of UIDs
    comments: number; // For simplicity, we'll just count them
    author: Author;
}

export interface MovieSeries {
    id: string;
    name: string;
    type: 'Movie' | 'Series';
    platform: string;
    link?: string;
    status: 'To Watch' | 'Watching' | 'Watched';
    dateWatched?: Timestamp | null;
    author: Author;
}
