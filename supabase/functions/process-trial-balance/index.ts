import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface ProcessedTrialBalanceRow {
  entity_uuid: string;
  account_number: string;
  account_description?: string;
  account_type: 'pl' | 'bs' | 'subledger' | 'statistical';
  amount_periodicity: 'monthly' | 'quarterly' | 'annual';
  amount_type: 'opening' | 'movement' | 'ending' | 'debit_total' | 'credit_total';
  aggregation_scope: 'period' | 'ytd' | 'qtd' | 'mtd' | 'ltm' | 'ltd' | 'custom_period';
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

interface FileCharacteristics {
  file_type: 'xlsx' | 'csv' | 'pdf';
  content_type: 'trial_balance' | 'working_trial_balance' | 'pl' | 'cashflow' | 'financial_package' | 'other';
  reporting_frequency: 'monthly' | 'quarterly' | 'annual';
  reporting_period: {
    start_date: string;
    end_date: string;
    period_key_yyyymm: number;
  };
  origin_system: string;
  currency_code: string;
  entity_name?: string;
  fiscal_year?: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { filePath, fileName, entityUuid, persistToDatabase = false } = await req.json();
    
    console.log('Processing trial balance file:', { fileName, entityUuid, persistToDatabase });

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('user-uploads-trial-balances')
      .download(filePath);

    if (downloadError) {
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    // Convert to buffer for processing
    const buffer = await fileData.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);
    console.log('File downloaded, size:', uint8Array.length, 'bytes');

    // Determine file extension
    const extension = fileName.toLowerCase().split('.').pop() || '';
    console.log('File extension:', extension);

    // Parse file based on extension
    let parsedData: any[] = [];
    switch (extension) {
      case 'csv':
        parsedData = await parseCSV(new TextDecoder().decode(uint8Array));
        break;
      case 'xlsx':
      case 'xls':
        parsedData = await parseXLSX(uint8Array);
        break;
      case 'pdf':
        parsedData = await parsePDF(uint8Array);
        break;
      default:
        throw new Error(`Unsupported file format: ${extension}`);
    }

    console.log('Parsed', parsedData.length, 'rows from file');

    // AI-powered file characteristic detection
    const characteristics = await detectFileCharacteristicsWithAI(parsedData, fileName, extension);
    console.log('Detected file characteristics:', characteristics);

    // Content type workflow branching
    if (characteristics.content_type !== 'trial_balance') {
      return new Response(JSON.stringify({
        success: true,
        characteristics,
        message: `This file is a ${characteristics.content_type.replace('_', ' ')} report. Please use the dedicated ${characteristics.content_type.replace('_', ' ')} workflow.`,
        data: null,
        requires_different_workflow: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Transform to trial balance format
    const transformedData = await transformToTrialBalanceFormat(
      parsedData,
      entityUuid,
      fileName,
      characteristics
    );

    console.log('Transformed', transformedData.length, 'records');

    if (persistToDatabase) {
      // Save to database
      const { data: insertResult, error: insertError } = await supabase
        .rpc('insert_trial_balance_data', { p_data: transformedData });

      if (insertError) {
        console.error('Database insert error:', insertError);
        throw new Error(`Failed to save data: ${insertError.message}`);
      }

      console.log('Data saved to database:', insertResult);

      // Log the upload for audit purposes
      try {
        await supabase.rpc('log_trial_balance_upload', {
          p_file_name: fileName,
          p_file_size: transformedData.length,
          p_entity_uuid: entityUuid,
          p_processing_result: {
            success: true,
            row_count: transformedData.length,
            characteristics: characteristics
          }
        });
      } catch (auditError) {
        console.warn('⚠️ Failed to log audit trail:', auditError);
        // Don't fail the main operation for audit logging failures
      }

      return new Response(JSON.stringify({
        success: true,
        characteristics,
        data: transformedData,
        rowCount: transformedData.length,
        persistResult: insertResult,
        message: `Successfully processed and saved ${transformedData.length} trial balance records`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // Return processed data for download
      return new Response(JSON.stringify({
        success: true,
        characteristics,
        data: transformedData,
        rowCount: transformedData.length,
        message: `Successfully processed ${transformedData.length} trial balance records for download`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error processing trial balance:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      message: 'Failed to process trial balance file'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Enhanced CSV parsing with better normalization
async function parseCSV(csvContent: string): Promise<any[]> {
  try {
    const lines = csvContent.split('\n').filter(line => line.trim().length > 0);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows = lines.slice(1).map((line, index) => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const row: any = { _row_number: index + 2 };
      
      headers.forEach((header, i) => {
        row[header] = values[i] || '';
      });
      
      return row;
    });

    console.log('CSV parsed:', rows.length, 'rows with headers:', headers);
    return rows;
  } catch (error) {
    console.error('Error parsing CSV:', error);
    throw new Error('Failed to parse CSV file');
  }
}

// Enhanced XLSX parsing (placeholder for future Docling integration)
async function parseXLSX(buffer: Uint8Array): Promise<any[]> {
  try {
    console.log('Parsing XLSX file (enhanced placeholder)');
    
    // TODO: Implement Docling integration here
    // For now, return enhanced mock data with realistic trial balance structure
    return [
      {
        'Account Number': '1000',
        'Account Description': 'Cash and Cash Equivalents',
        'Debit': '50000.00',
        'Credit': '',
        _row_number: 2
      },
      {
        'Account Number': '1200',
        'Account Description': 'Accounts Receivable',
        'Debit': '25000.00',
        'Credit': '',
        _row_number: 3
      },
      {
        'Account Number': '2000',
        'Account Description': 'Accounts Payable',
        'Debit': '',
        'Credit': '15000.00',
        _row_number: 4
      },
      {
        'Account Number': '3000',
        'Account Description': 'Equity',
        'Debit': '',
        'Credit': '60000.00',
        _row_number: 5
      }
    ];
  } catch (error) {
    console.error('Error parsing XLSX:', error);
    throw new Error('Failed to parse XLSX file');
  }
}

// Enhanced PDF parsing (placeholder for future Docling integration)
async function parsePDF(buffer: Uint8Array): Promise<any[]> {
  try {
    console.log('Parsing PDF file (enhanced placeholder)');
    
    // TODO: Implement Docling integration here
    // For now, return enhanced mock data
    return [
      {
        'Account Number': '4000',
        'Account Description': 'Revenue',
        'Debit': '',
        'Credit': '100000.00',
        _row_number: 2
      },
      {
        'Account Number': '5000',
        'Account Description': 'Cost of Goods Sold',
        'Debit': '60000.00',
        'Credit': '',
        _row_number: 3
      },
      {
        'Account Number': '6000',
        'Account Description': 'Operating Expenses',
        'Debit': '30000.00',
        'Credit': '',
        _row_number: 4
      }
    ];
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to parse PDF file');
  }
}

// AI-powered file characteristics detection using OpenAI
async function detectFileCharacteristicsWithAI(
  data: any[], 
  fileName: string, 
  extension: string
): Promise<FileCharacteristics> {
  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiApiKey) {
      console.warn('OpenAI API key not available, using fallback detection');
      return detectFileCharacteristicsFallback(data, fileName, extension);
    }

    // Prepare sample data for AI analysis
    const sampleData = data.slice(0, 5).map(row => {
      const cleaned = { ...row };
      delete cleaned._row_number;
      return cleaned;
    });

    const prompt = `Analyze this financial data sample and determine the file characteristics:

File Name: ${fileName}
File Type: ${extension}
Sample Data (first 5 rows):
${JSON.stringify(sampleData, null, 2)}

Please analyze and respond with a JSON object containing:
{
  "content_type": "trial_balance" | "working_trial_balance" | "pl" | "cashflow" | "financial_package" | "other",
  "reporting_frequency": "monthly" | "quarterly" | "annual",
  "period_info": {
    "start_date": "YYYY-MM-DD",
    "end_date": "YYYY-MM-DD", 
    "period_key_yyyymm": number
  },
  "origin_system": "DATEV" | "SAP" | "NetSuite" | "Excel" | "Other",
  "currency_code": "EUR" | "USD" | "GBP" | etc,
  "entity_name": "detected entity name or null",
  "fiscal_year": number or null,
  "confidence": number (0-1)
}

Focus on:
1. Is this a trial balance (balanced debits/credits) or other financial report?
2. What time period does this represent?
3. What's the likely source system based on formatting?
4. What currency is being used?
5. Can you detect the entity name from the data?`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a financial data analysis expert. Analyze the provided data and return only valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, response.statusText);
      return detectFileCharacteristicsFallback(data, fileName, extension);
    }

    const result = await response.json();
    const aiAnalysis = JSON.parse(result.choices[0].message.content);
    
    console.log('AI file analysis:', aiAnalysis);

    // Map AI response to our interface
    return {
      file_type: extension as 'xlsx' | 'csv' | 'pdf',
      content_type: aiAnalysis.content_type,
      reporting_frequency: aiAnalysis.reporting_frequency,
      reporting_period: {
        start_date: aiAnalysis.period_info.start_date,
        end_date: aiAnalysis.period_info.end_date,
        period_key_yyyymm: aiAnalysis.period_info.period_key_yyyymm
      },
      origin_system: aiAnalysis.origin_system,
      currency_code: aiAnalysis.currency_code,
      entity_name: aiAnalysis.entity_name,
      fiscal_year: aiAnalysis.fiscal_year
    };

  } catch (error) {
    console.error('Error in AI file analysis:', error);
    return detectFileCharacteristicsFallback(data, fileName, extension);
  }
}

// Fallback detection logic
function detectFileCharacteristicsFallback(
  data: any[], 
  fileName: string, 
  extension: string
): FileCharacteristics {
  console.log('Using fallback file characteristic detection');
  
  // Basic heuristics for content type detection
  let contentType: FileCharacteristics['content_type'] = 'trial_balance';
  
  // Check for P&L indicators
  const plKeywords = ['revenue', 'sales', 'income', 'expense', 'cost', 'profit', 'loss'];
  const hasPlKeywords = data.some(row => 
    Object.values(row).some(value => 
      typeof value === 'string' && 
      plKeywords.some(keyword => value.toLowerCase().includes(keyword))
    )
  );
  
  if (hasPlKeywords) {
    contentType = 'pl';
  }

  // Basic period detection from filename
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  return {
    file_type: extension as 'xlsx' | 'csv' | 'pdf',
    content_type: contentType,
    reporting_frequency: 'monthly',
    reporting_period: {
      start_date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`,
      end_date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-${new Date(currentYear, currentMonth, 0).getDate()}`,
      period_key_yyyymm: currentYear * 100 + currentMonth
    },
    origin_system: fileName.toLowerCase().includes('datev') ? 'DATEV' : 'Excel',
    currency_code: 'EUR'
  };
}

// Enhanced transformation to PRD-compliant trial balance format
async function transformToTrialBalanceFormat(
  data: any[],
  entityUuid: string,
  fileName: string,
  characteristics: FileCharacteristics
): Promise<ProcessedTrialBalanceRow[]> {
  const transformed: ProcessedTrialBalanceRow[] = [];
  const sourceHash = await generateHash(`${fileName}-${Date.now()}`);

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNumber = row._row_number || i + 1;

    // Extract account information
    const accountNumber = extractAccountNumber(row);
    const accountDescription = extractAccountDescription(row);
    
    if (!accountNumber) continue; // Skip rows without account numbers

    // Determine account type based on account number patterns
    const accountType = determineAccountType(accountNumber, accountDescription);
    
    // Extract amounts (handle both debit/credit and single amount columns)
    const amounts = extractAmounts(row);
    
    // Create records for each amount type found
    for (const amountInfo of amounts) {
      if (amountInfo.amount === 0) continue; // Skip zero amounts

      transformed.push({
        entity_uuid: entityUuid,
        account_number: accountNumber,
        account_description: accountDescription,
        account_type: accountType,
        amount_periodicity: characteristics.reporting_frequency,
        amount_type: amountInfo.type,
        aggregation_scope: 'period',
        period_key_yyyymm: characteristics.reporting_period.period_key_yyyymm,
        period_start_date: characteristics.reporting_period.start_date,
        period_end_date: characteristics.reporting_period.end_date,
        as_of_date: amountInfo.type === 'ending' ? characteristics.reporting_period.end_date : characteristics.reporting_period.start_date,
        amount: amountInfo.amount,
        currency_code: characteristics.currency_code,
        source_system: characteristics.origin_system,
        source_file_name: fileName,
        source_row_number: rowNumber,
        source_hash: sourceHash
      });
    }
  }

  return transformed;
}

// Helper functions for data extraction and classification
function extractAccountNumber(row: any): string | null {
  const possibleKeys = ['Account Number', 'Account Code', 'Konto', 'Account', 'Acc No', 'account_number'];
  
  for (const key of possibleKeys) {
    const value = row[key] || row[key.toLowerCase()] || row[key.replace(/\s+/g, '_').toLowerCase()];
    if (value && String(value).trim().length > 0) {
      return String(value).trim();
    }
  }
  
  return null;
}

function extractAccountDescription(row: any): string | null {
  const possibleKeys = ['Account Description', 'Description', 'Bezeichnung', 'Name', 'account_description'];
  
  for (const key of possibleKeys) {
    const value = row[key] || row[key.toLowerCase()] || row[key.replace(/\s+/g, '_').toLowerCase()];
    if (value && String(value).trim().length > 0) {
      return String(value).trim();
    }
  }
  
  return null;
}

function determineAccountType(accountNumber: string, description?: string | null): 'pl' | 'bs' | 'subledger' | 'statistical' {
  const accountNum = parseInt(accountNumber);
  
  // German DATEV account classification
  if (accountNum >= 1000 && accountNum <= 1999) return 'bs'; // Assets
  if (accountNum >= 2000 && accountNum <= 2999) return 'bs'; // Liabilities  
  if (accountNum >= 3000 && accountNum <= 3999) return 'bs'; // Equity
  if (accountNum >= 4000 && accountNum <= 4999) return 'pl'; // Revenue
  if (accountNum >= 5000 && accountNum <= 7999) return 'pl'; // Expenses
  if (accountNum >= 8000 && accountNum <= 8999) return 'pl'; // Other income/expenses
  if (accountNum >= 9000 && accountNum <= 9999) return 'statistical'; // Statistical accounts
  
  return 'bs'; // Default to balance sheet
}

function extractAmounts(row: any): Array<{ type: 'opening' | 'movement' | 'ending' | 'debit_total' | 'credit_total', amount: number }> {
  const amounts: Array<{ type: 'opening' | 'movement' | 'ending' | 'debit_total' | 'credit_total', amount: number }> = [];
  
  // Look for debit/credit columns
  const debitValue = parseAmount(row['Debit'] || row['debit'] || row['Soll'] || '0');
  const creditValue = parseAmount(row['Credit'] || row['credit'] || row['Haben'] || '0');
  
  if (debitValue !== 0) {
    amounts.push({ type: 'debit_total', amount: debitValue });
  }
  
  if (creditValue !== 0) {
    amounts.push({ type: 'credit_total', amount: -creditValue }); // Credits are negative
  }
  
  // If no debit/credit columns, look for other amount columns
  if (amounts.length === 0) {
    const possibleAmountKeys = ['Amount', 'Balance', 'Betrag', 'Saldo', 'amount', 'balance'];
    
    for (const key of possibleAmountKeys) {
      const value = parseAmount(row[key] || '0');
      if (value !== 0) {
        amounts.push({ type: 'ending', amount: value });
        break;
      }
    }
  }
  
  return amounts;
}

function parseAmount(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return 0;
  
  // Remove currency symbols, spaces, and convert European decimal format
  const cleaned = value
    .replace(/[€$£¥,\s]/g, '')
    .replace(/\.(?=\d{3})/g, '') // Remove thousands separators
    .replace(/,(\d{2})$/, '.$1'); // Convert European decimal comma to dot
  
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

// Generate hash for deduplication
async function generateHash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}