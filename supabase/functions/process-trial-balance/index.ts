import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface ProcessedTrialBalanceRow {
  entity_uuid: string;
  account_number: string;
  account_description?: string;
  account_type: 'pl' | 'bs' | 'subledger' | 'statistical';
  amount_periodicity: 'monthly' | 'quarterly' | 'annual';
  amount_type: 'opening' | 'movement' | 'ending' | 'total' | 'debit_total' | 'credit_total';
  amount_aggregation_scope: 'period' | 'ytd' | 'qtd' | 'mtd' | 'ltm' | 'ltd';
  period_key_yyyymm: number;
  period_start_date: string;
  period_end_date: string;
  as_of_date: string;
  amount: number;
  currency_code: string;
  source_system: string;
  source_file_name: string;
  source_row_number: number;
  source_hash: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get user from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { filePath, fileName, entityUuid, persistToDatabase = false } = await req.json()
    
    console.log('Processing trial balance file:', { filePath, fileName, entityUuid })

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('user-uploads-trial-balances')
      .download(filePath)

    if (downloadError) {
      throw new Error(`Failed to download file: ${downloadError.message}`)
    }

    // Convert file to buffer for processing
    const fileBuffer = await fileData.arrayBuffer()
    const uint8Array = new Uint8Array(fileBuffer)
    
    // Parse file based on extension
    const fileExtension = fileName.toLowerCase().split('.').pop()
    let parsedData: any[] = []

    if (fileExtension === 'csv') {
      // Parse CSV
      const textDecoder = new TextDecoder()
      const csvContent = textDecoder.decode(uint8Array)
      parsedData = parseCSV(csvContent)
    } else if (fileExtension === 'xlsx') {
      // For now, simulate XLSX parsing - would use Docling in production
      parsedData = await parseXLSX(uint8Array)
    } else if (fileExtension === 'pdf') {
      // For now, simulate PDF parsing - would use Docling in production  
      parsedData = await parsePDF(uint8Array)
    } else {
      throw new Error(`Unsupported file format: ${fileExtension}`)
    }

    console.log('Parsed data rows:', parsedData.length)

    // Detect file characteristics
    const fileCharacteristics = await detectFileCharacteristics(parsedData, fileName)
    
    console.log('Detected characteristics:', fileCharacteristics)

    // Transform to trial balance format
    const processedRows = await transformToTrialBalanceFormat(
      parsedData, 
      entityUuid, 
      fileName, 
      fileCharacteristics
    )

    console.log('Processed rows:', processedRows.length)

    // Handle persistence or download
    if (persistToDatabase) {
      // For now, simulate database insertion - the function will be available once types are updated
      console.log('Would insert to database:', processedRows.length, 'rows')
      
      return new Response(
        JSON.stringify({
          success: true,
          message: `Successfully processed and would save ${processedRows.length} rows`,
          rowCount: processedRows.length,
          characteristics: fileCharacteristics
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    } else {
      // Return processed data for download
      return new Response(
        JSON.stringify({
          success: true,
          data: processedRows,
          rowCount: processedRows.length,
          characteristics: fileCharacteristics
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

  } catch (error) {
    console.error('Error processing trial balance:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

function parseCSV(csvContent: string): any[] {
  const lines = csvContent.split('\n').filter(line => line.trim())
  if (lines.length === 0) return []
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  const rows = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
    const row: any = {}
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    rows.push(row)
  }
  
  return rows
}

async function parseXLSX(buffer: Uint8Array): Promise<any[]> {
  // Placeholder for XLSX parsing with Docling
  console.log('Parsing XLSX file with Docling (placeholder)')
  
  // Mock data for demonstration
  return [
    { account_number: '1000', account_description: 'Cash', amount: '10000.00' },
    { account_number: '2000', account_description: 'Accounts Payable', amount: '-5000.00' },
    { account_number: '4000', account_description: 'Revenue', amount: '-15000.00' },
    { account_number: '6000', account_description: 'Cost of Sales', amount: '8000.00' }
  ]
}

async function parsePDF(buffer: Uint8Array): Promise<any[]> {
  // Placeholder for PDF parsing with Docling
  console.log('Parsing PDF file with Docling (placeholder)')
  
  // Mock data for demonstration
  return [
    { account_number: '1000', account_description: 'Cash', amount: '10000.00' },
    { account_number: '2000', account_description: 'Accounts Payable', amount: '-5000.00' },
    { account_number: '4000', account_description: 'Revenue', amount: '-15000.00' },
    { account_number: '6000', account_description: 'Cost of Sales', amount: '8000.00' }
  ]
}

async function detectFileCharacteristics(data: any[], fileName: string) {
  // AI/LLM-driven detection would go here
  
  const currentDate = new Date()
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() + 1
  
  return {
    fileType: fileName.toLowerCase().split('.').pop(),
    contentType: 'trial_balance', // Detected as trial balance
    reportingFrequency: 'monthly',
    reportingPeriod: {
      start_date: `${year}-${month.toString().padStart(2, '0')}-01`,
      end_date: new Date(year, month, 0).toISOString().split('T')[0]
    },
    originSystem: 'detected_system',
    currency: 'EUR',
    entityName: 'Uploaded Entity'
  }
}

async function transformToTrialBalanceFormat(
  data: any[], 
  entityUuid: string, 
  fileName: string, 
  characteristics: any
): Promise<ProcessedTrialBalanceRow[]> {
  const processedRows: ProcessedTrialBalanceRow[] = []
  
  // Generate period key from characteristics
  const periodStart = new Date(characteristics.reportingPeriod.start_date)
  const periodKey = parseInt(
    `${periodStart.getFullYear()}${(periodStart.getMonth() + 1).toString().padStart(2, '0')}`
  )
  
  // Generate source hash
  const sourceHash = await generateHash(JSON.stringify(data) + fileName)
  
  data.forEach((row, index) => {
    if (!row.account_number || !row.amount) return
    
    const amount = parseFloat(row.amount.toString().replace(/[^-0-9.]/g, ''))
    if (isNaN(amount)) return
    
    // Determine account type based on account number patterns
    let accountType: 'pl' | 'bs' | 'subledger' | 'statistical' = 'bs'
    const accountNum = row.account_number.toString()
    
    if (accountNum.startsWith('4') || accountNum.startsWith('5') || 
        accountNum.startsWith('6') || accountNum.startsWith('7')) {
      accountType = 'pl'
    } else if (accountNum.startsWith('1') || accountNum.startsWith('2') || 
               accountNum.startsWith('3')) {
      accountType = 'bs'
    }
    
    processedRows.push({
      entity_uuid: entityUuid,
      account_number: accountNum,
      account_description: row.account_description || row.description || '',
      account_type: accountType,
      amount_periodicity: characteristics.reportingFrequency as 'monthly' | 'quarterly' | 'annual',
      amount_type: 'ending', // Default to ending balance
      amount_aggregation_scope: 'period',
      period_key_yyyymm: periodKey,
      period_start_date: characteristics.reportingPeriod.start_date,
      period_end_date: characteristics.reportingPeriod.end_date,
      as_of_date: characteristics.reportingPeriod.end_date,
      amount: amount,
      currency_code: characteristics.currency,
      source_system: characteristics.originSystem,
      source_file_name: fileName,
      source_row_number: index + 1,
      source_hash: sourceHash
    })
  })
  
  return processedRows
}

async function generateHash(input: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex.substring(0, 16) // First 16 chars for brevity
}