import { useState, useEffect } from 'react'
import { supabaseClient } from './lib/supabaseClient'

interface SalaryData {
  id?: number
  user_id: string
  total_salary: number
  housing_loan_deduction: number
  medical_expense_deduction: number
  created_at?: string
}

function Salary() {
  const [salaryData, setSalaryData] = useState<SalaryData>({
    user_id: '',
    total_salary: 0,
    housing_loan_deduction: 0,
    medical_expense_deduction: 0
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // ユーザーIDを取得
    supabaseClient.auth.getUser().then(({ data }) => {
      if (data.user) {
        setSalaryData(prev => ({ ...prev, user_id: data.user.id }))
        loadSalaryData(data.user.id)
      }
    })
  }, [])

  const loadSalaryData = async (userId: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabaseClient
        .from('salary_data')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) throw error
      if (data && data.length > 0) {
        setSalaryData(data[0])
      }
    } catch (e) {
      console.error('給与データの取得に失敗しました:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!salaryData.user_id) return

    setSaving(true)
    try {
      if (salaryData.id) {
        // 更新
        const { error } = await supabaseClient
          .from('salary_data')
          .update({
            total_salary: salaryData.total_salary,
            housing_loan_deduction: salaryData.housing_loan_deduction,
            medical_expense_deduction: salaryData.medical_expense_deduction
          })
          .eq('id', salaryData.id)
        if (error) throw error
      } else {
        // 新規作成
        const { error } = await supabaseClient
          .from('salary_data')
          .insert([salaryData])
        if (error) throw error
      }
      alert('保存しました')
    } catch (e) {
      alert('保存に失敗しました')
      console.error('保存エラー:', e)
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof SalaryData, value: string | number) => {
    setSalaryData(prev => ({
      ...prev,
      [field]: typeof value === 'string' ? parseFloat(value) || 0 : value
    }))
  }

  if (loading) {
    return <div className="card"><p>読み込み中...</p></div>
  }

  return (
    <div className="card">
      <h2>給与収入管理</h2>
      <form onSubmit={handleSubmit} style={{ textAlign: 'left', maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5em' }}>
          <label style={{ display: 'block', marginBottom: '0.5em', fontWeight: 'bold' }}>
            給与＋賞与 合計（円）
          </label>
          <input
            type="number"
            value={salaryData.total_salary || ''}
            onChange={(e) => handleInputChange('total_salary', e.target.value)}
            placeholder="例: 5000000"
            style={{
              width: '100%',
              padding: '0.8em',
              fontSize: '1em',
              border: '1px solid #ddd',
              borderRadius: '4px',
              boxSizing: 'border-box'
            }}
            required
          />
        </div>

        <div style={{ marginBottom: '1.5em' }}>
          <label style={{ display: 'block', marginBottom: '0.5em', fontWeight: 'bold' }}>
            住宅ローン控除額（円）
          </label>
          <input
            type="number"
            value={salaryData.housing_loan_deduction || ''}
            onChange={(e) => handleInputChange('housing_loan_deduction', e.target.value)}
            placeholder="例: 200000"
            style={{
              width: '100%',
              padding: '0.8em',
              fontSize: '1em',
              border: '1px solid #ddd',
              borderRadius: '4px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5em' }}>
          <label style={{ display: 'block', marginBottom: '0.5em', fontWeight: 'bold' }}>
            医療費控除額（円）
          </label>
          <input
            type="number"
            value={salaryData.medical_expense_deduction || ''}
            onChange={(e) => handleInputChange('medical_expense_deduction', e.target.value)}
            placeholder="例: 50000"
            style={{
              width: '100%',
              padding: '0.8em',
              fontSize: '1em',
              border: '1px solid #ddd',
              borderRadius: '4px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{
            width: '100%',
            padding: '1em',
            fontSize: '1.1em',
            backgroundColor: '#646cff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1
          }}
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </form>
    </div>
  )
}

export default Salary 