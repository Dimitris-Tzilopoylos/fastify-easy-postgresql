export const schema = process.env.DB_SCHEMA || "public";
export const object_relation = "object";
export const array_relation = "array";

export const EngineQueries = {
  getTables: `SELECT table_name as table  FROM information_schema.tables WHERE table_schema = '${schema}' AND table_type = 'BASE TABLE'; `,
  getTableColumns: `SELECT udt_name as mixed_column_type,case when is_nullable = 'NO' then false else true end as nullable,column_name as name, data_type as type FROM information_schema.columns WHERE table_schema = '${schema}' AND table_name = $1;`,
};
