const Product = require('../products/model');
const CartItem = require('../cart-item/model');

async function index(req, res, next){
    let policy = policyFor(req.user);
    if(!policy.can('read', 'Cart')){
        return res.json({
            error: 1,
            message: `You're not allowed to perform this action`
        });
    }
    try{
        let items = await CartItem
            .find({user: req.user._id})
            .populate('product');
        return res.json(items);
    } catch(err) {
        if(err && err.name == 'ValidationError'){
            return res.json({
                error: 1,
                message: err.message,
                fields: err.errors
            });
        }
        next(err)
    }
}

async function update(req, res, next){
    let policy = policyFor(req.user);
    if(!policy.can('update', 'Cart')){
        return res.json({
            error: 1,
            message: `You're not allowed to perform this action`
        });
    }
    try{
        const { items } = req.body;
        //ekstrak `_id` dari masing-masing `item`
        const productIds = items.map(itm => itm._id);
        // cari data produk di MongoDB simpan sbg `products`
        const products = await Product.find({_id: {$in: productIds}});

        let cartItems = items.map(item => {
            let relatedProduct = products.find(product => product._id.toString() === item._id);
            // buat objek yang memuat informasi untuk disimpan sbg `CartItem`
            return {
                _id: relatedProduct._id,
                product: relatedProduct._id,
                price: relatedProduct.price,
                image_url: relatedProduct.image_url,
                name: relatedProduct.name,
                user: req.user._id,
                qty: item.qty
            }
        });

        await CartItem.bulkWrite(cartItems.map( item => {
            return {
                updateOne: {
                    filter: {user: req.user._id,product: item.product},
                    update: item,
                    upsert: true
                }
            }
        }));
        return res.json(cartItems);
    } catch (err) {
        if(err && err.name == 'ValidationError'){
            return res.json({
                error: 1,
                message: err.message,
                fields: err.errors
            });
        }
        next(err);
    }
}
module.exports = { index, update }