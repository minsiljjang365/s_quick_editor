// dragdrop.js - 드래그앤드롭 관련 함수들

function dragStart(event) {
    event.dataTransfer.setData("text/plain", "");
    event.target.classList.add('dragging');
    
    const type = event.target.getAttribute('data-type');
    const src = event.target.getAttribute('data-src');
    const content = event.target.getAttribute('data-content');
    
    event.dataTransfer.setData('element-type', type);
    if (src) event.dataTransfer.setData('element-src', src);
    if (content) event.dataTransfer.setData('element-content', content);
}

function dragEnd(event) {
    event.target.classList.remove('dragging');
}

function allowDrop(event) {
    event.preventDefault();
    document.getElementById('canvas').classList.add('drag-over');
}

function dropOnCanvas(event) {
    event.preventDefault();
    document.getElementById('canvas').classList.remove('drag-over');
    
    const type = event.dataTransfer.getData('element-type');
    const canvas = document.getElementById('canvas');
    const rect = canvas.getBoundingClientRect();
    
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    if (type === 'text') {
        const content = event.dataTransfer.getData('element-content');
        addTextElement(content, x, y);
    } else if (type === 'image') {
        const src = event.dataTransfer.getData('element-src');
        addImageElement(src, x, y);
    }
}