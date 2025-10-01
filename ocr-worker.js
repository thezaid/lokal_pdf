// ocr-worker.js

// Tesseract.js is loaded dynamically, so it won't be available globally in this scope initially.
// We'll import it inside the 'init' message handler.

let scheduler;
let worker;

self.onmessage = async (event) => {
    const { type, payload } = event.data;

    if (type === 'init') {
        // Dynamically import the Tesseract.js script. This is how scripts are loaded in Web Workers.
        importScripts('https://cdn.jsdelivr.net/npm/tesseract.js@2.1.5/dist/tesseract.min.js');

        const { createScheduler, createWorker } = Tesseract;
        scheduler = createScheduler();
        // Use a single worker for simplicity in this setup. For parallel processing of many PDFs, more could be added.
        worker = await createWorker(payload.lang);
        scheduler.addWorker(worker);
        
        self.postMessage({ type: 'ready' });
    } else if (type === 'recognize') {
        const { imageData, pageIndex } = payload;
        
        // The recognize function provides detailed data including words and their bounding boxes.
        const { data } = await scheduler.addJob('recognize', imageData);
        
        // Send back the full data structure, which includes text, words, bboxes, etc.
        self.postMessage({ type: 'result', payload: { pageIndex, data } });
    
    } else if (type === 'terminate') {
        // When all jobs are done, terminate the scheduler to free up resources.
        await scheduler.terminate();
        scheduler = null;
        worker = null;
        self.postMessage({ type: 'terminated' });
    }
};

