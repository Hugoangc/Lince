const express = require("express")
const router = express.Router()

router.get('/', (req, res) =>{
    res.send("admin/index")
})

router.get('/posts', (req, res) =>{
    res.send("Página postagem")
})




module.exports = router
