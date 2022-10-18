import { Observable } from "rxjs";
import { HabitInstance } from "../models/habit-instance.model";
import { Habit, HabitCategory, RootCategory } from "../models/habit.model";
import { AppDAO } from "./app-dao";
import { v4 as newUUID} from 'uuid';
import { HabitRoot } from "../models/habit-root.model";

interface DataHabitCategory {
    id: number;
    guid: string;
    name: string;
    color: string | null;
    parentId: string | null;
}

interface DataHabit {
    id: number;
    guid: string;
    name: string;
    categoryId: string | null;
    numInstancesToday: number;
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
                HC.HabitCategoryGuid AS categoryId,
                (
                    SELECT
                        COUNT(1)
                    FROM HabitInstance HI
                    WHERE H.HabitId = HI.HabitId
                        AND DATE(HI.InstanceDate) = DATE(CURRENT_TIMESTAMP)
                        AND HI.IsDeleted = 0
                ) AS numInstancesToday
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

    public async getCategories(userId: string): Promise<HabitRoot> {
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

    private organizeCategories(categories: DataHabitCategory[], habits: DataHabit[]): HabitRoot {
        const castCategories: HabitCategory[] = categories.map(x => ({
            id: x.guid,
            name: x.name,
            color: x.color,
            parentCategoryId: x.parentId,
            habits: [],
            subCategories: []
        }));
        const castCategoryDict: { [key: string]: HabitCategory } = {};
        for (let category of castCategories)
            castCategoryDict[category.id] = category;

        const rootCategories: HabitCategory[] = [];

        for (let category of categories) {
            // Categories at the root level
            if (category.parentId === null)
                rootCategories.push(castCategoryDict[category.guid]);
            else {
                castCategoryDict[category.parentId].subCategories.push(category.guid)
            }
        }

        const rootHabits: Habit[] = [];
        const habitDictionary: {[key: string]: Habit} = {};

        for (let habit of habits) {
            const castHabit: Habit = {
                id: habit.guid,
                name: habit.name,
                numInstancesToday: habit.numInstancesToday,
                parentCategoryId: null
            };
            habitDictionary[castHabit.id] = castHabit;
            if (habit.categoryId !== null && habit.categoryId in castCategoryDict) {
                castHabit.parentCategoryId = habit.categoryId;
                castCategoryDict[habit.categoryId].habits.push(castHabit.id);
            }
            else
                rootHabits.push(castHabit);
        }

        return {
            habitDictionary: habitDictionary,
            categoryDictionary: castCategoryDict,
            root: {
                subCategories: rootCategories.map(x => x.id),
                habits: rootHabits.map(x => x.id)
            }
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

    public async logInstance(instance: HabitInstance): Promise<void> {
        const sql = `
            INSERT INTO HabitInstance (
                HabitInstanceGuid
                , HabitId
            )
            VALUES (
                $guid
                , (
                    SELECT
                        H.HabitId
                    FROM Habit H
                    WHERE H.HabitGuid = $habitId
                        AND H.IsDeleted = 0
                )
            )
        `;
        const guid = newUUID();
        await this.dao.run(sql, {
            '$guid': guid,
            '$habitId': instance.habitId
        });
    }

    public async getInstances(userId: string, startDate: Date, endDate: Date): Promise<HabitInstance[]> {
        const sql = `
            SELECT
                HI.HabitInstanceGuid AS id
                , HI.InstanceDate AS instanceDate
                , H.HabitGuid AS habitId
                , H.Name as habitName
            FROM HabitInstance HI
                JOIN Habit H
                    ON HI.HabitId = H.HabitId
                JOIN User U
                    ON H.UserId = U.UserId
            WHERE U.UserGuid = @userId
                AND HI.IsDeleted = 0
                AND HI.InstanceDate >= @startDate
                AND HI.InstanceDate < @endDate
        `;

        const instances = await this.dao.all<HabitInstance>(sql, {
            '@userId': userId,
            '@startDate': startDate.toISOString(),
            '@endDate': endDate.toISOString()
        });

        return instances.map(instance => ({
            ...instance,
            instanceDate: <Date>this.sqlDateToUtcDate(instance.instanceDate)
        }));
    }

    private sqlDateToUtcDate(sqlDate: string | Date | null): Date | null {
        if (sqlDate === null)
            return null;

        const saniDate = (<string>sqlDate).replace(' ', 'T') + "Z";
        return new Date(saniDate);
    }

    public deleteLastInstance(habitId: string): Promise<void> {
        const sql = `
            UPDATE HabitInstance
                SET IsDeleted = 1
            WHERE HabitInstanceId = (
                    SELECT
                        SubHI.HabitInstanceId
                    FROM (
                        SELECT
                            SubSubHI.HabitInstanceId
                            , ROW_NUMBER() OVER (PARTITION BY SubSubH.HabitId ORDER BY SubSubHI.InstanceDate DESC) AS RowNum
                        FROM Habit SubSubH
                            JOIN HabitInstance SubSubHI
                                ON SubSubH.HabitId = SubSubHI.HabitId
                        WHERE SubSubH.HabitGuid = @habitId
                            AND DATE(SubSubHI.InstanceDate) = DATE(CURRENT_TIMESTAMP)
                            AND SubSubHI.IsDeleted = 0
                    ) SubHI
                    WHERE SubHI.RowNum = 1
                )
        `;

        return this.dao.run(sql, {
            '@habitId': habitId
        });
    }
}