import { ValueObject } from '../../../DDD_framework/domain';

export interface ContentProperties {
    id: number;
    general: string;
    description: string;
    icon: string;
}

export class Content extends ValueObject<ContentProperties> {
    static create(params: ContentProperties): Content {
        return new Content(params);
    }

    get id(): number {
        return this.props.id;
    }

    get general(): string {
        return this.props.general;
    }

    get description(): string {
        return this.props.description;
    }

    get icon(): string {
        return this.props.icon;
    }
}
