import { supabase } from '@/integrations/supabase/client';

export interface HealthRecord {
  id: string;
  title: string;
  description: string | null;
  record_type: string;
  service_date: string;
  provider_name: string | null;
  file_name: string | null;
  file_url: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface HealthRecordSummary {
  totalRecords: number;
  recentRecords: HealthRecord[];
  recordTypes: { [key: string]: number };
}

export const getHealthRecords = async (userId: string): Promise<HealthRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('health_records')
      .select('*')
      .eq('user_id', userId)
      .order('service_date', { ascending: false });

    if (error) {
      console.error('Error fetching health records:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getHealthRecords:', error);
    throw error;
  }
};

export const getHealthRecordSummary = async (userId: string): Promise<HealthRecordSummary> => {
  try {
    const records = await getHealthRecords(userId);
    
    const recordTypes: { [key: string]: number } = {};
    records.forEach(record => {
      recordTypes[record.record_type] = (recordTypes[record.record_type] || 0) + 1;
    });

    return {
      totalRecords: records.length,
      recentRecords: records.slice(0, 5), // Last 5 records
      recordTypes
    };
  } catch (error) {
    console.error('Error in getHealthRecordSummary:', error);
    throw error;
  }
};

export const createHealthRecord = async (recordData: Omit<HealthRecord, 'id' | 'created_at' | 'updated_at'>): Promise<HealthRecord> => {
  try {
    const { data, error } = await supabase
      .from('health_records')
      .insert(recordData)
      .select()
      .single();

    if (error) {
      console.error('Error creating health record:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createHealthRecord:', error);
    throw error;
  }
};
