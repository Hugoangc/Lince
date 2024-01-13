const db = require('./db')

const Post = db.sequelize.define('noticia', {
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
        type: db.Sequelize.STRING,
        allowNull: true
    },
    visualizacao:{
        type: db.Sequelize.INTEGER,
        defaultValue: 1
    }
})


module.exports = Post

