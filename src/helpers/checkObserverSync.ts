import { Observer } from '@/entities/observer';

export const checkObserverSync = ({
    observers,
    sqls,
}: {
    observers: Observer[];
    sqls: { observerId: string; sql: string }[];
}): boolean => {
    if (observers.length !== sqls.length) {
        return false;
    }

    observers.map((observer) => {
        let sql = sqls.find((sql) => sql.observerId === observer?.cron_expression);
        if (!sql) {
            return false;
        }
    });

    return true;
};
