import { RowRestriction } from '@/entities/row-restriction';
import { checkRowRestrictions } from './checkRowRestrictions';

describe('checkRowRestrictions', () => {
    it('should return null when rowRestrictions is empty', () => {
        const rows: object[] = [];
        const rowRestrictions: RowRestriction[]  = [];

        const result = checkRowRestrictions(rows, rowRestrictions);

        expect(result).toBeNull();
    });

    it('should return true when rowCount is greater than rowRestriction value', () => {
        const rows: object[] = [{}, {}, {}];
        const rowRestrictions: RowRestriction[]  = [{ type: 'rows-gt', value: 2 }];

        const result = checkRowRestrictions(rows, rowRestrictions);

        expect(result).toBe(true);
    });

    it('should return false when rowCount is not greater than rowRestriction value', () => {
        const rows: object[] = [{}, {}];
        const rowRestrictions: RowRestriction[]  = [{ type: 'rows-gt', value: 3 }];

        const result = checkRowRestrictions(rows, rowRestrictions);

        expect(result).toBe(false);
    })

    it('should return true when rowCount is less than rowRestriction value', () => {
        const rows: object[] = [{}, {}];
        const rowRestrictions: RowRestriction[]  = [{ type: 'rows-ls', value: 3 }];

        const result = checkRowRestrictions(rows, rowRestrictions);

        expect(result).toBe(true);
    });

    it('should return false when rowCount is not less than rowRestriction value', () => {
        const rows: object[] = [{}, {}, {}];
        const rowRestrictions: RowRestriction[]  = [{ type: 'rows-ls', value: 2 }];

        const result = checkRowRestrictions(rows, rowRestrictions);

        expect(result).toBe(false);
    });

    it('should return true when rowCount is equal to rowRestriction value', () => {
        const rows: object[] = [{}, {}, {}];
        const rowRestrictions: RowRestriction[]  = [{ type: 'rows-eq', value: 3 }];

        const result = checkRowRestrictions(rows, rowRestrictions);

        expect(result).toBe(true);
    });

    it('should return false when rowCount is not equal to rowRestriction value', () => {
        const rows: object[] = [{}, {}, {}];
        const rowRestrictions: RowRestriction[]  = [{ type: 'rows-eq', value: 2 }];

        const result = checkRowRestrictions(rows, rowRestrictions);

        expect(result).toBe(false);
    });

    it('should return true when rowCount is not equal to rowRestriction value', () => {
        const rows: object[] = [{}, {}, {}];
        const rowRestrictions: RowRestriction[] = [{ type: 'rows-neq', value: 2 }];

        const result = checkRowRestrictions(rows, rowRestrictions);

        expect(result).toBe(true);
    });

    it('should return false when rowCount is equal to rowRestriction value', () => {
        const rows: object[] = [{}, {}, {}];
        const rowRestrictions: RowRestriction[] = [{ type: 'rows-neq', value: 3 }];

        const result = checkRowRestrictions(rows, rowRestrictions);

        expect(result).toBe(false);
    });

    it('should return false when rowRestriction type is invalid', () => {
        const rows: object[] = [{}, {}, {}];

        // @ts-ignore   
        const rowRestrictions: RowRestriction[] = [{ type: 'invalid', value: 2 }];

        const result = checkRowRestrictions(rows, rowRestrictions);

        expect(result).toBe(false);
    });
});