import { loadUserInfo } from "./menu.js"
import { connectChat } from "./chat.js"
import { renewJWT } from "../components/updatejwt.js"

export function loadMainPage() {
    // Renew jwt
    renewJWT();

    // Remove previous styles
    const existingStyles = document.head.querySelectorAll('style');
    existingStyles.forEach(style => {
        document.head.removeChild(style);
    });

    let mainPage = document.getElementById("root");
    Promise.all([
        fetch('./index/index.html').then(response => response.text()),
        fetch('../styles.css').then(response => response.text()),
        fetch('./index/styleIndex.css').then(response => response.text())
    ]).then(([html, css, css2]) => {
        // Importamos el estilo base y el de esta pagina
        mainPage.innerHTML = html;
        let style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
        let style2 = document.createElement('style');
        style2.textContent = css2;
        document.head.appendChild(style2);
        //clear hash
        history.pushState("", document.title, window.location.pathname + window.location.search);
        //loadUserInfo();
        //connectChat();

        setClickEvents();

    }).catch(error => {
        console.error('Error al cargar el formulario:', error);
    });

    // Actualiza la hora cada segundo
    setInterval(updateTime, 1000);
}

function updateTime() {
    var now = new Date();
    var hours = now.getHours();
    var minutes = now.getMinutes();
    var seconds = now.getSeconds();

    // Formatea la hora como HH:MM:SS
    var formattedTime = hours + ':' + (minutes < 10 ? '0' : '') + minutes + ':' + (seconds < 10 ? '0' : '') + seconds;

    // Formatea la fecha como DD/MM/AAAA
    var day = now.getDate();
    var month = now.getMonth() + 1; // Se suma 1 porque los meses comienzan desde 0
    var year = now.getFullYear();
    var formattedDate = (day < 10 ? '0' : '') + day + '/' + (month < 10 ? '0' : '') + month + '/' + year;

    // Concatena la fecha y la hora
    var dateTimeString = formattedDate + '  |  ' + formattedTime;

    // Actualiza el contenido del elemento con el ID "current-date-time"
    document.getElementById('current-time').innerHTML = dateTimeString;
}

// Esta funcion elimina una clase de todos los objetos que tengan esa clase
function removeClassFromClass(classNameToRemove, classNameToFind) {
    var elements = document.querySelectorAll('.' + classNameToFind);
    elements.forEach(function (element) {
        element.classList.remove(classNameToRemove);
    });
}

function configureMenu(e) {
    if (e.target.matches('#menuContainer') === false &&
        e.target.matches('#menuLogo') === false) {
        return;
    }
    var menu = document.getElementById('menu');
    if (getComputedStyle(menu).display === 'none') {
        menu.style.display = 'flex';
    } else {
        menu.style.display = 'none';
    }
    e.preventDefault()
}

export function setClickEvents() {
    // Menu click
    document.getElementById('root').addEventListener('click', configureMenu);
    // Program selection
    document.getElementById('root').addEventListener('click', selectProgram);
    // Move programs
    document.getElementById('root').addEventListener('click', movePrograms);
    // Open window
    document.getElementById('root').addEventListener('dblclick', openWindow);
    // Close window
    document.getElementById('root').addEventListener('click', closeWindow);
}

function makeDraggableIcon(element) {
    // console.log("makeDraggable called for element:", element);
    if (!element) return;

    //set initial z-index
    let icon = document.querySelectorAll('.icon');
    element.style.zIndex = icon.length;

    let currentPosX = 0, currentPosY = 0, previousPosX = 0, previousPosY = 0;

    // If there is a window-top classed element, attach to that element instead of full window
    let dragHandle = element.querySelector('.icon') || element;

    dragHandle.addEventListener('mousedown', dragMouseDown);

    function setNewZIndex() {
        // Obtener todas las ventanas
        let icon = document.querySelectorAll('.icon');

        // Obtener el índice de la ventana que se está arrastrando
        let draggedWindowIndex = Array.from(icon).indexOf(element);

        // Calcular el nuevo z-index para la ventana arrastrada
        let newDraggedWindowZIndex = icon.length;

        // Establecer el nuevo z-index para la ventana arrastrada
        icon[draggedWindowIndex].style.zIndex = newDraggedWindowZIndex;

        // Ajustar el z-index para las demás ventanas
        icon.forEach((window, index) => {
            if (index !== draggedWindowIndex) {
                // Calcular el nuevo z-index para la ventana actual
                let originalIndex = parseInt(window.style.zIndex);

                if (originalIndex > 1)
                    window.style.zIndex = originalIndex - 1;
            }
        });
    }
    function dragMouseDown(e) {
        console.log("pulso");
        e.preventDefault();
        previousPosX = e.clientX;
        previousPosY = e.clientY;
        document.addEventListener('mousemove', elementDrag);
        document.addEventListener('mouseup', closeDragElement);
        //Set new z-index
        setNewZIndex();
    }

    function elementDrag(e) {
        console.log("Muevo");
        e.preventDefault();
        currentPosX = previousPosX - e.clientX;
        currentPosY = previousPosY - e.clientY;
        previousPosX = e.clientX;
        previousPosY = e.clientY;
        element.style.top = (element.offsetTop - currentPosY) + 'px';
        element.style.left = (element.offsetLeft - currentPosX) + 'px';
    }

    function closeDragElement() {
        console.log("Levanto movimiento");
        document.removeEventListener('mouseup', closeDragElement);
        document.removeEventListener('mousemove', elementDrag);
    }
}

