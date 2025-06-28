import { useState, useEffect } from 'react'
import { supabaseClient } from './lib/supabaseClient'
import './Salary.css'

interface SalaryData {
  id?: number
  user_id: string
  income: number
  social_insurance_deduction: number
  other_deduction: number
  tax_credit: number
  created_at?: string
}

function Salary() {
  const [salaryData, setSalaryData] = useState<SalaryData>({
    user_id: '',
    income: 0,
    social_insurance_deduction: 0,
    other_deduction: 0,
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

  // 社会保険料控除の概算計算（簡易版）
  const calculateSocialInsuranceDeduction = (income: number): number => {
    // 健康保険料（約10%）、厚生年金保険料（約9.15%）、雇用保険料（約0.3%）の合計
    // 実際の計算は複雑なので、概算として収入の約19.45%を使用
    return Math.round(income * 0.1945)
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
    const totalDeduction = salaryData.social_insurance_deduction + salaryData.other_deduction
    const taxableIncome = employmentIncome - totalDeduction
    const taxRate = calculateTaxRate(taxableIncome)
    const taxAmount = taxableIncome * taxRate
    const finalTax = taxAmount - salaryData.tax_credit

    // 住民税の計算（簡易版：所得税の約10%）
    const residenceTax = Math.round(taxableIncome * 0.1)

    return {
      employmentDeduction,
      employmentIncome,
      totalDeduction,
      taxableIncome,
      taxRate: taxRate * 100,
      taxAmount,
      finalTax: Math.max(0, finalTax),
      residenceTax,
      totalTax: Math.max(0, finalTax) + residenceTax
    }
  }

  // 収入が変更された時に社会保険料控除を自動計算
  const handleIncomeChange = (value: string) => {
    const incomeInYen = (parseFloat(value) || 0) * 10000
    const socialInsuranceDeduction = calculateSocialInsuranceDeduction(incomeInYen)
    
    setSalaryData(prev => ({
      ...prev,
      income: incomeInYen,
      social_insurance_deduction: socialInsuranceDeduction
    }))
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
            social_insurance_deduction: salaryData.social_insurance_deduction,
            other_deduction: salaryData.other_deduction,
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
      [field]: typeof value === 'string' ? (parseFloat(value) || 0) * 10000 : value * 10000
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
      <form onSubmit={handleSubmit} className="salary-container">
        <div style={{ marginBottom: '1.5em' }}>
          <label className="salary-label">
            収入
          </label>
          <div className="input-group">
            <input
              type="number"
              value={salaryData.income ? salaryData.income / 10000 : ''}
              onChange={(e) => handleIncomeChange(e.target.value)}
              placeholder="例: 500"
              className="salary-input"
              required
            />
            <span className="unit-text">万円</span>
          </div>
        </div>

        <div style={{ marginBottom: '1.5em' }}>
          <label className="salary-label">
            社会保険料控除（自動計算）
          </label>
          <div className="input-group">
            <input
              type="number"
              value={salaryData.social_insurance_deduction ? salaryData.social_insurance_deduction / 10000 : ''}
              onChange={(e) => handleInputChange('social_insurance_deduction', e.target.value)}
              placeholder="自動計算"
              className="salary-input-readonly"
              readOnly
            />
            <span className="unit-text">万円</span>
          </div>
          <small className="help-text">
            収入の約19.45%（健康保険料・厚生年金・雇用保険の概算）
          </small>
        </div>

        <div style={{ marginBottom: '1.5em' }}>
          <label className="salary-label">
            その他の控除
          </label>
          <div className="input-group">
            <input
              type="number"
              value={salaryData.other_deduction ? salaryData.other_deduction / 10000 : ''}
              onChange={(e) => handleInputChange('other_deduction', e.target.value)}
              placeholder="例: 20"
              className="salary-input"
            />
            <span className="unit-text">万円</span>
          </div>
          <small className="help-text">
            生命保険料控除、医療費控除、住宅ローン控除など
          </small>
        </div>

        <div style={{ marginBottom: '1.5em' }}>
          <label className="salary-label">
            税額控除
          </label>
          <div className="input-group">
            <input
              type="number"
              value={salaryData.tax_credit ? salaryData.tax_credit / 10000 : ''}
              onChange={(e) => handleInputChange('tax_credit', e.target.value)}
              placeholder="例: 5"
              className="salary-input"
            />
            <span className="unit-text">万円</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="save-button"
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </form>

      {/* 計算結果表示 */}
      <div className="calculation-container">
        <h3 className="calculation-title">所得税計算結果</h3>
        
        <div className="calculation-content">
          <div className="calculation-step">
            <strong>{salaryData.income.toLocaleString()}円</strong> - <strong>{taxCalculation.employmentDeduction.toLocaleString()}円</strong> = <strong>{taxCalculation.employmentIncome.toLocaleString()}円</strong>
            <br />
            <span className="calculation-step-text">（収入 - 給与所得控除 = 所得金額）</span>
          </div>
          
          <div className="calculation-step">
            <strong>{taxCalculation.employmentIncome.toLocaleString()}円</strong> - <strong>{taxCalculation.totalDeduction.toLocaleString()}円</strong> = <strong>{taxCalculation.taxableIncome.toLocaleString()}円</strong>
            <br />
            <span className="calculation-step-text">（所得金額 - 所得控除 = 課税所得金額）</span>
          </div>
          
          <div className="calculation-step">
            <strong>{taxCalculation.taxableIncome.toLocaleString()}円</strong> × <strong>{taxCalculation.taxRate}%</strong> = <strong>{taxCalculation.taxAmount.toLocaleString()}円</strong>
            <br />
            <span className="calculation-step-text">（課税所得金額 × 税率 = 税額）</span>
          </div>
          
          <div className="final-result">
            <strong>{taxCalculation.taxAmount.toLocaleString()}円</strong> - <strong>{salaryData.tax_credit.toLocaleString()}円</strong> = <strong className="final-tax-amount">{taxCalculation.finalTax.toLocaleString()}円</strong>
            <br />
            <span className="calculation-step-text">（税額 - 税額控除 = 納める所得税の額）</span>
          </div>

          <div className="calculation-step">
            <strong>{taxCalculation.taxableIncome.toLocaleString()}円</strong> × <strong>10%</strong> = <strong>{taxCalculation.residenceTax.toLocaleString()}円</strong>
            <br />
            <span className="calculation-step-text">（課税所得金額 × 住民税率 = 納める住民税の額）</span>
          </div>

          <div className="final-result" style={{ background: '#fff3e0', border: '2px solid #ff9800' }}>
            <strong>{taxCalculation.finalTax.toLocaleString()}円</strong> + <strong>{taxCalculation.residenceTax.toLocaleString()}円</strong> = <strong style={{ color: '#e65100', fontSize: '1.2em' }}>{taxCalculation.totalTax.toLocaleString()}円</strong>
            <br />
            <span className="calculation-step-text">（納める所得税の額 + 納める住民税の額 = 納める税金の額）</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Salary 