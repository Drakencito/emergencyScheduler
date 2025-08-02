import React from 'react';
import '../styles/layout.css';

const Dashboard = ({ config, employees, optimizationResults, backendStatus, onRetryConnection }) => {
  const getEmployeeStats = () => {
    if (!employees || !employees.length) return { dispatchers: 0, supervisors: 0, bilingual: 0 };

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
    if (!employees || employees.length === 0) {
      return { status: 'warning', message: 'Sin personal cargado - Sube un archivo CSV' };
    }
    // Ajustado el umbral para personal limitado para una optimización óptima
    if (dispatchers < 8 || supervisors < 3) {
      return { status: 'warning', message: 'Personal limitado para una optimización óptima' };
    }
    if (optimizationResults) {
      return { status: 'success', message: 'Sistema optimizado - Resultados disponibles' };
    }

    return { status: 'primary', message: 'Listo para optimizar con backend Python' };
  };

  const stats = getEmployeeStats();
  const systemStatus = getSystemStatus();

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <h1 className="page-title">Panel Principal</h1>
        <p className="page-description">
          Vista general del sistema de optimización de turnos 911 con backend Python.
        </p>
      </div>

      {/* Estado del Sistema */}
      <section className="section">
        <h2 className="section-title">
          <span></span>
          Estado del Sistema
        </h2>

        <div className={`alert alert-${systemStatus.status}`}>
          <strong>{systemStatus.message}</strong>
          {systemStatus.status === 'success' && optimizationResults && (
            <div style={{ marginTop: 'var(--spacing-sm)' }}>
              Última optimización: Aptitud {(optimizationResults.bestSchedules?.[0]?.fitness || optimizationResults.fitness || 0).toLocaleString()} |
              {optimizationResults.bestSchedules?.[0]?.alerts?.critical || optimizationResults.alerts?.critical || 0} alertas críticas
            </div>
          )}
          {backendStatus === 'offline' && (
            <div style={{ marginTop: 'var(--spacing-sm)' }}>
              <strong>Para conectar:</strong> Ejecuta <code>python main.py</code> en la carpeta <code>backend/</code>
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
              <div className="stat-value" style={{color: backendStatus === 'online' ? 'var(--color-success)' : backendStatus === 'offline' ? 'var(--color-error)' : 'var(--color-warning)'}}>
                {backendStatus === 'online' ? 'Conectado' :
                  backendStatus === 'offline' ? 'Desconectado' : 'Verificando'}
              </div>
              <div className="stat-change">
                <span className={backendStatus === 'online' ? 'positive' : 'negative'}>
                  {backendStatus === 'online' ? 'FastAPI funcionando' :
                    backendStatus === 'offline' ? 'Puerto 8000 no responde' : 'Conectando...'}
                </span>
              </div>
            </div>

            <div className="stat-card primary">
              <div className="stat-header">
                <span className="stat-title">WebSocket</span>
                <span style={{ fontSize: '1.5rem' }}></span>
              </div>
              <div className="stat-value" style={{color: backendStatus === 'online' ? 'var(--color-primary-dark)' : 'var(--color-text-light)'}}>
                {backendStatus === 'online' ? 'Disponible' : 'No disponible'}
              </div>
              <div className="stat-change neutral">
                {backendStatus === 'online' ? 'Tiempo real listo' : 'Sin conexión'}
              </div>
            </div>

            <div className="stat-card warning">
              <div className="stat-header">
                <span className="stat-title">Algoritmo Genético</span>
                <span style={{ fontSize: '1.5rem' }}></span>
              </div>
              <div className="stat-value" style={{color: backendStatus === 'online' ? 'var(--color-primary-dark)' : 'var(--color-text-light)'}}>
                {backendStatus === 'online' ? 'Listo' : 'No disponible'}
              </div>
              <div className="stat-change neutral">
                {backendStatus === 'online' ? 'NumPy optimizado' : 'Requiere servidor'}
              </div>
            </div>
          </div>

          {backendStatus === 'offline' && (
            <div style={{
              marginTop: 'var(--spacing-lg)',
              padding: 'var(--spacing-md)',
              backgroundColor: 'var(--color-error-light)',
              borderRadius: 'var(--border-radius)',
              borderLeft: '4px solid var(--color-error)'
            }}>
              <h4 style={{ color: 'var(--color-error)', marginBottom: 'var(--spacing-sm)' }}>
                Backend No Disponible
              </h4>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-dark)' }}>
                <div><strong>Problema:</strong> No se puede conectar con el servidor Python en <code>localhost:8000</code></div>
                <div style={{ marginTop: 'var(--spacing-sm)' }}>
                  <strong>Solución:</strong>
                  <ol style={{ marginTop: 'var(--spacing-xs)', marginLeft: 'var(--spacing-lg)' }}>
                    <li>Abre una terminal en la carpeta <code>backend/</code></li>
                    <li>Ejecuta: <code>python main.py</code></li>
                    <li>Verifica que veas: "Uvicorn running on http://0.0.0.0:8000"</li>
                    <li>Haz clic en "Reintentar Conexión" abajo</li>
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

      <section className="section">
        <h2 className="section-title">
          <span></span>
          Estadísticas del Personal
        </h2>

        <div className="card-grid">
          <div className="stat-card primary">
            <div className="stat-header">
              <span className="stat-title">Total Empleados</span>
              <span style={{ fontSize: '1.5rem' }}></span>
            </div>
            <div className="stat-value">{employees?.length || 0}</div>
            <div className="stat-change">
              {(employees?.length || 0) >= 15 ?
                <span className="positive"> Cantidad ideal</span> :
                (employees?.length || 0) >= 10 ?
                <span className="neutral"> Suficiente para experimentar</span> :
                <span className="negative"> Cantidad muy limitada</span>
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
                {stats.dispatchers >= 8 ? ' Buena cantidad' :
                  stats.dispatchers >= 5 ? ' Cantidad limitada' : ' Muy pocos'}
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
                {stats.supervisors >= 4 ? ' Buena cantidad' :
                  stats.supervisors >= 2 ? ' Cantidad limitada' : ' Muy pocos'}
              </span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">Personal Bilingüe</span>
              <span style={{ fontSize: '1.5rem' }}></span>
            </div>
            <div className="stat-value">{stats.bilingual}</div>
            <div className="stat-change neutral">
              <span>
                {stats.bilingual > 0 && employees?.length > 0 ? `${((stats.bilingual/employees.length)*100).toFixed(0)}% del total` : 'Sin datos'}
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
            <h3 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--color-primary-dark)' }}>
              Estaciones de Trabajo
            </h3>
            <div style={{ fontSize: '1.125rem', marginBottom: 'var(--spacing-sm)', color: 'var(--color-text-dark)' }}>
              <strong>{config?.estaciones?.actual || 0}</strong> estaciones activas
            </div>
            <div style={{ color: 'var(--color-text-medium)', fontSize: '0.875rem' }}>
              Rango: {config?.estaciones?.minimas || 0} - {config?.estaciones?.maximas || 0} estaciones
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--color-primary-dark)' }}>
              Algoritmo Genético
            </h3>
            <div style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--color-text-medium)' }}>
              <div>Generaciones: <strong>{config?.algoritmo?.generaciones || 0}</strong></div>
              <div>Población: <strong>{config?.algoritmo?.poblacion || 0}</strong></div>
              <div>Cruce: <strong>{((config?.algoritmo?.cruceProbabilidad || 0) * 100).toFixed(0)}%</strong></div>
              <div>Mutación: <strong>{((config?.algoritmo?.mutacionProbabilidad || 0) * 100).toFixed(0)}%</strong></div>
            </div>
          </div>
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
                  {(optimizationResults.bestSchedules?.[0]?.fitness || optimizationResults.fitness || 0).toLocaleString()}
                </div>
                <div style={{ color: 'var(--color-text-medium)' }}>Aptitud Final</div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: (optimizationResults.bestSchedules?.[0]?.alerts?.critical || optimizationResults.alerts?.critical || 0) > 0 ? 'var(--color-error)' : 'var(--color-success)'
                }}>
                  {optimizationResults.bestSchedules?.[0]?.alerts?.critical || optimizationResults.alerts?.critical || 0}
                </div>
                <div style={{ color: 'var(--color-text-medium)' }}>Alertas Críticas</div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: 'var(--color-primary-dark)'
                }}>
                  {Math.round(optimizationResults.bestSchedules?.[0]?.statistics?.empleados48h || optimizationResults.statistics?.empleados48h || 0)}
                </div>
                <div style={{ color: 'var(--color-text-medium)' }}>Empleados 48h</div>
              </div>
            </div>

            <div style={{
              marginTop: 'var(--spacing-lg)',
              padding: 'var(--spacing-md)',
              backgroundColor: 'var(--color-success-light)',
              borderRadius: 'var(--border-radius)',
              borderLeft: '4px solid var(--color-success)'
            }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-dark)' }}>
                <strong>Optimización exitosa:</strong> Algoritmo genético ejecutado en el servidor Python
                con {optimizationResults.fitnessHistory?.length || 0} generaciones completadas.
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Dashboard;