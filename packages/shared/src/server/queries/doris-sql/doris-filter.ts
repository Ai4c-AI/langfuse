import z from "zod/v4";
import { singleFilter } from "../../../interfaces/filters";
import { FilterCondition } from "../../../types";
import { isValidTableName } from "../../doris/schemaUtils";
import { logger } from "../../logger";
import { UiColumnMappings } from "../../../tableDefinitions";

export class QueryBuilderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QueryBuilderError";
  }
}

// Base filter class
export abstract class Filter {
  clickhouseTable: string;
  field: string;
  tablePrefix?: string;

  constructor({
    clickhouseTable,
    field,
    tablePrefix,
  }: {
    clickhouseTable: string;
    field: string;
    tablePrefix?: string;
  }) {
    this.clickhouseTable = clickhouseTable;
    this.field = field;
    this.tablePrefix = tablePrefix;
  }

  abstract apply(): { query: string; params: Record<string, unknown> };

  protected getFieldWithPrefix(): string {
    return this.tablePrefix
      ? `${this.tablePrefix}.${this.field}`
      : this.field;
  }
}

// String filter
export class StringFilter extends Filter {
  operator: string;
  value: string;

  constructor({
    clickhouseTable,
    field,
    operator,
    value,
    tablePrefix,
  }: {
    clickhouseTable: string;
    field: string;
    operator: string;
    value: string;
    tablePrefix?: string;
  }) {
    super({ clickhouseTable, field, tablePrefix });
    this.operator = operator;
    this.value = value;
  }

  apply(): { query: string; params: Record<string, unknown> } {
    const fieldWithPrefix = this.getFieldWithPrefix();
    const paramName = `${fieldWithPrefix.replace(/\./g, "_")}_${Math.random().toString(36).substring(2, 15)}`;

    switch (this.operator) {
      case "=":
        return {
          query: `${fieldWithPrefix} = ?`,
          params: { [paramName]: this.value },
        };
      case "!=":
        return {
          query: `${fieldWithPrefix} != ?`,
          params: { [paramName]: this.value },
        };
      case "contains":
        return {
          query: `${fieldWithPrefix} LIKE CONCAT('%', ?, '%')`,
          params: { [paramName]: this.value },
        };
      case "startsWith":
        return {
          query: `${fieldWithPrefix} LIKE CONCAT(?, '%')`,
          params: { [paramName]: this.value },
        };
      case "endsWith":
        return {
          query: `${fieldWithPrefix} LIKE CONCAT('%', ?)`,
          params: { [paramName]: this.value },
        };
      default:
        throw new QueryBuilderError(`Unsupported operator: ${this.operator}`);
    }
  }
}

// DateTime filter
export class DateTimeFilter extends Filter {
  operator: string;
  value: string;

  constructor({
    clickhouseTable,
    field,
    operator,
    value,
    tablePrefix,
  }: {
    clickhouseTable: string;
    field: string;
    operator: string;
    value: string;
    tablePrefix?: string;
  }) {
    super({ clickhouseTable, field, tablePrefix });
    this.operator = operator;
    this.value = value;
  }

  apply(): { query: string; params: Record<string, unknown> } {
    const fieldWithPrefix = this.getFieldWithPrefix();
    const paramName = `${fieldWithPrefix.replace(/\./g, "_")}_${Math.random().toString(36).substring(2, 15)}`;

    return {
      query: `${fieldWithPrefix} ${this.operator} ?`,
      params: { [paramName]: this.value },
    };
  }
}

// String options filter
export class StringOptionsFilter extends Filter {
  operator: string;
  values: string[];

  constructor({
    clickhouseTable,
    field,
    operator,
    values,
    tablePrefix,
  }: {
    clickhouseTable: string;
    field: string;
    operator: string;
    values: string[];
    tablePrefix?: string;
  }) {
    super({ clickhouseTable, field, tablePrefix });
    this.operator = operator;
    this.values = values;
  }

  apply(): { query: string; params: Record<string, unknown> } {
    const fieldWithPrefix = this.getFieldWithPrefix();
    const paramName = `${fieldWithPrefix.replace(/\./g, "_")}_${Math.random().toString(36).substring(2, 15)}`;

    if (this.operator === "in") {
      return {
        query: `${fieldWithPrefix} IN (?)`,
        params: { [paramName]: this.values },
      };
    } else if (this.operator === "notIn") {
      return {
        query: `${fieldWithPrefix} NOT IN (?)`,
        params: { [paramName]: this.values },
      };
    } else {
      throw new QueryBuilderError(`Unsupported operator: ${this.operator}`);
    }
  }
}

