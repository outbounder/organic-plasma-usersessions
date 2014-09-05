var Plasma = require("organic-plasma")
var Sessions = require("../index")
var ActionsServer = require("./support/actions-server")
var request = require("request")

process.env.CELL_MODE = "_test"

describe("sessions", function(){
  var plasma = new Plasma()

  var sessionStore = {}
  var loggedUser;

  var usersnode;
  var usersActions = {
    "POST": {
      "/api/register": function(req, res){
        res.write(JSON.stringify({
          _id: "user1",
          username: "1",
          email: "1"
        }))
        res.end()
      },
      "/api/login": function(req, res) {
        res.write(JSON.stringify({
          _id: "user1",
          username: "1",
          email: "1"
        }))
        res.end()
      }
    }
  }
  var appsnode;
  var appsActions = {
    "POST": {
      "/api/register": function(req, res) {
        res.write(JSON.stringify({
          _id: "app1",
          appname: "1"
        }))
        res.end()
      },
      "/api/login": function(req, res) {
        res.write(JSON.stringify({
          _id: "app1",
          appname: "1"
        }))
        res.end()
      }
    }
  }

  var modelState;
  var modelErr;
  var Model = function(){}
  Model.createOrUpdate = function(data, callback){
    callback(modelErr, data)
  }
  Model.findByCredentials = function(data, callback) {
    callback(modelErr, modelState)
  }
  Model.findById = function(ownerId, callback) {
    callback(modelErr, modelState)
  }

  var sessions = new Sessions(plasma, {
    name: "sessions",
    ownerModel: Model,
    remoteLoginEndpoint: "http://127.0.0.1:13371/api/login",
    remoteAuthenticateEndpoint: "http://127.0.0.1:13361/api/login"
  })

  it("starts usersnode and appsnode in test mode", function(next){
    appsnode = new ActionsServer(13361, appsActions)
    appsnode.start(function(){
      usersnode = new ActionsServer(13371, usersActions)
      usersnode.start(function(){
        next() 
      })
    })
  })

  it("register remote user", function(next){
    request.post({
      uri: "http://127.0.0.1:13371/api/register",
      json: {
        username: "1",
        password: "1",
        email: "1"
      }
    }, function(err, res, body){
      expect(err).toBeFalsy()
      expect(body).toBeDefined()
      expect(body._id).toBeDefined()
      next()
    })
  })

  it("register remote app", function(next){
    request.post({
      uri: "http://127.0.0.1:13361/api/register",
      json: {
        appname: "1",
        password: "1"
      }
    }, function(err, res, body){
      expect(err).toBeFalsy()
      expect(body).toBeDefined()
      expect(body._id).toBeDefined()
      next()
    })
  })
  
  it("handles remote login", function(next){
    plasma.sessions(sessionStore).login({
      username: "1",
      password: "1"
    }, function(err, user){
      expect(err).toBeFalsy()
      expect(user).toBeDefined()
      loggedUser = user
      next()
    })
  })

  it("returns owner", function(next){
    modelState = loggedUser
    plasma.sessions(sessionStore).owner(function(err, user){
      expect(user).toBe(loggedUser)
      next()
    })
  })

  it("handles app login", function(next){
    modelState = undefined
    plasma.sessions(sessionStore).login({
      appname: "1",
      password: "1",
      ownerId: loggedUser._id
    }, function(err, user){
      expect(err).toBeFalsy()
      expect(user).toBeDefined()
      expect(user._id).toBe(loggedUser._id)
      next()
    })
  })

  it("stops appsnode and usersnode", function(next){
    appsnode.stop(function(){
      usersnode.stop(function(){
        next()
      })
    })
  })
})