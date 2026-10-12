const dropZone = document.getElementById('drop-zone');
const shapeItems = document.querySelectorAll('.shape-item');
const clearBtn = document.getElementById('clear-btn');
const downloadBtn = document.getElementById('download-btn');
const bgColorPicker = document.getElementById('bg-color-picker');
const inspectorContent = document.getElementById('inspector-content');
const layersList = document.getElementById('layers-list');
const layersCount = document.getElementById('layers-count');

let shapesData = [];
let selectedShapeId = null;
let draggedType = null;

const shapeLabels = {
    square: 'Square',
    rectangle: 'Rectangle',
    circle: 'Circle',
    ellipse: 'Ellipse',
    triangle: 'Triangle',
    star: 'Star',
    polygon: 'Hexagon',
    heart: 'Heart'
};

function getShapeSvg(type, color) {
    const fill = color || '#3b82f6';
    switch (type) {
        case 'square':
            return `<svg viewBox="0 0 100 100"><rect width="100" height="100" rx="8" fill="${fill}"/></svg>`;
        case 'rectangle':
            return `<svg viewBox="0 0 140 80"><rect width="140" height="80" rx="8" fill="${fill}"/></svg>`;
        case 'circle':
            return `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="${fill}"/></svg>`;
        case 'ellipse':
            return `<svg viewBox="0 0 140 80"><ellipse cx="70" cy="40" rx="68" ry="38" fill="${fill}"/></svg>`;
        case 'triangle':
            return `<svg viewBox="0 0 100 100"><polygon points="50,5 95,95 5,95" fill="${fill}"/></svg>`;
        case 'star':
            return `<svg viewBox="0 0 100 100"><polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35" fill="${fill}"/></svg>`;
        case 'polygon':
            return `<svg viewBox="0 0 100 100"><polygon points="50,2 93,25 93,75 50,98 7,75 7,25" fill="${fill}"/></svg>`;
        case 'heart':
            return `<svg viewBox="0 0 100 100"><path d="M50 88L43.8 82.4C21.6 62.3 7 49 7 32.5C7 19.1 17.6 8.5 31 8.5C38.5 8.5 45.7 12 50 17.5C54.3 12 61.5 8.5 69 8.5C82.4 8.5 93 19.1 93 32.5C93 49 78.4 62.3 56.2 82.4L50 88Z" fill="${fill}"/></svg>`;
        default:
            return `<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="${fill}"/></svg>`;
    }
}

function createShapeElement(shape) {
    const element = document.createElement('div');
    element.className = 'placed-shape';
    element.dataset.id = shape.id;

    element.addEventListener('mousedown', (event) => {
        event.stopPropagation();
        selectShape(shape.id);

        const rect = dropZone.getBoundingClientRect();
        const offsetX = event.clientX - rect.left - shape.x;
        const offsetY = event.clientY - rect.top - shape.y;

        function onMouseMove(moveEvent) {
            shape.x = Math.max(0, Math.min(
                dropZone.clientWidth - shape.width,
                moveEvent.clientX - rect.left - offsetX
            ));
            shape.y = Math.max(0, Math.min(
                dropZone.clientHeight - shape.height,
                moveEvent.clientY - rect.top - offsetY
            ));
            element.style.left = `${shape.x}px`;
            element.style.top = `${shape.y}px`;
        }

        function onMouseUp() {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        }

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    });

    return element;
}

function renderCanvas() {
    const existingElements = new Map(
        [...dropZone.querySelectorAll('.placed-shape')].map(element => [element.dataset.id, element])
    );

    shapesData.forEach(shape => {
        let element = existingElements.get(shape.id);
        if (!element) {
            element = createShapeElement(shape);
            dropZone.appendChild(element);
        }

        element.style.left = `${shape.x}px`;
        element.style.top = `${shape.y}px`;
        element.style.width = `${shape.width}px`;
        element.style.height = `${shape.height}px`;
        element.style.transform = `rotate(${shape.rotation}deg)`;
        element.style.zIndex = shapesData.indexOf(shape);
        element.innerHTML = getShapeSvg(shape.type, shape.color);
        element.classList.toggle('selected', shape.id === selectedShapeId);
        dropZone.appendChild(element);
        existingElements.delete(shape.id);
    });

    existingElements.forEach(element => element.remove());
}

