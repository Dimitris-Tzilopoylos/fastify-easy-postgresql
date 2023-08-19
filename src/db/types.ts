import { z } from "zod";
import { columnSchema, dbTableSchema, relationSchema } from "./schema";

export type Relation = z.infer<typeof relationSchema>;
export type Column = z.infer<typeof columnSchema>;
export type DatabaseTable = z.infer<typeof dbTableSchema>;
export type ModelFilters = Record<
  string,
  (value: any, where?: any, filters?: any) => Record<string, any>
>;
