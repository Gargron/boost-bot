const Mastodon       = require('mastodon');
const EventSource    = require('eventsource');
const throttledQueue = require('throttled-queue');
const log            = require('npmlog');

require('dotenv').config();

log.level = process.env.LOG_LEVEL || 'verbose';

const config = {
  access_token: process.env.ACCESS_TOKEN,
  api_url: `https://${process.env.API_HOST}/api/v1/`,
  hashtag: process.env.HASHTAG,
};

log.info('Booting up...');
log.info(`Host: ${process.env.API_HOST}, Hashtag: #${config.hashtag}`);

const client   = new Mastodon(config);
const es       = new EventSource(`${config.api_url}streaming/hashtag/local?access_token=${config.access_token}&tag=${config.hashtag}`);
const throttle = throttledQueue(1, 15000);

es.addEventListener('update', ({ data }) => {
  const { id } = JSON.parse(data);

  log.silly(`Received message: ${id}`);

  throttle(() => {
    log.verbose(`Boosting: ${id}`);

    client.post(`statuses/${id}/reblog`, (err, data) => {
      if (err) {
        log.error(`Error boosting ${id}: ${err}`);
        return;
      }

      log.silly(`Boosted: ${id}`);
    });
  });
});
