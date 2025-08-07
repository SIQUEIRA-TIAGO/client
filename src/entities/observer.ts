import { RowRestriction } from "@/entities/row-restriction";
import { FieldRestriction } from "@/entities/field-restriction";

export interface Observer {
    observer_id: string;
    sql_url: string;
    row_restrictions: RowRestriction[];
    field_restrictions: FieldRestriction[];
    cron_expression: string;
}