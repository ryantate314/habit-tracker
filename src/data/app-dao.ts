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
        const userSql = `
            CREATE TABLE IF NOT EXISTS User (
                UserId INTEGER PRIMARY KEY AUTOINCREMENT,
                UserGuid CHARACTER(36) NOT NULL UNIQUE,
                Email VARCHAR(255) NOT NULL,
                SSOId VARCHAR(100),
                CreatedDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                IsDeleted BIT NOT NULL DEFAULT 0
            );
        `;
        await this.run(userSql);

        const habitCategorySql = `
            CREATE TABLE IF NOT EXISTS HabitCategory (
                HabitCategoryId INTEGER PRIMARY KEY AUTOINCREMENT,
                HabitCategoryGuid CHARACTER(36) NOT NULL UNIQUE,
                UserId INTEGER,
                Name VARCHAR(255) NOT NULL,
                Color VARCHAR(32) NULL,
                [Order] INTEGER NOT NULL DEFAULT 10,
                ParentCategoryId INTEGER NULL,
                CreatedDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                IsDeleted BIT NOT NULL DEFAULT 0,
                CONSTRAINT FK_HabitCategory_UserId_User
                    FOREIGN KEY (UserId) REFERENCES User (UserId),
                CONSTRAINT FK_HabitCategory_ParentCategoryId_HabitCategory_HabitCategoryId
                    FOREIGN KEY (ParentCategoryId) REFERENCES HabitCategory (HabitCategoryId)
            );
        `;
        await this.run(habitCategorySql);

        const habitSql = `
            CREATE TABLE IF NOT EXISTS Habit (
                HabitId INTEGER PRIMARY KEY AUTOINCREMENT,
                HabitGuid CHARACTER(36) NOT NULL UNIQUE,
                HabitCategoryId INTEGER,
                UserId INTEGER,
                Name VARCHAR(255) NOT NULL,
                CreatedDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                IsDeleted BIT NOT NULL DEFAULT 0,
                CONSTRAINT FK_Habit_UserId_User
                    FOREIGN KEY (UserId) REFERENCES User (UserId),
                CONSTRAINT FK_Habit_HabitCategoryId
                    FOREIGN KEY (HabitCategoryId) REFERENCES HabitCategory (HabitCategoryId)
            );
        `;
        await this.run(habitSql);

        const actionSql = `
            CREATE TABLE IF NOT EXISTS Action (
                ActionId INTEGER PRIMARY KEY AUTOINCREMENT,
                ActionGuid CHARACTER(36) NOT NULL UNIQUE,
                HabitId INTEGER NULL,
                CustomName VARCHAR(255),
                Notes VARCHAR(1024),
                ActionDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                IsDeleted BIT NOT NULL DEFAULT 0,
                CONSTRAINT FK_HabitId_Habit_HabitId
                    FOREIGN KEY (HabitId) REFERENCES Habit (HabitId)
            );
        `;
        await this.run(actionSql);
    }

    public run(sql: string, params?: { [key: string]: string }): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, (err) => {
                if (err === null) {
                    resolve();
                }
                else {
                    console.error("Error performing SQL query.", err);
                    reject(err);
                }
            });
        });
    }

    public all<TEntity>(sql: string, params: { [key: string]: string } = {}): Promise<TEntity[]> {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (error, rows) => {
                if (error == null) {
                    resolve(rows as TEntity[]);
                }
                else {
                    console.log("Error running SQL", error);
                    reject(error);
                }
            });
        });
    }

    public get<TEntity>(sql: string, params: { [key: string]: string } = {}): Promise<TEntity> {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (error, row) => {
                if (error == null) {
                    resolve(row as TEntity);
                }
                else {
                    console.log("Error running SQL", error);
                    reject(error);
                }
            });
        });
    }

}