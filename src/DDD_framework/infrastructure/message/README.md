### SQS example

To use it the same as DDD domain event

##### Producer

```
import 'dotenv/config';

import { InventoryType, ProductInventoryTracked } from './domain/model';
import { RequestContext } from './frameworks/infrastructure';
import { SQSProducer } from './frameworks/infrastructure/message/sqs';

function sendProducer() {
    const ctx = RequestContext.create({
        requestId: {
            key: 'test_sqs',
            value: 'test_sqs',
        },
        traceIds: [
            {
                key: 'id',
                value: 'xxx',
            },
        ],
        source: 'testing',
    });
    const data: ProductInventoryTracked = new ProductInventoryTracked({
        merchantName: 'xxx',
        employeeId: '',
        productId: 'productid',
        inventoryType: InventoryType.COMPOSITE,
        storeIds: ['9', '1'],
        quantities: { Name: 1 },
        serialNumbers: { serial: ['1', '2'] },
    });

    console.log('Sending....');

    SQSProducer.sharedInstance
        .send<ProductInventoryTracked>(ctx, 'product_inventory_trancked', data, 121)
        .then((data) => {
            console.log(data);
            process.exit();
        })
        .catch((err) => {
            console.log(err);
            process.exit();
        });
}

sendProducer();
```

##### Consumer

```
import 'dotenv/config';
import { ProductInventoryTracked } from './domain/model';
import { DomainEvent } from './frameworks/domain';
import { RequestContext } from './frameworks/infrastructure/foundation/RequestContext';
import { SQSConsumer, SQSSubscribeCtx } from './frameworks/infrastructure/message/sqs';

function main() {
    const ctxs: SQSSubscribeCtx<DomainEvent>[] = [
        {
            topic: 'product_inventory_trancked',
            handler: (ctx: RequestContext, event: ProductInventoryTracked): void => {
                // console.log(ctx);
                // console.log(event);
                // console.log('get');
            },
            eventClass: ProductInventoryTracked,
        },
    ];

    console.log('Listening...');
    SQSConsumer.sharedInstance.start(ctxs);
}

main();

```
