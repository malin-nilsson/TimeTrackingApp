# TimeTrackingApp
Time tracker where users can add hours to different categories, see updates from other users and post comments in the forum ⌚


## Installation
1. Clone the repo\
`git clone https://github.com/malin-nilsson/TimeTrackingApp`

2. Install npm packages\
`npm install`

3. Create a .env\
To run this application you need to have the following things in a .env file:\
CONNECTION_STRING="[Your connection string]"\
JWTSECRET="[Your jwt secret]"\
GOOGLE_CLIENT_ID="[Your Google client id]"\
GOOGLE_CLIENT_SECRET="[Your Google client secret]"

3. Run Nodemon\
`nodemon`

Visit localhost:8000 to view the project

## Built with
- HTML & SASS
- JavaScript
- Node.js
- Mongoose
- Express.js
- Handlebars
- Passport

## Details
This was a school group project built with Node.js where our goal was to create a time tracking app where users could perform all CRUD operations on tracked hours as well as on forum posts. Users can choose to keep their hours public or private. In this project we also implemented Google login authentication using Passport.js

## Contributors
[Malin Nilsson](https://github.com/malin-nilsson) </br>
[Alexander Hall](https://github.com/Alexandrhall) </br>
[Jesper Lind](https://github.com/JesperSimonLind)
