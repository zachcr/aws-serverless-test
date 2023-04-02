import Bull from 'bull';
import {
    Queue as BullQueue,
    QueueOptions as BullQueueOptions,
    Job as BullJob,
    JobId as BullJobId,
    JobOptions as BullJobOptions,
    RateLimiter,
    CronRepeatOptions,
    EveryRepeatOptions,
} from 'bull';
import { SystemService } from '../foundation/SystemService';
import { RequestContext, RequestContextDTO } from '../foundation/RequestContext';
import {
    MessageEventInterceptor,
    EventInterceptor,
    EVENTTYPE,
} from '../interceptor/eventInterceptor';
import { DomainEvent } from '../../domain';
import { logger } from '../../infrastructure';

export interface ProcessOptions {
    concurrency?: number;
}

export interface RepeatOptions {
    repeat: CronRepeatOptions | EveryRepeatOptions;
    jobId?: string;
}

export type BullHandler<T> = (ctx: RequestContext, event: T) => void | Promise<void>;

export interface BullSubscribeCtx<T extends DomainEvent> {
    topic: string;
    handler: BullHandler<T>;
    eventClass: new (...args: any[]) => T;
    limiter?: RateLimiter;
}

type BullData<T> = {
    context: RequestContext;
    data: T;
};

export class BullService implements SystemService {
    name: string = BullService.name;
    private readonly redisUrl: string;
    private readonly bullQueueMaps: Map<string, BullQueue>;
    private static instance: BullService;
    private static defaultQueueOptions: BullQueueOptions = {
        defaultJobOptions: {
            removeOnComplete: {
                age: +process.env.BULL_REMOVE_ON_COMPLETE || 7 * 24 * 60 * 60,
            },
            removeOnFail: {
                age: +process.env.BULL_REMOVE_ON_FAIL || 30 * 24 * 60 * 60,
            },
        },
    };

    constructor() {
        if (!process.env.REDIS_URL) {
            logger.info('[Bull], REDIS_URL is required');
            throw new Error('[Bull], REDIS_URL is required');
        }
        // bull doesn't support simple redis url without the protocol prefix, such as 'localhost:6379'
        if (!/^redis(s|-sentinel|-socket)?:\/\//.test(process.env.REDIS_URL)) {
            this.redisUrl = `redis://${process.env.REDIS_URL}`;
        } else {
            this.redisUrl = process.env.REDIS_URL;
        }
        const redisUrlRegex =
            /^(redis(s|-sentinel|-socket)?:\/\/)(((.+)?:)?(.+)@)?([a-zA-Z0-9-\.]+)(:\d+)?$/;
        if (!redisUrlRegex.test(this.redisUrl)) {
            logger.error('[Bull], REDIS_URL is invalid');
            throw new Error('[Bull], REDIS_URL is invalid');
        }
        this.bullQueueMaps = new Map<string, BullQueue>();
    }

    static get sharedInstance(): BullService {
        if (!BullService.instance) {
            BullService.instance = new BullService();
        }
        return BullService.instance;
    }

    private _addEvents(queue: BullQueue) {
        if (!queue) {
            return;
        }
        queue.on('active', (job: BullJob) => {
            logger.info(`[Bull], job is active, queue: ${queue.name}, jobId: ${job.id}`);
        });
        queue.on('stalled', (job: BullJob) => {
            logger.info(`[Bull], job is stalled, queue: ${queue.name}, jobId: ${job.id}`);
        });
        queue.on('error', (error: Error) => {
            logger.error(`[Bull], error occurred, queue: ${queue.name}, error: ${error.stack}`);
        });
        queue.on('waiting', (jobId: string) => {
            logger.info(`[Bull], job is waiting, queue: ${queue.name}, jobId: ${jobId}`);
        });
        queue.on('failed', (job: BullJob, error: Error) => {
            logger.error(
                `[Bull], job failed, queue: ${queue.name}, jobId: ${job.id}, error: ${error.stack}`,
            );
        });
        queue.on('paused', () => {
            logger.info(`[Bull], queue paused, queue: ${queue.name}`);
        });
        queue.on('resumed', () => {
            logger.info(`[Bull], queue resumed, queue: ${queue.name}`);
        });
        queue.on('removed', (job: BullJob) => {
            logger.info(`[Bull], job removed, queue: ${queue.name} jobId: ${job.id}`);
        });
        queue.on('cleaned', (jobs: BullJob[], type: string) => {
            logger.info(
                `[Bull], jobs cleaned, queue: ${queue.name}, type=${type}, jobIds: ${jobs.map(
                    (job) => job.id,
                )}`,
            );
        });
    }

