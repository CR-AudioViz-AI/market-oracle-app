/**
 * CRITICAL ERROR HANDLING FOR FINANCIAL APPLICATION
 * 
 * This utility provides enterprise-grade error handling for Market Oracle.
 * People's money depends on this being correct, so we handle ALL edge cases.
 */

export interface ErrorLog {
  timestamp: string
  errorType: string
  message: string
  context: Record<string, any>
  userId?: string
  critical: boolean
}

export class FinancialError extends Error {
  constructor(
    message: string,
    public code: string,
    public critical: boolean = false,
    public context?: Record<string, any>
  ) {
    super(message)
    this.name = 'FinancialError'
  }
}

/**
 * Log errors to both console and Supabase for monitoring
 */
export async function logError(
  error: Error | FinancialError,
  context: Record<string, any> = {},
  userId?: string
): Promise<void> {
  const errorLog: ErrorLog = {
    timestamp: new Date().toISOString(),
    errorType: error.name,
    message: error.message,
    context,
    userId,
    critical: error instanceof FinancialError ? error.critical : false
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Financial Error:', errorLog)
  }

  // Log to Supabase for monitoring
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    await supabase.from('error_logs').insert({
      error_type: errorLog.errorType,
      message: errorLog.message,
      context: errorLog.context,
      user_id: errorLog.userId,
      critical: errorLog.critical,
      created_at: errorLog.timestamp
    })
  } catch (loggingError) {
    // If logging fails, at least log to console
    console.error('Failed to log error to database:', loggingError)
  }
}

/**
 * Validate price data before calculations
 */
export function validatePrice(price: any, fieldName: string = 'price'): number {
  if (price === null || price === undefined) {
    throw new FinancialError(
      `${fieldName} is null or undefined`,
      'INVALID_PRICE_NULL',
      true,
      { price, fieldName }
    )
  }

  const numPrice = Number(price)

  if (isNaN(numPrice)) {
    throw new FinancialError(
      `${fieldName} is not a valid number: ${price}`,
      'INVALID_PRICE_NAN',
      true,
      { price, fieldName }
    )
  }

  if (numPrice < 0) {
    throw new FinancialError(
      `${fieldName} cannot be negative: ${numPrice}`,
      'INVALID_PRICE_NEGATIVE',
      true,
      { price: numPrice, fieldName }
    )
  }

  if (numPrice === 0) {
    throw new FinancialError(
      `${fieldName} cannot be zero`,
      'INVALID_PRICE_ZERO',
      true,
      { fieldName }
    )
  }

  // Penny stocks should be under $10, but we'll allow up to $1000 for edge cases
  if (numPrice > 1000) {
    throw new FinancialError(
      `${fieldName} exceeds maximum allowed value: ${numPrice}`,
      'INVALID_PRICE_TOO_HIGH',
      true,
      { price: numPrice, fieldName }
    )
  }

  return numPrice
}

/**
 * Validate quantity before calculations
 */
export function validateQuantity(quantity: any, fieldName: string = 'quantity'): number {
  if (quantity === null || quantity === undefined) {
    throw new FinancialError(
      `${fieldName} is null or undefined`,
      'INVALID_QUANTITY_NULL',
      true,
      { quantity, fieldName }
    )
  }

  const numQty = Number(quantity)

  if (isNaN(numQty)) {
    throw new FinancialError(
      `${fieldName} is not a valid number: ${quantity}`,
      'INVALID_QUANTITY_NAN',
      true,
      { quantity, fieldName }
    )
  }

  if (numQty < 0) {
    throw new FinancialError(
      `${fieldName} cannot be negative: ${numQty}`,
      'INVALID_QUANTITY_NEGATIVE',
      true,
      { quantity: numQty, fieldName }
    )
  }

  if (numQty === 0) {
    throw new FinancialError(
      `${fieldName} cannot be zero`,
      'INVALID_QUANTITY_ZERO',
      true,
      { fieldName }
    )
  }

  // Must be whole number for stock shares
  if (!Number.isInteger(numQty)) {
    throw new FinancialError(
      `${fieldName} must be a whole number for stock shares: ${numQty}`,
      'INVALID_QUANTITY_NOT_INTEGER',
      true,
      { quantity: numQty, fieldName }
    )
  }

  return numQty
}

/**
 * Safely calculate percentage change
 */
export function safePercentageChange(
  oldValue: number,
  newValue: number
): number {
  try {
    validatePrice(oldValue, 'oldValue')
    validatePrice(newValue, 'newValue')

    if (oldValue === 0) {
      throw new FinancialError(
        'Cannot calculate percentage change with zero starting value',
        'DIVISION_BY_ZERO',
        true,
        { oldValue, newValue }
      )
    }

    const change = ((newValue - oldValue) / oldValue) * 100

    // Sanity check: changes over 1000% are suspicious
    if (Math.abs(change) > 1000) {
      console.warn(`Extremely large percentage change detected: ${change}%`, { oldValue, newValue })
    }

    return change
  } catch (error) {
    logError(error as Error, { oldValue, newValue })
    throw error
  }
}

