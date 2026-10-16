import axios from 'axios';
const api = axios.create({ baseURL: '/api' });
api.interceptors.request.use((c) => {
  const t = localStorage.getItem('token');
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});
export default api;
export const errMsg = (e) => e.response?.data?.errors || { _: e.response?.data?.message || 'Something went wrong' };
