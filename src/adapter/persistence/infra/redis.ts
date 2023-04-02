import { Redis } from '../../../DDD_framework/infrastructure/database/redis';

if (!process.env.REDIS_URL) {
    throw new Error('REDIS_URL is required');
}

export class WeatherRedis extends Redis {
    private static instance: WeatherRedis;

    private constructor(url?: string) {
        super(url);
    }

    static get sharedInstance(): WeatherRedis {
        if (!WeatherRedis.instance) {
            WeatherRedis.instance = new WeatherRedis(process.env.REDIS_URL);
        }
        return WeatherRedis.instance;
    }

    async start(): Promise<void> {
        if (!WeatherRedis.instance) {
            WeatherRedis.instance = new WeatherRedis();
        }
    }
}
