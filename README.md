# Weather api!

Welcome to the Bilue AWS Engineer Tech Challenge! The purpose of this challenge is to help us assess your technical skills. We know that you have limited time to devote to this task and may not be able to provide the complete solution as you would given more time, so we suggest you focus on the core requirements first, then any additional features if you have time left over.

## Problem Statement:
Going to work is part of your routine and you like to plan ahead of time. You have a chat bot which you use everyday to see your calendar. You want to add a new feature to your chat bot to see today's weather. For this chat bot, you want to write an api using AWS serverless which takes a postcode as an input and return back weather information.

We have used open weather map which provide the ability to get weather information by postcode and the sample code has been provided below. Please feel free to use any other api you like.

    
### Endpoint: 
``` 
GET https://api.openweathermap.org/data/2.5/weather?zip=2000,au&appid={apikey}
```

### Payload

``` 
   {
       "coord": {
           "lon": 150.8667,
           "lat": -33.7167
        },
        "weather": [{
            "id": 804,
            "main": "Clouds",
            "description": "overcast clouds",
            "icon": "04d"
        }],
        "base": "stations",
        "main": {
            "temp": 290.27,
            "feels_like": 290.23,
            "temp_min": 288.57,
            "temp_max": 291.11,
            "pressure": 1028,
            "humidity": 84
        },
        "visibility": 10000,
        "wind": {
            "speed": 3.09,
            "deg": 210
        },
        "clouds": {
            "all": 88
        },
        "dt": 1653353485,
        "sys": {
            "type": 2,
            "id": 2004875,
            "country": "AU",
            "sunrise": 1653338846,
            "sunset": 1653375571
        },
        "timezone": 36000,
        "id": 0,
        "name": "Schofields",
        "cod": 200
    } 
```


## Getting Started

We have provided a bit of boilerplate code that you can use to get started. You are not required to use this boilerplate, so feel free to throw it all away and start fresh if you prefer.

```
.
├── README.md
├── jest.config.js
├── package.json
├── serverless.yml
├── src
│   ├── @types
│   │   ├── httpOptions.ts
│   │   └── index.ts
│   ├── api
│   │   └── index.ts
│   ├── handlers
│   │   ├── return.ts
│   │   └── weather.ts
│   ├── index.ts
│   ├── services
│   │   ├── index.ts
│   │   └── weather.ts
│   └── utils
│       ├── httpClient.ts
│       ├── httpException.ts
│       ├── httpResponse.ts
│       └── index.ts
└── yarn.lock

```

- src -> Utils: all the utility functions like http client are located here. Extend them to make api calls
- src -> handler: entry point for your serverless app
- jest.config.js -> Jest is used for testing
- serverless.yml -> Although we have provided serverless within the project but is not mandatory to use. Use the framework of your choice to deploy your app

### How to Use this test

This repo provide you with a problem statement and a boilerplate. Either fork this repo or create your own github repo to create your own version of the solution.

You can either submit:

- the github link your forked repo which we can deploy in our environment
- the github link to your forked repo along with url to the working API in aws cloud.

### Task

- Implement a working api which take postcode and country code and return back the weather.
- Return data in below format
  - ``` 
        {
            "lon": 150.8667,
            "lat": -33.7167,
            "main": "Clouds",
            "description": "overcast clouds",
            "temp": 290.27,
            "feels_like": 290.23,
            "temp_min": 288.57,
            "temp_max": 291.11,
            "pressure": 1028,
            "humidity": 84
        }
    ```
- Validate input and throw relevant errors
- Implement basic security around your api


## Submission
Please document your solution in the SOLUTION.md file. This should explain why you've made the design choices that you have and clarify anything you feel isn't obvious. Feel free to also include what else you would have done given more time.

Please include instructions on how to run your app if it is not using the boilerplate provided.

Once completed, please upload your solution to a public Github repo and share the link with careers@bilue.com.au
