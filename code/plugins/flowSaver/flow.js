const knex = appRequire('init/knex').knex;
const config = appRequire('services/config').all();
const moment = require('moment');
/*
arguments: startTime, endTime
  or
arguments: id, startTime, endTime
  or
arguments: host, port, startTime, endTime
 */
const getFlow = function () {
  if(arguments[3]) {
    const host = arguments[0];
    const port = arguments[1];
    const startTime = arguments[2];
    const endTime = arguments[3];
    return knex('saveFlow').innerJoin('server', 'server.id', 'saveFlow.id')
    .sum('flow as sumFlow')
    .groupBy('saveFlow.port')
    .select(['saveFlow.port as port'])
    .where({
      'server.host': host,
      'server.port': port,
    })
    .whereBetween('time', [startTime, endTime]);
  } else if (arguments[2]) {
    const id = arguments[0];
    const startTime = arguments[1];
    const endTime = arguments[2];
    return knex('saveFlow')
    .sum('flow as sumFlow')
    .groupBy('port')
    .select(['port'])
    .where({id})
    .whereBetween('time', [startTime, endTime]);
  } else {
    const host = config.manager.address.split(':')[0];
    const port = +config.manager.address.split(':')[1];
    const startTime = arguments[0];
    const endTime = arguments[1];
    return knex('saveFlow').innerJoin('server', 'server.id', 'saveFlow.id')
    .sum('flow as sumFlow')
    .groupBy('saveFlow.port')
    .select(['saveFlow.port as port'])
    .where({
      'server.host': host,
      'server.port': port,
    })
    .whereBetween('time', [startTime, endTime]);
  }
};

const isDay = (start, end) => {
  let hour;
  let minute;
  let second;
  let millisecond;
  hour = moment(start).get('hour');
  minute = moment(start).get('minute');
  second = moment(start).get('second');
  millisecond = moment(start).get('millisecond');
  if(hour || minute || second || millisecond) {
    return false;
  }
  hour = moment(end).get('hour');
  minute = moment(end).get('minute');
  second = moment(end).get('second');
  millisecond = moment(end).get('millisecond');
  if(hour || minute || second || millisecond) {
    return false;
  }
  if(end >= Date.now()) {
    return false;
  }
  return true;
};

const isHour = (start, end) => {
  let minute;
  let second;
  let millisecond;
  minute = moment(start).get('minute');
  second = moment(start).get('second');
  millisecond = moment(start).get('millisecond');
  if(minute || second || millisecond) {
    return false;
  }
  minute = moment(end).get('minute');
  second = moment(end).get('second');
  millisecond = moment(end).get('millisecond');
  if(minute || second || millisecond) {
    return false;
  }
  if(end >= Date.now()) {
    return false;
  }
  return true;
};

const is5min = (start, end) => {
  let minute;
  let second;
  let millisecond;
  minute = moment(start).get('minute');
  second = moment(start).get('second');
  millisecond = moment(start).get('millisecond');
  if(minute%5 || second || millisecond) {
    return false;
  }
  minute = moment(end).get('minute');
  second = moment(end).get('second');
  millisecond = moment(end).get('millisecond');
  if(minute%5 || second || millisecond) {
    return false;
  }
  if(end >= Date.now()) {
    return false;
  }
  return true;
};

