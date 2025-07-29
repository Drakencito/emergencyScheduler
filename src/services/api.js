import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para manejo de errores
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);

    if (error.response) {
      // Error del servidor
      const errorMessage = error.response.data?.detail || error.response.data?.message || 'Error del servidor';
      throw new Error(errorMessage);
    } else if (error.request) {
      // Error de conexión
      throw new Error('No se pudo conectar con el servidor. Verifica que el backend esté ejecutándose en puerto 8000.');
    } else {
      // Error de configuración
      throw new Error('Error de configuración de la solicitud');
    }
  }
);

// Servicios de la API
export const apiService = {
  // Verificar estado del servidor
  async healthCheck() {
    try {
      const response = await apiClient.get('/api/health');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Subir archivo CSV
  async uploadCSV(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post('/api/upload-csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Iniciar optimización
  async startOptimization(config, employees, sessionId = null) {
    try {
      const optimizationRequest = {
        config,
        employees,
        sessionId
      };

      const response = await apiClient.post('/api/optimize', optimizationRequest);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Obtener estado de optimización
  async getOptimizationStatus(sessionId) {
    try {
      const response = await apiClient.get(`/api/optimization/${sessionId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Obtener resultado de optimización
  async getOptimizationResult(sessionId) {
    try {
      const response = await apiClient.get(`/api/optimization/${sessionId}/result`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// Clase para manejar WebSocket (sin cambios, se mantiene)
export class OptimizationWebSocket {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.url = `ws://localhost:8000/ws/${sessionId}`;
    this.ws = null;
    this.listeners = {
      fitness_update: [],
      optimization_complete: [],
      optimization_error: [],
      connection_open: [],
      connection_close: [],
      connection_error: []
    };
  }

  connect() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = (event) => {
          console.log('WebSocket conectado:', this.sessionId);
          this.listeners.connection_open.forEach(listener => listener(event));
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('WebSocket mensaje recibido:', message);

            if (message.type && this.listeners[message.type]) {
              this.listeners[message.type].forEach(listener => listener(message.data || message));
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket desconectado:', this.sessionId);
          this.listeners.connection_close.forEach(listener => listener(event));
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.listeners.connection_error.forEach(listener => listener(error));
          reject(error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // Agregar listeners para diferentes tipos de eventos
  on(eventType, callback) {
    if (this.listeners[eventType]) {
      this.listeners[eventType].push(callback);
    }
  }

  // Remover listeners
  off(eventType, callback) {
    if (this.listeners[eventType]) {
      this.listeners[eventType] = this.listeners[eventType].filter(
        listener => listener !== callback
      );
    }
  }
}

// Objeto utils VACIADO para evitar importaciones problemáticas
export const utils = {};

export default apiService;