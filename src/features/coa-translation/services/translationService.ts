import { supabase } from '@/integrations/supabase/client';
import { AccountData, TranslationSession } from '@/features/coa-translation/types';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export class TranslationService {
  static async detectLanguage(accounts: AccountData[]) {
    try {
      const { data: result, error } = await supabase.functions.invoke('detect-language', {
        body: { accounts: accounts.slice(0, 10) }
      });

      if (error) throw error;
      return result;
    } catch (error) {
      // Fallback to local detection
      const { analyzeAccountDescriptions } = await import('@/features/coa-translation/utils/languageDetection');
      return analyzeAccountDescriptions(accounts.slice(0, 10));
    }
  }

  static async createSession(sessionId: string, data: {
    filename: string;
    totalAccounts: number;
    sourceLanguage: string;
    targetLanguage: string;
    accounts: AccountData[];
  }) {
    const user = await supabase.auth.getUser();
    
    return await supabase.from('coa_translation_sessions').insert({
      session_id: sessionId,
      user_id: user.data.user?.id || '',
      filename: data.filename,
      total_accounts: data.totalAccounts,
      source_language: data.sourceLanguage,
      target_language: data.targetLanguage,
      session_data: { accounts: data.accounts } as any
    });
  }

  static async translateBatch(batch: AccountData[], options: {
    sourceLanguage: string;
    targetLanguage: string;
    sessionId: string;
    batchInfo: { currentBatch: number; totalBatches: number; };
  }) {
    const { data: result, error } = await supabase.functions.invoke('translate-accounts', {
      body: {
        accounts: batch,
        sourceLanguage: options.sourceLanguage,
        targetLanguage: options.targetLanguage,
        sessionId: options.sessionId,
        batchInfo: options.batchInfo
      }
    });

    if (error) throw error;
    return result;
  }

  static async updateSession(sessionId: string, status: 'completed' | 'failed', data?: any) {
    const updateData: any = { status };
    
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
      if (data) {
        updateData.session_data = data;
      }
    }

    return await supabase
      .from('coa_translation_sessions')
      .update(updateData)
      .eq('session_id', sessionId);
  }

  static exportToCSV(translatedData: AccountData[], filename: string) {
    const sourceLang = translatedData[0]?.sourceLanguage || 'source';
    const targetLang = translatedData[0]?.targetLanguage || 'target';
    
    const dataWithCustomHeaders = translatedData.map(row => ({
      'Account Number': row.accountNumber,
      [`Account Description [${sourceLang.toUpperCase()}]`]: row.originalDescription,
      [`Account Description [${targetLang.toUpperCase()}]`]: row.translatedDescription,
      'Source Language': row.sourceLanguage,
      'Target Language': row.targetLanguage
    }));

    const csvData = Papa.unparse(dataWithCustomHeaders, {
      header: true
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const exportFilename = `${filename.replace(/\.[^/.]+$/, '')}_translated_${timestamp}.csv`;

    saveAs(new Blob([csvData], { type: 'text/csv;charset=utf-8;' }), exportFilename);
    return exportFilename;
  }

  static exportToXLSX(translatedData: AccountData[], filename: string) {
    const sourceLang = translatedData[0]?.sourceLanguage || 'source';
    const targetLang = translatedData[0]?.targetLanguage || 'target';
    
    const dataWithCustomHeaders = translatedData.map(row => ({
      'Account Number': row.accountNumber,
      [`Account Description [${sourceLang.toUpperCase()}]`]: row.originalDescription,
      [`Account Description [${targetLang.toUpperCase()}]`]: row.translatedDescription,
      'Source Language': row.sourceLanguage,
      'Target Language': row.targetLanguage
    }));

    const ws = XLSX.utils.json_to_sheet(dataWithCustomHeaders);
    ws['!cols'] = [
      { wch: 15 }, // Account Number
      { wch: 40 }, // Account Description (Source)
      { wch: 40 }, // Account Description (Target)
      { wch: 15 }, // Source Language
      { wch: 15 }  // Target Language
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Translated Accounts');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const exportFilename = `${filename.replace(/\.[^/.]+$/, '')}_translated_${timestamp}.xlsx`;

    XLSX.writeFile(wb, exportFilename);
    return exportFilename;
  }
}