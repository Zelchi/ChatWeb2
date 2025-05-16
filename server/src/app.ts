import express, { Application } from 'express';
import { SocketHandler } from './socket';
import { RoutesHandler } from './routes';
import { Server } from 'socket.io';
import http from 'http';
import dotenv from 'dotenv';

class App {

    private app: Application;
    private http: http.Server;
    private io: Server;

    constructor() {
        dotenv.config();
        this.app = express();
        this.http = http.createServer(this.app);
        this.io = new Server(this.http);
        this.listenServer();
        new SocketHandler(this.io);
        new RoutesHandler(this.app);
    }

    listenServer() {
        this.http.listen(8080, () => {
            console.log('Server is running on port 8080');
        });
    }
}

export default new App();