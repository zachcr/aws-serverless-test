interface EntityIdProps<Value> {
    value: Value;
    occurredDate?: Date;
}

export abstract class EntityId<Value> implements EntityIdProps<Value> {
    private _value: Value;
    constructor(value: Value) {
        this._value = value;
        // this.occurredDate = new Date(value.getTimestamp());
    }

    get occurredDate(): Date {
        return this.occurredDate;
    }
    
    get value(): Value {
        return this._value;
    }

    equals(entityId: EntityId<Value>): boolean {
        if (entityId === null || entityId === undefined) {
            return false;
        }
        if (!(entityId instanceof this.constructor)) {
            return false;
        }
        return entityId.value === this.value;
    }
}
