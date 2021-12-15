const jwt = require('jsonwebtoken');    //used jwt instead of sessions to keep our RESTful API stateless
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');

exports.signup = catchAsync(async (req, res, next) => {
    // has serious security flaw as anyone can put role as admin or anything else as data
    // now to make admin we need to do that manually in mongodb compass or create a special route
    // const newUser = await User.create(req.body);

    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm
    });

    // SECRET should be atleast 32 letters-preffered and EXPIRES_IN we have set to 90d ie 90 days
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });

    res.status(201).json({
        status: 'success',
        token,
        data: {
            user: newUser
        }
    })
});