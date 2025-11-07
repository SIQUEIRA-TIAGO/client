import { RowRestriction } from "@/entities/row-restriction";

/**
 * 
 * @param rows 
 * @param rowRestrictions 
 * @returns true if any of the restrictions are met, false otherwise
 */
export const checkRowRestrictions = (
    rows: Array<object> = [],
    rowRestrictions: RowRestriction[]
): null | boolean => {
    if (!Array.isArray(rowRestrictions) || rowRestrictions.length === 0) return null

    const rowCount = Number(rows.length);

    for (const rowRestriction of rowRestrictions) {
        let isValid = false;

        switch (rowRestriction.type) {
            case 'rows-gt':
                isValid = rowCount > rowRestriction.value;
                break;
            case 'rows-ls':
                isValid = rowCount < rowRestriction.value;
                break;
            case 'rows-eq':
                isValid = rowCount === rowRestriction.value;
                break;
            case 'rows-neq':
                isValid = rowCount !== rowRestriction.value;
                break;
            default:
                continue;
        }

        if (isValid) return true;
    }

    return false;
}