const splitTime = (start, end) => {
  const time = {
    day: [],
    hour: [],
    fiveMin: [],
    origin: [],
  };
  const now = Date.now();
  const getMinute = moment(now).get('minute');
  const splitEnd = {
    day: moment(now).hour(0).minute(0).second(0).millisecond(0).toDate().getTime(),
    hour: moment(now).minute(0).second(0).millisecond(0).toDate().getTime(),
    fiveMin: moment(now).minute(getMinute - getMinute%5).second(0).millisecond(0).toDate().getTime(),
  };
  const isDay = time => {
    const hour = moment(time).get('hour');
    const minute = moment(time).get('minute');
    const second = moment(time).get('second');
    const millisecond = moment(time).get('millisecond');
    if(hour || minute || second || millisecond) {
      return false;
    }
    return true;
  };
  const isHour = time => {
    const minute = moment(time).get('minute');
    const second = moment(time).get('second');
    const millisecond = moment(time).get('millisecond');
    if(minute || second || millisecond) {
      return false;
    }
    return true;
  };
  const is5min = time => {
    const minute = moment(time).get('minute');
    const second = moment(time).get('second');
    const millisecond = moment(time).get('millisecond');
    if(minute%5 || second || millisecond) {
      return false;
    }
    return true;
  };
  const next = (time, type) => {
    if(type === 'day') {
      return moment(time).add(1, 'days').hour(0).minute(0).second(0).millisecond(0).toDate().getTime();
    }
    if(type === 'hour') {
      return moment(time).add(1, 'hours').minute(0).second(0).millisecond(0).toDate().getTime();
    }
    if(type === '5min') {
      const getMinute = moment(time).get('minute');
      return moment(time).minute(getMinute - getMinute%5).add(5, 'minutes').second(0).millisecond(0).toDate().getTime();
    }
  };
  let timeStart = start;
  let timeEnd = end;
  while(timeStart < timeEnd) {
    if(isDay(timeStart) && next(timeStart, 'day') <= splitEnd.day && next(timeStart, 'day') <= end) {
      time.day.push([timeStart, next(timeStart, 'day')]);
      timeStart = next(timeStart, 'day');
    } else if(isHour(timeStart) && next(timeStart, 'hour') <= splitEnd.hour && next(timeStart, 'hour') <= end) {
      time.hour.push([timeStart, next(timeStart, 'hour')]);
      timeStart = next(timeStart, 'hour');
    } else if(is5min(timeStart) && next(timeStart, '5min') <= splitEnd.fiveMin && next(timeStart, '5min') <= end) {
      time.fiveMin.push([timeStart, next(timeStart, '5min')]);
      timeStart = next(timeStart, '5min');
    } else if(next(timeStart, '5min') <= end && timeStart === start) {
      time.origin.push([timeStart, next(timeStart, '5min')]);
      timeStart = next(timeStart, '5min');
    } else {
      time.origin.push([timeStart, timeEnd]);
      timeStart = timeEnd;
    }
  }
  return time;
};

const getFlowFromSplitTime = async (serverId, port, start, end) => {
  let where = {};
  if(serverId) { where.id = serverId; }
  if(port) { where.port = port; }
  const time = splitTime(start, end);
  const sum = [];
  const getFlow = (tableName, startTime, endTime) => {
    return knex(tableName)
    .sum('flow as sumFlow')
    .groupBy('id')
    .select(['id'])
    .where(where)
    .whereBetween('time', [startTime, endTime - 1]).then(success => {
      if(success[0]) { return success[0].sumFlow; }
      return 0;
    });
  };
  time.day.forEach(f => {
    sum.push(getFlow('saveFlowDay', f[0], f[1]));
  });
  time.hour.forEach(f => {
    sum.push(getFlow('saveFlowHour', f[0], f[1]));
  });
  time.fiveMin.forEach(f => {
    sum.push(getFlow('saveFlow5min', f[0], f[1]));
  });
  time.origin.forEach(f => {
    sum.push(getFlow('saveFlow', f[0], f[1]));
  });
  const result = await Promise.all(sum);
  const sumFlow = result.length ? result.reduce((a, b) => a + b) : 0;
  return sumFlow;
};

const getServerFlow = async (serverId, timeArray) => {
  const result = [];
  timeArray.forEach((time, index) => {
    if(index === timeArray.length - 1) {
      return;
    }
    const startTime = +time;
    const endTime = +timeArray[index + 1];
    let getFlow;
    result.push(getFlowFromSplitTime(serverId, 0, startTime, endTime));
  });
  return Promise.all(result);
};

