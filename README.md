# Check you weather api!

Going to work is part of your routine and you like to plan ahead of time. You have a chat bot which you use everyday to see your calendar. You want to add a new feature to your chat bot to see today's weather, so you wear accordingly. For this chat bot, you want to write an api using AWS serverless which takes a postcode as an input and return back weather information.

    GET https://api.openweathermap.org/data/2.5/weather?zip=2000,au&appid={apikey}

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
    } ```

# Files

StackEdit stores your files in your browser, which means all your files are automatically saved locally and are accessible **offline!**

## Create files and folders

The file explorer is accessible using the button in left corner of the navigation bar. You can create a new file by clicking the **New file** button in the file explorer. You can also create folders by clicking the **New folder** button.

## Switch to another file

All your files and folders are presented as a tree in the file explorer. You can switch from one to another by clicking a file in the tree.

## Rename a file

You can rename the current file by clicking the file name in the navigation bar or by clicking the **Rename** button in the file explorer.

## Delete a file

You can delete the current file by clicking the **Remove** button in the file explorer. The file will be moved into the **Trash** folder and automatically deleted after 7 days of inactivity.

## Export a file

You can export the current file by clicking **Export to disk** in the menu. You can choose to export the file as plain Markdown, as HTML using a Handlebars template or as a PDF.

