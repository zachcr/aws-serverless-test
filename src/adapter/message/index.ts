import { v4 as uuidv4 } from 'uuid';

import { RequestContext } from '../../DDD_framework/infrastructure';
import { BullSubscribeCtx } from '../../DDD_framework/infrastructure/message/bull';
import { scheduleWeatherSyncup as scheduleWeatherSyncupEvent } from '../../domain/model/weather/events';

import { syncupWeather } from './handlers';
import { scheduleWeatherSyncup } from './schedulers';

import { DomainEvent } from '../../DDD_framework/domain';

export const bullEventSubscribeCtxs: BullSubscribeCtx<DomainEvent>[] = [
    {
        topic: scheduleWeatherSyncup.name,
        handler: syncupWeather,
        eventClass: scheduleWeatherSyncupEvent,
    },
];

export async function init() {
    // Initialize Cronjob Hourly Syncup from BullMQ
    await scheduleWeatherSyncup(
        RequestContext.create({
            requestId: { key: process.env.REQUEST_ID_KEY, value: uuidv4() },
            traceIds: [
                {
                    key: process.env.TRACING_ID_KEY,
                    value: uuidv4(),
                },
            ],
        }),
        new scheduleWeatherSyncupEvent(),
    );
}
