import React, { useState, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import '../styles/layout.css';

const OptimizationPage = ({ config, employees, onEmployeesLoad, onOptimization, isLoading, backendStatus, realTimeFitness, apiService }) => {
  const [dragActive, setDragActive] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [validationWarnings, setValidationWarnings] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setValidationErrors(['El archivo debe ser de tipo CSV (.csv)']);
      return;
    }

    if (backendStatus !== 'online') {
      setValidationErrors(['Backend no disponible. Verifica que el servidor esté ejecutándose en puerto 8000.']);
      return;
    }

    setUploadLoading(true);
    setValidationErrors([]);
    setValidationWarnings([]);

    try {
      console.log(' Subiendo archivo CSV al backend...');
      const result = await apiService.uploadCSV(file);
      
      if (result.valid) {
        console.log(' Archivo validado por el backend:', result);
        onEmployeesLoad(result.employees);
        setShowPreview(true);
        setValidationErrors([]);
        setValidationWarnings(result.warnings || []);
        
        // Mostrar notificación de éxito
        if (result.warnings && result.warnings.length > 0) {
          showNotification(` Archivo cargado con advertencias: ${result.statistics.total} empleados`, 'warning');
        } else {
          showNotification(` Archivo cargado: ${result.statistics.total} empleados`, 'success');
        }
      } else {
        setValidationErrors(result.errors || ['Error desconocido validando archivo']);
        setValidationWarnings([]);
      }
    } catch (error) {
      console.error(' Error subiendo CSV:', error);
      setValidationErrors([error.message]);
      setValidationWarnings([]);
    } finally {
      setUploadLoading(false);
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
    }, 4000);
  };

  const getEmployeeStats = () => {
    if (!employees.length) return { dispatchers: 0, supervisors: 0, bilingual: 0 };
    
    return {
      dispatchers: employees.filter(emp => (emp.Rol || emp.rol) === 'Despachador').length,
      supervisors: employees.filter(emp => (emp.Rol || emp.rol) === 'Supervisor').length,
      bilingual: employees.filter(emp => (emp.Bilingue || emp.bilingue) === 'Si').length
    };
  };

  const canOptimize = () => {
    return employees.length >= 10 && validationErrors.length === 0 && backendStatus === 'online';
  };

  const handleOptimization = () => {
    if (!canOptimize()) return;
    onOptimization(config);
  };

  const downloadSampleCSV = () => {
    const sampleData = `Nombre,Rol,Bilingue
Juan Pérez,Despachador,Si
María López,Supervisor,No
Carlos García,Despachador,Si
Ana Martínez,Despachador,No
Luis Rodríguez,Supervisor,Si
Patricia Sánchez,Despachador,Si
Roberto Torres,Despachador,No
Carmen Jiménez,Supervisor,No
Francisco Morales,Despachador,Si
Isabel Castro,Despachador,No
Diego Herrera,Supervisor,Si
Gabriela Rivera,Despachador,Si`;

    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'empleados_911_experimentacion.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const stats = getEmployeeStats();

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <h1 className="page-title">Optimización de Turnos</h1>
        <p className="page-description">
          Conecta con el backend Python para ejecutar el algoritmo genético en tiempo real
        </p>
      </div>

      {/* Estado del Backend */}
      <section className="section">
        <div className={`alert ${backendStatus === 'online' ? 'alert-success' : backendStatus === 'offline' ? 'alert-error' : 'alert-warning'}`}>
          <strong>
            {backendStatus === 'online' ? 'Backend conectado' : 
             backendStatus === 'offline' ? ' Backend desconectado' : ' Verificando backend...'}
          </strong>
          <div style={{ marginTop: 'var(--spacing-sm)' }}>
            {backendStatus === 'online' ? 'Servidor Python FastAPI funcionando correctamente en puerto 8000' :
             backendStatus === 'offline' ? 'Ejecuta el servidor con: python main.py (puerto 8000)' :
             'Verificando conexión con el servidor...'}
          </div>
        </div>
      </section>

      {/* Carga de Archivos */}
      <section className="section">
        <h2 className="section-title">
          <span></span>
          Cargar Personal {backendStatus === 'online' ? '(Procesamiento en Servidor)' : '(Requiere Backend)'}
        </h2>
        
        {employees.length === 0 ? (
          <div className="card">
            <div 
              className={`drag-drop-zone ${dragActive ? 'active' : ''} ${backendStatus !== 'online' ? 'disabled' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => backendStatus === 'online' && fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragActive && backendStatus === 'online' ? 'var(--color-dispatch)' : 'var(--color-gray-300)'}`,
                borderRadius: 'var(--border-radius)',
                padding: 'var(--spacing-2xl)',
                textAlign: 'center',
                cursor: backendStatus === 'online' ? 'pointer' : 'not-allowed',
                backgroundColor: dragActive && backendStatus === 'online' ? 'var(--color-dispatch-light)' : 'var(--color-gray-50)',
                opacity: backendStatus === 'online' ? 1 : 0.6,
                transition: 'all 0.2s'
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>
                {uploadLoading ? '' : ''}
              </div>
              <h3 style={{ marginBottom: 'var(--spacing-sm)', color: 'var(--color-gray-700)' }}>
                {uploadLoading ? 'Procesando archivo...' : 'Arrastra tu archivo CSV aquí'}
              </h3>
              <p style={{ color: 'var(--color-gray-600)', marginBottom: 'var(--spacing-lg)' }}>
                {backendStatus === 'online' ? 
                  'El archivo se validará automáticamente en el servidor Python' :
                  'Requiere conexión con el backend Python'
                }
              </p>
              
              <button 
                className={`btn ${backendStatus === 'online' ? 'btn-primary' : 'btn-secondary'}`} 
                style={{ marginRight: 'var(--spacing-md)' }}
                disabled={backendStatus !== 'online' || uploadLoading}
              >
                {uploadLoading ? ' Procesando...' : ' Seleccionar Archivo'}
              </button>
              
              <button 
                className="btn btn-secondary" 
                onClick={(e) => {
                  e.stopPropagation();
                  downloadSampleCSV();
                }}
              >
                 Descargar Ejemplo
              </button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileInput}
                style={{ display: 'none' }}
                disabled={backendStatus !== 'online'}
              />
            </div>
            
            <div style={{ 
              marginTop: 'var(--spacing-lg)', 
              padding: 'var(--spacing-md)', 
              backgroundColor: 'var(--color-gray-100)', 
              borderRadius: 'var(--border-radius)' 
            }}>
              <h4 style={{ marginBottom: 'var(--spacing-sm)', color: 'var(--color-gray-700)' }}>
                 Formato CSV para Experimentación:
              </h4>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)', lineHeight: 1.6 }}>
                <strong>Columnas obligatorias:</strong>
                <ul style={{ marginTop: 'var(--spacing-sm)', marginLeft: 'var(--spacing-lg)' }}>
                  <li><strong>Nombre:</strong> Nombre completo del empleado</li>
                  <li><strong>Rol:</strong> "Despachador" o "Supervisor"</li>
                  <li><strong>Bilingue:</strong> "Si" o "No"</li>
                </ul>
                <div style={{ marginTop: 'var(--spacing-sm)' }}>
                  <strong>Requisitos mínimos:</strong> 10+ empleados (cualquier distribución de roles)
                </div>
                <div style={{ marginTop: 'var(--spacing-xs)', color: 'var(--color-dispatch)' }}>
                  <strong> Experimenta libremente:</strong> El sistema se adaptará a diferentes configuraciones
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
              <div>
                <h3 style={{ color: 'var(--color-success)', marginBottom: 'var(--spacing-sm)' }}>
                   Personal Validado por el Servidor
                </h3>
                <p style={{ color: 'var(--color-gray-600)' }}>
                  {employees.length} empleados procesados y validados por el backend Python
                </p>
              </div>
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  onEmployeesLoad([]);
                  setShowPreview(false);
                  setValidationErrors([]);
                  setValidationWarnings([]);
                }}
              >
                 Cargar Otro Archivo
              </button>
            </div>
            
            <div className="grid grid-3">
              <div className="stat-card success">
                <div className="stat-title">Despachadores</div>
                <div className="stat-value">{stats.dispatchers}</div>
                <div className="stat-change">
                  {stats.dispatchers >= 8 ? ' Buena cantidad' : 
                   stats.dispatchers >= 5 ? ' Cantidad limitada' : ' Experimentando'}
                </div>
              </div>
              
              <div className="stat-card warning">
                <div className="stat-title">Supervisores</div>
                <div className="stat-value">{stats.supervisors}</div>
                <div className="stat-change">
                  {stats.supervisors >= 4 ? ' Buena cantidad' : 
                   stats.supervisors >= 2 ? ' Cantidad limitada' : ' Experimentando'}
                </div>
              </div>
              
              <div className="stat-card primary">
                <div className="stat-title">Personal Bilingüe</div>
                <div className="stat-value">{stats.bilingual}</div>
                <div className="stat-change">
                  {((stats.bilingual/employees.length)*100).toFixed(0)}% del total
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Gráfica en Tiempo Real */}
      {isLoading && realTimeFitness.length > 0 && (
        <section className="section">
          <h2 className="section-title">
            <span></span>
            Evolución en Tiempo Real desde el Servidor
          </h2>
          
          <div className="card">
            <div style={{ height: '300px', marginBottom: 'var(--spacing-md)' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={realTimeFitness}>
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
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-dispatch)' }}>
                  {realTimeFitness.length}/{config.algoritmo.generaciones}
                </div>
                <div style={{ color: 'var(--color-gray-500)' }}>Generación Actual</div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-success)' }}>
                  {realTimeFitness[realTimeFitness.length - 1]?.fitness.toLocaleString()}
                </div>
                <div style={{ color: 'var(--color-gray-500)' }}>Aptitud Actual</div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-warning)' }}>
                  {((realTimeFitness.length / config.algoritmo.generaciones) * 100).toFixed(1)}%
                </div>
                <div style={{ color: 'var(--color-gray-500)' }}>Progreso</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Advertencias (no bloquean la optimización) */}
      {validationWarnings.length > 0 && (
        <section className="section">
          <div className="alert alert-warning">
            <strong> Advertencias del Servidor:</strong>
            <ul style={{ marginTop: 'var(--spacing-sm)', marginLeft: 'var(--spacing-lg)' }}>
              {validationWarnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
            <div style={{ marginTop: 'var(--spacing-sm)', fontSize: '0.875rem' }}>
              <strong> Puedes continuar:</strong> Estas son solo advertencias. El sistema funcionará, 
              pero los resultados pueden mostrar más alertas o menor aptitud.
            </div>
          </div>
        </section>
      )}

      {/* Errores de Validación (bloquean la optimización) */}
      {validationErrors.length > 0 && (
        <section className="section">
          <div className="alert alert-error">
            <strong> Errores de Validación del Servidor:</strong>
            <ul style={{ marginTop: 'var(--spacing-sm)', marginLeft: 'var(--spacing-lg)' }}>
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Vista Previa del Personal */}
      {showPreview && employees.length > 0 && (
        <section className="section">
          <h2 className="section-title">
            <span>👥</span>
            Personal Procesado por el Servidor
          </h2>
          
          <div className="card">
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Rol</th>
                    <th>Bilingüe</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.slice(0, 20).map((emp) => (
                    <tr key={emp.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>
                        {emp.id}
                      </td>
                      <td style={{ fontWeight: '500' }}>{emp.nombre}</td>
                      <td>
                        <span className={`badge ${emp.rol === 'Despachador' ? 'badge-success' : 'badge-warning'}`}>
                          {emp.rol === 'Despachador' ? '' : ''} {emp.rol}
                        </span>
                      </td>
                      <td>
                        {emp.bilingue === 'Si' ? (
                          <span className="badge badge-success"> Sí</span>
                        ) : (
                          <span className="badge">No</span>
                        )}
                      </td>
                      <td>
                        <span className="badge badge-success">✓ Validado</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {employees.length > 20 && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: 'var(--spacing-md)', 
                  color: 'var(--color-gray-600)',
                  borderTop: '1px solid var(--color-gray-200)'
                }}>
                  ... y {employees.length - 20} empleados más procesados por el servidor
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Configuración de Optimización */}
      {employees.length > 0 && (
        <section className="section">
          <h2 className="section-title">
            <span>🧬</span>
            Algoritmo Genético en el Servidor
          </h2>
          
          <div className="card">
            <div className="grid grid-2">
              <div>
                <h4 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--color-dispatch)' }}>
                   Ejecución en Backend Python
                </h4>
                <ul style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--color-gray-600)' }}>
                  <li>✓ Algoritmo genético nativo en NumPy</li>
                  <li>✓ WebSocket para tiempo real</li>
                  <li>✓ Procesamiento paralelo optimizado</li>
                  <li>✓ Validación automática de restricciones</li>
                </ul>
              </div>
              
              <div>
                <h4 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--color-dispatch)' }}>
                   Configuración Actual
                </h4>
                <div style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--color-gray-600)' }}>
                  <div>Generaciones: <strong>{config.algoritmo.generaciones}</strong></div>
                  <div>Población: <strong>{config.algoritmo.poblacion}</strong> individuos</div>
                  <div>Cruce: <strong>{(config.algoritmo.cruceProbabilidad * 100).toFixed(0)}%</strong></div>
                  <div>Mutación: <strong>{(config.algoritmo.mutacionProbabilidad * 100).toFixed(0)}%</strong></div>
                </div>
              </div>
            </div>
            
            <div style={{ 
              marginTop: 'var(--spacing-lg)', 
              padding: 'var(--spacing-md)', 
              backgroundColor: 'var(--color-gray-50)', 
              borderRadius: 'var(--border-radius)' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
                <span></span>
                <strong>Ejecución del Servidor Python:</strong>
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)' }}>
                <div>• Algoritmo genético compilado con NumPy para máximo rendimiento</div>
                <div>• WebSocket proporciona actualizaciones en tiempo real</div>
                <div>• Tiempo estimado: <strong>{Math.ceil((config.algoritmo.generaciones * config.algoritmo.poblacion) / 5000)} - {Math.ceil((config.algoritmo.generaciones * config.algoritmo.poblacion) / 3000)} minutos</strong></div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Botón de Optimización */}
      {employees.length > 0 && (
        <section className="section">
          <div className="card" style={{ textAlign: 'center' }}>
            {canOptimize() ? (
              <div>
                <h3 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--color-success)' }}>
                   Listo para Optimizar con Backend
                </h3>
                <p style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--color-gray-600)' }}>
                  El servidor Python está listo. La optimización se ejecutará en el backend con actualizaciones en tiempo real.
                </p>
                <button 
                  className="btn btn-primary"
                  onClick={handleOptimization}
                  disabled={isLoading}
                  style={{ 
                    fontSize: '1.125rem', 
                    padding: 'var(--spacing-md) var(--spacing-xl)',
                    minWidth: '250px'
                  }}
                >
                  {isLoading ? (
                    <>
                      <div className="loading-spinner" style={{ width: '16px', height: '16px', marginRight: 'var(--spacing-sm)' }}></div>
                      Ejecutando en Servidor...
                    </>
                  ) : (
                    <>🧬 Ejecutar en Backend Python</>
                  )}
                </button>
                <div style={{ 
                  marginTop: 'var(--spacing-md)', 
                  fontSize: '0.875rem', 
                  color: 'var(--color-gray-500)' 
                }}>
                  La optimización se ejecutará en el servidor con tu algoritmo genético
                </div>
              </div>
            ) : (
              <div>
                <h3 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--color-warning)' }}>
                   Requisitos No Cumplidos
                </h3>
                <p style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--color-gray-600)' }}>
                  {backendStatus !== 'online' ? 'Backend desconectado. ' : ''}
                  {validationErrors.length > 0 ? 'Errores de validación. ' : ''}
                  {employees.length < 10 ? 'Se requieren al menos 10 empleados.' : ''}
                </p>
                <button 
                  className="btn btn-secondary"
                  disabled
                  style={{ 
                    fontSize: '1.125rem', 
                    padding: 'var(--spacing-md) var(--spacing-xl)',
                    minWidth: '250px'
                  }}
                >
                   No Disponible
                </button>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default OptimizationPage;