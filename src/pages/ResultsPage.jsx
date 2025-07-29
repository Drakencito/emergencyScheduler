import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import '../styles/layout.css';

const ResultsPage = ({ results, employees, config }) => {
  const [activeTab, setActiveTab] = useState('summary');
  const [selectedDay, setSelectedDay] = useState(0);

  if (!results) {
    return (
      <div className="page-content fade-in">
        <div className="page-header">
          <h1 className="page-title">Resultados</h1>
          <p className="page-description">No hay resultados disponibles</p>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}></div>
          <h3 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--color-gray-600)' }}>
            Sin Resultados
          </h3>
          <p style={{ color: 'var(--color-gray-500)' }}>
            Ejecuta una optimización primero para ver los resultados aquí.
          </p>
        </div>
      </div>
    );
  }

  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const shifts = ['Matutino', 'Vespertino', 'Nocturno'];

  const getAlertSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'var(--color-emergency)';
      case 'medium': return 'var(--color-warning)';
      case 'low': return 'var(--color-dispatch)';
      default: return 'var(--color-gray-500)';
    }
  };

  const getAlertIcon = (severity) => {
    switch (severity) {
      case 'high': return '';
      case 'medium': return '';
      case 'low': return '';
      default: return '';
    }
  };

  const getFitnessQuality = (fitness) => {
    if (fitness >= 9000) return { label: 'Excelente', color: 'var(--color-success)', icon: '' };
    if (fitness >= 7000) return { label: 'Buena', color: 'var(--color-success)', icon: '' };
    if (fitness >= 5000) return { label: 'Regular', color: 'var(--color-warning)', icon: '' };
    return { label: 'Necesita Mejora', color: 'var(--color-emergency)', icon: '' };
  };

  // Generar horario basado en la matriz schedule del backend
  const generateScheduleFromMatrix = () => {
    if (!results.schedule || !employees.length) return [];
    
    return days.map((day, dayIndex) => ({
      day,
      shifts: shifts.map((shift, shiftIndex) => {
        const shiftValue = shiftIndex + 1;
        const assignedEmployees = [];
        
        // Buscar empleados asignados a este día y turno
        results.schedule.forEach((empSchedule, empIndex) => {
          if (empSchedule[dayIndex] === shiftValue && employees[empIndex]) {
            assignedEmployees.push(employees[empIndex]);
          }
        });
        
        const dispatchers = assignedEmployees.filter(emp => (emp.rol || emp.Rol) === 'Despachador');
        const supervisors = assignedEmployees.filter(emp => (emp.rol || emp.Rol) === 'Supervisor');
        
        return {
          shift,
          dispatchers,
          supervisors,
          total: assignedEmployees.length
        };
      })
    }));
  };

  const scheduleData = generateScheduleFromMatrix();

  const exportToCSV = () => {
    let csv = 'Empleado,Lunes,Martes,Miércoles,Jueves,Viernes,Sábado,Domingo\n';
    
    if (results.schedule && employees.length) {
      results.schedule.forEach((empSchedule, empIndex) => {
        if (employees[empIndex]) {
          const row = [employees[empIndex].nombre || employees[empIndex].Nombre];
          empSchedule.forEach(dayValue => {
            if (dayValue === 0) row.push('Libre');
            else if (dayValue === 1) row.push('Matutino');
            else if (dayValue === 2) row.push('Vespertino');
            else if (dayValue === 3) row.push('Nocturno');
            else row.push('Error');
          });
          csv += row.join(',') + '\n';
        }
      });
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `horarios_optimizados_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const fitnessQuality = getFitnessQuality(results.fitness);

  const tabs = [
    { id: 'summary', label: 'Resumen', icon: '' },
    { id: 'evolution', label: 'Evolución', icon: '' },
    { id: 'schedule', label: 'Horarios', icon: '' },
    { id: 'alerts', label: 'Alertas', icon: '' },
    { id: 'statistics', label: 'Estadísticas', icon: '' }
  ];

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">Resultados de Optimización</h1>
            <p className="page-description">
              Análisis completo de los horarios optimizados para {employees.length} empleados
            </p>
          </div>
          <button className="btn btn-primary" onClick={exportToCSV}>
             Exportar CSV
          </button>
        </div>
      </div>

      {/* Resumen Principal */}
      <section className="section">
        <div className="grid grid-4">
          <div className="stat-card primary">
            <div className="stat-header">
              <span className="stat-title">Aptitud Final</span>
              <span style={{ fontSize: '1.5rem' }}>{fitnessQuality.icon}</span>
            </div>
            <div className="stat-value" style={{ color: fitnessQuality.color }}>
              {results.fitness.toLocaleString()}
            </div>
            <div className="stat-change" style={{ color: fitnessQuality.color }}>
              {fitnessQuality.label}
            </div>
          </div>

          <div className="stat-card error">
            <div className="stat-header">
              <span className="stat-title">Alertas Críticas</span>
              <span style={{ fontSize: '1.5rem' }}>🚨</span>
            </div>
            <div className="stat-value">{results.alerts?.critical || 0}</div>
            <div className="stat-change">
              {(results.alerts?.critical || 0) === 0 ? 
                <span className="positive">✓ Sin problemas</span> :
                <span className="negative">Revisar urgente</span>
              }
            </div>
          </div>

          <div className="stat-card success">
            <div className="stat-header">
              <span className="stat-title">Empleados 48h</span>
              <span style={{ fontSize: '1.5rem' }}>👥</span>
            </div>
            <div className="stat-value">{Math.round(results.statistics?.empleados48h || 0)}</div>
            <div className="stat-change">
              <span className="positive">
                {(((results.statistics?.empleados48h || 0) / employees.length) * 100).toFixed(1)}% del total
              </span>
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-header">
              <span className="stat-title">Balance</span>
              <span style={{ fontSize: '1.5rem' }}>⚖️</span>
            </div>
            <div className="stat-value">{((results.statistics?.distribucionBalance || 0) * 100).toFixed(0)}%</div>
            <div className="stat-change">
              <span className={(results.statistics?.distribucionBalance || 0) > 0.8 ? 'positive' : 'negative'}>
                {(results.statistics?.distribucionBalance || 0) > 0.8 ? 'Excelente' : 'Mejorable'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Navegación por Pestañas */}
      <section className="section">
        <div style={{ 
          borderBottom: '1px solid var(--color-gray-200)', 
          marginBottom: 'var(--spacing-lg)' 
        }}>
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', overflowX: 'auto' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab(tab.id)}
                style={{ 
                  borderRadius: 'var(--border-radius) var(--border-radius) 0 0',
                  borderBottom: activeTab === tab.id ? '3px solid var(--color-dispatch)' : 'none'
                }}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contenido de Pestañas */}
        {activeTab === 'summary' && (
          <div className="fade-in">
            <div className="card">
              <h3 style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--color-gray-700)' }}>
                 Resumen Ejecutivo
              </h3>
              
              <div style={{ lineHeight: 1.8, fontSize: '1rem' }}>
                <p style={{ marginBottom: 'var(--spacing-md)' }}>
                  <strong> Optimización completada exitosamente</strong> con una aptitud de{' '}
                  <span style={{ color: fitnessQuality.color, fontWeight: 'bold' }}>
                    {results.fitness.toLocaleString()} puntos
                  </span>
                  , clasificada como <strong>{fitnessQuality.label}</strong>.
                </p>
                
                <p style={{ marginBottom: 'var(--spacing-md)' }}>
                  <strong>👥 Personal asignado:</strong> {Math.round(results.statistics?.empleados48h || 0)} de {employees.length} empleados 
                  ({(((results.statistics?.empleados48h || 0) / employees.length) * 100).toFixed(1)}%) 
                  trabajan exactamente 48 horas semanales.
                </p>
                
                <p style={{ marginBottom: 'var(--spacing-md)' }}>
                  <strong> Estado de alertas:</strong> {results.alerts?.critical || 0} críticas, {results.alerts?.warning || 0} advertencias, {results.alerts?.info || 0} informativas.
                  {(results.alerts?.critical || 0) === 0 ? ' Sistema operando dentro de parámetros normales.' : ' Revisar alertas críticas.'}
                </p>
                
                <p style={{ marginBottom: 'var(--spacing-md)' }}>
                  <strong> Balance del sistema:</strong> Distribución{' '}
                  {(results.statistics?.distribucionBalance || 0) > 0.8 ? 'excelente' : 'mejorable'} con{' '}
                  {((results.statistics?.distribucionBalance || 0) * 100).toFixed(0)}% de equilibrio entre turnos.
                </p>
                
                <p>
                  <strong> Cobertura bilingüe:</strong>{' '}
                  {((results.statistics?.coberturaBilingue || 0) * 100).toFixed(0)}% de los turnos cuentan con personal bilingüe adecuado.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'evolution' && (
          <div className="fade-in">
            <div className="card">
              <h3 style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--color-gray-700)' }}>
                 Evolución de la Aptitud
              </h3>
              
              {results.fitnessHistory && results.fitnessHistory.length > 0 ? (
                <>
                  <div style={{ height: '400px', marginBottom: 'var(--spacing-lg)' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={results.fitnessHistory}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="generation" 
                          label={{ value: 'Generación', position: 'insideBottom', offset: -10 }}
                        />
                        <YAxis 
                          label={{ value: 'Aptitud', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip 
                          formatter={(value) => [value.toLocaleString(), 'Aptitud']}
                          labelFormatter={(label) => `Generación ${label}`}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="fitness" 
                          stroke="var(--color-dispatch)" 
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="grid grid-3">
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-gray-600)' }}>
                        {results.fitnessHistory[0]?.fitness.toLocaleString()}
                      </div>
                      <div style={{ color: 'var(--color-gray-500)' }}>Aptitud Inicial</div>
                    </div>
                    
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-success)' }}>
                        {Math.max(...results.fitnessHistory.map(h => h.fitness)).toLocaleString()}
                      </div>
                      <div style={{ color: 'var(--color-gray-500)' }}>Mejor Aptitud</div>
                    </div>
                    
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-dispatch)' }}>
                        {(results.fitness - results.fitnessHistory[0]?.fitness).toLocaleString()}
                      </div>
                      <div style={{ color: 'var(--color-gray-500)' }}>Mejora Total</div>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                  <p style={{ color: 'var(--color-gray-500)' }}>
                    No hay datos de evolución disponibles
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="fade-in">
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
                {days.map((day, index) => (
                  <button
                    key={index}
                    className={`btn ${selectedDay === index ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setSelectedDay(index)}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="card">
              <h3 style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--color-gray-700)' }}>
                 Horarios - {days[selectedDay]}
              </h3>
              
              {scheduleData.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Turno</th>
                        <th>Despachadores</th>
                        <th>Supervisores</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scheduleData[selectedDay]?.shifts.map((shiftData, shiftIndex) => (
                        <tr key={shiftIndex}>
                          <td style={{ fontWeight: 'bold' }}>
                            {shiftData.shift === 'Matutino' ? '' : shiftData.shift === 'Vespertino' ? '' : ''} {shiftData.shift}
                          </td>
                          <td>
                            {shiftData.dispatchers.length > 0 ? (
                              <div>
                                {shiftData.dispatchers.map((emp, idx) => (
                                  <div key={idx} style={{ fontSize: '0.875rem', marginBottom: '2px' }}>
                                    {emp.nombre || emp.Nombre}
                                    {(emp.bilingue || emp.Bilingue) === 'Si' && (
                                      <span className="badge badge-success" style={{ marginLeft: '4px', fontSize: '0.7rem' }}>B</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span style={{ color: 'var(--color-gray-400)' }}>Sin asignar</span>
                            )}
                          </td>
                          <td>
                            {shiftData.supervisors.length > 0 ? (
                              <div>
                                {shiftData.supervisors.map((emp, idx) => (
                                  <div key={idx} style={{ fontSize: '0.875rem', marginBottom: '2px' }}>
                                    {emp.nombre || emp.Nombre}
                                    {(emp.bilingue || emp.Bilingue) === 'Si' && (
                                      <span className="badge badge-success" style={{ marginLeft: '4px', fontSize: '0.7rem' }}>B</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span style={{ color: 'var(--color-gray-400)' }}>Sin asignar</span>
                            )}
                          </td>
                          <td style={{ fontWeight: 'bold' }}>
                            {shiftData.total}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                  <p style={{ color: 'var(--color-gray-500)' }}>
                    No hay datos de horarios disponibles
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="fade-in">
            {results.alerts?.details && Object.keys(results.alerts.details).length > 0 ? (
              Object.entries(results.alerts.details).map(([severity, alertList]) => {
                if (!alertList || alertList.length === 0) return null;
                
                return (
                  <div key={severity} className="card" style={{ marginBottom: 'var(--spacing-md)' }}>
                    <h3 style={{ 
                      marginBottom: 'var(--spacing-lg)', 
                      color: getAlertSeverityColor(severity),
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-sm)'
                    }}>
                      {getAlertIcon(severity)}
                      {severity === 'high' ? 'ALERTAS CRÍTICAS' : 
                       severity === 'medium' ? 'ADVERTENCIAS' : 'INFORMATIVAS'}
                      <span className="badge" style={{ 
                        backgroundColor: getAlertSeverityColor(severity),
                        color: 'white'
                      }}>
                        {alertList.length}
                      </span>
                    </h3>
                    
                    <div style={{ lineHeight: 1.8 }}>
                      {alertList.map((alert, index) => (
                        <div 
                          key={index}
                          style={{ 
                            marginBottom: 'var(--spacing-sm)',
                            padding: 'var(--spacing-sm)',
                            borderLeft: `3px solid ${getAlertSeverityColor(severity)}`,
                            backgroundColor: 'var(--color-gray-50)'
                          }}
                        >
                          • {alert.message || alert}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}></div>
                <h3 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--color-success)' }}>
                  Sin Alertas
                </h3>
                <p style={{ color: 'var(--color-gray-600)' }}>
                  El sistema está funcionando perfectamente sin problemas detectados.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'statistics' && (
          <div className="fade-in">
            <div className="grid grid-2">
              <div className="card">
                <h3 style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--color-gray-700)' }}>
                   Estadísticas Generales
                </h3>
                
                <div style={{ lineHeight: 1.8, fontSize: '0.875rem' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    marginBottom: 'var(--spacing-sm)' 
                  }}>
                    <span>Empleados con 48h exactas:</span>
                    <strong style={{ color: 'var(--color-success)' }}>
                      {(((results.statistics?.empleados48h || 0) / employees.length) * 100).toFixed(1)}%
                    </strong>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    marginBottom: 'var(--spacing-sm)' 
                  }}>
                    <span>Alertas críticas:</span>
                    <strong style={{ color: results.alerts?.critical > 0 ? 'var(--color-emergency)' : 'var(--color-success)' }}>
                      {results.alerts?.critical || 0}
                    </strong>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    marginBottom: 'var(--spacing-sm)' 
                  }}>
                    <span>Eficiencia del algoritmo:</span>
                    <strong style={{ color: fitnessQuality.color }}>
                      {fitnessQuality.label}
                    </strong>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    marginBottom: 'var(--spacing-sm)' 
                  }}>
                    <span>Balance de distribución:</span>
                    <strong>
                      {((results.statistics?.distribucionBalance || 0) * 100).toFixed(0)}%
                    </strong>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--color-gray-700)' }}>
                   Resumen de Cumplimiento
                </h3>
                
                <div style={{ lineHeight: 1.8, fontSize: '0.875rem' }}>
                  <div style={{ marginBottom: 'var(--spacing-md)' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 'var(--spacing-xs)' }}>
                      Cobertura por Turno:
                    </div>
                    {shifts.map((shift, index) => (
                      <div key={index} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        marginBottom: 'var(--spacing-xs)' 
                      }}>
                        <span>
                          {shift === 'Matutino' ? '' : shift === 'Vespertino' ? '' : ''} {shift}:
                        </span>
                        <span>Cubierto</span>
                      </div>
                    ))}
                  </div>
                  
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: 'var(--spacing-xs)' }}>
                      Estado General:
                    </div>
                    <div style={{ color: 'var(--color-success)' }}>
                       Optimización completada exitosamente
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default ResultsPage;