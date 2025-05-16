import { useRef, forwardRef, useImperativeHandle } from 'react';

export const Sound = forwardRef(({ audio }: any, ref) => {
    const audioRef = useRef<HTMLAudioElement>(null);

    useImperativeHandle(ref, () => ({
        playSound: () => {
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.volume = 0.1;
                audioRef.current.play();
            }
        }
    }));

    return (
        <audio ref={audioRef} src={audio} />
    );
});