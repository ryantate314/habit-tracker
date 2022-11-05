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
        this.logInstance = this.logInstance.bind(this);
        this.getInstances = this.getInstances.bind(this);
        this.deleteLastInstance = this.deleteLastInstance.bind(this);
        this.deleteHabit = this.deleteHabit.bind(this);
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

    public async logInstance(request: Request, response: Response): Promise<void> {
        const instance: HabitInstance = request.body;

        try {
            await this.habitRepo.logInstance(instance);
            response.send();
        }
        catch (ex) {
            console.error("Error creating habit instance", ex);
            response.status(500)
                .send();
        }
    }

    public async getInstances(request: Request, response: Response): Promise<void> {
        if (!request.query.startDate || !request.query.endDate) {
            response.status(400)
                .send();
            return;
        }
            
        const userId = request.user!.id;
        const startDate = new Date(request.query.startDate!.toString());
        const endDate = new Date(request.query.endDate!.toString());

        try {
            console.log("Getting instances from " + startDate + " to " + endDate);
            const instances = await this.habitRepo.getInstances(userId, startDate, endDate);
            response.send(instances);
        }
        catch (ex) {
            console.error(`Error getting habit instances for user ${userId}`, ex);
            response.status(500)
                .send();
        }
    }

    public async deleteLastInstance(request: Request, response: Response): Promise<void> {
        const habitId = request.query.habitId?.toString();

        if (!habitId) {
            response.status(400)
                .send();
            return;
        }

        try {
            await this.habitRepo.deleteLastInstance(habitId);
            response.send();
        }
        catch (ex) {
            console.error(`Error deleting last habit instance for habit ${habitId}`, ex);
            response.status(500)
                .send();
        }
    }

    public async deleteHabit(request: Request, response: Response): Promise<void> {
        const habitId = request.query.habitId?.toString();

        if (!habitId) {
            response.status(400)
                .send();
            return;
        }

        try {
            await this.habitRepo.deleteHabit(habitId);
            response.send();
        }
        catch (ex) {
            console.error(`Error deleting habit ${habitId}`, ex);
            response.status(500)
                .send();
        }
    }
}