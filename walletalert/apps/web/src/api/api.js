import axios from 'axios';

/**
 * Preconfigured Axios instance pointing at the WalletAlert API base URL.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

export default api;
