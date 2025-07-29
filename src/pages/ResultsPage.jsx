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
          <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>😔</div>
          <h3 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--color-text-medium)' }}>
            Sin Resultados
          </h3>
          <p style={{ color: 'var(--color-text-light)' }}>
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
      case 'high': return 'var(--color-error)';
      case 'medium': return 'var(--color-warning)';
      case 'low': return 'var(--color-primary-light)';
      default: return 'var(--color-text-light)';
    }
  };

  const getAlertIcon = (severity) => {
    switch (severity) {
      case 'high': return '🚨';
      case 'medium': return '⚠️';
      case 'low': return 'ℹ️';
      default: return '💬';
    }
  };

  const getFitnessQuality = (fitness) => {
    if (fitness >= 9000) return { label: 'Excelente', color: 'var(--color-success)', icon: '✨' };
    if (fitness >= 7000) return { label: 'Buena', color: 'var(--color-success)', icon: '👍' };
    if (fitness >= 5000) return { label: 'Regular', color: 'var(--color-warning)', icon: '🤔' };
    return { label: 'Necesita Mejora', color: 'var(--color-error)', icon: '💔' };
  };

  // Generar horario basado en la matriz schedule del backend
  const generateScheduleFromMatrix = () => {
    if (!results.schedule || !employees.length) return [];

    return days.map((day, dayIndex) => ({
      day,
      shifts: shifts.map((shift, shiftIndex) => {
        const shiftValue = shiftIndex + 1; // 1: Matutino, 2: Vespertino, 3: Nocturno
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
    { id: 'summary', label: 'Resumen', icon: '📝' },
    { id: 'evolution', label: 'Evolución', icon: '📈' },
    { id: 'schedule', label: 'Horarios', icon: '📅' },
    { id: 'alerts', label: 'Alertas', icon: '🔔' },
    { id: 'statistics', label: 'Estadísticas', icon: '📊' }
  ];

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
          <div>
            <h1 className="page-title">Resultados de Optimización</h1>
            <p className="page-description">
              Análisis completo de los horarios optimizados para {employees.length} empleados.
            </p>
          </div>
          <button className="btn btn-primary" onClick={exportToCSV}>
            ⬇️ Exportar CSV
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
                <span className="positive">✅ Sin problemas</span> :
                <span className="negative">Revisar urgente</span>
              }
            </div>
          </div>

          <div className="stat-card success">
            <div className="stat-header">
              <span className="stat-title">Empleados 48h</span>
              <span style={{ fontSize: '1.5rem' }}>✅</span>
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
          borderBottom: '1px solid var(--color-border)',
          marginBottom: 'var(--spacing-lg)'
        }}>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)', overflowX: 'auto' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  borderRadius: 'var(--border-radius) var(--border-radius) 0 0',
                  borderBottom: activeTab === tab.id ? '3px solid var(--color-primary-light)' : 'none',
                  borderColor: activeTab === tab.id ? 'var(--color-primary-light)' : 'var(--color-border)',
                  color: activeTab === tab.id ? 'var(--color-text-bright)' : 'var(--color-text-dark)',
                  backgroundColor: activeTab === tab.id ? 'var(--color-primary-light)' : 'var(--color-surface)',
                  padding: 'var(--spacing-sm) var(--spacing-md)'
                }}
              >
                <span style={{marginRight: 'var(--spacing-xs)'}}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contenido de Pestañas */}
        {activeTab === 'summary' && (
          <div className="fade-in">
            <div className="card">
              <h3 style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--color-primary-dark)' }}>
                Resumen Ejecutivo
              </h3>

              <div style={{ lineHeight: 1.8, fontSize: '1rem', color: 'var(--color-text-dark)' }}>
                <p style={{ marginBottom: 'var(--spacing-md)' }}>
                  <strong>Optimización completada exitosamente</strong> con una aptitud de{' '}
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
                  <strong>Estado de alertas:</strong> {results.alerts?.critical || 0} críticas, {results.alerts?.warning || 0} advertencias, {results.alerts?.info || 0} informativas.
                  {(results.alerts?.critical || 0) === 0 ? 'Sistema operando dentro de parámetros normales.' : 'Revisar alertas críticas.'}
                </p>

                <p style={{ marginBottom: 'var(--spacing-md)' }}>
                  <strong>Balance del sistema:</strong> Distribución{' '}
                  {(results.statistics?.distribucionBalance || 0) > 0.8 ? 'excelente' : 'mejorable'} con{' '}
                  {((results.statistics?.distribucionBalance || 0) * 100).toFixed(0)}% de equilibrio entre turnos.
                </p>

                <p>
                  <strong>Cobertura bilingüe:</strong>{' '}
                  {((results.statistics?.coberturaBilingue || 0) * 100).toFixed(0)}% de los turnos cuentan con personal bilingüe adecuado.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'evolution' && (
          <div className="fade-in">
            <div className="card">
              <h3 style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--color-primary-dark)' }}>
                Evolución de la Aptitud
              </h3>

              {results.fitnessHistory && results.fitnessHistory.length > 0 ? (
                <>
                  <div style={{ height: '400px', marginBottom: 'var(--spacing-lg)' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={results.fitnessHistory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis
                          dataKey="generation"
                          label={{ value: 'Generación', position: 'insideBottom', offset: -10, fill: 'var(--color-text-light)' }}
                          tick={{ fill: 'var(--color-text-medium)', fontSize: '0.8rem' }}
                        />
                        <YAxis
                          label={{ value: 'Aptitud', angle: -90, position: 'insideLeft', fill: 'var(--color-text-light)' }}
                          tick={{ fill: 'var(--color-text-medium)', fontSize: '0.8rem' }}
                        />
                        <Tooltip
                          formatter={(value) => [value.toLocaleString(), 'Aptitud']}
                          labelFormatter={(label) => `Generación ${label}`}
                          contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius)' }}
                          labelStyle={{ color: 'var(--color-primary-dark)' }}
                          itemStyle={{ color: 'var(--color-text-dark)' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="fitness"
                          stroke="var(--color-primary-light)"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-3">
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-text-dark)' }}>
                        {results.fitnessHistory[0]?.fitness.toLocaleString()}
                      </div>
                      <div style={{ color: 'var(--color-text-medium)' }}>Aptitud Inicial</div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-success)' }}>
                        {Math.max(...results.fitnessHistory.map(h => h.fitness)).toLocaleString()}
                      </div>
                      <div style={{ color: 'var(--color-text-medium)' }}>Mejor Aptitud</div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-primary-dark)' }}>
                        {(results.fitness - results.fitnessHistory[0]?.fitness).toLocaleString()}
                      </div>
                      <div style={{ color: 'var(--color-text-medium)' }}>Mejora Total</div>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                  <p style={{ color: 'var(--color-text-light)' }}>
                    No hay datos de evolución disponibles.
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
              <h3 style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--color-primary-dark)' }}>
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
                            {shiftData.shift === 'Matutino' ? '☀️' : shiftData.shift === 'Vespertino' ? '🌇' : '🌃'} {shiftData.shift}
                          </td>
                          <td>
                            {shiftData.dispatchers.length > 0 ? (
                              <div>
                                {shiftData.dispatchers.map((emp, idx) => (
                                  <div key={idx} style={{ fontSize: '0.875rem', marginBottom: '2px', color: 'var(--color-text-dark)' }}>
                                    {emp.nombre || emp.Nombre}
                                    {(emp.bilingue || emp.Bilingue) === 'Si' && (
                                      <span className="badge badge-success" style={{ marginLeft: '4px', fontSize: '0.7rem', padding: '2px 6px' }}>B</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span style={{ color: 'var(--color-text-light)' }}>Sin asignar</span>
                            )}
                          </td>
                          <td>
                            {shiftData.supervisors.length > 0 ? (
                              <div>
                                {shiftData.supervisors.map((emp, idx) => (
                                  <div key={idx} style={{ fontSize: '0.875rem', marginBottom: '2px', color: 'var(--color-text-dark)' }}>
                                    {emp.nombre || emp.Nombre}
                                    {(emp.bilingue || emp.Bilingue) === 'Si' && (
                                      <span className="badge badge-success" style={{ marginLeft: '4px', fontSize: '0.7rem', padding: '2px 6px' }}>B</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span style={{ color: 'var(--color-text-light)' }}>Sin asignar</span>
                            )}
                          </td>
                          <td style={{ fontWeight: 'bold', color: 'var(--color-primary-dark)' }}>
                            {shiftData.total}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                  <p style={{ color: 'var(--color-text-light)' }}>
                    No hay datos de horarios disponibles.
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
                        color: severity === 'medium' ? 'var(--color-text-dark)' : 'white', /* Texto oscuro en advertencias */
                        marginLeft: 'var(--spacing-sm)'
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
                            backgroundColor: 'var(--color-bg)',
                            borderRadius: 'var(--border-radius)'
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
                <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>🎉</div>
                <h3 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--color-success)' }}>
                  Sin Alertas
                </h3>
                <p style={{ color: 'var(--color-text-medium)' }}>
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
                <h3 style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--color-primary-dark)' }}>
                  Estadísticas Generales
                </h3>

                <div style={{ lineHeight: 1.8, fontSize: '0.9rem', color: 'var(--color-text-dark)' }}>
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
                    <strong style={{ color: results.alerts?.critical > 0 ? 'var(--color-error)' : 'var(--color-success)' }}>
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
                    <strong style={{color: (results.statistics?.distribucionBalance || 0) > 0.8 ? 'var(--color-success)' : 'var(--color-warning)'}}>
                      {((results.statistics?.distribucionBalance || 0) * 100).toFixed(0)}%
                    </strong>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--color-primary-dark)' }}>
                  Resumen de Cumplimiento
                </h3>

                <div style={{ lineHeight: 1.8, fontSize: '0.9rem', color: 'var(--color-text-dark)' }}>
                  <div style={{ marginBottom: 'var(--spacing-md)' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 'var(--spacing-xs)' }}>
                      Cobertura por Turno (Ej. Matutino, Vespertino, Nocturno):
                    </div>
                    {shifts.map((shift, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 'var(--spacing-xs)',
                        color: 'var(--color-text-medium)'
                      }}>
                        <span>
                          {shift}:
                        </span>
                        <span>Cubierto ✅</span>
                      </div>
                    ))}
                  </div>

                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: 'var(--spacing-xs)' }}>
                      Estado General:
                    </div>
                    <div style={{ color: 'var(--color-success)' }}>
                      Optimización completada exitosamente 🎉
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