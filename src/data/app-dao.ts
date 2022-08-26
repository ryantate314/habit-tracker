import sqlite3, { RunResult } from 'sqlite3';

export class AppDAO {
    public db: sqlite3.Database;

    constructor(dbFile: string) {
        this.db = new sqlite3.Database(dbFile, (err) => {
            if (err)
                console.log("Error connecting to database", err);
        });
    }

    public async initDatabase() {
        const sql = `
            CREATE TABLE IF NOT EXISTS User (
                UserId INTEGER PRIMARY KEY AUTOINCREMENT,
                UserGuid UNIQUEIDENTIFIER NOT NULL,
                Email VARCHAR(255) NOT NULL,
                SSOId VARCHAR(100),
                CreatedDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                IsDeleted BIT NOT NULL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS HabitCategory {
                HabitCategoryId INTEGER PRIMARY KEY AUTOINCREMENT,
                HabitCategoryGuid UNIQUEIDENTIFIER NOT NULL,
                UserId INTEGER,
                Name VARCHAR(255) NOT NULL,
                Color VARCHAR(32) NULL,
                Order INTEGER NOT NULL DEFAULT 10,
                ParentCategoryId INTEGER NULL,
                CreatedDate DATETIME NOT NULL DEFAULTE CURRENT_TIMESTAMP,
                IsDeleted BIT NOT NULL DEFAULT 0,
                FOREIGN KEY FK_HabitCategory_UserId_User (UserId) REFERENCES User (UserId),
                FOREIGN KEY FK_HabitCategory_ParentCategoryId_HabitCategory_HabitCategoryId (ParentCategoryId) REFERENCES HabitCategory (HabitCategoryId)
            };

            CREATE TABLE IF NOT EXISTS Habit (
                HabitId INTEGER PRIMARY KEY AUTOINCREMENT,
                HabitGuid UNIQUEIDENTIFIER NOT NULL,
                HabitCategoryId INTEGER,
                UserId INTEGER,
                Name VARCHAR(255) NOT NULL,
                CreatedDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                IsDeleted BIT NOT NULL DEFAULT 0,
                FOREIGN KEY FK_Habit_UserId_User (UserId) REFERENCES User (UserId),
                FOREIGN KEY FK_Habit_HabitCategoryId (HabitCategoryId) REFERENCES HabitCategory (HabitCategoryId)
            );

            CREATE TABLE IF NOT EXISTS Action (
                ActionId INTEGER PRIMARY KEY AUTOINCREMENT,
                ActionGuid UNIQUEIDENTIFIER NOT NULL,
                HabitId INTEGER NULL,
                CustomName VARCHAR(255),
                Notes VARCHAR(1024),
                ActionDate DATETIME NOT NULL DEFAULTE CURRENT_TIMESTAMP,
                IsDeleted BIT NOT NULL DEFAULT 0,
                FOREIGN KEY FK_HabitId_Habit_HabitId (HabitId) REFERENCES Habit (HabitId)
            );
        `;
        await this.run(sql);
    }

    public run(sql: string, params: string[] = []): Promise<RunResult> {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, (result: RunResult, error: Error | null) => {
                if (error == null) {
                    resolve(result);
                }
                else {
                    console.log("Error running SQL", error);
                    reject(error);
                }
            });
        });
    }

}