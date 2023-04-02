import { RequestContext } from '../../../DDD_framework/infrastructure';
import { RepoInterceptor } from '../../../DDD_framework/infrastructure/interceptor/interceptor';
import { Weather, WeatherRepository } from '../../../domain/model';
import WeatherCollection, { WeatherDocument } from './schema';
import { WeatherRedis } from '../infra';
import { WeatherMapper } from '../../mapper';

const CacheKey = 'WeatherCache:Hourly';

export class WeatherRepo implements WeatherRepository<RequestContext> {
    @RepoInterceptor
    async getByZipCode(ctx: RequestContext, zipCode: string): Promise<Weather> {
        if (!zipCode) {
            return null;
        }

        let result: WeatherDocument = await WeatherRedis.sharedInstance.client.hget(
            CacheKey,
            zipCode,
        );
        if (!result) {
            result = await WeatherCollection.findOne({
                zip: zipCode,
            }).lean();
            await WeatherRedis.sharedInstance.client.hset(CacheKey, zipCode, result);
        }

        return WeatherMapper.sharedInstance.toDomainModel(result);
    }

    @RepoInterceptor
    async upsert(ctx: RequestContext, weather: Weather): Promise<boolean> {
        const DPO = WeatherMapper.sharedInstance.toDPO(weather);
        const result = await WeatherCollection.findOneAndUpdate(
            {
                zip: weather.zip,
            },
            { $set: DPO },
            {
                upsert: true,
                new: true,
            },
        ).lean();
        await WeatherRedis.sharedInstance.client.hset(CacheKey, weather.zip, result);

        return !!result;
    }
}
