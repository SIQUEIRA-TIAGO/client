import { init } from "@/main";
import { globals } from "../states/globals";
import { IErrors } from "../interfaces/errors";
import { logger } from "@/logger";

export const downloadObservers = async () => {
    try {
        logger.info(
            'Checking for new data on remote server'.bgBlue.black
        );
        const newJobs = await init();
        logger.info('Sync finished successfully'.bgBlue.black);
        if (globals.observer_cron_jobs?.length > 0) {
            logger.info('Stopping running observer jobs'.bgBlue.black);
            globals.observer_cron_jobs?.forEach((job) => job.stop());
            logger.info('Observer jobs stopped'.bgBlue.black);
        } else {
            logger.info('No observer jobs running'.bgBlue.black);
        }
        logger.info('Starting observer jobs'.bgBlue.black);
        globals.observer_cron_jobs = newJobs;
        globals.observer_cron_jobs?.forEach((job) => job.start());
        logger.info('Observer jobs started successfully'.bgBlue.black);
    } catch (error: object | any) {
        if (!('origin' in error)) return logger.info(error);
        let internalError = error as IErrors;
        if (internalError.origin === 'api') {
            logger.info('Error on api request'.bgRed.black);
        }
    }
}