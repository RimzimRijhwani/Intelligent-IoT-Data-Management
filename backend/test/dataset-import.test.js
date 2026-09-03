const test = require("node:test");
const assert = require("node:assert/strict");
const {
  DatasetImportError,
  importDataset,
  mapRows,
  validateImport,
} = require("../src/services/datasetImportService");

const mappings = [
  { sourceField: "AirTemperature", storageField: "field1", displayName: "Temperature" },
  { sourceField: "RelativeHumidity", storageField: "field2", displayName: "Humidity" },
];

test("reviewed CSV fields are converted to a wide time-series row", () => {
  const result = mapRows(
    [
      {
        Time: "2026-04-29T01:25:15+10:00",
        AirTemperature: "16.7",
        RelativeHumidity: "79.9",
      },
    ],
    "Time",
    mappings,
  );
  assert.deepEqual(result, [
    {
      entryId: 1,
      createdAt: "2026-04-28T15:25:15.000Z",
      field1: 16.7,
      field2: 79.9,
    },
  ]);
});

test("an import rejects duplicate storage fields", () => {
  assert.throws(
    () =>
      validateImport({
        name: "Microclimate",
        timestampField: "Time",
        rows: [{ Time: "2026-04-29T01:25:15+10:00", AirTemperature: "16.7" }],
        mappings: [
          { sourceField: "AirTemperature", storageField: "field1", displayName: "Temperature" },
          { sourceField: "RelativeHumidity", storageField: "field1", displayName: "Humidity" },
        ],
      }),
    (error) =>
      error instanceof DatasetImportError &&
      error.fields["mappings.1.storageField"] === "Each storage field may be mapped once.",
  );
});

test("invalid numeric selected values fail before any database write", () => {
  assert.throws(
    () =>
      mapRows(
        [{ Time: "2026-04-29T01:25:15+10:00", AirTemperature: "warm" }],
        "Time",
        mappings.slice(0, 1),
      ),
    (error) =>
      error instanceof DatasetImportError &&
      error.fields["rows.0.AirTemperature"] === "Must be a number or an empty value.",
  );
});

test("the authenticated user id and reviewed mappings are passed to the transaction", async () => {
  let received;
  const repository = {
    async createWithMappingsAndRows(input) {
      received = input;
      return { id: 42 };
    },
  };
  const result = await importDataset(
    {
      name: "Microclimate April",
      timestampField: "Time",
      mappings,
      rows: [
        {
          Time: "2026-04-29T01:25:15+10:00",
          AirTemperature: "16.7",
          RelativeHumidity: "79.9",
        },
      ],
    },
    "4c7c77b9-2bb8-4a3e-9b7a-4a66782e9dd6",
    repository,
  );
  assert.deepEqual(result, { id: 42 });
  assert.equal(received.userId, "4c7c77b9-2bb8-4a3e-9b7a-4a66782e9dd6");
  assert.equal(received.mappings[0].displayName, "Temperature");
  assert.equal(received.wideRows[0].field2, 79.9);
});
