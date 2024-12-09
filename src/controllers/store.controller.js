import dbErrorHandler from '../helpers/dbErrorHandler.js'
import generator from '../helpers/generator.js'
import Store from '../models/store.model.js'
import User from '../models/user.model.js'
import Category from '../models/category.model.js'
import extend from 'lodash/extend.js'

const storeProjections = {
  '__v': false
}

const findAll = async (req, res) => {
  try {
    const limit = req.query.limit != null ? req.query.limit : 0;

    let query = {};

    if(req.query.search){
      query.title = { $regex: req.query.search, $options: 'i' };
    }

    if(req.query.filter){
      const category = await Category.find({ name: {$in: req.query.filter.split(',')} }).then(categories => categories.map(category => category._id));
      query.category = { $in: category };
    }

    let result = await Store.find(query, storeProjections).populate('category posted_by', 'name').sort({ _id: -1}).limit(limit);

    result = modifyResult(result);
    result = await addStatus(req.auth._id, result);

    return res.status(200).json({result})
  } catch (err) {
    return res.status(500).json({
      error: dbErrorHandler.getErrorMessage(err)
    })
  }
}

const create = async (req, res) => {
  try {
    let buffer = Buffer.from(req.body.image, 'base64')

    let storeOwner = await User.findOne({email: req.body.email, role: 'seller'});

    let newStore = {
      ...req.body,
      owner: storeOwner._id,
      store_id: generator.generateId(8),
      geolocation: {
        type: "Point",
        coordinates: [req.body.geolocation.lon, req.body.geolocation.lat]
      },
      image: {
        data: buffer,
        contentType: 'img/jpeg'
      },
    }

    const store = new Store(newStore)
    await store.save()

    storeOwner.has_store = true;
    await storeOwner.save();

    storeOwner.hashed_password = undefined
    storeOwner.salt = undefined
    storeOwner.__v = undefined;
    storeOwner._id = undefined;

    let response = {
      ...storeOwner._doc,
      geolocation: store.geolocation,
      store_id: store.store_id
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
    let store = modifyResult([req.store]);

    return res.status(200).json(store[0])
  } catch (err) {
    return res.status(500).json({
      error: dbErrorHandler.getErrorMessage(err)
    })
  }
}

const update = async (req, res) => {
  try {
    let store = req.store

    if(req.body.image){
      let buffer = Buffer.from(req.body.image, 'base64')
      req.body.image = {};
      req.body.image.data = buffer;
      req.body.image.contentType = 'img/jpeg';
    }

    store = extend(store, req.body)
    await store.save();

    return res.status(200).json({
      messages : 'Store Successfully updated'
    });
  } catch (err) {
    return res.status(500).json({
      error: dbErrorHandler.getErrorMessage(err)
    })
  }
}

const destroy = async (req, res) => {
  try {
    const store = req.store;

    await store.deleteOne();

    return res.status(200).json({
      messages: 'Store Successfully deleted'
    })
  } catch (err) {
    return res.status(500).json({
      error: dbErrorHandler.getErrorMessage(err)
    })
  }
}

const storeById = async (req, res, next, id) => {
  try {
    const store = await Store.findOne({store_id: id}).populate('category posted_by', 'name -_id');

    if(!store){
      throw Error("Store not found");
    }

    req.store = store
    next()
  } catch (err) {
    return res.status(500).json({
      error: dbErrorHandler.getErrorMessage(err)
    })
  }
}

// Modify store data to make it easier to use on client side
const modifyResult = (store) => {
  let res = store.map(item => {
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
  create,
  read,
  update,
  destroy,
  storeById,
}