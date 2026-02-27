import axios from 'axios';
import { ProcessingStatus, ClassifiedPage } from '../../../shared/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface ProcessResponse {
  batchId: string;
  urlCount: number;
  message: string;
}

export interface StatusResponse {
  batchId: string;
  stats: {
    total: number;
    pending: number;
    scraping: number;
    classifying: number;
    completed: number;
    error: number;
  };
  progress: number;
  items: ProcessingStatus[];
}

export const api = {
  async processSitemap(sitemapXml: string): Promise<ProcessResponse> {
    const response = await axios.post(`${API_BASE_URL}/process`, {
      sitemapXml,
    });
    return response.data;
  },

  async getStatus(batchId: string): Promise<StatusResponse> {
    const response = await axios.get(`${API_BASE_URL}/status/${batchId}`);
    return response.data;
  },

  async getResults(batchId: string): Promise<ClassifiedPage[]> {
    const response = await axios.get(`${API_BASE_URL}/results/${batchId}`);
    return response.data;
  },
};
