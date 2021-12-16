const { promisify } = require('util');
const jwt = require('jsonwebtoken');    //used jwt instead of sessions to keep our RESTful API stateless
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');

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
        passwordConfirm: req.body.passwordConfirm,
        passwordChangedAt: req.body.passwordChangedAt,
        role: req.body.role
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

exports.protect = catchAsync(async (req, res, next) => {
    // 1) Getting token and check if it's there
    let token;  //need to declare it before as scope of variables inside if block wont be outside it

    // token passed generally in header named authorization and starts with bearer
    // authorization: 'Bearer asdasdafasfassqaew',
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(
            new AppError('You are not logged in! Please log in to get access.', 401)
            // 401 code for unauthorised 
        );
    }

    // 2) Verification token
    // to check if token payload has not been manipulated by some malicious third party
    // promisify verify fn ie. make it return a promise ->using promisify method of util library
    // will get a jsonWenTokenError for invalid token 
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    //console.log(decoded);

    // 3) Check if user still exists (ie user should not be deleted while we did previous tasks)
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        return next(
            new AppError(
                'The user belonging to this token does no longer exist.',
                401
            )
        );
    }

    // 4) Check if user changed password after the JWT(token) was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {    //pass in the timestamp when this was created using decoded.iat
        return next(
            new AppError('User recently changed password! Please log in again.', 401)
        );
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;     //just putting entire user data on the request for future use
    next();

});

// as we need arbitrary no. of args to be passed in the function we create a
// wrapper function that returns middleware function that we want to create
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // roles ['admin', 'lead-guide']. role='user'
        if (!roles.includes(req.user.role)) {   //we can do this as in protect handle we did req.user = currentUser;
            return next(
                new AppError('You do not have permission to perform this action', 403)
            );
        }

        next();
    };
}

exports.forgotPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on POSTed email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next(new AppError('There is no user with email address.', 404));
    }

    // 2) Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false }); //save the updated document with modified values of passwordResetToken & passwordResetExpires
    // turn off validators password is required & also other field validations

    // 3) Send it to user's email
    const resetURL = `${req.protocol}://${req.get(
        'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

    try {
        // send token to email 
        // this may result into promise being rejected inside sendEmail
        // may need to change port number --we have these four choices -25 or 465 or 587 or 2525
        await sendEmail({
            email: user.email,
            subject: 'Your password reset token (valid for 10 min)',
            message
        });

        res.status(200).json({
            status: 'success',
            message: 'Token sent to email!'
        });
    } catch (err) {
        // we first need to set these to undefined and then send it to the global error handling middleware
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(
            new AppError('There was an error sending the email. Try again later!'),
            500
        );
    }
});


exports.resetPassword = catchAsync(async (req, res, next) => {

});