import React from 'react';
import '../../styles/layout.css';

// El componente Header ahora manejará la navegación principal
const Header = ({ currentPage, onPageChange, employeeCount, hasResults, backendStatus, isLoading, navItems }) => {
  const getPageTitle = () => {
    const activeItem = navItems.find(item => item.id === currentPage);
    return activeItem ? activeItem.label : 'Sistema 911';
  };

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = () => {
    if (backendStatus === 'offline') return 'var(--color-error)';
    if (employeeCount === 0) return 'var(--color-warning)';
    if (employeeCount < 10) return 'var(--color-warning)'; // Ajustado para más personal
    return 'var(--color-success)';
  };

  const getSystemStatus = () => {
    if (backendStatus === 'offline') return 'Backend Desconectado';
    if (employeeCount === 0) return 'Sin Personal Cargado';
    if (employeeCount < 10) return 'Personal Limitado';
    if (hasResults) return 'Optimizado';
    return 'Listo para Optimizar';
  };

  const handleNavClick = (pageId, disabled) => {
    if (disabled || isLoading) return;
    onPageChange(pageId);
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="header-title">
            <div className="icon">911</div>
            <div>
              <h1>Sistema de Optimización</h1>
              <div style={{ fontSize: '0.9rem', color: 'var(--color-text-medium)' }}>
                {getPageTitle()}
              </div>
            </div>
          </div>

          <nav className="header-nav">
            {navItems.map(item => (
              <a
                key={item.id}
                href="#"
                className={`nav-link ${currentPage === item.id ? 'active' : ''} ${item.disabled || isLoading ? 'disabled' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(item.id, item.disabled);
                }}
                title={item.label}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="header-status">
            <div className="status-item">
              <span style={{color: 'var(--color-text-medium)'}}>🕒</span>
              <span>{getCurrentTime()}</span>
            </div>

            <div className="status-item">
              <span style={{color: 'var(--color-text-medium)'}}>👥</span>
              <span className="status-badge neutral">
                {employeeCount} Empleados
              </span>
            </div>

            <div className="status-item">
              <span style={{color: 'var(--color-text-medium)'}}>📊</span>
              <span
                className="status-badge"
                style={{
                  backgroundColor: getStatusColor(),
                  color: getStatusColor().includes('warning') ? 'var(--color-text-dark)' : 'white' /* Texto oscuro en advertencias */
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