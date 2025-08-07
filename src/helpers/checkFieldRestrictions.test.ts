import { FieldRestriction } from '@/entities/field-restriction';
import { checkFieldRestrictions } from './checkFieldRestrictions';

describe('checkFieldRestrictions', () => {
    it('should return null if fieldRestrictions is empty', () => {
        const rows: any[] = [{ id: 1, name: 'John' }];
        const fieldRestrictions: FieldRestriction[] = [];

        const result = checkFieldRestrictions(rows, fieldRestrictions);

        expect(result).toBeNull();
    });

    it('should return false if rows is empty', () => {
        const rows: any[] = [];
        const fieldRestrictions: FieldRestriction[] = [{ field: 'id', type: 'gt', value: 5 }];

        const result = checkFieldRestrictions(rows, fieldRestrictions);

        expect(result).toBe(false);
    });

    it('should return affectedRows and affectedFields if there are matching restrictions', () => {
        const rows: any[] = [
            { id: 1, name: 'John', age: 40 },
            { id: 2, name: 'Jane', age: 30 },
        ];
        const fieldRestrictions: FieldRestriction[] = [
            { field: 'id', type: 'gt', value: 1 },
            { field: 'age', type: 'ls', value: 30 },
        ];

        const result = checkFieldRestrictions(rows, fieldRestrictions);

        expect(result).toEqual({
            affectedRows: [
                { id: 2, name: 'Jane', age: 30 }
            ],
            affectedFields: ['id'],
        });
    });

    it('should return false if there are no matching restrictions', () => {
        const rows: any[] = [
            { id: 1, name: 'John', age: 25 },
            { id: 2, name: 'Jane', age: 30 },
        ];
        const fieldRestrictions: FieldRestriction[] = [
            { field: 'id', type: 'gt', value: 3 },
            { field: 'age', type: 'ls', value: 20 },
        ];

        const result = checkFieldRestrictions(rows, fieldRestrictions);

        expect(result).toBe(false);
    });
    it('should return affectedRows and affectedFields if there are matching restrictions', () => {
        const rows: any[] = [
            { id: 1, name: 'John', age: 25 },
            { id: 2, name: 'Jane', age: 30 },
        ];
        const fieldRestrictions: FieldRestriction[] = [
            {field: 'name', type: 'contains', value: 'Jo'}
        ];

        const result = checkFieldRestrictions(rows, fieldRestrictions);

        expect(result).toEqual({
            affectedRows: [
                { id: 1, name: 'John', age: 25 },
            ],
            affectedFields: ['name'],
        });
    });
});