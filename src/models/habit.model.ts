export interface HabitCategory {
    id: string;
    name: string;
    habits: Habit[];
    subCategories: HabitCategory[];
}

export interface Habit {
    id: string;
    name: string;
}