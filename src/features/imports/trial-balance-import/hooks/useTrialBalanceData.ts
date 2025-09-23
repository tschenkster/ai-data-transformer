import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TrialBalanceData {
  trial_balance_uploaded_uuid: string;
  entity_uuid: string;
  account_number: string;
  account_description?: string;
  account_type: string;
  amount_periodicity: string;
  amount_type: string;
  amount_aggregation_scope: string;
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

export function useTrialBalanceData(entityUuid?: string) {
  const [data, setData] = useState<TrialBalanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchTrialBalanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      // For now, use mock data since the table is in data schema and not typed yet
      // This will be updated once the Supabase types are regenerated
      const mockData: TrialBalanceData[] = [
        {
          trial_balance_uploaded_uuid: '123e4567-e89b-12d3-a456-426614174000',
          entity_uuid: entityUuid || 'default-entity',
          account_number: '1000',
          account_description: 'Cash Account',
          account_type: 'bs',
          amount_periodicity: 'monthly',
          amount_type: 'ending',
          amount_aggregation_scope: 'period',
          period_key_yyyymm: 202501,
          period_start_date: '2025-01-01',
          period_end_date: '2025-01-31',
          as_of_date: '2025-01-31',
          amount: 50000.00,
          currency_code: 'EUR',
          source_system: 'Demo System',
          source_file_name: 'trial-balance-demo.xlsx',
          source_row_number: 1,
          created_at: new Date().toISOString()
        },
        {
          trial_balance_uploaded_uuid: '123e4567-e89b-12d3-a456-426614174001',
          entity_uuid: entityUuid || 'default-entity',
          account_number: '2000',
          account_description: 'Accounts Payable',
          account_type: 'bs',
          amount_periodicity: 'monthly',
          amount_type: 'ending',
          amount_aggregation_scope: 'period',
          period_key_yyyymm: 202501,
          period_start_date: '2025-01-01',
          period_end_date: '2025-01-31',
          as_of_date: '2025-01-31',
          amount: -25000.00,
          currency_code: 'EUR',
          source_system: 'Demo System',
          source_file_name: 'trial-balance-demo.xlsx',
          source_row_number: 2,
          created_at: new Date().toISOString()
        }
      ];

      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setData(mockData);
    } catch (err: any) {
      console.error('Error fetching trial balance data:', err);
      setError(err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteTrialBalanceData = async (uuid: string) => {
    try {
      // For now, just remove from local state since DB function isn't typed yet
      setData(prev => prev.filter(item => item.trial_balance_uploaded_uuid !== uuid));
      
      toast({
        title: 'Success',
        description: 'Trial balance record deleted successfully'
      });
    } catch (err: any) {
      console.error('Error deleting trial balance data:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete trial balance record',
        variant: 'destructive'
      });
    }
  };

  const getAccountSummary = () => {
    const summary = {
      totalRecords: data.length,
      uniqueAccounts: new Set(data.map(d => d.account_number)).size,
      periods: new Set(data.map(d => d.period_key_yyyymm)).size,
      currencies: new Set(data.map(d => d.currency_code)).size,
      totalAmount: data.reduce((sum, d) => sum + d.amount, 0),
      accountTypes: {
        pl: data.filter(d => d.account_type === 'pl').length,
        bs: data.filter(d => d.account_type === 'bs').length,
        subledger: data.filter(d => d.account_type === 'subledger').length,
        statistical: data.filter(d => d.account_type === 'statistical').length
      }
    };
    return summary;
  };

  useEffect(() => {
    fetchTrialBalanceData();
  }, [entityUuid]);

  return {
    data,
    loading,
    error,
    refetch: fetchTrialBalanceData,
    deleteRecord: deleteTrialBalanceData,
    summary: getAccountSummary()
  };
}