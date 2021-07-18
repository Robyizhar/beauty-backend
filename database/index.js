// import package mongoose
const mongoose = require('mongoose');

// kita import konfigurasi terkait MongoDB dari `app/config.js`
const { dbHost, dbName, dbPort, dbUser, dbPass } = require('../app/config');

// connect ke MongoDB menggunakan konfigurasi
mongoose.connect(`mongodb://${dbUser}:${dbPass}@${dbHost}:${dbPort}/${dbName}`,
    {
        useNewUrlParser: true, 
        useUnifiedTopology: true,
        useFindAndModify: false, 
        useCreateIndex: true
    }
);

// mongoose.connect('mongodb://robby:asdw1234@localhost:27017?authSource=admin', {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//     useCreateIndex: true
// });

// simpan koneksi dalam constant `db`
const db = mongoose.connection;

// export `db` supaya bisa digunakan oleh file lain yang membutuhkan
module.exports = db;