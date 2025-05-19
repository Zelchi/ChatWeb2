import { Server, Socket } from 'socket.io';

export class SocketHandler {
    private messages: string[] = [];
    private voiceUsers: string[] = [];
    private nicknames: { [key: string]: string } = {};

    constructor(private io: Server) {
        this.listen();
    }

    private messageRegister(message: string) {
        if (message.length > 1000) this.messages.shift();
        this.messages.push(message);
    }

    private updateChat(socket: Socket) {
        socket.emit('history', this.messages);
        this.io.emit('userCount', Object.values(this.nicknames).length);
    }

    private updateVoice(socket: Socket) {
        const users = this.voiceUsers.map(id => ({
            id: this.nicknames[id] || id,
            nickname: this.nicknames[id] || id
        }));
        this.io.emit('voice-users', users);
        this.io.emit('userCountVoice', this.voiceUsers.length);
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
                if (nickname) {
                    this.io.emit('cursor-disconnect', nickname);
                }
                delete this.nicknames[socket.id];
                this.voiceUsers = this.voiceUsers.filter((id) => id !== socket.id);
                this.updateVoice(socket);
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
            });

            socket.on('join-voice', () => {
                if (!this.voiceUsers.includes(socket.id)) {
                    this.voiceUsers.push(socket.id);
                    this.updateVoice(socket);
                }
            });

            socket.on('leave-voice', () => {
                this.voiceUsers = this.voiceUsers.filter((id) => id !== socket.id);
                this.updateVoice(socket);
            });

            socket.on('voice-signal', ({ to, signal }) => {
                const targetId = Object.keys(this.nicknames).find(
                    key => this.nicknames[key] === to
                );
                if (targetId) {
                    socket.to(targetId).emit('voice-signal', { from: this.nicknames[socket.id], signal });
                }
            });
        });
    }
}