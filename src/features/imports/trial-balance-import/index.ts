// Trial Balance Import Feature
export { TrialBalanceUpload } from './components/TrialBalanceUpload';
export { useTrialBalanceData } from './hooks/useTrialBalanceData';

export interface TrialBalanceData {
  trial_balance_upload_uuid: string;
  trial_balance_upload_id: number;
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
  created_at: string;
}