function movePrograms(e) {
    var parentIcon = e.target.closest('.icon');
    if (parentIcon === false || !parentIcon) {
        return;
    }
    e.preventDefault()
    makeDraggableIcon(parentIcon);
}

function openWindow(e) {
    // Esto importa el modal
    // var modal = document.getElementById('exampleModal');
    var parentIcon = e.target.closest('.icon');
    if (parentIcon === false || !parentIcon) {
        removeClassFromClass('selected_program', 'selected_program')
        // Estas dos lineas desactivan el modal
        // modal.classList.remove('show');
        // modal.style.display = 'none';
        return;
    }
    // Estas dos lineas activan el modal
    // modal.classList.add('show');
    // modal.style.display = 'block';

    removeClassFromClass('selected_program', 'selected_program')
    var parentIcon = e.target.closest('.icon');
    parentIcon.classList.add('selected_program');
    e.preventDefault()

    // Open window and load specific content
    if (parentIcon.id === 'profile') {
        createWindow('Profile');
    } else if (parentIcon.id === 'chat') {
        createWindow('Chat');
    } else if (parentIcon.id === 'terminal') {
        createWindow('Terminal');
    }
}

//TODO: Modificar que el modal salga cuando se está llamando a una API.
function selectProgram(e) {
    // Esto importa el modal
    // var modal = document.getElementById('exampleModal');

    var parentIcon = e.target.closest('.icon');
    if (parentIcon === false || !parentIcon) {
        removeClassFromClass('selected_program', 'selected_program')
        // Estas dos lineas desactivan el modal
        // modal.classList.remove('show');
        // modal.style.display = 'none';
        return;
    }
    // Estas dos lineas activan el modal
    // modal.classList.add('show');
    // modal.style.display = 'block';

    removeClassFromClass('selected_program', 'selected_program')
    var parentIcon = e.target.closest('.icon');
    parentIcon.classList.add('selected_program');
    e.preventDefault()

}

function createWindow(appName) {
    var uniqueId = "myWindow" + appName;
    // Comprobar que la ventana no existe (prevenir abrir 2 veces una app)
    var windowExist = document.getElementById(uniqueId);
    if (windowExist)
        return;

    // Crear el HTML dinámico
    var htmlDinamico = `
        <div id="${uniqueId}" class="window">
            <div class="window-top">
                <button class="round green"></button>
                <button class="round yellow"></button>
                <button class="round red"></button>
            </div>
            <div class="window-content">
            </div>
        </div>
    `;

    var divRow = document.querySelector('.row');
    divRow.innerHTML += htmlDinamico;
    document.querySelectorAll('.window').forEach(makeDraggable);
}

function closeWindow(e) {
    if (e.target.closest('.round.red')) {
        e.target.closest('.window').remove();
    }
}

function makeDraggable(element) {
    // console.log("makeDraggable called for element:", element);
    if (!element) return;

    //set initial z-index
    let windows = document.querySelectorAll('.window');
    element.style.zIndex = windows.length;

    let currentPosX = 0, currentPosY = 0, previousPosX = 0, previousPosY = 0;

    // If there is a window-top classed element, attach to that element instead of full window
    let dragHandle = element.querySelector('.window-top') || element;

    dragHandle.addEventListener('mousedown', dragMouseDown);

    function setNewZIndex() {
        // Obtener todas las ventanas
        let windows = document.querySelectorAll('.window');

        // Obtener el índice de la ventana que se está arrastrando
        let draggedWindowIndex = Array.from(windows).indexOf(element);

        // Calcular el nuevo z-index para la ventana arrastrada
        let newDraggedWindowZIndex = windows.length;

        // Establecer el nuevo z-index para la ventana arrastrada
        windows[draggedWindowIndex].style.zIndex = newDraggedWindowZIndex;

        // Ajustar el z-index para las demás ventanas
        windows.forEach((window, index) => {
            if (index !== draggedWindowIndex) {
                // Calcular el nuevo z-index para la ventana actual
                let originalIndex = parseInt(window.style.zIndex);

                if (originalIndex > 1)
                    window.style.zIndex = originalIndex - 1;
            }
        });
    }
    function dragMouseDown(e) {
        e.preventDefault();
        previousPosX = e.clientX;
        previousPosY = e.clientY;
        document.addEventListener('mousemove', elementDrag);
        document.addEventListener('mouseup', closeDragElement);
        //Set new z-index
        setNewZIndex();
    }

    function elementDrag(e) {
        e.preventDefault();
        currentPosX = previousPosX - e.clientX;
        currentPosY = previousPosY - e.clientY;
        previousPosX = e.clientX;
        previousPosY = e.clientY;
        element.style.top = (element.offsetTop - currentPosY) + 'px';
        element.style.left = (element.offsetLeft - currentPosX) + 'px';
    }

    function closeDragElement() {
        document.removeEventListener('mouseup', closeDragElement);
        document.removeEventListener('mousemove', elementDrag);
    }
}