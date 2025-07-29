import React from 'react';
import '../../styles/layout.css';

const Sidebar = ({ currentPage, onPageChange, isLoading }) => {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Panel Principal',
      icon: '📊',
      description: 'Vista general del sistema'
    },
    {
      id: 'config',
      label: 'Configuración',
      icon: '⚙️',
      description: 'Ajustar parámetros del sistema'
    },
    {
      id: 'optimization',
      label: 'Optimizar Turnos',
      icon: '🧬',
      description: 'Ejecutar algoritmo genético'
    },
    {
      id: 'results',
      label: 'Resultados',
      icon: '📈',
      description: 'Ver horarios optimizados',
      disabled: !localStorage.getItem('latest_results')
    }
  ];

  const handleNavClick = (pageId, disabled) => {
    if (disabled || isLoading) return;
    onPageChange(pageId);
  };

  return (
    <aside className="sidebar">
      <nav>
        <ul className="sidebar-nav">
          {menuItems.map(item => (
            <li key={item.id} className="nav-item">
              <a
                href="#"
                className={`nav-link ${
                  currentPage === item.id ? 'active' : ''
                } ${
                  item.disabled || isLoading ? 'disabled' : ''
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(item.id, item.disabled);
                }}
                title={item.description}
              >
                <span className="nav-icon">{item.icon}</span>
                <div>
                  <div>{item.label}</div>
                  {item.disabled && (
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: 'var(--color-gray-400)',
                      marginTop: '2px'
                    }}>
                      Ejecutar optimización primero
                    </div>
                  )}
                </div>
              </a>
            </li>
          ))}
        </ul>
      </nav>
      
      {isLoading && (
        <div style={{
          padding: 'var(--spacing-lg)',
          textAlign: 'center',
          borderTop: '1px solid var(--color-gray-200)',
          marginTop: 'var(--spacing-lg)'
        }}>
          <div className="loading-spinner" style={{ width: '24px', height: '24px' }}></div>
          <div style={{ 
            fontSize: '0.875rem',
            color: 'var(--color-gray-600)',
            marginTop: 'var(--spacing-sm)'
          }}>
            Optimizando...
          </div>
        </div>
      )}
      
      <div style={{
        position: 'absolute',
        bottom: 'var(--spacing-lg)',
        left: 'var(--spacing-lg)',
        right: 'var(--spacing-lg)',
        fontSize: '0.75rem',
        color: 'var(--color-gray-400)',
        textAlign: 'center'
      }}>
       
      </div>
    </aside>
  );
};

export default Sidebar;