    private _getQueue(name: string, limiter?: RateLimiter): BullQueue {
        if (this.bullQueueMaps.get(name)) {
            return this.bullQueueMaps.get(name);
        }
        const queueOptions = {
            ...BullService.defaultQueueOptions,
        };
        if (limiter) {
            queueOptions.limiter = limiter;
        }
        const queue = new Bull(name, this.redisUrl, queueOptions);
        this._addEvents(queue);
        this.bullQueueMaps.set(name, queue);
        return this.bullQueueMaps.get(name);
    }

    private static generateQueueName(name: string) {
        return `${name}.${process.env.NODE_ENV}`;
    }

    private static toBullData<T>(context: RequestContext, data: T): BullData<T> {
        return { context, data };
    }

    async schedule<T>(
        context: RequestContext,
        name: string,
        data: T,
        delayAt: string,
        jobId?: string,
    ): Promise<void> {
        const delayAtStamp = Date.parse(delayAt);
        if (isNaN(delayAtStamp)) {
            return;
        }
        const queue = this._getQueue(BullService.generateQueueName(name));
        const jobOptions: BullJobOptions = {
            delay: delayAtStamp - Date.now(),
        };
        if (jobId) {
            jobOptions.jobId = jobId;
        }
        await queue.add(BullService.toBullData<T>(context, data), jobOptions);
        logger.info(`[Bull], add job successfully, queue: ${name}, delay: ${jobOptions.delay}`);
    }

    async getJob<T>(name: string, jobId: BullJobId): Promise<BullJob<T>> {
        const queue = this._getQueue(BullService.generateQueueName(name));
        const job: BullJob<T> = await queue.getJob(jobId);
        return job;
    }

    async send<T>(context: RequestContext, name: string, data: T, jobId?: string): Promise<void> {
        const queue = this._getQueue(BullService.generateQueueName(name));
        const jobOptions: BullJobOptions = {};
        if (jobId) {
            jobOptions.jobId = jobId;
        }
        await queue.add(BullService.toBullData<T>(context, data), jobOptions);
        logger.info(`[Bull], add job successfully, queue: ${name}`);
    }

    async sendBulk<T>(
        context: RequestContext,
        name: string,
        jobs: Array<{ data: T; jobId?: string }>,
    ): Promise<void> {
        const queue = this._getQueue(BullService.generateQueueName(name));
        await queue.addBulk(
            jobs?.map((job) => {
                const jobOptions: BullJobOptions = {};
                if (job.jobId) {
                    jobOptions.jobId = job.jobId;
                }
                return {
                    data: BullService.toBullData<T>(context, job.data),
                    opts: jobOptions,
                };
            }),
        );
        logger.info(`[Bull], add jobs successfully, queue: ${name}`);
    }

    async repeat<T>(
        context: RequestContext,
        name: string,
        data: T,
        repeatOptions: RepeatOptions,
    ): Promise<string> {
        if (
            (!('cron' in repeatOptions.repeat) && !('every' in repeatOptions.repeat)) ||
            ('cron' in repeatOptions.repeat && !repeatOptions.repeat?.cron) ||
            ('every' in repeatOptions.repeat && !repeatOptions.repeat?.every)
        ) {
            return;
        }
        const queue = this._getQueue(BullService.generateQueueName(name));
        const job = await queue.add(BullService.toBullData<T>(context, data), repeatOptions);
        // @ts-ignore https://github.com/OptimalBits/bull/blob/develop/REFERENCE.md#queueremoverepeatablebykey
        const jobKey: string = job?.opts?.repeat?.key;
        if (!jobKey) {
            throw new Error(`[Bull], add repeat job failed, ${JSON.stringify(repeatOptions)}`);
        }
        return jobKey;
    }

