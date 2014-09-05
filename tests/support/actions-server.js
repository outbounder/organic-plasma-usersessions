module.exports = function(port, mockActions){
  this.port = port
  this.mockActions = mockActions
}

module.exports.prototype.start = function(callback){
  var self = this
  this.server = require("http").createServer(function(req, res){
    self.mockActions[req.method][req.url](req,res)
  }).listen(this.port, callback)
}

module.exports.prototype.stop = function(callback){
  this.server.close(callback)
}