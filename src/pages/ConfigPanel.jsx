import React, { useState } from 'react';
import '../styles/layout.css'; // Asegúrate de que los estilos de layout se apliquen

const ConfigPanel = ({ config, onConfigChange }) => {
  const [localConfig, setLocalConfig] = useState(config);
  const [hasChanges, setHasChanges] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleInputChange = (section, field, value) => {
    const newConfig = {
      ...localConfig,
      [section]: {
        ...localConfig[section],
        [field]: value
      }
    };

    setLocalConfig(newConfig);
    setHasChanges(true);
  };

  const handleNestedChange = (section, subsection, field, value) => {
    const newConfig = {
      ...localConfig,
      [section]: {
        ...localConfig[section],
        [subsection]: {
          ...localConfig[section][subsection],
          [field]: value
        }
      }
    };

    setLocalConfig(newConfig);
    setHasChanges(true);
  };

  const handleSave = () => {
    onConfigChange(localConfig);
    setHasChanges(false);

    // Mostrar notificación de éxito
    const notification = document.createElement('div');
    notification.className = 'alert alert-success';
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.zIndex = '1000';
    notification.innerHTML = 'Configuración guardada correctamente';
    document.body.appendChild(notification);

    setTimeout(() => {
      document.body.removeChild(notification);
    }, 3000);
  };

  const handleReset = () => {
    setLocalConfig(config);
    setHasChanges(false);
  };

  const getRecommendation = (section, field) => {
    const recommendations = {
      estaciones: {
        minimas: 'Mínimo 3 para mantener operaciones básicas',
        maximas: 'Basado en infraestructura física disponible',
        actual: 'Estaciones activas según demanda actual'
      },
      algoritmo: {
        generaciones: 'Entre 100-300. Más generaciones = mejor calidad pero más tiempo',
        poblacion: 'Entre 50-150. Mayor población = más diversidad',
        cruceProbabilidad: 'Recomendado 80-95% ',
        mutacionProbabilidad: 'Recomendado 15-25%'
      }
    };

    return recommendations[section]?.[field] || '';
  };

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <h1 className="page-title">Configuración del Sistema</h1>
        <p className="page-description">
          Ajusta los parámetros operativos del sistema de optimización según las necesidades específicas de tu centro 911.
        </p>
      </div>

      {hasChanges && (
        <div className="alert alert-warning">
          <strong>Cambios sin guardar</strong>
          <div style={{ marginTop: 'var(--spacing-sm)' }}>
            Tienes modificaciones pendientes. No olvides guardar antes de salir.
          </div>
        </div>
      )}

      {/* Configuración de Estaciones */}
      <section className="section">
        <h2 className="section-title">
          <span></span>
          Estaciones de Trabajo
        </h2>

        <div className="card">
          <div className="grid grid-3">
            <div className="form-group">
              <label className="form-label">
                Estaciones Mínimas
                <span style={{ color: 'var(--color-error)', marginLeft: '4px' }}>*</span>
              </label>
              <input
                type="number"
                className="form-input"
                value={localConfig.estaciones.minimas}
                onChange={(e) => handleInputChange('estaciones', 'minimas', parseInt(e.target.value))}
                min="1"
                max="10"
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: '4px' }}>
                {getRecommendation('estaciones', 'minimas')}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Estaciones Máximas
                <span style={{ color: 'var(--color-error)', marginLeft: '4px' }}>*</span>
              </label>
              <input
                type="number"
                className="form-input"
                value={localConfig.estaciones.maximas}
                onChange={(e) => handleInputChange('estaciones', 'maximas', parseInt(e.target.value))}
                min={localConfig.estaciones.minimas}
                max="20"
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: '4px' }}>
                {getRecommendation('estaciones', 'maximas')}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Estaciones Actuales
                <span style={{ color: 'var(--color-error)', marginLeft: '4px' }}>*</span>
              </label>
              <input
                type="number"
                className="form-input"
                value={localConfig.estaciones.actual}
                onChange={(e) => handleInputChange('estaciones', 'actual', parseInt(e.target.value))}
                min={localConfig.estaciones.minimas}
                max={localConfig.estaciones.maximas}
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: '4px' }}>
                {getRecommendation('estaciones', 'actual')}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Configuración por Turnos */}
      <section className="section">
        <h2 className="section-title">
          <span></span>
          Requisitos por Turno
        </h2>

        {Object.entries(localConfig.turnos).map(([turno, requisitos]) => (
          <div key={turno} className="card" style={{ marginBottom: 'var(--spacing-md)' }}>
            <h3 style={{
              marginBottom: 'var(--spacing-lg)',
              color: 'var(--color-primary-dark)',
              textTransform: 'capitalize',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-sm)'
            }}>
              <span>
                {turno === 'matutino' ? '' : turno === 'vespertino' ? '' : ''}
              </span>
              Turno {turno} ({turno === 'matutino' ? '6:00-14:00' : turno === 'vespertino' ? '14:00-22:00' : '22:00-6:00'})
            </h3>

            <div className="grid grid-2">
              <div>
                <h4 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--color-primary-medium)' }}>
                  Despachadores
                </h4>
                <div className="grid grid-2" style={{ gap: 'var(--spacing-sm)' }}>
                  <div className="form-group">
                    <label className="form-label">Mínimo</label>
                    <input
                      type="number"
                      className="form-input"
                      value={requisitos.minDespachadores}
                      onChange={(e) => handleNestedChange('turnos', turno, 'minDespachadores', parseInt(e.target.value))}
                      min="1"
                      max="10"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Máximo</label>
                    <input
                      type="number"
                      className="form-input"
                      value={requisitos.maxDespachadores}
                      onChange={(e) => handleNestedChange('turnos', turno, 'maxDespachadores', parseInt(e.target.value))}
                      min={requisitos.minDespachadores}
                      max="15"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--color-primary-medium)' }}>
                  Supervisores
                </h4>
                <div className="grid grid-2" style={{ gap: 'var(--spacing-sm)' }}>
                  <div className="form-group">
                    <label className="form-label">Mínimo</label>
                    <input
                      type="number"
                      className="form-input"
                      value={requisitos.minSupervisores}
                      onChange={(e) => handleNestedChange('turnos', turno, 'minSupervisores', parseInt(e.target.value))}
                      min="1"
                      max="5"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Máximo</label>
                    <input
                      type="number"
                      className="form-input"
                      value={requisitos.maxSupervisores}
                      onChange={(e) => handleNestedChange('turnos', turno, 'maxSupervisores', parseInt(e.target.value))}
                      min={requisitos.minSupervisores}
                      max="8"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 'var(--spacing-md)' }}>
              <div className="form-group">
                <label className="form-label">
                  Personal Bilingüe Mínimo
                </label>
                <input
                  type="number"
                  className="form-input"
                  value={requisitos.minBilingues}
                  onChange={(e) => handleNestedChange('turnos', turno, 'minBilingues', parseInt(e.target.value))}
                  min="0"
                  max="10"
                  style={{ maxWidth: '200px' }}
                />
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: '4px' }}>
                  Empleados bilingües requeridos para atender llamadas en inglés
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Configuración del Algoritmo */}
      <section className="section">
        <h2 className="section-title">
          <span></span>
          Parámetros del Algoritmo Genético
        </h2>

        <div className="card">
          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">
                Generaciones
                <span style={{ color: 'var(--color-error)', marginLeft: '4px' }}>*</span>
              </label>
              <input
                type="number"
                className="form-input"
                value={localConfig.algoritmo.generaciones}
                onChange={(e) => handleInputChange('algoritmo', 'generaciones', parseInt(e.target.value))}
                min="50"
                max="500"
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: '4px' }}>
                {getRecommendation('algoritmo', 'generaciones')}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Tamaño de Población
                <span style={{ color: 'var(--color-error)', marginLeft: '4px' }}>*</span>
              </label>
              <input
                type="number"
                className="form-input"
                value={localConfig.algoritmo.poblacion}
                onChange={(e) => handleInputChange('algoritmo', 'poblacion', parseInt(e.target.value))}
                min="20"
                max="200"
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: '4px' }}>
                {getRecommendation('algoritmo', 'poblacion')}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Probabilidad de Cruce (%)
              </label>
              <input
                type="range"
                className="form-input"
                value={localConfig.algoritmo.cruceProbabilidad * 100}
                onChange={(e) => handleInputChange('algoritmo', 'cruceProbabilidad', parseFloat(e.target.value) / 100)}
                min="50"
                max="100"
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginTop: '4px' }}>
                <span>{(localConfig.algoritmo.cruceProbabilidad * 100).toFixed(0)}%</span>
                <span style={{ color: 'var(--color-text-light)' }}>
                  {getRecommendation('algoritmo', 'cruceProbabilidad')}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Probabilidad de Mutación (%)
              </label>
              <input
                type="range"
                className="form-input"
                value={localConfig.algoritmo.mutacionProbabilidad * 100}
                onChange={(e) => handleInputChange('algoritmo', 'mutacionProbabilidad', parseFloat(e.target.value) / 100)}
                min="5"
                max="50"
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginTop: '4px' }}>
                <span>{(localConfig.algoritmo.mutacionProbabilidad * 100).toFixed(0)}%</span>
                <span style={{ color: 'var(--color-text-light)' }}>
                  {getRecommendation('algoritmo', 'mutacionProbabilidad')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Configuración Avanzada */}
      <section className="section">
        <h2 className="section-title" style={{ cursor: 'pointer' }} onClick={() => setShowAdvanced(!showAdvanced)}>
          <span></span>
          Configuración Avanzada
          <span style={{ marginLeft: 'auto', fontSize: '0.875rem' }}>
            {showAdvanced ? '▼' : '▶'}
          </span>
        </h2>

        {showAdvanced && (
          <div className="card fade-in">
            <h3 style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--color-primary-dark)' }}>
              Configuración Especial
            </h3>

            <div className="grid grid-2">
              <div>
                <h4 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--color-warning)' }}>
                  Fin de Semana
                </h4>
                <div className="form-group">
                  <label className="form-label">Factor de Reducción</label>
                  <input
                    type="range"
                    className="form-input"
                    value={localConfig.configuracionEspecial.finDeSemana.factorReduccion}
                    onChange={(e) => handleNestedChange('configuracionEspecial', 'finDeSemana', 'factorReduccion', parseFloat(e.target.value))}
                    min="0.3"
                    max="1.0"
                    step="0.1"
                  />
                  <div style={{ fontSize: '0.875rem', marginTop: '4px' }}>
                    {(localConfig.configuracionEspecial.finDeSemana.factorReduccion * 100).toFixed(0)}% del personal normal
                  </div>
                </div>
              </div>

              <div>
                <h4 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--color-error)' }}>
                  Días Feriados
                </h4>
                <div className="form-group">
                  <label className="form-label">Factor de Reducción</label>
                  <input
                    type="range"
                    className="form-input"
                    value={localConfig.configuracionEspecial.feriados.factorReduccion}
                    onChange={(e) => handleNestedChange('configuracionEspecial', 'feriados', 'factorReduccion', parseFloat(e.target.value))}
                    min="0.2"
                    max="1.0"
                    step="0.1"
                  />
                  <div style={{ fontSize: '0.875rem', marginTop: '4px' }}>
                    {(localConfig.configuracionEspecial.feriados.factorReduccion * 100).toFixed(0)}% del personal normal
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              marginTop: 'var(--spacing-lg)',
              padding: 'var(--spacing-md)',
              backgroundColor: 'var(--color-bg)',
              borderRadius: 'var(--border-radius)',
              fontSize: '0.875rem',
              color: 'var(--color-text-medium)'
            }}>
              <strong>ℹ️ Nota:</strong> Los factores de reducción se aplicarán automáticamente a los requisitos mínimos
              durante la optimización para días específicos. Un factor de 0.7 significa que se requerirá 70% del personal normal.
            </div>
          </div>
        )}
      </section>

      <div style={{
        position: 'sticky',
        bottom: 'var(--spacing-lg)',
        backgroundColor: 'var(--color-surface)',
        padding: 'var(--spacing-lg)',
        borderRadius: 'var(--border-radius)',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        gap: 'var(--spacing-md)',
        justifyContent: 'flex-end',
        border: '1px solid var(--color-border)'
      }}>
        <button
          className="btn btn-secondary"
          onClick={handleReset}
          disabled={!hasChanges}
        >
          Restablecer
        </button>

        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={!hasChanges}
        >
          Guardar Configuración
        </button>
      </div>
    </div>
  );
};

export default ConfigPanel;