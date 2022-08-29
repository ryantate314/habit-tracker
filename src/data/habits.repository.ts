import { Observable } from "rxjs";
import { HabitInstance } from "../models/habit-instance.model";
import { Habit, HabitCategory, RootCategory } from "../models/habit.model";
import { AppDAO } from "./app-dao";
import { v4 as newUUID} from 'uuid';

interface DataHabitCategory {
    id: number;
    guid: string;
    name: string;
    parentId: number | null;
}

interface DataHabit {
    id: number;
    guid: string;
    name: string;
    categoryId: number | null;
}

export class HabitsRepository {
    

    constructor(private dao: AppDAO) {}

    public async getUserHabits(userId: string, category?: string, startDate?: Date, endDate?: Date): Promise<HabitInstance[]> {
        return [];
    }

    private async getHabits_(userId: string): Promise<DataHabit[]> {
        const sql = `
            SELECT
                H.HabitId AS id,
                H.HabitGuid AS guid,
                H.Name AS Name,
                H.HabitCategoryId AS categoryId
            FROM Habit H
                JOIN User U
                    ON H.UserId = H.UserId
            WHERE U.UserGuid = $userId
                AND H.IsDeleted = 0;
        `;
        return this.dao.all<DataHabit>(sql, { $userId: userId });
    }

    public async getCategories(userId: string): Promise<RootCategory> {
        const categories = await this.getCategories_(userId);
        const habits = await this.getHabits_(userId);

        return this.organizeCategories(categories, habits);
    }

    private async getCategories_(userId: string): Promise<DataHabitCategory[]> {
        const sql = `
            SELECT
                HC.HabitCategoryId AS id,
                HC.HabitCategoryGuid AS guid,
                HC.Name AS name,
                HC.ParentCategoryId AS parentId
            FROM HabitCategory HC
                JOIN User U
                    ON HC.UserId = U.UserId
            WHERE U.UserGuid = $userId
                AND HC.IsDeleted = 0;
        `;
        return this.dao.all<DataHabitCategory>(sql, { $userId: userId });
    }

    private organizeCategories(categories: DataHabitCategory[], habits: DataHabit[]): RootCategory {
        const castCategories: HabitCategory[] = categories.map(x => ({
            id: x.guid,
            name: x.name,
            habits: [],
            subCategories: []
        }));
        const castCategoryDict: { [key: string]: HabitCategory } = {};
        for (let category of castCategories)
            castCategoryDict[category.id] = category;

        const guidMap: { [key: number]: string } = {};
        for (let category of categories) {
            guidMap[category.id] = category.guid;
        }

        const rootCategories: HabitCategory[] = [];

        for (let category of categories) {
            if (category.parentId === null)
                rootCategories.push(castCategoryDict[category.guid]);
            else {
                castCategoryDict[guidMap[category.parentId]].subCategories.push(castCategoryDict[category.guid])
            }
        }

        const rootHabits: Habit[] = [];

        for (let habit of habits) {
            const castHabit: Habit = {
                id: habit.guid,
                name: habit.name
            };
            if (habit.categoryId !== null)
                castCategoryDict[guidMap[habit.categoryId]].habits.push(castHabit);
            else
                rootHabits.push(castHabit);
        }

        return {
            subCategories: rootCategories,
            habits: rootHabits
        };
    }

    public async createHabit(habit: Habit): Promise<Habit> {
        const sql = `
            INSERT INTO Habit (
                HabitGuid
                , Name
            )
            VALUES (
                $guid
                , $name
            )
        `;
        const uuid = newUUID();
        console.log("Inserting habit");
        await this.dao.run(sql, { "$guid": uuid, "$name": habit.name });
        
        return {
            ...habit,
            id: uuid
        };
    }
}