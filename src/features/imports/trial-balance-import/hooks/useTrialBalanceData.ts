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

      // Use rpc to query the data schema table
      const { data: trialBalanceData, error: fetchError } = await supabase
        .rpc('get_trial_balance_data', { p_entity_uuid: entityUuid });

      if (fetchError) {
        throw fetchError;
      }

      setData(trialBalanceData || []);
    } catch (err: any) {
      console.error('Error fetching trial balance data:', err);
      setError(err.message);
      toast({
        title: 'Error',
        description: 'Failed to load trial balance data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteTrialBalanceData = async (uuid: string) => {
    try {
      const { error: deleteError } = await supabase
        .rpc('delete_trial_balance_record', { p_record_uuid: uuid });

      if (deleteError) {
        throw deleteError;
      }

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