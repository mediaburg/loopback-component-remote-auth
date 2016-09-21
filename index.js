'use strict';

module.exports = function(app, options) {
    app.on("started", function() {
        if (app.isAuthEnabled) {
            var adapters = function(cb) {
                for (var key in app.dataSources) {
                    var source = app.dataSources[key];
                    var adapter = source.adapter;

                    if (adapter.adapter == 'rest') {
                        cb(adapter);
                    }
                }
            };

            app.use(function (req, res, next) {
                var tokenAppender = function (ctx, cb) {
                    var accessToken = req.get("authorization");
                    if (accessToken) {
                        if (!('headers' in ctx.req)) {
                            ctx.req.headers = {};
                        }
                        ctx.req.headers["authorization"] = accessToken;
                    }

                    cb(null);
                };

                res.on("finish", function() {
                    adapters(function(adapter) {
                        adapter.remotes.removeListener('before.**', tokenAppender);
                    });
                });

                adapters(function(adapter) {
                    adapter.remotes.on('before.**', tokenAppender);
                });

                next();
            });
        }
    });
};