var path = require("path")
var request = require("request")
var _ = require("underscore")

/*
  dna.name
  dna.ownerModelPath
  dna.remoteLoginEndpoint
  dna.remoteAuthenticateEndpoint
*/
module.exports = function(plasma, dna) {
  /*
    SessionOwner.createOrUpdate(data, callback(err, owner))
    SessionOwner.findByCredentials(data, callback(err, owner))
    SessionOwner.findById(ownerId, callback(err, owner))

    owner.id
  */

  var Owner = dna.ownerModel || require(path.join(process.cwd(),dna.ownerModelPath))

  plasma[dna.name] = function(session){
    return {
      login: function(c, callback){
        // c == owner instance
        if(!callback) return session.ownerId = c.id

        var performRemoteLoginAndCreateOwner = function(){
          request.post({
            uri: dna.remoteLoginEndpoint,
            json: c
          }, function(err, res, body){
            if(err) return callback(err)
            if(res.statusCode != 200) return callback(body)
            
            Owner.createOrUpdate(body, function(err, owner){
              if(err) return callback(err)      

              session.ownerId = owner.id
              callback(err, owner)
            })
          })
        }
          
        var performLogin = function(err, owner){
          if(err) return callback(err)
          if(!owner && dna.remoteLoginEndpoint) return performRemoteLoginAndCreateOwner()
          if(!owner) return callback()

          session.ownerId = owner.id
          callback(err, owner)
        }

        if(!c.ownerId) 
          return Owner.findByCredentials(c, performLogin)
        
        if(c.ownerId && dna.remoteAuthenticateEndpoint) {
          var data = _.clone(c)
          delete data.ownerId
          return request.post({
            uri: dna.remoteAuthenticateEndpoint,
            json: data
          }, function(err, res, body){
            if(err) return callback(err)
            if(res.statusCode != 200) return callback(body)
            
            Owner.findById(c.ownerId, performLogin)
          })
        }

        return callback(new Error("invalid chemical "+JSON.stringify(c)))
      },
      owner: function(callback){
        Owner.findById(session.ownerId, callback)
      }
    }
  }
}