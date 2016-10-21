'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var mysql = _interopDefault(require('mysql'));
var path = _interopDefault(require('path'));
var fs = _interopDefault(require('fs'));

var asyncGenerator = function () {
  function AwaitValue(value) {
    this.value = value;
  }

  function AsyncGenerator(gen) {
    var front, back;

    function send(key, arg) {
      return new Promise(function (resolve, reject) {
        var request = {
          key: key,
          arg: arg,
          resolve: resolve,
          reject: reject,
          next: null
        };

        if (back) {
          back = back.next = request;
        } else {
          front = back = request;
          resume(key, arg);
        }
      });
    }

    function resume(key, arg) {
      try {
        var result = gen[key](arg);
        var value = result.value;

        if (value instanceof AwaitValue) {
          Promise.resolve(value.value).then(function (arg) {
            resume("next", arg);
          }, function (arg) {
            resume("throw", arg);
          });
        } else {
          settle(result.done ? "return" : "normal", result.value);
        }
      } catch (err) {
        settle("throw", err);
      }
    }

    function settle(type, value) {
      switch (type) {
        case "return":
          front.resolve({
            value: value,
            done: true
          });
          break;

        case "throw":
          front.reject(value);
          break;

        default:
          front.resolve({
            value: value,
            done: false
          });
          break;
      }

      front = front.next;

      if (front) {
        resume(front.key, front.arg);
      } else {
        back = null;
      }
    }

    this._invoke = send;

    if (typeof gen.return !== "function") {
      this.return = undefined;
    }
  }

  if (typeof Symbol === "function" && Symbol.asyncIterator) {
    AsyncGenerator.prototype[Symbol.asyncIterator] = function () {
      return this;
    };
  }

  AsyncGenerator.prototype.next = function (arg) {
    return this._invoke("next", arg);
  };

  AsyncGenerator.prototype.throw = function (arg) {
    return this._invoke("throw", arg);
  };

  AsyncGenerator.prototype.return = function (arg) {
    return this._invoke("return", arg);
  };

  return {
    wrap: function (fn) {
      return function () {
        return new AsyncGenerator(fn.apply(this, arguments));
      };
    },
    await: function (value) {
      return new AwaitValue(value);
    }
  };
}();





var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();







var _extends = Object.assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];

    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }

  return target;
};

var get = function get(object, property, receiver) {
  if (object === null) object = Function.prototype;
  var desc = Object.getOwnPropertyDescriptor(object, property);

  if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);

    if (parent === null) {
      return undefined;
    } else {
      return get(parent, property, receiver);
    }
  } else if ("value" in desc) {
    return desc.value;
  } else {
    var getter = desc.get;

    if (getter === undefined) {
      return undefined;
    }

    return getter.call(receiver);
  }
};











var objectWithoutProperties = function (obj, keys) {
  var target = {};

  for (var i in obj) {
    if (keys.indexOf(i) >= 0) continue;
    if (!Object.prototype.hasOwnProperty.call(obj, i)) continue;
    target[i] = obj[i];
  }

  return target;
};





var set = function set(object, property, value, receiver) {
  var desc = Object.getOwnPropertyDescriptor(object, property);

  if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);

    if (parent !== null) {
      set(parent, property, value, receiver);
    }
  } else if ("value" in desc && desc.writable) {
    desc.value = value;
  } else {
    var setter = desc.set;

    if (setter !== undefined) {
      setter.call(receiver, value);
    }
  }

  return value;
};

var defaultConnectionOptions = {
  password: '',
  sqlPath: './sql',
  transforms: {
    undefined: 'NULL',
    '': 'NULL',
    'NOW()': 'NOW()',
    'CURTIME()': 'CURTIME()'
  }
};

