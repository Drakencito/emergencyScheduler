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

// Clase para manejar WebSocket
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

// Utilidades
export const utils = {
  // Generar ID de sesión único
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  // Formatear tiempo estimado
  formatEstimatedTime(generations, population) {
    const totalOps = generations * population;
    const minTime = Math.ceil(totalOps / 5000);
    const maxTime = Math.ceil(totalOps / 3000);
    
    if (maxTime < 1) return 'Menos de 1 minuto';
    if (minTime === maxTime) return `~${minTime} minuto${minTime > 1 ? 's' : ''}`;
    return `${minTime}-${maxTime} minutos`;
  },

  // Validar configuración antes de enviar
  validateConfig(config, employees) {
    const errors = [];

    if (!config) {
      errors.push('Configuración requerida');
      return errors;
    }

    if (!employees || employees.length < 10) {
      errors.push('Se requieren al menos 10 empleados para experimentar');
    }

    if (!config.estaciones || config.estaciones.actual < 1) {
      errors.push('Se requiere al menos 1 estación');
    }

    if (!config.algoritmo) {
      errors.push('Configuración del algoritmo requerida');
    } else {
      if (config.algoritmo.generaciones < 20) {
        errors.push('Se requieren al menos 20 generaciones');
      }
      if (config.algoritmo.poblacion < 10) {
        errors.push('Se requiere población de al menos 10');
      }
    }

    return errors;
  },

  // Convertir resultado para compatibilidad con frontend
  processOptimizationResult(result) {
    return {
      ...result,
      alerts: {
        critical: result.alerts?.critical || 0,
        warning: result.alerts?.warning || 0,
        info: result.alerts?.info || 0,
        details: result.alerts?.details || { high: [], medium: [], low: [] }
      },
      statistics: {
        empleados48h: result.statistics?.empleados48h || 0,
        distribucionBalance: result.statistics?.distribucionBalance || 0,
        coberturaBilingue: result.statistics?.coberturaBilingue || 0
      }
    };
  }
};

export default apiService;