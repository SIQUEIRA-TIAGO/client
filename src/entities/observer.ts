import { RowRestriction } from "@/entities/row-restriction";
import { FieldRestriction } from "@/entities/field-restriction";

export type ConditionType = 'boolean' | 'date' | 'text' | 'number' | 'sql';

export interface Column {
	name: string;
	type: ConditionType;
}

export interface ICondition {
	type: ConditionType;
	columns?: Column[];
	required: boolean;
	value: string | boolean | number | null;
}

export interface Observer {
    observer_id: string;
    sql_url: string;
    row_restrictions: RowRestriction[];
    field_restrictions: FieldRestriction[];
    cron_expression: string;
    conditions: Record<string, ICondition> | null
}