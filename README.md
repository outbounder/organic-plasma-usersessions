# organic-plasma-usersessions

Organelle as extension to orgnaic-plasma providing support for shared sessions managed on behalf of users.

Optionally can use single point of trust for authentication and login access to api via users/apps.

## dna

    {
      "name": "sesions",
      "ownerModelPath": "context/models/user",
      "remoteLoginEndpoint": "http://users-data-store.com/api/login",
      "remoteAuthenticateEndpoint": "http://apps-data-store.com/api/login"
    }

## api

### `plasma[dna.name](sessionStorage)`

returns instance of organic-plasma-sessions `api.`

#### api.login(credentails, callback(err, owner))

Based on given credentials writes into `sessionStorage` owner.id value once owner of the credentials has been found.

#### api.login(owner)

Given `owner` instance, writes into `sessionStorage` owner.id

#### api.owner(callback(err, owner))

Returns `owner` using stored in `sessionStorage` owner.id

## Owner model interface

Providing owner model is required and should implement the following interface

### Owner.createOrUpdate(ownerData, callback(err, owner))

Should create or update owner record within local store and invoke callback with owner instance.

### Owner.findByCredentials(ownerCredentials, calback(err, owner))

Should find owner by given credentials within local store invoking callback with owner instance.
Provide error only in exception-like states, `not found owner` case should invoke `callback()` without arguments.

### Owner.findById(ownerId, callback(err, owner))

Should find owner by given id within local store invoking callback with owner instance.
Provide error only in exception-like states, `not found owner` case should invoke `callback()` without arguments.

### owner.id

Every Owner instance should provide `.id` property.

## usage with organic-express-routes

    // file /routes/api/index.js
    module.exports = function(plasma, dna) {
      return {
        "POST /login": function(req, res, next){
          plasma.sessions(req.session).login(req.body, function(err, user){
            if(err) return next(err)
            if(!user) return next(user_not_found_error)

            req.user = user
            if(req.accepts("html") != "html") {
              res.response = req.user
              next()
            } else
              res.redirect("/")
          })
        },
        "* *": function(req, res, next){
          plasma.sessions(req.session).user(function(err, user){
            if(err) return next(err)
            if(!user) return next(user_not_found_error)
              
            req.user = user
            next()
          })
        },
        // ... follows 'protected' routes, note that as this is in /api/index.js, all /api/* routes are protected too.
      }
    }