// Category options filter
export class CategoryOptionsFilter extends Filter {
  operator: string;
  key: string;
  values: string[];

  constructor({
    clickhouseTable,
    field,
    operator,
    key,
    values,
    tablePrefix,
  }: {
    clickhouseTable: string;
    field: string;
    operator: string;
    key: string;
    values: string[];
    tablePrefix?: string;
  }) {
    super({ clickhouseTable, field, tablePrefix });
    this.operator = operator;
    this.key = key;
    this.values = values;
  }

  apply(): { query: string; params: Record<string, unknown> } {
    const fieldWithPrefix = this.getFieldWithPrefix();
    const keyParamName = `${fieldWithPrefix.replace(/\./g, "_")}_key_${Math.random().toString(36).substring(2, 15)}`;
    const valuesParamName = `${fieldWithPrefix.replace(/\./g, "_")}_values_${Math.random().toString(36).substring(2, 15)}`;

    if (this.operator === "in") {
      return {
        query: `${fieldWithPrefix}[?] IN (?)`,
        params: { [keyParamName]: this.key, [valuesParamName]: this.values },
      };
    } else if (this.operator === "notIn") {
      return {
        query: `${fieldWithPrefix}[?] NOT IN (?)`,
        params: { [keyParamName]: this.key, [valuesParamName]: this.values },
      };
    } else {
      throw new QueryBuilderError(`Unsupported operator: ${this.operator}`);
    }
  }
}

// Number filter
export class NumberFilter extends Filter {
  operator: string;
  value: number;
  clickhouseTypeOverwrite?: string;

  constructor({
    clickhouseTable,
    field,
    operator,
    value,
    tablePrefix,
    clickhouseTypeOverwrite,
  }: {
    clickhouseTable: string;
    field: string;
    operator: string;
    value: number;
    tablePrefix?: string;
    clickhouseTypeOverwrite?: string;
  }) {
    super({ clickhouseTable, field, tablePrefix });
    this.operator = operator;
    this.value = value;
    this.clickhouseTypeOverwrite = clickhouseTypeOverwrite;
  }

  apply(): { query: string; params: Record<string, unknown> } {
    const fieldWithPrefix = this.getFieldWithPrefix();
    const paramName = `${fieldWithPrefix.replace(/\./g, "_")}_${Math.random().toString(36).substring(2, 15)}`;

    return {
      query: `${fieldWithPrefix} ${this.operator} ?`,
      params: { [paramName]: this.value },
    };
  }
}

// Array options filter
export class ArrayOptionsFilter extends Filter {
  operator: string;
  values: string[];

  constructor({
    clickhouseTable,
    field,
    operator,
    values,
    tablePrefix,
  }: {
    clickhouseTable: string;
    field: string;
    operator: string;
    values: string[];
    tablePrefix?: string;
  }) {
    super({ clickhouseTable, field, tablePrefix });
    this.operator = operator;
    this.values = values;
  }

  apply(): { query: string; params: Record<string, unknown> } {
    const fieldWithPrefix = this.getFieldWithPrefix();
    const paramName = `${fieldWithPrefix.replace(/\./g, "_")}_${Math.random().toString(36).substring(2, 15)}`;

    if (this.operator === "hasAny") {
      // In Doris, we can use FIND_IN_SET for simple array checks
      const conditions = this.values.map((_, index) => 
        `FIND_IN_SET(?, ${fieldWithPrefix}) > 0`
      ).join(" OR ");
      
      return {
        query: `(${conditions})`,
        params: { [paramName]: this.values },
      };
    } else if (this.operator === "hasAll") {
      // For hasAll, we need to check that all values are in the array
      const conditions = this.values.map((_, index) => 
        `FIND_IN_SET(?, ${fieldWithPrefix}) > 0`
      ).join(" AND ");
      
      return {
        query: `(${conditions})`,
        params: { [paramName]: this.values },
      };
    } else {
      throw new QueryBuilderError(`Unsupported operator: ${this.operator}`);
    }
  }
}

// Boolean filter
export class BooleanFilter extends Filter {
  value: boolean;
  operator: string;

  constructor({
    clickhouseTable,
    field,
    value,
    operator,
    tablePrefix,
  }: {
    clickhouseTable: string;
    field: string;
    value: boolean;
    operator: string;
    tablePrefix?: string;
  }) {
    super({ clickhouseTable, field, tablePrefix });
    this.value = value;
    this.operator = operator;
  }

