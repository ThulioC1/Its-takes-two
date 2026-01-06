import type { Timestamp } from 'firebase/firestore';

export interface ToDoItem {
    id: string;
    title: string;
    description?: string;
    status: 'Pendente' | 'Em andamento' | 'Concluído';
    creationDate: Timestamp;
    completionDate?: Timestamp | null;
}
