'use strict';

const config = appRequire('services/config').all();

let managerAddress = {
  host: config.manager.address.split(':')[0],
  port: +config.manager.address.split(':')[1],
  password: config.manager.password,
};

const setManagerAddress = (host, port, password) => {
  managerAddress.host = host;
  managerAddress.port = port;
  managerAddress.password = password;
};

const getManagerAddress = () => {
  return managerAddress;
};

exports.set = setManagerAddress;
exports.get = getManagerAddress;
