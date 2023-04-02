import mongoose from 'mongoose';
import { Tags, FORMAT_TEXT_MAP, Span } from 'opentracing';

import { tracer } from '../tracer';
import { RequestContext } from '../foundation/RequestContext';

export interface InterceptorMethods<RequestContextType> {
    handleRequestBefore(ctx: RequestContextType, ...requestArgs: any): void;
    handleRequestError(err: Error): void;
    handleRequestAfter(response: any): void;
}

const REQUEST_ENV = process.env.NODE_ENV || process.env.REQUEST_ENV || 'REQUEST_ENV_NOT_SET';
const TRACING_ID_KEY = process.env.TRACING_ID_KEY;

export function TransactionInterceptor(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<any>,
): void {
    const method = descriptor.value;
    if (target && target.constructor?.name) {
        descriptor.value = async function (ctx: RequestContext, ...args: any) {
            const interceptor = new Interceptor('database_transaction_query', {
                [Tags.SPAN_KIND]: Tags.SPAN_KIND_RPC_SERVER,
                'database_transaction_query.client': target.constructor.name,
                'database_transaction_query.method': propertyKey,
            });
            // when using mongoose clientSession type is a circular
            interceptor.handleRequestBefore(
                ctx,
                ...args?.filter((arg: any) => {
                    if (arg) {
                        return !arg.session;
                    }
                    return true;
                }),
            );
            let result;
            if (ctx) {
                const session = await mongoose.startSession();
                try {
                    await session.withTransaction(async () => {
                        ctx.dbOptions = { session };
                        result = await method.apply(this, [ctx, ...args]);
                    });
                } catch (error) {
                    interceptor.handleRequestError(error);
                } finally {
                    session.endSession();
                }
            } else {
                result = await method.apply(this, [ctx, ...args]);
            }

            interceptor.handleRequestAfter(result);
            return result;
        };
    }
}

export function InternalMessageInterceptor(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<any>,
): void {
    const method = descriptor.value;
    if (target && target.constructor?.name) {
        descriptor.value = async function (ctx: RequestContext, ...args: any) {
            const interceptor = new Interceptor('internal_message', {
                [Tags.SPAN_KIND]: Tags.SPAN_KIND_RPC_CLIENT,
                'external_call.client': target.constructor.name,
                'external_call.method': propertyKey,
            });
            interceptor.handleRequestBefore(ctx, ...args);

            let result;
            try {
                result = await method.apply(this, [ctx, ...args]);
            } catch (error) {
                interceptor.handleRequestError(error);
            }

            interceptor.handleRequestAfter(result);
            return result;
        };
    }
}

export function ExternalInterceptor(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<any>,
): void {
    const method = descriptor.value;
    if (target && target.constructor?.name) {
        descriptor.value = async function (ctx: RequestContext, ...args: any) {
            const interceptor = new Interceptor('exteral_call', {
                [Tags.SPAN_KIND]: Tags.SPAN_KIND_RPC_CLIENT,
                'external_call.client': target.constructor.name,
                'external_call.method': propertyKey,
            });
            interceptor.handleRequestBefore(ctx, ...args);

            let result;
            try {
                result = await method.apply(this, [ctx, ...args]);
            } catch (error) {
                interceptor.handleRequestError(error);
            }

            interceptor.handleRequestAfter(result);
            return result;
        };
    }
}

export function RepoInterceptor(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<any>,
): void {
    const method = descriptor.value;
    if (target && target.constructor?.name) {
        descriptor.value = async function (ctx: RequestContext, ...args: any) {
            const interceptor = new Interceptor('database_query', {
                [Tags.SPAN_KIND]: Tags.SPAN_KIND_RPC_CLIENT,
                'database_query.client': target.constructor.name,
                'database_query.method': propertyKey,
            });
            // when using mongoose clientSession type is a circular
            interceptor.handleRequestBefore(
                ctx,
                ...args?.filter((arg: any) => {
                    if (arg) {
                        return !arg.session;
                    }
                    return true;
                }),
            );
            let result;
            try {
                result = await method.apply(this, [ctx, ...args]);
            } catch (error) {
                interceptor.handleRequestError(error);
            }

            interceptor.handleRequestAfter(result);
            return result;
        };
    }
}

class Interceptor implements InterceptorMethods<RequestContext> {
    private action: string;
    private span: Span;
    private spanTags: Record<string, unknown>;
    private requestContext: RequestContext;

    constructor(action: string, spanTags: Record<string, unknown>) {
        this.action = action;
        this.spanTags = spanTags;
    }

    handleRequestBefore(ctx: RequestContext, ...requestArgs: any): void {
        try {
            if (ctx) {
                this.requestContext = ctx;
                const parentSpanContextTextMap = { [TRACING_ID_KEY]: '' };
                for (const traceId of this.requestContext?.traceIds) {
                    if (traceId.key === TRACING_ID_KEY) {
                        parentSpanContextTextMap[TRACING_ID_KEY] = traceId.value.toString();
                    }
                }
                if (tracer) {
                    const parentSpanContext = tracer.extract(
                        FORMAT_TEXT_MAP,
                        parentSpanContextTextMap,
                    );
                    this.span = tracer.startSpan(this.action, {
                        childOf: parentSpanContext,
                        tags: {
                            'request.id': this.requestContext.requestId?.value,
                            'request.env': REQUEST_ENV,
                            ...this.spanTags,
                        },
                    });
                    this.span?.log({
                        requestArgs,
                    });
                }
            }
        } catch (err) {
            console.log(err.stack);
        }
    }

    handleRequestError(err: Error): void {
        try {
            if (err instanceof Error) {
                this.span?.setTag(Tags.ERROR, true);
                this.span?.log({
                    message: err.message,
                    stack: err.stack,
                });
            }
            this.span?.finish();
        } catch (err) {
            console.log(err.stack);
        }
        throw err;
    }

    handleRequestAfter(response: any): void {
        try {
            this.span?.log({
                response,
            });

            if (this.requestContext?.customFields) {
                for (const customField in this.requestContext.customFields) {
                    this.span?.setTag(customField, this.requestContext.customFields[customField]);
                }
            }

            this.span?.finish();
        } catch (err) {
            console.log(err.stack);
        }
    }
}
