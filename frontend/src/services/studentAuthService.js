// src/services/studentAuthService.js
import axios from 'axios';
const API_BASE_URL = 'http://localhost:5000/api';

const studentAuthAPI = axios.create({
  baseURL: API_BASE_URL,
});

// Intercepteur pour ajouter le token
studentAuthAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('studentToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const studentAuthService = {
  login: async (matricule) => {
    const response = await studentAuthAPI.post('/students/auth/login', { matricule });
    return response.data;
  },

  verify: async () => {
    const response = await studentAuthAPI.get('/students/auth/verify');
    return response.data;
  },

  getProfile: async () => {
    const response = await studentAuthAPI.get('/students/auth/me');
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('studentToken');
    localStorage.removeItem('studentData');
  }
};

// Utilitaires pour le matricule
export const matriculeUtils = {
  validate: (matricule) => {
    const regex = /^\d{5}-\d{2}-\d{2}$/;
    return regex.test(matricule);
  },

  format: (value) => {
    const numbers = value.replace(/\D/g, '');
    
    if (numbers.length <= 5) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
    } else {
      return `${numbers.slice(0, 5)}-${numbers.slice(5, 7)}-${numbers.slice(7, 9)}`;
    }
  }
};