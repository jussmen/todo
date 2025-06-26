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

  if (!user) {
    return <Login />
  }

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div style={{ marginBottom: '1em' }}>
        <span>ようこそ、{user.email}さん</span>
        <button onClick={handleLogout} style={{ marginLeft: '1em' }}>
          ログアウト
        </button>
      </div>
      <div className="card">
        <form onSubmit={handleAdd} style={{ marginBottom: '1em' }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="新しいタスクを入力"
            disabled={adding}
            style={{ marginRight: '0.5em', padding: '0.5em', width: '60%' }}
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
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
