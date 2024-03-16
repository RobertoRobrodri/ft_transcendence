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

		checkDiv();
		checkMenu();
		setWindowsMovement();

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

export function checkDiv() {
    document.getElementById('root').addEventListener('click', selectProgram);
}

function configureMenu(e) {
    if (e.target.matches('#menuLogo') === false) {
        return;
    }
    var menu = document.getElementById('menu');
    if (menu.style.display === 'none') {
        menu.style.display = 'flex';
    } else {
        menu.style.display = 'none';
    }
    e.preventDefault()
}

export function checkMenu() {
    document.getElementById('root').addEventListener('click', configureMenu);
}

// // Con esta funcion hago que los objetos puedan tener movimiento con click
// function makeDrag(e) {
//     if (e.target.matches('#draggable') === false) {
//         return ;
//     }
//     document.onmousedown = function(e) {
//         if (e.target.matches('#draggable') === false) {
//             return ;
//         }
//         e.preventDefault();
//         document.onmouseup = function(e) {
//             console.log("Suelto el raton");
//             document.onmouseup = null;
//             document.onmousemove = null;
//         };
//         document.onmousemove = function(e) {
//             console.log("Muevo el raton");
//         };
//     }
//     e.preventDefault();
// }


function makeDraggable(element) {
    // if (element.target.matches('#draggable') === false) {
    //     return;
    // }

    // Make an element draggable (or if it has a .window-top class, drag based on the .window-top element)
    let currentPosX = 0, currentPosY = 0, previousPosX = 0, previousPosY = 0;

		// If there is a window-top classed element, attach to that element instead of full window
    if (element.querySelector('.window-top')) {
        // If present, the window-top element is where you move the parent element from
        element.querySelector('.window-top').onmousedown = dragMouseDown;
    } 
    else {
        // Otherwise, move the element itself
        element.onmousedown = dragMouseDown;
    }

    function dragMouseDown (e) {
        // Prevent any default action on this element (you can remove if you need this element to perform its default action)
        e.preventDefault();
        // Get the mouse cursor position and set the initial previous positions to begin
        previousPosX = e.clientX;
        previousPosY = e.clientY;
        // When the mouse is let go, call the closing event
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves
        document.onmousemove = elementDrag;
    }

    function elementDrag (e) {
        // Prevent any default action on this element (you can remove if you need this element to perform its default action)
        e.preventDefault();
        // Calculate the new cursor position by using the previous x and y positions of the mouse
        currentPosX = previousPosX - e.clientX;
        currentPosY = previousPosY - e.clientY;
        // Replace the previous positions with the new x and y positions of the mouse
        previousPosX = e.clientX;
        previousPosY = e.clientY;
        // Set the element's new position
        element.style.top = (element.offsetTop - currentPosY) + 'px';
        element.style.left = (element.offsetLeft - currentPosX) + 'px';
    }

    function closeDragElement () {
        // Stop moving when mouse button is released and release events
        document.onmouseup = null;
        document.onmousemove = null;
    }
}


export function setWindowsMovement() {
    makeDraggable(document.querySelector('#myWindow2'));
}
