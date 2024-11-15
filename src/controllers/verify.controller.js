import Token from "../models/token.model.js"
import User from "../models/user.model.js"

const verifyEmail = async (req, res, next) => {
    try {
        const token = await Token.findOne({ token: req.params.token })
        // token is not found into database i.e. token may have expired
        if (!token){
            return res.status(400).send({msg:'Your verification link may have expired. Please click on resend for verify your Email.'});
        } else{ // if token is found then check valid user 
            let user = await User.findOne({ _id: token.user_id })
    
            if (!user){
                return res.status(401).send({msg:'We were unable to find a user for this verification. Please Sign Up!'});
            } else if (user.is_verified){ // user is already verified
                return res.status(200).send('User has been already verified. Please Login');
            } else{ // verify user
                user.is_verified = true;
                await user.save()
                await Token.findByIdAndDelete(token._id); // delete token
                return res.status(200).send('Your account has been successfully verified');
            }
        }
    } catch(err){
        return res.status(400).json({
            error: errorHandler.getErrorMessage(err)
        })
    }
}

export default {
    verifyEmail
}