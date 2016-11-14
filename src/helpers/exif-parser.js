import {ExifImage as exifParser} from 'exif';
import fileType from 'file-type';
import chalk from 'chalk';
import debug from 'debug';

const logger = debug('app:helpers:exif-parser');

const parser = buffer => new Promise((resolve, reject) => {
  const EXPECTED_FILE_EXT = 'jpg';
  const UNSUPPORTED_EXIF_EXTENSIONS = [
    'cr2'
  ];

  exifParser(buffer, (parseError, metadata) => {
    if (parseError) {
      const fileTypeInfo = fileType(buffer);

      if (UNSUPPORTED_EXIF_EXTENSIONS.indexOf(fileTypeInfo.ext) > -1) {
        const unsupportedExifError = new Error(`Parsing Exif data from ${fileTypeInfo.ext} images is not supported.`);

        return resolve({error: unsupportedExifError})
      }
      else if (fileTypeInfo.ext !== EXPECTED_FILE_EXT) {
        const fileTypeMismatchError = new Error(`Expected file type of ${EXPECTED_FILE_EXT} and got a ${fileTypeInfo.ext} instead.`);

        return resolve({error: fileTypeMismatchError})
      }

      return resolve({error: parseError}); // We tried and failed :-(. We recognize there was an error, so we just return an empty object
    }

    return resolve(metadata);
  });
});

export {parser};
