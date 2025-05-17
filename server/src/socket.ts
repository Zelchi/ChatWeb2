import { Server, Socket } from 'socket.io';

export class SocketHandler {
    private messages: string[] = [];
    private nicknames: { [key: string]: string } = {};

    constructor(private io: Server) {
        this.listen();
    }

    private messageRegister(message: string) {
        if (message.length > 1000) this.messages.shift();
        this.messages.push(message);
    }

    private updateChat(socket: Socket) {
        const onlineUsers: string[] = Object.values(this.nicknames);

        socket.emit('history', this.messages);

        this.io.emit('userList', onlineUsers);
        this.io.emit('userCount', onlineUsers.length);
    }

    private verifyNickname(nickname: string): boolean {
        const isValid = /^[a-zA-Z0-9_]+$/.test(nickname);
        const isUnique = !Object.values(this.nicknames).includes(nickname);
        const isLengthValid = nickname.length >= 3 && nickname.length <= 20;
        const isNotEmpty = nickname.trim() !== '';
        return isValid && isUnique && isLengthValid && isNotEmpty;
    }

    private listen() {
        this.io.on('connection', (socket) => {

            socket.on('disconnect', () => {
                const nickname = this.nicknames[socket.id];
                delete this.nicknames[socket.id];
                if (nickname) {
                    this.io.emit('cursor-disconnect', nickname);
                }
                this.updateChat(socket);
            });

            socket.on('nickname', (nickname) => {
                if (!this.verifyNickname(nickname)) {
                    socket.emit('nicknameError', 'Nome inválido ou já em uso.');
                }
                if (this.verifyNickname(nickname)) {
                    socket.emit('nicknameSuccess', 'Nome de usuário definido com sucesso.');
                    if (!this.nicknames[socket.id]) {
                        this.nicknames[socket.id] = nickname;
                    }
                }
            });

            socket.on('conected', () => {
                this.updateChat(socket);
            });

            socket.on('message', (data) => {
                const nickname = this.nicknames[socket.id] || 'Unknown';
                const messageContent = `${nickname}: ${data}`;
                this.messageRegister(messageContent);
                this.io.emit('message', messageContent);
            });

            socket.on('cursores', (cursor) => {
                const nickname = this.nicknames[socket.id] || 'Unknown';
                socket.broadcast.emit('cursores', { ...cursor, id: nickname });
                console.log('cursores', { ...cursor, id: nickname });
            });
        });
    }
}