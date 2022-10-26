import { Request, Response } from "express";
import { UsersRepository } from "../data/users.repository";
import { UserPrinciple } from "../models/user-principle.model";
import { AuthService } from "../services/auth.service";

export class UsersController {

    constructor(private authService: AuthService, private userRepo: UsersRepository) {
        this.login = this.login.bind(this);
        this.refreshToken = this.refreshToken.bind(this);
    }

    /**
     * Validates the user's identity using the provided Google third party login, and issues
     * an internal JWT for their session.
     * @param request 
     * @param response 
     */
    public async login(request: Request, response: Response) {
        const { token } = request.body;

        let googleUser = null;

        try {
            googleUser = await this.authService.validateThirdPartyToken(token);
        }
        catch (ex) {
            console.log("Error verifying Google user", ex);
            response.status(401)
                .end();
        }

        try {
            if (googleUser) {
                let user = await this.userRepo.getUserBySSOId(googleUser.ssoId);
                if (user == null) {
                    user = await this.userRepo.create({
                        email: googleUser.email!,
                        ssoId: googleUser.ssoId
                    });
                }

                const userPrinciple: UserPrinciple = {
                    id: user.id!
                }

                const refreshToken = this.authService.generateRefreshToken(userPrinciple);
                this.authService.addTokenCookie(response, refreshToken.token, refreshToken.expiresIn);

                const token = this.authService.generateToken(userPrinciple);

                response.send({
                    user: user,
                    token: token.token,
                    expiresIn: token.expiresIn
                });
            }
            else {
                response.status(401)
                    .end();
            }
        }
        catch (ex) {
            console.log("Controller error", ex);
            response.status(500)
                .send();
        }
    }

    public async refreshToken(request: Request, response: Response): Promise<void> {
        const user = this.authService.validateRequest(request);

        if (user) {
            // Rotate the refresh token on every refresh request.
            const refreshToken = this.authService.generateRefreshToken(user.user);
            this.authService.addTokenCookie(response, refreshToken.token, refreshToken.expiresIn);

            const token = this.authService.generateToken(user.user);
            response.send({
                token: token.token,
                expiresIn: token.expiresIn
            });
        }
        else {
            response.status(401)
                .send();
        }
    }

    


}