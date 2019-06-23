const proxy = require('http-proxy-middleware')

module.exports = function(app) {
    app.use(proxy('/emf/*', { target: 'http://localhost:8080/', ws: true }))
}