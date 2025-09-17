import { UiColumnMappings } from "../../../tableDefinitions";
import { OrderBy } from "../../../types";
import { QueryBuilderError } from "./factory";
import { isValidTableName } from "../../doris/schemaUtils";
import { logger } from "../../logger";

export const createOrderByFromOrderByState = (
  orderBy: OrderBy[],
  columnMapping: UiColumnMappings
): string => {
  if (!orderBy || orderBy.length === 0) {
    return "";
  }

  const orderByStatements = orderBy.map((frontEndOrderBy) => {
    // checks if the column exists in the Doris schema
    const column = matchAndVerifyTracesUiColumn(frontEndOrderBy, columnMapping);

    const fieldWithPrefix = column.queryPrefix
      ? `${column.queryPrefix}.${column.clickhouseSelect}`
      : column.clickhouseSelect;

    return `${fieldWithPrefix} ${frontEndOrderBy.direction}`;
  });

  return `ORDER BY ${orderByStatements.join(", ")}`;
};

const matchAndVerifyTracesUiColumn = (
  orderBy: OrderBy,
  uiTableDefinitions: UiColumnMappings
) => {
  // tries to match the column name to the Doris table name
  logger.debug(`OrderBy to match: ${JSON.stringify(orderBy)}`);
  const uiTable = uiTableDefinitions.find(
    (col) =>
      col.uiTableName === orderBy.column || col.uiTableId === orderBy.column // matches on the NAME of the column in the UI.
  );

  if (!uiTable) {
    throw new QueryBuilderError(
      `Column ${orderBy.column} does not match a UI / Doris table mapping.`
    );
  }

  if (!isValidTableName(uiTable.clickhouseTableName)) {
    throw new QueryBuilderError(
      `Invalid Doris table name: ${uiTable.clickhouseTableName}`
    );
  }

  return uiTable;
};