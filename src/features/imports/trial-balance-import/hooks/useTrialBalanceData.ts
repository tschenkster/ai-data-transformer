import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TrialBalanceData {
  trial_balance_upload_uuid: string;
  trial_balance_upload_id: number;
  entity_uuid: string;
  account_number: string;
  account_description?: string;
  account_type: string;
  amount_periodicity: string;
  amount_type: string;
  aggregation_scope: string;
  amount_time_basis?: string;
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
  uploaded_by_user_uuid?: string;
  uploaded_by_user_name?: string;
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

      // For now, return empty data until migration is complete
      setData([]);
    } catch (err: any) {
      console.error('Error fetching trial balance data:', err);
      setError(err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteTrialBalanceData = async (uuid: string) => {
    // Placeholder until migration is complete
    toast({
      title: 'Info',
      description: 'Data management will be available after migration completion'
    });
  };

  const getAccountSummary = () => {
    const summary = {
      totalRecords: data.length,
      uniqueAccounts: 0,
      periods: 0,
      currencies: 0,
      totalAmount: 0,
      accountTypes: {
        pl: 0,
        bs: 0,
        subledger: 0,
        statistical: 0
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