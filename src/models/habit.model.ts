export interface HabitCategory extends RootCategory {
    id: string;
    name: string;
    parentCategoryId: string | null;
}

export interface Habit {
    id: string;
    name: string;
    parentCategoryId: string | null;
}

export interface RootCategory {
    subCategories: HabitCategory[];
    habits: Habit[];
}