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
const handle = require('handlebars')

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


handle.registerHelper('formatDate', function (date) {
    // Certifique-se de que 'date' é uma instância válida de Date
    const parsedDate = new Date(date);

    if (isNaN(parsedDate.getTime())) {
        // Se 'date' não é uma data válida, retorne uma string vazia ou uma mensagem de erro
        return 'Data inválida';
    }

    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const day = String(parsedDate.getDate()).padStart(2, '0');

    return `${day}-${month}-${year}`;
});


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


//Rotas

///////////////////////  CRUD
//Publicar
app.get('/publicar', (req, res) => {
    res.render('Publicacao')
})
app.post('/publicado', upload.single("image"), (req, res) => {
    const { publicador, tituloNot, subtitulo, datapubli, textoNot } = req.body;
    if (!publicador || !tituloNot || !subtitulo || !datapubli || !textoNot) {
        return res.render('Publicacao', { error: "Todos os campos devem ser preenchidos!", publicador, tituloNot, subtitulo, datapubli, textoNot });
    }

    Post.create({
        publicador,
        tituloNot,
        subtitulo,
        datapubli,
        textoNot
    }).then(() => {
        res.redirect('/noticias');
    }).catch((erro) => {
        res.send("Houve um erro: " + erro);
    });

});


//Noticias
app.get('/noticias', (req, res) => {
    Post.findAll({ order: [['id', 'desc']] }).then(function (posts) {
        const formattedPosts = posts.map(post => {
            return {
                id: post.id, // Adicione esta linha para incluir o ID
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

//EXCLUIR NOTÍCIA
app.post('/excluir-noticia/:id', async (req, res) => {
    const postId = req.body.postId;
    try {
        const post = await Post.findByPk(postId);

        if (!post) {
            return res.status(404).send('Notícia não encontrada');
        }

        // Excluir a notícia
        await post.destroy();

        // Redirecionar para a página de notícias
        res.redirect('/noticias');
    } catch (error) {
        console.error('Erro ao excluir notícia:', error);
        res.status(500).send('Erro interno do servidor');
    }
});
//ATUALIZAR NOTÍCIA

app.get('/atualizar_noticia/:id', async (req, res) => {
    const postId = req.params.id;
    try {
        const post = await Post.findByPk(postId);
        if (!post) {
            return res.status(404).send('Notícia não encontrada');
        }
        const formattedPost = {
            id: post.id,
            createdAt: post.createdAt,
            tituloNot: post.get('tituloNot'),
            subtitulo: post.get('subtitulo'),
            publicador: post.get('publicador'),
            textoNot: post.get('textoNot'),
            datapubli: post.get('datapubli')
        };

        res.render('atualizar_noticia', { post: formattedPost, formatDate });
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao buscar a notícia');
    }
});

app.post('/atualizar_noticia/:id', upload.single("image"), async (req, res) => {
    try {
        const postId = req.params.id;
        const post = await Post.findByPk(postId);
        if (!post) {
            return res.status(404).send('Notícia não encontrada');
        }
        // req.file é o que recebe a imagem
        const { publicador, tituloNot, subtitulo, datapubli, textoNot } = req.body;

        if (datapubli) {
            post.datapubli = datapubli;
        }
        post.publicador = publicador;
        post.tituloNot = tituloNot;
        post.subtitulo = subtitulo;
        post.textoNot = textoNot;

        // Salva as alterações no banco de dados
        await post.save();

        res.redirect('/noticias');
    } catch (error) {
        console.error('Erro ao atualizar notícia:', error);
        res.status(500).send('Erro interno do servidor');
    }
});





//NOTICIA SEPARADA
app.get('/news/:id', async (req, res) => {
    try {
        const postId = req.params.id;
        const post = await Post.findByPk(postId);

        if (!post) {
            return res.status(404).send('Notícia não encontrada');
        }

        const formattedPost = {
            id: post.id,
            createdAt: post.createdAt,
            tituloNot: post.get('tituloNot'),
            subtitulo: post.get('subtitulo'),
            publicador: post.get('publicador'),
            textoNot: post.get('textoNot'),
            datapubli: post.get('datapubli')
        };

        res.render('news', { post: formattedPost, formatDate });
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao buscar a notícia');
    }
});


/*
app.post('/atualizar_noticia/:id', upload.single("image"), async (req, res) => {
    try {    
        const postId = req.params.id;
        const post = await Post.findByPk(postId);
        if (!post) {
            return res.status(404).send('Notícia não encontrada');
        }

        //req.file é o que recebe a imagem
        const { publicador, tituloNot, subtitulo, datapubli, textoNot } = req.body;
        post.publicador = publicador;
        post.tituloNot = tituloNot;
        post.subtitulo = subtitulo;
        post.datapubli = datapubli;
        post.textoNot = textoNot;
        
        // Salve as alterações no banco de dados
        await post.save();

        res.redirect('/noticias');
    } catch (error) {
        console.error('Erro ao atualizar notícia:', error);
        res.status(500).send('Erro interno do servidor');
    }
});
*/


//////////////////////////////// TESTES///////////////////////
app.get('/nnoticias', (req, res) => {
    Post.findAll({ order: [['id', 'desc']] }).then(function (posts) {
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

app.get('/BANCOTESTE', (req, res) => {
    res.render('TesteJson')
})





app.use('admin', admin)






const PORT = 8081
app.listen(PORT, function () {
    console.log("Servidor rodando");
});
