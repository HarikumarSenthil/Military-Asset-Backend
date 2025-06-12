const winston = require('winston');

// Logger configuration using winston
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ level, message, timestamp, stack }) => {
      return `[${timestamp}] ${level.toUpperCase()}: ${stack || message}`;
    })
  ),
  transports: [
    new winston.transports.Console({
      handleExceptions: true,
      format: winston.format.colorize({ all: true })
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  ],
  exitOnError: false
});

/**
 * Capitalize the first letter of each word in a string
 */
const capitalizeWords = (str) =>
  str.replace(/\b\w/g, (char) => char.toUpperCase());

/**
 * Formats a date to YYYY-MM-DD
 */
const formatDate = (date) => {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

module.exports = {
  logger,
  capitalizeWords,
  formatDate
};
