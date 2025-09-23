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

      // Fetch actual data from database
      const { data: trialBalanceData, error: fetchError } = await supabase.rpc('get_trial_balance_data', {
        p_entity_uuid: entityUuid || null
      });

      if (fetchError) {
        console.error('Error fetching trial balance data:', fetchError);
        throw new Error(fetchError.message);
      }

      // Transform data to match interface
      const transformedData: TrialBalanceData[] = (trialBalanceData || []).map((row: any) => ({
        trial_balance_uploaded_uuid: row.trial_balance_uploaded_uuid,
        entity_uuid: row.entity_uuid,
        account_number: row.account_number,
        account_description: row.account_description,
        account_type: row.account_type,
        amount_periodicity: row.amount_periodicity,
        amount_type: row.amount_type,
        amount_aggregation_scope: row.amount_aggregation_scope,
        period_key_yyyymm: row.period_key_yyyymm,
        period_start_date: row.period_start_date,
        period_end_date: row.period_end_date,
        as_of_date: row.as_of_date,
        amount: parseFloat(row.amount),
        currency_code: row.currency_code,
        source_system: row.source_system,
        source_file_name: row.source_file_name,
        source_row_number: row.source_row_number,
        created_at: row.created_at
      }));
      
      setData(transformedData);
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
      // Call actual database function to delete record
      const { data: deleteResult, error: deleteError } = await supabase.rpc('delete_trial_balance_record', {
        p_uuid: uuid
      });

      if (deleteError) {
        console.error('Error deleting trial balance data:', deleteError);
        throw new Error(deleteError.message);
      }

      // Parse the JSON result
      const result = deleteResult as { success: boolean; message: string } | null;

      if (result?.success) {
        // Remove from local state after successful deletion
        setData(prev => prev.filter(item => item.trial_balance_uploaded_uuid !== uuid));
        
        toast({
          title: 'Success',
          description: 'Trial balance record deleted successfully'
        });
      } else {
        throw new Error(result?.message || 'Failed to delete record');
      }
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