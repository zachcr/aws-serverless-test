import { DomainEventPublishTool } from '../../domain/DomainEventPublishTool';
import { DomainEvent } from '../../domain/DomainEvent';
import {
    MessageEventInterceptor,
    EventInterceptor,
    EVENTTYPE,
} from '../interceptor/eventInterceptor';
import { RequestContext } from '../foundation/RequestContext';

type DomainEventHandler<T> = (ctx: RequestContext, event: T) => void | Promise<void>;

export interface EventSubscribeCtx<T extends DomainEvent> {
    instance: DomainEventPublishTool;
    name: string;
    handler: DomainEventHandler<T>;
}

export function doaminEventSubscriber(subscribeCtxs: EventSubscribeCtx<DomainEvent>[]): void {
    for (const eventCtx of subscribeCtxs) {
        const { name, handler, instance } = eventCtx;
        instance.register(name, async <T extends DomainEvent>(ctx: RequestContext, event: T) => {
            const { id, name } = event;
            const interceptor: EventInterceptor = new MessageEventInterceptor(
                'doaminEventSubscriber',
                name,
                EVENTTYPE.DOMAIN_EVENT_HANDLE,
            );
            const interceptorCtx = interceptor.handleEventBefore(
                ctx?.traceIds,
                id,
                event?.properties,
            );
            let error;
            try {
                await handler(interceptorCtx, event);
            } catch (err) {
                error = err;
            }
            interceptor.handleEventAfter(error, event.properties);
        });
    }
}
