import React from 'react';
import '../../styles/layout.css';

const Header = ({ currentPage, employeeCount, hasResults }) => {
  const getPageTitle = () => {
    switch (currentPage) {
      case 'dashboard':
        return 'Panel Principal';
      case 'config':
        return 'Configuración del Sistema';
      case 'optimization':
        return 'Optimización de Turnos';
      case 'results':
        return 'Resultados y Análisis';
      default:
        return 'Sistema 911';
    }
  };

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = () => {
    if (employeeCount === 0) return 'var(--color-emergency)';
    if (employeeCount < 15) return 'var(--color-warning)';
    return 'var(--color-success)';
  };

  const getSystemStatus = () => {
    if (employeeCount === 0) return 'Sin Personal';
    if (employeeCount < 15) return 'Personal Limitado';
    if (hasResults) return 'Optimizado';
    return 'Listo';
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="header-title">
            <div className="icon">911</div>
            <div>
              <h1>Sistema de Optimización 911</h1>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                {getPageTitle()}
              </div>
            </div>
          </div>
          
          <div className="header-status">
            <div className="status-item">
              <span>🕒</span>
              <span>{getCurrentTime()}</span>
            </div>
            
            <div className="status-item">
              <span>👥</span>
              <span className="status-badge">
                {employeeCount} Empleados
              </span>
            </div>
            
            <div className="status-item">
              <span>📊</span>
              <span 
                className="status-badge"
                style={{ 
                  backgroundColor: getStatusColor(),
                  color: 'white'
                }}
              >
                {getSystemStatus()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;