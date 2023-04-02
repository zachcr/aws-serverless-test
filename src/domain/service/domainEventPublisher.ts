import { DomainEventPublishTool } from '../../DDD_framework/domain/DomainEventPublishTool';

export class DomainEventPublisher extends DomainEventPublishTool {
    private static instance: DomainEventPublisher;

    static get sharedInstance(): DomainEventPublisher {
        if (!DomainEventPublisher.instance) {
            DomainEventPublisher.instance = new DomainEventPublisher();
        }
        return DomainEventPublisher.instance;
    }
}
