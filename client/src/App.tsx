import './index.css'
import styled from 'styled-components'
import { Nickname } from './components/Nickname'
import { Chat } from './components/Chat'
import { useState } from 'react'
import { io } from 'socket.io-client'

const socket = io();

const ChatWeb = styled.section`
  width: 100vw;
  height: 100vh;
  overflow: hidden;

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #1c1c1c;
`

const App = () => {
  const [login, setLogin] = useState(false);
  const [nickname, setNick] = useState('');

  return (
    <ChatWeb>
      {!login && <Nickname setLogin={setLogin} setNick={setNick} nickname={nickname} socket={socket} />}
      {login && <Chat socket={socket} />}
    </ChatWeb>
  )
}

export default App