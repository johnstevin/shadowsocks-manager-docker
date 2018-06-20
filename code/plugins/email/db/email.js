'use strict';

const knex = appRequire('init/knex').knex;
const tableName = 'email';

const config = appRequire('services/config').all();
const createTable = async() => {
  if(config.empty) {
    await knex.schema.dropTableIfExists(tableName);
  }
  return knex.schema.createTableIfNotExists(tableName, function(table) {
    table.string('to');
    table.string('subject');
    table.string('text');
    table.string('type');
    table.string('remark');
    table.string('ip');
    table.string('session');
    table.bigInteger('time');
  });
};

exports.createTable = createTable;
