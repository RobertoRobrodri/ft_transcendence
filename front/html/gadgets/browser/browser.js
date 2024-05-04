
let webview;
export function init(customData = null) {
    webview = document.getElementById("webview");
}

function goBack() {
    if (webview.contentWindow.history) {
        webview.contentWindow.history.back();
    }
}

function goForward() {
    var webview = document.getElementById("webview");
    if (webview.contentWindow.history) {
        webview.contentWindow.history.forward();
    }
}