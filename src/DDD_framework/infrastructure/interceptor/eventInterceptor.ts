import { tracer } from '../tracer';
import { logger } from '../logger';
import { Tags, FORMAT_TEXT_MAP, Span } from 'opentracing';
import { RequestContext, TraceId } from '../foundation/RequestContext';

export interface EventInterceptor {
    handleEventBefore(traceIds: TraceId[], msgId?: string, body?: any): RequestContext;
    handleEventAfter(error: Error, eventProps: Record<any, any>): void;
}

export enum EVENTTYPE {
    MQ_EVENT_HANDLE,
    DOMAIN_EVENT_HANDLE,
    AGENDA_EVENT_HANDLE,
    BULL_EVENT_HANDLE,
    MQ_EVENT_PRODUCER,
}

const REQUEST_ENV = process.env.NODE_ENV || process.env.REQUEST_ENV || 'REQUEST_ENV_NOT_SET';
const REQUEST_ID_KEY = process.env.REQUEST_ID_KEY;
const TRACING_ID_KEY = process.env.TRACING_ID_KEY;

export class MessageEventInterceptor implements EventInterceptor {
    private span: Span;
    private traceIds: TraceId[];
    private msgId: string;
    private body: any;
    private startTime: number;
    private targetName: string;
    private targetMethodName: string;
    private eventType: EVENTTYPE;
    private requestContext: RequestContext;

    constructor(targetName: string, targetMethodName: string, eventType: EVENTTYPE) {
        this.targetName = targetName;
        this.targetMethodName = targetMethodName;
        this.eventType = eventType;
    }

    handleEventBefore(traceIds: TraceId[], msgId: string = '', body?: any): RequestContext {
        try {
            this.traceIds = traceIds;
            this.msgId = msgId;
            this.body = body;
            this.startTime = Date.now();

            const parentSpanContextTextMap = this.extractSpanContextTextMap(
                TRACING_ID_KEY,
                this.traceIds,
            );
            const spanContextTextMap = { [TRACING_ID_KEY]: '' };

            if (tracer) {
                const parentSpanContext = tracer.extract(FORMAT_TEXT_MAP, parentSpanContextTextMap);
                this.span = tracer.startSpan(EVENTTYPE[this.eventType].toLowerCase(), {
                    childOf: parentSpanContext,
                    tags: {
                        [Tags.SPAN_KIND]: Tags.SPAN_KIND_MESSAGING_CONSUMER,
                        'event.service': this.targetName,
                        'event.method': this.targetMethodName,
                        'request.id': this.msgId,
                        'request.env': REQUEST_ENV,
                    },
                });

                tracer.inject(this.span, FORMAT_TEXT_MAP, spanContextTextMap);
            }

            this.requestContext = RequestContext.create({
                requestId: {
                    key: REQUEST_ID_KEY,
                    value: this.msgId,
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
            console.error(err.stack);
        }
    }

    handleEventAfter(error: Error, eventProps: Record<any, any>): void {
        try {
            const costTime = Date.now() - this.startTime;
            this.span?.log({ body: this.body });

            if (this.requestContext?.customFields) {
                for (const customField in this.requestContext.customFields) {
                    this.span?.setTag(customField, this.requestContext.customFields[customField]);
                }
            }

            if (error instanceof Error) {
                this.span?.setTag(Tags.ERROR, true);
                this.span?.log({
                    message: error.message,
                    stack: error.stack,
                });
                console.error(error.stack);
                logger.error(
                    `${this.msgId ? `msgId: ${this.msgId}` : ''}, ${
                        this.targetMethodName
                    } handled success cost:${costTime}ms, event: ${JSON.stringify(eventProps)}`,
                );
            } else {
                logger.info(
                    `${this.msgId ? `msgId: ${this.msgId}` : ''}, ${
                        this.targetMethodName
                    } handled success cost:${costTime}ms, event: ${JSON.stringify(eventProps)}`,
                );
            }
            this.span?.finish();
        } catch (err) {
            console.error(err.stack);
        }
    }

    private extractSpanContextTextMap(tracingIdKey: string, tracingIds: TraceId[]) {
        const traceId = Array.isArray(tracingIds)
            ? tracingIds.find((tracingId) => {
                  if (tracingId.key === tracingIdKey) return tracingId?.value;
              })
            : null;
        return {
            [tracingIdKey]: traceId?.value || '',
        };
    }
}
