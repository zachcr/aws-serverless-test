import * as grpc from '@grpc/grpc-js';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../logger';
import { tracer } from '../tracer';
import { Tags, FORMAT_TEXT_MAP, Span } from 'opentracing';
import { RequestContext } from '../foundation/RequestContext';
import { HyperError } from '../hyperError';

export interface ServerInterceptor<RequestType, ResponseType, ErrorType> {
    handleRequestBefore(call: grpc.ServerUnaryCall<RequestType, ResponseType>): void;
    handleRequestError(call: grpc.ServerUnaryCall<RequestType, ResponseType>, err: any): ErrorType;
    handleRequestAfter(
        call: grpc.ServerUnaryCall<RequestType, ResponseType>,
        response: ResponseType,
    ): void;
}

const REQUEST_ENV = process.env.NODE_ENV || process.env.REQUEST_ENV || 'REQUEST_ENV_NOT_SET';
const REQUEST_ID_KEY = process.env.REQUEST_ID_KEY;
const TRACING_ID_KEY = process.env.TRACING_ID_KEY;
const SPAN_ACTION = 'grpc_request';

export class GrpcServerInterceptor<RequestType, ResponseType>
    implements ServerInterceptor<RequestType, ResponseType, grpc.ServiceError>
{
    private targetName: string;
    private targetMethodName: string;
    private startTime: number;
    private requestId: string;
    private serviceError: grpc.ServiceError;
    private req: RequestType;
    private span: Span;
    private requestContext: RequestContext;

    constructor(targetName: string, targetMethodName: string) {
        this.targetName = targetName;
        this.targetMethodName = targetMethodName;
    }

    handleRequestBefore(call: grpc.ServerUnaryCall<RequestType, ResponseType>): RequestContext {
        try {
            this.startTime = Date.now();
            this.requestId = this.fetchRequestIdFromGrpcCall(call);
            this.req = call.request;

            const parentSpanContextTextMap = this.extractSpanContextTextMap(call, TRACING_ID_KEY);
            const spanContextTextMap = { [TRACING_ID_KEY]: '' };
            if (tracer) {
                const parentSpanContext = parentSpanContextTextMap[TRACING_ID_KEY]
                    ? tracer.extract(FORMAT_TEXT_MAP, parentSpanContextTextMap)
                    : undefined;
                this.span = tracer.startSpan(SPAN_ACTION, {
                    childOf: parentSpanContext,
                    tags: {
                        [Tags.SPAN_KIND]: Tags.SPAN_KIND_RPC_SERVER,
                        'grpc.service': this.targetName,
                        'grpc.method': this.targetMethodName,
                        'request.id': this.requestId,
                        'request.env': REQUEST_ENV,
                    },
                });

                tracer.inject(this.span, FORMAT_TEXT_MAP, spanContextTextMap);
            }

            this.requestContext = RequestContext.create({
                requestId: {
                    key: REQUEST_ID_KEY,
                    value: this.requestId,
                },
                traceIds: [
                    {
                        key: TRACING_ID_KEY,
                        value: spanContextTextMap[TRACING_ID_KEY],
                    },
                ],
            });

            return this.requestContext;
        } catch (err) {
            console.log(err.stack);
        }
    }

    handleRequestError(
        call: grpc.ServerUnaryCall<RequestType, ResponseType>,
        err: unknown,
    ): grpc.ServiceError {
        try {
            let message = 'unknown';
            if (err instanceof Error) {
                this.span?.setTag(Tags.ERROR, true);
                const logInfo: Record<string, any> = {
                    message: err.message,
                    stack: err.stack,
                };
                if (err instanceof HyperError) {
                    logInfo.extraInfo = err.extraInfo;
                }
                this.span?.log(logInfo);
                message = err.message;
                console.error(err.stack);
            } else {
                logger.info('Err caught is not instanceof Error!!! -->', this.requestId);
                console.error(err);
            }
            this.serviceError = {
                name: 'Internal errors',
                code: grpc.status.INTERNAL,
                message,
                details: message,
                metadata: call.metadata,
            };
            return this.serviceError;
        } catch (err) {
            console.log(err.stack);
        }
    }

    handleRequestAfter(
        call: grpc.ServerUnaryCall<RequestType, ResponseType>,
        response: ResponseType,
    ): void {
        try {
            const costTime = Date.now() - this.startTime;
            this.span?.log({ request: this.req });

            if (this.requestContext?.customFields) {
                for (const customField in this.requestContext.customFields) {
                    this.span?.setTag(customField, this.requestContext.customFields[customField]);
                }
            }

            if (this.serviceError) {
                logger.error(
                    `${this.targetName}.${
                        this.targetMethodName
                    } failed cost:${costTime}ms, req: ${JSON.stringify(this.req)}`,
                    this.requestId,
                );
            } else {
                logger.info(
                    `${this.targetName}.${
                        this.targetMethodName
                    } success cost:${costTime}ms, req: ${JSON.stringify(
                        this.req,
                    )}, res: ${JSON.stringify(response)}`,
                    this.requestId,
                );
                this.span?.log({ response });
            }
            this.span?.finish();
        } catch (err) {
            console.log(err.stack);
        }
    }

    private extractSpanContextTextMap(
        call: grpc.ServerUnaryCall<RequestType, ResponseType>,
        tracingIdKey: string,
    ) {
        return {
            [tracingIdKey]: call.metadata.get(tracingIdKey)[0],
        };
    }

    private fetchRequestIdFromGrpcCall(call: grpc.ServerUnaryCall<RequestType, ResponseType>) {
        return call.metadata.get(REQUEST_ID_KEY)[0]?.toString() || uuidv4();
    }
}
