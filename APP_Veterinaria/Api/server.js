//llamamos a las dependencias necesarias
const express =require("express")
const mysql=require("mysql")
const cors=require("cors")
const {json}=require("express")
const app=express()
const puerto=process.env.PUERTO||3000;

app.use(cors()); 
app.use(express.json()); 

app.listen(puerto,()=>{//aca indicamos si el servido esta funcionando correctamente
    console.log("servidor de node levantado")
})

//creacion de la conexion con la base de datos
const BD=mysql.createConnection({
    host:"localhost",       
    database:"veterinaria",
    user:"root",
    password:""
})

//aca se realiza la validacion de si se conecto a la base de datos o no
BD.connect((err)=>{
if(err){
    throw err; //esto es el manejo de excepciones 
    return;
}else{
    console.log("conexion exitosa a la base de datos");//si tenemos conexion exitosa a la base de datos indicamos un mensaje en la consola de node
    
}
})


//Endpoint para mandar a llamar los animales y sus vacunas de la base de datos
app.get("/GetAnimales", (req, res) => {
    const sql = `
        SELECT a.id AS animalId, a.nombre AS animalNombre, a.especie, a.edad, 
               v.id AS vacunaId, v.nombre AS vacunaNombre
        FROM animales a
        LEFT JOIN vacunas v ON a.id = v.id_animal
    `;
    
    BD.query(sql, (error, filas) => {
        if (error) {
            throw error;
        } else {
            //se agregan los animales a este objeto
            const animales = {};

            filas.forEach((fila) => {
                const { animalId, animalNombre, especie, edad, vacunaId, vacunaNombre } = fila;
                
                // Si el animal aún no está en el objeto, lo agregamos
                if (!animales[animalId]) {
                    animales[animalId] = {
                        id: animalId,
                        nombre: animalNombre,
                        especie: especie,
                        edad: edad,
                        vacunas: []
                    };
                }
                
                // Si hay una vacuna asociada, la agregamos al array de vacunas del animal
                if (vacunaId) {
                    animales[animalId].vacunas.push({
                        id: vacunaId,
                        nombre: vacunaNombre
                    });
                }
            });

            //enviamos respuestas
            res.send(Object.values(animales));
            console.log(Object.values(animales));
        }
    });
});


//Endpoint para agregar animales con sus correspondientes vacunas
app.post("/Add_Animales", (req, res) => {
    //recibimos las variables del cuerpo de la solicitud
    const { nombreAnimal, especieAnimal, edadAnimal, vacunas } = req.body;

    //realizamos la query a la base de datos
    const sqlInsertarAnimal = 'INSERT INTO animales (nombre, especie, edad) VALUES (?, ?, ?)';
    BD.query(sqlInsertarAnimal, [nombreAnimal, especieAnimal, edadAnimal], (error, results) => {
        if (error) {
            throw error;
        }

        const animalId = results.insertId; // obtenemos el ID del nuevo animal

       //si existen vacunas procedemos a agregarlas
        if (vacunas.length > 0) {
            
            let contador = 0;//contador para ver cuantas agregamos

            // funcion para iterar el array de vacunas e ir agregandolas a su correspondiente tabla
            vacunas.forEach(vacuna => {
                const sqlInsertVacuna = 'INSERT INTO vacunas (nombre, id_animal) VALUES (?, ?)';
                
                // Insertamos cada vacuna de forma individual
                BD.query(sqlInsertVacuna, [vacuna, animalId], (error) => {
                    if (error) {
                        throw error;
                    }
                    contador++;

                    // Si todas las vacunas se han insertado, enviamos la respuesta
                    if (contador === vacunas.length) {
                        res.status(201).send('Animal y vacunas agregados exitosamente.');
                    }
                });
            });
        } else {
            res.status(201).send('Animal agregado exitosamente sin vacunas.');
        }
    });
});

//Endpoint para eliminar un animal
app.delete('/api/animales/:id', (req, res) => {
    const animalId = req.params.id;//obtenemos la id a eliminar por parametros de url

    
    //query
    const sql = 'DELETE FROM animales WHERE id = ?';
    
    BD.query(sql, [animalId], (error, results) => {
        if (error) {
            console.error('Error al eliminar el animal:', error);
            return res.status(500).json({ error: 'Error al eliminar el animal.' });
        }
        
        // Verifica si se eliminó algún registro
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Animal no encontrado.' });
        }

        // Responde con un mensaje de éxito
        res.status(200).json({ message: 'Animal borrado exitosamente.' });
    });
});

// Endpoint para editar un animal
app.put('/editAnimales/:id', (req, res) => {
    const animalId = req.params.id; // Obtener el ID del animal desde los parámetros de la URL
    const { nombreAnimal, especieAnimal, edadAnimal, vacunas } = req.body; // Obtener los datos del cuerpo de la solicitud

    // Consulta para actualizar el animal
    const sqlActualizarAnimal = 'UPDATE animales SET nombre = ?, especie = ?, edad = ? WHERE id = ?';
    
    BD.query(sqlActualizarAnimal, [nombreAnimal, especieAnimal, edadAnimal, animalId], (error, results) => {
        if (error) {
            console.error('Error al actualizar el animal:', error);
            return res.status(500).json({ error: 'Error al actualizar el animal.' });
        }

        // Verificar si se actualizó algún registro
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Animal no encontrado.' });
        }

        // Si hay vacunas para actualizar, primero las eliminamos y luego insertamos las nuevas
        const sqlEliminarVacunas = 'DELETE FROM vacunas WHERE id_animal = ?';
        
        BD.query(sqlEliminarVacunas, [animalId], (error) => {
            if (error) {
                console.error('Error al eliminar las vacunas:', error);
                return res.status(500).json({ error: 'Error al eliminar las vacunas.' });
            }

            // Si hay vacunas nuevas, insertarlas
            if (vacunas.length > 0) {
                let contador = 0;

                vacunas.forEach(vacuna => {
                    const sqlInsertVacuna = 'INSERT INTO vacunas (nombre, id_animal) VALUES (?, ?)';
                    
                    BD.query(sqlInsertVacuna, [vacuna, animalId], (error) => {
                        if (error) {
                            console.error('Error al insertar vacuna:', error);
                            return res.status(500).json({ error: 'Error al insertar vacuna.' });
                        }
                        contador++;

                        // Si todas las vacunas se han insertado, enviamos la respuesta
                        if (contador === vacunas.length) {
                            res.status(200).send('Animal y vacunas actualizados exitosamente.');
                        }
                    });
                });
            } else {
                // Responder si no hay vacunas que actualizar
                res.status(200).send('Animal actualizado exitosamente sin vacunas.');
            }
        });
    });
});
