import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { PerfectCursor } from 'perfect-cursors';
import throttle from 'lodash.throttle';

interface CursorData {
    x: number;
    y: number;
    id: string;
}

interface CursoresProps {
    socket: any;
    nickname: string; // Adicione o nickname aqui
}

// Gera uma cor única com base no ID
function getColorFromId(id: string): string {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 50%)`;
}

export const Cursores = ({ socket, nickname }: CursoresProps) => {
    const THROTTLE = 200;

    const cursorsRef = useRef<Record<
        string,
        { pc: PerfectCursor; ref: React.RefObject<SVGSVGElement> }
    >>({});

    const [points, setPoints] = useState<Record<string, number[]>>({});

    // Throttled envio
    const sendCursor = useRef(
        throttle((point: number[]) => {
            socket.emit('cursores', { x: point[0], y: point[1], id: nickname });
        }, THROTTLE)
    ).current;

    // Envia posição do mouse local
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            sendCursor([e.clientX, e.clientY]);
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [sendCursor]);

    // Recebe posições remotas
    useEffect(() => {
        const handleRemoteCursor = (cursor: CursorData) => {
            if (cursor.id === nickname) return;
            setPoints((prev) => ({ ...prev, [cursor.id]: [cursor.x, cursor.y] }));
        };
        socket.on('cursores', handleRemoteCursor);
        return () => socket.off('cursores', handleRemoteCursor);
    }, [socket]);

    useEffect(() => {
        const handleDisconnect = (id: string) => {
            setPoints((prev) => {
                const copy = { ...prev };
                delete copy[id];
                return copy;
            });

            // Também limpe o PerfectCursor e ref
            if (cursorsRef.current[id]) {
                cursorsRef.current[id].pc.dispose();
                delete cursorsRef.current[id];
            }
        };

        socket.on('cursor-disconnect', handleDisconnect);
        return () => socket.off('cursor-disconnect', handleDisconnect);
    }, [socket]);


    // Cria ou atualiza PerfectCursor para cada usuário
    useLayoutEffect(() => {
        Object.entries(points).forEach(([id, point]) => {
            if (!cursorsRef.current[id]) {
                const ref = React.createRef<SVGSVGElement>() as React.RefObject<SVGSVGElement>;
                const pc = new PerfectCursor((smoothed: number[]) => {
                    const el = ref.current;
                    if (el) {
                        el.style.transform = `translate(${smoothed[0]}px, ${smoothed[1]}px)`;
                    }
                });
                cursorsRef.current[id] = { pc, ref };
            }
            cursorsRef.current[id].pc.addPoint(point);
        });

        return () => {
            for (const { pc } of Object.values(cursorsRef.current)) {
                pc.dispose();
            }
        };
    }, [points]);

    return (
        <>
            {Object.entries(points).map(([id]) => {
                const cursorRef = cursorsRef.current[id]?.ref;
                const color = getColorFromId(id);

                return (
                    <svg
                        key={id}
                        ref={cursorRef}
                        style={{
                            position: 'fixed',
                            top: -15,
                            left: -15,
                            width: 35,
                            height: 35,
                            pointerEvents: 'none',
                            zIndex: 9999,
                        }}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 35 35"
                        fill="none"
                    >
                        <g fill="rgba(0,0,0,.2)" transform="translate(1,1)">
                            <path d="m12 24.4219v-16.015l11.591 11.619h-6.781l-.411.124z" />
                            <path d="m21.0845 25.0962-3.605 1.535-4.682-11.089 3.686-1.553z" />
                        </g>
                        <g fill="white">
                            <path d="m12 24.4219v-16.015l11.591 11.619h-6.781l-.411.124z" />
                            <path d="m21.0845 25.0962-3.605 1.535-4.682-11.089 3.686-1.553z" />
                        </g>
                        <g fill={color}>
                            <path d="m19.751 24.4155-1.844.774-3.1-7.374 1.841-.775z" />
                            <path d="m13 10.814v11.188l2.969-2.866.428-.139h4.768z" />
                        </g>
                    </svg>
                );
            })}
        </>
    );
};
