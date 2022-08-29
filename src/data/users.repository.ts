import { User } from "../models/user.model";
import { AppDAO } from "./app-dao";
import { User as DataUser } from "./user.model";
import { v4 as newUUID } from 'uuid';

export class UsersRepository {

    constructor(private dao: AppDAO) {}

    public async create(user: User): Promise<User> {
        const sql = `
            INSERT INTO User (
                UserGuid
                , Email
                , SSOId
            )
            VALUES (
                  $uuid
                , $email
                , $ssoId
            );
        `;
        const id = newUUID();
        await this.dao.get<{ id: string }>(sql, { $uuid: id, $email: user.email, $ssoId: user.ssoId});
        return {
            ...user,
            id: id
        };
    }

    public async getUserBySSOId(ssoId: string): Promise<User> {
        const sql = `
            SELECT
                U.UserGuid AS id
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