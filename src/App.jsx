import { useState, useEffect } from 'react';
import './styles/global.css';
import './styles/layout.css';

// Componentes
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './pages/Dashboard';
import ConfigPanel from './pages/ConfigPanel';
import OptimizationPage from './pages/OptimizationPage';
import ResultsPage from './pages/ResultsPage';

// Servicios
import { apiService, OptimizationWebSocket, utils } from './services/api';

// Configuración por defecto
const defaultConfig = {
  estaciones: {
    minimas: 3,
    maximas: 8,
    actual: 5
  },
  turnos: {
    matutino: {
      minDespachadores: 4,
      maxDespachadores: 5,
      minSupervisores: 1,
      maxSupervisores: 2,
      minBilingues: 2
    },
    vespertino: {
      minDespachadores: 4,
      maxDespachadores: 5,
      minSupervisores: 1,
      maxSupervisores: 2,
      minBilingues: 2
    },
    nocturno: {
      minDespachadores: 3,
      maxDespachadores: 5,
      minSupervisores: 1,
      maxSupervisores: 2,
      minBilingues: 1
    }
  },
  algoritmo: {
    generaciones: 200,
    poblacion: 100,
    cruceProbabilidad: 0.9,
    mutacionProbabilidad: 0.2
  },
  configuracionEspecial: {
    finDeSemana: {
      factorReduccion: 0.7
    },
    feriados: {
      factorReduccion: 0.5
    }
  }
};

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [config, setConfig] = useState(defaultConfig);
  const [employees, setEmployees] = useState([]);
  const [optimizationResults, setOptimizationResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking'); // checking, online, offline
  const [currentSession, setCurrentSession] = useState(null);
  const [wsConnection, setWsConnection] = useState(null);
  const [realTimeFitness, setRealTimeFitness] = useState([]);

  // Verificar estado del backend al iniciar
  useEffect(() => {
    checkBackendHealth();
    loadSavedData();
  }, []);

  const checkBackendHealth = async () => {
    try {
      await apiService.healthCheck();
      setBackendStatus('online');
      console.log(' Backend conectado correctamente');
    } catch (error) {
      console.error(' Backend no disponible:', error.message);
      setBackendStatus('offline');
    }
  };

  const loadSavedData = () => {
    // Cargar empleados desde localStorage
    const savedEmployees = localStorage.getItem('sistema911_employees');
    if (savedEmployees) {
      setEmployees(JSON.parse(savedEmployees));
    }

    // Cargar configuración desde localStorage
    const savedConfig = localStorage.getItem('sistema911_config');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }

    // Cargar último resultado desde localStorage
    const savedResults = localStorage.getItem('sistema911_last_result');
    if (savedResults) {
      setOptimizationResults(JSON.parse(savedResults));
    }
  };

  const handleConfigChange = (newConfig) => {
    setConfig(prev => ({
      ...prev,
      ...newConfig
    }));
    localStorage.setItem('sistema911_config', JSON.stringify({
      ...config,
      ...newConfig
    }));
  };

  const handleEmployeesLoad = (newEmployees) => {
    setEmployees(newEmployees);
    localStorage.setItem('sistema911_employees', JSON.stringify(newEmployees));
  };

  const setupWebSocket = (sessionId) => {
    if (wsConnection) {
      wsConnection.disconnect();
    }

    const ws = new OptimizationWebSocket(sessionId);
    
    // Configurar listeners
    ws.on('fitness_update', (data) => {
      console.log(' Actualización de fitness recibida:', data);
      setRealTimeFitness(data.fitnessHistory || []);
    });
    
    ws.on('optimization_complete', (data) => {
      console.log(' Optimización completada:', data);
      const processedResult = utils.processOptimizationResult(data);
      setOptimizationResults(processedResult);
      setIsLoading(false);
      setCurrentPage('results');
      
      // Guardar resultado
      localStorage.setItem('sistema911_last_result', JSON.stringify(processedResult));
      localStorage.setItem('latest_results', 'true');
      
      // Mostrar notificación de éxito
      showNotification(' Optimización completada exitosamente', 'success');
    });
    
    ws.on('optimization_error', (error) => {
      console.error(' Error en optimización:', error);
      setIsLoading(false);
      showNotification(` Error en optimización: ${error.error || error}`, 'error');
    });

    // Conectar
    ws.connect().then(() => {
      console.log(' WebSocket conectado para sesión:', sessionId);
    }).catch(error => {
      console.error(' Error conectando WebSocket:', error);
    });

    setWsConnection(ws);
    setCurrentSession(sessionId);
  };

  const handleOptimization = async (optimizationConfig) => {
    if (backendStatus !== 'online') {
      showNotification(' Backend no disponible. Verifica que el servidor esté ejecutándose en puerto 8000.', 'error');
      return;
    }

    // Validar configuración
    const validationErrors = utils.validateConfig(config, employees);
    if (validationErrors.length > 0) {
      showNotification(` Errores de validación: ${validationErrors.join(', ')}`, 'error');
      return;
    }

    setIsLoading(true);
    setRealTimeFitness([]);
    
    try {
      // Generar ID de sesión
      const sessionId = utils.generateSessionId();
      
      // Configurar WebSocket antes de iniciar optimización
      setupWebSocket(sessionId);
      
      // Convertir empleados al formato esperado por el backend
      const backendEmployees = employees.map(emp => ({
        id: emp.id,
        nombre: emp.Nombre || emp.nombre,
        rol: emp.Rol || emp.rol,
        bilingue: emp.Bilingue || emp.bilingue,
        activo: emp.activo !== false
      }));
      
      // Iniciar optimización
      const response = await apiService.startOptimization(config, backendEmployees, sessionId);
      
      console.log(' Optimización iniciada:', response);
      showNotification(` Optimización iniciada. ${response.estimatedTime}`, 'info');
      
    } catch (error) {
      console.error(' Error iniciando optimización:', error);
      setIsLoading(false);
      showNotification(` Error iniciando optimización: ${error.message}`, 'error');
    }
  };

  const showNotification = (message, type = 'info') => {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'success' ? 'success' : type === 'error' ? 'error' : 'warning'}`;
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.zIndex = '10000';
    notification.style.maxWidth = '400px';
    notification.innerHTML = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 5000);
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard 
            config={config}
            employees={employees}
            optimizationResults={optimizationResults}
            backendStatus={backendStatus}
            onRetryConnection={checkBackendHealth}
          />
        );
      case 'config':
        return (
          <ConfigPanel 
            config={config}
            onConfigChange={handleConfigChange}
          />
        );
      case 'optimization':
        return (
          <OptimizationPage 
            config={config}
            employees={employees}
            onEmployeesLoad={handleEmployeesLoad}
            onOptimization={handleOptimization}
            isLoading={isLoading}
            backendStatus={backendStatus}
            realTimeFitness={realTimeFitness}
            apiService={apiService}
          />
        );
      case 'results':
        return (
          <ResultsPage 
            results={optimizationResults}
            employees={employees}
            config={config}
          />
        );
      default:
        return <Dashboard />;
    }
  };

  // Limpiar WebSocket al desmontar
  useEffect(() => {
    return () => {
      if (wsConnection) {
        wsConnection.disconnect();
      }
    };
  }, [wsConnection]);

  return (
    <div className="app">
      <Header 
        currentPage={currentPage}
        employeeCount={employees.length}
        hasResults={!!optimizationResults}
        backendStatus={backendStatus}
      />
      
      <div className="app-container">
        <Sidebar 
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          isLoading={isLoading}
          backendStatus={backendStatus}
        />
        
        <main className="main-content">
          <div className="container">
            {renderCurrentPage()}
          </div>
        </main>
      </div>

      {/* Loading Overlay para optimización */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>Optimizando Horarios...</h3>
            <p style={{ color: 'var(--color-gray-600)', marginBottom: 'var(--spacing-md)' }}>
              El algoritmo genético está ejecutándose en el servidor Python.
              <br />
              Progreso en tiempo real via WebSocket.
            </p>
            
            {realTimeFitness.length > 0 && (
              <div style={{ 
                marginTop: 'var(--spacing-lg)', 
                fontSize: '0.875rem',
                color: 'var(--color-gray-600)'
              }}>
                <div>Generación: {realTimeFitness.length}/{config.algoritmo.generaciones}</div>
                <div>Aptitud actual: {realTimeFitness[realTimeFitness.length - 1]?.fitness.toLocaleString()}</div>
                <div>Progreso: {((realTimeFitness.length / config.algoritmo.generaciones) * 100).toFixed(1)}%</div>
              </div>
            )}
            
            <div style={{ 
              marginTop: 'var(--spacing-lg)', 
              fontSize: '0.75rem', 
              color: 'var(--color-gray-500)' 
            }}>
              💡 Los datos se actualizan en tiempo real desde el servidor Python
            </div>
          </div>
        </div>
      )}

      {/* Indicador de estado del backend */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        backgroundColor: backendStatus === 'online' ? 'var(--color-success)' : 
                        backendStatus === 'offline' ? 'var(--color-emergency)' : 'var(--color-warning)',
        color: 'white',
        padding: 'var(--spacing-sm) var(--spacing-md)',
        borderRadius: 'var(--border-radius)',
        fontSize: '0.875rem',
        zIndex: '9999',
        cursor: backendStatus === 'offline' ? 'pointer' : 'default'
      }}
      onClick={backendStatus === 'offline' ? checkBackendHealth : undefined}
      >
        {backendStatus === 'online' ? '🟢 Backend Conectado' :
         backendStatus === 'offline' ? '🔴 Backend Desconectado (click para reintentar)' :
         '🟡 Verificando Backend...'}
      </div>
    </div>
  );
}

export default App;