module.exports = function (password) {
    // Must be at least 8 chars, have upper, lower, number, special char
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    return regex.test(password);
};
