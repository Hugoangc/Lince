const Sequelize = require('sequelize')
const sequelize = new Sequelize('testebd', 'root',"X1598753", {
    host: "localhost",
    dialect: 'mysql'
})
sequelize.authenticate().then(function(){
    console.log("Conectado")
}).catch(function(erro){
    console.log("Falha" + erro)
})

module.exports = {
    Sequelize : Sequelize,
    sequelize :sequelize
}