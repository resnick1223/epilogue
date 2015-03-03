'use strict';

var request = require('request'),
    expect = require('chai').expect,
    _ = require('lodash'),
    rest = require('../../lib'),
    test = require('../support'),
    Promise = test.Sequelize.Promise;

describe('Associations(HasOne)', function() {
  before(function() {
    test.models.User = test.db.define('users', {
      id: { type: test.Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      username: { type: test.Sequelize.STRING, unique: true },
      email: { type: test.Sequelize.STRING, unique: true, validate: { isEmail: true } }
    }, {
      underscored: true,
      timestamps: false
    });

    test.models.Address = test.db.define('addresses', {
      id: { type: test.Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      street: { type: test.Sequelize.STRING },
      state_province: { type: test.Sequelize.STRING },
      postal_code: { type: test.Sequelize.STRING },
      country_code: { type: test.Sequelize.STRING }
    }, {
      underscored: true,
      timestamps: false
    });

    test.models.User.hasOne(test.models.Address);
  });

  beforeEach(function(done) {
    test.initializeDatabase(function() {
      test.initializeServer(function() {
        rest.initialize({
          app: test.app,
          sequelize: test.Sequelize
        });

        rest.resource({
          model: test.models.User,
          endpoints: ['/users', '/users/:id'],
          associations: true
        });

        done();
      });
    });
  });

  afterEach(function(done) {
    test.clearDatabase(function() {
      test.server.close(done);
    });
  });

  // TESTS
  describe('read', function() {
    beforeEach(function() {
      return Promise.all([
        test.models.Address.create({
          street: '221B Baker Street',
          state_province: 'London',
          postal_code: 'NW1',
          country_code: '44'
        }),
        test.models.User.create({
          username: 'sherlock',
          email: 'sherlock@holmes.com'
        })
      ]).spread(function(address, user) {
        return user.setAddress(address);
      });
    });

    it('should return associated data by url', function(done) {
      request.get({
        url: test.baseUrl + '/users/1/address'
      }, function(error, response, body) {
        expect(response.statusCode).to.equal(200);
        var result = _.isObject(body) ? body : JSON.parse(body);
        var expected = {
          id: 1,
          street: '221B Baker Street',
          state_province: 'London',
          postal_code: 'NW1',
          country_code: '44'
        };

        expect(result).to.eql(expected);
        done();
      });
    });

  });

});
