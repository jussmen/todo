import { useState, useEffect } from 'react'
import './App.css'
import { TodoApi } from './utils/todoApi'
import { supabaseClient } from './lib/supabaseClient'
import Login from './Login'
import Salary from './Salary'

function App() {
  const [setTodos] = useState<Todo[]>([])
  const [setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [setAdding] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [user, setUser] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState<'home' | 'salary' | 'property'>('home')
  const todoApi = new TodoApi()

  // ユーザー認証状態の取得 - hoge
  useEffect(() => {
    supabaseClient.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })
    // 認証状態の変化を監視
    const { data: listener } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  const fetchTodos = async () => {
    try {
      const items = await todoApi.readItems()
      setTodos(items)
    } catch (e) {
      alert('タスクの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTodos()
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    setAdding(true)
    try {
      await todoApi.createItem({ text: input.trim(), done: false })
      setInput('')
      await fetchTodos()
    } catch (e) {
      alert('タスクの追加に失敗しました')
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async () => {
    if (selectedId === null) return
    if (!window.confirm('本当に削除しますか？')) return
    try {
      await todoApi.deleteItem(selectedId)
      setSelectedId(null)
      await fetchTodos()
    } catch (e) {
      alert('削除に失敗しました')
    }
  }

  const handleLogout = async () => {
    await supabaseClient.auth.signOut()
  }

  const renderContent = () => {
    switch (currentPage) {
      case 'home':
        return <TodoList user={user} />
      case 'salary':
        return <Salary />
      case 'property':
        return (
          <div className="card">
            <h2>所有物件</h2>
            <p>所有物件の管理機能は準備中です。</p>
          </div>
        )
      default:
        return null
    }
  }

  if (!user) {
    return <Login />
  }

  return (
    <>
      {/* 上部メニューバー */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        background: '#fff',
        borderBottom: '1px solid #ddd',
        zIndex: 1000,
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
      }}>
        <div style={{
          maxWidth: '80vw',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1em 0',
        }}>
          {/* メニュー項目 */}
          <nav>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', gap: '1em' }}>
              <li>
                <button 
                  onClick={() => setCurrentPage('home')}
                  style={{ 
                    padding: '0.8em 1.5em',
                    backgroundColor: currentPage === 'home' ? '#646cff' : 'transparent',
                    color: currentPage === 'home' ? 'white' : '#333',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  ホーム
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setCurrentPage('salary')}
                  style={{ 
                    padding: '0.8em 1.5em',
                    backgroundColor: currentPage === 'salary' ? '#646cff' : 'transparent',
                    color: currentPage === 'salary' ? 'white' : '#333',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  給与収入
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setCurrentPage('property')}
                  style={{ 
                    padding: '0.8em 1.5em',
                    backgroundColor: currentPage === 'property' ? '#646cff' : 'transparent',
                    color: currentPage === 'property' ? 'white' : '#333',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  所有物件
                </button>
              </li>
            </ul>
          </nav>
          <div>
            <span>ようこそ、{user.email}さん</span>
            <button onClick={handleLogout} style={{ marginLeft: '1em', fontSize: '0.8em' }}>
              ログアウト
            </button>
          </div>
        </div>
      </div>
      {/* メインコンテンツ */}
      <div style={{
        background: '#fff',
        maxWidth: '80%',
        margin: '6em auto 0 auto',
        padding: '2em',
        minHeight: '80vh',
        boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
        borderRadius: '8px',
      }}>
        {renderContent()}
      </div>
    </>
  )
}

export default App
