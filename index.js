const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const mysql = require('mysql');
const knex = require('knex');
const bcrypt = require('bcrypt-nodejs');
require('dotenv').config();

//Llamando controladores

//--- usuario
const registro = require('./controllers/usuario/Registro');
const inicioSesion = require('./controllers/usuario/IniciarSesion');

//--- productos
const buscarProductos = require('./controllers/productos/HomeProductos');
const buscarProducto = require('./controllers/productos/BuscarProducto');
const modificarProducto = require('./controllers/productos/ModificarProducto');
const borrarProducto = require('./controllers/productos/EliminarProducto');

// Llamando a Uploads y Cloudinary
const upload = require('./controllers/ImageUploader/Multer');
const cloudinary = require('./controllers/ImageUploader/Cloudinary');



const db = knex({
    client: 'mysql',
    connection: {
      host : process.env.DB_HOST,
      user : process.env.DB_USER,
      password : process.env.DB_PASSWORD,
      port: 3306,
      database: process.env.DATABASE
    }
});


const app = express();

  // Middleware
app.use(bodyParser.json());
app.use(cors({origin: '*'}));
  

// ----------  Inicio de endpoints
app.get('/', (req, res) => {res.json('soldadura viva!')});

// Registro e inicio de sesion

//Registro
app.post('/registro', (req, res) =>  { registro.handleRegistro(req, res, db, bcrypt) });

//Iniciar Sesion
app.post('/iniciar-sesion', (req, res) =>  { inicioSesion.handleInicioSesion(req, res, db, bcrypt) });

// ----- Agregar, modificar, buscar y eliminar productos

//Buscar todos productos
app.get('/home-productos/', (req, res) => {buscarProductos.handleBuscarProductos(req, res, db)});

//Buscar producto por ID
app.get('/buscar-producto/:id', (req, res) => {buscarProducto.handleBuscarProducto(req, res, db)});

// Agregar
app.use('/agregar-producto', upload.array('image'), async(req, res) => {
    const uploader = async (path) => await cloudinary.uploads(path, 'SoldaduraMovil');
    let safeUrl = '';
    const insert = (str, index, value) => {
      safeUrl = str.substr(0, index) + value + str.substr(index);
  }
  
  
    const { 
      nombre,
      descripcion,
      precio
        } = req.body;
  
        if (req.method === 'POST') {
          const urls = [];
          const files = req.files;
    
          for(const file of files) {
              const { path } = file;
    
              const newPath = await uploader(path);
    
              urls.push(newPath);
    
              fs.unlinkSync(path);
          
              };
              const unsafeUrl = urls[0].url;
              insert(unsafeUrl, 4, 's');
  
                 db('productos').insert({           
                  nombre,
                  descripcion,
                  precio,  
                  imagen: safeUrl   
               }).then(res.status(200).json('producto agregado'))
                 // id: urls[0].id
            } else {
          res.status(405).json({
              err: "No se pudo subir la imagen"
          })
      }
    
    
  })

//Modificar producto
app.patch('/modificar-producto/:id', (req, res) => {modificarProducto.handleModificarProducto(req, res, db)});

//Modificar Imagen producto
app.use('/modificar-imagen-producto/:id', upload.array('image'), async(req, res) => {
    const uploader = async (path) => await cloudinary.uploads(path, 'SoldaduraMovil');
    let safeUrl = '';
    const insert = (str, index, value) => {
      safeUrl = str.substr(0, index) + value + str.substr(index);
  }
  const { id } = req.params;
  if (req.method === 'PATCH') {
      const urls = [];
      const files = req.files;
  
      for(const file of files) {
          const { path } = file;
  
          const newPath = await uploader(path);
  
          urls.push(newPath);
  
          fs.unlinkSync(path);
      
          };
          const unsafeUrl = urls[0].url;
          insert(unsafeUrl, 4, 's');
  
            db('productos').where({id: id}).update({             
              imagen: safeUrl
             // id: urls[0].id
  
          })
             .then(console.log)           
          
      res.status(200).json('exito');
  } else {
      res.status(405).json({
          err: "No se pudo subir la imagen"
      })
  }
  
  })

//Eliminar producto
app.delete('/borrar-producto/:id', (req, res) => {borrarProducto.handleEliminarProducto(req, res, db)});


const port = process.env.PORT || 3000;

app.listen(port, () => console.log(`I'm alive here ${port}`))