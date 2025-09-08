import { CronJob } from 'cron';
import { IObserverJobContext } from './observer-job-context';

export interface IGlobals {

    last_api_req_time: number;
    access_token: string;
    observer_cron_jobs: CronJob<null, IObserverJobContext>[];
    is_auth_firebase: boolean;
}
