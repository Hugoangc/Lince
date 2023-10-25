import React, { useState } from 'react';
import { Route, BrowserRouter } from 'react-router-dom';
import './App.css';
import logo from './img/lince_logo.png';
import login from './img/simbolo_login.png';
import foot_img from './img/lince_foot.png';
import Publicar from '../components/Publicar';

function Navbar() {
  const [error, setError] = useState('');

  const handlePublicarClick = () => {
    // Simule uma validação de formulário
    // Se houver um erro, defina a mensagem de erro
    setError('Todos os campos devem ser preenchidos.');
  };

  return (
    <header className="header">
      <img className="logo_class" src={logo} />
      <a className="topico1">PROJETOS</a>
      <a className="topicos">EVENTOS</a>
      <BrowserRouter>
        <Route
          path="/publicar"
          render={() => <Publicar handlePublicarClick={handlePublicarClick} />}
        />
      </BrowserRouter>
      <a className="topicos">CONTATE-NOS</a>
      <a className="topicos">SOBRE NÓS</a>
      <img className="simbolo_login" src={login} />
      {error && <p>{error}</p>}
    </header>
  );
}

export default Navbar;