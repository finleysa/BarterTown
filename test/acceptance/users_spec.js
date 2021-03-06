'use strict';

process.env.DBNAME = 'users-test';
var app = require('../../app/app');
var request = require('supertest');
var expect = require('chai').expect;
var fs = require('fs');
var exec = require('child_process').exec;
var User, cookie, sue;

describe('users', function(){

  before(function(done){
    request(app)
    .get('/')
    .end(function(err, res){
      User = require('../../app/models/user');
      done();
    });
  });

  beforeEach(function(done){
    global.nss.db.dropDatabase(function(err, result){
      sue = new User({email:'testsue@aol.com', password:'abcd'});
      sue.hashPassword(function(){
        sue.insert(function(){
          done();
        });
      });
    });
  });

  describe('GET /', function(){
    it('should display the home page', function(done){
      request(app)
      .get('/')
      .expect(200, done);
    });
  });

  describe('GET /auth', function(){
    it('should display the auth page', function(done){
      request(app)
      .get('/auth')
      .end(function(err, res){
        expect(res.status).to.equal(200);
        expect(res.text).to.include('User Authentication');
        done();
      });
    });
  });

  describe('POST /register', function(){
    before(function(done){
      var testdir = __dirname + '/../../app/static/img/users/test*';
      var cmd = 'rm -rf ' + testdir;

      exec(cmd, function(){
        var origfile = __dirname + '/../fixtures/oprah.jpg';
        var copyfile = __dirname + '/../fixtures/oprah-copy.jpg';
        fs.createReadStream(origfile).pipe(fs.createWriteStream(copyfile));
        global.nss.db.dropDatabase(function(err, result){
          var s = new User({email:'testsue@aol.com', password:'abcd'});
          s.hashPassword(function(){
            s.insert(function(){
              done();
            });
          });
        });
      });
    });
    it('should register a user', function(done){
      var oldname = __dirname + '/../fixtures/oprah-copy.jpg';
      request(app)
      .post('/register')
      .field('email', 'testbob@aol.com')
      .field('password', '1234')
      .attach('photo', oldname)
      .end(function(err, res){
        expect(res.status).to.equal(302);
        done();
      });
    });
    it('should not register a user due to duplicate', function(done){
      var oldname = __dirname + '/../fixtures/oprah-copy.jpg';
      request(app)
      .post('/register')
      .field('email', 'testsue@aol.com')
      .field('password', 'abcd')
      .attach('photo', oldname)
      .end(function(err, res){
        expect(res.status).to.equal(200);
        expect(res.text).to.include('User Authentication');
        done();
      });
    });
  });
  describe('POST /login', function(){
    it('should login a user', function(done){
      request(app)
      .post('/login')
      .field('email', 'testsue@aol.com')
      .field('password', 'abcd')
      .end(function(err, res){
        expect(res.status).to.equal(302);
        expect(res.headers['set-cookie']).to.have.length(1);
        done();
      });
    });
    it('should not login a user due to bad login', function(done){
      request(app)
      .post('/login')
      .field('email', 'testbob@aol.com')
      .field('password', '1234')
      .end(function(err, res){
        expect(res.status).to.equal(200);
        expect(res.text).to.include('User Authentication');
        done();
      });
    });
  });
  describe('AUTHORIZED', function(){
    beforeEach(function(done){
      request(app)
      .post('/login')
      .field('email', 'testsue@aol.com')
      .field('password', 'abcd')
      .end(function(err, res){
        cookie = res.headers['set-cookie'];
        done();
      });
    });
    describe('GET /users:id', function(){
      it('should login a user', function(done){
        request(app)
        .get('/users/1234')
        .set('cookie', cookie)
        .end(function(err, res){
          expect(res.status).to.equal(200);
          done();
        });
      });
    });
  });
  /////END DESCRIBE
});

