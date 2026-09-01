import axios from 'axios';

const API_BASE = '/api/v1';

export interface PredictionItem {
  id: string;
  flow_id: string;
  predicted_class: string;
  confidence: number;
  model_name: string;
  model_version: string;
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

export interface PredictionListResponse {
  items: PredictionItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  top_threat_classes: Record<string, number>;
}

export const threatsApi = {
  getThreats: async (
    token: string,
    page: number = 1,
    pageSize: number = 10,
    attackClass?: string
  ): Promise<PredictionListResponse> => {
    const params: Record<string, any> = { page, page_size: pageSize };
    if (attackClass && attackClass !== 'ALL') params.attack_class = attackClass;

    const res = await axios.get<PredictionListResponse>(`${API_BASE}/threats`, {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return res.data;
  },

  getThreatById: async (token: string, id: string): Promise<PredictionItem> => {
    const res = await axios.get<PredictionItem>(`${API_BASE}/threats/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },
};
