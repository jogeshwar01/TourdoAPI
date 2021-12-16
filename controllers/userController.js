const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

const filterObj = (obj, ...allowedFields) => {      //...allowedFields --creates an array of all arguments passed in
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
};

exports.getAllUsers = catchAsync(async (req, res) => {
    const users = await User.find();

    // SEND RESPONSE
    res.status(200).json({
        status: 'success',
        results: users.length,
        data: {
            users
        }
    });
});

exports.updateMe = catchAsync(async (req, res, next) => {
    // we give user to only update email and name here 
    //so need to filter these fields out as like eg) a user may also specify role:admin etc which shouldnt be allowed
    // this is separated from update password as that is how it is done in most websites

    // 1) Create error if user POSTs password data -as this is not for password updates
    if (req.body.password || req.body.passwordConfirm) {
        return next(
            new AppError(
                'This route is not for password updates. Please use /updateMyPassword.',
                400
            )
        );
    }
    // 2) Filtered out unwanted fields names that are not allowed to be updated
    const filteredBody = filterObj(req.body, 'name', 'email');

    // 3) Update user document    //can use req.user as we will use protect before this to authenticate as only logged in user can change stuff
    // user.save() will give us an error as it needs other things also that needs to be specified ie. the required fields but we dont want that
    // since we are not dealing with passwords so we can use findByIdAndUpdate
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser
        }
    });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { active: false });

    // wont see a response in postman as code is 204
    res.status(204).json({
        status: 'success',
        data: null
    });
});

exports.getUser = (req, res) => {
    res.status(500).json({
        status: 'err',
        message: 'This route is not yet defined!'
    })
};

exports.createUser = (req, res) => {
    res.status(500).json({
        status: 'err',
        message: 'This route is not yet defined!'
    })
};

exports.updateUser = (req, res) => {
    res.status(500).json({
        status: 'err',
        message: 'This route is not yet defined!'
    })
};


exports.deleteUser = (req, res) => {
    res.status(500).json({
        status: 'err',
        message: 'This route is not yet defined!'
    })
};