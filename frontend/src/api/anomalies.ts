import axios from 'axios';

const API_BASE = '/api/v1';

export interface AnomalyItem {
  id: string;
  flow_id: string;
  anomaly_score: number;
  is_anomaly: boolean;
  model_name: string;
  model_version: string;
  contributing_features?: Record<string, any>;
  created_at: string;
  flow?: {
    source_ip: string;
    destination_ip: string;
    source_port: number;
    destination_port: number;
    protocol: string;
    packets: number;
    bytes: number;
    duration: number;
  };
}

export interface AnomalyListResponse {
  items: AnomalyItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  total_anomalies_count: number;
  avg_anomaly_score: number;
}

export const anomaliesApi = {
  getAnomalies: async (
    token: string,
    page: number = 1,
    pageSize: number = 10,
    minScore?: number
  ): Promise<AnomalyListResponse> => {
    const params: Record<string, any> = { page, page_size: pageSize };
    if (minScore !== undefined) params.min_score = minScore;

    const res = await axios.get<AnomalyListResponse>(`${API_BASE}/anomalies`, {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return res.data;
  },

  getAnomalyById: async (token: string, id: string): Promise<AnomalyItem> => {
    const res = await axios.get<AnomalyItem>(`${API_BASE}/anomalies/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },
};
