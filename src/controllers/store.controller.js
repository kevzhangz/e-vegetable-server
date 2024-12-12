import dbErrorHandler from '../helpers/dbErrorHandler.js'
import generator from '../helpers/generator.js'
import Store from '../models/store.model.js'
import User from '../models/user.model.js'
import Category from '../models/category.model.js'
import Product from '../models/product.model.js'
import extend from 'lodash/extend.js'

const storeProjections = {
  '__v': false
}

// const findAll = async (req, res) => {
//   try {
//     const limit = req.query.limit != null ? req.query.limit : 0;

//     let query = {};

//     if(req.query.search){
//       query.name = { $regex: req.query.search, $options: 'i' };
//     }

//     // if(req.query.filter){
//     //   const category = await Category.find({ name: {$in: req.query.filter.split(',')} }).then(categories => categories.map(category => category._id));
//     //   query.category = { $in: category };
//     // }

//     let result = await Store.find(query, storeProjections).populate('category posted_by', 'name').sort({ _id: -1}).limit(limit);

//     result = modifyResult(result);
//     result = await addStatus(req.auth._id, result);

//     return res.status(200).json({result})
//   } catch (err) {
//     return res.status(500).json({
//       error: dbErrorHandler.getErrorMessage(err)
//     })
//   }
// }

const getStoresBySearch = async (req, res, next) => {
  try {
    const userGeolocation = { 
      type: 'Point', 
      coordinates: [parseFloat(req.query.lon), parseFloat(req.query.lat)] 
    };

    if (!userGeolocation || !userGeolocation.coordinates || userGeolocation.coordinates.length !== 2) {
      throw new Error('Invalid user geolocation provided');
    }

    let searchTerm = req.query.search ?? '';

    // Find product IDs matching the search term
    const products = await Product.find({ name: { $regex: searchTerm, $options: 'i' } }).select('store_id');
    const storeIdsFromProducts = products.map(product => product.store_id);

    // Use MongoDB aggregation with $geoNear
    let aggregateOptions = [
      {
        $geoNear: {
          near: userGeolocation,
          distanceField: 'distance', // Distance will be added to the result in meters
          spherical: true,
        },
      },
      {
        $match: {
          $or: [
            { store_id: { $in: storeIdsFromProducts } },
            { name: { $regex: searchTerm, $options: 'i' } },
          ],
        },
      },
      {
        $project: {
          name: 1,
          image: 1,
          distance: { $divide: ['$distance', 1000] }, // Convert meters to kilometers
          categories: 1,
        },
      },
      {
        $sort: { distance: 1 }, // Sort by closest distance
      },
    ]

    const stores = await Store.aggregate(aggregateOptions);

    // Format the image as base64 for frontend consumption
    const formattedStores = stores.map(store => ({
      name: store.name,
      imageUrl: store.image ? store.image.data.toString('base64') : null,
      distance: parseFloat(store.distance.toFixed(2)),
      categories: store.categories || 'Unknown',
    }));

    return res.status(200).json(formattedStores);
  } catch (error) {
    console.error('Error fetching stores:', error);
    throw error;
  }
};

const create = async (req, res) => {
  try {
    let buffer = Buffer.from(req.body.image, 'base64')

    if(!req.body.name){
      return res.status(500).json({error: "Nama Toko wajib diisi"});
    }

    if(!req.body.address){
      return res.status(500).json({error: "Alamat wajib diisi"});
    }

    if(!req.body.phone_number){
      return res.status(500).json({error: "No.HP wajib diisi"});
    }

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
    const store = await Store.findOne({store_id: id});

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
  getStoresBySearch,
  create,
  read,
  update,
  destroy,
  storeById,
}