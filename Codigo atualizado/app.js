//Modulos
const express = require("express");
const app = express();
const handlebars = require('express-handlebars')
//const admin = require("./routes/admin") //importando page.js
const path = require("path") // diretorios
const Post = require('./models/Post')
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




//Public
app.use(express.static(path.join(__dirname, "public")))


//Noticia unica data
handle.registerHelper('formatDate', function (date) {
    const parsedDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);;

    if (isNaN(parsedDate.getTime())) {
        return 'Data inválida';
    }
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    // Transforma a primeira letra do dia da semana em maiúscula
    return parsedDate.toLocaleDateString('pt-BR', options).replace(/^\w/, (c) => c.toUpperCase());
});

//Cards data
function formatDate(date) {
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };

    const formattedDate = date.toLocaleDateString('pt-BR', options);

    // Transforma a primeira letra do dia da semana em maiúscula
    return formattedDate.replace(/^\w/, (c) => c.toUpperCase());
}

app.get('/', (req, res) => {
    res.render('ArquivoTest');
})


//Multer - MiddleWare que lida com arquivos

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/uploads/")
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname + Date.now() + path.extname(file.originalname));
    }
})
const upload = multer({ storage })






//Config


const sharp = require('sharp');

function resizeImage(src, options) {
    return sharp(src)
        .resize(options.width, options.height)
        .toBuffer();
}
const loadImage = require('blueimp-load-image');

function resizeImage(src, options) {
    return loadImage(document.createElement('img'), src).then(function (image) {

        var canvas = document.createElement('canvas');

        if (options.width && !options.height) {
            options.height = image.height * (options.width / image.width);
        } else if (!options.width && options.height) {
            options.width = image.width * (options.height / image.height);
        }

        Object.assign(canvas, options);

        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);

        return new Promise(function (resolve) {
            canvas.toBlob(resolve, options.type || 'image/png', options.quality);
        });
    });
}

///////////////////////  CRUD
//Publicar
app.get('/publicar', (req, res) => {
    res.render('publicar')
})
app.post('/publicado', upload.single("image"), async (req, res) => {
    const { publicador, tituloNot, subtitulo, datapubli, textoNot } = req.body;
    const image = req.file ? req.file.filename : null;
    if (!publicador || !tituloNot || !subtitulo || !textoNot) {
        return res.render('publicar', { error: "Todos os campos devem ser preenchidos!", publicador, tituloNot, subtitulo, datapubli, textoNot });
    }
    if (image) {
        const resizedImageBlob = await sharp(image, { width: 300, height: 200 });//precisa ser implementado
    }
    const createdAt = new Date();
    Post.create({
        publicador,
        tituloNot,
        subtitulo,
        datapubli: createdAt,
        textoNot,
        image
    }).then(() => {
        res.redirect('/noticias');
    }).catch((erro) => {
        res.send("Houve um erro: " + erro);
    });
});

//CARDS
handle.registerHelper('eachPage', function (totalPages, currentPage, options) {
    let result = '';
    for (let i = 1; i <= totalPages; i++) {
        result += options.fn({ page: i, isCurrent: i === currentPage });
    }
    return result;
});


app.get('/noticias', (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const perPage = 10;
    const pagesToShow = 5; // Defina o número de páginas a serem exibidas

    Post.findAndCountAll({
        order: [['datapubli', 'desc']],
        limit: perPage,
        offset: (page - 1) * perPage,
    }).then(function (result) {
        const totalPages = Math.ceil(result.count / perPage);
        const nextPage = page + 1;
        const hasNextPage = nextPage <= totalPages;
        const prevPage = page - 1;
        const hasPrevPage = prevPage >= 1;

        const visiblePages = [];
        for (let i = Math.max(1, page - Math.floor(pagesToShow / 2)); i <= Math.min(totalPages, page + Math.floor(pagesToShow / 2)); i++) {
            visiblePages.push(i);
        }

        res.render('cards', {
            posts: result.rows.map(post => ({
                id: post.id,
                createdAt: post.createdAt,
                datapubli: post.get('datapubli'),
                tituloNot: post.get('tituloNot'),
                subtitulo: post.get('subtitulo'),
                publicador: post.get('publicador'),
                textoNot: post.get('textoNot'),
                image: post.get('image'),
            })),
            totalPages,
            currentPage: page,
            hasNextPage,
            nextPage,
            hasPrevPage,
            prevPage,
            isFirstPage: page === 1,
            isLastPage: page === totalPages,
            visiblePages,
        });
    });
});



