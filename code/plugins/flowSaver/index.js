const log4js = require('log4js');
const logger = log4js.getLogger('flowSaver');
const path = require('path');
appRequire('plugins/flowSaver/server');
appRequire('plugins/flowSaver/flow');
appRequire('plugins/flowSaver/generateFlow');
const cron = appRequire('init/cron');
const knex = appRequire('init/knex').knex;
const manager = appRequire('services/manager');
const moment = require('moment');
const minute = 1;
const time = minute * 60 * 1000;

const saveFlow = async () => {
  try {
    const servers = await knex('server').select(['id', 'name', 'host', 'port', 'password']);
    const promises = [];
    servers.forEach(server => {
      const saveServerFlow = async server => {
        const lastestFlow = await knex('saveFlow').select(['time']).where({
          id: server.id,
        }).orderBy('time', 'desc').limit(1);
        if(lastestFlow.length === 0 || Date.now() - lastestFlow[0].time >= time) {
          const options = {
            clear: true,
          };
          let flow = await manager.send({
            command: 'flow',
            options: options,
          }, {
            host: server.host,
            port: server.port,
            password: server.password,
          });
          flow = flow.map(f => {
            return {
              id: server.id,
              port: f.port,
              flow: f.sumFlow,
              time: Date.now(),
            };
          }).filter(f => {
            return f.flow > 0;
          });
          if(flow.length === 0) {
            return;
          }
          await knex('saveFlow').insert(flow);
        }
      };
      promises.push(saveServerFlow(server));
    });
    await Promise.all(promises);
  } catch(err) {
    logger.error(err);
    return;
  }
};

cron.minute(() => {
  saveFlow();
}, 1);
