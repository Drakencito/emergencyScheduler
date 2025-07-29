// src/utils/utils.js o src/utils/timeUtils.js

export const formatEstimatedTime = (generations, population) => {
    // Aquí debes poner la lógica real para calcular el tiempo estimado
    // Basado en 'generaciones' y 'población'.
    // Esto es solo un ejemplo:
    const totalOperations = generations * population;
    const timeInSeconds = totalOperations * 0.001; // Asumiendo 1ms por operación como ejemplo
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.round(timeInSeconds % 60);
  
    if (minutes > 0) {
      return `${minutes} min ${seconds} seg`;
    } else {
      return `${seconds} seg`;
    }
  };
  
  // Si tienes más funciones de utilidad, las exportas aquí también.
  // export const anotherUtilFunction = () => { /* ... */ };