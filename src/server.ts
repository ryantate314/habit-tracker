import express, { Application, Router } from 'express';
import bodyParser from 'body-parser';
import { HabitsController } from './controllers/habits.controller';
import { Environment } from './models/environment.model';
import { AuthService } from './services/auth.service';

import { UsersController } from './controllers/users.controller';
import { AppDAO } from './data/app-dao';
import { UsersRepository } from './data/users.repository';
import { HabitsRepository } from './data/habits.repository';
import cors from 'cors';

class Server {
    private app;
    private authService: AuthService;
    private dao: AppDAO;

    constructor(private environment: Environment) {
        this.app = express();
        this.authService = new AuthService(environment);
        this.dao = new AppDAO(environment.DATABASE_FILE);
        this.config();
        this.routerConfig();
    }

    private config() {
        this.app.use(bodyParser.urlencoded({ extended:true }));
        this.app.use(bodyParser.json({ limit: '1mb' })); // 100kb default
        this.app.use(cors({
            origin: "http://localhost:4200"
        }));

        if (this.environment.SECURE_ENDPOINTS != "false") {
            this.app.use(this.authService.routeGuard([
                '/api/v1/users/login'
            ]));
        }
    }

    private routerConfig() {
        const userRepo = new UsersRepository(this.dao);
        const usersController = new UsersController(this.authService, userRepo);

        this.app.post("/api/v1/users/login", usersController.login);

        const habitRepo = new HabitsRepository(this.dao);
        const habitsController = new HabitsController(habitRepo);
        this.app.get("/api/v1/habit-categories", habitsController.getCategories);
    }

    public start = (port: number) => {
        return new Promise((resolve, reject) => {
            this.app.listen(port, () => {
                resolve(port);
            }).on('error', (err: Object) => reject(err));
        })
        .then(port => this.dao.initDatabase());
    }
}

export default Server;