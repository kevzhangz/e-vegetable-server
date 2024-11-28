import User from '../models/user.model.js'
import Token from '../models/token.model.js'
import errorHandler from '../helpers/dbErrorHandler.js'
import extend from 'lodash/extend.js'
import nodemailer from 'nodemailer'
import crypto from 'crypto'
import generator from '../helpers/generator.js'

import dotenv from 'dotenv'
dotenv.config();

const userProjections = {
  '_id': false,
  '__v': false,
  'hashed_password': false,
  'salt': false
}

const create = async (req, res) => {
  const user = new User(req.body);

  const emailValidationRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if(req.body.email){
    const validEmail = emailValidationRegex.test(req.body.email);

    if(!validEmail){
      return res.status(500).json({error: "Email tidak valid"});
    }
  }

  try {
    await user.save()

    let token = new Token({ user_id: user._id, token: crypto.randomBytes(16).toString('hex') });

    await token.save()

    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MT_USER,
        pass: process.env.MT_PASS
      }
    });

    let name = String(user.name[0]).toUpperCase() + String(user.name).slice(1)
    let verify_link = 'http:\/\/' + req.headers.host + '/verify/email/' + token.token

    const htmlToSend = generator.generateVerifyEmailHTML(name, verify_link)

    let mailOptions = { 
      from: process.env.MT_USER, 
      to: user.email,
      subject: 'Link Verifikasi Akun E-Vegetables',
      html: htmlToSend
    };
  
    await transporter.sendMail(mailOptions)

    return res.status(200).json({
      message: 'Pendaftaran berhasil'
    })
  } catch (err){
    let error;
    if(err.code == 11000){
      error = 'Email already exists';
    } else {
      error = err.message
    }

    return res.status(500).json({error});
  }
}

const read = async (req, res) => {
  const user = await User.findOne({username : req.params.username}, userProjections)

  return res.status(200).json(user)
}

const update = async (req, res) => {
  try {
    let user = req.profile

    if(req.body.profile){
      let buffer = Buffer.from(req.body.profile, 'base64')
      req.body.profile = {};
      req.body.profile.data = buffer;
      req.body.profile.contentType = 'img/jpeg';
    }

    user = extend(user, req.body)
    await user.save()
    user.hashed_password = undefined
    user.salt = undefined
    user.saved_recipe = undefined;
    user.__v = undefined;
    user._id = undefined;

    let response = {
      ...user._doc,
      profile: user.profile.data.toString('base64')
    }

    res.json(response);
  } catch (err) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

const updateBuyerInformation = async (req, res) => {
  try {
    let user = req.profile;

    if(!req.body.address || req.body.address == ''){
      return res.status(500).json({error: "Alamat wajib diisi"});
    }

    if(!req.body.phone_number || req.body.phone_number == ''){
      return res.status(500).json({error: "No.HP wajib diisi"});
    }

    req.body.geolocation = {"type": "Point", "coordinates": [req.body.geolocation.lon, req.body.geolocation.lat]};

    user = extend(user, req.body)
    await user.save()
    user.hashed_password = undefined
    user.salt = undefined
    user.saved_recipe = undefined;
    user.__v = undefined;
    user._id = undefined;

    let response = {
      ...user._doc,
    }

    res.json(response);
  } catch (err) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

const buyerByEmail = async (req, res, next) => {
  try {
    const user = await User.findOne({email: req.params.buyerEmail, role: 'buyer'})
    req.profile = user
    next()
  } catch (err) {
    return res.status(500).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

const sellerByEmail = async (req, res, next) => {
  try {
    const user = await User.findOne({email: req.params.sellerEmail, role: 'seller'})
    req.profile = user
    next()
  } catch (err) {
    return res.status(500).json({
      error: errorHandler.getErrorMessage(err)
    })
  } 
}



export default {
  create,
  read,
  update,
  updateBuyerInformation,
  buyerByEmail,
  sellerByEmail,
}