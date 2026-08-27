import { useEffect, useState } from "react";

const DEFAULT_DATASET_URL = "/mock/mockdatasets.json";

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

const isValidDataset = (dataset) =>
  dataset !== null &&
  typeof dataset === "object" &&
  !Array.isArray(dataset) &&
  isNonEmptyString(dataset.id) &&
  isNonEmptyString(dataset.name) &&
  isNonEmptyString(dataset.icon) &&
  isNonEmptyString(dataset.description) &&
  Number.isInteger(dataset.streams) &&
  dataset.streams >= 0 &&
  isNonEmptyString(dataset.lastUpdated) &&
  isNonEmptyString(dataset.status);

export const useDatasets = (url = DEFAULT_DATASET_URL) => {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadDatasets = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(url, { signal: controller.signal });

        if (!response.ok) {
          throw new Error(
            `Dataset request failed with status ${response.status}`
          );
        }

        const payload = await response.json();

        if (!Array.isArray(payload)) {
          throw new Error("Dataset response must be an array");
        }

        const invalidRecordIndex = payload.findIndex(
          (dataset) => !isValidDataset(dataset)
        );

        if (invalidRecordIndex !== -1) {
          throw new Error(
            `Invalid dataset record at index ${invalidRecordIndex}`
          );
        }

        setDatasets(payload);
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setDatasets([]);
          setError(requestError);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadDatasets();

    return () => controller.abort();
  }, [url]);

  return { datasets, loading, error };
};