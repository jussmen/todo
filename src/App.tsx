import { useState, useEffect } from 'react'
import './App.css'
import { TodoApi } from './utils/todoApi'
import type { Todo } from './types/Todo'
import { supabaseClient } from './lib/supabaseClient'
import Login from './Login'
import Salary from './Salary'

function App() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [adding, setAdding] = useState(false)
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
        return (
          <div className="card">
            <form onSubmit={handleAdd} className="task-form">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="新しいタスクを入力"
                disabled={adding}
                className="task-input"
              />
              <button type="submit" disabled={adding || !input.trim()} className="task-button">
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
                <ul className="task-list">
                  {todos.map((todo) => (
                    <li key={todo.id} className="task-item">
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
                  className="delete-button"
                >
                  削除
                </button>
              </form>
            )}
          </div>
        )
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
      <div className="menu-bar">
        <div className="menu-container">
          {/* メニュー項目 */}
          <nav>
            <ul className="menu-nav">
              <li>
                <button 
                  onClick={() => setCurrentPage('home')}
                  className={`menu-button ${currentPage === 'home' ? 'active' : ''}`}
                >
                  ホーム
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setCurrentPage('salary')}
                  className={`menu-button ${currentPage === 'salary' ? 'active' : ''}`}
                >
                  給与収入
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setCurrentPage('property')}
                  className={`menu-button ${currentPage === 'property' ? 'active' : ''}`}
                >
                  所有物件
                </button>
              </li>
            </ul>
          </nav>
          <div className="user-info">
            <span>ようこそ、{user.email}さん</span>
            <button onClick={handleLogout} className="logout-button">
              ログアウト
            </button>
          </div>
        </div>
      </div>
      
      {/* メインコンテンツ */}
      <div className="main-content">
        {renderContent()}
      </div>
    </>
  )
}

export default App
