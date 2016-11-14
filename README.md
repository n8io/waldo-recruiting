![Sample output](https://i.imgsafe.org/a1742becd9.png)

# waldo-recruiting
A simple node app to read Exif data from an image url and persist it to a Mongo db instance.

## Prerequisites

* `git`
* `node v6+`
* `yarn v0.16+ # or npm v3+`
* A running instance of MongoDb

## Getting started

1. `git clone https://github.com/n8io/waldo-recruiting.git && cd waldo-recruiting`
2. `yarn # npm install`
3. `cat .env.example > .env`
4. Provide values for **AND uncomment** the config variables in `.env`

## Running the app

1. `yarn start # npm start`

### Want more verbose logging?

1. `DEBUG=app:* yarn start`

## Development

1. `yarn build && yarn start # npm run build && npm start`

## Why no tests?

1. It is my belief that ephemeral, proof of concept apps do not require test coverage.
2. Having noted that, I am ashamed I didn't start with tests.
3. I do indeed know how to test and enforce TDD (e.g. [environment-normalize](https://github.com/n8io/environment-normalize))

## TODO

1. Shame myself some more for not doing TDD
2. Dockerize so everyone can enjoy without OS restrictions
