[![NSF-1928230](https://img.shields.io/badge/NSF-1928230-red.svg)](https://nsf.gov/awardsearch/showAward?AWD_ID=1928230)
[![nsidc](https://circleci.com/gh/nsidc/aross-map.svg?style=shield)](https://app.circleci.com/pipelines/github/nsidc/aross-map)

# Arctic Rain on Snow Study (AROSS) Observations Map

The AROSS Observation Map displays rain-on-snow event observations sourced from
[the LEO Network](https://www.leonetwork.org) on an interactive map.


## Development

### Running the application

Start the application anywhere with Docker and `docker-compose`. This
configuration gives you an application running at port 80 with source code
hot-reloading. Because the source code is volume-mounted, you can edit the
source code on the host and see changes reflected in the server run by Docker.

```
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Alternatively:
```
ln -s docker-compose.dev.yml docker-compose.override.yml
docker-compose up --build
```


### Available scripts

#### `npm start`

Runs the app in the development mode on port 3000. Your browser should reload
if you make edits. You will also see any lint errors in the console.


#### `npm test`

Launches the test runner in the interactive watch mode. See the section about
[running tests](https://facebook.github.io/create-react-app/docs/running-tests)
for more information.


#### `npm run lint`

Manually triggers ESLint static analysis with type-aware linting thanks to the
`typescript-eslint` plugin.


#### `npm run build`

Builds the app for production to the `build` folder. It correctly bundles
React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes. Your app is ready
to be deployed!

See the section about
[deployment](https://facebook.github.io/create-react-app/docs/deployment) for
more information.


## Deployment

The app can be deployed with:

```
docker-compose -f docker-compose.yml -f docker-compose.live.yml up --build -d
```

Alternatively:

```
ln -s docker-compose.live.yml docker-compose.override.yml
docker-compose up --build -d
```

WARNING:The script at `deploy/deploy` is not tested for your infrastructure.
Use it at your own risk!
