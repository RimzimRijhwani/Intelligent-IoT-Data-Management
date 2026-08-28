// services/sensorService.js

import {
  sensor1Response,
  sensor2Response,
  sensor3Response,
  emptyResponse,
  validationErrorResponse,
  malformedSensorDataResponse,
  errorResponse,
  insufficientDataResponse,
} from '../data';

export const getSensorData = async (datasetId, options = {}) => {
  const { useMock = true, baseUrl = '/api' } = options;

  if (useMock) {
    await new Promise((resolve) => setTimeout(resolve, 500));

    switch (datasetId) {
      case 'sensor1':
        return sensor1Response;
      case 'sensor2':
        return sensor2Response;
      case 'sensor3':
        return sensor3Response;
      case 'empty':
        return emptyResponse;
      case 'validation-error':
        return validationErrorResponse;
      case 'malformed':
        return malformedSensorDataResponse;
      case 'error':
        return errorResponse;
      case 'insufficient':
        return insufficientDataResponse;
      default:
        throw new Error(`Unknown dataset ID: ${datasetId}`);
    }
  }

  const response = await fetch(`${baseUrl}/datasets/${datasetId}/series`);
  if (!response.ok) {
    throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
  }
  return response.json();
};