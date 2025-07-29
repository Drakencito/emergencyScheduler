import { useState, useEffect } from 'react';
import './styles/global.css';
import './styles/layout.css';

// Componentes
import Header from './components/Layout/Header';
import Dashboard from './pages/Dashboard';
import ConfigPanel from './pages/ConfigPanel';
import OptimizationPage from './pages/OptimizationPage';
import ResultsPage from './pages/ResultsPage';

// Servicios (OptimizationWebSocket y apiService seguirán viniendo de aquí)
import { apiService, OptimizationWebSocket } from './services/api';

// --- Funciones que antes estaban en utils ---
// Generar ID de sesión único
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Validar configuración antes de enviar
const validateConfig = (config, employees) => {
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
};

// Convertir resultado para compatibilidad con frontend
const processOptimizationResult = (result) => {
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
};
// --- Fin de funciones que antes estaban en utils ---


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
      maxSuperpisoes: 2, // Corregí el error tipográfico aquí, debería ser minSupervisores
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
      console.log('Backend conectado correctamente');
    } catch (error) {
      console.error('Backend no disponible:', error.message);
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
      console.log('Actualización de fitness recibida:', data);
      setRealTimeFitness(data.fitnessHistory || []);
    });

    ws.on('optimization_complete', (data) => {
      console.log('Optimización completada:', data);
      // Usar la función local processOptimizationResult
      const processedResult = processOptimizationResult(data);
      setOptimizationResults(processedResult);
      setIsLoading(false);
      setCurrentPage('results');

      // Guardar resultado
      localStorage.setItem('sistema911_last_result', JSON.stringify(processedResult));
      localStorage.setItem('latest_results', 'true');

      // Mostrar notificación de éxito
      showNotification('Optimización completada exitosamente', 'success');
    });

    ws.on('optimization_error', (error) => {
      console.error('Error en optimización:', error);
      setIsLoading(false);
      showNotification(`Error en optimización: ${error.error || error}`, 'error');
    });

    // Conectar
    ws.connect().then(() => {
      console.log('WebSocket conectado para sesión:', sessionId);
    }).catch(error => {
      console.error('Error conectando WebSocket:', error);
    });

    setWsConnection(ws);
    setCurrentSession(sessionId);
  };

  const handleOptimization = async (optimizationConfig) => {
    if (backendStatus !== 'online') {
      showNotification('Backend no disponible. Verifica que el servidor esté ejecutándose en puerto 8000.', 'error');
      return;
    }

    // Usar la función local validateConfig
    const validationErrors = validateConfig(config, employees);
    if (validationErrors.length > 0) {
      showNotification(`Errores de validación: ${validationErrors.join(', ')}`, 'error');
      return;
    }

    setIsLoading(true);
    setRealTimeFitness([]);

    try {
      // Usar la función local generateSessionId
      const sessionId = generateSessionId();

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

      console.log('Optimización iniciada:', response);
      showNotification(`Optimización iniciada. ${response.estimatedTime}`, 'info');

    } catch (error) {
      console.error('Error iniciando optimización:', error);
      setIsLoading(false);
      showNotification(`Error iniciando optimización: ${error.message}`, 'error');
    }
  };

  const showNotification = (message, type = 'info') => {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type}`;
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
            // Pasar formatEstimatedTime directamente
            formatEstimatedTime={(generations, population) => {
                const totalOps = generations * population;
                const minTime = Math.ceil(totalOps / 5000);
                const maxTime = Math.ceil(totalOps / 3000);

                if (maxTime < 1) return 'menos de 1 minuto';
                if (minTime === maxTime) return `~${minTime} minuto${minTime > 1 ? 's' : ''}`;
                return `${minTime}-${maxTime} minutos`;
            }}
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

  // Items de navegación para el Header
  const navItems = [
    { id: 'dashboard', label: 'Panel Principal', icon: '📊' },
    { id: 'config', label: 'Configuración', icon: '⚙️' },
    { id: 'optimization', label: 'Optimizar Turnos', icon: '🧬' },
    {
      id: 'results',
      label: 'Resultados',
      icon: '📈',
      disabled: !localStorage.getItem('latest_results')
    }
  ];

  return (
    <div className="app">
      <Header
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        employeeCount={employees.length}
        hasResults={!!optimizationResults}
        backendStatus={backendStatus}
        isLoading={isLoading} // Pasar isLoading para deshabilitar nav durante optimización
        navItems={navItems} // Pasar los items de navegación al Header
      />

      <div className="app-container">
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
            <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Optimizando Horarios...</h3>
            <p style={{ color: 'var(--color-text-medium)', marginBottom: 'var(--spacing-lg)' }}>
              El algoritmo genético está ejecutándose en el servidor Python.
              <br />
              Progreso en tiempo real vía WebSocket.
            </p>

            {realTimeFitness.length > 0 && (
              <div style={{
                marginTop: 'var(--spacing-lg)',
                fontSize: '0.9rem',
                color: 'var(--color-text-medium)'
              }}>
                <div>Generación: {realTimeFitness.length}/{config.algoritmo.generaciones}</div>
                <div>Aptitud actual: {realTimeFitness[realTimeFitness.length - 1]?.fitness.toLocaleString()}</div>
                <div>Progreso: {((realTimeFitness.length / config.algoritmo.generaciones) * 100).toFixed(1)}%</div>
              </div>
            )}

            <div style={{
              marginTop: 'var(--spacing-lg)',
              fontSize: '0.8rem',
              color: 'var(--color-text-light)'
            }}>
              💡 Los datos se actualizan en tiempo real desde el servidor Python
            </div>
          </div>
        </div>
      )}

      {/* Indicador de estado del backend, más minimalista */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        backgroundColor: backendStatus === 'online' ? 'var(--color-success)' :
                        backendStatus === 'offline' ? 'var(--color-error)' : 'var(--color-warning)',
        color: 'white',
        padding: 'var(--spacing-sm) var(--spacing-md)',
        borderRadius: 'var(--border-radius)',
        fontSize: '0.875rem',
        zIndex: '9999',
        cursor: backendStatus === 'offline' ? 'pointer' : 'default',
        boxShadow: 'var(--shadow-sm)'
      }}
      onClick={backendStatus === 'offline' ? checkBackendHealth : undefined}
      >
        {backendStatus === 'online' ? '🟢 Backend Conectado' :
          backendStatus === 'offline' ? '🔴 Backend Desconectado (clic para reintentar)' :
          '🟡 Verificando Backend...'}
      </div>
    </div>
  );
}

export default App;