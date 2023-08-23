import { Column, Model, Relation } from "easy-postgresql";
import Engine from "./engine";
import {
  gqlBoolean,
  gqlBooleanArray,
  gqlFloat,
  gqlFloatArray,
  gqlInt,
  gqlIntArray,
  gqlObject,
  gqlObjectArray,
  gqlString,
  gqlStringArray,
  supportedWhereClauseTypesByOperator,
} from "./types";
import { array_relation, schema } from "./constants";
import fs from "fs";
import path from "path";

const IS_POSTGRES = true;

export default class GraphQL {
  static engine: typeof Engine;
  static stringSchema: string;

  static whereClauseOperators = {
    _and: " AND ",
    _or: " OR ",
    ...(IS_POSTGRES && { _in: " IN ", _nin: " NOT IN " }),
    _lt: " < ",
    _lte: " <= ",
    _gt: " > ",
    _gte: " >= ",
    _is: " IS ",
    _is_not: " IS NOT ",
    _like: " LIKE ",
    _ilike: " ILIKE ",
    _eq: " = ",
    _neq: " <> ",
    ...(IS_POSTGRES && {
      _in: " = ANY",
      _any: " = ANY",
      _nany: " <> ANY",
      _all: " = ALL",
      _nin: " <> ALL",
      _contains: " @> ",
      _contained_in: " <@ ",
      _key_exists: " ? ",
      _key_exists_any: " ?| ",
      _key_exists_all: " ?& ",
      _text_search: "tsquery",
      _in_array: " = ANY ",
      _nin_array: " <> ANY ",
    }),
  };

  static buildWhereClauseInputTypes() {
    return Object.keys(GraphQL.whereClauseOperators)
      .flatMap((key) => {
        if (supportedWhereClauseTypesByOperator[key]) {
          return supportedWhereClauseTypesByOperator[key]
            .map(
              ({ type, value }) => `input ${key}_${type} {\n${key}: ${value}\n}`
            )
            .join("\n");
        }
        return [];
      })
      .filter(Boolean);
  }

  static getModelRelations(model: Model) {
    return Object.values(model.relations) as Relation[];
  }

  static getModelColumns(model: Model) {
    return Object.values(model.columns) as Column[];
  }

  static getModelByTable(table: string) {
    return (GraphQL.engine.db.models as any)?.[table];
  }

  static getAllDBModels() {
    return Object.values(GraphQL.engine.db.models) as Model[];
  }

  static createStaticTypes() {
    const defs = [`limit: ${gqlInt}`, `offset: ${gqlInt}`];
    return defs.join("\n");
  }

  static isArrayColumn(column: Column) {
    return column.type.includes("[]") || column.type === "ARRAY";
  }

  static columnToGqlType(column: Column, withArray = true) {
    let isArray = false;
    let chain = "";
    if (GraphQL.isArrayColumn(column)) {
      isArray = true && withArray;
    }

    if (
      column.type.startsWith("int") ||
      column.type.startsWith("serial") ||
      column.type.startsWith("bigserial") ||
      column.type.startsWith("bigint")
    ) {
      chain = isArray ? gqlIntArray : gqlInt;
    } else if (
      column.type.startsWith("numeric") ||
      column.type.startsWith("float") ||
      column.type.startsWith("decimal") ||
      column.type.startsWith("float") ||
      column.type.startsWith("double") ||
      column.type.startsWith("money") ||
      column.type.startsWith("real")
    ) {
      chain = isArray ? gqlFloatArray : gqlFloat;
    } else if (
      column.type.includes("char") ||
      column.type.includes("text") ||
      column.type.includes("time") ||
      column.type.includes("date") ||
      column.type.includes("uuid")
    ) {
      chain = isArray ? gqlStringArray : gqlString;
    } else if (column.type.startsWith("bool")) {
      chain = isArray ? gqlBooleanArray : gqlBoolean;
    } else if (column.type.startsWith("json")) {
      chain = isArray ? gqlObjectArray : gqlObject;
    } else {
      chain = isArray ? gqlObjectArray : gqlObject;
    }

    if (column.columnConfig.nullable) {
      return chain;
    }

    return `${chain}!`;
  }

  static getModelColumnGqlType(column: Column) {
    return `${column.column}: ${GraphQL.columnToGqlType(column)}`;
  }

  static toModelSchemaType(
    model: Model,
    withSchema = true,
    isAggregate = false
  ) {
    return `${withSchema ? `${schema}_` : ""}${model.table}${
      isAggregate ? "_aggregate" : ""
    }`;
  }

