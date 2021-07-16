const Category = require('./model');

async function index(req, res, next){
    try{
        let categories = await Category.find();
        return res.json(categories);
    }catch(error){
        next(error);
    }
}

async function store(req, res, next){
    try{
        //--- cek policy ---/
        let policy = policyFor(req.user);
        if(!policy.can('create', 'Category')){
            return res.json({
                error: 1,
                message: `Anda tidak memiliki akses untuk membuat kategori`
            });
        }
        // (1) tangkap payload dari _client request_
        let payload = req.body;
        // (2) buat category baru dengan model Category;
        let category = new Category(payload);
        // (3) simpan category baru tadi ke MongoDB
        await category.save();
        // (4) respon ke client dengan data category yang baru dibuat.
        return res.json(category);
    } catch(err){
        // (1) tangani error yang disebabkan oleh validasi model
        if(err && err.name === 'ValidationError'){
            return res.json({
                error: 1,
                message: err.message,
                fields: err.errors
            });
        }
        // (2) tangani error yang tidak kita ketahui
        next(err);
    }
}

async function update(req, res, next){
    try{
        //--- cek policy ---/
        let policy = policyFor(req.user);
        if(!policy.can('update', 'Category')){ // <-- can update Category
            return res.json({
                error: 1,
                message: `Anda tidak memiliki akses untuk mengupdate kategori`
            });
        }
        let payload = req.body;
        let category =
        await Category.findOneAndUpdate({_id: req.params.id}, payload,

        {new: true, runValidators: true});
        return res.json(category);
    } catch(err){
        if(err && err.name === 'ValidationError'){
            return res.json({ error: 1, message: err.message, fields: err.errors });
        }
        next(err);
    }
}

async function destroy(req, res, next){
    try{
        //--- cek policy ---/
        let policy = policyFor(req.user);
        if(!policy.can('delete', 'Category')){ // <-- can delete Category
            return res.json({
                error: 1,
                message: `Anda tidak memiliki akses untuk menghapus kategori`
            });
        }
        // (1) cari dan hapus categori di MongoDB berdasarkan field _id
        let deleted = await Category.findOneAndDelete({_id: req.params.id});
        // (2) respon ke client dengan data category yang baru saja dihapus
        return res.json(deleted);
    } catch(err){
        // (3) handle kemungkinan error
        next(err);
    }
}

module.exports = { index,store, update, destroy }