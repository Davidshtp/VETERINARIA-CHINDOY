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

// Endpoint para obtener todos los animales y sus vacunas de la base de datos
app.get("/mostrarAnimales", (req, res) => {
    //aca asignamos la query que realizaremos a la base de datos
    const sql = `
        SELECT a.id AS animalId, a.nombre AS animalNombre, a.especie, a.edad, 
               v.id AS vacunaId, v.nombre AS vacunaNombre
        FROM animales a
        LEFT JOIN vacunas v ON a.id = v.id_animal
    `;
    //se realiza la query
    BD.query(sql, (error, filas) => {
        if (error) {//si ocurre un error se indica el error 500
            console.error("Error al obtener los animales:", error);
            return res.status(500).json({ message: 'Error al obtener los animales' });
        }

            // Utilizamos el método reduce para transformar el array de filas en un objeto que agrupa los animales por su ID
            const animales = filas.reduce((acc, fila) => {
            // Desestructuramos los datos relevantes de cada fila obtenida de la consulta
            const { animalId, animalNombre, especie, edad, vacunaId, vacunaNombre } = fila;

            // Verificamos si el acumulador (acc) ya tiene un objeto para el animal actual
            if (!acc[animalId]) {
                // Si no existe, lo inicializamos con los datos del animal y un array vacío para las vacunas
                acc[animalId] = {
                    id: animalId, // ID del animal
                    nombre: animalNombre, // Nombre del animal
                    especie: especie, // Especie del animal
                    edad: edad, // Edad del animal
                    vacunas: [] // Inicializamos un array vacío para almacenar las vacunas del animal
                };
            }

            // Si hay un ID de vacuna (vacunaId), significa que el animal tiene vacunas asociadas
            if (vacunaId) {
                // Agregamos la vacuna al array de vacunas del animal correspondiente
                acc[animalId].vacunas.push({ id: vacunaId, nombre: vacunaNombre }); // Añadimos un objeto con el ID y nombre de la vacuna
            }


            return acc;// Retornamos el acumulador actualizado para la siguiente iteración
        }, {});// Inicializamos el acumulador como un objeto vacío

            res.status(200).json(Object.values(animales)); // Convertimos el objeto 'animales' en un array y lo enviamos como respuesta
            console.log("Animales obtenidos:", Object.values(animales)); // Mostramos en la consola el array de animales obtenidos
    });
});

// Endpoint para eliminar un animal de la base de datos
app.delete("/DeleteAnimal/:id", (req, res) => {
    const animalId = req.params.id;//obtenemos la id por parametros
    //asignamos la query correspondiente
    const sql = `DELETE FROM animales WHERE id = ?`;
    //realizamos la consulta a la base de datos
    BD.query(sql, [animalId], (error, resultado) => {
        if (error) {//si sucede error manejamos ese error
            console.error("Error al eliminar el animal:", error);
            return res.status(500).json({ message: 'Error al eliminar el animal' });
        }
        //si no se encuentra el animal
        if (resultado.affectedRows === 0) {
            return res.status(404).json({ message: 'Animal no encontrado' });
        }
        //si se elimina el animal correctamente
        res.status(200).json({ message: 'Animal eliminado exitosamente' });
    });
});

// Endpoint para editar un animal
app.put('/editarAnimal/:id', (req, res) => {
    const animalId = req.params.id; // Obtener el ID del animal desde los parámetros de la URL
    const { nombreAnimal, especieAnimal, edadAnimal, vacunas } = req.body; // Obtener los datos del cuerpo de la solicitud

    // Consulta para actualizar el animal
    const sqlActualizarAnimal = 'UPDATE animales SET nombre = ?, especie = ?, edad = ? WHERE id = ?';
    //realizamos la peticion a la base de datos
    BD.query(sqlActualizarAnimal, [nombreAnimal, especieAnimal, edadAnimal, animalId], (error, results) => {
        if (error) {//manejo de errores
            console.error('Error al actualizar el animal:', error);
            return res.status(500).json({ error: 'Error al actualizar el animal.' });
        }

        // Verificar si se actualizó algún registro
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Animal no encontrado.' });
        }

        // asignamos la query para eliminar vacunas antes de actualizar
        const sqlEliminarVacunas = 'DELETE FROM vacunas WHERE id_animal = ?';
        //realizamos la consulta a la base de datos
        BD.query(sqlEliminarVacunas, [animalId], (error) => {
            if (error) {//manejo de errores
                console.error('Error al eliminar las vacunas:', error);
                return res.status(500).json({ error: 'Error al eliminar las vacunas.' });
            }

            // Si hay vacunas nuevas, insertarlas
            if (vacunas && vacunas.length > 0) {
                const valoresVacunas = vacunas.map(vacuna => [vacuna.nombre, animalId]);//obtenemos el nombre de la vacuna y el id del animal asociado a esta
                //se realiza la query para insertar los nuevos datos
                const sqlInsertVacuna = 'INSERT INTO vacunas (nombre, id_animal) VALUES ?';

                // Ejecutar la consulta para insertar las nuevas vacunas
                BD.query(sqlInsertVacuna, [valoresVacunas], (error) => {
                    if (error) {//manejo de errores
                        console.error('Error al insertar vacunas:', error);
                        return res.status(500).json({ error: 'Error al insertar vacunas.' });
                    }

                    // Responder con JSON si la actualización fue exitosa
                    return res.status(200).json({ message: 'Animal y vacunas actualizados exitosamente.' });
                });
            } else {
                // Responder con JSON si no hay vacunas que actualizar
                return res.status(200).json({ message: 'Animal actualizado exitosamente sin vacunas.' });
            }
        });
    });
});

// Endpoint para agregar un nuevo animal
app.post('/agregarAnimal', (req, res) => {
    const { nombreAnimal, especieAnimal, edadAnimal, vacunas } = req.body; // Obtener los datos del cuerpo de la solicitud

    // Consulta para insertar el nuevo animal
    const sqlAgregarAnimal = 'INSERT INTO animales (nombre, especie, edad) VALUES (?, ?, ?)';
    //se realiza la peticion a la base de datos
    BD.query(sqlAgregarAnimal, [nombreAnimal, especieAnimal, edadAnimal], (error, results) => {
        if (error) {//manejo de errores
            console.error('Error al agregar el animal:', error);
            return res.status(500).json({ error: 'Error al agregar el animal.' });
        }

        const animalId = results.insertId; // Obtener el ID del nuevo animal

        // Si hay vacunas, insertarlas
        if (vacunas && vacunas.length > 0) {
            const valoresVacunas = vacunas.map(vacuna => [vacuna, animalId]); // Crear un array de valores para las vacunas
            //asignamos la query correspondiente ara agregar las vacunas
            const sqlInsertVacuna = 'INSERT INTO vacunas (nombre, id_animal) VALUES ?';

            // Ejecutar la consulta para insertar las nuevas vacunas
            BD.query(sqlInsertVacuna, [valoresVacunas], (error) => {
                if (error) {//manejo de errores
                    console.error('Error al insertar vacunas:', error);
                    return res.status(500).json({ error: 'Error al insertar vacunas.' });
                }

                // Responder con JSON si el animal y las vacunas se agregaron exitosamente
                return res.status(201).json({ message: 'Animal y vacunas agregados exitosamente.', animalId });
            });
        } else {
            // Responder con JSON si el animal se agregó exitosamente sin vacunas
            return res.status(201).json({ message: 'Animal agregado exitosamente sin vacunas.', animalId });
        }
    });
});