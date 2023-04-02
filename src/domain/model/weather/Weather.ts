import { Types } from 'mongoose';
import { AggregateRoot } from '../../../DDD_framework/domain';

import { Crood, CroodProperties } from './Crood';
import { Content, ContentProperties } from './Content';
import { Information, InformationProperties } from './Information';

export interface WeatherRepository<ContextType> {
    upsert(ctx: ContextType, weather: Weather): Promise<boolean>;
    getByZipCode(ctx: ContextType, zipCode: string): Promise<Weather>;
}

export interface ConditionProperties {
    name: string;
    zip: string;
    country: string;
    crood?: Crood;
    content?: Content;
    information?: Information;
    timezone?: number;
}

export interface WeatherParams
    extends Omit<ConditionProperties, 'crood' | 'content' | 'information'> {
    id?: string;
    crood?: CroodProperties;
    content?: ContentProperties;
    information?: InformationProperties;
}

export class Weather extends AggregateRoot<string, ConditionProperties> {
    constructor(props: ConditionProperties, id?: string) {
        super(props);
        this.id = id || new Types.ObjectId().toHexString();
    }

    private static generateBasicPropertiesForCreate(params: WeatherParams): ConditionProperties {
        return {
            name: params.name,
            zip: params.zip,
            country: params.country,
            timezone: params.timezone,
        };
    }

    static create(params: WeatherParams): Weather {
        const props = Weather.generateBasicPropertiesForCreate(params);
        if (params.crood) props.crood = Crood.create(params.crood);
        if (params.content) props.content = Content.create(params.content);
        if (params.information) props.information = Information.create(params.information);

        const weather = new Weather(props, params.id);
        return weather;
    }

    get name(): string {
        return this.props.name;
    }

    get zip(): string {
        return this.props.zip;
    }

    get country(): string {
        return this.props.country;
    }

    get timezone(): number {
        return this.props.timezone;
    }

    get crood(): Crood {
        return this.props.crood;
    }

    get content(): Content {
        return this.props.content;
    }

    get information(): Information {
        return this.props.information;
    }
}