function selectShape(id) {
    selectedShapeId = id;
    renderCanvas();
    renderLayers();
    renderInspector();
}

function renderLayers() {
    layersCount.textContent = shapesData.length;
    layersList.replaceChildren();

    if (shapesData.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'layers-empty';
        emptyMessage.textContent = 'No shapes on the canvas.';
        layersList.appendChild(emptyMessage);
        return;
    }

    [...shapesData].reverse().forEach(shape => {
        const shapeIndex = shapesData.findIndex(item => item.id === shape.id);
        const row = document.createElement('div');
        row.className = 'layer-row';
        row.classList.toggle('selected', shape.id === selectedShapeId);

        const selectButton = document.createElement('button');
        selectButton.className = 'layer-select';
        selectButton.type = 'button';
        selectButton.dataset.layerAction = 'select';
        selectButton.dataset.shapeId = shape.id;
        selectButton.setAttribute('aria-pressed', shape.id === selectedShapeId);

        const name = document.createElement('span');
        name.className = 'layer-name';
        name.textContent = shapeLabels[shape.type] || 'Shape';
        selectButton.appendChild(name);

        const orderActions = document.createElement('div');
        orderActions.className = 'layer-order-actions';
        orderActions.append(
            createLayerOrderButton(shape, 'forward', '↑', shapeIndex === shapesData.length - 1),
            createLayerOrderButton(shape, 'backward', '↓', shapeIndex === 0)
        );

        row.append(selectButton, orderActions);
        layersList.appendChild(row);
    });
}

function createLayerOrderButton(shape, direction, icon, disabled) {
    const button = document.createElement('button');
    const directionLabel = direction === 'forward' ? 'forward' : 'backward';
    button.className = 'layer-order-button';
    button.type = 'button';
    button.textContent = icon;
    button.title = `Move ${shapeLabels[shape.type] || 'shape'} ${directionLabel}`;
    button.setAttribute('aria-label', button.title);
    button.dataset.layerAction = direction;
    button.dataset.shapeId = shape.id;
    button.disabled = disabled;
    return button;
}

function moveShapeLayer(shapeId, direction) {
    const currentIndex = shapesData.findIndex(shape => shape.id === shapeId);
    const targetIndex = currentIndex + direction;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= shapesData.length) return;

    const [shape] = shapesData.splice(currentIndex, 1);
    shapesData.splice(targetIndex, 0, shape);
    renderCanvas();
    renderLayers();
}

function renderInspector() {
    const shape = shapesData.find(item => item.id === selectedShapeId);
    if (!shape) {
        inspectorContent.innerHTML = '<p class="placeholder-text">Select a shape on the canvas to customize its individual properties.</p>';
        return;
    }

    inspectorContent.innerHTML = `
        <div class="control-group">
            <div class="control-row">
                <label>Shape Fill Color</label>
                <input type="color" id="inspect-color" value="${shape.color}">
            </div>
        </div>
        <div class="control-group" style="margin-top: 15px;">
            <label>Width: <span id="val-w">${shape.width}</span>px</label>
            <input type="range" id="inspect-width" min="30" max="400" value="${shape.width}">
        </div>
        <div class="control-group" style="margin-top: 15px;">
            <label>Height: <span id="val-h">${shape.height}</span>px</label>
            <input type="range" id="inspect-height" min="30" max="400" value="${shape.height}">
        </div>
        <div class="control-group" style="margin-top: 15px;">
            <label>Rotation: <span id="val-r">${shape.rotation}</span>°</label>
            <input type="range" id="inspect-rotation" min="0" max="360" value="${shape.rotation}">
        </div>
        <div style="margin-top: 24px;">
            <button class="danger" id="delete-shape-btn" style="width: 100%; justify-content: center;">Delete Shape</button>
        </div>
    `;

    document.getElementById('inspect-color').addEventListener('input', (event) => {
        shape.color = event.target.value;
        renderCanvas();
    });

    document.getElementById('inspect-width').addEventListener('input', (event) => {
        shape.width = parseInt(event.target.value, 10);
        document.getElementById('val-w').innerText = shape.width;
        renderCanvas();
    });

    document.getElementById('inspect-height').addEventListener('input', (event) => {
        shape.height = parseInt(event.target.value, 10);
        document.getElementById('val-h').innerText = shape.height;
        renderCanvas();
    });

    document.getElementById('inspect-rotation').addEventListener('input', (event) => {
        shape.rotation = parseInt(event.target.value, 10);
        document.getElementById('val-r').innerText = shape.rotation;
        renderCanvas();
    });

    document.getElementById('delete-shape-btn').addEventListener('click', () => {
        shapesData = shapesData.filter(item => item.id !== selectedShapeId);
        selectShape(null);
    });
}

