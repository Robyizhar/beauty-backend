const jwt = require('jsonwebtoken');
const config = require('../config');
const { getToken } = require('../utils/get-token');
const User = require('../user/model');

function decodeToken(){
    return async function(req, res, next){
        try{
            let token = getToken(req);
            if(!token) return next();
            req.user = jwt.verify(token, config.secretKey);
            let user = await User.findOne({token: {$in: [token]}});
            if(!user){
                return res.json({
                    error: 1,
                    message: `Token expired`
                });
            }
        } catch (err) {
            if(err && err.name === 'JsonWebTokenError'){
                return res.json({
                    error: 1,
                    message: err.message
                });
            }
            next(err);
        }
        return next();
    }
}

module.exports = { decodeToken }