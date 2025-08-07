import { FieldRestriction } from '@/entities/field-restriction';

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

    if (!!!fieldRestrictions?.length) {
        return null;
    }
    if (!!!rows?.length) {
        return false;
    }

    let result = fieldRestrictions?.map((fieldRestriction) => {
            return rows?.map((row, index) => {
                let field = row[fieldRestriction.field];

                switch (fieldRestriction.type) {
                    case 'gt':
                        field > Number(fieldRestriction.value) &&
                            affectedRows.push(row) &&
                            affectedFields.push(fieldRestriction.field);
                        return field > Number(fieldRestriction.value);
                    case 'ls':
                        field < Number(fieldRestriction.value) &&
                            affectedRows.push(row) &&
                            affectedFields.push(fieldRestriction.field);
                        return field < Number(fieldRestriction.value);
                    case 'eq':
                        field == fieldRestriction.value &&
                            affectedRows.push(row) &&
                            affectedFields.push(fieldRestriction.field);
                        return field == fieldRestriction.value;
                    case 'neq':
                        field != fieldRestriction.value &&
                            affectedRows.push(row) &&
                            affectedFields.push(fieldRestriction.field);
                        return field != fieldRestriction.value;
                    case 'contains':
                        String(field)?.includes(fieldRestriction.value) &&
                            affectedRows.push(row) &&
                            affectedFields.push(fieldRestriction.field);
                        return String(field)?.includes(fieldRestriction.value);
                    case 'is-truthy':
                        !!field &&
                            affectedRows.push(row) &&
                            affectedFields.push(fieldRestriction.field);
                        return !!field;
                    case 'is-falsy':
                        !field &&
                            affectedRows.push(row) &&
                            affectedFields.push(fieldRestriction.field);
                        return !field;
                    default:
                        return false;
                }
            });
        }
    );

    let flatResult = result.flat();
   
    return flatResult?.find((item) => {
        return !!item;
    })
        ? { affectedRows, affectedFields }
        : false;
};
