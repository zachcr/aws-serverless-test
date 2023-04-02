import { ValueObject } from '../../../DDD_framework/domain';

export interface InformationProperties {
    temp: number;
    feelsLike: number;
    tempMin: number;
    tempMax: number;
    pressure: number;
    humidity: number;
    visibility: number;
    windSpeed: number;
    windDeg: number;
    clouds: number;
    dt: number;
}

export class Information extends ValueObject<InformationProperties> {
    static create(params: InformationProperties): Information {
        return new Information(params);
    }

    get temp(): number {
        return this.props.temp;
    }
    get feelsLike(): number {
        return this.props.feelsLike;
    }
    get tempMin(): number {
        return this.props.tempMin;
    }
    get tempMax(): number {
        return this.props.tempMax;
    }
    get pressure(): number {
        return this.props.pressure;
    }
    get visibility(): number {
        return this.props.visibility;
    }
    get humidity(): number {
        return this.props.humidity;
    }
    get windSpeed(): number {
        return this.props.windSpeed;
    }
    get windDeg(): number {
        return this.props.windDeg;
    }
    get clouds(): number {
        return this.props.clouds;
    }
    get dt(): number {
        return this.props.dt;
    }
}
