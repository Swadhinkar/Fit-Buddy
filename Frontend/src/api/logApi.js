import api from "../utils/axios";

export const getTodayLog = async () => {
  const response = await api.get("/log/today");
  return response.data;
};

export const getLogHistory = async (days = 90) => {
  const response = await api.get(`/log/history?days=${days}`);
  return response.data;
};

export const updateTodayLog = async (payload) => {
  const response = await api.post("/log", payload);
  return response.data;
};
