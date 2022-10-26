import jwt, { JsonWebTokenError, JwtPayload } from 'jsonwebtoken'
import { Environment } from '../models/environment.model'
import { NextFunction, Request, Response } from 'express';
import { UserPrinciple } from '../models/user-principle.model';
import { OAuth2Client } from 'google-auth-library';
import { Token } from '../models/token';

const refresh_token_cookie_name = "auth_token";

export interface TokenPayload {
    sub: string;
}

export class AuthService {
    private oauth2Client: OAuth2Client;

    constructor(private environment: Environment) {
        this.oauth2Client = new OAuth2Client(environment.GOOGLE_CLIENT_ID);
    }

    
    public get isDev() : boolean {
        return this.environment.ENVIRONMENT === 'Dev';
    }
    

    public routeGuard(ignoreUrls: string[] = []) {
        return (request: Request, response: Response, next: NextFunction) => {
            let authenticated = false;

            console.log("Checking authentication for URL", request.url);

            // Ignore white-listed URLs
            if (ignoreUrls.some(url => request.url.toLowerCase().endsWith(url.toLowerCase()))) {
                console.log("Allowing anonymous for URL", request.url);
                next();
                return;
            }

            if (request.headers.authorization && /Bearer .+/.test(request.headers.authorization)) {
                const token = request.headers.authorization.split(" ")[1];
                try {
                    const user = this.parseAuthToken(token);
                    if (user) {
                        console.log("User " + user.id + " authenticated");
                        request.user = user
                        authenticated = true;
                    }
                }
                catch (ex) {
                    console.log("Authenticateion error:", ex);
                }
            }
            else
                return response.status(403)
                    .end();

            if (authenticated)
                next();
            else
                return response.status(401)
                    .end();
        };
    }

    private get JWT_KEY() : string {
        return this.environment.JWT_KEY;
    }

    public generateToken(user: UserPrinciple): Token {
        const payload: TokenPayload = {
            sub: user.id
        };
        const token = jwt.sign(payload, this.JWT_KEY, {
            expiresIn: this.environment.JWT_LIFETIME * 60
        });
        return {
            token: token,
            expiresIn: this.environment.JWT_LIFETIME * 60
        };
    }

    public generateRefreshToken(user: UserPrinciple, response: Response): void {
        const payload: TokenPayload = {
            sub: user.id
        };
        const expiresIn = this.environment.JWT_REFRESH_LIFETIME * 60;
        const token = jwt.sign(payload, this.environment.JWT_REFRESH_KEY, {
            expiresIn: expiresIn
        });
        this.addTokenCookie(response, token, expiresIn);
    }

    private parseAuthToken(token: string): UserPrinciple {
        const payload = <TokenPayload>jwt.verify(token, this.JWT_KEY);
        return {
            id: payload.sub
        };
    }

    private parseRefreshToken(token: string): UserPrinciple {
        const payload = <TokenPayload>jwt.verify(token, this.environment.JWT_REFRESH_KEY);
        return {
            id: payload.sub
        };
    }

    /**
     * Validates the refresh token on the provided request.
     * @param request 
     * @returns 
     */
    public validateRequest(request: Request): { token: string, user: UserPrinciple } | null {
        const token = request.cookies[refresh_token_cookie_name];
        if (!token)
            return null;

        try {
            const user = this.parseRefreshToken(token);

            return {
                token: token,
                user: user
            };
        }
        catch (ex) {
            console.log("Authentication error", ex);
            return null;
        }
    }

    private addTokenCookie(response: Response, token: string, expiresIn: number) {
        const expirationDate = new Date();
        expirationDate.setSeconds(expirationDate.getSeconds() + expiresIn);

        response.cookie(refresh_token_cookie_name, token, {
            httpOnly: true,
            secure: !this.isDev,
            sameSite: 'strict',
            expires: expirationDate
        });
    }

    public async validateThirdPartyToken(token: string) {
        const result = (await this.oauth2Client.verifyIdToken({
            idToken: token,
            audience: this.environment.GOOGLE_CLIENT_ID
        })).getPayload();

        if (result) {
            return {
                email: result.email,
                ssoId: result.sub
            };
        }
    }


}