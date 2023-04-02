import { scheduleWeatherSyncup as scheduleWeatherSyncupEvent } from '../../../domain/model/weather/events';
import { RequestContext } from '../../../DDD_framework/infrastructure/foundation/RequestContext';
import { BullService } from '../../../DDD_framework/infrastructure/message/bull';

const JOBID = 'SCHEDULE_WEATHER_SYNCUP';

export async function scheduleWeatherSyncup(
    ctx: RequestContext,
    event: scheduleWeatherSyncupEvent,
): Promise<void> {
    const jobOptions = {
        // Hourly
        repeat: { cron: '0 * * * *', tz: 'Asia/Shanghai' },
        jobId: JOBID,
    };
    await BullService.sharedInstance.removeRepeatJob(scheduleWeatherSyncup.name, jobOptions, JOBID);
    await BullService.sharedInstance.repeat(ctx, scheduleWeatherSyncup.name, event, jobOptions);
    return;
}