    async removeRepeatJobByKey(name: string, key: string): Promise<void> {
        const queue = this._getQueue(BullService.generateQueueName(name));
        await queue.removeRepeatableByKey(key);
    }

    async removeRepeatJob(
        name: string,
        bullJobOptions: BullJobOptions,
        jobId?: string,
    ): Promise<void> {
        if (!bullJobOptions.repeat) {
            logger.info(
                `[Bull], no repeat option, can not remove job, queue: ${name}, jobId=${jobId}`,
            );
            return;
        }
        const queue = this._getQueue(BullService.generateQueueName(name));
        let repeat: (CronRepeatOptions | EveryRepeatOptions) & { jobId?: BullJobId };
        if ('every' in bullJobOptions.repeat) {
            repeat = {
                every: bullJobOptions.repeat.every,
                jobId: jobId,
            };
        } else if ('cron' in bullJobOptions.repeat) {
            repeat = {
                cron: bullJobOptions.repeat.cron,
                jobId: jobId,
            };
            if (bullJobOptions.repeat.startDate) {
                repeat.startDate = bullJobOptions.repeat.startDate;
            }
        }
        if ('every' in bullJobOptions.repeat || 'cron' in bullJobOptions.repeat) {
            if (bullJobOptions.repeat.endDate) {
                repeat.endDate = bullJobOptions.repeat.endDate;
            }
            if (bullJobOptions.repeat.limit) {
                repeat.limit = bullJobOptions.repeat.limit;
            }
            if (bullJobOptions.repeat.tz) {
                repeat.tz = bullJobOptions.repeat.tz;
            }
        }
        if (jobId) {
            repeat.jobId = jobId;
        }
        await queue.removeRepeatable(repeat);
    }

    async process(
        subscribe: BullSubscribeCtx<DomainEvent>,
        options?: ProcessOptions,
    ): Promise<void> {
        const { handler, eventClass, topic, limiter } = subscribe;
        const queue = this._getQueue(BullService.generateQueueName(topic), limiter);
        const isPaused = await queue.isPaused();
        if (isPaused) {
            await queue.resume();
        }
        const pausedJobs = await queue.getJobs(['paused']);
        logger.info(`[Bull], queue: ${queue.name} paused jobs ${pausedJobs.length}`);
        const callback = async (job: BullJob) => {
            logger.info(`[Bull], start to process job: ${job.id}`);
            if (!job.data) {
                await job.remove();
            }
            const { data } = job.data;
            const context = RequestContext.create(job.data?.context);

            const interceptor: EventInterceptor = new MessageEventInterceptor(
                this.constructor.name,
                queue.name,
                EVENTTYPE.BULL_EVENT_HANDLE,
            );

            const ctx: RequestContext = context
                ? interceptor.handleEventBefore(context.traceIds, context.requestId.value, data)
                : null;
            const event = new eventClass({ ...data, bullJobOptions: job.opts });
            let error: Error;
            try {
                await handler(ctx, event);
            } catch (err) {
                error = err;
                await job.moveToFailed(err);
            }
            interceptor.handleEventAfter(error, event.properties);
        };
        try {
            if (options && options.concurrency > 0) {
                logger.info(
                    `[Bull], bind callback, name: ${queue.name}, currency: ${options.concurrency}`,
                );
                await queue.process(options.concurrency, callback);
            } else {
                logger.info(`[Bull], bind callback, name: ${queue.name}`);
                await queue.process(callback);
            }
        } catch (error) {
            logger.error(`[Bull], bind callback error, name: ${queue.name}, error: ${error.stack}`);
        }
    }

    async start(subscribes: BullSubscribeCtx<DomainEvent>[]): Promise<void> {
        for (const subscribe of subscribes) {
            this.process(subscribe);
        }
    }

    async stop(): Promise<void> {
        if (this.bullQueueMaps.size === 0) {
            return;
        }
        for (const [queueName, queue] of this.bullQueueMaps) {
            if (queue) {
                logger.info(`[Bull], stop ${queueName}`);
                // only can pause current worker, so will no effect on other workers
                await queue.pause(true);
                // https://github.com/OptimalBits/bull/blob/develop/REFERENCE.md#queueclose
                await queue.close();
            }
        }
    }
}
