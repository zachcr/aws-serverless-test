import { logger } from './logger';
import { sleep } from './utils';
import { SystemService } from './foundation/SystemService';

const msWaitBeforeExit = Number.parseInt(process.env.WAIT_BEFORE_EXIT || '10000');

/**
 * The gracefulExit will follow the sequence of services array
 */
export function gracefulExit(services: SystemService[]) {
    process.on('SIGINT', handleExit);
    process.on('SIGTERM', handleExit);
    process.on('uncaughtException', handleExit);
    process.on('unhandledRejection', handleExit);

    async function handleExit(reason: string | Error) {
        if (reason instanceof Error) {
            logger.error(`Uncaught Exception at: ${reason.stack || reason}`);
        }

        console.log(`process will exit after ${msWaitBeforeExit}ms, receive:`, reason);
        await sleep(msWaitBeforeExit);

        try {
            console.log('Graceful exit, received: ', reason);
            console.time('Graceful Exit time');
            for (const service of services) {
                console.log(`Exiting ${service.name} ...`);
                await service.stop();
                console.log(`${service.name} exited`);
            }
            console.timeEnd('Graceful Exit time');
            process.exit(0);
        } catch (e) {
            console.log('Graceful exit error', e);
            process.exit(1);
        }
    }
}
