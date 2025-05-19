import styled, { keyframes } from 'styled-components';
import { useEffect, useState, useRef } from 'react';
import { Sound } from './Sound';
import joinCall from '../../public/sounds/joincall.mp3';
import leftCall from '../../public/sounds/leftcall.mp3';
import mutedCall from '../../public/sounds/mutedcall.mp3';
import Peer from 'simple-peer';

const slideUp = keyframes`
    from {
        opacity: 0;
        transform: scale(0.95);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
`;

const VoiceContainer = styled.div`
    width: 400px;
    height: 200px;
    background-color: #2c2c2c;
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);

    animation: ${slideUp} 0.5s ease-in-out;
`;

const BoxButtons = styled.div`
    width: 100%;
    height: 50px;

    display: flex;
    flex-direction: row;

    justify-content: center;
    align-items: center;

    gap: 20px;
    padding: 10px;
`;

const UsersConnected = styled.div`
    flex: 1;
    background-color: #3c3c3c;
    overflow: hidden;
`;

const ConnectButton = styled.button`
    width: 50%;
    height: 100%;

    background: #6c6c6c;
    border-radius: 5px;
`;

const MuteButton = styled.button`
    width: 50%;
    height: 100%;

    background: #6c6c6c;
    border-radius: 5px;
`;

interface VoiceChatProps {
    socket: any;
}

interface PeerData {
    peer: Peer.Instance;
    userId: string;
}

interface VoiceUser {
    id: string;
    nickname: string;
}

export const VoiceChat = ({ socket }: VoiceChatProps) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [userConnected, setUserConnected] = useState<VoiceUser[]>([]);
    const peersRef = useRef<PeerData[]>([]);
    const userStream = useRef<MediaStream | null>(null);
    const [myNickname, setMyNickname] = useState<string | null>(null);

    const joinSoundRef = useRef<{ playSound: () => void }>(null);
    const leftSoundRef = useRef<{ playSound: () => void }>(null);
    const mutedSoundRef = useRef<{ playSound: () => void }>(null);

    useEffect(() => {
        if (!socket) return;

        socket.on('nicknameSuccess', () => {
            setMyNickname(socket.nickname);
        });

        socket.on('voice-users', async (users: VoiceUser[]) => {
            setUserConnected(users);

            if (!isConnected || !userStream.current || !myNickname) return;

            users.forEach((user) => {
                if (
                    user.nickname !== myNickname &&
                    !peersRef.current.find((p) => p.userId === user.nickname)
                ) {
                    if (!userStream.current) {
                        console.warn('Tentando criar Peer sem stream!');
                        return;
                    }
                    const peer = new Peer({
                        initiator: true,
                        trickle: false,
                        stream: userStream.current,
                        config: {
                            iceServers: [
                                { urls: 'stun:stun.l.google.com:19302' }
                            ]
                        }
                    });

                    peer.on('signal', (signal) => {
                        socket.emit('voice-signal', { to: user.nickname, signal });
                    });

                    peer.on('stream', (remoteStream) => {
                        console.log('Recebendo áudio de', user.id, remoteStream);
                        const audio = document.createElement('audio');
                        audio.srcObject = remoteStream;
                        audio.autoplay = true;
                        audio.muted = false;
                        audio.volume = 1;
                        audio.play();
                        document.body.appendChild(audio);
                    });

                    peer.on('connect', () => {
                        console.log('Peer conectado com', user.id);
                    });

                    const peerData = { peer, userId: user.id };
                    peersRef.current.push(peerData);
                }
            });

            peersRef.current.forEach(({ userId, peer }) => {
                if (!users.some(user => user.nickname === userId)) {
                    peer.destroy();
                    peersRef.current = peersRef.current.filter((p) => p.userId !== userId);
                }
            });
        });

        socket.on('voice-signal', ({ from, signal }: any) => {
            if (!userStream.current || !myNickname) return;

            let peerData = peersRef.current.find((p) => p.userId === from);
            if (!peerData && from !== myNickname) {
                if (!userStream.current) {
                    console.warn('Tentando criar Peer sem stream (voice-signal)!');
                    return;
                }
                const peer = new Peer({
                    initiator: false,
                    trickle: false,
                    stream: userStream.current,
                    config: {
                        iceServers: [
                            { urls: 'stun:stun.l.google.com:19302' }
                        ]
                    }
                });

                peer.on('signal', (sig) => {
                    socket.emit('voice-signal', { to: from, signal: sig });
                });

                peer.on('stream', (remoteStream) => {
                    const audio = document.createElement('audio');
                    audio.srcObject = remoteStream;
                    audio.autoplay = true;
                    audio.play();
                    document.body.appendChild(audio);
                });

                const peerObj = { peer, userId: from };
                peersRef.current.push(peerObj);
                peer.signal(signal);
            } else if (peerData) {
                peerData.peer.signal(signal);
            }
        });

        return () => {
            socket.off('voice-users');
            socket.off('voice-signal');
            socket.off('connect');
            peersRef.current.forEach(({ peer }) => peer.destroy());
            peersRef.current = [];
        };
    }, [socket, isConnected, myNickname]);

    const handleConnect = async () => {
        if (isConnected) {
            socket.emit('leave-voice');
            leftSoundRef.current?.playSound();
            setIsConnected(false);
            peersRef.current.forEach(({ peer }) => peer.destroy());
            peersRef.current = [];
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                console.log('Stream do microfone capturado:', stream);
                userStream.current = stream;
                socket.emit('join-voice');
                joinSoundRef.current?.playSound();
                setIsConnected(true);
            } catch (err) {
                alert('Não foi possível acessar o microfone.');
            }
        }
    };

    const handleMute = () => {
        setIsMuted((prev) => !prev);
        mutedSoundRef.current?.playSound();
        socket.emit('mute', !isMuted);
        if (userStream.current) {
            userStream.current.getAudioTracks().forEach(track => {
                track.enabled = isMuted;
            });
        }
    };

    return (
        <VoiceContainer>
            <Sound ref={joinSoundRef} audio={joinCall} />
            <Sound ref={leftSoundRef} audio={leftCall} />
            <Sound ref={mutedSoundRef} audio={mutedCall} />
            <UsersConnected>
                <ul>
                    {userConnected.map((user) => (
                        <li key={user.id}>{user.nickname}</li>
                    ))}
                </ul>
            </UsersConnected>
            <BoxButtons>
                <ConnectButton onClick={handleConnect}>
                    {isConnected ? 'Desconectar' : 'Conectar'}
                </ConnectButton>
                <MuteButton onClick={handleMute}>
                    {isMuted ? 'Desmutar' : 'Mutar'}
                </MuteButton>
            </BoxButtons>
        </VoiceContainer>
    );
};