import { Types } from 'mongoose';

import { Mapper } from '../../../DDD_framework/domain/Mapper';
import { WeatherParams, Weather as WeatherModel } from '../../../domain/model';
import { Weather, WeatherDocument } from '../../persistence/weather/schema';

export interface WeatherDPO extends Weather {
    _id?: Types.ObjectId;
}

export class WeatherMapper implements Mapper<WeatherModel> {
    private static instance: WeatherMapper;

    public static get sharedInstance(): WeatherMapper {
        if (!WeatherMapper.instance) {
            WeatherMapper.instance = new WeatherMapper();
        }

        return WeatherMapper.instance;
    }

    toDomainModel(raw: WeatherDocument): WeatherModel {
        if (!raw) {
            return null;
        }

        const params: WeatherParams = {
            id: raw._id.toHexString(),
            name: raw.name,
            zip: raw.zip,
            country: raw.country,
            timezone: raw.timezone,
            crood: raw.crood,
            content: raw.content,
            information: raw.information,
        };

        return WeatherModel.create(params);
    }

    toDPO(domainModel: WeatherModel): WeatherDPO {
        return {
            _id: new Types.ObjectId(domainModel.id),
            name: domainModel.name,
            zip: domainModel.zip,
            country: domainModel.country,
            timezone: domainModel.timezone,
            crood: domainModel.crood,
            content: domainModel.content,
            information: domainModel.information,
        };
    }

    toDTO(domainModel: WeatherModel) {
        return {
            _id: new Types.ObjectId(domainModel.id),
            name: domainModel.name,
            zip: domainModel.zip,
            country: domainModel.country,
            crood: domainModel.crood,
            content: domainModel.content,
            information: domainModel.information,
        };
    }
}
