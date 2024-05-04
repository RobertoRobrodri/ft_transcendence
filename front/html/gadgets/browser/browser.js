let webview;
let historyStack = [];
let historyIndex = -1;

export function init(customData = null) {
    webview = document.getElementById("webview");
    document.getElementById('root').addEventListener('click', navEventHandler);

    // Browse handler
    const input = document.getElementById("urlInput");
    input.addEventListener('keydown', function(event) {
        // Press enter key
        if (event.keyCode === 13) {
            loadUrl(sanitizeInput(input.value.trim()));
        }
    });
    // Open default page
    loadUrl("https://es.wikipedia.org/wiki/Wikipedia:Portada");
}

function navEventHandler(e) {
    if (e.target.matches('#browserBack') === true) {
        navigateBack();
    } else if (e.target.matches('#browserForward') === true) {
        navigateForward();
    }
}

function loadUrl(url) {
    if (!url.startsWith('https://')) {
        url = url.replace(/^http:\/\//i, 'https://');
        if (!url.startsWith('https://'))
            url = "https://" + url;
    }
    // if (!isValidURL(url))
    //     return;
    webview.src = url;
    historyStack.push(url);
    historyIndex++;
}

function navigateBack() {
    if (historyStack.length > 1 && historyIndex > 0) {
        historyIndex--;
        const previousUrl = historyStack[historyIndex];
        webview.src = previousUrl;
        console.log(historyIndex)
        console.log(previousUrl)
    }
}

function navigateForward() {
    if (historyIndex < historyStack.length - 1) {
        historyIndex++;
        const nextUrl = historyStack[historyIndex];
        webview.src = nextUrl;
    }
}

function sanitizeInput(input) {
    return DOMPurify.sanitize(input);
}
