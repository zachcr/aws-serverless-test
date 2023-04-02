import got from 'got';
import { logger, RequestContext } from '../../DDD_framework/infrastructure';
import { ExternalInterceptor } from '../../DDD_framework/infrastructure/interceptor/interceptor';

export enum RequestMethod {
    GET,
    POST,
    PUT,
    DELETE,
}

export interface WeatherResponse {
    name?: string;
    zip: string;
    country?: string;
    timezone?: number;
    coord?: {
        lon: string;
        lat: string;
    };
    main: {
        temp: number;
        feels_like: number;
        temp_min: number;
        temp_max: number;
        pressure: number;
        humidity: number;
        clouds: number;
        dt: number;
    };
    weather: {
        id: number;
        main: string;
        description: string;
        icon: string;
    };
}

export class OneWeatherClient {
    private static instance: OneWeatherClient;
    private readonly url: string;
    private readonly apiKey: string;

    private constructor(url: string, apiKey: string) {
        this.url = url;
        this.apiKey = apiKey;
    }

    public static get sharedInstance(): OneWeatherClient {
        const ONE_WEATHER_URL = process.env.ONE_WEATHER_URL;
        const API_KEY = process.env.API_KEY;
        if (!ONE_WEATHER_URL) throw Error('ONE_WEATHER_URL is not exits');
        if (!OneWeatherClient.instance) {
            OneWeatherClient.instance = new OneWeatherClient(ONE_WEATHER_URL, API_KEY);
        }

        return OneWeatherClient.instance;
    }

    @ExternalInterceptor
    async getWeather(ctx: RequestContext, zipCode: string): Promise<WeatherResponse> {
        try {
            const result = await this.request(
                ctx,
                RequestMethod.GET,
                `weather?zip=${zipCode},au&appid=${this.apiKey}`,
                null,
            );
            return result as WeatherResponse;
        } catch (error) {
            logger.error(error.stack);
            return null;
        }
    }

    private async request(
        ctx: RequestContext,
        method: RequestMethod,
        path: string,
        body: Record<string, any>,
    ) {
        const request = got.extend({
            prefixUrl: this.url,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        try {
            let response;
            if (method === RequestMethod.GET) {
                response = await request.get(path).json();
            } else if (method === RequestMethod.POST) {
                response = await request
                    .post(path, {
                        json: body,
                    })
                    .json();
            } else if (method === RequestMethod.PUT) {
                response = await request.put(path, { json: body }).json();
            } else if (method === RequestMethod.DELETE) {
                response = await request.delete(path, { json: body }).json();
            }
            return response as Record<string, any>;
        } catch (error) {
            logger.error(`Call BPIT-API Error: ${error.message}`, ctx?.requestId?.value);
            return null;
        }
    }
}
