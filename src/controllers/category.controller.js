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
    let query = {};

    query.store_id = req.store.store_id

    // if(req.query.filter){
    //   const category = await Category.find({ name: {$in: req.query.filter.split(',')} }).then(categories => categories.map(category => category._id));
    //   query.category = { $in: category };
    // }

    let result = await Category.find(query, storeProjections).sort({ _id: -1});

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

    let newCategory = {
      ...req.body,
      category_id: generator.generateId(6),
    }

    const category = new Category(newCategory);

    await category.save();

    category.__v = undefined;
    category._id = undefined;

    let response = {
      ...category._doc,
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
    let category = await Category.findOne({category_id: req.body.category_id});

    return res.status(200).json(category);
  } catch (err) {
    return res.status(500).json({
      error: dbErrorHandler.getErrorMessage(err)
    })
  }
}

const update = async (req, res) => {
  try {
    let category = req.category

    category = extend(category, req.body)
    await category.save();

    return res.status(200).json({
      messages : 'Category Successfully updated'
    });
  } catch (err) {
    return res.status(500).json({
      error: dbErrorHandler.getErrorMessage(err)
    })
  }
}

const destroy = async (req, res) => {
  try {
    const category = req.category

    await category.deleteOne();

    return res.status(200).json({
      messages: 'Category Successfully deleted'
    })
  } catch (err) {
    return res.status(500).json({
      error: dbErrorHandler.getErrorMessage(err)
    })
  }
}

const categoryById = async (req, res, next, id) => {
  try {
    const category = await Category.findOne({category_id: id});

    if(!category){
      throw Error("Category not found");
    }

    req.category = category
    next()
  } catch (err) {
    return res.status(500).json({
      error: dbErrorHandler.getErrorMessage(err)
    })
  }
}

export default {
  findAll,
  create,
  read,
  update,
  destroy,
  categoryById,
}