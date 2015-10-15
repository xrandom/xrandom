module.exports = {
    env: {
        port: 5678
    },

    app: {
        resultIdCount: 20,
    },

    elastic: {
        host: '127.0.0.1:9200',
        log: 'error'
    }
};
