const fs = require('fs');
const path = require('path');
const Product = require('./model');
const config = require('../config');

async function index(req, res, next){
    try{
        let products = await Product.find();
        return res.json(products);
    }catch(error){
        next(error);
    }
}

async function store(req, res, next){
    try{

        let payload = req.body;

        if(req.file){
            //menangkap lokasi sementara file yang diupload:
            let tmp_path = req.file.path;

            // menangkap ekstensi dari file yang diupload
            let extension = req.file.originalname.split('.')
            [req.file.originalname.split('.').length -1];

            //membangun nama file baru lengkap dengan ekstensi asli yang kita tangkap
            let file_name = req.file.filename + '.' + extension;

            //mengkonfigurasi tempat penyimpanan untuk file yang diupload
            let target_path = path.resolve(config.rootPath, `public/uploads/${file_name}`);

            //mengambil file di tempat penyimpanan sementara
            const source = fs.createReadStream(tmp_path);

            //konfigurasi Memindakkan file ke file public/uploads
            const dest = fs.createWriteStream(target_path);

            //mulai pindahkan file dari `src` ke `dest`
            source.pipe(dest);

            //menyimpan product ke MongoDB dan mengembalikan response ke client
            source.on('end', async () => {
                try{
                    let product = new Product({...payload, image_url: file_name});
                    await product.save();
                    return res.json(product);
                }catch(err){
                    //jika error, hapus file yang sudah terupload pada direktori
                    fs.unlinkSync(target_path);

                    // cek apakah error disebabkan validasi MongoDB
                    if(err && err.name === 'ValidationError'){
                        return res.json({
                            error: 1, 
                            message: err.message,
                            fields: err.errors
                        });
                    }
                    next(err);
                }
            });

            //mendeteksi saat terjadi error upload.
            source.on('error', async() => {
                next(err);
            });

        }else{
            // (1) buat Product baru menggunakan data dari `payload`
            let product = new Product(payload);

            // (2) simpan Product yang baru dibuat ke MongoDB
            await product.save();

            // (3) berikan response kepada client dengan mengembalikan product yang baru dibuat
            return res.json(product);
        }

    }catch(err){
        if(err && err.name === 'ValidationError'){
            return res.json({
                error: 1, 
                message: err.message,
                fields: err.errors
            });
        }
        next(err);
    }
}

module.exports = { index,store }