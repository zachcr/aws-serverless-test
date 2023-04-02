import IORedis from 'ioredis';

import { RequestContext } from '../foundation/RequestContext';
import { DomainEvent } from '../../domain';

export type MQHandler<T> = (ctx: RequestContext, event: T) => void | Promise<void>;

export interface MQSubscribeCtx<T extends DomainEvent> {
    topic: string;
    tags?: string;
    retryTimes?: number;
    handler: MQHandler<T>;
    eventClass: new (...args: any[]) => T;

    /* Idempotent Config */
    forbidDuplicate?: boolean;
    cacheInstance?: IORedis.Redis | IORedis.Cluster; // If allowDuplicate=false should input a cacheClient instance
}
