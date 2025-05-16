import styled from 'styled-components';

const Container = styled.div`
    width: 400px;
    background-color: #2c2c2c;
    border-radius: 10px;
    padding: 20px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
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

    const nicknameRegex = /^[a-zA-Z]{3,15}$/;
    const handleLogin = (e: any) => {
        if (e.key !== 'Enter' && e.type !== 'click') return
        if (!nickname) return
        if (!nicknameRegex.test(nickname)) return
        if (nickname.length < 3 || nickname.length > 15) return
        setNick(nickname);
        setLogin(true);
        socket.emit('nickname', nickname);
        alert(`Bem-vindo(a) ${nickname}!`);
    }

    return (
        <Container>
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