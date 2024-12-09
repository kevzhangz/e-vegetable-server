import User from '../models/user.model.js'
import Store from '../models/store.model.js';
import jwt from 'jsonwebtoken'
import { expressjwt } from 'express-jwt'

// setup process.env
import dotenv from 'dotenv'
dotenv.config();

const jwtsecret = process.env.JWTSECRET

const signin = async (req, res, next) => {
  let user = await User.findOne({'email': req.body.email, role: req.body.role})

  if(!user || !user.authenticate(req.body.password)){
    return res.status(401).json({
      error: 'Email atau password salah'
    })
  }

  if(!user.is_verified){
    return res.status(401).json({
      error: 'User belum terverifikasi'
    })
  }

  const token = jwt.sign({
    _id: user._id
  }, jwtsecret, {
    algorithm: "HS256"
  })

  res.cookie("t", token, {
    expire: new Date() + 9999
  })

  user.hashed_password = undefined
  user.salt = undefined
  user.__v = undefined;

  let userData = {};

  if(req.body.role == 'seller'){
    let store = await Store.findOne({owner: user._id});
    userData = {...user._doc, geolocation: store.geolocation, store_id: store.store_id};
  } else {
    userData = {...user._doc};
  }

  let data = {
    token,
    user: userData
  }

  if(user.profile.data){
    data.user.profile = user.profile.data.toString('base64');
  } else {
    data.user.profile = null;
  }

  return res.status(200).json(data)
}

const signout = async (req, res, next) => {
  res.clearCookie("t")
  return res.status(200).json({
    message: "Signed out"
  })
}

const checkSignin = expressjwt({
  secret: jwtsecret,
  algorithms: ["HS256"],
  userProperty: 'auth'
})

export default {
  signin,
  signout,
  checkSignin
}