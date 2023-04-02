import { DomainService } from '../../../DDD_framework/domain';
import { RequestContext } from '../../../DDD_framework/infrastructure';
import { Weather, WeatherRepository } from '../../model';

export type GetWeatherInput = {
    zipCode: string;
};

export class GetWeather implements DomainService<GetWeatherInput, Weather, RequestContext> {
    private repo: WeatherRepository<RequestContext>;
    constructor(repo: WeatherRepository<RequestContext>) {
        this.repo = repo;
    }
    async execute(ctx: RequestContext, req: GetWeatherInput): Promise<Weather> {
        const weather = await this.repo.getByZipCode(ctx, req.zipCode);
        return weather;
    }
}
