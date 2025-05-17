import { useEffect, useRef, useState } from 'react';
import SimplePeer from 'simple-peer';

interface VoiceChatProps {
    socket: any;
}

export const VoiceChat = ({ socket }: VoiceChatProps) => {
    const [peers, setPeers] = useState<{ [userId: string]: SimplePeer.Instance }>({});
    const peersRef = useRef<{ [userId: string]: SimplePeer.Instance }>({});
    const myAudio = useRef<HTMLAudioElement>(null);
    const remoteAudiosRef = useRef<{ [userId: string]: HTMLAudioElement }>({});

    console.log(peers);

    useEffect(() => {
        let localStream: MediaStream;

        navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
            localStream = stream;

            // Toca o próprio áudio (mutado)
            if (myAudio.current) {
                myAudio.current.srcObject = stream;
            }

            socket.emit('join');

            socket.on('user-joined', (userId: string) => {
                const peer = new SimplePeer({ initiator: true, trickle: false, stream: localStream });

                peer.on('signal', data => {
                    socket.emit('signal', { to: userId, data });
                });

                peer.on('stream', remoteStream => {
                    attachRemoteAudio(userId, remoteStream);
                });

                peersRef.current[userId] = peer;
                setPeers({ ...peersRef.current });
            });

            socket.on('signal', ({ from, data }: { from: string; data: SimplePeer.SignalData }) => {
                let peer = peersRef.current[from];

                if (!peer) {
                    peer = new SimplePeer({ initiator: false, trickle: false, stream: localStream });

                    peer.on('signal', signal => {
                        socket.emit('signal', { to: from, data: signal });
                    });

                    peer.on('stream', remoteStream => {
                        attachRemoteAudio(from, remoteStream);
                    });

                    peersRef.current[from] = peer;
                    setPeers({ ...peersRef.current });
                }

                peer.signal(data);
            });

            socket.on('user-left', (userId: string) => {
                const peer = peersRef.current[userId];
                if (peer) {
                    peer.destroy();
                    delete peersRef.current[userId];
                    setPeers({ ...peersRef.current });
                }

                // Remove elemento <audio> remoto
                const audio = remoteAudiosRef.current[userId];
                if (audio) {
                    audio.remove();
                    delete remoteAudiosRef.current[userId];
                }
            });
        });

        const attachRemoteAudio = (userId: string, stream: MediaStream) => {
            const audio = document.createElement('audio');
            audio.srcObject = stream;
            audio.autoplay = true;
            audio.controls = false;
            document.body.appendChild(audio);
            remoteAudiosRef.current[userId] = audio;
        };

        return () => {
            // Cleanup
            Object.values(peersRef.current).forEach(peer => peer.destroy());
            Object.values(remoteAudiosRef.current).forEach(audio => audio.remove());
            peersRef.current = {};
            remoteAudiosRef.current = {};

            socket.off('user-joined');
            socket.off('signal');
            socket.off('user-left');
        };
    }, [socket]);

    return (
        <div>
            <audio ref={myAudio} autoPlay muted />
        </div>
    );
};
