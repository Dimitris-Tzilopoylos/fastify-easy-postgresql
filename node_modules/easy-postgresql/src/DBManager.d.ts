export = DBManager;
declare class DBManager {
  static createSchema(schemaName?: any): Promise<{
    up: string;
    down: string;
  }>;
  static dropSchema(schemaName?: any): Promise<{
    up: string;
    down: string;
  }>;
  static dropTable(model: any): Promise<{
    up: string;
    down: string;
  }>;
  static createTable(model: any): Promise<{
    up: string;
    down: string;
  }>;
  static modelColumnstoSql(model: any): string;
  static modelColumnToSQL(column: any): string;
  static modelColumnConstraints(column: any): string;
  static createIndexes(model: any): void;
  static exec(sql: any, args?: any[]): Promise<void>;
  static runBash(depth?: number): Promise<void>;
}
