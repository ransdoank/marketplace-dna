'use strict';

function objectForeach(obj, callback) {
    Object.keys(obj).forEach(function (prop) {
        callback(obj[prop], prop, obj);
    });
    return obj;
};

module.exports = objectForeach;