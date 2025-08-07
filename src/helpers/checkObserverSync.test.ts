import { Observer } from '@/entities/observer';
import { checkObserverSync } from './checkObserverSync';

describe('checkObserverSync', () => {
    it('should return true when observers and sqls have the same length', () => {
        const observers: Observer[] = [
            {
                observer_id: '1',
                sql_url: '',
                row_restrictions: [],
                field_restrictions: [],
                cron_expression: '',
            },
            {
                observer_id: '2',
                sql_url: '',
                row_restrictions: [],
                field_restrictions: [],
                cron_expression: '',
            },
            {
                observer_id: '3',
                sql_url: '',
                row_restrictions: [],
                field_restrictions: [],
                cron_expression: '',
            },
        ];
        const sqls = [
            { observerId: '1', sql: 'SELECT * FROM table1' },
            { observerId: '2', sql: 'SELECT * FROM table2' },
            { observerId: '3', sql: 'SELECT * FROM table3' },
        ];

        const result = checkObserverSync({ observers, sqls });

        expect(result).toBe(true);
    });

    it('should return false when observers and sqls have different lengths', () => {
        const observers: Observer[] = [
            {
                observer_id: '1',
                sql_url: '',
                row_restrictions: [],
                field_restrictions: [],
                cron_expression: '',
            },
            {
                observer_id: '2',
                sql_url: '',
                row_restrictions: [],
                field_restrictions: [],
                cron_expression: '',
            },
        ];
        const sqls = [
            { observerId: '1', sql: 'SELECT * FROM table1' },
            { observerId: '2', sql: 'SELECT * FROM table2' },
            { observerId: '3', sql: 'SELECT * FROM table3' },
        ];

        const result = checkObserverSync({ observers, sqls });

        expect(result).toBe(false);
    });

    it('should return false when an observer does not have a corresponding sql', () => {
        const observers: Observer[] = [
            {
                observer_id: '1',
                sql_url: '',
                row_restrictions: [],
                field_restrictions: [],
                cron_expression: '',
            },
            {
                observer_id: '2',
                sql_url: '',
                row_restrictions: [],
                field_restrictions: [],
                cron_expression: '',
            },
            {
                observer_id: '3',
                sql_url: '',
                row_restrictions: [],
                field_restrictions: [],
                cron_expression: '',
            },
        ];
        const sqls = [
            { observerId: '1', sql: 'SELECT * FROM table1' },
            { observerId: '3', sql: 'SELECT * FROM table3' },
        ];

        const result = checkObserverSync({ observers, sqls });

        expect(result).toBe(false);
    });

    it('should return true when all observers have corresponding sqls', () => {
        const observers: Observer[] = [
            {
                observer_id: '1',
                sql_url: '',
                row_restrictions: [],
                field_restrictions: [],
                cron_expression: '',
            },
            {
                observer_id: '2',
                sql_url: '',
                row_restrictions: [],
                field_restrictions: [],
                cron_expression: '',
            },
            {
                observer_id: '3',
                sql_url: '',
                row_restrictions: [],
                field_restrictions: [],
                cron_expression: '',
            },
        ];
        const sqls = [
            { observerId: '1', sql: 'SELECT * FROM table1' },
            { observerId: '2', sql: 'SELECT * FROM table2' },
            { observerId: '3', sql: 'SELECT * FROM table3' },
        ];

        const result = checkObserverSync({ observers, sqls });

        expect(result).toBe(true);
    });
});
