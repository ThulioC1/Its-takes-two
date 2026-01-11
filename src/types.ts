import type { Timestamp } from 'firebase/firestore';

export interface Author {
    uid: string;
    displayName: string;
    photoURL?: string;
    gender?: 'Masculino' | 'Feminino' | 'Prefiro não informar';
}

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    coupleId: string;
    photoURL?: string;
    gender?: 'Masculino' | 'Feminino' | 'Prefiro não informar';
    relationshipStartDate?: string; // Stored as 'YYYY-MM-DD'
    lastWallView?: Timestamp;
}

export interface CoupleDetails {
    memberIds: string[];
    bannerUrl?: string;
    partnerId?: string; // Add this
}

export interface ToDoItem {
    id: string;
    title: string;
    description?: string;
    status: 'Pendente' | 'Concluído';
    creationDate: Timestamp;
    completionDate?: Timestamp | null;
    dueDate?: Timestamp | null;
    author: Author;
}

export interface Expense {
    id: string;
    category: string;
    value: number;
    payer: string; // This can be a UID or a custom name
    date: Timestamp;
    observation?: string;
    author: Author;
}

export interface ImportantDate {
    id: string;
    title: string;
    date: string; // Storing as 'YYYY-MM-DD'
    type: string;
    observation?: string;
    repeat?: 'none' | 'monthly' | 'yearly';
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
    completionDate?: Timestamp | null;
    creationDate: Timestamp;
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
    dateTime: Timestamp;
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

export interface Comment {
    id: string;
    postId: string;
    text: string;
    dateTime: Timestamp;
    author: Author;
}

export interface Review {
    author: Author;
    rating: number;
    comment: string;
}

export interface MovieSeries {
    id: string;
    name: string;
    type: 'Movie' | 'Series';
    platform: string;
    link?: string;
    status: 'To Watch' | 'Watching' | 'Watched';
    dateWatched?: Timestamp | null;
    season?: number | null;
    episode?: number | null;
    author: Author;
    reviews?: Review[];
    creationDate: Timestamp;
}

export interface Game {
    id: string;
    name: string;
    platform: string;
    link?: string; // For cover image
    status: 'Para Jogar' | 'Jogando' | 'Zerado';
    startDate?: Timestamp | null;
    completionDate?: Timestamp | null;
    author: Author;
    reviews?: Review[];
    creationDate: Timestamp;
}
