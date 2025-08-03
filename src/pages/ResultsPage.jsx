import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import '../styles/layout.css';

const ResultsPage = ({ results, employees, config }) => {
    const [activeTab, setActiveTab] = useState('summary');
    const [selectedDay, setSelectedDay] = useState(0);
    const [selectedScheduleOption, setSelectedScheduleOption] = useState(0);

    // Ajustamos la lógica para usar el horario seleccionado
    const currentSchedule = results?.bestSchedules?.[selectedScheduleOption]?.schedule;
    const currentAlerts = results?.bestSchedules?.[selectedScheduleOption]?.alerts;
    const currentFitness = results?.bestSchedules?.[selectedScheduleOption]?.fitness;
    const employeeReport = results?.bestSchedules?.[selectedScheduleOption]?.employee_report;

    if (!results || !results.bestSchedules || results.bestSchedules.length === 0) {
        return (
            <div className="page-content fade-in">
                <div className="page-header">
                    <h1 className="page-title">Resultados</h1>
                    <p className="page-description">No hay resultados disponibles</p>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>📊</div>
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
            case 'high': return '🔴';
            case 'medium': return '🟡';
            case 'low': return 'ℹ️';
            default: return 'ℹ️';
        }
    };

    const getFitnessQuality = (fitness) => {
        if (fitness >= 0.8) return { label: 'Excelente', color: 'var(--color-success)', icon: '🟢' };
        if (fitness >= 0.6) return { label: 'Buena', color: 'var(--color-success)', icon: '✅' };
        if (fitness >= 0.4) return { label: 'Regular', color: 'var(--color-warning)', icon: '🟡' };
        return { label: 'Necesita Mejora', color: 'var(--color-error)', icon: '🔴' };
    };

    // NUEVA FUNCIÓN: Preparar datos para gráfico de horas
    const prepareHoursChartData = () => {
        if (!employeeReport) return [];
        
        const hoursDistribution = {};
        employeeReport.forEach(emp => {
            const hours = emp.total_horas;
            hoursDistribution[hours] = (hoursDistribution[hours] || 0) + 1;
        });
        
        return Object.entries(hoursDistribution).map(([hours, count]) => ({
            horas: `${hours}h`,
            empleados: count
        })).sort((a, b) => parseInt(a.horas) - parseInt(b.horas));
    };

    // NUEVA FUNCIÓN: Estadísticas del reporte de empleados
    const getEmployeeStats = () => {
        if (!employeeReport) return null;
        
        const totalEmployees = employeeReport.length;
        const employees48h = employeeReport.filter(emp => emp.total_horas === 48).length;
        const preferencesAvailable = employeeReport.some(emp => emp.dia_preferido !== null);
        const preferencesMet = preferencesAvailable ? 
            employeeReport.filter(emp => emp.preferencia_cumplida).length : 0;
        
        const hoursList = employeeReport.map(emp => emp.total_horas);
        const avgHours = hoursList.reduce((a, b) => a + b, 0) / hoursList.length;
        const variance = hoursList.reduce((acc, hours) => acc + Math.pow(hours - avgHours, 2), 0) / hoursList.length;
        
        return {
            totalEmployees,
            employees48h,
            preferencesAvailable,
            preferencesMet,
            avgHours,
            variance,
            perfectEquity: variance === 0
        };
    };

    const getEmployeesForDay = (dayIndex, scheduleMatrix) => {
        const assigned = [];
        const free = [];
        if (!scheduleMatrix || !employees.length) return { assigned: [], free: [] };

        employees.forEach((emp, empIndex) => {
            const assignment = scheduleMatrix[empIndex]?.[dayIndex];
            if (assignment === 0) {
                free.push(emp);
            } else {
                assigned.push({ employee: emp, shift: assignment });
            }
        });
        return { assigned, free };
    };

    const generateScheduleFromMatrix = (scheduleMatrix) => {
        if (!scheduleMatrix || !employees.length) return [];

        return days.map((day, dayIndex) => ({
            day,
            shifts: shifts.map((shift, shiftIndex) => {
                const shiftValue = shiftIndex + 1;
                const assignedEmployees = [];

                scheduleMatrix.forEach((empSchedule, empIndex) => {
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

    const scheduleData = generateScheduleFromMatrix(currentSchedule);
    const employeeStats = getEmployeeStats();
    const hoursChartData = prepareHoursChartData();

    const exportToCSV = () => {
        let csv = 'Empleado,Lunes,Martes,Miércoles,Jueves,Viernes,Sábado,Domingo,Total_Horas,Dias_Trabajados\n';

        if (currentSchedule && employees.length) {
            currentSchedule.forEach((empSchedule, empIndex) => {
                if (employees[empIndex]) {
                    const row = [employees[empIndex].nombre || employees[empIndex].Nombre];
                    empSchedule.forEach(dayValue => {
                        if (dayValue === 0) row.push('Libre');
                        else if (dayValue === 1) row.push('Matutino');
                        else if (dayValue === 2) row.push('Vespertino');
                        else if (dayValue === 3) row.push('Nocturno');
                        else row.push('Error');
                    });
                    
                    // Agregar estadísticas del empleado
                    const workDays = empSchedule.filter(day => day !== 0).length;
                    row.push(workDays * 8); // Total horas
                    row.push(workDays); // Días trabajados
                    
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

    const fitnessQuality = getFitnessQuality(currentFitness);
    const { free: employeesFreeToday } = getEmployeesForDay(selectedDay, currentSchedule);

    const tabs = [
        { id: 'summary', label: 'Resumen', icon: '📊' },
        { id: 'multiobjetivo', label: 'Objetivos', icon: '🎯' },
        { id: 'employee_report', label: 'Reporte Personal', icon: '👥' },
        { id: 'evolution', label: 'Evolución', icon: '📈' },
        { id: 'schedule', label: 'Horarios', icon: '📅' },
        { id: 'alerts', label: 'Alertas', icon: '⚠️' }
    ];

    return (
        <div className="page-content fade-in">
            <div className="page-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
                    <div>
                        <h1 className="page-title">Resultados de Optimización Multiobjetivo</h1>
                        <p className="page-description">
                            Análisis completo con enfoque en cobertura, equidad y cumplimiento para {employees.length} empleados.
                        </p>
                    </div>
                    <button className="btn btn-primary" onClick={exportToCSV}>
                        📄 Exportar CSV
                    </button>
                </div>
            </div>

            {/* Selector de Opciones de Horario */}
            {results.bestSchedules.length > 1 && (
                <section className="section">
                    <h2 className="section-title">
                        <span>🔄</span> Opciones de Horario
                    </h2>
                    <div className="card">
                        <div className="grid grid-3" style={{ gap: 'var(--spacing-md)' }}>
                            {results.bestSchedules.map((option, index) => (
                                <button
                                    key={index}
                                    className={`btn ${selectedScheduleOption === index ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => setSelectedScheduleOption(index)}
                                    style={{
                                        width: '100%',
                                        justifyContent: 'center',
                                        flexDirection: 'column',
                                        gap: 'var(--spacing-xs)',
                                        padding: 'var(--spacing-md)',
                                        minHeight: '80px',
                                        fontSize: '1rem',
                                        fontWeight: 'bold',
                                        backgroundColor: selectedScheduleOption === index ? 'var(--color-primary-light)' : 'var(--color-surface)',
                                        color: selectedScheduleOption === index ? 'var(--color-text-bright)' : 'var(--color-text-dark)',
                                        borderColor: selectedScheduleOption === index ? 'var(--color-primary-light)' : 'var(--color-border)',
                                    }}
                                >
                                    Opción {index + 1}
                                    <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: selectedScheduleOption === index ? 'var(--color-text-bright)' : 'var(--color-text-medium)' }}>
                                        Fitness: {option.fitness?.toFixed(3) || 'N/A'}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Métricas principales */}
            <section className="section">
                <div className="grid grid-4">
                    <div className="stat-card primary">
                        <div className="stat-header">
                            <span className="stat-title">Fitness Multiobjetivo</span>
                            <span style={{ fontSize: '1.5rem' }}>{fitnessQuality.icon}</span>
                        </div>
                        <div className="stat-value" style={{ color: fitnessQuality.color }}>
                            {currentFitness?.toFixed(3) || 'N/A'}
                        </div>
                        <div className="stat-change" style={{ color: fitnessQuality.color }}>
                            {fitnessQuality.label}
                        </div>
                    </div>

                    <div className="stat-card success">
                        <div className="stat-header">
                            <span className="stat-title">Equidad (Varianza)</span>
                            <span style={{ fontSize: '1.5rem' }}>⚖️</span>
                        </div>
                        <div className="stat-value">{employeeStats?.variance.toFixed(2) || 'N/A'}</div>
                        <div className="stat-change">
                            {employeeStats?.perfectEquity ? 
                                <span className="positive">✅ Perfecto</span> :
                                employeeStats?.variance < 10 ? 
                                <span className="positive">✅ Excelente</span> :
                                <span className="neutral">⚖️ Aceptable</span>
                            }
                        </div>
                    </div>

                    <div className="stat-card warning">
                        <div className="stat-header">
                            <span className="stat-title">Empleados 48h</span>
                            <span style={{ fontSize: '1.5rem' }}>⏰</span>
                        </div>
                        <div className="stat-value">{employeeStats?.employees48h || 0}</div>
                        <div className="stat-change">
                            <span className="positive">
                                {employeeStats ? `${((employeeStats.employees48h / employeeStats.totalEmployees) * 100).toFixed(1)}%` : '0%'} del total
                            </span>
                        </div>
                    </div>

                    <div className="stat-card error">
                        <div className="stat-header">
                            <span className="stat-title">Alertas Críticas</span>
                            <span style={{ fontSize: '1.5rem' }}>🚨</span>
                        </div>
                        <div className="stat-value">{currentAlerts?.critical || 0}</div>
                        <div className="stat-change">
                            {(currentAlerts?.critical || 0) === 0 ?
                                <span className="positive">Sin problemas</span> :
                                <span className="negative">Revisar urgente</span>
                            }
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

                {/* NUEVA PESTAÑA: Objetivos Multiobjetivo */}
                {activeTab === 'multiobjetivo' && (
                    <div className="fade-in">
                        <div className="card">
                            <h3 style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--color-primary-dark)' }}>
                                🎯 Análisis Multiobjetivo
                            </h3>
                            
                            {/* Mostrar métricas específicas si están disponibles */}
                            {results.bestSchedules?.[selectedScheduleOption]?.cobertura !== undefined && (
                                <div className="grid grid-3" style={{ marginBottom: 'var(--spacing-xl)' }}>
                                    <div className="stat-card success">
                                        <div className="stat-header">
                                            <span className="stat-title">Cobertura</span>
                                            <span style={{ fontSize: '1.5rem' }}>📊</span>
                                        </div>
                                        <div className="stat-value">
                                            {(results.bestSchedules[selectedScheduleOption].cobertura * 100).toFixed(1)}%
                                        </div>
                                        <div className="stat-change positive">Turnos cubiertos</div>
                                    </div>

                                    <div className="stat-card primary">
                                        <div className="stat-header">
                                            <span className="stat-title">Cumplimiento</span>
                                            <span style={{ fontSize: '1.5rem' }}>📋</span>
                                        </div>
                                        <div className="stat-value">
                                            {(results.bestSchedules[selectedScheduleOption].cumplimiento * 100).toFixed(1)}%
                                        </div>
                                        <div className="stat-change neutral">Solicitudes aprobadas</div>
                                    </div>

                                    <div className="stat-card warning">
                                        <div className="stat-header">
                                            <span className="stat-title">Varianza Horas</span>
                                            <span style={{ fontSize: '1.5rem' }}>⚖️</span>
                                        </div>
                                        <div className="stat-value">
                                            {results.bestSchedules[selectedScheduleOption].varianza?.toFixed(2) || 'N/A'}
                                        </div>
                                        <div className="stat-change neutral">Equidad laboral</div>
                                    </div>
                                </div>
                            )}

                            <div style={{
                                padding: 'var(--spacing-lg)',
                                backgroundColor: 'var(--color-bg)',
                                borderRadius: 'var(--border-radius)',
                                lineHeight: 1.6
                            }}>
                                <h4 style={{ color: 'var(--color-primary-dark)', marginBottom: 'var(--spacing-md)' }}>
                                    📐 Fórmula Multiobjetivo Aplicada:
                                </h4>
                                <div style={{ 
                                    fontFamily: 'var(--font-mono)', 
                                    fontSize: '1.1rem', 
                                    textAlign: 'center',
                                    color: 'var(--color-primary-medium)',
                                    backgroundColor: 'var(--color-surface)',
                                    padding: 'var(--spacing-md)',
                                    borderRadius: 'var(--border-radius)',
                                    border: '1px solid var(--color-border)'
                                }}>
                                    FITNESS = (Cobertura × Cumplimiento) / (1 + Varianza)
                                </div>
                                <div style={{ marginTop: 'var(--spacing-md)', color: 'var(--color-text-medium)', fontSize: '0.9rem' }}>
                                    <strong>Interpretación:</strong> La función maximiza la cobertura de turnos y el cumplimiento de solicitudes,
                                    mientras minimiza la varianza en las horas trabajadas para lograr equidad laboral.
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* NUEVA PESTAÑA: Reporte por Empleado */}
                {activeTab === 'employee_report' && (
                    <div className="fade-in">
                        {employeeReport && employeeStats ? (
                            <>
                                {/* Estadísticas generales */}
                                <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                                    <h3 style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--color-primary-dark)' }}>
                                        📊 Estadísticas Generales del Personal
                                    </h3>
                                    
                                    <div className="grid grid-4">
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-primary-dark)' }}>
                                                {employeeStats.totalEmployees}
                                            </div>
                                            <div style={{ color: 'var(--color-text-medium)' }}>Total Empleados</div>
                                        </div>

                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-success)' }}>
                                                {employeeStats.employees48h}
                                            </div>
                                            <div style={{ color: 'var(--color-text-medium)' }}>Con 48 Horas</div>
                                        </div>

                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-warning)' }}>
                                                {employeeStats.avgHours.toFixed(1)}h
                                            </div>
                                            <div style={{ color: 'var(--color-text-medium)' }}>Promedio Horas</div>
                                        </div>

                                        {employeeStats.preferencesAvailable && (
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-primary-light)' }}>
                                                    {employeeStats.preferencesMet}
                                                </div>
                                                <div style={{ color: 'var(--color-text-medium)' }}>Preferencias Cumplidas</div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Gráfico de distribución de horas */}
                                {hoursChartData.length > 0 && (
                                    <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                                        <h3 style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--color-primary-dark)' }}>
                                            📊 Distribución de Horas Trabajadas
                                        </h3>
                                        <div style={{ height: '300px' }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={hoursChartData}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                                    <XAxis 
                                                        dataKey="horas" 
                                                        tick={{ fill: 'var(--color-text-medium)', fontSize: '0.8rem' }}
                                                    />
                                                    <YAxis 
                                                        tick={{ fill: 'var(--color-text-medium)', fontSize: '0.8rem' }}
                                                    />
                                                    <Tooltip 
                                                        formatter={(value) => [value, 'Empleados']}
                                                        contentStyle={{ 
                                                            backgroundColor: 'var(--color-surface)', 
                                                            border: '1px solid var(--color-border)',
                                                            borderRadius: 'var(--border-radius)' 
                                                        }}
                                                    />
                                                    <Bar 
                                                        dataKey="empleados" 
                                                        fill="var(--color-primary-light)"
                                                        radius={[4, 4, 0, 0]}
                                                    />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                )}

                                {/* Tabla detallada de empleados */}
                                <div className="card">
                                    <h3 style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--color-primary-dark)' }}>
                                        👥 Detalle por Empleado
                                    </h3>
                                    
                                    <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th>Empleado</th>
                                                    <th>Rol</th>
                                                    <th>Horas</th>
                                                    <th>Días</th>
                                                    <th>Matutinos</th>
                                                    <th>Vespertinos</th>
                                                    <th>Nocturnos</th>
                                                    <th>Día Libre</th>
                                                    {employeeStats.preferencesAvailable && <th>Preferencia</th>}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {employeeReport.map((emp, index) => (
                                                    <tr key={index}>
                                                        <td style={{ fontWeight: '500' }}>
                                                            {emp.nombre}
                                                            {emp.bilingue === 'Si' && (
                                                                <span className="badge badge-success" style={{ marginLeft: '4px', fontSize: '0.7rem' }}>B</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <span className={`badge ${emp.rol === 'Despachador' ? 'badge-primary' : 'badge-warning'}`}>
                                                                {emp.rol}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span style={{ 
                                                                color: emp.total_horas === 48 ? 'var(--color-success)' : 'var(--color-warning)',
                                                                fontWeight: 'bold'
                                                            }}>
                                                                {emp.total_horas}h
                                                            </span>
                                                        </td>
                                                        <td>{emp.dias_trabajados}</td>
                                                        <td>{emp.turnos_matutino}</td>
                                                        <td>{emp.turnos_vespertino}</td>
                                                        <td>{emp.turnos_nocturno}</td>
                                                        <td>{emp.dias_libres.join(', ')}</td>
                                                        {employeeStats.preferencesAvailable && (
                                                            <td>
                                                                {emp.dia_preferido && (
                                                                    <span style={{ 
                                                                        color: emp.preferencia_cumplida ? 'var(--color-success)' : 'var(--color-error)',
                                                                        fontSize: '0.8rem'
                                                                    }}>
                                                                        {emp.preferencia_cumplida ? '✅' : '❌'} {emp.dia_preferido}
                                                                    </span>
                                                                )}
                                                            </td>
                                                        )}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                                <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>📊</div>
                                <h3 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--color-text-medium)' }}>
                                    Reporte no disponible
                                </h3>
                                <p style={{ color: 'var(--color-text-light)' }}>
                                    El reporte detallado por empleado no está disponible para esta optimización.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Pestañas existentes sin cambios */}
                {activeTab === 'summary' && (
                    <div className="fade-in">
                        <div className="card">
                            <h3 style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--color-primary-dark)' }}>
                                📋 Resumen Ejecutivo Multiobjetivo
                            </h3>

                            <div style={{ lineHeight: 1.8, fontSize: '1rem', color: 'var(--color-text-dark)' }}>
                                <p style={{ marginBottom: 'var(--spacing-md)' }}>
                                    <strong>Optimización multiobjetivo completada exitosamente</strong> con un fitness de{' '}
                                    <span style={{ color: fitnessQuality.color, fontWeight: 'bold' }}>
                                        {currentFitness?.toFixed(3) || 'N/A'}
                                    </span>
                                    , clasificada como <strong>{fitnessQuality.label}</strong>.
                                </p>

                                <p style={{ marginBottom: 'var(--spacing-md)' }}>
                                    <strong>Equidad laboral:</strong> La varianza de horas es de{' '}
                                    <strong>{employeeStats?.variance.toFixed(2) || 'N/A'}</strong>, lo que indica{' '}
                                    {employeeStats?.perfectEquity ? 
                                        'una distribución perfectamente equitativa' :
                                        employeeStats?.variance < 10 ? 
                                        'una excelente distribución de carga laboral' :
                                        'una distribución aceptable de horas'
                                    }.
                                </p>

                                <p style={{ marginBottom: 'var(--spacing-md)' }}>
                                    <strong>Personal asignado:</strong> {employeeStats?.employees48h || 0} de {employeeStats?.totalEmployees || employees.length} empleados
                                    ({employeeStats ? ((employeeStats.employees48h / employeeStats.totalEmployees) * 100).toFixed(1) : '0'}%)
                                    trabajan exactamente 48 horas semanales.
                                </p>

                                {employeeStats?.preferencesAvailable && (
                                    <p style={{ marginBottom: 'var(--spacing-md)' }}>
                                        <strong>Cumplimiento de solicitudes:</strong> {employeeStats.preferencesMet} de {employeeStats.totalEmployees} empleados
                                        ({((employeeStats.preferencesMet / employeeStats.totalEmployees) * 100).toFixed(1)}%)
                                        obtuvieron su día libre preferido.
                                    </p>
                                )}

                                <p>
                                    <strong>Estado de alertas:</strong> {currentAlerts?.critical || 0} críticas, {currentAlerts?.warning || 0} advertencias.
                                    {(currentAlerts?.critical || 0) === 0 ? ' Sistema operando dentro de parámetros normales.' : ' Revisar alertas críticas.'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'evolution' && (
                    <div className="fade-in">
                        <div className="card">
                            <h3 style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--color-primary-dark)' }}>
                                📈 Evolución del Fitness Multiobjetivo
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
                                                    label={{ value: 'Fitness', angle: -90, position: 'insideLeft', fill: 'var(--color-text-light)' }}
                                                    tick={{ fill: 'var(--color-text-medium)', fontSize: '0.8rem' }}
                                                />
                                                <Tooltip
                                                    formatter={(value) => [value.toFixed(4), 'Fitness']}
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
                                                {results.fitnessHistory[0]?.fitness.toFixed(4)}
                                            </div>
                                            <div style={{ color: 'var(--color-text-medium)' }}>Fitness Inicial</div>
                                        </div>

                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-success)' }}>
                                                {Math.max(...results.fitnessHistory.map(h => h.fitness)).toFixed(4)}
                                            </div>
                                            <div style={{ color: 'var(--color-text-medium)' }}>Mejor Fitness</div>
                                        </div>

                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-primary-dark)' }}>
                                                {(results.fitnessHistory[results.fitnessHistory.length - 1]?.fitness - results.fitnessHistory[0]?.fitness).toFixed(4)}
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
                                📅 Horarios - {days[selectedDay]}
                            </h3>

                            {scheduleData.length > 0 ? (
                                <div style={{ overflowX: 'auto' }}>
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Turno</th>
                                                <th>Despachadores</th>
                                                <th>Supervisores</th>
                                                <th>Total en Turno</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {scheduleData[selectedDay]?.shifts.map((shiftData, shiftIndex) => (
                                                <tr key={shiftIndex}>
                                                    <td style={{ fontWeight: 'bold' }}>
                                                        {shiftData.shift === 'Matutino' ? '🌅' : shiftData.shift === 'Vespertino' ? '🌆' : '🌙'} {shiftData.shift}
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

                            <h4 style={{ marginTop: 'var(--spacing-2xl)', marginBottom: 'var(--spacing-md)', color: 'var(--color-primary-medium)' }}>
                                🏖️ Empleados Libres el {days[selectedDay]}
                            </h4>
                            {employeesFreeToday.length > 0 ? (
                                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Nombre</th>
                                                <th>Rol</th>
                                                <th>Bilingüe</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {employeesFreeToday.map((emp, index) => (
                                                <tr key={index}>
                                                    <td>{emp.nombre || emp.Nombre}</td>
                                                    <td>{emp.rol || emp.Rol}</td>
                                                    <td>{emp.bilingue || emp.Bilingue}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p style={{ color: 'var(--color-text-light)' }}>No hay empleados libres el {days[selectedDay]}.</p>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'alerts' && (
                    <div className="fade-in">
                        {currentAlerts?.details && Object.keys(currentAlerts.details).length > 0 ? (
                            Object.entries(currentAlerts.details).map(([severity, alertList]) => {
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
                                                color: severity === 'medium' ? 'var(--color-text-dark)' : 'white',
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
                                    El sistema está funcionando perfectamente sin problemas detectados para esta opción de horario.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </section>
        </div>
    );
};

export default ResultsPage;