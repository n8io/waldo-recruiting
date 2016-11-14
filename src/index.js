/* eslint-disable no-process-env, no-console, no-magic-numbers */
import url from 'url';
import path from 'path';
import {install as initializeSourceMaps} from 'source-map-support';
import request from 'request';
import dotenv from 'dotenv-safe';
import Bluebird from 'bluebird';
import chalk from 'chalk';
import debug from 'debug';

// Load config
dotenv.load({
  path: path.join(__dirname, '..', '.env'),
  sample: path.join(__dirname, '..', '.env.example'),
  silent: true
});

const logger = debug('app:index');

import {open as openDbConnection, close as closeDbConnection, save as saveExifToDb} from './helpers/data-store';
import {fetch as fetchBucket} from './helpers/s3-bucket';
import {fetch as fetchExif} from './helpers/exif-fetch';

initializeSourceMaps(); // Enable source maps

process.on('SIGINT', closeDbConnection);
process.on('SIGTERM', closeDbConnection);

const dbConnectionString = process.env.MONGO_CONFIG || 'mongodb://localhost:27017/image_data';
const bucketName = process.env.S3_BUCKET_NAME || 'waldo-recruiting';
let totalRequests = 0;

// Open db connection
openDbConnection(dbConnectionString)
  .then(database => {
    global.db = database; // Share connection rather than spin up/down every request

    console.time('Total processing time');

    // Fetch bucket contents
    return fetchBucket(bucketName);
  })
  .catch(dbConnectionError => {
    logger('An error occurred while attempting to connect to the database.', dbConnectionError);
  })
  .then(bucket => {
    const exifMapper = item => {
      const urlObj = url.parse(bucket.url);

      urlObj.pathname += `/${item.key}`;

      // Fetch Exif data from url
      return fetchExif(url.format(urlObj));
    };

    // We'll need this later to determine the number of failures in the summary
    totalRequests = bucket.contents.length;
    console.log('Total image requests:', totalRequests);

    return Bluebird.map(bucket.contents, exifMapper, {concurrency: 0}); // set concurrency to throttle exifParsing
  })
  .catch(bucketFetchErrors => {
    logger(chalk.red('bucketFetchErrors'), bucketFetchErrors);
  })
  .then(exifResponses => {
    // Save to the db
    const promises = exifResponses
      .filter(exifResponse => exifResponse.statusCode === 200)
      .map(exifResponse => saveExifToDb(exifResponse.imageUrl, exifResponse.statusCode, exifResponse.exifData));

    return Promise.all(promises);
  })
  .then(exifResponses => {
    // Provide a summary
    console.log('Total Exif parsing errors:', totalRequests - exifResponses.length);
    console.log('Total records upserted:', exifResponses.length);
    console.timeEnd('Total processing time');

    return closeDbConnection();
  })
  .catch(exifErrors => {
    logger(chalk.red('exifErrors'), exifErrors);
  })
  ;
