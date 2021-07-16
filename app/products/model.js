const mongoose = require('mongoose');
const {model, Schema} = mongoose;
const productSchema = Schema({
    name: {
        type: String,
        minlength: [3, 'Nama minimal 3 karakter cuy'],
        maxlength: [255, 'Nama maximal 255 karakter cuy'],
        required: [true, 'Nama harus diisi']
    },
    description: {
        type: String,
        maxlength: [1000, 'Panjang deskripsi maksimal 1000 karakter']
    },
    price: {
        type: Number,
        default: 0
    },
    image_url: String,
    category: {
        type: Schema.Types.ObjectId,
        ref: 'Category'
    },
    tags: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Tag'
        }
    ]
},{ timestamps: true });

const Product = model('Product', productSchema);
module.exports = Product;