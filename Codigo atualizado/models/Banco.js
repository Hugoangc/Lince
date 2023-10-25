const db = require('./db')

const Banco = db.sequelize.define('bancoTest', {
    titulo:{
        type: db.Sequelize.STRING
    },
    conteudo:{
        type: db.Sequelize.TEXT
    }
})
//Banco.sync({force:true})
/*
Banco.create({
    titulo: "Titulo qualquer",
    conteudo: "Lore abra que dio abm na sun come to earth to bring us some shine"
})*/
module.exports = Banco