import fs from 'fs-extra';
import path from 'path';
import { logger } from '@/logger';

const FILE = path.join(process.cwd(), 'remoteData', 'last-runs.json');

let cache: Map<string, Date> | null = null;

/**
 * Guarda a última execução de cada observer em disco para que restarts do
 * serviço não percam o ponto de referência do agendamento (catch-up).
 */
export const lastRunStore = {
    load: async (): Promise<Map<string, Date>> => {
        if (cache) return cache;
        cache = new Map();
        try {
            const raw = (await fs.readJson(FILE)) as Record<string, string>;
            for (const [observerId, iso] of Object.entries(raw)) {
                const date = new Date(iso);
                if (!isNaN(date.getTime())) {
                    cache.set(observerId, date);
                }
            }
        } catch (error: any) {
            if (error?.code !== 'ENOENT') {
                logger.error(`Error reading last-runs.json, starting fresh: ${error}`);
            }
        }
        return cache;
    },
    prune: (validObserverIds: string[]): void => {
        if (!cache) return;
        const valid = new Set(validObserverIds);
        for (const observerId of [...cache.keys()]) {
            if (!valid.has(observerId)) {
                cache.delete(observerId);
            }
        }
    },
    persist: async (): Promise<void> => {
        if (!cache) return;
        const serialized: Record<string, string> = {};
        for (const [observerId, date] of cache) {
            serialized[observerId] = date.toISOString();
        }
        const tmp = `${FILE}.tmp`;
        await fs.outputFile(tmp, JSON.stringify(serialized), { encoding: 'utf-8' });
        await fs.move(tmp, FILE, { overwrite: true });
    },
};
