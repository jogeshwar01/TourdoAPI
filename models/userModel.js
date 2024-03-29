const crypto = require('crypto');
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
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user'
    },
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
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    //need this field to activate/deactivate an account --dont want to delete a user's data permanently from our database
    active: {
        type: Boolean,
        default: true,
        select: false
    }
});

// comment these 2 pre save middlewares before importing data from users.json data file as we have encrypted password there already
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

userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return next();
    // this.isNew is if we create a new Document --exit this middleware

    // kind of a trick -though not completely accurate 
    //but kinda ensures token created after password changed
    this.passwordChangedAt = Date.now() - 1000; // -1000milliseconds (1 second) as saving to db is slower than jwt issuing
    next();
});

// Query middleware -so that we only show up the active users
userSchema.pre(/^find/, function (next) {
    // this points to the current query
    this.find({ active: { $ne: false } });
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

userSchema.methods.createPasswordResetToken = function () {
    // dont need this to be ass strong as password so use built-in crypto module
    // token needed to reset password like its a one time password which user will get on email
    // and a post request with this token will change password
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto    //stored encypted token in database
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    console.log({ resetToken }, this.passwordResetToken);

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; //10 minutes given to change password

    return resetToken;  //unencrypted token to be sent through the email
};

const User = mongoose.model('User', userSchema);

module.exports = User;