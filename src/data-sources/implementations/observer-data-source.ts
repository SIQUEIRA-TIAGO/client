import { Observer } from '@/entities/observer';
import { IObserverDataSource } from '@interfaces/observer-data-source';
import path from 'path';
import { axiosApiConnector } from '../connectors/axios-api-connector';
import { IErrors } from '@/common/interfaces/errors';
import { logger } from '@/logger';

export const observerDataSourceImpl: IObserverDataSource = ({
    fileSystemDataSource,
}) => {
    try {
        return {
            getRemoteObservers: async () => {
                try {
                    let result = await axiosApiConnector.get<{payload: Observer[]}>(
                        'client/observer/get-all'
                    );
                    return result.data.payload;
                } catch (error) {
                    
                    throw {
                        origin: 'api',
                        message: 'Error while getting remote observers',
                        originalError: error,
                    } as IErrors;
                }
            },
            getLocalObservers: async () => {
                try {
                    const observers = await fileSystemDataSource.getJson<
                        Observer[]
                    >({
                        where: path.join(
                            process.cwd(),
                            '../remoteData/observers.json'
                        ),
                    });
                    if (!observers?.length) {
                        return [];
                    }
                    return observers;
                } catch (error) {
                    throw {
                        message: 'Error reading observers.json',
                        origin: 'fs',
                    } as IErrors;
                }
            },
        };
    } catch (error) {
        throw error;
    }
};
