import { CronExpressionParser } from 'cron-parser';

export interface ScheduleCheck {
    due: boolean;
    scheduledAt: Date | null;
    error: string | null;
}

/**
 * Decide se um observer deve executar comparando por janela, e não por
 * instante exato: verifica se existe uma ocorrência do cron entre a última
 * execução e agora. Isso torna o agendamento imune a atrasos de tick
 * (segundos/minutos) e recupera execuções perdidas durante downtime
 * (no máximo uma execução de catch-up, nunca backfill de todas as janelas).
 */
export const checkObserverDue = ({
    cronExpression,
    lastRun,
    now,
    timezone,
}: {
    cronExpression: string;
    lastRun: Date;
    now: Date;
    timezone?: string;
}): ScheduleCheck => {
    try {
        const interval = CronExpressionParser.parse(cronExpression, {
            currentDate: lastRun,
            tz: timezone,
        });
        const scheduledAt = interval.next().toDate();
        return {
            due: scheduledAt.getTime() <= now.getTime(),
            scheduledAt,
            error: null,
        };
    } catch (error) {
        return {
            due: false,
            scheduledAt: null,
            error: String(error),
        };
    }
};

export const getNextRun = (
    cronExpression: string,
    from: Date,
    timezone?: string
): Date | null => {
    try {
        return CronExpressionParser.parse(cronExpression, {
            currentDate: from,
            tz: timezone,
        })
            .next()
            .toDate();
    } catch {
        return null;
    }
};
