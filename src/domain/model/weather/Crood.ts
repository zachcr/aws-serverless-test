import { ValueObject } from '../../../DDD_framework/domain';

export interface CroodProperties {
    lon: string;
    lat: string;
}

export class Crood extends ValueObject<CroodProperties> {
    static create(params: CroodProperties): Crood {
        return new Crood(params);
    }

    get lon(): string {
        return this.props.lon;
    }

    get lat(): string {
        return this.props.lat;
    }
}
