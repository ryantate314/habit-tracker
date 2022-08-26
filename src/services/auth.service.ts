import jwt, { JsonWebTokenError, JwtPayload } from 'jsonwebtoken'
import { Environment } from '../models/environment.model'
import { NextFunction, Request, Response } from 'express';
import { UserPrinciple } from '../models/user-principle.model';
import { OAuth2Client } from 'google-auth-library';

export interface TokenPayload {
    userId: string;
}

export class AuthService {
    private oauth2Client: OAuth2Client;

    constructor(private environment: Environment) {
        this.oauth2Client = new OAuth2Client(environment.GOOGLE_CLIENT_ID);
    }

    public routeGuard(ignoreUrls: string[] = []) {
        return (request: Request, response: Response, next: NextFunction) => {
            let authenticated = false;

            console.log("Checking authentication for URL", request.url);

            // Ignore white-listed URLs
            if (ignoreUrls.some(url => request.url.toLowerCase().endsWith(url.toLowerCase()))) {
                next();
                return;
            }

            if (request.headers.authorization && /Bearer .+/.test(request.headers.authorization)) {
                const token = request.headers.authorization.split(" ")[1];
                try {
                    const parsedToken = <JwtPayload>this.parseToken(token);
                    if (parsedToken) {
                        request.user = {
                            id: parsedToken.userId
                        }
                        authenticated = true;
                    }
                }
                catch (ex) {
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

    public generateToken(payload: TokenPayload): string {
        return jwt.sign({}, this.JWT_KEY);
    }

    private parseToken(token: string) {
        return jwt.verify(token, this.JWT_KEY);
    }

    public async validateLoginToken(token: string) {
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