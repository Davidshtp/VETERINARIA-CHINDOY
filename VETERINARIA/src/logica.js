//funcion para poder realizar la peticion de traer los datos de la base de datos
function obtenerDatos() {
    //se realiza el respectivo fetch para realizar la peticion al backend
    fetch("http://localhost:3000/mostrarAnimales")
        .then(response => response.json())
        .then(data => {
            const tablaBody = document.querySelector('table tbody');//se selecciona la tabla donde se renderizara la info
            tablaBody.innerHTML = '';//se eliminan todas las filas ya existentes es decir se limpia la tabla
            
            // se itera sobre cada uno de los animales que hay
            data.forEach(animal => {
                // Crear una fila para cada animal
                const row = document.createElement('tr');
                //a esa fila se le agrega el correspondiente codigo html que contendra la informacion de el animal
                row.innerHTML = `
                    <td>${animal.id}</td>
                    <td>${animal.nombre}</td>
                    <td>${animal.especie}</td>
                    <td>${animal.edad} años</td>
                    <td>${animal.vacunas.map(vacuna => vacuna.nombre).join(', ')}</td>
                    <td>
                        <button class="btn btn-primary btn-sm" onclick="editarAnimal(${JSON.stringify(animal).replace(/"/g, '&quot;')})">Editar</button>
                        <button class="btn btn-danger btn-sm" onclick="borrarAnimal(${animal.id})">Eliminar</button>
                    </td>
                `;
                // Agrega la fila creada con la info a el cuerpo de la tabla
                tablaBody.appendChild(row);
            });
        })
        .catch(error => {//si sucede un error al obtener los datos se imprime por consola
            console.error("Error al obtener los datos:", error);
        });
}

obtenerDatos();//ejecutamos la funcion de obtener los datos de la base de datos cada que se cargue la pagina

// Función para borrar un animal
function borrarAnimal(id) {
    // Confirmación del usuario antes de proceder a eliminar
    if (confirm("¿Estás seguro de que deseas eliminar este animal?")) {
        // Realiza la solicitud al backend para eliminar el animal
        fetch(`http://localhost:3000/DeleteAnimal/${id}`, {
            method: 'DELETE' // Método HTTP para eliminar
        })
        .then(response => {
            // Verifica si la respuesta es un error
            if (!response.ok) {
                throw new Error("Error al eliminar el animal");
            }
            return response.json(); // Convierte la respuesta a JSON
        })
        .then(data => {
            // Notifica al usuario que el animal fue eliminado correctamente
            alert("Animal eliminado correctamente");
            obtenerDatos(); // Actualiza la tabla después de eliminar
        })
        .catch(error => {
            // Maneja errores durante la eliminación
            console.error("Error al eliminar el animal:", error);
            alert("Hubo un problema al intentar eliminar el animal.");
        });
    }
}

// Función para editar un animal
function editarAnimal(animal) {
    // Rellenar los campos del formulario con los datos del animal seleccionado
    document.getElementById('animalId').value = animal.id; // ID del animal
    document.getElementById('animalNombre').value = animal.nombre; // Nombre del animal
    document.getElementById('animalEspecie').value = animal.especie; // Especie del animal
    document.getElementById('animalEdad').value = animal.edad; // Edad del animal
    // Convertir el arreglo de vacunas a una cadena de texto separada por comas
    document.getElementById('animalVacunas').value = animal.vacunas.map(v => v.nombre).join(', '); 
    
    // Mostrar el modal para editar el animal
    const modal = new bootstrap.Modal(document.getElementById('editarAnimalModal'));
    modal.show();

    // Manejar el envío del formulario de edición
    document.getElementById('editarAnimalForm').onsubmit = function (event) {
        event.preventDefault(); // Prevenir el envío normal del formulario

        // Obtener los valores de los campos del formulario
        const nombre = document.getElementById('animalNombre').value; // Nombre actualizado
        const especie = document.getElementById('animalEspecie').value; // Especie actualizada
        const edad = document.getElementById('animalEdad').value; // Edad actualizada
        // Convertir la cadena de vacunas a un arreglo de objetos
        const vacunas = document.getElementById('animalVacunas').value.split(',').map(v => ({ nombre: v.trim() })); // Convertir a objeto

        // Realizar la solicitud al backend para actualizar el animal
        fetch(`http://localhost:3000/editarAnimal/${animal.id}`, {
            method: 'PUT', // Método HTTP para actualizar
            headers: {
                'Content-Type': 'application/json' // Especificar el tipo de contenido
            },
            body: JSON.stringify({ 
                nombreAnimal: nombre, // Enviar el nombre actualizado
                especieAnimal: especie, // Enviar la especie actualizada
                edadAnimal: edad, // Enviar la edad actualizada
                vacunas: vacunas // Enviar las vacunas actualizadas
            })
        })
        .then(response => {
            // Verificar si la respuesta es un error
            if (!response.ok) {
                throw new Error('Error al editar el animal');
            }
            return response.json(); // Convertir la respuesta a JSON
        })
        .then(data => {
            obtenerDatos(); // Actualizar la lista de animales después de la edición
            modal.hide(); // Cerrar el modal
        })
        .catch(error => {
            // Manejar errores durante la edición
            console.error(error); // Imprimir el error en la consola
        });
    };
}

function mostrarAgregarAnimalModal() {
    // Limpiar el formulario antes de mostrar el modal
    document.getElementById('nuevoAgregarAnimalForm').reset();
    
    // Crear una instancia del modal de Bootstrap
    const modal = new bootstrap.Modal(document.getElementById('nuevoAgregarAnimalModal'));
    modal.show(); // Mostrar el nuevo modal

    // Manejar el envío del formulario
    document.getElementById('nuevoAgregarAnimalForm').onsubmit = function (event) {
        event.preventDefault(); // Prevenir el envío normal del formulario

        // Obtener los valores de los campos del formulario
        const nombre = document.getElementById('nuevoNombre').value; // Nombre del nuevo animal
        const especie = document.getElementById('nuevoEspecie').value; // Especie del nuevo animal
        const edad = document.getElementById('nuevoEdad').value; // Edad del nuevo animal
        // Obtener las vacunas como una lista de cadenas, separadas por comas
        const vacunas = document.getElementById('nuevoVacunas').value.split(',').map(v => v.trim()); // Convertir a un arreglo de cadenas

        // Realizar la solicitud para agregar el nuevo animal
        fetch('http://localhost:3000/agregarAnimal', {
            method: 'POST', // Método HTTP para agregar un nuevo recurso
            headers: {
                'Content-Type': 'application/json' // Especificar el tipo de contenido
            },
            body: JSON.stringify({
                nombreAnimal: nombre, // Enviar el nombre del animal
                especieAnimal: especie, // Enviar la especie del animal
                edadAnimal: edad, // Enviar la edad del animal
                vacunas: vacunas // Enviar la lista de vacunas
            })
        })
        .then(response => {
            // Verificar si la respuesta es un error
            if (!response.ok) {
                throw new Error('Error al agregar el animal');
            }
            return response.json(); // Convertir la respuesta a JSON
        })
        .then(data => {
            obtenerDatos(); // Actualiza la lista de animales después de agregar

            // Cerrar el modal utilizando Bootstrap
            modal.hide(); // Cerrar el nuevo modal
        })
        .catch(error => {
            // Manejar errores durante la solicitud
            console.error('Error:', error); // Imprimir el error en la consola
        });
    };
}