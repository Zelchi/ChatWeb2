import styled from 'styled-components';
import { useState } from 'react';

const UserCount = styled.div`
    width: 100%;
    display: flex;
    justify-content: center;
    color: #fff;
    font-size: 16px;
    border-bottom: 2px solid #444;
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
    const [messages, setMessages] = useState<string[]>(["Batata", "Frita", "Com", "Queijo"]);

    socket.on('history', (messages: Array<string>) => {
        messages.forEach((message: string) => {
            setMessages((prevMessages) => [...prevMessages, message]);
        });
    });

    const handleHistoryMessages = () => {
        return messages.map((message: string) => (
            <p key={message}>{message}</p>
        ));
    }

    return (
        <ChatContainer>
            <UserCount>Usuários online: 0</UserCount>
            <Messages>{handleHistoryMessages()}</Messages>
            <InputContainer>
                <MessageInput placeholder="Digite sua mensagem..." />
                <SendButton>Enviar</SendButton>
            </InputContainer>
        </ChatContainer>
    );
}