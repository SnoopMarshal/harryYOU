const  authmiddleware  = require("../../middleware/auth");
const  User = require("../../model/users.model");
const jwt = require("jsonwebtoken");
const { check, validationResult } = require('express-validator');
const jwtSecret = process.env.JWT_SECRET;
const bcrypt = require('bcryptjs');
const express = require('express');
const router = express.Router();


router.get('/',authmiddleware, async (req,res)=>{
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        console.log(error.message);
        res.status(500).json({msg: 'server error'});
    }
});
router.post('/',
[
    check('email','Email should be a valid one')
    .isEmail(),
    check('password','Password is required')
    .exists()
],
async (req,res)=>{
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }
    const {email,password} = req.body;
    try {
        let user = await User.findOne({email});
        if(!user){
            return res.status(400).json({errors: [{msg: 'User does not exist'}]})
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.status(400).json({errors: [{msg: 'Invalid credentials'}]})
        }
        const payload = {
            user: {
                id: user.id
            }
        }
        jwt.sign(
            payload,
            jwtSecret,
            { expiresIn: 36000},
            (err, token) => {
                if (err) {
                    throw err;
                }
                res.json({token});
            }
        )
        
    } catch (error) {
        res.status(500).send(error);
    }
});


module.exports = router;