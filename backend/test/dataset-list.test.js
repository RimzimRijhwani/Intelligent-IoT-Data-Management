const test = require("node:test");
const assert = require("node:assert/strict");
const db = require("../src/db/pool");
const datasetRepository = require("../src/repositories/datasetRepository");

test("findAll returns each dataset name with its total persisted row count", async () => {
  const originalQuery = db.query;
  let query;
  db.query = async (sql) => {
    query = sql;
    return {
      rows: [
        { id: 1, name: "microclimate", totalRows: 3 },
        { id: 2, name: "empty-dataset", totalRows: 0 },
      ],
    };
  };

  try {
    const datasets = await datasetRepository.findAll();

    assert.deepEqual(datasets, [
      { id: 1, name: "microclimate", totalRows: 3 },
      { id: 2, name: "empty-dataset", totalRows: 0 },
    ]);
    assert.match(query, /LEFT JOIN timeseries t ON t\.dataset_id = d\.id/);
    assert.match(query, /COUNT\(t\.entry_id\)::integer AS "totalRows"/);
  } finally {
    db.query = originalQuery;
  }
});