shapeItems.forEach(item => {
    item.addEventListener('dragstart', () => {
        draggedType = item.getAttribute('data-shape');
    });
});

dropZone.addEventListener('dragover', (event) => {
    event.preventDefault();
});

dropZone.addEventListener('drop', (event) => {
    event.preventDefault();
    if (!draggedType) return;

    const rect = dropZone.getBoundingClientRect();
    const isWideShape = draggedType === 'rectangle' || draggedType === 'ellipse';
    const shape = {
        id: `shape_${Date.now()}${Math.random().toString(36).substring(2, 9)}`,
        type: draggedType,
        x: Math.max(0, event.clientX - rect.left - 50),
        y: Math.max(0, event.clientY - rect.top - 50),
        width: isWideShape ? 140 : 100,
        height: isWideShape ? 80 : 100,
        color: '#3b82f6',
        rotation: 0
    };

    shapesData.push(shape);
    renderCanvas();
    selectShape(shape.id);
    draggedType = null;
});

bgColorPicker.addEventListener('input', (event) => {
    dropZone.style.backgroundColor = event.target.value;
});

dropZone.addEventListener('click', (event) => {
    if (event.target === dropZone) {
        selectShape(null);
    }
});

layersList.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-layer-action]');
    if (!button || button.disabled) return;

    const { layerAction, shapeId } = button.dataset;
    if (layerAction === 'select') {
        selectShape(shapeId);
    } else if (layerAction === 'forward') {
        moveShapeLayer(shapeId, 1);
    } else if (layerAction === 'backward') {
        moveShapeLayer(shapeId, -1);
    }
});

clearBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all shapes?')) {
        shapesData = [];
        selectShape(null);
    }
});

downloadBtn.addEventListener('click', () => {
    const bgColor = dropZone.style.backgroundColor || '#ffffff';
    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">\n`;
    svgContent += `  <rect width="800" height="600" fill="${bgColor}"/>\n`;

    shapesData.forEach(shape => {
        const innerSvg = getShapeSvg(shape.type, shape.color);
        const parsedSvg = new DOMParser().parseFromString(innerSvg, 'image/svg+xml');
        const innerElement = parsedSvg.documentElement.innerHTML;
        const viewBoxWidth = shape.type === 'rectangle' || shape.type === 'ellipse' ? 140 : 100;
        const viewBoxHeight = shape.type === 'rectangle' || shape.type === 'ellipse' ? 80 : 100;

        svgContent += `  <g transform="translate(${shape.x}, ${shape.y}) rotate(${shape.rotation} ${shape.width / 2} ${shape.height / 2})">\n`;
        svgContent += `    <svg width="${shape.width}" height="${shape.height}" viewBox="0 0 ${viewBoxWidth} ${viewBoxHeight}">\n`;
        svgContent += `      ${innerElement}\n`;
        svgContent += `    </svg>\n`;
        svgContent += `  </g>\n`;
    });

    svgContent += '</svg>';

    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'vector-artwork.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
});

renderLayers();
