const jwt = require('jsonwebtoken');    //used jwt instead of sessions to keep our RESTful API stateless
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

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
    const token = signToken(newUser._id);

    res.status(201).json({
        status: 'success',
        token,
        data: {
            user: newUser
        }
    })
});

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;   //destructuring

    // 1) Check if email and password exist
    if (!email || !password) {
        //need to return this else more than 1 response will be sent as it wont return after this
        return next(new AppError('Please provide email and password!', 400));
    }

    // 2) Check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password');
    // selected password explicitly as select:false on password in userModel so to select it we need to do this

    // if there is no user or the password is incorrect
    // if user does not exist so we wont go to the after || part as it wont run if user does not exist
    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401));
    }

    const token = signToken(user._id);
    // 3) If everything ok, send token to client
    res.status(200).json({
        status: 'success',
        token
    })

});