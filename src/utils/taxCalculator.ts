// 給与所得控除の計算（簡易版）
export const calculateEmploymentIncomeDeduction = (income: number): number => {
  if (income <= 1625000) return 550000
  if (income <= 1800000) return income * 0.4
  if (income <= 3600000) return income * 0.3 + 180000
  if (income <= 6600000) return income * 0.2 + 540000
  if (income <= 8500000) return income * 0.1 + 1200000
  return 1950000
}

// 社会保険料控除の概算計算（簡易版）
export const calculateSocialInsuranceDeduction = (income: number): number => {
  // 健康保険料（約10%）、厚生年金保険料（約9.15%）、雇用保険料（約0.3%）の合計
  // 実際の計算は複雑なので、概算として収入の約19.45%を使用
  return Math.round(income * 0.1945)
}

// 税率の計算（簡易版）
export const calculateTaxRate = (taxableIncome: number): number => {
  if (taxableIncome <= 1950000) return 0.05
  if (taxableIncome <= 3300000) return 0.10
  if (taxableIncome <= 6950000) return 0.20
  if (taxableIncome <= 9000000) return 0.23
  if (taxableIncome <= 18000000) return 0.33
  if (taxableIncome <= 40000000) return 0.40
  return 0.45
}

// 住民税の計算（簡易版）
export const calculateResidenceTax = (taxableIncome: number): number => {
  // 住民税は課税所得金額の約10%
  return Math.round(taxableIncome * 0.1)
}

// 税金計算のメイン関数
export interface TaxCalculationResult {
  employmentDeduction: number
  employmentIncome: number
  totalDeduction: number
  taxableIncome: number
  taxRate: number
  taxAmount: number
  finalTax: number
  residenceTax: number
  totalTax: number
}

export const calculateTax = (
  income: number,
  socialInsuranceDeduction: number,
  otherDeduction: number,
  taxCredit: number
): TaxCalculationResult => {
  const employmentDeduction = calculateEmploymentIncomeDeduction(income)
  const employmentIncome = income - employmentDeduction
  const totalDeduction = socialInsuranceDeduction + otherDeduction
  const taxableIncome = employmentIncome - totalDeduction
  const taxRate = calculateTaxRate(taxableIncome)
  const taxAmount = taxableIncome * taxRate
  const finalTax = taxAmount - taxCredit
  const residenceTax = calculateResidenceTax(taxableIncome)

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