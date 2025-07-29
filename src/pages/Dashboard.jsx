import React from 'react';
import '../styles/layout.css';

const Dashboard = ({ config, employees, optimizationResults, backendStatus, onRetryConnection }) => {
  const getEmployeeStats = () => {
    if (!employees.length) return { dispatchers: 0, supervisors: 0, bilingual: 0 };
    
    return {
      dispatchers: employees.filter(emp => (emp.rol || emp.Rol) === 'Despachador').length,
      supervisors: employees.filter(emp => (emp.rol || emp.Rol) === 'Supervisor').length,
      bilingual: employees.filter(emp => (emp.bilingue || emp.Bilingue) === 'Si').length
    };
  };

  const getSystemStatus = () => {
    const { dispatchers, supervisors } = getEmployeeStats();
    
    if (backendStatus !== 'online') {
      return { status: 'error', message: 'Backend desconectado - Servidor Python no disponible' };
    }
    if (employees.length === 0) {
      return { status: 'warning', message: 'Sin personal cargado - Sube un archivo CSV' };
    }
    if (dispatchers < 8) {
      return { status: 'warning', message: 'Personal despachador limitado para experimentación' };
    }
    if (supervisors < 3) {
      return { status: 'warning', message: 'Personal supervisor limitado para experimentación' };
    }
    if (optimizationResults) {
      return { status: 'success', message: 'Sistema optimizado - Resultados disponibles' };
    }
    
    return { status: 'primary', message: 'Listo para optimizar con backend Python' };
  };

  const getQuickActions = () => {
    const actions = [];
    
    if (backendStatus !== 'online') {
      actions.push({
        title: 'Conectar Backend',
        description: 'Ejecutar servidor Python (puerto 8000)',
        icon: '',
        action: () => onRetryConnection(),
        primary: true,
        disabled: false
      });
    } else if (employees.length === 0) {
      actions.push({
        title: 'Cargar Personal',
        description: 'Importar archivo CSV con empleados',
        icon: '',
        action: 'optimization',
        primary: true,
        disabled: false
      });
    } else if (!optimizationResults) {
      actions.push({
        title: 'Optimizar Turnos',
        description: 'Ejecutar algoritmo genético en servidor',
        icon: '',
        action: 'optimization',
        primary: true,
        disabled: false
      });
    } else {
      actions.push({
        title: 'Ver Resultados',
        description: 'Revisar horarios optimizados',
        icon: '',
        action: 'results',
        primary: true,
        disabled: false
      });
    }
    
    actions.push({
      title: 'Configurar Sistema',
      description: 'Ajustar parámetros y restricciones',
      icon: '',
      action: 'config',
      primary: false,
      disabled: false
    });
    
    return actions;
  };

  const stats = getEmployeeStats();
  const systemStatus = getSystemStatus();
  const quickActions = getQuickActions();

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <h1 className="page-title">Panel Principal</h1>
        <p className="page-description">
          Vista general del sistema de optimización de turnos 911 con backend Python
        </p>
      </div>

      {/* Estado del Sistema */}
      <section className="section">
        <h2 className="section-title">
          <span></span>
          Estado del Sistema
        </h2>
        
        <div className={`alert alert-${systemStatus.status === 'error' ? 'error' : systemStatus.status === 'warning' ? 'warning' : 'success'}`}>
          <strong>{systemStatus.message}</strong>
          {systemStatus.status === 'success' && optimizationResults && (
            <div style={{ marginTop: 'var(--spacing-sm)' }}>
              Última optimización: Aptitud {optimizationResults.fitness.toLocaleString()} | 
              {optimizationResults.alerts?.critical || 0} alertas críticas
            </div>
          )}
          {backendStatus === 'offline' && (
            <div style={{ marginTop: 'var(--spacing-sm)' }}>
              <strong> Para conectar:</strong> Ejecuta <code>python main.py</code> en la carpeta backend
            </div>
          )}
        </div>
      </section>

      {/* Estado del Backend */}
      <section className="section">
        <h2 className="section-title">
          <span></span>
          Backend Python
        </h2>
        
        <div className="card">
          <div className="grid grid-3">
            <div className={`stat-card ${backendStatus === 'online' ? 'success' : 'error'}`}>
              <div className="stat-header">
                <span className="stat-title">Estado del Servidor</span>
                <span style={{ fontSize: '1.5rem' }}>
                  {backendStatus === 'online' ? '' : backendStatus === 'offline' ? '' : ''}
                </span>
              </div>
              <div className="stat-value">
                {backendStatus === 'online' ? 'Conectado' : 
                 backendStatus === 'offline' ? 'Desconectado' : 'Verificando'}
              </div>
              <div className="stat-change">
                <span className={backendStatus === 'online' ? 'positive' : 'negative'}>
                  {backendStatus === 'online' ? ' FastAPI funcionando' : 
                   backendStatus === 'offline' ? ' Puerto 8000 no responde' : ' Conectando...'}
                </span>
              </div>
            </div>

            <div className="stat-card primary">
              <div className="stat-header">
                <span className="stat-title">WebSocket</span>
                <span style={{ fontSize: '1.5rem' }}>📡</span>
              </div>
              <div className="stat-value">
                {backendStatus === 'online' ? 'Disponible' : 'No disponible'}
              </div>
              <div className="stat-change">
                {backendStatus === 'online' ? ' Tiempo real listo' : ' Sin conexión'}
              </div>
            </div>

            <div className="stat-card warning">
              <div className="stat-header">
                <span className="stat-title">Algoritmo Genético</span>
                <span style={{ fontSize: '1.5rem' }}>🧬</span>
              </div>
              <div className="stat-value">
                {backendStatus === 'online' ? 'Listo' : 'No disponible'}
              </div>
              <div className="stat-change">
                {backendStatus === 'online' ? ' NumPy optimizado' : ' Requiere servidor'}
              </div>
            </div>
          </div>
          
          {backendStatus === 'offline' && (
            <div style={{ 
              marginTop: 'var(--spacing-lg)', 
              padding: 'var(--spacing-md)', 
              backgroundColor: 'var(--color-emergency-light)', 
              borderRadius: 'var(--border-radius)',
              borderLeft: '4px solid var(--color-emergency)'
            }}>
              <h4 style={{ color: 'var(--color-emergency)', marginBottom: 'var(--spacing-sm)' }}>
                 Backend No Disponible
              </h4>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-gray-700)' }}>
                <div><strong>Problema:</strong> No se puede conectar con el servidor Python en localhost:8000</div>
                <div style={{ marginTop: 'var(--spacing-sm)' }}>
                  <strong>Solución:</strong>
                  <ol style={{ marginTop: 'var(--spacing-xs)', marginLeft: 'var(--spacing-lg)' }}>
                    <li>Abre una terminal en la carpeta <code>backend/</code></li>
                    <li>Ejecuta: <code>python main.py</code></li>
                    <li>Verifica que veas: "Uvicorn running on http://0.0.0.0:8000"</li>
                    <li>Haz click en "Reintentar Conexión" abajo</li>
                  </ol>
                </div>
              </div>
              <button 
                className="btn btn-primary" 
                onClick={onRetryConnection}
                style={{ marginTop: 'var(--spacing-md)' }}
              >
                 Reintentar Conexión
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Estadísticas del Personal */}
      <section className="section">
        <h2 className="section-title">
          <span>👥</span>
          Estadísticas del Personal
        </h2>
        
        <div className="card-grid">
          <div className="stat-card primary">
            <div className="stat-header">
              <span className="stat-title">Total Empleados</span>
              <span style={{ fontSize: '1.5rem' }}>👥</span>
            </div>
            <div className="stat-value">{employees.length}</div>
            <div className="stat-change">
              {employees.length >= 15 ? 
                <span className="positive">✓ Cantidad ideal</span> :
                employees.length >= 10 ?
                <span className="positive">✓ Suficiente para experimentar</span> :
                <span className="negative">⚠ Cantidad muy limitada</span>
              }
            </div>
          </div>

          <div className="stat-card success">
            <div className="stat-header">
              <span className="stat-title">Despachadores</span>
              <span style={{ fontSize: '1.5rem' }}></span>
            </div>
            <div className="stat-value">{stats.dispatchers}</div>
            <div className="stat-change">
              <span className={stats.dispatchers >= 8 ? 'positive' : 'negative'}>
                {stats.dispatchers >= 8 ? '✓ Buena cantidad' : 
                 stats.dispatchers >= 5 ? '⚠ Cantidad limitada' : ' Muy pocos'}
              </span>
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-header">
              <span className="stat-title">Supervisores</span>
              <span style={{ fontSize: '1.5rem' }}></span>
            </div>
            <div className="stat-value">{stats.supervisors}</div>
            <div className="stat-change">
              <span className={stats.supervisors >= 4 ? 'positive' : 'negative'}>
                {stats.supervisors >= 4 ? '✓ Buena cantidad' : 
                 stats.supervisors >= 2 ? '⚠ Cantidad limitada' : ' Muy pocos'}
              </span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">Personal Bilingüe</span>
              <span style={{ fontSize: '1.5rem' }}></span>
            </div>
            <div className="stat-value">{stats.bilingual}</div>
            <div className="stat-change">
              <span style={{ color: 'var(--color-gray-600)' }}>
                {stats.bilingual > 0 ? `${((stats.bilingual/employees.length)*100).toFixed(0)}% del total` : 'Sin datos'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Configuración Actual */}
      <section className="section">
        <h2 className="section-title">
          <span></span>
          Configuración Actual
        </h2>
        
        <div className="grid grid-2">
          <div className="card">
            <h3 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--color-gray-700)' }}>
               Estaciones de Trabajo
            </h3>
            <div style={{ fontSize: '1.125rem', marginBottom: 'var(--spacing-sm)' }}>
              <strong>{config.estaciones.actual}</strong> estaciones activas
            </div>
            <div style={{ color: 'var(--color-gray-600)', fontSize: '0.875rem' }}>
              Rango: {config.estaciones.minimas} - {config.estaciones.maximas} estaciones
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--color-gray-700)' }}>
              🧬 Algoritmo Genético
            </h3>
            <div style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
              <div>Generaciones: <strong>{config.algoritmo.generaciones}</strong></div>
              <div>Población: <strong>{config.algoritmo.poblacion}</strong></div>
              <div>Cruce: <strong>{(config.algoritmo.cruceProbabilidad * 100).toFixed(0)}%</strong></div>
              <div>Mutación: <strong>{(config.algoritmo.mutacionProbabilidad * 100).toFixed(0)}%</strong></div>
            </div>
          </div>
        </div>
      </section>

      {/* Acciones Rápidas */}
      <section className="section">
        <h2 className="section-title">
          <span></span>
          Acciones Rápidas
        </h2>
        
        <div className="card-grid">
          {quickActions.map((action, index) => (
            <div key={index} className="card" style={{ 
              cursor: action.disabled ? 'not-allowed' : 'pointer', 
              opacity: action.disabled ? 0.6 : 1,
              transition: 'all 0.2s' 
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 'var(--spacing-md)',
                marginBottom: 'var(--spacing-md)'
              }}>
                <span style={{ fontSize: '2rem' }}>{action.icon}</span>
                <div>
                  <h3 style={{ 
                    margin: 0, 
                    color: action.primary ? 'var(--color-dispatch)' : 'var(--color-gray-700)' 
                  }}>
                    {action.title}
                  </h3>
                  <p style={{ 
                    margin: 0, 
                    color: 'var(--color-gray-600)', 
                    fontSize: '0.875rem' 
                  }}>
                    {action.description}
                  </p>
                </div>
              </div>
              
              <button 
                className={`btn ${action.primary ? 'btn-primary' : 'btn-secondary'}`}
                style={{ width: '100%' }}
                disabled={action.disabled}
                onClick={() => {
                  if (action.disabled) return;
                  if (typeof action.action === 'function') {
                    action.action();
                  } else {
                    // Aquí se manejaría la navegación si tuvieras un router
                    console.log('Navigate to:', action.action);
                  }
                }}
              >
                {action.primary ? 'Comenzar' : 'Configurar'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Últimos Resultados */}
      {optimizationResults && (
        <section className="section">
          <h2 className="section-title">
            <span></span>
            Última Optimización
          </h2>
          
          <div className="card">
            <div className="grid grid-3">
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: '2rem', 
                  fontWeight: 'bold', 
                  color: 'var(--color-success)' 
                }}>
                  {optimizationResults.fitness.toLocaleString()}
                </div>
                <div style={{ color: 'var(--color-gray-600)' }}>Aptitud Final</div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: '2rem', 
                  fontWeight: 'bold', 
                  color: (optimizationResults.alerts?.critical || 0) > 0 ? 'var(--color-emergency)' : 'var(--color-success)' 
                }}>
                  {optimizationResults.alerts?.critical || 0}
                </div>
                <div style={{ color: 'var(--color-gray-600)' }}>Alertas Críticas</div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: '2rem', 
                  fontWeight: 'bold', 
                  color: 'var(--color-dispatch)' 
                }}>
                  {Math.round(optimizationResults.statistics?.empleados48h || 0)}
                </div>
                <div style={{ color: 'var(--color-gray-600)' }}>Empleados 48h</div>
              </div>
            </div>
            
            <div style={{ 
              marginTop: 'var(--spacing-lg)', 
              padding: 'var(--spacing-md)', 
              backgroundColor: 'var(--color-success-light)', 
              borderRadius: 'var(--border-radius)',
              borderLeft: '4px solid var(--color-success)'
            }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-gray-700)' }}>
                <strong> Optimización exitosa:</strong> Algoritmo genético ejecutado en el servidor Python 
                con {optimizationResults.fitnessHistory?.length || 0} generaciones completadas.
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Información de Conexión */}
      <section className="section">
        <div className="card" style={{ 
          backgroundColor: backendStatus === 'online' ? 'var(--color-success-light)' : 'var(--color-warning-light)',
          borderLeft: `4px solid ${backendStatus === 'online' ? 'var(--color-success)' : 'var(--color-warning)'}`
        }}>
          <h3 style={{ 
            marginBottom: 'var(--spacing-md)', 
            color: backendStatus === 'online' ? 'var(--color-success)' : 'var(--color-warning)'
          }}>
            🔗 Estado de Conexión
          </h3>
          
          <div style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
            <div><strong>Frontend React:</strong> <span style={{ color: 'var(--color-success)' }}> Funcionando</span> (localhost:5173)</div>
            <div><strong>Backend Python:</strong> 
              <span style={{ color: backendStatus === 'online' ? 'var(--color-success)' : 'var(--color-emergency)' }}>
                {backendStatus === 'online' ? '  Conectado' : '  Desconectado'}
              </span> (localhost:8000)
            </div>
            <div><strong>WebSocket:</strong> 
              <span style={{ color: backendStatus === 'online' ? 'var(--color-success)' : 'var(--color-gray-400)' }}>
                {backendStatus === 'online' ? '  Disponible' : '  No disponible'}
              </span> (ws://localhost:8000/ws/)
            </div>
          </div>
          
          {backendStatus === 'online' && (
            <div style={{ 
              marginTop: 'var(--spacing-md)', 
              fontSize: '0.875rem',
              color: 'var(--color-gray-600)'
            }}>
              🎉 <strong>¡Todo listo!</strong> Puedes cargar empleados y ejecutar optimizaciones en el servidor Python.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;