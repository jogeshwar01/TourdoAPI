const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please tell us your name!']
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email']
    },
    photo: String,
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 8,
        select: false       //to hide password while reading from database
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password'],
        validate: {
            // This only works on CREATE and SAVE!!!
            // hence when we want to even update a user we would need to use save rather than findOneAndUpdate
            validator: function (el) {
                return el === this.password;
            },
            message: 'Passwords are not the same!'
        }
    },
    passwordChangedAt: Date
});

// hash password before saving to db
userSchema.pre('save', async function (next) {
    // Only run this function if password was actually modified/created new
    if (!this.isModified('password')) return next();

    // Hash the password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);

    // Delete passwordConfirm field 
    // passwordConfirm--required means it is required input but not that it needs to be persisted in the database
    this.passwordConfirm = undefined;
    next();
});

// check if entered password is same as the one stored in db for a particular email
// instance method and will work on all documents of a certain collection
userSchema.methods.correctPassword = async function (
    candidatePassword,
    userPassword
) {
    //this.password will not be available as it has select:false so we need to pass both passwords into this function
    return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        // convert passwordChangedAt to timestamp format to compare it with JWTTimestamp
        const changedTimestamp = parseInt(
            this.passwordChangedAt.getTime() / 1000,
            10
        );
        return JWTTimestamp < changedTimestamp;
    }

    // False means NOT changed
    return false;
};

const User = mongoose.model('User', userSchema);

module.exports = User;