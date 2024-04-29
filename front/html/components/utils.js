// generic functions

export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// export function  scrollVentana(param) {
//     window = document.getElementsByClassName("window-content");
//     if (param) {
//         var estilos = {
//             "overflow-y": "auto",
//         };
//         for (var i = 0; i < window.length; i++) {
//             elementos[i].style["overflow-y"] = estilos[0];
//         }
//     }
//     else {
//         for (var i = 0; i < window.length; i++) {

//             elementos[i].style["overflow-y"] = "hidden";
//         }
//     }
// }