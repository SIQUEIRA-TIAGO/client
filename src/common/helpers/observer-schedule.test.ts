import { checkObserverDue, getNextRun } from './observer-schedule';

describe('checkObserverDue', () => {
    it('should be due when the tick fires seconds after the scheduled minute', () => {
        // Cenário real do bug: tick atrasado 5s não pode perder a execução
        const result = checkObserverDue({
            cronExpression: '30 14 * * *',
            lastRun: new Date('2026-07-14T14:00:00'),
            now: new Date('2026-07-14T14:30:05'),
        });

        expect(result.due).toBe(true);
        expect(result.scheduledAt).toEqual(new Date('2026-07-14T14:30:00'));
    });

    it('should be due for observers scheduled after minute 30', () => {
        const result = checkObserverDue({
            cronExpression: '45 * * * *',
            lastRun: new Date('2026-07-14T14:40:00'),
            now: new Date('2026-07-14T14:45:10'),
        });

        expect(result.due).toBe(true);
    });

    it('should not be due before the scheduled time', () => {
        const result = checkObserverDue({
            cronExpression: '30 14 * * *',
            lastRun: new Date('2026-07-14T14:00:00'),
            now: new Date('2026-07-14T14:29:59'),
        });

        expect(result.due).toBe(false);
        expect(result.scheduledAt).toEqual(new Date('2026-07-14T14:30:00'));
    });

    it('should not be due again right after running', () => {
        const result = checkObserverDue({
            cronExpression: '*/15 * * * *',
            lastRun: new Date('2026-07-14T14:30:02'),
            now: new Date('2026-07-14T14:31:00'),
        });

        expect(result.due).toBe(false);
        expect(result.scheduledAt).toEqual(new Date('2026-07-14T14:45:00'));
    });

    it('should catch up a single missed run after downtime', () => {
        // 2h fora do ar com cron a cada 15min: fica due (uma execução),
        // e o scheduledAt é a primeira janela perdida
        const result = checkObserverDue({
            cronExpression: '*/15 * * * *',
            lastRun: new Date('2026-07-14T12:00:01'),
            now: new Date('2026-07-14T14:03:00'),
        });

        expect(result.due).toBe(true);
        expect(result.scheduledAt).toEqual(new Date('2026-07-14T12:15:00'));
    });

    it('should respect the timezone when provided', () => {
        // 09:00 em São Paulo = 12:00 UTC
        const result = checkObserverDue({
            cronExpression: '0 9 * * *',
            lastRun: new Date('2026-07-14T10:00:00Z'),
            now: new Date('2026-07-14T12:00:30Z'),
            timezone: 'America/Sao_Paulo',
        });

        expect(result.due).toBe(true);
        expect(result.scheduledAt).toEqual(new Date('2026-07-14T12:00:00Z'));
    });

    it('should return an error for invalid cron expressions without throwing', () => {
        const result = checkObserverDue({
            cronExpression: 'not-a-cron',
            lastRun: new Date('2026-07-14T14:00:00'),
            now: new Date('2026-07-14T14:30:00'),
        });

        expect(result.due).toBe(false);
        expect(result.error).toBeTruthy();
    });
});

describe('getNextRun', () => {
    it('should return the next occurrence after the given date', () => {
        const next = getNextRun('45 8 * * *', new Date('2026-07-14T09:00:00'));

        expect(next).toEqual(new Date('2026-07-15T08:45:00'));
    });

    it('should return null for invalid expressions', () => {
        expect(getNextRun('invalid', new Date())).toBeNull();
    });
});
