import { scheduleWeatherSyncup as scheduleWeatherSyncupEvent } from '../../../domain/model/weather/events';
import { RequestContext } from '../../../DDD_framework/infrastructure';

import { WeatherRepo } from '../../persistence';
import { UpsertWeatherInput, UpsertWeather } from '../../../domain/service';
import { OneWeatherClient } from '../../client';

const ZipCodes = process.env.ZIP_CODES.split(',');

export async function syncupWeather(
    ctx: RequestContext,
    event: scheduleWeatherSyncupEvent,
): Promise<void> {
    for (const zipCode of ZipCodes) {
        const weatherData = await OneWeatherClient.sharedInstance.getWeather(ctx, zipCode);
        const upsertWeather = new UpsertWeather(new WeatherRepo());
        const params: UpsertWeatherInput = {
            zip: zipCode,
            name: weatherData.name,
            country: weatherData.country,
            timezone: weatherData.timezone,
            crood: {
                lon: weatherData?.coord?.lon,
                lat: weatherData?.coord?.lat,
            },
            content: {
                id: weatherData?.weather?.id,
                general: weatherData?.weather?.main,
                description: weatherData?.weather?.description,
                icon: weatherData?.weather?.icon,
            },
            information: {
                temp: weatherData?.main?.temp,
                feelsLike: weatherData?.main?.feels_like,
                tempMin: weatherData?.main?.temp_min,
                tempMax: weatherData?.main?.temp_max,
                pressure: weatherData?.main?.pressure,
                humidity: weatherData?.main?.humidity,
                clouds: weatherData?.main?.clouds,
                dt: weatherData?.main?.dt,
                windDeg: 0,
                windSpeed: 100,
                visibility: 0,
            },
        };
        await upsertWeather.execute(ctx, params);
    }
    return;
}
