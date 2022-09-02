import { Observable } from "rxjs";
import { HabitInstance } from "../models/habit-instance.model";
import { Habit, HabitCategory, RootCategory } from "../models/habit.model";
import { AppDAO } from "./app-dao";
import { v4 as newUUID} from 'uuid';

interface DataHabitCategory {
    id: number;
    guid: string;
    name: string;
    parentId: string | null
}

interface DataHabit {
    id: number;
    guid: string;
    name: string;
    categoryId: string | null;
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
                H.Name AS name,
                HC.HabitCategoryGuid AS categoryId
            FROM Habit H
                JOIN User U
                    ON H.UserId = H.UserId
                LEFT JOIN HabitCategory HC
                    ON H.HabitCategoryId = HC.HabitCategoryId
                        AND HC.IsDeleted = 0
            WHERE U.UserGuid = $userId
                AND H.IsDeleted = 0
                AND U.IsDeleted = 0;
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
                Parent.HabitCategoryGuid AS parentId
            FROM HabitCategory HC
                JOIN User U
                    ON HC.UserId = U.UserId
                LEFT JOIN HabitCategory Parent
                    ON HC.ParentCategoryId = Parent.HabitCategoryId
                        AND Parent.IsDeleted = 0
            WHERE U.UserGuid = $userId
                AND HC.IsDeleted = 0
                AND U.IsDeleted = 0;
        `;
        return this.dao.all<DataHabitCategory>(sql, { $userId: userId });
    }

    private organizeCategories(categories: DataHabitCategory[], habits: DataHabit[]): RootCategory {
        const castCategories: HabitCategory[] = categories.map(x => ({
            id: x.guid,
            name: x.name,
            parentCategoryId: x.parentId,
            habits: [],
            subCategories: []
        }));
        const castCategoryDict: { [key: string]: HabitCategory } = {};
        for (let category of castCategories)
            castCategoryDict[category.id] = category;

        // const guidMap: { [key: number]: string } = {};
        // for (let category of categories) {
        //     guidMap[category.id] = category.guid;
        // }

        const rootCategories: HabitCategory[] = [];

        for (let category of categories) {
            if (category.parentId === null)
                rootCategories.push(castCategoryDict[category.guid]);
            else {
                castCategoryDict[category.parentId].subCategories.push(castCategoryDict[category.guid])
            }
        }

        const rootHabits: Habit[] = [];

        for (let habit of habits) {
            const castHabit: Habit = {
                id: habit.guid,
                name: habit.name,
                parentCategoryId: null
            };
            if (habit.categoryId !== null && habit.categoryId in castCategoryDict) {
                castHabit.parentCategoryId = habit.categoryId;
                castCategoryDict[habit.categoryId].habits.push(castHabit);
            }
            else
                rootHabits.push(castHabit);
        }

        return {
            subCategories: rootCategories,
            habits: rootHabits
        };
    }

    public async createHabit(habit: Habit, userId: string): Promise<Habit> {
        const sql = `
            INSERT INTO Habit (
                HabitGuid
                , Name
                , HabitCategoryId
                , UserId
            )
            VALUES (
                $guid
                , $name
                , (
                    SELECT HC.HabitCategoryId
                    FROM HabitCategory HC
                        JOIN User U
                            ON HC.UserId = U.UserId
                    WHERE HC.HabitCategoryGuid = $categoryId
                        AND U.UserGuid = $userId
                        AND HC.IsDeleted = 0
                )
                , (
                    SELECT U.UserId
                    FROM User U
                    WHERE U.UserGuid = $userId
                        AND U.IsDeleted = 0
                )
            )
        `;
        const uuid = newUUID();
        console.log("Inserting habit");
        await this.dao.run(sql, {
            "$guid": uuid,
            "$name": habit.name,
            "$userId": userId,
            "$categoryId": habit.parentCategoryId ?? ''
        });
        
        return {
            ...habit,
            id: uuid
        };
    }

    public async createCategory(category: HabitCategory, userId: string): Promise<HabitCategory> {
        const sql = `
            INSERT INTO HabitCategory (
                HabitCategoryGuid
                , Name
                , UserId
                , ParentCategoryId
            )
            VALUES (
                $guid
                , $name
                , (
                    SELECT U.UserId
                    FROM User U
                    WHERE U.UserGuid = $userId
                        AND U.IsDeleted = 0
                )
                , (
                    SELECT HC.HabitCategoryId
                    FROM HabitCategory HC
                    WHERE HC.HabitCategoryGuid = $parentCategoryId
                        AND HC.IsDeleted = 0
                )
            );
        `;
        const id = newUUID();
        await this.dao.run(sql, {
            '$guid': id,
            '$name': category.name,
            '$userId': userId,
            '$parentCategoryId': category.parentCategoryId ?? ''
        });
        return {
            ...category,
            id: id,
            habits: [],
            subCategories: []
        };
    }
}