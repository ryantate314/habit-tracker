import { NextFunction, Request, Response } from "express";

export function handleErrors(err: any, req: Request, res: Response, next: NextFunction) {
    if (res.headersSent) {
        return next(err);
    }

    console.error(err);

    res.status(500)
        .send();
}