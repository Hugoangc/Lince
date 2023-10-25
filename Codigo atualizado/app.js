//Modulos
const express = require("express");
const app = express();
const handlebars = require('express-handlebars')
const admin = require("./routes/admin") //importando page.js
const path = require("path") // diretorios
const Post = require('./models/Post')
const Banco = require('./models/Banco')
const session = require("express-session")
const flash = require("connect-flash")
const multer = require("multer") //lidar com uploads de arquivos

//Public

//Template Engine
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.engine('handlebars', handlebars.engine({ defaultLayout: 'main' }))
app.set('view engine', 'handlebars')


//Sessao
app.use(session({
    secret: "sistemapub",
    resave: true,
    saveUninitialized: true
}))

//Public
app.use(express.static(path.join(__dirname, "public")))
app.use(flash())

//Middlewares geral
app.use((req, res, next) => {
    res.locals.sucess_msg = req.flash("sucesso_msg")
    res.locals.error_msg = req.flash("error_msg")
    next()
})


//Multer - MiddleWare que lida com arquivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/")
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname + Date.now() + path.extname(file.originalname));
    }
})
const upload = multer({ storage })

//Config



//Rotas
app.get('/publicar', (req, res) => {
    res.render('Publicacao')
})
app.post('/publicado', upload.single("image"), (req, res) => {
    const { publicador, tituloNot, datapubli, textoNot } = req.body;

        Post.create({
            publicador,
            tituloNot,
            datapubli,
            textoNot
        }).then(() => {
            res.send("Notícia publicada");
        }).catch((erro) => {
            res.send("Houve um erro: " + erro);
        });
    
});
/*
app.post('/publicado', upload.single("file"), (req, res) => {
           var erros = []
            if(!req.body.publicador || typeof req.body.publicador == undefined || req.body.publicador == null){
                erros.push({texto: "Nome invalido"})
            }
            if(!req.body.tituloNot || typeof req.body.tituloNot == undefined || req.body.tituloNot == null){
                erros.push({texto: "Titulo invalido"})
            }
            if(!req.body.textoNot || typeof req.body.textoNot == undefined || req.body.textoNot == null){
                erros.push({texto: "Texto invalido"})
            }
            if(erros.length > 0){
                res.render("Publicacao", {erros : erros})
            }//else{
                
    Post.create({
        publicador: req.body.publicador,
        tituloNot: req.body.tituloNot,
        datapuli: req.body.datapubli,
        textoNot: req.body.textoNot
    }).then(() => {
        res.send("Notícia publicada")
    }).catch(() => {
        res.send("Houve um erro" + erro)
    })
    //}
})
*/

//testes
app.get('/postagens', async (req, res) => {
    try {
        // Busque todas as postagens do banco de dados
        const postagens = await Post.findAll();

        // Mapeie os dados para o formato desejado
        const dadosFormatados = postagens.map(postagem => ({
            publicador: postagem.publicador,
            titulo: postagem.tituloNot,
            dataPublicacao: postagem.datapubli,
            texto: postagem.textoNot
        }));

        // Responda com os dados formatados
        res.json(dadosFormatados);
    } catch (error) {
        console.error('Erro ao buscar postagens:', error);
        res.status(500).json({ error: 'Erro ao buscar postagens' });
    }
});
app.get('/api/postagens', async (req, res) => {
    try {
        // Busque todas as postagens do banco de dados
        const postagens = await Post.findAll();

        // Mapeie os dados para o formato desejado
        const dadosFormatados = postagens.map(postagem => ({
            publicador: postagem.publicador,
            titulo: postagem.tituloNot,
            dataPublicacao: postagem.datapubli ? formatDate(postagem.datapubli) : "N/A",
            texto: postagem.textoNot
        }));

        // Responda com os dados formatados
        res.json(dadosFormatados);
    } catch (error) {
        console.error('Erro ao buscar postagens:', error);
        res.status(500).json({ error: 'Erro ao buscar postagens' });
    }
});
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${day}-${month}-${year}`;
}
function formatTexto(texto) {
    // Adiciona uma quebra de linha antes de cada nova linha no texto
    return texto.replace(/\n/g, '\n');
}


app.get('/cad', (req, res) => {
    res.render('testebanco')
})
app.post('/add', (req, res) => {
    Banco.create({
        titulo: req.body.titulo,
        conteudo: req.body.conteudo
    }).then(() => {
        //res.redirect('testebanco')
        res.send("Sucesso")
    }).catch((erro) => {
        res.send("Erro: " + erro)
    })
})
app.get('/', (req, res) => {
    res.render("ArquivoTest")
})
app.post('/upload', upload.single("file"), (req, res) => {
    res.send("Recebido!")
})

app.get('/BANCOTESTE', (req, res) =>{
    res.render('TesteJson')
})

app.get('/postagem', (req, res) => {
    res.send("Postagens")
})





//app.use('admin', admin)






const PORT = 8081
app.listen(PORT, function () {
    console.log("Servidor rodando");
});
