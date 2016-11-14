import request from 'request';
import url from 'url';
import slug from 'slug';
import {parseString as xmlParser} from 'xml2js';
import chalk from 'chalk';
import debug from 'debug';

const logger = debug('app:helpers:s3-bucket');
const AWS_ROOT = 's3.amazonaws.com';
const fetch = bucketName => {
  logger(`Fetching bucket info for ${bucketName}...`);
  return new Promise((resolve, reject) => {
    const urlObj = {
      protocol: 'http',
      host: AWS_ROOT,
      pathname: slug(bucketName)
    };

    const uri = url.format(urlObj);

    logger(`request uri`, uri);

    request(url.format(urlObj), (requestError, res, body) => {
      if (requestError) {
        return reject(requestError);
      }

      xmlParser(body, (parseError, data) => {
        if (parseError) {
          return reject(parseError);
        }

        const lightResult = {
          name: data.ListBucketResult.Name,
          maxKeys: data.ListBucketResult.MaxKeys,
          isTruncated: data.ListBucketResult.IsTruncated,
          url: uri
        };

        lightResult.contents = data.ListBucketResult.Contents
          .map(item => {
            const newItem = {
              key: item.Key[0],
              lastModified: item.LastModified[0],
              eTag: item.ETag[0].replace(/\"/g, ''),
              size: parseInt(item.Size[0], 10),
              storageClass: item.StorageClass[0],
            };

            return newItem;
          })

        logger(chalk.green(`Successfully retrieved ${lightResult.name}. Found ${lightResult.contents.length} item(s).`));

        return resolve(lightResult);
      });
    });
  });
};

export {fetch};