  apply(): { query: string; params: Record<string, unknown> } {
    const fieldWithPrefix = this.getFieldWithPrefix();
    const paramName = `${fieldWithPrefix.replace(/\./g, "_")}_${Math.random().toString(36).substring(2, 15)}`;

    return {
      query: `${fieldWithPrefix} ${this.operator} ?`,
      params: { [paramName]: this.value ? 1 : 0 },
    };
  }
}

// Number object filter
export class NumberObjectFilter extends Filter {
  key: string;
  operator: string;
  value: number;

  constructor({
    clickhouseTable,
    field,
    key,
    operator,
    value,
    tablePrefix,
  }: {
    clickhouseTable: string;
    field: string;
    key: string;
    operator: string;
    value: number;
    tablePrefix?: string;
  }) {
    super({ clickhouseTable, field, tablePrefix });
    this.key = key;
    this.operator = operator;
    this.value = value;
  }

  apply(): { query: string; params: Record<string, unknown> } {
    const fieldWithPrefix = this.getFieldWithPrefix();
    const keyParamName = `${fieldWithPrefix.replace(/\./g, "_")}_key_${Math.random().toString(36).substring(2, 15)}`;
    const valueParamName = `${fieldWithPrefix.replace(/\./g, "_")}_value_${Math.random().toString(36).substring(2, 15)}`;

    return {
      query: `${fieldWithPrefix}[?] ${this.operator} ?`,
      params: { [keyParamName]: this.key, [valueParamName]: this.value },
    };
  }
}

// String object filter
export class StringObjectFilter extends Filter {
  operator: string;
  key: string;
  value: string;

  constructor({
    clickhouseTable,
    field,
    operator,
    key,
    value,
    tablePrefix,
  }: {
    clickhouseTable: string;
    field: string;
    operator: string;
    key: string;
    value: string;
    tablePrefix?: string;
  }) {
    super({ clickhouseTable, field, tablePrefix });
    this.operator = operator;
    this.key = key;
    this.value = value;
  }

  apply(): { query: string; params: Record<string, unknown> } {
    const fieldWithPrefix = this.getFieldWithPrefix();
    const keyParamName = `${fieldWithPrefix.replace(/\./g, "_")}_key_${Math.random().toString(36).substring(2, 15)}`;
    const valueParamName = `${fieldWithPrefix.replace(/\./g, "_")}_value_${Math.random().toString(36).substring(2, 15)}`;

    switch (this.operator) {
      case "=":
        return {
          query: `${fieldWithPrefix}[?] = ?`,
          params: { [keyParamName]: this.key, [valueParamName]: this.value },
        };
      case "!=":
        return {
          query: `${fieldWithPrefix}[?] != ?`,
          params: { [keyParamName]: this.key, [valueParamName]: this.value },
        };
      case "contains":
        return {
          query: `${fieldWithPrefix}[?] LIKE CONCAT('%', ?, '%')`,
          params: { [keyParamName]: this.key, [valueParamName]: this.value },
        };
      default:
        throw new QueryBuilderError(`Unsupported operator: ${this.operator}`);
    }
  }
}

// Null filter
export class NullFilter extends Filter {
  operator: string;

  constructor({
    clickhouseTable,
    field,
    operator,
    tablePrefix,
  }: {
    clickhouseTable: string;
    field: string;
    operator: string;
    tablePrefix?: string;
  }) {
    super({ clickhouseTable, field, tablePrefix });
    this.operator = operator;
  }

  apply(): { query: string; params: Record<string, unknown> } {
    const fieldWithPrefix = this.getFieldWithPrefix();

    if (this.operator === "isNull") {
      return {
        query: `${fieldWithPrefix} IS NULL`,
        params: {},
      };
    } else if (this.operator === "isNotNull") {
      return {
        query: `${fieldWithPrefix} IS NOT NULL`,
        params: {},
      };
    } else {
      throw new QueryBuilderError(`Unsupported operator: ${this.operator}`);
    }
  }
}

// Filter list
export class FilterList {
  filters: Filter[];

  constructor(filters: Filter[]) {
    this.filters = filters;
  }

  apply(): { query: string; params: Record<string, unknown> } {
    if (this.filters.length === 0) {
      return { query: "1=1", params: {} };
    }

    const filterResults = this.filters.map((filter) => filter.apply());
    const query = filterResults.map((result) => result.query).join(" AND ");
    const params = filterResults.reduce(
      (acc, result) => ({ ...acc, ...result.params }),
      {}
    );

    return { query, params };
  }

  find(predicate: (filter: Filter) => boolean): Filter | undefined {
    return this.filters.find(predicate);
  }

  push(...filters: Filter[]): number {
    return this.filters.push(...filters);
  }
}