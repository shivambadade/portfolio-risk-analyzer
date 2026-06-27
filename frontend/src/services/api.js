import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:5000";

export const api = {
  // User endpoints
  getUsers: () => axios.get(`${API_BASE_URL}/users`),
  saveUser: (userForm) => axios.post(`${API_BASE_URL}/users`, userForm),

  // Portfolio endpoints
  analyzePortfolio: (holdings) => 
    axios.post(`${API_BASE_URL}/portfolio`, { holdings }),
  
  savePortfolio: (holdings, user) => 
    axios.post(`${API_BASE_URL}/save-portfolio`, { holdings, user }),
  
  getSavedPortfolios: (userId) => 
    axios.get(`${API_BASE_URL}/portfolios${userId ? `?user_id=${userId}` : ""}`),
  
  getPortfolioById: (portfolioId) => 
    axios.get(`${API_BASE_URL}/portfolio/${portfolioId}`),
  
  deletePortfolio: (portfolioId) => 
    axios.delete(`${API_BASE_URL}/portfolio/${portfolioId}`),

  // AI & Analysis endpoints
  getAiInsights: (holdings) => 
    axios.post(`${API_BASE_URL}/ai-insights`, { holdings }),
  
  getRecommendations: (holdings) => 
    axios.post(`${API_BASE_URL}/recommendations`, { holdings }),

  // Chatbot endpoints
  getChatHistory: (userId) => 
    axios.get(`${API_BASE_URL}/chat-history/${userId}`),
  
  askChatbot: (question, holdings, messages, user) => 
    axios.post(`${API_BASE_URL}/chatbot`, { question, portfolio: holdings, messages, user }),
  
  clearChatHistory: (userId) => 
    axios.delete(`${API_BASE_URL}/chat-history/${userId}`)
};
