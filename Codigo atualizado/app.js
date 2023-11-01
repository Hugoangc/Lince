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

//Leitura
//json
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









//
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

//testes


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


/*
app.get('/:id', async (req, res) => {
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

*/


//ATUALIZAR NOTÍCIA

app.get('/atualizar_noticia/:id', async (req, res) => {
    const postId = req.params.id;
    try {
        const post = await Post.findByPk(postId);
        if (!post) {
            return res.status(404).send('Notícia não encontrada');
        }
        //res.send('id: ', + req.params.id)
        res.render('atualizar_noticia', { Post: post }); // Adicione { Post: post }
    } catch (error) {
        console.error('Erro ao buscar notícia para atualização:', error);
        res.status(500).send('Erro interno do servidor');
    }
});
/*
app.post('/editar_noticia/:id', async (req, res) => {
    const postId = req.params.id;

    try {
        const post = await Post.findByPk(postId);

        if (!post) {
            return res.status(404).send('Notícia não encontrada');
        }

        const { publicador, tituloNot, subtitulo, datapubli, textoNot } = req.body;

        // Atualizar os dados do post existente
        await post.update({
            publicador,
            tituloNot,
            subtitulo,
            datapubli,
            textoNot
        });

        // Redirecionar para a página de notícias após a atualização
        res.redirect('/noticias');

    } catch (error) {
        console.error('Erro ao buscar notícia para atualização:', error);
        res.status(500).send('Erro interno do servidor');
    }
});
/** */

app.post('/atualizar_noticia/:id', async (req, res) => {
    const postId = req.params.id;

    try {
        const post = await Post.findByPk(postId);

        if (!post) {
            return res.status(404).send('Notícia não encontrada');
        }

        // Obtenha os dados do formulário
        const { publicador, tituloNot, subtitulo, datapubli, textoNot } = req.body;

        post.publicador = req.body.publicador,
        post.tituloNot = req.body.tituloNot,
        post.subtitulo = req.body.subtitulo,
        post.datapubli = req.body.datapubli,
        post.textoNot = req.body.textoNot
        await Post.save(); 
    
        res.redirect('/noticias');

    } catch (error) {
        console.error('Erro ao buscar notícia para atualização:', error);
        res.status(500).send('Erro interno do servidor');
    }
});

/*
app.get('/atualizar_noticia/:id', async (req, res) => {
    const postId = req.params.id;
    try {
        const post = await Post.findByPk(postId);

        if (!post) {
            return res.status(404).send('Notícia não encontrada');
        }
        // Renderizar a página de atualização de notícia
        res.render('atualizar_noticia')
    } catch (error) {
        console.error('Erro ao buscar notícia para atualização:', error);
        res.status(500).send('Erro interno do servidor');
    }
});


app.put('/atualizar_noticia/:id', upload.single("image"), async (req, res) => {
    let id = req.params.id;
    let tituloNot = req.body.tituloNot;
    let subtitulo = req.body.subtitulo;
    let publicador = req.body.publicador;
    let textoNot = req.body.textoNot;
    
    // Certifique-se de que a tabela e os campos estejam corretos no seu banco de dados
    let cmd = 'UPDATE postagens SET tituloNot = ?, subtitulo = ?, publicador = ?, textoNot = ? WHERE id = ?;';

    db.query(cmd, [tituloNot, subtitulo, publicador, textoNot, id], function (erro, resultados) {
        if (erro) {
            res.send(erro);
        }
        res.redirect(303, '/noticias');
    });
});

*/














/*
app.get('/atualizar_noticia/:id', async (req, res) => {
    const postId = req.params.id;

    try {
        const post = await Post.findByPk(postId);

        if (!post) {
            return res.status(404).send('Notícia não encontrada');
        }

        // Renderizar a página de edição da notícia
        res.render('atualizar_noticia', { post });
    } catch (error) {
        console.error('Erro ao buscar notícia para edição:', error);
        res.status(500).send('Erro interno do servidor');
    }
});



app.post('/atualizar_noticia/:id', upload.single('image'), async (req, res) => {
    const postId = req.params.id;

    try {
        // Encontrar a notícia pelo ID
        const post = await Post.findByPk(postId);

        if (!post) {
            return res.status(404).send('Notícia não encontrada');
        }

        // Atualizar os campos da notícia com base nos dados do formulário
        post.publicador = req.body.publicador;
        post.tituloNot = req.body.tituloNot;
        post.subtitulo = req.body.subtitulo;
        post.datapubli = req.body.datapubli;
        post.textoNot = req.body.textoNot;

        // Se um arquivo de imagem for enviado, atualizar o caminho da imagem
        //if (req.file) {
           // post.imagePath = req.file.path; // Supondo que o modelo tenha um campo 'imagePath'
       // }

        // Salvar as alterações no banco de dados
        await post.save();

        // Redirecionar para a página da notícia atualizada ou fazer qualquer outra coisa que você deseja
        res.redirect('/noticias');

    } catch (error) {
        console.error('Erro ao atualizar notícia:', error);
        res.status(500).send('Erro interno do servidor');
    }
});




app.post('/atualizddar_noticias/:id', async (req, res) => {
    const postId = req.params.id;
    console.log('Rota /atualizarNoticia acionada por POST, ID:', postId);
    try {
        const post = await Post.findByPk(postId);

        if (!post) {
            return res.status(404).send('Notícia não encontrada');
        }

        // Atualizar os campos com os valores do formulário
        post.publicador = req.body.publicador;
        // Atualize outros campos conforme necessário

        // Salvar as alterações
        await post.save();

        // Redirecionar para a página de notícias
        res.redirect('/noticias');
    } catch (error) {
        console.error('Erro ao atualizar notícia:', error);
        res.status(500).send('Erro interno do servidor');
    }
});

*/




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

app.get('/postagem', (req, res) => {
    res.send("Postagens")
})
/*
//app.get('/news/:id', (req, res) =>{
   // res.render('news')
//})
app.get('/news/:id', async (req, res) => {
    try {
        const postId = req.params.id;
        const post = await Post.findByPk(postId);

        if (!post) {
            return res.status(404).send('Notícia não encontrada');
        }

        res.render('news', { post, formatDate }); 
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao buscar a notícia');
    }
});
*/
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



app.use('admin', admin)






const PORT = 8081
app.listen(PORT, function () {
    console.log("Servidor rodando");
});
