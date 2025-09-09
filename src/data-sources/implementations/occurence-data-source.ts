import { IErrors } from '@/common/interfaces/errors';
import { axiosApiConnector } from '../connectors/axios-api-connector';
import { IOccurenceDataSource } from '../interfaces/ocurrence-data-source';
import { globals } from '@/common/states/globals';

export const ocurrenceDataSourceImpl: IOccurenceDataSource = () => ({
    postOcurrence: async (ocurrence) => {
        try {
            const result = await axiosApiConnector({
                method: 'post',
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
            console.dir(error, { depth: 0 })
            throw {
                origin: 'api',
                message: 'Error while sending ocurrence to api',
                originalError: error,
            } as IErrors;
        }
    },
});
