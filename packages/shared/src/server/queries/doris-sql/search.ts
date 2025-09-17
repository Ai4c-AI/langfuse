import { StringFilter } from "./doris-filter";

/**
 * Creates a search condition for Doris queries.
 * @param searchTerm The search term to look for.
 * @param searchableFields The fields to search in.
 * @returns A SQL condition for searching.
 */
export function dorisSearchCondition(
  searchTerm: string,
  searchableFields: {
    field: string;
    table: string;
    tablePrefix?: string;
  }[]
): { query: string; params: Record<string, unknown> } {
  if (!searchTerm || searchTerm.trim() === "") {
    return { query: "1=1", params: {} };
  }

  const searchFilters = searchableFields.map(
    ({ field, table, tablePrefix }) =>
      new StringFilter({
        clickhouseTable: table,
        field,
        operator: "contains",
        value: searchTerm,
        tablePrefix,
      })
  );

  const searchConditions = searchFilters.map((filter) => filter.apply());
  const query = searchConditions.map((condition) => condition.query).join(" OR ");
  const params = searchConditions.reduce(
    (acc, condition) => ({ ...acc, ...condition.params }),
    {}
  );

  return { query: `(${query})`, params };
}