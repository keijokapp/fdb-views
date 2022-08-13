import http from 'http';
import cleanup from './cleanup.js';
import logger from './logger.js';
import config from './config.js';
import app from './app.js';
import startSynchronizationLoop from './sync.js';
import startEventProcessingLoop from './process-events.js';
import startUserCleanupLoop from './cleanup-users.js';

// const server = http.createServer(app);

// server.on('error', e => {
// 	logger.error('Server error', { e });
// 	cleanup(1);
// });

// cleanup((exit, callback) => {
// 	server.close();
// 	logger.on('finish', callback);
// 	logger.info('Exiting...', { exit });
// 	logger.end();
// });

// server.listen(config.listen.port, config.listen.address, () => {
// 	const address = server.address();
// 	logger.info('Listening', address);
// });

// startSynchronizationLoop();
// startEventProcessingLoop();
// startUserCleanupLoop();
