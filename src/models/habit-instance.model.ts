export interface HabitInstance {
    id: string;
    date: Date;
    habitId?: string;
    customName: string;
    notes: string | null;
}