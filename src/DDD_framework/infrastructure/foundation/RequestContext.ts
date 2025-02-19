import _ from 'lodash';
import mongoose from 'mongoose';

export interface TraceId {
    key: string;
    value: string;
}

interface RequestId {
    key: string;
    value: string;
}

interface DBOptions {
    session?: mongoose.ClientSession;
}

export interface IRequestContext {
    requestId: RequestId;
    traceIds: TraceId[];
    source?: string;
    merchantInfo?: RequestMerchant;
    customFields?: Record<string, string>;
    dbOptions?: DBOptions;
}

export type RequestContextDTO = Omit<IRequestContext, 'dbOptions'>;

export class RequestContext implements IRequestContext {
    private readonly props: IRequestContext;

    constructor(properties: IRequestContext) {
        this.props = properties;
    }

    static create(context: IRequestContext): RequestContext {
        return new RequestContext(context);
    }

    set requestId(requestId: RequestId) {
        if (this.props) {
            this.props.requestId = requestId;
        }
    }

    get requestId(): RequestId {
        return this.props?.requestId;
    }

    set traceIds(traceIds: TraceId[]) {
        if (this.props) {
            this.props.traceIds = traceIds;
        }
    }

    get traceIds(): TraceId[] {
        return this.props?.traceIds;
    }

    set source(source: string) {
        if (this.props) {
            this.props.source = source;
        }
    }

    get source(): string {
        return this.props?.source;
    }

    set merchantInfo(merchantInfo: RequestMerchant) {
        if (this.props) {
            this.props.merchantInfo = merchantInfo;
        }
    }

    get merchantInfo(): RequestMerchant {
        return this.props?.merchantInfo;
    }

    set customFields(customFields: Record<string, string>) {
        if (this.props) {
            this.props.customFields = customFields;
        }
    }

    get customFields(): Record<string, string> {
        return this.props?.customFields;
    }

    set dbOptions(dbOptions: DBOptions) {
        if (this.props) {
            this.props.dbOptions = dbOptions;
        }
    }

    get dbOptions(): DBOptions {
        return this.props?.dbOptions;
    }

    // keep the compatibility for the typo error
    get dbOptioins(): DBOptions {
        return this.props?.dbOptions;
    }

    toJSON(): RequestContextDTO {
        return _.omit(this.props, 'dbOptions');
    }
}

export interface RequestMerchant {
    merchant: string;
    registerId?: string;
    appVersion?: string;
    ipAddress?: string;
    employeeId?: string;
}
