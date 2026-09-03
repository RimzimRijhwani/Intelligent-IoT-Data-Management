/**
 * DATASET REPOSITORY
 * -------------------
 * Handles all database operations related to dataset metadata.
 *
 * Responsibilities:
 *   - Fetch all datasets
 *   - Fetch a dataset by ID
 *   - Insert a new dataset
 *
 * This repository does NOT interact with time‑series rows.
 */

const db = require('../db/pool'); // pg Pool instance

class DatasetRepository {
  async findAll() {
    const result = await db.query(`
      SELECT id, name, created_by AS "createdBy", updated_by AS "updatedBy",
             created_at AS "createdAt", updated_at AS "updatedAt"
      FROM datasets
      ORDER BY id ASC
    `);
    return result.rows;
  }

  async findById(id) {
    const result = await db.query(
      `
      SELECT id, name, created_by AS "createdBy", updated_by AS "updatedBy",
             created_at AS "createdAt", updated_at AS "updatedAt"
      FROM datasets
      WHERE id = $1
      `,
      [id]
    );
    return result.rows[0] || null;
  }

  async findByName(name) {
    const result = await db.query(
      `
      SELECT id, name, created_by AS "createdBy", updated_by AS "updatedBy",
             created_at AS "createdAt", updated_at AS "updatedAt"
      FROM datasets
      WHERE name = $1
      `,
      [name]
    );
    return result.rows[0] || null;
  }

  async create(data) {
    const { name } = data;

    const result = await db.query(
      `
      INSERT INTO datasets (name)
      VALUES ($1)
      RETURNING id, name
      `,
      [name]
    );

    return result.rows[0];
  }

  /**
   * Inserts a user-owned dataset, its saved UI mappings, and its mapped CSV
   * values as one database transaction. A failed row cannot leave a partial
   * dataset visible to the dashboard.
   */
  async createWithMappingsAndRows({
    name,
    mappings,
    wideRows,
    userId,
  }) {
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      const datasetResult = await client.query(
        `INSERT INTO datasets (name, created_by, updated_by)
         VALUES ($1, $2, $2)
         RETURNING id, name, created_by AS "createdBy", updated_by AS "updatedBy",
                   created_at AS "createdAt", updated_at AS "updatedAt"`,
        [name, userId],
      );
      const dataset = datasetResult.rows[0];

      for (const mapping of mappings) {
        await client.query(
          `INSERT INTO dataset_field_mappings
             (dataset_id, source_field, storage_field, display_name, created_by, updated_by)
           VALUES ($1, $2, $3, $4, $5, $5)`,
          [dataset.id, mapping.sourceField, mapping.storageField, mapping.displayName, userId],
        );
      }

      for (const row of wideRows) {
        const storageFields = Object.keys(row).filter((key) => key.startsWith("field"));
        const columns = ["dataset_id", "created_at", "entry_id", ...storageFields];
        const values = [
          dataset.id,
          row.createdAt,
          row.entryId,
          ...storageFields.map((field) => row[field]),
        ];
        const placeholders = columns.map((_, index) => `$${index + 1}`).join(", ");
        await client.query(
          `INSERT INTO timeseries (${columns.join(", ")}) VALUES (${placeholders})`,
          values,
        );
      }

      await client.query("COMMIT");
      return {
        ...dataset,
        mappings,
        importedRowCount: wideRows.length,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new DatasetRepository();
