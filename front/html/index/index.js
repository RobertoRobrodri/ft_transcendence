//import { loadUserInfo } from "../profile/profileScript.js"
//import { connectChat, sendMessage, disconnect } from "../chat/chatScript.js"
import { renewJWT } from "../components/updatejwt.js"
// import { connectGame } from "./game.js"
import { connectPoolGame } from "../games/pool/script.js"
import { connectGame, CancelMatchmaking } from "../games/pong/pongScript.js"
import { GameSocketManager } from "../socket/GameSocketManager.js"
import { initializeSingleGame, endSingleGame } from "../games/pong/singlegame.js"
import { initializeVersusGame, endVersusGame } from "../games/pong/versusgame.js"

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
    // Open window
    document.getElementById('root').addEventListener('dblclick', openWindow);
    // Close window
    document.getElementById('root').addEventListener('click', closeWindow);

    // Make icons draggable
    makeIconsDraggable();
}

function makeIconsDraggable()
{
    var iconClass = '.icon.text-center.col-md-1';
    document.querySelectorAll(iconClass).forEach(icon => makeDraggable(icon, iconClass));
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
    } else if (parentIcon.id === 'game') {
        createWindow('Game');
    } else if (parentIcon.id === 'pool') {
        createWindow('Game');
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

function setWindowContent(uniqueId) {
    if (uniqueId == 'myWindowProfile') {
        var htmlUrl = '../profile/profile.html';
        var cssUrl = '../profile/profileStyle.css';
        var scriptUrl = '../profile/profileScript.js';
    }
    else if (uniqueId == 'myWindowChat') {
        var htmlUrl = '../chat/chat.html';
        var cssUrl = '../chat/chatStyle.css';
        var scriptUrl = '../chat/chatScript.js';
    }
    else if (uniqueId == 'myWindowGame') {
        var htmlUrl = '../games/pong/pong.html';
        var cssUrl = '../games/pong/pongStyle.css';
        var scriptUrl = '../games/pong/pongScript.js';
    }
    // console.log(uniqueId);
    let window = document.getElementById(uniqueId + "-content");
    Promise.all([
        fetch(htmlUrl).then(response => response.text()),
        fetch(cssUrl).then(response => response.text()),
        import(scriptUrl).then(module => module)
    ]).then(([html, css, javascript]) => {
        // Load html
        window.innerHTML = html;
        // Load css
        let style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
        // Load js
        javascript.init();
    }).catch(error => {
        console.error('Error al cargar el formulario:', error);
    });
    //setWindowEvents(uniqueId)
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
                <button class="round red" id="red-${uniqueId}"></button>
            </div>
            <div class="window-content" id="${uniqueId}-content">
            </div>
        </div>
    `;

    var divRow = document.querySelector('.row');
    divRow.innerHTML += htmlDinamico;
    document.querySelectorAll('.window').forEach(window => makeDraggable(window, '.window-top'));
    // No se la razón, pero solo por agregar el html los iconos dejan de ser movibles, asi que se setea de nuevo
    makeIconsDraggable();
    setWindowContent(uniqueId);
}

function closeWindow(e) {
    if (e.target.closest('.round.red')) {
        e.target.closest('.window').remove();
    }
}

function makeDraggable(element, elementClick) {
    // console.log("makeDraggable called for element:", element);
    if (!element) return;

    //set initial z-index
    let windows = document.querySelectorAll('.window'); // Cantidad de ventanas abiertas
    let icons = document.querySelectorAll('.icon.text-center.col-md-1'); // Cantidad de iconos en el escritorio
    element.style.zIndex = icons.length; // Por defecto manejamos el index como si fuesen iconos
    if (elementClick == '.window-top') // En caso de llamar a la funcion para las ventanas, el Z index es la cantidad de iconos + las ventanas
        element.style.zIndex = windows.length + icons.length;

    let previousPosX = 0, previousPosY = 0;

    // If there is a window-top classed element, attach to that element instead of full window
    let dragHandle = element.querySelector(elementClick) || element;

    dragHandle.addEventListener('mousedown', dragMouseDown);

    function setNewZIndex() {
        // Obtener todas las ventanas
        let windows = document.querySelectorAll('.window');
        // Obtener todos los iconos
        let icons = document.querySelectorAll('.icon.text-center.col-md-1');

        // Manejo del Z index para ventanas
        if (elementClick == '.window-top') {
            // Obtener el índice de la ventana que se está arrastrando
            let draggedWindowIndex = Array.from(windows).indexOf(element);
            // Calcular el nuevo z-index para la ventana arrastrada
            let newDraggedWindowZIndex = windows.length + icons.length;
            windows[draggedWindowIndex].style.zIndex = newDraggedWindowZIndex;
            windows.forEach((window, index) => {
                if (index !== draggedWindowIndex) {
                    // Calcular el nuevo z-index para la ventana actual
                    let originalIndex = parseInt(window.style.zIndex);
                    if (originalIndex > icons.length + 1)
                        window.style.zIndex = originalIndex - 1;
                }
            });
            return;
        }
        // Z Index para iconos
        // Obtener el índice de la ventana que se está arrastrando
        let draggedIconIndex = Array.from(icons).indexOf(element);
        // Calcular el nuevo z-index para la ventana arrastrada
        let newDraggedIconZIndex = icons.length;
        // Establecer el nuevo z-index para la ventana arrastrada
        icons[draggedIconIndex].style.zIndex = newDraggedIconZIndex;
        // Ajustar el z-index para las demás ventanas
        icons.forEach((icon, index) => {
            if (index !== draggedIconIndex) {
                // Calcular el nuevo z-index para la ventana actual
                let originalIndex = parseInt(icon.style.zIndex);
                if (originalIndex > 1)
                icon.style.zIndex = originalIndex - 1;
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
        // Movimiento de los elementos pero previniendo que salgan por completo de la pantalla
        // Calcula los límites de la pantalla
        const maxX = window.innerWidth - 40;
        const maxY = window.innerHeight - 40 - 50; // Guarda 50px adicionales en la parte inferior
    
        // Calcula las nuevas coordenadas del elemento
        let newPosX = element.offsetLeft - (previousPosX - e.clientX);
        let newPosY = element.offsetTop - (previousPosY - e.clientY);
    
        // Calcula los límites de la ventana
        const windowWidth = element.offsetWidth;
        const windowHeight = element.offsetHeight;
        
        // Limita las coordenadas para que al menos 40px queden dentro de la pantalla en todas las direcciones,
        // y guarda 50px adicionales en la parte inferior
        newPosX = Math.max(-windowWidth + 40, Math.min(newPosX, maxX - 40)); // Resta windowWidth para considerar el ancho de la ventana
        newPosY = Math.max(0, Math.min(newPosY, maxY - 40)); // Resta windowHeight para considerar la altura de la ventana
    
        // Actualiza la posición del elemento
        element.style.left = newPosX + 'px';
        element.style.top = newPosY + 'px';
    
        // Actualiza las coordenadas anteriores para el próximo movimiento
        previousPosX = e.clientX;
        previousPosY = e.clientY;
    }

    function closeDragElement() {
        document.removeEventListener('mouseup', closeDragElement);
        document.removeEventListener('mousemove', elementDrag);
    }
}