const getServerPortFlow = async (serverId, port, timeArray, isMultiServerFlow) => {
  // const result = [];
  // timeArray.forEach((time, index) => {
  //   if(index === timeArray.length - 1) {
  //     return;
  //   }
  //   const startTime = time;
  //   const endTime = timeArray[index + 1];
  //   const getFlow = knex('saveFlow')
  //   .sum('flow as sumFlow')
  //   .groupBy('port')
  //   .select(['port'])
  //   .where(isMultiServerFlow ? { port } : { id: serverId, port })
  //   .whereBetween('time', [startTime, endTime]).then(success => {
  //     if(success[0]) { return success[0].sumFlow; }
  //     return 0;
  //   });
  //   result.push(getFlow);
  // });
  // return Promise.all(result);
  const result = [];
  timeArray.forEach((time, index) => {
    if(index === timeArray.length - 1) {
      return;
    }
    const startTime = +time;
    const endTime = +timeArray[index + 1];
    let getFlow;
    result.push(getFlowFromSplitTime(isMultiServerFlow ? 0 : serverId, port, startTime, endTime));
  });
  return Promise.all(result);
};

const getlastConnectTime = async (serverId, port) => {
  const lastConnectFromSaveFlow = await knex('saveFlow')
  .select(['time'])
  .where({ id: serverId, port })
  .orderBy('time', 'desc').limit(1).then(success => {
    if(success[0]) {
      return success[0].time;
    }
    return 0;
  });
  if(lastConnectFromSaveFlow) {
    return { lastConnect: lastConnectFromSaveFlow };
  }
  return knex('saveFlow5min')
  .select(['time'])
  .where({ id: serverId, port })
  .orderBy('time', 'desc').limit(1).then(success => {
    if(success[0]) {
      return { lastConnect: success[0].time };
    }
    return { lastConnect: 0 };
  });
};

const getUserPortLastConnect = async port => {
  const lastConnectFromSaveFlow = await knex('saveFlow')
  .select(['time'])
  .where({ port })
  .orderBy('time', 'desc').limit(1).then(success => {
    if(success[0]) {
      return success[0].time;
    }
    return 0;
  });
  if(lastConnectFromSaveFlow) {
    return { lastConnect: lastConnectFromSaveFlow };
  }
  return knex('saveFlow5min')
  .select(['time'])
  .where({ port })
  .orderBy('time', 'desc').limit(1).then(success => {
    if(success[0]) {
      return { lastConnect: success[0].time };
    }
    return { lastConnect: 0 };
  });
};

const getServerUserFlow = (serverId, timeArray) => {
  return knex('saveFlow5min').sum('saveFlow5min.flow as flow')
  .select([
    'saveFlow5min.port',
    'user.userName',
  ])
  .groupBy('saveFlow5min.port')
  .leftJoin('account_plugin', 'account_plugin.port', 'saveFlow5min.port')
  .leftJoin('user', 'account_plugin.userId', 'user.id')
  .where({
    'saveFlow5min.id': +serverId,
  }).whereBetween('saveFlow5min.time', timeArray);
};

const getAccountServerFlow = (accountId, timeArray) => {
  return knex('saveFlow5min').sum('saveFlow5min.flow as flow').groupBy('saveFlow5min.id')
  .select([
    'server.name',
  ])
  .leftJoin('server', 'server.id', 'saveFlow5min.id')
  .leftJoin('account_plugin', 'account_plugin.port', 'saveFlow5min.port')
  .where({ 'account_plugin.id': accountId })
  .whereBetween('saveFlow5min.time', timeArray);
  ;
};

exports.getFlow = getFlow;
exports.getServerFlow = getServerFlow;
exports.getServerPortFlow = getServerPortFlow;
exports.getServerUserFlow = getServerUserFlow;
exports.getlastConnectTime = getlastConnectTime;
exports.getAccountServerFlow = getAccountServerFlow;
exports.getUserPortLastConnect = getUserPortLastConnect;
