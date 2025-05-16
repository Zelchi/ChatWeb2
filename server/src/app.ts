import express, { Application } from 'express';
import { Server } from 'socket.io';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';

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
        this.listenSocket();
        this.setupRoutes();
    }

    listenServer() {
        this.http.listen(8080, () => {
            console.log('Server is running on port 8080');
        });
    }

    listenSocket() {
        const messages: string[] = [];
        const nicknames: { [key: string]: string } = {};

        const updateUserList = (socket: any) => {
            const userCount = this.io.of('/').sockets.size;
            socket.emit('userList', nicknames);
            socket.emit('userCount', userCount);
            socket.emit('history', messages.map(msg => msg));

            console.log(`User connected: ${socket.id}`);
            console.log(`User count after connection: ${userCount}`);
        };

        this.io.on('connection', (socket) => {
            socket.on('disconnect', () => {
                console.log(`User disconnected: ${socket.id}`);
                delete nicknames[socket.id];
                updateUserList(socket);

                const userCountAfterDisconnect = this.io.of('/').sockets.size;
                console.log(`User count after disconnect: ${userCountAfterDisconnect}`);
                this.io.emit('userCount', userCountAfterDisconnect);
            });

            socket.on('nickname', (nickname) => {
                nicknames[socket.id] = nickname;
                console.log(`Nickname set for ${socket.id}: ${nickname}`);
                updateUserList(socket);
            });

            socket.on('message', (data) => {
                const timestamp = Date.now();
                const nickname = nicknames[socket.id] || 'Unknown';
                const messageContent = `${nickname}: ${data}`;
                messages.push(messageContent);

                socket.emit('message', messageContent);
            });
        });
    }

    setupRoutes() {
        this.app.use(express.static(__dirname));

        this.app.get('/', (req, res) => {
            const rootDir = path.resolve(__dirname, '../../');
            const filePath = process.env.dev
                ? path.join(rootDir, 'client', 'index.html')
                : path.join(rootDir, 'index.html');
            res.sendFile(filePath);
        });
    }
}

export default new App();