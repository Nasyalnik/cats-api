const {createLogger: _createLogger, transports, format} = require('winston');
const {format: utilformat} = require('util');

const label = 'test';


function formatMessage(message) {
  if (typeof(message)==='string') {
    return message;
  }
  return JSON.stringify({
    req: {
      method: message.req.method,
      url: message.req.originalUrl,
      headers: message.req.headers,
      params: message.req.params,
      file: message.req.file === undefined ? null : message.req.file,
    },
    res: message.res,
  });
}

const logger = _createLogger({
  level: 'debug',
  transports: [new transports.Console()],
  format: format.combine(
      format.colorize(),
      format.timestamp(),
      format.splat(),
      format.label({label: label}),
      format.printf(({level, message, label, timestamp, durationMs, ...meta})=>{
        return utilformat(
            '%s [%s] %s %s %s %s',
            timestamp, label, level, formatMessage(message), Object.keys(meta).length ? JSON.stringify(meta) : '',
                durationMs ? ms(durationMs) : '',
        ).trim();
      }),
  ),
});


module.exports = {logger, formatMessage};