  static toRelationSchemaType(
    relation: Relation,
    withSchema = true,
    isAggregate = false
  ) {
    return `${withSchema ? `${schema}_` : ""}${relation.to_table}${
      isAggregate ? "_aggregate" : ""
    }`;
  }

  static toLimitClauseType() {
    return `limit: ${gqlInt}`;
  }

  static toOffsetClauseType() {
    return `offset ${gqlInt}`;
  }

  static toModelWhereClauseType(model: Model) {
    return `where: ${GraphQL.toModelSchemaType(
      model,
      false,
      false
    )}_where_clause_exp`;
  }

  static toModelOrderByClauseType(model: Model) {
    return `orderBy: ${GraphQL.toModelSchemaType(
      model,
      false,
      false
    )}_order_by_exp`;
  }

  static toModelGroupByClauseType(model: Model) {
    return `groupBy: ${GraphQL.toModelSchemaType(
      model,
      false,
      false
    )}_group_by_exp`;
  }

  static toModelDistinctClauseType(model: Model) {
    return `distinct: ${GraphQL.toModelSchemaType(
      model,
      false,
      false
    )}_distinct_exp`;
  }

  static getAggregationModelQueryInputs(model: Model) {
    const inputs = [
      GraphQL.toModelWhereClauseType(model),
      GraphQL.toModelOrderByClauseType(model),
      GraphQL.toModelGroupByClauseType(model),
      GraphQL.toModelDistinctClauseType(model),
    ];
    return `(${inputs.join(",")})`;
  }

  static getSelectModelQueryInputs(model: Model) {
    const inputs = [
      GraphQL.toModelWhereClauseType(model),
      GraphQL.toModelOrderByClauseType(model),
      GraphQL.toModelGroupByClauseType(model),
      GraphQL.toModelDistinctClauseType(model),
      GraphQL.toLimitClauseType(),
      GraphQL.toOffsetClauseType(),
    ];
    return `(${inputs.join(",")})`;
  }

  static getRelationalGqlType(relation: Relation, isAggregate = false) {
    if (isAggregate) {
      return `${GraphQL.toRelationSchemaType(relation, false, true)}()`;
    }
    return `${relation.alias}`;
  }

  static getModelRelationGqlType(relation: Relation, isAggregate = false) {
    const model = GraphQL.getModelByTable(relation.to_table);
    if (!model) {
      return "";
    }
    if (relation.type === array_relation && !isAggregate) {
      return `${relation.alias}${
        isAggregate
          ? GraphQL.getAggregationModelQueryInputs(model)
          : GraphQL.getSelectModelQueryInputs(model)
      }}: [${GraphQL.toModelSchemaType(model, true, isAggregate)}]`;
    }
    return `${relation.alias}${isAggregate ? "_aggregate" : ""}${
      isAggregate
        ? GraphQL.getAggregationModelQueryInputs(model)
        : GraphQL.getSelectModelQueryInputs(model)
    }: ${GraphQL.toModelSchemaType(model, true, isAggregate)}`;
  }

  static getModelSelectType(model: Model) {
    const modelColumnsGQL = Object.values(
      model.columns as Record<string, Column>
    ).map((column: Column) => GraphQL.getModelColumnGqlType(column));

    const relationTypes = Object.values(
      model.relations as Record<string, Relation>
    ).flatMap((relation: Relation) => [
      GraphQL.getModelRelationGqlType(relation, false),
      GraphQL.getModelRelationGqlType(relation, true),
    ]);

    return `type ${GraphQL.toModelSchemaType(
      model,
      true,
      false
    )}: {\n${modelColumnsGQL.concat(relationTypes).join("\n")}\n}`;
  }

  static whereClauseOperatorsByColumnType(column: Column) {}

  static buildColumnWhereClauseExp(column: Column) {
    // if(GraphQL.isArrayColumn(column)) {
    //   return `${column.column}: ${}`
    // }
  }

  static buildModelWhereClauseExp(model: Model) {
    const columns = GraphQL.getModelColumns(model);
    const relations = GraphQL.getModelRelations(model);
  }

  static buildModelSubTypes(model: Model) {}

  static getBasicInputTypes() {
    return [GraphQL.buildWhereClauseInputTypes()].flatMap((x) => x);
  }

  static buildGraphQLSchema() {
    const schema = Object.values(GraphQL.getAllDBModels())
      .flatMap((model) => [GraphQL.getModelSelectType(model)])
      .concat(GraphQL.getBasicInputTypes())
      .join("\n");
    fs.writeFileSync(
      path.join(process.cwd(), "engine_graphql_schema.gql"),
      schema
    );
  }
}
