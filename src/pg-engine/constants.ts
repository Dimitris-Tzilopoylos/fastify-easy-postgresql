export const schema = process.env.DB_SCHEMA || "public";
export const object_relation = "object";
export const array_relation = "array";

export const EngineQueries = {
  getTables: `SELECT table_name as table  FROM information_schema.tables WHERE table_schema = '${schema}' AND table_type = 'BASE TABLE'; `,
  getTableColumns: `SELECT udt_name as mixed_column_type,column_default as default_value,case when is_nullable = 'NO' then false else true end as nullable,column_name as name, data_type as type FROM information_schema.columns WHERE table_schema = '${schema}' AND table_name = $1;`,
  getTableUniqueColumns: `SELECT 
    column_name
FROM 
    information_schema.columns
WHERE 
    table_schema = $1
    AND table_name = $2
    AND column_name IN (
        SELECT 
            column_name
        FROM 
            information_schema.constraint_column_usage
        WHERE 
            constraint_name IN (
                SELECT 
                    constraint_name
                FROM 
                    information_schema.table_constraints
                WHERE 
                    table_schema = $3
                    AND table_name = $4
                    AND constraint_type = 'UNIQUE'
            )
    );
`,
  getTableConstraintNames: `SELECT 
    constraint_name,
    string_agg(column_name, ', ') AS columns
FROM 
    information_schema.constraint_column_usage
WHERE 
    table_schema = $1
    AND table_name = $2
GROUP BY 
    constraint_name;
`,
  getTablePrimaryKeys: `SELECT DISTINCT ON (kcu.column_name)
    tc.constraint_name AS primary_key_name,
    kcu.column_name AS column_name,
    CASE
        WHEN c.column_default LIKE 'nextval%' THEN 'yes'
        ELSE 'no'
    END AS is_auto_increment
FROM
    information_schema.table_constraints AS tc
JOIN
    information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN
    information_schema.columns AS c
    ON c.table_name = tc.table_name
    AND c.column_name = kcu.column_name
WHERE
    tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema = $1
    AND tc.table_name = $2;

`,
};

export const StatementResponseSchemaLEX = "StatementResponse";
export const ResponseSchemaLEX = "Response";
export const QueryParamsSchemaLEX = "QueryParams";
export const PathParamsSchemaLEX = "PathParams";
