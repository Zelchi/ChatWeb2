import './index.css'
import styled from 'styled-components'
import { Nickname } from './components/Nickname'
import { Chat } from './components/Chat'
import { useState } from 'react'
import { io } from 'socket.io-client'
import { Cursores } from './components/Cursores'
// import { VoiceChat } from './components/Voice'

const socket = io();

const ChatWeb = styled.section`
  width: 100dvw;
  height: 100dvh;
  
  background-color: #1c1c1c;

  gap: 10px;
  
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  overflow: hidden;
`

const App = () => {
  const [login, setLogin] = useState(false);
  const [nickname, setNick] = useState('');

  return (
    <ChatWeb>
      {!login && <Nickname setLogin={setLogin} setNick={setNick} nickname={nickname} socket={socket} />}
      {login && <Chat socket={socket} />}
      {/* {login && <VoiceChat socket={socket} />} */}
      {login && <Cursores socket={socket} nickname={nickname} />}
    </ChatWeb>
  )
}

export default App