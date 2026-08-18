// hooks/useSensorData.js

import { useState, useEffect } from 'react';
import { getSensorData } from '../services/sensorService';

export const useSensorData = (datasetId, useMock = true, baseUrl = '/api') => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEmpty, setIsEmpty] = useState(false);
  const [isValid, setIsValid] = useState(true);

  const validateData = (response) => {
    if (response.error) {
      return { valid: false, reason: response.error, isError: true };
    }
    if (!response.rows || !Array.isArray(response.rows)) {
      return { valid: false, reason: 'Missing rows array' };
    }
    if (response.rows.length === 0) {
      return { valid: true, isEmpty: true };
    }
    if (!response.metadata || !response.metadata.streams) {
      return { valid: false, reason: 'Missing metadata or streams' };
    }
    const firstRow = response.rows[0];
    const streamIds = response.metadata.streams.map(s => s.id);
    const hasTimestamp = firstRow.created_at !== undefined;
    const hasStreamFields = streamIds.some(id => firstRow[id] !== undefined);
    if (!hasTimestamp || !hasStreamFields) {
      return { valid: false, reason: 'Missing required fields (created_at or stream data)' };
    }
    return { valid: true, isEmpty: false };
  };

  useEffect(() => {
    if (!datasetId) {
      setError(new Error('No dataset ID provided'));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setIsEmpty(false);
    setIsValid(true);

    getSensorData(datasetId, { useMock, baseUrl })
      .then((response) => {
        const validation = validateData(response);
        if (validation.isError) {
          setError(new Error(response.error));
          setIsValid(false);
          setData(null);
        } else if (!validation.valid) {
          setError(new Error(`Invalid data: ${validation.reason}`));
          setIsValid(false);
          setData(null);
        } else if (validation.isEmpty) {
          setIsEmpty(true);
          setData(null);
        } else {
          setData(response);
          setIsEmpty(false);
          setIsValid(true);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
        setData(null);
      });
  }, [datasetId, useMock, baseUrl]);

  return { data, loading, error, isEmpty, isValid };
};