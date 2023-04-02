import { DomainService } from '../../../DDD_framework/domain';
import { RequestContext } from '../../../DDD_framework/infrastructure';
import { Weather, WeatherRepository, WeatherParams } from '../../model';

export type UpsertWeatherInput = WeatherParams;

export class UpsertWeather implements DomainService<UpsertWeatherInput, boolean, RequestContext> {
    private repo: WeatherRepository<RequestContext>;
    constructor(repo: WeatherRepository<RequestContext>) {
        this.repo = repo;
    }
    async execute(ctx: RequestContext, params: UpsertWeatherInput): Promise<boolean> {
        const weather = Weather.create(params);
        const isUpsert = weather ? await this.repo.upsert(ctx, weather) : false;
        return isUpsert;
    }
}
