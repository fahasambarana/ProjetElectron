import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 30000,
  // ❌ NE PAS mettre de Content-Type par défaut ici
});

export default api;