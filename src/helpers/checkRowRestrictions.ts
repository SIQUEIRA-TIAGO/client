import { RowRestriction } from "@/entities/row-restriction";
/**
 * 
 * @param rows 
 * @param rowRestrictions 
 * @returns true if any of the restrictions are met, false otherwise
 */
export const checkRowRestrictions = (rows: Array<object>, rowRestrictions: RowRestriction[]): null | boolean => {
    if (!!!rowRestrictions?.length) {
        return null;
    }

    const rowCount = rows.length;

    let result = rowRestrictions?.map((rowRestriction: RowRestriction) => {
        switch (rowRestriction.type) {
            case 'rows-gt':
                return rowCount > rowRestriction.value;
            case 'rows-ls':
                return rowCount < rowRestriction.value;
            case 'rows-eq':
                return rowCount == rowRestriction.value;
            case 'rows-neq':
                return rowCount != rowRestriction.value;
            default:
                return false;
        }
    })

    return result?.find((item)=>{return !!item}) ?? false;
}