import { User } from "../models/user.model";
import { AppDAO } from "./app-dao";
import { User as DataUser, UserIdentity } from "./user.model";

export class UsersRepository {

    constructor(private dao: AppDAO) {}

    public async create(user: User): Promise<User> {
        const sql = `
            DECLARE @userGuid UNIQUEIDENTIFIER = NEW_ID();

            INSERT INTO User (
                UserGuid
                , Email
                , SSOId
            )
            VALUES (
                @userGuid
                , ?
                , ?
            );

            SELECT @userGuid AS UserGuid;
        `;
        const result = await this.dao.run(sql, [user.email, user.ssoId]);
        return new Promise((resolve, reject) => {
            result.get((error, data) => {
                if (error)
                    reject(error);
                else
                    resolve({
                        ...user,
                        id: data.UserGuid
                    });
            });
        });
    }

    public async getUserBySSOId(ssoId: string): Promise<User> {
        const sql = `
            SELECT
                U.UserId
                , U.Email
                , U.SSOId
            FROM User U
            WHERE U.SSOId = ?
                AND U.IsDeleted = 0;
        `;
        const result = await this.dao.run(sql, [ssoId]);
        return new Promise((resolve, reject) => {
            result.get((error, data) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(data);
                }
            });
        });
    }
}