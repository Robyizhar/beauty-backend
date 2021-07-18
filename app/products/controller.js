const fs = require('fs');
const path = require('path');
const Product = require('./model');
const Category = require('../categories/model');
const Tag = require('../tag/model');
const config = require('../config');
const { policyFor } = require('../policy');

async function index(req, res, next){
    try{
        let { limit = 10, skip = 0, q = '', category = '', tags = [] } = req.query;
        let criteria = {};
        if(q.length){
            criteria = { ...criteria, name: {$regex: `${q}`, $options: 'i'} }
        }
        if(category.length){
            category = await Category.findOne( {name: {$regex: `${category}`}});
            if(category){
                criteria = {...criteria, category: category._id}
            }
        }
        if(tags.length){
            tags = await Tag.find({name: {$in: tags}});
            criteria = {...criteria, tags: {$in: tags.map(tag => tag._id)}}
        }
        let count = await Product.find(criteria).limit(parseInt(limit)).skip(parseInt(skip)).countDocuments();
        let products = await Product.find(criteria).limit(parseInt(limit)).skip(parseInt(skip)).populate('category').populate('tags');
        return res.json({data: products, count});
    }catch(error){
        next(error);
    }
}

async function store(req, res, next){
    try{
        //Cek hak akses
        let policy = policyFor(req.user);
        if (!policy.can('create', 'Product')) {
            return res.json({
                error: 1,
                message: `Kamu tidak memiliki akses untuk membuat produk`
            });
        }
        let payload = req.body;
        if(payload.category){
            let category = await Category.findOne({name: {$regex: payload.category, $options: 'i' }});
            if(category){
                payload = {...payload, category: category._id}
            }else{
                delete payload.category;
            }
        }
        if(payload.tags && payload.tags.length){
            let tags = await Tag.find({name: {$in: payload.tags}});
            // cek apakah tags membuahkan hasil
            if(tags.length){
                // jika ada, maka kita ambil `_id` untuk masing-masing `Tag`
                payload = {...payload, tags: tags.map( tag => tag._id)}
            }
        }
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
            // buat Product baru menggunakan data dari `payload`
            let product = new Product(payload);

            // simpan Product yang baru dibuat ke MongoDB
            await product.save();

            // berikan response kepada client dengan mengembalikan product yang baru dibuat
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

async function update(req, res, next){

    try{
        let policy = policyFor(req.user);

        if (!policy.can('update', 'Product')) {
            return res.json({
                error: 1,
                message: `Kamu tidak memiliki akses untuk update produk`
            });
        }

        let payload = req.body;
        if(payload.category){
            let category = await Category.findOne(
                {name: {$regex: payload.category, $options: 'i' }}
            )
            if(category) {
                payload = {...payload, category: category._id};
            } else {
                delete payload.category;
            }
        }

        if(payload.tags && payload.tags.length){
            let tags = await Tag.find({name: {$in: payload.tags}});
            // cek apakah tags membuahkan hasil
            if(tags.length){
                // jika ada, maka kita ambil `_id` untuk masing-masing `Tag`
                payload = {...payload, tags: tags.map( tag => tag._id)}
            }
        }

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
                    //temukan dulu data berdasarkan id request
                    let product = await Product.findOne({_id: req.params.id});
                    // cari gambar dari data yang telah ditemukan
                    let current_image = `${config.rootPath}/public/uploads/${product.image_url}`;
                    if (fs.existsSync(current_image)) {
                        fs.unlinkSync(current_image);
                    }
                    product = await Product.findOneAndUpdate(
                            { _id: req.params.id }, 
                            {...payload, image_url: file_name},
                            {new: true, runValidators: true}
                        )
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
            
            let product = await Product.findOneAndUpdate(
                {_id: req.params.id}, payload, {new: true, runValidators: true}
            );
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

async function destroy(req, res, next){
    try {
        let policy = policyFor(req.user);
        if(!policy.can('delete', 'Product')){
            return res.json({
                error: 1,
                message: `Anda tidak memiliki akses untuk menghapus produk`
            });
        }
        
        let product = await Product.findOneAndDelete({_id: req.params.id});
        let current_image = `${config.rootPath}/public/uploads/${product.image_url}`;
        if (fs.existsSync(current_image)) {
            fs.unlinkSync(current_image)
        }
        return res.json(product);
    } catch (error) {
        next(error);
    }
}

module.exports = { index,store,update,destroy }