import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { TodoApi } from './utils/todoApi'
import type { Todo } from './types/Todo'
import { supabaseClient } from './lib/supabaseClient'
import Login from './Login'

function App() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [adding, setAdding] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [user, setUser] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState<'home' | 'salary' | 'property'>('home')
  const todoApi = new TodoApi()

  // ユーザー認証状態の取得
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
        return (
          <div className="card">
            <form onSubmit={handleAdd} style={{ marginBottom: '1em' }}>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="新しいタスクを入力"
                disabled={adding}
                style={{ marginRight: '0.5em', padding: '0.8em', width: '80%', fontSize: '1em' }}
              />
              <button type="submit" disabled={adding || !input.trim()}>
                {adding ? '追加中...' : '追加'}
              </button>
            </form>
            <h2>タスク一覧</h2>
            {loading ? (
              <p>読み込み中...</p>
            ) : todos.length === 0 ? (
              <p>タスクがありません</p>
            ) : (
              <form>
                <ul style={{ textAlign: 'left' }}>
                  {todos.map((todo) => (
                    <li key={todo.id}>
                      <label>
                        <input
                          type="radio"
                          name="selectedTodo"
                          value={todo.id}
                          checked={selectedId === todo.id}
                          onChange={() => setSelectedId(todo.id)}
                        />
                        {todo.text} {todo.done ? '✅' : ''}
                      </label>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={selectedId === null}
                  style={{ marginTop: '1em' }}
                >
                  削除
                </button>
              </form>
            )}
          </div>
        )
      case 'salary':
        return (
          <div className="card">
            <h2>給与収入</h2>
            <p>給与収入の管理機能は準備中です。</p>
          </div>
        )
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
      {/* 上部ナビゲーションメニュー */}
      <div style={{ 
        backgroundColor: '#f5f5f5', 
        padding: '1em',
        borderBottom: '1px solid #ddd',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <nav>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', gap: '1em' }}>
            <li>
              <button 
                onClick={() => setCurrentPage('home')}
                style={{ 
                  padding: '0.8em 1.5em',
                  backgroundColor: currentPage === 'home' ? '#646cff' : 'transparent',
                  color: currentPage === 'home' ? 'white' : 'inherit',
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
                  color: currentPage === 'salary' ? 'white' : 'inherit',
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
                  color: currentPage === 'property' ? 'white' : 'inherit',
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
      
      {/* メインコンテンツ */}
      <div style={{ padding: '2em' }}>
        <div>
          <a href="https://vite.dev" target="_blank">
            <img src={viteLogo} className="logo" alt="Vite logo" />
          </a>
          <a href="https://react.dev" target="_blank">
            <img src={reactLogo} className="logo react" alt="React logo" />
          </a>
        </div>
        <h1>Vite + React</h1>
        {renderContent()}
        <p className="read-the-docs">
          Click on the Vite and React logos to learn more
        </p>
      </div>
    </>
  )
}

export default App
