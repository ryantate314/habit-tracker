import { Request, Response } from "express";
import { UsersRepository } from "../data/users.repository";
import { AuthService } from "../services/auth.service";

export class UsersController {

    constructor(private authService: AuthService, private userRepo: UsersRepository) {
        this.login = this.login.bind(this);
    }

    public async login(request: Request, response: Response) {
        const { token } = request.body;
        console.log("Validating login");

        let googleUser = null;

        try {
            googleUser = await this.authService.validateLoginToken(token);
        }
        catch (ex) {
            console.log("Error verifying Google user", ex);
            response.status(400)
                .end();
        }

        if (googleUser) {
            let user = await this.userRepo.getUserBySSOId(googleUser.ssoId);
            console.log("Found user:", user);
            if (user == null) {
                user = await this.userRepo.create({
                    email: googleUser.email!,
                    ssoId: googleUser.ssoId
                });
            }
            const token = this.authService.generateToken({
                userId: user.id!
            })
            response.send({
                user: user,
                token: token
            });
        }
        else {
            response.status(401)
                .end();
        }
    }


}