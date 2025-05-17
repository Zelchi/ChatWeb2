import styled, { keyframes } from 'styled-components';
import { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { Sound } from './Sound';
import join from '../../public/sounds/join.mp3'
import send from '../../public/sounds/send.mp3'
import exit from '../../public/sounds/exit.mp3'

const slideUp = keyframes`
    from {
        opacity: 0;
        transform: scale(0.95), translate(-50%, -50%);
    }
    to {
        opacity: 1;
        transform: scale(1), translate(-50%, -50%);
    }
`;

const ChatContainer = styled.div`
    width: 400px;
    height: 600px;
    background-color: #2c2c2c;
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);

    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    animation: ${slideUp} 0.5s ease-in-out;
`;

const UserCount = styled.div`
    width: 100%;
    display: flex;
    justify-content: center;
    color: #fff;
    font-size: 16px;
    border-bottom: 2px solid #444;
`;

const Messages = styled.div`
    flex: 1;
    padding: 10px;
    overflow-y: auto;
    border-bottom: 1px solid #444;

    scrollbar-width: thin;
    scrollbar-color: #555 #2c2c2c;

    &::-webkit-scrollbar {
        width: 8px;
    }
    &::-webkit-scrollbar-track {
        background: #2c2c2c;
    }
    &::-webkit-scrollbar-thumb {
        background-color: #555;
        border-radius: 4px;
    }
    &::-webkit-scrollbar-thumb:hover {
        background-color: #777;
    }
`;

const InputContainer = styled.div`
    display: flex;
    padding: 10px;
    background-color: #333;
`;

const MessageInput = styled.input`
    flex: 1;
    padding: 10px;
    border: none;
    border-radius: 5px;
    margin-right: 10px;
    background-color: #444;
    color: #fff;
`;

const SendButton = styled.button`
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    background-color: #5a5a5a;
    color: #fff;
    cursor: pointer;
    transition: background-color 0.3s;

    &:hover {
        background-color: #777;
    }
`;

export const Chat = ({ socket }: any) => {
    const [messages, setMessages] = useState<string[]>([]);
    const [userCount, setUserCount] = useState(0);
    const [input, setInput] = useState('');
    const userCountRef = useRef(userCount);

    const joinSoundRef = useRef<{ playSound: () => void }>(null);
    const sendSoundRef = useRef<{ playSound: () => void }>(null);
    const exitSoundRef = useRef<{ playSound: () => void }>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    const isScrollAtBottom = () => {
        const el = messagesContainerRef.current;
        if (!el) return true;
        return Math.abs(el.scrollHeight - el.scrollTop - el.clientHeight) < 5;
    };

    const atBottomRef = useRef(true);

    const scrollToBottom = () => {
        const el = messagesContainerRef.current;
        if (el) {
            el.scrollTop = el.scrollHeight;
        }
    };

    const handleUserCount = (count: number) => {
        if (count > userCountRef.current) {
            joinSoundRef.current?.playSound();
        }
        if (count < userCountRef.current) {
            exitSoundRef.current?.playSound();
        }

        userCountRef.current = count;
        setUserCount(count);
    };

    const handleMessage = (message: string) => {
        atBottomRef.current = isScrollAtBottom();
        setMessages((prevMessages) => [...prevMessages, message]);
        sendSoundRef.current?.playSound();
    };

    useLayoutEffect(() => {
        if (atBottomRef.current) {
            scrollToBottom();
        }
    }, [messages]);

    const handleHistory = (history: string[]) => {
        setMessages(history);
        setTimeout(() => {
            scrollToBottom();
        }, 0);
    };

    useEffect(() => {
        socket.emit('conected');
    }, [socket]);

    useEffect(() => {
        socket.once('history', handleHistory);
        socket.on('userCount', handleUserCount);
        socket.on('message', handleMessage);

        return () => {
            socket.off('userCount', handleUserCount);
            socket.off('message', handleMessage);
            socket.off('history', handleHistory);
        };
    }, [socket]);

    const sendMessage = () => {
        if (input.trim() !== '') {
            socket.emit('message', input);
            setInput('');
        }
    };

    return (
        <ChatContainer>
            <Sound ref={joinSoundRef} audio={join} />
            <Sound ref={sendSoundRef} audio={send} />
            <Sound ref={exitSoundRef} audio={exit} />
            <UserCount>Online: {userCount}</UserCount>
            <Messages ref={messagesContainerRef}>
                {messages.map((msg) => (
                    <p key={msg}>{msg}</p>
                ))}
                <div ref={messagesEndRef} />
            </Messages>
            <InputContainer>
                <MessageInput
                    placeholder="Digite sua mensagem..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { e.key === 'Enter' && sendMessage() }}
                />
                <SendButton onClick={sendMessage}>Enviar</SendButton>
            </InputContainer>
        </ChatContainer>
    );
}