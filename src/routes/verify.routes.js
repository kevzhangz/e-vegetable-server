import express from 'express'
import verifyCtrl from '../controllers/verify.controller.js'

const router = express.Router()

router.route('/verify/email/:token')
      .get(verifyCtrl.verifyEmail)

export default router;