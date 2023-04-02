import { Schema, Document, model, Types } from 'mongoose';

export interface Weather {
    zip: string;
    name?: string;
    country?: string;
    timezone?: number;
    crood?: {
        lon: string;
        lat: string;
    };
    content?: {
        id: number;
        general: string;
        description: string;
        icon: string;
    };
    information?: {
        temp: number;
        feelsLike: number;
        tempMin: number;
        tempMax: number;
        pressure: number;
        humidity: number;
        visibility: number;
        windSpeed: number;
        windDeg: number;
        clouds: number;
        dt: number;
    };
}

export interface WeatherDocument extends Weather, Document<Types.ObjectId> {
    id: string;
    createdTime: Date;
    modifiedTime: Date;
}

const CroodSchema = new Schema({
    lon: String,
    lat: String,
});

const ContentSchema = new Schema({
    id: Number,
    general: String,
    description: String,
    icon: String,
});

const InformationSchema = new Schema({
    temp: Number,
    feelsLike: Number,
    tempMin: Number,
    tempMax: Number,
    pressure: Number,
    humidity: Number,
    visibility: Number,
    windSpeed: Number,
    windDeg: Number,
    clouds: Number,
    dt: Number,
});

const WeatherSchema = new Schema(
    {
        zip: {
            type: String,
            required: true,
        },
        name: {
            type: String,
        },
        country: {
            type: String,
        },
        timezone: {
            type: Number,
        },
        crood: {
            type: CroodSchema,
        },
        content: {
            type: ContentSchema,
        },
        information: {
            type: InformationSchema,
        },
    },
    {
        autoIndex: process.env.NODE_ENV == 'development',
        timestamps: {
            createdAt: 'createdTime',
            updatedAt: 'modifiedTime',
        },
    },
);

WeatherSchema.index({ zip: 1 }, { unique: true });
WeatherSchema.index({ zip: 1, country: 1 });

const WeatherModel = model<WeatherDocument>('weather', WeatherSchema);

export default WeatherModel;
