import { Habit, HabitCategory, RootCategory } from "./habit.model";

export interface HabitRoot {
    habitDictionary: {[key: string]: Habit};
    categoryDictionary: {[key: string]: HabitCategory};
    root: RootCategory;
}