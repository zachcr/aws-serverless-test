import { RequestContext } from '../../../DDD_framework/infrastructure/foundation/RequestContext';

import { returnResponse } from './return';
import { GetWeather } from '../../../domain/service';
import { WeatherRepo } from '../../persistence';
import { WeatherMapper } from '../../mapper';

export const handler = async (params: { zipCode: string; ctx?: RequestContext }) => {
    const { zipCode } = params;
    if (!params.ctx) {
        // To support OpenTracer, exp: Jaeger
        params.ctx = new RequestContext({
            requestId: null,
            traceIds: [],
        });
    }

    const getWeather = new GetWeather(new WeatherRepo());
    const weather = await getWeather.execute(params.ctx, { zipCode });
    const dto = WeatherMapper.sharedInstance.toDTO(weather);

    return returnResponse(dto);
};
