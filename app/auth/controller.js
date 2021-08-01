const User = require('../user/model');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const config = require('../config');
const { getToken } = require('../utils/get-token');

async function register(req, res, next){
    try{
        // (1) tangkap payload dari request
        const payload = req.body;
        // (2) buat objek user baru
        let user = new User(payload);
        // (3) simpan user baru ke MongoDB
        await user.save();
        // (4) berikan response
        return res.json(user);
    }catch{
        // (1) cek kemungkinan kesalahan terkait validasi
        if(err && err.name === 'ValidationError'){
            return res.json({
                error: 1,
                message: err.message,
                fields: err.errors
            });
        }
        // (2) error lainnya
        next(err);
    }
}

async function login(req, res, next){
    passport.authenticate('local', async function(err, user){
        
        if(!user) return res.json({error: 1, message: 'email or password incorrect'})

        // (1) buat JSON Web Token
        let signed = jwt.sign(user, config.secretKey); // <--- ganti secret key dengan keymu sendiri, bebas yang sulit ditebak
        
        // (2) simpan token tersebut ke user terkait
        await User.findOneAndUpdate({_id: user._id}, {$push: {token: signed}}, {new: true});
        
        // (3) response ke _client_
        return res.json({
            message: 'logged in successfully',
            user: user,
            token: signed
        });
    })(req, res, next);
}

async function localStrategy(email, password, done){
    try{
        let user = await User.findOne({email}).select('-__v -createdAt -updatedAt -cart_items -token');
        if(!user) return done();
        if(bcrypt.compareSync(password, user.password)){
            ( {password, ...userWithoutPassword} = user.toJSON() );
            return done(null, userWithoutPassword);
        }
    }catch{
        done(err, null);
    }
    done()
}

function me(req, res, next){
    if(!req.user){
        return res.json({
            error: 1,
            message: `Your're not login or token expired`
        });
    }
    return res.json(req.user);
}

async function logout(req, res, next){
    let token = getToken(req)
    let user = await User.findOneAndUpdate(
        {token: {$in: [token]}},
        {userFindAndModify: false}
    );
    if(!user || !token){
        return res.json({
            error: 1,
            message: 'User tidak ditemukan'
        });
    }
    return res.json({
        error: 0,
        message: 'Logout berhasil'
    });
}

module.exports = {register, login, localStrategy, me, logout}