import express, { Request, Response } from "express";
import path from 'path';

export class RoutesHandler {

    constructor(private app: any) {
        this.setupRoutes();
    }

    private setupRoutes() {
        this.app.use(express.static(__dirname));

        this.app.get('/', (req: Request, res: Response) => {
            const rootDir: string = path.resolve(__dirname, '../../');
            const filePath: string = process.env.dev
                ? path.join(rootDir, 'client', 'index.html')
                : path.join(rootDir, 'index.html');
            res.sendFile(filePath);
        });
    }
}