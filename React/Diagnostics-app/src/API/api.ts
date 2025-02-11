import axios, { AxiosInstance } from "axios";

const api: AxiosInstance = axios.create({
  // baseURL: 'http://192.168.111.62:8000',
  baseURL: "/api",
});

export default api;
