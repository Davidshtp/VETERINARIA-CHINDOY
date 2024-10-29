
function obtenerDatos(){
fetch("http://localhost:3000/GetAnimales")
    .then(response => response.json())
    .then(data => {
       const contenedor = document.querySelector('.subcontenedor');
        // Eliminar elementos existentes que tengan la clase `caja`
        const cajasExistentes = contenedor.querySelectorAll('.caja');
        cajasExistentes.forEach(caja => caja.remove());
       // Itera sobre cada animal en la respuesta
       data.forEach(animal => {
           // Crea un elemento div para cada animal
           const animalDiv = document.createElement('div');
           animalDiv.classList.add('caja'); // Agrega la clase `caja` para aplicar estilos a cada caja
           // Crear el contenido HTML del animal
           animalDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h4 style="flex-grow: 1; text-align: center;">${animal.nombre}</h4>
                <div>
                    <i class="fas fa-edit" style="cursor: pointer; margin-left: 10px;" 
                        onclick="editarAnimal({ 
                        id: ${animal.id}, 
                        nombre: '${animal.nombre}', 
                        especie: '${animal.especie}', 
                        edad: ${animal.edad}, 
                        vacunas: ${JSON.stringify(animal.vacunas).replace(/"/g, '&quot;')}
                        })">
                    </i>
                    <i class="fas fa-trash" style="cursor: pointer; margin-left: 10px;" onclick="borrarAnimal(${animal.id})"></i>
                </div>
            </div>
               <p><b>Especie:</b> ${animal.especie}</p>
               <p><b>Edad:</b> ${animal.edad} años</p>
               <h4>Vacunas:</h4>
               <ul>
                   ${animal.vacunas.map(vacuna => `<li>${vacuna.nombre}</li>`).join('')}
               </ul>
           `;
           // Agregar cada div de animal al contenedor principal
           contenedor.appendChild(animalDiv);

        })

    })
    .catch(error => {
        console.error("Error al obtener los artículos:", error);
    });
}
obtenerDatos();

// Función para inicializar el manejo del modal y el formulario
function agregarAnimal() {
    // Obtener elementos del DOM
    const openModalButton = document.getElementById("openModalButton");
    const closeModalButton = document.getElementById("closeModalButton");
    const modal = document.getElementById("modal");
    const form = document.getElementById("formAgregarAnimal");

    // Mostrar el modal al hacer clic en el botón de agregar
    openModalButton.addEventListener("click", function() {
        modal.style.display = "flex";
    });

    // Cerrar el modal al hacer clic en la "X"
    closeModalButton.addEventListener("click", function() {
        modal.style.display = "none";
    });

    // Manejo del formulario para obtener los datos
    form.addEventListener("submit", function(event) {
        event.preventDefault();
        const nombreAnimal = document.getElementById("nombreAnimal").value;
        const especieAnimal = document.getElementById("especieAnimal").value;
        const edadAnimal = document.getElementById("edadAnimal").value;
        const vacunas = document.getElementById("vacunas").value.split(",").map(v => v.trim());

        // Realizar la solicitud POST para agregar el animal
        fetch('http://localhost:3000/Add_Animales', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombreAnimal,
                especieAnimal,
                edadAnimal,
                vacunas
            })
        })
        .then(response => {
            if (response.ok) {
                Swal.fire({
                    position: "center",
                    icon: "success",
                    title: "Animal agregado Correctamente",
                    showConfirmButton: false,
                    timer: 1500
                  });
                obtenerDatos();
            } else {
                alert('Error al agregar el animal.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });

        // Cerrar el modal después de guardar
        modal.style.display = "none";
        form.reset();
    });
}
agregarAnimal();

//funcion para borrar un animal
function borrarAnimal(animalId) {
    // Mostrar SweetAlert2 para confirmar la eliminación
    Swal.fire({
        title: "¿Estás seguro?",
        text: "Una vez borrado, no podrás recuperar este animal!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Sí, borrar",
        cancelButtonText: "Cancelar",
    }).then((result) => {
        if (result.isConfirmed) {
            // Realizar la solicitud de eliminación si el usuario confirma
            fetch(`http://localhost:3000/api/animales/${animalId}`, {
                method: 'DELETE',
            })
            .then(response => {
                if (response.ok) {
                    Swal.fire(
                        "¡Borrado!",
                        "El animal ha sido borrado exitosamente.",
                        "success"
                    );
                    obtenerDatos(); // Volver a cargar los datos
                } else {
                    Swal.fire(
                        "Error",
                        "Hubo un problema al borrar el animal.",
                        "error"
                    );
                }
            })
            .catch(error => {
                console.error("Error:", error);
                Swal.fire(
                    "Error",
                    "Ocurrió un error en la solicitud de eliminación.",
                    "error"
                );
            });
        } else {
            Swal.fire(
                "Cancelado",
                "El animal no fue borrado.",
                "info"
            );
        }
    });
}


// Función para abrir el modal y cargar datos para editar un animal
function editarAnimal(animal) {
    const modal = document.getElementById("editModal");
    const closeModalButton = document.getElementById("closeEditModalButton");
    const form = document.getElementById("formEditarAnimal");

    // Cargar datos del animal en el formulario
    document.getElementById("editNombreAnimal").value = animal.nombre;
    document.getElementById("editEspecieAnimal").value = animal.especie;
    document.getElementById("editEdadAnimal").value = animal.edad;
    document.getElementById("editVacunas").value = Array.isArray(animal.vacunas) 
    ? animal.vacunas.map(vacuna => vacuna.nombre).join(", ") 
    : '';

    // Mostrar el modal
    modal.style.display = "flex";

    // Cerrar el modal al hacer clic en la "X"
    closeModalButton.addEventListener("click", function() {
        modal.style.display = "none";
    });

    // Manejo del formulario para actualizar los datos del animal
    form.onsubmit = function(event) {
        event.preventDefault();
        const nombreAnimal = document.getElementById("editNombreAnimal").value;
        const especieAnimal = document.getElementById("editEspecieAnimal").value;
        const edadAnimal = document.getElementById("editEdadAnimal").value;
        const vacunas = document.getElementById("editVacunas").value.split(",").map(v => v.trim());
       
        // Realizar la solicitud PUT para editar el animal
        fetch(`http://localhost:3000/editAnimales/${animal.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombreAnimal: nombreAnimal, // Asegúrate de que las claves sean correctas
                especieAnimal: especieAnimal,
                edadAnimal: edadAnimal,
                vacunas: vacunas
            })
            
        })
        .then(response => {
            if (response.ok) {
                Swal.fire({
                    position: "center",
                    icon: "success",
                    title: "Animal Editado Correctamente",
                    showConfirmButton: false,
                    timer: 1500
                  });
                obtenerDatos();
            } else {
                alert('Error al editar el animal.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });

        // Cerrar el modal después de editar
        modal.style.display = "none";
        form.reset();
    };
}




