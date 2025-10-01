// ocr-worker.js

// Import the Tesseract.js library. This is how workers load external scripts.
self.importScripts('https://cdn.jsdelivr.net/npm/tesseract.js@2.1.5/dist/tesseract.min.js');

let worker = null;
let isInitialized = false;

// Listen for messages from the main thread
self.onmessage = async (event) => {
    const { type, payload } = event.data;

    if (type === 'init') {
        // Initialize Tesseract worker only once.
        if (!isInitialized) {
            worker = await Tesseract.createWorker({
                // Post progress messages back to the main thread
                logger: m => self.postMessage({ type: 'progress', payload: m })
            });
            await worker.load();
            await worker.loadLanguage('eng');
            await worker.initialize('eng');
            isInitialized = true;
        }
        self.postMessage({ type: 'ready' });
    } else if (type === 'recognize') {
        // Perform OCR on the image data received from the main thread
        if (worker) {
            const { data } = await worker.recognize(payload.imageData);
            self.postMessage({ type: 'result', payload: { text: data.text, pageIndex: payload.pageIndex } });
        }
    } else if (type === 'terminate') {
        // Terminate the Tesseract worker to free up resources
        if (worker) {
            await worker.terminate();
            isInitialized = false;
            worker = null;
            self.postMessage({ type: 'terminated' });
        }
    }
};
