import { IErrors } from '@/common/interfaces/errors';
import { axiosApiConnector } from '../connectors/axios-api-connector';
import { IOccurenceDataSource } from '../interfaces/ocurrence-data-source';
import { logger } from '@/logger';

const MAX_ATTEMPTS = 3;

export const ocurrenceDataSourceImpl: IOccurenceDataSource = () => ({
    postOcurrence: async (ocurrence) => {
        let lastError: unknown;

        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                const result = await axiosApiConnector({
                    method: 'post',
                    url: `occurrence`,
                    data: {
                        client_id: ocurrence.client_id,
                        observer_id: ocurrence.observer_id,
                        ocurrence_url: ocurrence.ocurrence_url,
                        ocurrence_id: ocurrence.ocurrence_id,
                        ocurrenceJson: ocurrence.ocurrenceJson,
                        is_recovery: ocurrence.is_recovery
                    },
                });

                return result.data.payload;
            } catch (error) {
                lastError = error;
                logger.error(`Error sending ocurrence ${ocurrence.ocurrence_id} (attempt ${attempt}/${MAX_ATTEMPTS}): ${error}`);
                if (attempt < MAX_ATTEMPTS) {
                    await new Promise((resolve) => setTimeout(resolve, attempt * 2_000));
                }
            }
        }

        throw {
            origin: 'api',
            message: 'Error while sending ocurrence to api',
            originalError: lastError,
        } as IErrors;
    },
});
