// AnnaSetu API Service Module

const Api = (function() {
  // Determine API base URL dynamically
  function getBaseUrl() {
    if (window.API_BASE_URL) return window.API_BASE_URL;
    const stored = localStorage.getItem('annasetu_api_url');
    if (stored) return stored;

    const hostname = window.location.hostname;
    const port = window.location.port;

    // Local dev: if port is 5000 (served by express), use /api; otherwise default to local backend 5000
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      if (port === '5000') return '/api';
      return 'http://localhost:5000/api';
    }

    // Cloud deployment (e.g. Render, Railway, Fly.io, custom domain):
    // In unified full-stack deployment, frontend is served directly by Express, so API is relative /api
    return '/api';
  }

  function getToken() {
    return localStorage.getItem('annasetu_token') || '';
  }

  function setToken(token) {
    if (token) {
      localStorage.setItem('annasetu_token', token);
    } else {
      localStorage.removeItem('annasetu_token');
    }
  }

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem('annasetu_user') || 'null');
    } catch {
      return null;
    }
  }

  function setUser(user) {
    if (user) {
      localStorage.setItem('annasetu_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('annasetu_user');
    }
  }

  async function request(method, endpoint, data = null) {
    const url = `${getBaseUrl()}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
    const token = getToken();

    const headers = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      method: method.toUpperCase(),
      headers
    };

    if (data && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
      config.body = JSON.stringify(data);
    }

    let response;
    try {
      response = await fetch(url, config);
    } catch (networkError) {
      console.error('Network request failed:', networkError);
      throw [`Cannot reach backend API at ${url}. Please ensure the server is running and accessible.`];
    }

    let result;
    try {
      result = await response.json();
    } catch {
      result = { errors: ['Invalid response format from server'] };
    }

    if (!response.ok) {
      if (response.status === 401 && getToken()) {
        // Token expired or invalid
        setToken(null);
        setUser(null);
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }
      throw result.errors || [result.message || `Request failed with status ${response.status}`];
    }

    return result;
  }

  return {
    getBaseUrl,
    setBaseUrl: (url) => localStorage.setItem('annasetu_api_url', url),
    getToken,
    setToken,
    getUser,
    setUser,
    get: (endpoint) => request('GET', endpoint),
    post: (endpoint, data) => request('POST', endpoint, data),
    put: (endpoint, data) => request('PUT', endpoint, data),
    del: (endpoint) => request('DELETE', endpoint)
  };
})();

// Global helper for cloud or custom API URL configuration
window.promptChangeApiUrl = function() {
  const current = Api.getBaseUrl();
  const next = window.prompt(
    '🌾 AnnaSetu API Configuration\n\nEnter backend URL (default is "/api" for unified Render deployment, or https://your-service.onrender.com/api):',
    current
  );
  if (next !== null && next.trim() && next.trim() !== current) {
    Api.setBaseUrl(next.trim());
    window.location.reload();
  }
};
