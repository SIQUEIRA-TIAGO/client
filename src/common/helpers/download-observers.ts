import { init } from "@/main";
import { globals } from "../states/globals";
import { IErrors } from "../interfaces/errors";

export const downloadObservers = async () => {
    try {
        console.log(
            'Checking for new data on remote server'.bgBlue.black
        );
        const newJobs = await init();
        console.log('Sync finished successfully'.bgBlue.black);
        if (globals.observer_cron_jobs?.length > 0) {
            console.log('Stopping running observer jobs'.bgBlue.black);
            globals.observer_cron_jobs?.forEach((job) => job.stop());
            console.log('Observer jobs stopped'.bgBlue.black);
        } else {
            console.log('No observer jobs running'.bgBlue.black);
        }
        console.log('Starting observer jobs'.bgBlue.black);
        globals.observer_cron_jobs = newJobs;
        globals.observer_cron_jobs?.forEach((job) => job.start());
        console.log('Observer jobs started successfully'.bgBlue.black);
    } catch (error: object | any) {
        if (!('origin' in error)) return console.log(error);
        let internalError = error as IErrors;
        if (internalError.origin === 'api') {
            console.log('Error on api request'.bgRed.black);
        }
    }
}