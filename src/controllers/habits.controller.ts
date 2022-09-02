import { Express, Request, response, Response } from 'express';
import { HabitsRepository } from '../data/habits.repository';
import { HabitInstance } from '../models/habit-instance.model';
import { Habit, HabitCategory } from '../models/habit.model';


export class HabitsController {

    constructor(private habitRepo: HabitsRepository) {
        this.getCategories = this.getCategories.bind(this);
        this.get = this.get.bind(this);
        this.createHabit = this.createHabit.bind(this);
        this.createCategory = this.createCategory.bind(this);
    }

    public async getCategories(request: Request, response: Response): Promise<void> {
        const userId = request.user!.id;

        try {
            const categories = await this.habitRepo.getCategories(userId);
            response.send(categories);
        }
        catch (ex) {
            console.error("Error retrieving categories", ex);
            response.status(500)
                .send();
        }
    }

    public async get(userId: string): Promise<void> {
        try {
            const habits = await this.habitRepo.getUserHabits(userId);
            response.send(habits);
        }
        catch (ex) {
            console.error("Error retrieving habit instances.", ex);
            response.status(500)
                .send();
        }
    }

    public async createHabit(request: Request, response: Response): Promise<void> {

        const habit: Habit = request.body;
        console.log("query", request.query);
        const categoryId: string | undefined = <string>request.query.categoryId;

        try {
            const newHabit = await this.habitRepo.createHabit(habit, request.user!.id);
            response.send(newHabit);
        }
        catch (ex) {
            console.error("Error creating habit", ex);
            response.status(500)
                .send();
        }
    }

    public async createCategory(request: Request, response: Response): Promise<void> {

        const category: HabitCategory = request.body;

        try {
            const newCategory = await this.habitRepo.createCategory(category, request.user!.id);
            response.send(newCategory);
        }
        catch (ex) {
            console.error("Error creating habit category", ex);
            response.status(500)
                .send();
        }
    }
}