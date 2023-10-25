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
const router = express.Router();


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
    const { publicador, tituloNot, subtitulo, datapubli, textoNot } = req.body;
    if(!publicador || !tituloNot || !subtitulo || !datapubli || !textoNot){
        return res.render('Publicacao', { error: "Todos os campos devem ser preenchidos!", publicador, tituloNot, subtitulo, datapubli, textoNot });
    }
        Post.create({
            publicador,
            tituloNot,
            subtitulo,
            datapubli,
            textoNot
        }).then(() => {
            res.redirect('/');
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
            subtitulo: postagem.subtitulo,
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
            subtitulo: postagem.subtitulo,
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


//////////////////////////////////////////////////////////////////////////////////////////////











router.get('/:id', async (req, res) => {
    const postId = req.params.id;

    try {
        const post = await Post.findByPk(postId);

        if (!post) {
            return res.status(404).send('Notícia não encontrada');
        }

        // Renderizar a página de detalhes da notícia
        res.render('news', { post });
    } catch (error) {
        console.error('Erro ao buscar notícia:', error);
        res.status(500).send('Erro interno do servidor');
    }
});

module.exports = router;


app.get('/dnoticias', (req, res)=>{
    Post.findAll().then(function(posts){
        res.render('noticias', {posts:posts})
    })
})
app.get('/noticias', (req, res)=>{
    Post.findAll({order:[['id', 'desc']]}).then(function(posts){
        const formattedPosts = posts.map(post => {
            return {
                createdAt: post.createdAt,
                tituloNot: post.get('tituloNot'),
                subtitulo: post.get('subtitulo'),
                publicador: post.get('publicador'),
                textoNot: post.get('textoNot')
            };
        });

        res.render('noticias', { posts: formattedPosts });
    });
});
app.get('/nnoticias', (req, res) => {
    Post.findAll({order:[['id', 'desc']]}).then(function (posts) {
        let lastCreatedAt = null; // Inicializa lastCreatedAt

        // Adiciona lastCreatedAt como uma propriedade a cada post
        const postsWithDate = posts.map(post => {
            const postWithDate = {
                ...post.toJSON(),
                isNewDate: post.createdAt !== lastCreatedAt
            };

            lastCreatedAt = post.createdAt; // Atualiza lastCreatedAt
            return postWithDate;
        });

        res.render('noticias', { posts: postsWithDate });
    });
});



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
