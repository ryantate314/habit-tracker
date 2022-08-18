import express, { Application, Router } from 'express';
import bodyParser from 'body-parser';

class Server {
    private app;

    constructor() {
        this.app = express();
        this.config();
        this.routerConfig();
    }

    private config() {
        this.app.use(bodyParser.urlencoded({ extended:true }));
        this.app.use(bodyParser.json({ limit: '1mb' })); // 100kb default
    }

    private routerConfig() {
        this.app.get('/api/v1/habits', (request, response) => {
            response.status(200)
                .send({
                    foo: "bar"
                });
        });
    }

    public start = (port: number) => {
        return new Promise((resolve, reject) => {
            this.app.listen(port, () => {
                resolve(port);
            }).on('error', (err: Object) => reject(err));
        });
    }
}

export default Server;