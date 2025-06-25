import { useState } from 'react'
import { supabaseClient } from './lib/supabaseClient'

function Login() {
  const [loading, setLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setLoading(true)
    const { error } = await supabaseClient.auth.signInWithOAuth({ provider: 'google' })
    if (error) {
      alert('Googleログインに失敗しました: ' + error.message)
    }
    setLoading(false)
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '5em' }}>
      <h2>ログイン</h2>
      <button onClick={handleGoogleLogin} disabled={loading} style={{ fontSize: '1.2em', padding: '0.5em 2em' }}>
        {loading ? 'ログイン中...' : 'Googleでログイン'}
      </button>
    </div>
  )
}

export default Login 