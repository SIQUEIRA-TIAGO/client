export interface FieldRestriction {
    type: "gt" | "ls" | "eq" | 'neq' | 'contains' | 'is-falsy' | 'is-truthy';
    value?: any;
    field: string;
}