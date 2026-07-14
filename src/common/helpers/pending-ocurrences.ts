import fs from 'fs-extra';
import path from 'path';
import { Ocurrence } from '@/entities/ocurrence';
import { OcurrenceData } from '@/entities/ocurrence-data';
import { ocurrenceDataSourceImpl } from '@/data-sources/implementations/occurence-data-source';
import { logger } from '@/logger';

type PendingOcurrence = Omit<Ocurrence, 'creation_date' | 'preview_message'> & {
    ocurrenceJson: OcurrenceData;
};

const PENDING_DIR = path.join(process.cwd(), 'remoteData', 'pending-ocurrences');

/**
 * Fila em disco para ocorrências que falharam ao ser enviadas: nada é
 * perdido por queda de rede/API — o reenvio acontece em background até
 * o servidor aceitar.
 */
export const savePendingOcurrence = async (
    ocurrence: PendingOcurrence
): Promise<void> => {
    await fs.outputFile(
        path.join(PENDING_DIR, `${ocurrence.ocurrence_id}.json`),
        JSON.stringify(ocurrence),
        { encoding: 'utf-8' }
    );
};

export const resendPendingOcurrences = async (): Promise<void> => {
    let files: string[] = [];
    try {
        files = await fs.readdir(PENDING_DIR);
    } catch {
        return; // diretório ainda não existe = nada pendente
    }

    for (const file of files.filter((f) => f.endsWith('.json'))) {
        const filePath = path.join(PENDING_DIR, file);
        try {
            const ocurrence = (await fs.readJson(filePath)) as PendingOcurrence;
            await ocurrenceDataSourceImpl().postOcurrence(ocurrence);
            await fs.remove(filePath);
            logger.info(`Pending ocurrence ${file} resent successfully`);
        } catch (error) {
            logger.error(`Failed to resend pending ocurrence ${file}: ${error}`);
        }
    }
};
