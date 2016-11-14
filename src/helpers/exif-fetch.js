import http from 'http';
import chalk from 'chalk';
import debug from 'debug';
import {parser as exifParser} from './exif-parser';
import {save as saveExif} from './data-store';

const logger = debug('app:helpers:exif-fetch');
const MIN_VALID_BYTES = 65535; // Maximum Exif metadata size in bytes (the minimum we need to stop the response)

const fetch = imageUrl => {
  return new Promise((resolve, reject) => {
    logger(`Fetching Exif data for... ${imageUrl}`);

    http.get(imageUrl, res => {
      const chunks = [];

      if (res.statusCode >= 400) {
        logger(chalk.red(`An error occurred when requesting ${imageUrl}`), `HTTP RESPONSE: ${res.statusCode}`); // eslint-disable-line no-console

        return resolve({imageUrl, statusCode: res.statusCode});
      }

      res.on('data', chunk => {
        chunks.push(chunk);

        const chunkLength = chunks.reduce((memo, tChunk) => memo + tChunk.length, 0); // eslint-disable-line no-magic-numbers

        if (chunkLength < MIN_VALID_BYTES) {
          // Not enough to pull exif data (yet). Keep calm, continue on.
          return;
        }

        // We got all the bytes we need, kill the response
        res.destroy();

        // Parse Exif data from the first 65k
        exifParser(Buffer.concat(chunks))
          .then(metadata => {
            logger(chalk.green(`Successfully parsed Exif data for ${imageUrl}`));

            const exifData = Object.assign({_id: imageUrl}, {imageUrl}, metadata);
            const statusCode = metadata.error ? 400 : res.statusCode;

            if (metadata.error) {
              // Unable to parse any exif data
              logger(chalk.red(`Unable to parse Exif data from url... ${imageUrl}`), metadata.error);

              return resolve({imageUrl, statusCode});
            }

            return resolve({imageUrl, statusCode, exifData});
          })
          .catch(error => {
            logger(chalk.red(`An error was thrown while trying to fetch Exif data for ${imageUrl}`)); // eslint-disable-line no-console

            return reject(error);
          })
          ;
      });
    });
  });
};

export {fetch};
