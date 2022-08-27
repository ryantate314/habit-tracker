import { User } from "../models/user.model";
import { AppDAO } from "./app-dao";
import { User as DataUser } from "./user.model";

export class UsersRepository {

    constructor(private dao: AppDAO) {}

    public async create(user: User): Promise<User> {
        const sql = `
            PRAGMA temp_store = 2; /* 2 means use in-memory */
            CREATE TEMP TABLE UserGuid ( Id UNIQUEIDENTIFIER);
            INSERT INTO UserGuid (Id) VALUES ( NEW_ID() );

            INSERT INTO User (
                UserGuid
                , Email
                , SSOId
            )
            SELECT
                  Id
                , $email
                , $ssoId
            FROM UserGuid;

            SELECT Id AS id FROM UserGuid;

            DROP TABLE UserGuid;
        `;
        let result: { id: string } | undefined;
        result = await this.dao.get<{ id: string }>(sql, { $email: user.email, $ssoId: user.ssoId});
        return {
            ...user,
            id: result.id
        };
    }

    public async getUserBySSOId(ssoId: string): Promise<User> {
        const sql = `
            SELECT
                U.UserId AS id
                , U.Email AS email
                , U.SSOId AS ssoId
            FROM User U
            WHERE U.SSOId = $ssoId
                AND U.IsDeleted = 0;
        `;
        const user = await this.dao.get<DataUser>(sql, { $ssoId: ssoId });
        return user;
    }
}