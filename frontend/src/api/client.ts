/**
 * API Client for NetShield AI
 * Handles all HTTP requests to the backend API
 */

import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_V1_STR = import.meta.env.VITE_API_V1_STR || '/api/v1';

class APIClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}${API_V1_STR}`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for authentication
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          this.clearToken();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );

    // Load token from localStorage on initialization
    this.token = localStorage.getItem('netshield_access_token');
  }

  /**
   * Set authentication token
   */
  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('netshield_access_token', token);
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Get stored authentication token
   */
  getToken(): string | null {
    return this.token || localStorage.getItem('netshield_access_token');
  }

  /**
   * Clear authentication token
   */
  clearToken(): void {
    this.token = null;
    localStorage.removeItem('netshield_access_token');
    delete this.client.defaults.headers.common['Authorization'];
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // ============ Authentication Endpoints ============

  async login(email: string, password: string): Promise<any> {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);

    const response = await this.client.post('/auth/login', formData);
    if (response.data.access_token) {
      this.setToken(response.data.access_token);
    }
    return response.data;
  }

  async register(email: string, password: string, full_name: string, role_name: string): Promise<any> {
    return this.client.post('/auth/register', {
      email,
      password,
      full_name,
      role_name,
    });
  }

  async getCurrentUser(): Promise<any> {
    return this.client.get('/auth/me');
  }

  async logout(): Promise<void> {
    this.clearToken();
  }

  // ============ Traffic Endpoints ============

  async getTraffic(page: number = 1, pageSize: number = 10, protocol?: string, search?: string): Promise<any> {
    return this.client.get('/traffic', {
      params: { page, page_size: pageSize, protocol, search },
    });
  }

  async getTrafficStats(): Promise<any> {
    return this.client.get('/traffic/stats');
  }

  async simulateTraffic(count: number = 5): Promise<any> {
    return this.client.post('/traffic/simulate', null, {
      params: { count }
    });
  }

  async analyzeTraffic(flowId: string): Promise<any> {
    return this.client.post(`/traffic/${flowId}/analyze`);
  }

  // ============ Anomalies Endpoints ============

  async getAnomalies(page: number = 1, pageSize: number = 10, minScore?: number): Promise<any> {
    return this.client.get('/anomalies', {
      params: { page, page_size: pageSize, min_score: minScore },
    });
  }

  async getAnomaly(id: string): Promise<any> {
    return this.client.get(`/anomalies/${id}`);
  }

  async getAnomaliesStats(): Promise<any> {
    return this.client.get('/anomalies/statistics/summary');
  }

  // ============ Predictions Endpoints ============

  async getPredictions(page: number = 1, pageSize: number = 10): Promise<any> {
    return this.client.get('/prediction', {
      params: { page, page_size: pageSize },
    });
  }

  async getPrediction(id: string): Promise<any> {
    return this.client.get(`/prediction/${id}`);
  }

  async getPredictionStats(): Promise<any> {
    return this.client.get('/prediction/statistics/summary');
  }

  async getRiskAssessment(): Promise<any> {
    return this.client.get('/prediction/risk-assessment');
  }

  // ============ Threats Endpoints ============

  async getThreats(page: number = 1, pageSize: number = 10): Promise<any> {
    return this.client.get('/threats', {
      params: { page, page_size: pageSize },
    });
  }

  async getThreat(id: string): Promise<any> {
    return this.client.get(`/threats/${id}`);
  }

  async getThreatsStats(): Promise<any> {
    return this.client.get('/threats/statistics');
  }

  // ============ Alerts Endpoints ============

  async getAlerts(page: number = 1, pageSize: number = 10, status?: string): Promise<any> {
    return this.client.get('/alerts', {
      params: { page, page_size: pageSize, status },
    });
  }

  async getAlert(id: string): Promise<any> {
    return this.client.get(`/alerts/${id}`);
  }

  async acknowledgeAlert(id: string): Promise<any> {
    return this.client.post(`/alerts/${id}/acknowledge`);
  }

  async assignAlert(id: string, assigneeId: string): Promise<any> {
    return this.client.post(`/alerts/${id}/assign`, { assignee_id: assigneeId });
  }

  async resolveAlert(id: string, resolution?: string): Promise<any> {
    return this.client.post(`/alerts/${id}/resolve`, { resolution });
  }

  // ============ Incidents Endpoints ============

  async getIncidents(page: number = 1, pageSize: number = 10, status?: string): Promise<any> {
    return this.client.get('/incidents', {
      params: { page, page_size: pageSize, status },
    });
  }

  async getIncident(id: string): Promise<any> {
    return this.client.get(`/incidents/${id}`);
  }

  async createIncident(title: string, description: string, severity: string): Promise<any> {
    return this.client.post('/incidents', {
      title,
      description,
      severity,
    });
  }

  async updateIncident(id: string, data: any): Promise<any> {
    return this.client.patch(`/incidents/${id}`, data);
  }

  // ============ Analytics Endpoints ============

  async getDashboardAnalytics(): Promise<any> {
    return this.client.get('/analytics/dashboard');
  }

  async getAnalyticsSummary(): Promise<any> {
    return this.client.get('/analytics/summary');
  }

  async getTrendAnalytics(timeRange: string = '7d'): Promise<any> {
    return this.client.get('/analytics/trends', {
      params: { time_range: timeRange },
    });
  }

  // ============ Reports Endpoints ============

  async getReports(page: number = 1, pageSize: number = 10): Promise<any> {
    return this.client.get('/reports', {
      params: { page, page_size: pageSize },
    });
  }

  async generateReport(reportType: string, timeRange: string): Promise<any> {
    return this.client.post('/reports/generate', {
      report_type: reportType,
      time_range: timeRange,
    });
  }

  async downloadReport(id: string, format: string = 'pdf'): Promise<Blob> {
    const response = await this.client.get(`/reports/${id}/download`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  }

  // ============ Intelligence Endpoints ============

  async getIntelligence(page: number = 1, pageSize: number = 10): Promise<any> {
    return this.client.get('/intelligence', {
      params: { page, page_size: pageSize },
    });
  }

  // ============ Models Endpoints (Admin) ============

  async getModels(): Promise<any> {
    return this.client.get('/models');
  }

  async getModel(id: string): Promise<any> {
    return this.client.get(`/models/${id}`);
  }

  async activateModel(id: string): Promise<any> {
    return this.client.post(`/models/${id}/activate`);
  }

  async deactivateModel(id: string): Promise<any> {
    return this.client.post(`/models/${id}/deactivate`);
  }

  // ============ Users Endpoints (Admin) ============

  async getUsers(page: number = 1, pageSize: number = 10): Promise<any> {
    return this.client.get('/users', {
      params: { page, page_size: pageSize },
    });
  }

  async getUser(id: string): Promise<any> {
    return this.client.get(`/users/${id}`);
  }

  async createUser(email: string, password: string, fullName: string, roleName: string): Promise<any> {
    return this.client.post('/users', {
      email,
      password,
      full_name: fullName,
      role_name: roleName,
    });
  }

  async updateUser(id: string, data: any): Promise<any> {
    return this.client.patch(`/users/${id}`, data);
  }

  async deleteUser(id: string): Promise<any> {
    return this.client.delete(`/users/${id}`);
  }

  // ============ Audit Logs Endpoints (Admin) ============

  async getAuditLogs(page: number = 1, pageSize: number = 10, userId?: string, action?: string): Promise<any> {
    return this.client.get('/audit-logs', {
      params: { page, page_size: pageSize, user_id: userId, action },
    });
  }

  // ============ Health Endpoints ============

  async getHealth(): Promise<any> {
    return axios.get(`${API_BASE_URL}/health`);
  }

  async getApiHealth(): Promise<any> {
    return axios.get(`${API_BASE_URL}${API_V1_STR}/health`);
  }

  // ============ Generic Methods ============

  async get(endpoint: string, params?: any): Promise<any> {
    return this.client.get(endpoint, { params });
  }

  async post(endpoint: string, data?: any): Promise<any> {
    return this.client.post(endpoint, data);
  }

  async patch(endpoint: string, data?: any): Promise<any> {
    return this.client.patch(endpoint, data);
  }

  async delete(endpoint: string): Promise<any> {
    return this.client.delete(endpoint);
  }

  async put(endpoint: string, data?: any): Promise<any> {
    return this.client.put(endpoint, data);
  }
}

// Export singleton instance
export const apiClient = new APIClient();

export default apiClient;