/**
 * Safely calculate position value
 */
export function safePositionValue(
  quantity: number,
  price: number
): number {
  try {
    const validQty = validateQuantity(quantity)
    const validPrice = validatePrice(price)

    const value = validQty * validPrice

    // Sanity check
    if (value > 10000000) {
      console.warn(`Very large position value calculated: $${value}`, { quantity, price })
    }

    return value
  } catch (error) {
    logError(error as Error, { quantity, price })
    throw error
  }
}

/**
 * Safely calculate Sharpe ratio
 */
export function safeSharpeRatio(
  returns: number[],
  riskFreeRate: number
): number {
  try {
    if (!Array.isArray(returns)) {
      throw new FinancialError(
        'Returns must be an array',
        'INVALID_RETURNS_TYPE',
        true,
        { returns }
      )
    }

    if (returns.length === 0) {
      return 0  // Can't calculate with no returns
    }

    // Filter out invalid returns
    const validReturns = returns.filter(r => {
      return typeof r === 'number' && !isNaN(r) && isFinite(r)
    })

    if (validReturns.length === 0) {
      return 0
    }

    const avgReturn = validReturns.reduce((sum, r) => sum + r, 0) / validReturns.length

    const variance = validReturns.reduce((sum, r) => {
      return sum + Math.pow(r - avgReturn, 2)
    }, 0) / validReturns.length

    const stdDev = Math.sqrt(variance)

    if (stdDev === 0) {
      return 0  // No volatility = can't calculate Sharpe
    }

    // Annualize
    const annualizedReturn = avgReturn * 252  // 252 trading days
    const annualizedStdDev = stdDev * Math.sqrt(252)

    const sharpe = (annualizedReturn - riskFreeRate / 100) / annualizedStdDev

    return sharpe
  } catch (error) {
    logError(error as Error, { returns, riskFreeRate })
    return 0
  }
}

/**
 * Validate date ranges
 */
export function validateDateRange(
  startDate: string,
  endDate: string
): { start: Date; end: Date } {
  const start = new Date(startDate)
  const end = new Date(endDate)

  if (isNaN(start.getTime())) {
    throw new FinancialError(
      `Invalid start date: ${startDate}`,
      'INVALID_START_DATE',
      false,
      { startDate }
    )
  }

  if (isNaN(end.getTime())) {
    throw new FinancialError(
      `Invalid end date: ${endDate}`,
      'INVALID_END_DATE',
      false,
      { endDate }
    )
  }

  if (end <= start) {
    throw new FinancialError(
      'End date must be after start date',
      'INVALID_DATE_RANGE',
      false,
      { startDate, endDate }
    )
  }

  const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)

  if (daysDiff > 365) {
    console.warn('Date range exceeds 1 year', { startDate, endDate, daysDiff })
  }

  return { start, end }
}

/**
 * Handle Supabase errors gracefully
 */
export function handleSupabaseError(
  error: any,
  operation: string
): never {
  const message = error?.message || 'Unknown database error'
  const code = error?.code || 'UNKNOWN'

  throw new FinancialError(
    `Database error during ${operation}: ${message}`,
    `SUPABASE_${code}`,
    true,
    { operation, originalError: error }
  )
}

/**
 * Retry mechanism for critical operations
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      
      if (attempt < maxRetries) {
        console.warn(`Operation failed (attempt ${attempt}/${maxRetries}), retrying...`)
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt))
      }
    }
  }

  throw new FinancialError(
    `Operation failed after ${maxRetries} attempts`,
    'MAX_RETRIES_EXCEEDED',
    true,
    { maxRetries, lastError: lastError?.message }
  )
}

/**
 * Format currency safely
 */
export function formatCurrency(
  value: number,
  includeSign: boolean = false
): string {
  try {
    if (!isFinite(value)) {
      return '$0.00'
    }

    const formatted = Math.abs(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })

    if (includeSign && value >= 0) {
      return `+$${formatted}`
    } else if (value < 0) {
      return `-$${formatted}`
    } else {
      return `$${formatted}`
    }
  } catch (error) {
    return '$0.00'
  }
}

/**
 * Format percentage safely
 */
export function formatPercentage(
  value: number,
  includeSign: boolean = false,
  decimals: number = 2
): string {
  try {
    if (!isFinite(value)) {
      return '0.00%'
    }

    const formatted = Math.abs(value).toFixed(decimals)

    if (includeSign && value >= 0) {
      return `+${formatted}%`
    } else if (value < 0) {
      return `-${formatted}%`
    } else {
      return `${formatted}%`
    }
  } catch (error) {
    return '0.00%'
  }
}
