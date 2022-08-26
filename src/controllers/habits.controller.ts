import { Express, Request, Response } from 'express';
import { HabitsRepository } from '../data/habits.repository';
import { HabitInstance } from '../models/habit-instance.model';
import { Habit, HabitCategory } from '../models/habit.model';


export class HabitsController {

    constructor(private habitRepo: HabitsRepository) {}

    public async getCategories(request: Request, response: Response): Promise<{ categories: HabitCategory[], habits: Habit[] }> {
        const userId = request.user!.id;

        return await this.habitRepo.getCategories(userId);
    }

    public async get(userId: string): Promise<HabitInstance[]> {
        return await this.habitRepo.getUserHabits(userId);
    }
}