//Search
const { Op } = require('sequelize'); //Variável auxiliar para o search
app.get('/cards/search', async (req, res) => {
    try {
        const searchTerm = req.query.q;
        const SPECIAL_CHARACTERS_REGEX = /[!@#$%^&*(),.?":{}|<>]/;

        if (typeof searchTerm !== 'string' || SPECIAL_CHARACTERS_REGEX.test(searchTerm)) {
            const errorMessage = 'Parâmetro de pesquisa inválido';
            const posts = []; // Array vazio se houver um erro
            return res.render('cards', { posts, errorMessage });
        }

        const posts = await Post.findAll({
            where: {
                [Op.and]: [
                    {
                        [Op.or]: [
                            {
                                tituloNot: {
                                    [Op.like]: `%${searchTerm}%`
                                }
                            },
                            {
                                textoNot: {
                                    [Op.like]: `%${searchTerm}%`
                                }
                            },
                            {
                                publicador: {
                                    [Op.like]: `%${searchTerm}%`
                                }
                            }
                        ]
                    },
                    {
                        visualizacao: {
                            [Op.ne]: 0 // Excluir notícias com visualizacao igual a 0
                        }
                    }
                ]
            },
            order: [['id', 'desc']]
        });

        const formattedPosts = posts.map(post => {
            return {
                id: post.id,
                createdAt: post.createdAt,
                datapubli: post.get('datapubli'),
                tituloNot: post.get('tituloNot'),
                subtitulo: post.get('subtitulo'),
                publicador: post.get('publicador'),
                textoNot: post.get('textoNot'),
                image: post.get('image')
            };
        });

        res.render('cards', { posts: formattedPosts });
    } catch (error) {
        console.error(error);
        res.status(500).send(`Erro interno do servidor: ${error.message}`);
    }
});

//NOTICIA UNICA
app.get('/noticia/:id', async (req, res) => {
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
            datapubli: post.get('datapubli'),
            image: post.get('image')
        };
        res.render('noticia', { post: formattedPost, formatDate });
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao buscar a notícia');
    }
});

//EXCLUIR NOTÍCIA
//COMO FOI PEDIDO, A FUNCAO APENAS PASSA O VALOR DE VISUALIZACAO PARA 0
app.post('/excluir-noticia/:id', async (req, res) => { 
    
    const postId = req.body.postId;
    try {
        const post = await Post.findByPk(postId);

        if (!post) {
            return res.status(404).send('Notícia não encontrada');
        }

        // Excluir a notícia
        post.visualizacao = 0;
        await post.save();
        res.redirect('/noticias');
    } catch (error) {
        console.error('Erro ao excluir notícia:', error);
        res.status(500).send('Erro interno do servidor');
    }
});
/*
app.post('/excluir-noticia/:id', async (req, res) => { //logica pra caso realmente deseja excluir a noticia
    const postId = req.body.postId;
    try {
        const post = await Post.findByPk(postId);

        if (!post) {
            return res.status(404).send('Notícia não encontrada');
        }

        // Excluir a notícia
        await post.destroy();
        res.redirect('/noticias');
    } catch (error) {
        console.error('Erro ao excluir notícia:', error);
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
        const formattedPost = {
            id: post.id,
            createdAt: post.createdAt,
            tituloNot: post.get('tituloNot'),
            subtitulo: post.get('subtitulo'),
            publicador: post.get('publicador'),
            textoNot: post.get('textoNot'),
            datapubli: post.get('datapubli'),
            image: post.get('image')
        };

        res.render('atualizar_noticia', { post: formattedPost, formatDate });
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao buscar a notícia');
    }
});
const fs = require('fs');
app.post('/atualizar_noticia/:id', upload.single("image"), async (req, res) => {
    try {
        const postId = req.params.id;
        const post = await Post.findByPk(postId);
        if (!post) {
            return res.status(404).send('Notícia não encontrada');
        }
        // req.file é o que recebe a imagem

        const { publicador, tituloNot, subtitulo, textoNot } = req.body;
        const image = req.file ? req.file.filename : null;

        if (image) {
            if (post.image) {
                const imagePath = path.join(__dirname, 'public', 'uploads', post.image);
                post.image = image;
                fs.unlinkSync(imagePath);
            }
            else{
                post.image = image;
            }
        }
        const excluirImagem = req.body.excluirImagem === 'on';
        if (excluirImagem) {
            const imagePath = path.join(__dirname, 'public', 'uploads', post.image);
            post.image = null;
            fs.unlinkSync(imagePath);
        }
        post.publicador = publicador;
        post.tituloNot = tituloNot;
        post.subtitulo = subtitulo;
        post.textoNot = textoNot;

        // Salva as alterações no banco de dados
        await post.save();

        res.redirect('/noticia/' + postId);
    } catch (error) {
        console.error('Erro ao atualizar notícia:', error);
        res.status(500).send('Erro interno do servidor');
    }
});



//////////////////////////////// TESTES///////////////////////


app.get('/noticiaUsuario/:id', async (req, res) => {
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
            datapubli: post.get('datapubli'),
            image: post.get('image')
        };
        res.render('noticiaUsuario', { post: formattedPost, formatDate });
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao buscar a notícia');
    }
});


app.get('/maria', (req, res) => {
    res.sendFile(__dirname + "/views/teste.html");
})
app.get('/maria2', (req, res) => {
    res.sendFile(__dirname + "/views/teste2.html");
})
app.get('/maria3', (req, res) => {
    res.sendFile(__dirname + "/views/teste3.html");
})


app.get('/maria/:id', async (req, res) => {
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

        res.sendFile(path.join(__dirname + "/views/teste.html"));

    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao buscar a notícia');
    }
});




const PORT = 8081
app.listen(PORT, function () {
    console.log("Servidor rodando");
});
