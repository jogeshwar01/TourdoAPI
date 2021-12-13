module.exports = fn => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);     //same as .catch(err => next(err));
    };
};

//this needs to return another function so that it could be assigned to the one wich calls it
//and that function can later be run when express calls it and not directly