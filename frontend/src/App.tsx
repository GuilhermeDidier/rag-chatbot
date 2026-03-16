import { useEffect } from 'react'
import { Sidebar } from './components/Sidebar'
import { ChatWindow } from './components/ChatWindow'
import { useAppStore } from './store/useAppStore'

function App() {
  const { darkMode, activeConversationId } = useAppStore()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  const handleStartChat = () => {
    // Switch to chat view on mobile by triggering a re-render
  }

  return (
    <div className={`app ${activeConversationId ? 'app--chat-active' : ''}`}>
      <Sidebar onStartChat={handleStartChat} />
      <main className="main">
        <ChatWindow />
      </main>
    </div>
  )
}

export default App