var MySql = function () {

  /**
   * Constructor (runs connection)
   */
  function MySql(options, errCallback) {
    classCallCheck(this, MySql);

    options = _extends({}, defaultConnectionOptions, options);
    var _options = options;
    var sqlPath = _options.sqlPath;
    var transforms = _options.transforms;
    var connectionOptions = objectWithoutProperties(_options, ['sqlPath', 'transforms']);

    this.connection = mysql.createConnection(connectionOptions);
    this.settings = { sqlPath: sqlPath, transforms: transforms };
    this.middleware = {
      onBeforeQuery: [],
      onResults: []
    };
    this.connection.connect(function (err) {
      if (typeof errCallback === 'function' && err) errCallback(err);
    });
  }

  /**
   * Run a SELECT statement
   */


  createClass(MySql, [{
    key: 'select',
    value: function select(sql) {
      var values = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      return this.query(sql, values).then(function (results) {
        return results.rows;
      });
    }

    /**
     * Run a SELECT statement from a file
     */

  }, {
    key: 'selectFile',
    value: function selectFile(filename) {
      var values = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      return this.queryFile(filename, values).then(function (results) {
        return results.rows;
      });
    }

    /**
     * Build and run a simple SELECT statement
     */

  }, {
    key: 'selectWhere',
    value: function selectWhere(fields, table, where) {
      where = this.sqlWhere(where);
      if (typeof fields === 'string') fields = fields.split(',');
      if (Array.isArray(fields)) fields = fields.map(function (field) {
        return '`' + field.trim() + '`';
      }).join(', ');
      return this.select('SELECT ' + fields + ' FROM `' + table + '` ' + where);
    }

    /**
     * Build and run an INSERT statement
     */

  }, {
    key: 'insert',
    value: function insert(table) {
      var values = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var sql = 'INSERT INTO `' + table + '` SET ' + this.createInsertValues(values);
      return this.query(sql);
    }

    /**
     * Build and run an UPDATE statement
     */

  }, {
    key: 'update',
    value: function update(table, values, where) {
      var sql = 'UPDATE `' + table + '` SET ' + this.createInsertValues(values) + ' ' + this.sqlWhere(where);
      return this.query(sql);
    }

    /**
     * Build and run a DELETE statement
     */

  }, {
    key: 'delete',
    value: function _delete(table, where) {
      var sql = 'DELETE FROM `' + table + '` ' + this.sqlWhere(where);
      return this.query(sql);
    }

    /**
     * Prepare and run a query with bound values. Return a promise
     */

  }, {
    key: 'query',
    value: function query(originalSql) {
      var _this = this;

      var values = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      return new Promise(function (res, rej) {

        // Apply Middleware
        var finalSql = _this.applyMiddlewareOnBeforeQuery(originalSql, values);

        // Bind dynamic values to SQL
        finalSql = _this.queryBindValues(finalSql, values).trim();

        _this.connection.query(finalSql, function (err, results, fields) {
          if (err) {
            rej({ err: err, sql: finalSql });
          } else {

            // When calling `connection.query`, the results returned are either "rows"
            // in the case of an SQL statement, or meta results in the case of non-SQL

            // Apply Middleware
            results = _this.applyMiddlewareOnResults(originalSql, results);

            // If sql is SELECT
            if (_this.isSelect(finalSql)) {

              // Results is the rows
              res({ rows: results, fields: fields, sql: finalSql });
            } else {
              res(_extends({}, results, { sql: finalSql }));
            }
          }
        });
      });
    }
  }, {
    key: 'queryFile',
    value: function queryFile(filename) {
      var _this2 = this;

      var values = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};


      // Get full path
      var filePath = path.resolve(path.join(this.settings.sqlPath, filename + (path.extname(filename) === '.sql' ? '' : '.sql')));

      return new Promise(function (res, rej) {
        // Read file and execute as SQL statement
        fs.readFile(filePath, 'utf8', function (err, sql) {
          if (err) {
            rej('Cannot find: ' + err.path);
          } else {
            sql = sql.trim();
            _this2.query(sql, values).then(res).catch(rej);
          }
        });
      });
    }

    /****************************************
      Helper Functions
    *****************************************/

    /**
     * Turns `SELECT * FROM user WHERE user_id = :user_id`, into
     *       `SELECT * FROM user WHERE user_id = 1`
     */

  }, {
    key: 'queryBindValues',
    value: function queryBindValues(query, values) {
      if (!values) return query;

      return query.replace(/\:(\w+)/gm, function (txt, key) {
        return values.hasOwnProperty(key) ? mysql.escape(values[key]) : txt;
      });
    }

    /**
     * Turns {user_id: 1, age: null}, into
     *       "WHERE user_id = 1 AND age IS NULL"
     */

  }, {
    key: 'sqlWhere',
    value: function sqlWhere(where) {
      if (!where) return;
      if (typeof where === 'string') return where;

      var whereArray = [];

      for (var key in where) {
        var value = where[key];
        if (value === null) {
          whereArray.push('`' + key + '` IS NULL');
        } else {
          whereArray.push('`' + key + '` = ' + mysql.escape(value));
        }
      }

      return 'WHERE ' + whereArray.join(' AND ');
    }

    /**
     * Turns {first_name: 'Brad', last_name: 'Westfall'}, into
     *       `first_name` = 'Brad', `last_name` = 'Westfall'
     */

  }, {
    key: 'createInsertValues',
    value: function createInsertValues(values) {
      var valuesArray = [];
      var transformedValues = this.transformValues(values);

      for (var key in transformedValues) {
        var value = transformedValues[key];
        valuesArray.push('`' + key + '` = ' + value);
      }

      return valuesArray.join();
    }

    /**
     * If the argument values match the keys of the this.transforms
     * object, then use the transforms value instead of the supplied value
     */

  }, {
    key: 'transformValues',
    value: function transformValues(values) {
      var newObj = {};

      for (var key in values) {
        var rawValue = values[key];
        var transform = this.settings.transforms[rawValue];
        var value = void 0;

        if (this.settings.transforms.hasOwnProperty(rawValue)) {
          value = typeof transform === 'function' ? transform(rawValue, values) : transform;
        } else {
          value = mysql.escape(rawValue);
        }

        newObj[key] = value;
      }

      return newObj;
    }
  }, {
    key: 'isSelect',
    value: function isSelect(sql) {
      return sql.trim().toUpperCase().match(/^SELECT/);
    }

    /****************************************
      Middleware
    *****************************************/

  }, {
    key: 'onResults',
    value: function onResults(middleware) {
      if (typeof middleware !== 'function') return;
      this.middleware.onResults.push(middleware);
    }
  }, {
    key: 'onBeforeQuery',
    value: function onBeforeQuery(middleware) {
      if (typeof middleware !== 'function') return;
      this.middleware.onBeforeQuery.push(middleware);
    }
  }, {
    key: 'applyMiddlewareOnResults',
    value: function applyMiddlewareOnResults(sql, results) {
      this.middleware.onResults.map(function (middleware) {
        results = middleware(sql, results);
      });
      return results;
    }
  }, {
    key: 'applyMiddlewareOnBeforeQuery',
    value: function applyMiddlewareOnBeforeQuery(sql, values) {
      this.middleware.onBeforeQuery.map(function (middleware) {
        sql = middleware(sql, values);
      });
      return sql;
    }
  }]);
  return MySql;
}();

