export interface HabitCategory extends RootCategory {
    id: string;
    name: string;
    color: string | null;
    parentCategoryId: string | null;
}

export interface Habit {
    id: string;
    name: string;
    parentCategoryId: string | null;
    numInstancesToday: number;
}

export interface RootCategory {
    subCategories: string[];
    habits: string[];
}