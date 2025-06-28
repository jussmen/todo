import { useState, useEffect } from 'react'
import { supabaseClient } from './lib/supabaseClient'

interface SalaryData {
  id?: number
  user_id: string
  income: number
  deduction: number
  tax_credit: number
  created_at?: string
}

function Salary() {
  const [salaryData, setSalaryData] = useState<SalaryData>({
    user_id: '',
    income: 0,
    deduction: 0,
    tax_credit: 0
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // 給与所得控除の計算（簡易版）
  const calculateEmploymentIncomeDeduction = (income: number): number => {
    if (income <= 1625000) return 550000
    if (income <= 1800000) return income * 0.4
    if (income <= 3600000) return income * 0.3 + 180000
    if (income <= 6600000) return income * 0.2 + 540000
    if (income <= 8500000) return income * 0.1 + 1200000
    return 1950000
  }

  // 税率の計算（簡易版）
  const calculateTaxRate = (taxableIncome: number): number => {
    if (taxableIncome <= 1950000) return 0.05
    if (taxableIncome <= 3300000) return 0.10
    if (taxableIncome <= 6950000) return 0.20
    if (taxableIncome <= 9000000) return 0.23
    if (taxableIncome <= 18000000) return 0.33
    if (taxableIncome <= 40000000) return 0.40
    return 0.45
  }

  // 税金計算
  const calculateTax = () => {
    const income = salaryData.income
    const employmentDeduction = calculateEmploymentIncomeDeduction(income)
    const employmentIncome = income - employmentDeduction
    const taxableIncome = employmentIncome - salaryData.deduction
    const taxRate = calculateTaxRate(taxableIncome)
    const taxAmount = taxableIncome * taxRate
    const finalTax = taxAmount - salaryData.tax_credit

    return {
      employmentDeduction,
      employmentIncome,
      taxableIncome,
      taxRate: taxRate * 100,
      taxAmount,
      finalTax: Math.max(0, finalTax)
    }
  }

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
            income: salaryData.income,
            deduction: salaryData.deduction,
            tax_credit: salaryData.tax_credit
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

  const taxCalculation = calculateTax()

  if (loading) {
    return <div className="card"><p>読み込み中...</p></div>
  }

  return (
    <div className="card">
      <h2>給与収入・税金計算</h2>
      
      {/* 入力フォーム */}
      <form onSubmit={handleSubmit} style={{ textAlign: 'left', maxWidth: '500px', margin: '0 auto 2em auto' }}>
        <div style={{ marginBottom: '1.5em' }}>
          <label style={{ display: 'block', marginBottom: '0.5em', fontWeight: 'bold' }}>
            収入（円）
          </label>
          <input
            type="number"
            value={salaryData.income || ''}
            onChange={(e) => handleInputChange('income', e.target.value)}
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
            所得控除（円）
          </label>
          <input
            type="number"
            value={salaryData.deduction || ''}
            onChange={(e) => handleInputChange('deduction', e.target.value)}
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
            税額控除（円）
          </label>
          <input
            type="number"
            value={salaryData.tax_credit || ''}
            onChange={(e) => handleInputChange('tax_credit', e.target.value)}
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

      {/* 計算結果表示 */}
      <div style={{ 
        background: '#f8f9fa', 
        padding: '2em', 
        borderRadius: '8px',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <h3 style={{ marginTop: 0, color: '#333' }}>税金計算結果</h3>
        
        <div style={{ fontSize: '1.1em', lineHeight: '2' }}>
          <div style={{ marginBottom: '1em' }}>
            <strong>{salaryData.income.toLocaleString()}円</strong> - <strong>{taxCalculation.employmentDeduction.toLocaleString()}円</strong> = <strong>{taxCalculation.employmentIncome.toLocaleString()}円</strong>
            <br />
            <span style={{ color: '#666', fontSize: '0.9em' }}>（収入 - 給与所得控除 = 所得金額）</span>
          </div>
          
          <div style={{ marginBottom: '1em' }}>
            <strong>{taxCalculation.employmentIncome.toLocaleString()}円</strong> - <strong>{salaryData.deduction.toLocaleString()}円</strong> = <strong>{taxCalculation.taxableIncome.toLocaleString()}円</strong>
            <br />
            <span style={{ color: '#666', fontSize: '0.9em' }}>（所得金額 - 所得控除 = 課税所得金額）</span>
          </div>
          
          <div style={{ marginBottom: '1em' }}>
            <strong>{taxCalculation.taxableIncome.toLocaleString()}円</strong> × <strong>{taxCalculation.taxRate}%</strong> = <strong>{taxCalculation.taxAmount.toLocaleString()}円</strong>
            <br />
            <span style={{ color: '#666', fontSize: '0.9em' }}>（課税所得金額 × 税率 = 税額）</span>
          </div>
          
          <div style={{ 
            marginBottom: '1em', 
            padding: '1em', 
            background: '#e3f2fd', 
            borderRadius: '4px',
            border: '2px solid #2196f3'
          }}>
            <strong>{taxCalculation.taxAmount.toLocaleString()}円</strong> - <strong>{salaryData.tax_credit.toLocaleString()}円</strong> = <strong style={{ color: '#d32f2f', fontSize: '1.2em' }}>{taxCalculation.finalTax.toLocaleString()}円</strong>
            <br />
            <span style={{ color: '#666', fontSize: '0.9em' }}>（税額 - 税額控除 = 納める税金の額）</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Salary 