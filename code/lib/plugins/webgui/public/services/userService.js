const app = angular.module('app');

app.factory('userApi', ['$q', '$http', ($q, $http) => {
  let userAccountPromise = null;
  const getUserAccount = () => {
    if(userAccountPromise && !userAccountPromise.$$state.status) {
      return userAccountPromise;
    }
    let account = null;
    let servers = null;
    userAccountPromise = $q.all([
      $http.get('/api/user/account'),
      $http.get('/api/user/server'),
    ]).then(success => {
      return {
        account: success[0].data,
        servers: success[1].data.map(server => {
          if(server.host.indexOf(':') >= 0) {
            server.host = server.host.split(':')[1];
          }
          return server;
        }),
      };
    });
    return userAccountPromise;
  };

  const changePassword = (accountId, password) => {
    return $http.put(`/api/user/${ accountId }/password`, {
      password,
    });
  };
  const updateAccount = account => {
    if(!account.length) {
      $http.get('/api/user/account').then(success => {
        success.data.forEach(a => {
          account.push(a);
        });
      });
    } else {
      account.forEach((a, index) => {
        $http.get('/api/user/account/' + a.id).then(success => {
          if(!success.data.id) {
            account.splice(index, 1);
            return;
          }
          a.password = success.data.password;
          a.data = success.data.data;
          a.type = success.data.type;
        });
      });
    }
  };

  let serverPortDataPromise = {};
  const getServerPortData = (account, serverId, port) => {
    if(serverPortDataPromise[`${ account.id }`] && !serverPortDataPromise[`${ account.id }`].$$state.status) {
      return serverPortDataPromise[`${ account.id }`];
    }
    const Promises = [
      $http.get(`/api/user/flow/${ serverId }/${ port }/lastConnect`),
    ];
    if(account.type >= 2 && account.type <= 5) {
      Promises.push(
        $http.get(`/api/user/flow/${ serverId }/${ port }`)
      );
    }
    serverPortDataPromise[`${ account.id }`] = $q.all(Promises).then(success => {
      return {
        lastConnect: success[0].data.lastConnect,
        flow: success[1] ? success[1].data[0] : null,
      };
    });
    return serverPortDataPromise[`${ account.id }`];
  };

  const getNotice = () => {
    return $http.get('/api/user/notice').then(success => success.data);
  };

  const getAlipayStatus = () => {
    return $http.get('/api/user/status/alipay').then(success => success.data);
  };

  return {
    getServerPortData,
    getUserAccount,
    changePassword,
    updateAccount,
    getNotice,
    getAlipayStatus,
  };
}]);
