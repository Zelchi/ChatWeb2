import { useState } from 'react';
import styled, { keyframes, css } from 'styled-components';

export const slideUp = keyframes`
    from {
        opacity: 0;
        top: calc(0% - 400px);
        transform: scale(0), translate(-50%, -50%);
    }
    to {
        opacity: 1;
        top: 50%;
        transform: scale(1), translate(-50%, -50%);
    }
`;

export const slideOut = keyframes`
    from {
        opacity: 1;
        top: 50%;
        transform: scale(1), translate(-50%, -50%);
    }
    to {
        opacity: 0;
        top: calc(100% + 400px);
        transform: scale(0), translate(-50%, -50%);
    }
`;

const Container = styled.div<{ animateOut: boolean }>`
    width: 400px;
    background-color: #2c2c2c;
    border-radius: 10px;
    padding: 20px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;

    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    animation: ${({ animateOut }) =>
        animateOut
            ? css`${slideOut} 1s forwards`
            : css`${slideUp} 1s ease-in-out`};
`

const Caixa = styled.div`
    width: 100%;
    height: 50px;
    flex-direction: row;
    display: flex;
    gap: 10px;
`

const Input = styled.input`
    width: 100%;
    height: 40px;
    padding: 10px;
    border: none;
    border-radius: 5px;
    background-color: #444;
    color: #fff;
`

const Button = styled.button`
    display: flex;
    justify-content: center;
    align-items: center;

    width: 60px;
    height: 40px;

    border: none;
    border-radius: 5px;
    background-color: #5a5a5a;
    color: #fff;
    cursor: pointer;
    transition: background-color 0.3s;
    font-size: 16px;

    &:hover {
        background-color: #777;
    }
`

export const Nickname = ({ setLogin, setNick, nickname, socket }: any) => {
    const [animateOut, setAnimateOut] = useState(false);

    const handleLogin = (e: any) => {
        if (e.key !== 'Enter' && e.type !== 'click') return

        socket.emit('nickname', nickname);

        socket.once('nicknameError', (error: string) => {
            console.log(error);
            return;
        });

        socket.once('nicknameSuccess', (message: string) => {
            console.log(message);
            setAnimateOut(true);
            setTimeout(() => {
                setNick(nickname);
                setLogin(true);
            }, 1000);
        });
    }

    return (
        <Container animateOut={animateOut}>
            <h1>Escolha seu nickname</h1>
            <Caixa>
                <Input
                    type="text"
                    placeholder="Nickname"
                    value={nickname}
                    onChange={(e) => setNick(e.target.value)}
                    onKeyDown={(e) => handleLogin(e)}
                />
                <Button onClick={handleLogin}>➜</Button>
            </Caixa>
        </Container>
    )
}