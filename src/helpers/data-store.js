import {MongoClient} from 'mongodb';
import chalk from 'chalk';
import debug from 'debug';

const logger = debug('app:helpers:data-store');

const open = dbConnectionString => {
  return new Promise((resolve, reject) => {
    logger('Opening db connection...');
    MongoClient.connect(dbConnectionString, (dbConnectionError, database) => {
      if (dbConnectionError) {
        return reject(dbConnectionError);
      }

      logger(chalk.green('Connected to db successfully.'));

      return resolve(database);
    });
  });
};

const close = () => {
  if (global.db) {
    logger('Closing db connection...');
    global.db.close(() => logger(chalk.green('Database connection closed.')));
  }
};

const save = (url, statusCode, imageData) => {
  return new Promise((resolve, reject) => {
    const col = global.db.collection('image_data');
    logger(`Inserting image data into db... ${url}`);
    col.save(imageData, function(insertError, result){
      if (insertError) {
        return reject(insertError);
      }

      return resolve({imageUrl: url, statusCode});
    });
  });
};

export{open, close, save}
