import { FieldRestriction } from '@/entities/field-restriction';

const isNumeric = (value: any): boolean => /^-?\d+(\.\d+)?$/.test(value);

const normalizeValue = (value: any): any => {
    return typeof value === 'string'
        ? isNumeric(value)
            ? Number(value)
            : value.trim().toLowerCase()
        : value;
};

/**
 *
 * @param rows
 * @param fieldRestrictions
 * @returns affeted rows and fields if any restriction is met,
 * false if no restriction is met, null if no restrictions are provided
 */
export const checkFieldRestrictions = (
    rows: { [key: string]: any }[],
    fieldRestrictions: FieldRestriction[]
):
    | null
    | false
    | { affectedRows: { [key: string]: any }[]; affectedFields: string[] } => {
    const affectedRows: { [key: string]: any }[] = [];
    const affectedFields: string[] = [];

    if (!Array.isArray(fieldRestrictions) || fieldRestrictions.length === 0) return null;
    if (!Array.isArray(rows) || rows.length === 0) return false;

    fieldRestrictions.forEach((fieldRestriction) => {
        rows.forEach(row => {
            const field = row[fieldRestriction.field];

            const normalizedField = normalizeValue(field)
            const normalizedValue = normalizeValue(fieldRestriction.value)

            let isAffected = false;

            switch (fieldRestriction.type) {
                case 'gt':
                    isAffected = normalizedField > normalizedValue;
                    break;
                case 'ls':
                    isAffected = normalizedField < normalizedValue;
                    break;
                case 'eq':
                    isAffected = normalizedField == normalizedValue;
                    break;
                case 'neq':
                    isAffected = normalizedField != normalizedValue;
                    break;
                case 'contains':
                    isAffected = String(normalizedField).includes(normalizedValue);
                    break;
                case 'is-truthy':
                    isAffected = !!field;
                    break;
                case 'is-falsy':
                    isAffected = !field;
                    break;
                default:
                    isAffected = false;
            }

            if (isAffected) {
                affectedRows.push(row);
                affectedFields.push(fieldRestriction.field);
            }
        });
    }
    );

    return affectedRows.length > 0 ? { affectedRows, affectedFields } : false
};
