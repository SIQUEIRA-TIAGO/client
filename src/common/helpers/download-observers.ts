import { init } from "@/main";
import { globals } from "../states/globals";
import { IErrors } from "../interfaces/errors";
import { logger } from "@/logger";
import { CronJob } from "cron";
import { IObserverJobContext } from "../interfaces/observer-job-context";

const stopRunningObserverJobs = () => {
    if (globals.observer_cron_jobs?.length > 0) {
        logger.info('Stopping observer jobs'.bgBlue.black);
        globals.observer_cron_jobs.forEach((job) => job.stop());
        logger.info('Observer jobs stopped'.bgGreen.black);
    } else {
        logger.info('No observer jobs running'.bgBlue.black);
    }
};

const startNewObserverJobs = (newJobs: CronJob<null, IObserverJobContext>[]) => {
    logger.info('Starting observer jobs'.bgBlue.black);
    globals.observer_cron_jobs = newJobs;
    globals.observer_cron_jobs.forEach((job) => job.start());
    logger.info('Observer jobs started successfully'.bgGreen.black);
};

export const downloadObservers = async () => {
    try {
        stopRunningObserverJobs()

        logger.info('Checking for new data on remote server'.bgBlue.black);
        const newJobs = await init();
        logger.info('Sync finished successfully'.bgGreen.black);

        startNewObserverJobs(newJobs)
    } catch (error: object | any) {
        if (!('origin' in error)) return logger.info(error);

        const internalError = error as IErrors;
        if (internalError.origin === 'api') {
            logger.error('Error on api request'.bgRed.black);
        }
    }
}