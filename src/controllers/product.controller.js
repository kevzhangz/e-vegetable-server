import dbErrorHandler from '../helpers/dbErrorHandler.js'
import generator from '../helpers/generator.js'
import Store from '../models/store.model.js'
import Category from '../models/category.model.js'
import Product from '../models/product.model.js'
import extend from 'lodash/extend.js'

const storeProjections = {
  '__v': false
}

const findAll = async (req, res) => {
  try {
    let query = {};

    query.store_id = req.store.store_id;

    // if(req.query.filter){
    //   const category = await Category.find({ name: {$in: req.query.filter.split(',')} }).then(categories => categories.map(category => category._id));
    //   query.category = { $in: category };
    // }

    let result = await Product.find(query, storeProjections).sort({ _id: -1});

    result = modifyResult(result);

    return res.status(200).json({result})
  } catch (err) {
    return res.status(500).json({
      error: dbErrorHandler.getErrorMessage(err)
    })
  }
}

const findCategoryProduct = async (req, res) => {
    try {
      let query = {};
  
      query.store_id = req.store.store_id;
      query.category_id = req.category.category_id;
  
      let result = await Product.find(query, storeProjections).sort({ _id: -1});

      result = modifyResult(result);
  
      return res.status(200).json({result})
    } catch (err) {
      return res.status(500).json({
        error: dbErrorHandler.getErrorMessage(err)
      })
    }
  }

const create = async (req, res) => {
  try {
    const store = await Store.findOne({store_id: req.body.store_id});
    if (!store) return res.status(404).json({ error: "Store not found" });

    const category = await Category.findOne({category_id: req.body.category_id});
    if (!category) return res.status(404).json({ error: "Category not found" });

    let buffer = Buffer.from(req.body.image, 'base64')

    let newProduct = {
      ...req.body,
      product_id: generator.generateId(6),
      image: {
        data: buffer,
        contentType: 'img/jpeg'
      }
    }

    const product = new Product(newProduct);

    await product.save();

    product.__v = undefined;
    product._id = undefined;

    let response = {
      ...product._doc,
    }

    return res.status(200).json(response);

  } catch (err){
    return res.status(500).json({
      error: dbErrorHandler.getErrorMessage(err)
    })
  }
}

const read = async (req, res) => {
  try {
    let product = await Product.findOne({product_id: req.body.product_id});

    return res.status(200).json(product);
  } catch (err) {
    return res.status(500).json({
      error: dbErrorHandler.getErrorMessage(err)
    })
  }
}

const update = async (req, res) => {
  try {
    let product = req.product

    product = extend(product, req.body)
    await product.save();

    return res.status(200).json({
      messages : 'Product Successfully updated'
    });
  } catch (err) {
    return res.status(500).json({
      error: dbErrorHandler.getErrorMessage(err)
    })
  }
}

const destroy = async (req, res) => {
  try {
    const product = req.product

    await product.deleteOne();

    return res.status(200).json({
      messages: 'Category Successfully deleted'
    })
  } catch (err) {
    return res.status(500).json({
      error: dbErrorHandler.getErrorMessage(err)
    })
  }
}

const productById = async (req, res, next, id) => {
  try {
    const product = await Product.findOne({product_id: id});

    if(!product){
      throw Error("Product not found");
    }

    req.product = product
    next()
  } catch (err) {
    return res.status(500).json({
      error: dbErrorHandler.getErrorMessage(err)
    })
  }
}

// Modify product data to make it easier to use on client side
const modifyResult = (product) => {
    let res = product.map(item => {
      let base64Image = item.image.data.toString('base64');
  
      return {
        ...item._doc,
        image: base64Image,
      }
    });
  
    return res;
}

export default {
  findAll,
  findCategoryProduct,
  create,
  read,
  update,
  destroy,
  productById,
}