var jwt = require('jwt-simple');
var validateUser = require('../routes/auth').validateUser;

module.exports = function(req, res,fn) {

    // When performing a cross domain request, you will recieve
    // a preflighted request first. This is to check if our the app
    // is safe.
    // We skip the token outh for [OPTIONS] requests.
    if(req.method === 'OPTIONS') next();
    var cookiesList = parseCookies(req);

    var token = (req.body && req.body.access_token) || (req.query && req.query.access_token) || req.headers['x-access-token'] || cookiesList["X-ACCESS-TOKEN"];
    var key = (req.body && req.body.x_key) || (req.query && req.query.x_key) || req.headers['x-key'] || cookiesList["KEY"];

    if (token) {
        try {
            var decoded = jwt.decode(token,require('../config/secret.js')());

            if (decoded.exp <= Date.now()) {
                res.status(400);
                res.send({
                    result:false,
                    status: 400,
                    message: "Token Expired"
                });
                return;
            }
            // Authorize the user to see if s/he can access our resources
            validateUser(key,function(callback){
                var userObject = callback;
            // The key would be the logged in user's username
                if (userObject) {
                    var role = userObject.role;
                    if ((req.url.indexOf('admin') >= 0 || req.url === "/") && (role === 'admin' || role === 'superuser' || role === 'sabet')) {
                        return fn(userObject);
                    }
                    else if ((req.url.indexOf('superuser') >= 0) && (role === 'superuser' || role === 'sabet')) {
                        return fn(userObject);
                    }
                    else {
                        res.send({
                            result: false,
                            status:401,
                            message: "Unauthorized"
                        });
                    }
                } else {
                    // No user with this name exists, respond back with a 401
                    res.send({
                        status:401,
                        result:false,
                        message: "Unauthorized"
                    });
                    return fn(null);
                }
            });
        } catch (err) {

            return fn(null);
        }
    } else {

        return fn(null); // Not Signed
    }
    function parseCookies (request) {
        var list = {},
            rc = request.headers.cookie;
        rc && rc.split(';').forEach(function( cookie ) {
            var parts = cookie.split('=');
            list[parts.shift().trim()] = decodeURI(parts.join('='));
        });

        return list;
    }
};