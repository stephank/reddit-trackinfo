// Formulate a user agent with a platform description.
module.exports = function(products, options) {
    if (typeof(products) === 'string') {
        products = [products];
    }
    else if (Array.isArray(products)) {
        products = products.slice(0);
    }
    else {
        options = products;
        products = [];
    }

    if (!options) {
        options = {
            platform: true,
            os: true,
            arch: true
        };
    }

    if (options.platform) {
        var s = "node.js/" + process.versions.node;

        var bubble = [];
        if (options.os)
            bubble.push(process.platform);
        if (options.arch)
            bubble.push(process.arch);

        if (bubble.length !== 0)
            s += " (" + bubble.join('; ') + ")";

        products.push(s);
    }

    return products.join(' ');
};
