import { IErrors } from '@/common/interfaces/errors';
import { axiosApiConnector } from '../connectors/axios-api-connector';
import { IOccurenceDataSource } from '../interfaces/ocurrence-data-source';
import { globals } from '@/common/states/globals';
import { logger } from '@/logger';

export const ocurrenceDataSourceImpl: IOccurenceDataSource = () => ({
    postOcurrence: async (ocurrence) => {
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
            logger.error(error)
            throw {
                origin: 'api',
                message: 'Error while sending ocurrence to api',
                originalError: error,
            } as IErrors;
        }
    },
});
