### Solution

``` 
├── README.md
├── jest.config.js
├── package.json
├── serverless.yml
├── src
│   ├── adapter
│   │   ├── server
│   │   ├── persistence
|   |   |    ├─── weather
|   |   |    |   ├─  index.ts
|   |   |    |   └── repo.ts
|   |   ├── client
|   |   |   ├─  index.ts
|   |   |   └── oneWeather.ts
|   |   ├── message
|   |   |    ├─── handler
|   |   |    |   ├─  index.ts
|   |   |    |   └── syncupWeather.ts
|   |   |    ├─── scheduler
|   |   |    |   ├─  index.ts
|   |   |    |   └── scheduleWeatherSyncup.ts
|   |   |    └─  index.ts
|   |   └── mapper
|   |   |    ├─── weather
|   |   |    |   ├─  index.ts
|   |   |    |   └── mapper.ts
│   ├── domain
│   │   ├── service
|   |   |    ├─── weather
|   |   |    |   ├─  index.ts
|   |   |    |   ├─  upsertWeather.ts
|   |   |    |   └── getWeather.ts
│   │   └── model
|   |   |    ├─── weather
|   |   |    |   ├─  events
|   |   |    |   |     ├─   index.ts
|   |   |    |   |     └──  schuleWeatherSyncup.ts
|   |   |    |   ├─  index.ts
|   |   |    |   ├─  Weather.ts
|   |   |    |   ├─  Content.ts
|   |   |    |   ├─  Information.ts
|   |   |    |   └── Coord.ts
│   └── index.ts
└── yarn.lock

``` 

Used DDD framework to adjust the whole project.
Abstrcted a `DomainModel` named Weather, which connected with `domainService` named getWeather and upsertWeather, `DomainService` functions are allowed requested by `adapter` layer. 
- `Adapter.Message` is a MQ/Distributed Cronjob System interface.
- `Adapter.Server` is a RPC/RESTFul API interface
- `Adapter.Persistence` is a Persistence infrastrature layer for Domain Repo interface.
- `Adapter.Client` is a client request layer to 3rd party providers(exp: OneWeather)

### CronJob
Use BullMQ to be a distributed cronjob system. So we can deploy this server in any type of instance (exp: Docker, K8S, Server, Lambda)

### Storage & Cache
Use MongoDB + Redis to be the storage&cache layer. 

### One Weather API limiation
Use cronjob to send request every hour per zipCode.

### ENV Variable
- ONE_WEATHER_URL
- ONE_WEATHER_API_KEY
- ZIP_CODES
- REDIS_URL
- MONGODB_URL