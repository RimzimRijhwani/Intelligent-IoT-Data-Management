const ALLOWED_STORAGE_FIELDS = new Set([
  "field1",
  "field2",
  "field3",
  "field4",
  "field5",
  "field6",
  "field7",
  "field8",
]);

class DatasetImportError extends Error {
  constructor(message, fields) {
    super(message);
    this.code = "VALIDATION_ERROR";
    this.status = 400;
    this.fields = fields;
  }
}

const validationError = (fields) =>
  new DatasetImportError("One or more fields are invalid.", fields);

const text = (value) => (typeof value === "string" ? value.trim() : "");
const isBlank = (value) =>
  value === undefined || value === null || (typeof value === "string" && value.trim() === "");

function validateImport(input) {
  input = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const fields = {};
  const name = text(input.name);
  const timestampField = text(input.timestampField);
  const mappings = Array.isArray(input.mappings) ? input.mappings : null;
  const rows = Array.isArray(input.rows) ? input.rows : null;

  if (!name || name.length > 120)
    fields.name = "Enter a dataset name of at most 120 characters.";
  if (!timestampField) fields.timestampField = "Select one CSV timestamp column.";
  if (!mappings || mappings.length < 1 || mappings.length > 8)
    fields.mappings = "Provide one to eight sensor mappings.";
  if (!rows || rows.length < 1 || rows.length > 100000)
    fields.rows = "Provide between 1 and 100,000 CSV rows.";

  const normalisedMappings = [];
  if (mappings) {
    const sourceFields = new Set();
    const storageFields = new Set();
    mappings.forEach((mapping, index) => {
      const sourceField = text(mapping?.sourceField);
      const storageField = text(mapping?.storageField);
      const displayName = text(mapping?.displayName);
      const sourceDataType = text(mapping?.sourceDataType);
      if (!sourceField) fields[`mappings.${index}.sourceField`] = "Required.";
      if (!ALLOWED_STORAGE_FIELDS.has(storageField))
        fields[`mappings.${index}.storageField`] = "Use field1 through field8.";
      if (!displayName || displayName.length > 120)
        fields[`mappings.${index}.displayName`] = "Required; maximum 120 characters.";
      if (!sourceDataType || !['number', 'text', 'datetime', 'boolean'].includes(sourceDataType))
        fields[`mappings.${index}.sourceDataType`] = "Invalid data type.";
      if (sourceFields.has(sourceField))
        fields[`mappings.${index}.sourceField`] = "Each source field may be mapped once.";
      if (sourceField === timestampField)
        fields[`mappings.${index}.sourceField`] = "The timestamp field cannot also be a sensor mapping.";
      if (storageFields.has(storageField))
        fields[`mappings.${index}.storageField`] = "Each storage field may be mapped once.";
      sourceFields.add(sourceField);
      storageFields.add(storageField);
      normalisedMappings.push({ sourceField, storageField, displayName, sourceDataType });
    });
  }

  if (Object.keys(fields).length) throw validationError(fields);
  return { name, timestampField, mappings: normalisedMappings, rows };
}

function mapRows(rows, timestampField, mappings) {
  return rows.map((row, index) => {
    if (!row || Array.isArray(row) || typeof row !== "object")
      throw validationError({
        [`rows.${index}`]: "Each row must be an object keyed by CSV header.",
      });
    const rawTimestamp = row[timestampField];
    const timestamp = new Date(rawTimestamp);
    if (rawTimestamp === undefined || rawTimestamp === null || Number.isNaN(timestamp.getTime()))
      throw validationError({
        [`rows.${index}.${timestampField}`]: "Must be a valid timestamp.",
      });
    const output = { entryId: index + 1, createdAt: timestamp.toISOString() };
    for (const mapping of mappings) {
      const rawValue = row[mapping.sourceField];
      if (isBlank(rawValue)) {
        output[mapping.storageField] = null;
        continue;
      }
      const value = Number(rawValue);
      if (!Number.isFinite(value))
        throw validationError({
          [`rows.${index}.${mapping.sourceField}`]: "Must be a number or an empty value.",
        });
      output[mapping.storageField] = value;
    }
    return output;
  });
}

async function importDataset(input, userId, repository) {
  const parsed = validateImport(input);
  const wideRows = mapRows(parsed.rows, parsed.timestampField, parsed.mappings);
  return repository.createWithMappingsAndRows({ ...parsed, wideRows, userId });
}

module.exports = { DatasetImportError, importDataset, validateImport, mapRows };
