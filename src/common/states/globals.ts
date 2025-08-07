import { CronJob } from 'cron';
import { IObserverJobContext } from '../interfaces/observer-job-context';
import { IGlobals } from '../interfaces/globals';

export let globals: IGlobals = {
    last_api_req_time: 0,
    keycloak_token: '',
    observer_cron_jobs: [],
    is_auth_firebase: false,
};