module.exports = MySql;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjpudWxsLCJzb3VyY2VzIjpbIi4uL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBteXNxbCBmcm9tICdteXNxbCdcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgZnMgZnJvbSAnZnMnXG5cbmNvbnN0IGRlZmF1bHRDb25uZWN0aW9uT3B0aW9ucyA9IHtcbiAgcGFzc3dvcmQ6ICcnLFxuICBzcWxQYXRoOiAnLi9zcWwnLFxuICB0cmFuc2Zvcm1zOiB7XG4gICAgdW5kZWZpbmVkOiAnTlVMTCcsXG4gICAgJyc6ICdOVUxMJyxcbiAgICAnTk9XKCknOiAnTk9XKCknLFxuICAgICdDVVJUSU1FKCknOiAnQ1VSVElNRSgpJ1xuICB9XG59XG5cbmNsYXNzIE15U3FsIHtcblxuICAvKipcbiAgICogQ29uc3RydWN0b3IgKHJ1bnMgY29ubmVjdGlvbilcbiAgICovXG4gIGNvbnN0cnVjdG9yIChvcHRpb25zLCBlcnJDYWxsYmFjaykge1xuICAgIG9wdGlvbnMgPSB7Li4uZGVmYXVsdENvbm5lY3Rpb25PcHRpb25zLCAuLi5vcHRpb25zfVxuICAgIGNvbnN0IHtzcWxQYXRoLCB0cmFuc2Zvcm1zLCAuLi5jb25uZWN0aW9uT3B0aW9uc30gPSBvcHRpb25zXG4gICAgdGhpcy5jb25uZWN0aW9uID0gbXlzcWwuY3JlYXRlQ29ubmVjdGlvbihjb25uZWN0aW9uT3B0aW9ucylcbiAgICB0aGlzLnNldHRpbmdzID0ge3NxbFBhdGgsIHRyYW5zZm9ybXN9XG4gICAgdGhpcy5taWRkbGV3YXJlID0ge1xuICAgICAgICBvbkJlZm9yZVF1ZXJ5OiBbXSxcbiAgICAgICAgb25SZXN1bHRzOiBbXVxuICAgIH1cbiAgICB0aGlzLmNvbm5lY3Rpb24uY29ubmVjdChlcnIgPT4ge1xuICAgICAgaWYgKHR5cGVvZiBlcnJDYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJyAmJiBlcnIpIGVyckNhbGxiYWNrKGVycilcbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqIFJ1biBhIFNFTEVDVCBzdGF0ZW1lbnRcbiAgICovXG4gIHNlbGVjdChzcWwsIHZhbHVlcyA9IHt9KSB7XG4gICAgcmV0dXJuIHRoaXMucXVlcnkoc3FsLCB2YWx1ZXMpLnRoZW4ocmVzdWx0cyA9PiByZXN1bHRzLnJvd3MpXG4gIH1cblxuICAvKipcbiAgICogUnVuIGEgU0VMRUNUIHN0YXRlbWVudCBmcm9tIGEgZmlsZVxuICAgKi9cbiAgc2VsZWN0RmlsZShmaWxlbmFtZSwgdmFsdWVzID0ge30pIHtcbiAgICByZXR1cm4gdGhpcy5xdWVyeUZpbGUoZmlsZW5hbWUsIHZhbHVlcykudGhlbihyZXN1bHRzID0+IHJlc3VsdHMucm93cylcbiAgfVxuXG4gIC8qKlxuICAgKiBCdWlsZCBhbmQgcnVuIGEgc2ltcGxlIFNFTEVDVCBzdGF0ZW1lbnRcbiAgICovXG4gIHNlbGVjdFdoZXJlKGZpZWxkcywgdGFibGUsIHdoZXJlKSB7XG4gICAgd2hlcmUgPSB0aGlzLnNxbFdoZXJlKHdoZXJlKVxuICAgIGlmICh0eXBlb2YgZmllbGRzID09PSAnc3RyaW5nJykgZmllbGRzID0gZmllbGRzLnNwbGl0KCcsJylcbiAgICBpZiAoQXJyYXkuaXNBcnJheShmaWVsZHMpKSBmaWVsZHMgPSBmaWVsZHMubWFwKGZpZWxkID0+ICdgJyArIGZpZWxkLnRyaW0oKSArICdgJykuam9pbignLCAnKVxuICAgIHJldHVybiB0aGlzLnNlbGVjdChgU0VMRUNUICR7ZmllbGRzfSBGUk9NIFxcYCR7dGFibGV9XFxgICR7d2hlcmV9YClcbiAgfVxuXG4gIC8qKlxuICAgKiBCdWlsZCBhbmQgcnVuIGFuIElOU0VSVCBzdGF0ZW1lbnRcbiAgICovXG4gIGluc2VydCh0YWJsZSwgdmFsdWVzID0ge30pIHtcbiAgICBjb25zdCBzcWwgPSBgSU5TRVJUIElOVE8gXFxgJHt0YWJsZX1cXGAgU0VUICR7dGhpcy5jcmVhdGVJbnNlcnRWYWx1ZXModmFsdWVzKX1gXG4gICAgcmV0dXJuIHRoaXMucXVlcnkoc3FsKVxuICB9XG5cbiAgLyoqXG4gICAqIEJ1aWxkIGFuZCBydW4gYW4gVVBEQVRFIHN0YXRlbWVudFxuICAgKi9cbiAgdXBkYXRlKHRhYmxlLCB2YWx1ZXMsIHdoZXJlKSB7XG4gICAgY29uc3Qgc3FsID0gYFVQREFURSBcXGAke3RhYmxlfVxcYCBTRVQgJHt0aGlzLmNyZWF0ZUluc2VydFZhbHVlcyh2YWx1ZXMpfSAke3RoaXMuc3FsV2hlcmUod2hlcmUpfWBcbiAgICByZXR1cm4gdGhpcy5xdWVyeShzcWwpXG4gIH1cblxuICAvKipcbiAgICogQnVpbGQgYW5kIHJ1biBhIERFTEVURSBzdGF0ZW1lbnRcbiAgICovXG4gIGRlbGV0ZSh0YWJsZSwgd2hlcmUpIHtcbiAgICBjb25zdCBzcWwgPSBgREVMRVRFIEZST00gXFxgJHt0YWJsZX1cXGAgJHt0aGlzLnNxbFdoZXJlKHdoZXJlKX1gXG4gICAgcmV0dXJuIHRoaXMucXVlcnkoc3FsKVxuICB9XG5cbiAgLyoqXG4gICAqIFByZXBhcmUgYW5kIHJ1biBhIHF1ZXJ5IHdpdGggYm91bmQgdmFsdWVzLiBSZXR1cm4gYSBwcm9taXNlXG4gICAqL1xuICBxdWVyeShvcmlnaW5hbFNxbCwgdmFsdWVzID0ge30pIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlcywgcmVqKSA9PiB7XG5cbiAgICAgIC8vIEFwcGx5IE1pZGRsZXdhcmVcbiAgICAgIGxldCBmaW5hbFNxbCA9IHRoaXMuYXBwbHlNaWRkbGV3YXJlT25CZWZvcmVRdWVyeShvcmlnaW5hbFNxbCwgdmFsdWVzKVxuXG4gICAgICAvLyBCaW5kIGR5bmFtaWMgdmFsdWVzIHRvIFNRTFxuICAgICAgZmluYWxTcWwgPSB0aGlzLnF1ZXJ5QmluZFZhbHVlcyhmaW5hbFNxbCwgdmFsdWVzKS50cmltKClcblxuICAgICAgdGhpcy5jb25uZWN0aW9uLnF1ZXJ5KGZpbmFsU3FsLCAoZXJyLCByZXN1bHRzLCBmaWVsZHMpID0+IHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIHJlaih7ZXJyLCBzcWw6IGZpbmFsU3FsfSlcbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgIC8vIFdoZW4gY2FsbGluZyBgY29ubmVjdGlvbi5xdWVyeWAsIHRoZSByZXN1bHRzIHJldHVybmVkIGFyZSBlaXRoZXIgXCJyb3dzXCJcbiAgICAgICAgICAvLyBpbiB0aGUgY2FzZSBvZiBhbiBTUUwgc3RhdGVtZW50LCBvciBtZXRhIHJlc3VsdHMgaW4gdGhlIGNhc2Ugb2Ygbm9uLVNRTFxuXG4gICAgICAgICAgLy8gQXBwbHkgTWlkZGxld2FyZVxuICAgICAgICAgIHJlc3VsdHMgPSB0aGlzLmFwcGx5TWlkZGxld2FyZU9uUmVzdWx0cyhvcmlnaW5hbFNxbCwgcmVzdWx0cylcblxuICAgICAgICAgIC8vIElmIHNxbCBpcyBTRUxFQ1RcbiAgICAgICAgICBpZiAodGhpcy5pc1NlbGVjdChmaW5hbFNxbCkpIHtcblxuICAgICAgICAgICAgLy8gUmVzdWx0cyBpcyB0aGUgcm93c1xuICAgICAgICAgICAgcmVzKHsgcm93czogcmVzdWx0cywgZmllbGRzLCBzcWw6IGZpbmFsU3FsfSlcblxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXMoeyAuLi5yZXN1bHRzLCBzcWw6IGZpbmFsU3FsIH0pXG4gICAgICAgICAgfVxuXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSlcbiAgfVxuXG4gIHF1ZXJ5RmlsZShmaWxlbmFtZSwgdmFsdWVzID0ge30pIHtcblxuICAgIC8vIEdldCBmdWxsIHBhdGhcbiAgICBjb25zdCBmaWxlUGF0aCA9IHBhdGgucmVzb2x2ZShwYXRoLmpvaW4oXG4gICAgICB0aGlzLnNldHRpbmdzLnNxbFBhdGgsXG4gICAgICBmaWxlbmFtZSArIChwYXRoLmV4dG5hbWUoZmlsZW5hbWUpID09PSAnLnNxbCcgPyAnJyA6ICcuc3FsJylcbiAgICApKVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXMsIHJlaikgPT4ge1xuICAgICAgLy8gUmVhZCBmaWxlIGFuZCBleGVjdXRlIGFzIFNRTCBzdGF0ZW1lbnRcbiAgICAgIGZzLnJlYWRGaWxlKGZpbGVQYXRoLCAndXRmOCcsIChlcnIsIHNxbCkgPT4ge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgcmVqKCdDYW5ub3QgZmluZDogJyArIGVyci5wYXRoKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNxbCA9IHNxbC50cmltKClcbiAgICAgICAgICB0aGlzLnF1ZXJ5KHNxbCwgdmFsdWVzKS50aGVuKHJlcykuY2F0Y2gocmVqKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0pXG4gIH1cblxuICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgIEhlbHBlciBGdW5jdGlvbnNcbiAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgLyoqXG4gICAqIFR1cm5zIGBTRUxFQ1QgKiBGUk9NIHVzZXIgV0hFUkUgdXNlcl9pZCA9IDp1c2VyX2lkYCwgaW50b1xuICAgKiAgICAgICBgU0VMRUNUICogRlJPTSB1c2VyIFdIRVJFIHVzZXJfaWQgPSAxYFxuICAgKi9cbiAgcXVlcnlCaW5kVmFsdWVzKHF1ZXJ5LCB2YWx1ZXMpIHtcbiAgICBpZiAoIXZhbHVlcykgcmV0dXJuIHF1ZXJ5XG5cbiAgICByZXR1cm4gcXVlcnkucmVwbGFjZSgvXFw6KFxcdyspL2dtLCAodHh0LCBrZXkpID0+XG4gICAgICB2YWx1ZXMuaGFzT3duUHJvcGVydHkoa2V5KSA/IG15c3FsLmVzY2FwZSh2YWx1ZXNba2V5XSkgOiB0eHRcbiAgICApXG4gIH1cblxuICAvKipcbiAgICogVHVybnMge3VzZXJfaWQ6IDEsIGFnZTogbnVsbH0sIGludG9cbiAgICogICAgICAgXCJXSEVSRSB1c2VyX2lkID0gMSBBTkQgYWdlIElTIE5VTExcIlxuICAgKi9cbiAgc3FsV2hlcmUod2hlcmUpIHtcbiAgICBpZiAoIXdoZXJlKSByZXR1cm5cbiAgICBpZiAodHlwZW9mIHdoZXJlID09PSAnc3RyaW5nJykgcmV0dXJuIHdoZXJlXG5cbiAgICBjb25zdCB3aGVyZUFycmF5ID0gW11cblxuICAgIGZvciAobGV0IGtleSBpbiB3aGVyZSkge1xuICAgICAgbGV0IHZhbHVlID0gd2hlcmVba2V5XVxuICAgICAgaWYgKHZhbHVlID09PSBudWxsKSB7XG4gICAgICAgIHdoZXJlQXJyYXkucHVzaCgnYCcgKyBrZXkgKyAnYCBJUyBOVUxMJylcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHdoZXJlQXJyYXkucHVzaCgnYCcgKyBrZXkgKyAnYCA9ICcgKyBteXNxbC5lc2NhcGUodmFsdWUpKVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiAnV0hFUkUgJyArIHdoZXJlQXJyYXkuam9pbignIEFORCAnKVxuICB9XG5cbiAgLyoqXG4gICAqIFR1cm5zIHtmaXJzdF9uYW1lOiAnQnJhZCcsIGxhc3RfbmFtZTogJ1dlc3RmYWxsJ30sIGludG9cbiAgICogICAgICAgYGZpcnN0X25hbWVgID0gJ0JyYWQnLCBgbGFzdF9uYW1lYCA9ICdXZXN0ZmFsbCdcbiAgICovXG4gIGNyZWF0ZUluc2VydFZhbHVlcyh2YWx1ZXMpIHtcbiAgICBjb25zdCB2YWx1ZXNBcnJheSA9IFtdXG4gICAgY29uc3QgdHJhbnNmb3JtZWRWYWx1ZXMgPSB0aGlzLnRyYW5zZm9ybVZhbHVlcyh2YWx1ZXMpXG5cbiAgICBmb3IgKGxldCBrZXkgaW4gdHJhbnNmb3JtZWRWYWx1ZXMpIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gdHJhbnNmb3JtZWRWYWx1ZXNba2V5XVxuICAgICAgdmFsdWVzQXJyYXkucHVzaChgXFxgJHtrZXl9XFxgID0gJHt2YWx1ZX1gKVxuICAgIH1cblxuICAgIHJldHVybiB2YWx1ZXNBcnJheS5qb2luKClcbiAgfVxuXG4gIC8qKlxuICAgKiBJZiB0aGUgYXJndW1lbnQgdmFsdWVzIG1hdGNoIHRoZSBrZXlzIG9mIHRoZSB0aGlzLnRyYW5zZm9ybXNcbiAgICogb2JqZWN0LCB0aGVuIHVzZSB0aGUgdHJhbnNmb3JtcyB2YWx1ZSBpbnN0ZWFkIG9mIHRoZSBzdXBwbGllZCB2YWx1ZVxuICAgKi9cbiAgdHJhbnNmb3JtVmFsdWVzKHZhbHVlcykge1xuICAgIGNvbnN0IG5ld09iaiA9IHt9XG5cbiAgICBmb3IgKGxldCBrZXkgaW4gdmFsdWVzKSB7XG4gICAgICBjb25zdCByYXdWYWx1ZSA9IHZhbHVlc1trZXldXG4gICAgICBjb25zdCB0cmFuc2Zvcm0gPSB0aGlzLnNldHRpbmdzLnRyYW5zZm9ybXNbcmF3VmFsdWVdXG4gICAgICBsZXQgdmFsdWVcblxuICAgICAgaWYgKHRoaXMuc2V0dGluZ3MudHJhbnNmb3Jtcy5oYXNPd25Qcm9wZXJ0eShyYXdWYWx1ZSkpIHtcbiAgICAgICAgdmFsdWUgPSB0eXBlb2YgdHJhbnNmb3JtID09PSAnZnVuY3Rpb24nID8gdHJhbnNmb3JtKHJhd1ZhbHVlLCB2YWx1ZXMpIDogdHJhbnNmb3JtXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YWx1ZSA9IG15c3FsLmVzY2FwZShyYXdWYWx1ZSlcbiAgICAgIH1cblxuICAgICAgbmV3T2JqW2tleV0gPSB2YWx1ZVxuICAgIH1cblxuICAgIHJldHVybiBuZXdPYmpcbiAgfVxuXG4gIGlzU2VsZWN0KHNxbCkge1xuICAgIHJldHVybiBzcWwudHJpbSgpLnRvVXBwZXJDYXNlKCkubWF0Y2goL15TRUxFQ1QvKVxuICB9XG5cblxuICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgIE1pZGRsZXdhcmVcbiAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgb25SZXN1bHRzKG1pZGRsZXdhcmUpIHtcbiAgICBpZiAodHlwZW9mIG1pZGRsZXdhcmUgIT09ICdmdW5jdGlvbicpIHJldHVyblxuICAgIHRoaXMubWlkZGxld2FyZS5vblJlc3VsdHMucHVzaChtaWRkbGV3YXJlKVxuICB9XG5cbiAgb25CZWZvcmVRdWVyeShtaWRkbGV3YXJlKSB7XG4gICAgaWYgKHR5cGVvZiBtaWRkbGV3YXJlICE9PSAnZnVuY3Rpb24nKSByZXR1cm5cbiAgICB0aGlzLm1pZGRsZXdhcmUub25CZWZvcmVRdWVyeS5wdXNoKG1pZGRsZXdhcmUpXG4gIH1cblxuICBhcHBseU1pZGRsZXdhcmVPblJlc3VsdHMoc3FsLCByZXN1bHRzKSB7XG4gICAgdGhpcy5taWRkbGV3YXJlLm9uUmVzdWx0cy5tYXAobWlkZGxld2FyZSA9PiB7XG4gICAgICByZXN1bHRzID0gbWlkZGxld2FyZShzcWwsIHJlc3VsdHMpXG4gICAgfSlcbiAgICByZXR1cm4gcmVzdWx0c1xuICB9XG5cbiAgYXBwbHlNaWRkbGV3YXJlT25CZWZvcmVRdWVyeShzcWwsIHZhbHVlcykge1xuICAgIHRoaXMubWlkZGxld2FyZS5vbkJlZm9yZVF1ZXJ5Lm1hcChtaWRkbGV3YXJlID0+IHtcbiAgICAgIHNxbCA9IG1pZGRsZXdhcmUoc3FsLCB2YWx1ZXMpXG4gICAgfSlcbiAgICByZXR1cm4gc3FsXG4gIH1cblxufVxuXG5leHBvcnQgZGVmYXVsdCBNeVNxbFxuIl0sIm5hbWVzIjpbImRlZmF1bHRDb25uZWN0aW9uT3B0aW9ucyIsIk15U3FsIiwib3B0aW9ucyIsImVyckNhbGxiYWNrIiwic3FsUGF0aCIsInRyYW5zZm9ybXMiLCJjb25uZWN0aW9uT3B0aW9ucyIsImNvbm5lY3Rpb24iLCJteXNxbCIsImNyZWF0ZUNvbm5lY3Rpb24iLCJzZXR0aW5ncyIsIm1pZGRsZXdhcmUiLCJjb25uZWN0IiwiZXJyIiwic3FsIiwidmFsdWVzIiwicXVlcnkiLCJ0aGVuIiwicmVzdWx0cyIsInJvd3MiLCJmaWxlbmFtZSIsInF1ZXJ5RmlsZSIsImZpZWxkcyIsInRhYmxlIiwid2hlcmUiLCJzcWxXaGVyZSIsInNwbGl0IiwiQXJyYXkiLCJpc0FycmF5IiwibWFwIiwiZmllbGQiLCJ0cmltIiwiam9pbiIsInNlbGVjdCIsImNyZWF0ZUluc2VydFZhbHVlcyIsIm9yaWdpbmFsU3FsIiwiUHJvbWlzZSIsInJlcyIsInJlaiIsImZpbmFsU3FsIiwiYXBwbHlNaWRkbGV3YXJlT25CZWZvcmVRdWVyeSIsInF1ZXJ5QmluZFZhbHVlcyIsImFwcGx5TWlkZGxld2FyZU9uUmVzdWx0cyIsImlzU2VsZWN0IiwiZmlsZVBhdGgiLCJwYXRoIiwicmVzb2x2ZSIsImV4dG5hbWUiLCJyZWFkRmlsZSIsImNhdGNoIiwicmVwbGFjZSIsInR4dCIsImtleSIsImhhc093blByb3BlcnR5IiwiZXNjYXBlIiwid2hlcmVBcnJheSIsInZhbHVlIiwicHVzaCIsInZhbHVlc0FycmF5IiwidHJhbnNmb3JtZWRWYWx1ZXMiLCJ0cmFuc2Zvcm1WYWx1ZXMiLCJuZXdPYmoiLCJyYXdWYWx1ZSIsInRyYW5zZm9ybSIsInRvVXBwZXJDYXNlIiwibWF0Y2giLCJvblJlc3VsdHMiLCJvbkJlZm9yZVF1ZXJ5Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUlBLElBQU1BLDJCQUEyQjtZQUNyQixFQURxQjtXQUV0QixPQUZzQjtjQUduQjtlQUNDLE1BREQ7UUFFTixNQUZNO2FBR0QsT0FIQztpQkFJRzs7Q0FQakI7O0lBV01DOzs7OztpQkFLU0MsT0FBYixFQUFzQkMsV0FBdEIsRUFBbUM7OzsyQkFDbkJILHdCQUFkLEVBQTJDRSxPQUEzQzttQkFDb0RBLE9BRm5CO1FBRTFCRSxPQUYwQixZQUUxQkEsT0FGMEI7UUFFakJDLFVBRmlCLFlBRWpCQSxVQUZpQjtRQUVGQyxpQkFGRTs7U0FHNUJDLFVBQUwsR0FBa0JDLE1BQU1DLGdCQUFOLENBQXVCSCxpQkFBdkIsQ0FBbEI7U0FDS0ksUUFBTCxHQUFnQixFQUFDTixnQkFBRCxFQUFVQyxzQkFBVixFQUFoQjtTQUNLTSxVQUFMLEdBQWtCO3FCQUNDLEVBREQ7aUJBRUg7S0FGZjtTQUlLSixVQUFMLENBQWdCSyxPQUFoQixDQUF3QixlQUFPO1VBQ3pCLE9BQU9ULFdBQVAsS0FBdUIsVUFBdkIsSUFBcUNVLEdBQXpDLEVBQThDVixZQUFZVSxHQUFaO0tBRGhEOzs7Ozs7Ozs7OzJCQVFLQyxLQUFrQjtVQUFiQyxNQUFhLHVFQUFKLEVBQUk7O2FBQ2hCLEtBQUtDLEtBQUwsQ0FBV0YsR0FBWCxFQUFnQkMsTUFBaEIsRUFBd0JFLElBQXhCLENBQTZCO2VBQVdDLFFBQVFDLElBQW5CO09BQTdCLENBQVA7Ozs7Ozs7OzsrQkFNU0MsVUFBdUI7VUFBYkwsTUFBYSx1RUFBSixFQUFJOzthQUN6QixLQUFLTSxTQUFMLENBQWVELFFBQWYsRUFBeUJMLE1BQXpCLEVBQWlDRSxJQUFqQyxDQUFzQztlQUFXQyxRQUFRQyxJQUFuQjtPQUF0QyxDQUFQOzs7Ozs7Ozs7Z0NBTVVHLFFBQVFDLE9BQU9DLE9BQU87Y0FDeEIsS0FBS0MsUUFBTCxDQUFjRCxLQUFkLENBQVI7VUFDSSxPQUFPRixNQUFQLEtBQWtCLFFBQXRCLEVBQWdDQSxTQUFTQSxPQUFPSSxLQUFQLENBQWEsR0FBYixDQUFUO1VBQzVCQyxNQUFNQyxPQUFOLENBQWNOLE1BQWQsQ0FBSixFQUEyQkEsU0FBU0EsT0FBT08sR0FBUCxDQUFXO2VBQVMsTUFBTUMsTUFBTUMsSUFBTixFQUFOLEdBQXFCLEdBQTlCO09BQVgsRUFBOENDLElBQTlDLENBQW1ELElBQW5ELENBQVQ7YUFDcEIsS0FBS0MsTUFBTCxhQUFzQlgsTUFBdEIsZUFBdUNDLEtBQXZDLFVBQWtEQyxLQUFsRCxDQUFQOzs7Ozs7Ozs7MkJBTUtELE9BQW9CO1VBQWJSLE1BQWEsdUVBQUosRUFBSTs7VUFDbkJELHdCQUF1QlMsS0FBdkIsY0FBc0MsS0FBS1csa0JBQUwsQ0FBd0JuQixNQUF4QixDQUE1QzthQUNPLEtBQUtDLEtBQUwsQ0FBV0YsR0FBWCxDQUFQOzs7Ozs7Ozs7MkJBTUtTLE9BQU9SLFFBQVFTLE9BQU87VUFDckJWLG1CQUFrQlMsS0FBbEIsY0FBaUMsS0FBS1csa0JBQUwsQ0FBd0JuQixNQUF4QixDQUFqQyxTQUFvRSxLQUFLVSxRQUFMLENBQWNELEtBQWQsQ0FBMUU7YUFDTyxLQUFLUixLQUFMLENBQVdGLEdBQVgsQ0FBUDs7Ozs7Ozs7OzRCQU1LUyxPQUFPQyxPQUFPO1VBQ2JWLHdCQUF1QlMsS0FBdkIsVUFBa0MsS0FBS0UsUUFBTCxDQUFjRCxLQUFkLENBQXhDO2FBQ08sS0FBS1IsS0FBTCxDQUFXRixHQUFYLENBQVA7Ozs7Ozs7OzswQkFNSXFCLGFBQTBCOzs7VUFBYnBCLE1BQWEsdUVBQUosRUFBSTs7YUFDdkIsSUFBSXFCLE9BQUosQ0FBWSxVQUFDQyxHQUFELEVBQU1DLEdBQU4sRUFBYzs7O1lBRzNCQyxXQUFXLE1BQUtDLDRCQUFMLENBQWtDTCxXQUFsQyxFQUErQ3BCLE1BQS9DLENBQWY7OzttQkFHVyxNQUFLMEIsZUFBTCxDQUFxQkYsUUFBckIsRUFBK0J4QixNQUEvQixFQUF1Q2dCLElBQXZDLEVBQVg7O2NBRUt4QixVQUFMLENBQWdCUyxLQUFoQixDQUFzQnVCLFFBQXRCLEVBQWdDLFVBQUMxQixHQUFELEVBQU1LLE9BQU4sRUFBZUksTUFBZixFQUEwQjtjQUNwRFQsR0FBSixFQUFTO2dCQUNILEVBQUNBLFFBQUQsRUFBTUMsS0FBS3lCLFFBQVgsRUFBSjtXQURGLE1BRU87Ozs7OztzQkFNSyxNQUFLRyx3QkFBTCxDQUE4QlAsV0FBOUIsRUFBMkNqQixPQUEzQyxDQUFWOzs7Z0JBR0ksTUFBS3lCLFFBQUwsQ0FBY0osUUFBZCxDQUFKLEVBQTZCOzs7a0JBR3ZCLEVBQUVwQixNQUFNRCxPQUFSLEVBQWlCSSxjQUFqQixFQUF5QlIsS0FBS3lCLFFBQTlCLEVBQUo7YUFIRixNQUtPOytCQUNJckIsT0FBVCxJQUFrQkosS0FBS3lCLFFBQXZCOzs7U0FsQk47T0FSSyxDQUFQOzs7OzhCQWtDUW5CLFVBQXVCOzs7VUFBYkwsTUFBYSx1RUFBSixFQUFJOzs7O1VBR3pCNkIsV0FBV0MsS0FBS0MsT0FBTCxDQUFhRCxLQUFLYixJQUFMLENBQzVCLEtBQUt0QixRQUFMLENBQWNOLE9BRGMsRUFFNUJnQixZQUFZeUIsS0FBS0UsT0FBTCxDQUFhM0IsUUFBYixNQUEyQixNQUEzQixHQUFvQyxFQUFwQyxHQUF5QyxNQUFyRCxDQUY0QixDQUFiLENBQWpCOzthQUtPLElBQUlnQixPQUFKLENBQVksVUFBQ0MsR0FBRCxFQUFNQyxHQUFOLEVBQWM7O1dBRTVCVSxRQUFILENBQVlKLFFBQVosRUFBc0IsTUFBdEIsRUFBOEIsVUFBQy9CLEdBQUQsRUFBTUMsR0FBTixFQUFjO2NBQ3RDRCxHQUFKLEVBQVM7Z0JBQ0gsa0JBQWtCQSxJQUFJZ0MsSUFBMUI7V0FERixNQUVPO2tCQUNDL0IsSUFBSWlCLElBQUosRUFBTjttQkFDS2YsS0FBTCxDQUFXRixHQUFYLEVBQWdCQyxNQUFoQixFQUF3QkUsSUFBeEIsQ0FBNkJvQixHQUE3QixFQUFrQ1ksS0FBbEMsQ0FBd0NYLEdBQXhDOztTQUxKO09BRkssQ0FBUDs7Ozs7Ozs7Ozs7Ozs7b0NBcUJjdEIsT0FBT0QsUUFBUTtVQUN6QixDQUFDQSxNQUFMLEVBQWEsT0FBT0MsS0FBUDs7YUFFTkEsTUFBTWtDLE9BQU4sQ0FBYyxXQUFkLEVBQTJCLFVBQUNDLEdBQUQsRUFBTUMsR0FBTjtlQUNoQ3JDLE9BQU9zQyxjQUFQLENBQXNCRCxHQUF0QixJQUE2QjVDLE1BQU04QyxNQUFOLENBQWF2QyxPQUFPcUMsR0FBUCxDQUFiLENBQTdCLEdBQXlERCxHQUR6QjtPQUEzQixDQUFQOzs7Ozs7Ozs7OzZCQVNPM0IsT0FBTztVQUNWLENBQUNBLEtBQUwsRUFBWTtVQUNSLE9BQU9BLEtBQVAsS0FBaUIsUUFBckIsRUFBK0IsT0FBT0EsS0FBUDs7VUFFekIrQixhQUFhLEVBQW5COztXQUVLLElBQUlILEdBQVQsSUFBZ0I1QixLQUFoQixFQUF1QjtZQUNqQmdDLFFBQVFoQyxNQUFNNEIsR0FBTixDQUFaO1lBQ0lJLFVBQVUsSUFBZCxFQUFvQjtxQkFDUEMsSUFBWCxDQUFnQixNQUFNTCxHQUFOLEdBQVksV0FBNUI7U0FERixNQUVPO3FCQUNNSyxJQUFYLENBQWdCLE1BQU1MLEdBQU4sR0FBWSxNQUFaLEdBQXFCNUMsTUFBTThDLE1BQU4sQ0FBYUUsS0FBYixDQUFyQzs7OzthQUlHLFdBQVdELFdBQVd2QixJQUFYLENBQWdCLE9BQWhCLENBQWxCOzs7Ozs7Ozs7O3VDQU9pQmpCLFFBQVE7VUFDbkIyQyxjQUFjLEVBQXBCO1VBQ01DLG9CQUFvQixLQUFLQyxlQUFMLENBQXFCN0MsTUFBckIsQ0FBMUI7O1dBRUssSUFBSXFDLEdBQVQsSUFBZ0JPLGlCQUFoQixFQUFtQztZQUMzQkgsUUFBUUcsa0JBQWtCUCxHQUFsQixDQUFkO29CQUNZSyxJQUFaLE9BQXNCTCxHQUF0QixZQUFpQ0ksS0FBakM7OzthQUdLRSxZQUFZMUIsSUFBWixFQUFQOzs7Ozs7Ozs7O29DQU9jakIsUUFBUTtVQUNoQjhDLFNBQVMsRUFBZjs7V0FFSyxJQUFJVCxHQUFULElBQWdCckMsTUFBaEIsRUFBd0I7WUFDaEIrQyxXQUFXL0MsT0FBT3FDLEdBQVAsQ0FBakI7WUFDTVcsWUFBWSxLQUFLckQsUUFBTCxDQUFjTCxVQUFkLENBQXlCeUQsUUFBekIsQ0FBbEI7WUFDSU4sY0FBSjs7WUFFSSxLQUFLOUMsUUFBTCxDQUFjTCxVQUFkLENBQXlCZ0QsY0FBekIsQ0FBd0NTLFFBQXhDLENBQUosRUFBdUQ7a0JBQzdDLE9BQU9DLFNBQVAsS0FBcUIsVUFBckIsR0FBa0NBLFVBQVVELFFBQVYsRUFBb0IvQyxNQUFwQixDQUFsQyxHQUFnRWdELFNBQXhFO1NBREYsTUFFTztrQkFDR3ZELE1BQU04QyxNQUFOLENBQWFRLFFBQWIsQ0FBUjs7O2VBR0tWLEdBQVAsSUFBY0ksS0FBZDs7O2FBR0tLLE1BQVA7Ozs7NkJBR08vQyxLQUFLO2FBQ0xBLElBQUlpQixJQUFKLEdBQVdpQyxXQUFYLEdBQXlCQyxLQUF6QixDQUErQixTQUEvQixDQUFQOzs7Ozs7Ozs7OEJBUVF0RCxZQUFZO1VBQ2hCLE9BQU9BLFVBQVAsS0FBc0IsVUFBMUIsRUFBc0M7V0FDakNBLFVBQUwsQ0FBZ0J1RCxTQUFoQixDQUEwQlQsSUFBMUIsQ0FBK0I5QyxVQUEvQjs7OztrQ0FHWUEsWUFBWTtVQUNwQixPQUFPQSxVQUFQLEtBQXNCLFVBQTFCLEVBQXNDO1dBQ2pDQSxVQUFMLENBQWdCd0QsYUFBaEIsQ0FBOEJWLElBQTlCLENBQW1DOUMsVUFBbkM7Ozs7NkNBR3VCRyxLQUFLSSxTQUFTO1dBQ2hDUCxVQUFMLENBQWdCdUQsU0FBaEIsQ0FBMEJyQyxHQUExQixDQUE4QixzQkFBYztrQkFDaENsQixXQUFXRyxHQUFYLEVBQWdCSSxPQUFoQixDQUFWO09BREY7YUFHT0EsT0FBUDs7OztpREFHMkJKLEtBQUtDLFFBQVE7V0FDbkNKLFVBQUwsQ0FBZ0J3RCxhQUFoQixDQUE4QnRDLEdBQTlCLENBQWtDLHNCQUFjO2NBQ3hDbEIsV0FBV0csR0FBWCxFQUFnQkMsTUFBaEIsQ0FBTjtPQURGO2FBR09ELEdBQVA7Ozs7SUFLSjs7In0=
