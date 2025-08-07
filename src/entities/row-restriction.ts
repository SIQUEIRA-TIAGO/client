export interface RowRestriction {
    type: "rows-gt" | 'rows-ls' | 'rows-eq' | 'rows-neq'
    value: number;
}