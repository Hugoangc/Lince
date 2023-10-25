const db = require('./db')

const Post = db.sequelize.define('postagens', {
    publicador:{
        type: db.Sequelize.STRING
    },
    tituloNot:{
        type: db.Sequelize.STRING
    },
    subtitulo:{
        type: db.Sequelize.STRING
    },
    datapubli:{
        type: db.Sequelize.DATE
    },
    textoNot:{
        type: db.Sequelize.TEXT
    },
    image:{
        type: db.Sequelize.STRING
    }
})

module.exports = Post

