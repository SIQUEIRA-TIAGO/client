import { IErrors } from '@/common/interfaces/errors';
import { axiosApiConnector } from '../connectors/axios-api-connector';
import { IOccurenceDataSource } from '../interfaces/ocurrence-data-source';
import { globals } from '@/common/states/globals';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

export const ocurrenceDataSourceImpl: IOccurenceDataSource = () => ({
    postOcurrence: async (ocurrence) => {
        try {
        const result = await axios.post(
            `${process.env.CENTRAL_API_BASE_URL}/api/occurrence`,
            {
                client_id: ocurrence.client_id,
                observer_id: ocurrence.observer_id,
                ocurrence_url: ocurrence.ocurrence_url,
                ocurrence_id: ocurrence.ocurrence_id,
                ocurrenceJson: ocurrence.ocurrenceJson,
                is_recovery: ocurrence.is_recovery
            },
            {
                headers: {
                    Authorization: `Bearer ${globals.access_token}`,
                    'Content-Type': 'application/json',
                }
            }
        );

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
