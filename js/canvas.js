// canvas.js - 캔버스 관리 및 모든 편집 기능들 (완전판)

// 전역 변수
let selectedElement = null;
let elementCounter = 0;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let canvasZoom = 1.0;
let clipboard = null;

// ===========================================
// 🎯 요소 추가 기능들
// ===========================================

// 빠른 이미지 추가
function addQuickImage() {
    const defaultImageSrc = 'https://via.placeholder.com/150x150/667eea/white?text=이미지';
    addImageElement(defaultImageSrc, 100, 100);
}

// 빠른 도형 추가
function addQuickShape(shapeType) {
    const canvas = document.getElementById('canvas');
    const element = document.createElement('div');
    
    element.className = 'canvas-element canvas-shape';
    element.style.left = '100px';
    element.style.top = '100px';
    element.style.position = 'absolute';
    element.style.cursor = 'move';
    element.id = 'element-' + (++elementCounter);
    element.style.zIndex = '8';
    
    if (shapeType === 'circle') {
        element.style.width = '80px';
        element.style.height = '80px';
        element.style.borderRadius = '50%';
        element.style.backgroundColor = '#667eea';
    } else if (shapeType === 'rectangle') {
        element.style.width = '120px';
        element.style.height = '80px';
        element.style.backgroundColor = '#667eea';
    }
    
    // 클릭 이벤트 추가
    element.onclick = function() {
        selectElement(this);
    };
    
    // 드래그 이벤트 추가
    setupDragEvents(element);
    
    canvas.appendChild(element);
    selectElement(element);
}

// 이미지 요소 추가 (기존 함수 개선)
function addImageElement(src, x, y) {
    const canvas = document.getElementById('canvas');
    const element = document.createElement('img');
    
    element.className = 'canvas-element canvas-image';
    element.src = src;
    element.style.left = x + 'px';
    element.style.top = y + 'px';
    element.style.width = '150px';
    element.style.height = '150px';
    element.style.position = 'absolute';
    element.style.cursor = 'move';
    element.id = 'element-' + (++elementCounter);
    element.style.zIndex = '5';
    
    element.onclick = function() {
        selectElement(this);
    };
    
    // 🔥 드래그 이벤트 추가 (핵심!)
    setupDragEvents(element);
    
    canvas.appendChild(element);
    selectElement(element);
}

// 템플릿을 배경으로 추가 (기존 함수 유지)
function addTemplateAsBackground(imageSrc, templateName) {
    const canvas = document.getElementById('canvas');
    
    // 기존 배경 템플릿 제거
    const existingBg = canvas.querySelector('.canvas-background-template');
    if (existingBg) {
        existingBg.remove();
    }
    
    const bgElement = document.createElement('img');
    bgElement.className = 'canvas-element canvas-background-template';
    bgElement.src = imageSrc;
    bgElement.style.left = '0px';
    bgElement.style.top = '0px';
    bgElement.style.width = '100%';
    bgElement.style.height = '100%';
    bgElement.style.objectFit = 'cover';
    bgElement.style.zIndex = '1';
    bgElement.style.pointerEvents = 'none';
    bgElement.id = 'background-template';
    bgElement.alt = templateName;
    
    canvas.insertBefore(bgElement, canvas.firstChild);
    
    console.log(`배경 템플릿 적용됨: ${templateName}`);
}

// ===========================================
// 🖱️ 드래그 이동 기능 (핵심!)
// ===========================================

function setupDragEvents(element) {
    element.addEventListener('mousedown', function(e) {
        if (e.button !== 0) return; // 왼쪽 클릭만
        
        isDragging = true;
        const canvas = document.getElementById('canvas');
        const canvasRect = canvas.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        
        // 드래그 오프셋 계산
        dragOffset.x = e.clientX - elementRect.left;
        dragOffset.y = e.clientY - elementRect.top;
        
        // 요소 선택
        selectElement(element);
        
        // 드래그 스타일 적용
        element.style.opacity = '0.7';
        element.style.zIndex = '999';
        
        e.preventDefault();
        e.stopPropagation();
    });
}

// 전역 마우스 이벤트 리스너 (init.js에서 호출)
function setupGlobalDragEvents() {
    document.addEventListener('mousemove', function(e) {
        if (!isDragging || !selectedElement) return;
        
        const canvas = document.getElementById('canvas');
        const canvasRect = canvas.getBoundingClientRect();
        
        // 새 위치 계산
        let newX = e.clientX - canvasRect.left - dragOffset.x;
        let newY = e.clientY - canvasRect.top - dragOffset.y;
        
        // 캔버스 경계 제한
        newX = Math.max(0, Math.min(newX, canvasRect.width - 50));
        newY = Math.max(0, Math.min(newY, canvasRect.height - 50));
        
        // 위치 업데이트
        selectedElement.style.left = newX + 'px';
        selectedElement.style.top = newY + 'px';
        
        // 편집기 위치 값 업데이트
        updateEditorPositionValues(selectedElement);
        
        e.preventDefault();
    });
    
    document.addEventListener('mouseup', function(e) {
        if (isDragging && selectedElement) {
            // 드래그 종료
            isDragging = false;
            selectedElement.style.opacity = '';
            selectedElement.style.zIndex = selectedElement.style.zIndex === '999' ? '5' : selectedElement.style.zIndex;
            
            // 실시간 저장
            if (typeof saveCanvasState === 'function') {
                saveCanvasState();
            }
        }
    });
}

// 편집기 위치값 업데이트
function updateEditorPositionValues(element) {
    const textX = document.getElementById('text-x');
    const textY = document.getElementById('text-y');
    const imageX = document.getElementById('image-x');
    const imageY = document.getElementById('image-y');
    
    if (element.classList.contains('canvas-text')) {
        if (textX) textX.value = parseInt(element.style.left);
        if (textY) textY.value = parseInt(element.style.top);
    } else if (element.classList.contains('canvas-image')) {
        if (imageX) imageX.value = parseInt(element.style.left);
        if (imageY) imageY.value = parseInt(element.style.top);
    }
}

// ===========================================
// 🎯 요소 선택 및 관리
// ===========================================

// 요소 선택 (기존 함수 개선)
function selectElement(element) {
    // 배경 템플릿은 선택 불가
    if (element.classList.contains('canvas-background-template')) {
        return;
    }
    
    // 이전 선택 해제
    if (selectedElement) {
        selectedElement.classList.remove('selected');
        selectedElement.style.outline = '';
    }
    
    // 새 요소 선택
    selectedElement = element;
    element.classList.add('selected');
    element.style.outline = '2px solid #667eea';
    
    // 선택된 도구들 표시
    const selectedTools = document.getElementById('selected-tools');
    if (selectedTools) selectedTools.style.display = 'block';
    
    // PPT 편집기 업데이트
    if (typeof updatePPTEditor === 'function') {
        updatePPTEditor(element);
    }
}

// 선택 해제
function deselectAllElements() {
    if (selectedElement) {
        selectedElement.classList.remove('selected');
        selectedElement.style.outline = '';
        selectedElement = null;
    }
    
    const selectedTools = document.getElementById('selected-tools');
    if (selectedTools) selectedTools.style.display = 'none';
}

// 선택된 요소 삭제 (기존 함수 유지)
function deleteSelectedElement() {
    if (selectedElement) {
        selectedElement.remove();
        selectedElement = null;
        
        // 편집기 초기화
        const noSelection = document.getElementById('no-selection');
        const textEditor = document.getElementById('text-editor');
        const imageEditor = document.getElementById('image-editor');
        const selectedTools = document.getElementById('selected-tools');
        
        if (noSelection) noSelection.style.display = 'block';
        if (textEditor) textEditor.style.display = 'none';
        if (imageEditor) imageEditor.style.display = 'none';
        if (selectedTools) selectedTools.style.display = 'none';
        
        // 실시간 저장
        if (typeof saveCanvasState === 'function') {
            saveCanvasState();
        }
    }
}

// ===========================================
// 📐 정렬 기능들
// ===========================================

function alignLeft() {
    if (!selectedElement) return;
    selectedElement.style.left = '10px';
    updateEditorPositionValues(selectedElement);
    if (typeof saveCanvasState === 'function') saveCanvasState();
}

function alignCenter() {
    if (!selectedElement) return;
    const canvas = document.getElementById('canvas');
    const canvasWidth = canvas.offsetWidth;
    const elementWidth = selectedElement.offsetWidth;
    const centerX = (canvasWidth - elementWidth) / 2;
    selectedElement.style.left = centerX + 'px';
    updateEditorPositionValues(selectedElement);
    if (typeof saveCanvasState === 'function') saveCanvasState();
}

function alignRight() {
    if (!selectedElement) return;
    const canvas = document.getElementById('canvas');
    const canvasWidth = canvas.offsetWidth;
    const elementWidth = selectedElement.offsetWidth;
    const rightX = canvasWidth - elementWidth - 10;
    selectedElement.style.left = rightX + 'px';
    updateEditorPositionValues(selectedElement);
    if (typeof saveCanvasState === 'function') saveCanvasState();
}

function alignTop() {
    if (!selectedElement) return;
    selectedElement.style.top = '10px';
    updateEditorPositionValues(selectedElement);
    if (typeof saveCanvasState === 'function') saveCanvasState();
}

function alignMiddle() {
    if (!selectedElement) return;
    const canvas = document.getElementById('canvas');
    const canvasHeight = canvas.offsetHeight;
    const elementHeight = selectedElement.offsetHeight;
    const middleY = (canvasHeight - elementHeight) / 2;
    selectedElement.style.top = middleY + 'px';
    updateEditorPositionValues(selectedElement);
    if (typeof saveCanvasState === 'function') saveCanvasState();
}

function alignBottom() {
    if (!selectedElement) return;
    const canvas = document.getElementById('canvas');
    const canvasHeight = canvas.offsetHeight;
    const elementHeight = selectedElement.offsetHeight;
    const bottomY = canvasHeight - elementHeight - 10;
    selectedElement.style.top = bottomY + 'px';
    updateEditorPositionValues(selectedElement);
    if (typeof saveCanvasState === 'function') saveCanvasState();
}

// ===========================================
// 📚 레이어 관리
// ===========================================

function bringToFront() {
    if (!selectedElement) return;
    selectedElement.style.zIndex = '100';
    if (typeof saveCanvasState === 'function') saveCanvasState();
}

function sendToBack() {
    if (!selectedElement) return;
    selectedElement.style.zIndex = '2';
    if (typeof saveCanvasState === 'function') saveCanvasState();
}

function moveForward() {
    if (!selectedElement) return;
    const currentZ = parseInt(selectedElement.style.zIndex) || 5;
    selectedElement.style.zIndex = (currentZ + 1).toString();
    if (typeof saveCanvasState === 'function') saveCanvasState();
}

function moveBackward() {
    if (!selectedElement) return;
    const currentZ = parseInt(selectedElement.style.zIndex) || 5;
    selectedElement.style.zIndex = Math.max(2, currentZ - 1).toString();
    if (typeof saveCanvasState === 'function') saveCanvasState();
}

// ===========================================
// 📋 복사/붙여넣기/그룹
// ===========================================

function copySelectedElement() {
    if (!selectedElement) return;
    
    clipboard = {
        className: selectedElement.className,
        innerHTML: selectedElement.innerHTML,
        textContent: selectedElement.textContent,
        src: selectedElement.src,
        style: selectedElement.style.cssText,
        type: getElementType(selectedElement)
    };
    
    console.log('요소 복사됨');
    
    // 시각적 피드백
    const originalOpacity = selectedElement.style.opacity;
    selectedElement.style.opacity = '0.5';
    setTimeout(() => {
        if (selectedElement) selectedElement.style.opacity = originalOpacity;
    }, 200);
}

function duplicateElement() {
    if (!selectedElement) return;
    
    const canvas = document.getElementById('canvas');
    const type = getElementType(selectedElement);
    let newElement;
    
    if (type === 'text') {
        newElement = document.createElement('div');
        newElement.textContent = selectedElement.textContent;
        newElement.onclick = function() {
            if (typeof selectTextElement === 'function') {
                selectTextElement(this);
            } else {
                selectElement(this);
            }
        };
    } else if (type === 'image') {
        newElement = document.createElement('img');
        newElement.src = selectedElement.src;
        newElement.onclick = function() {
            selectElement(this);
        };
    } else if (type === 'shape') {
        newElement = document.createElement('div');
        newElement.onclick = function() {
            selectElement(this);
        };
    } else {
        return;
    }
    
    // 스타일 복사
    newElement.className = selectedElement.className;
    newElement.style.cssText = selectedElement.style.cssText;
    
    // 새 ID와 위치 설정
    newElement.id = 'element-' + (++elementCounter);
    const currentLeft = parseInt(selectedElement.style.left) || 0;
    const currentTop = parseInt(selectedElement.style.top) || 0;
    newElement.style.left = (currentLeft + 20) + 'px';
    newElement.style.top = (currentTop + 20) + 'px';
    
    // 드래그 이벤트 추가
    setupDragEvents(newElement);
    
    canvas.appendChild(newElement);
    selectElement(newElement);
    
    if (typeof saveCanvasState === 'function') saveCanvasState();
}

function groupElements() {
    // 그룹 기능은 복잡하므로 일단 알림만
    alert('그룹 기능은 개발 예정입니다.');
}

// ===========================================
// 🔍 줌 기능
// ===========================================

function zoomIn() {
    canvasZoom = Math.min(canvasZoom + 0.1, 3.0);
    applyZoom();
}

function zoomOut() {
    canvasZoom = Math.max(canvasZoom - 0.1, 0.3);
    applyZoom();
}

function applyZoom() {
    const canvas = document.getElementById('canvas');
    const zoomLevel = document.getElementById('zoom-level');
    
    canvas.style.transform = `scale(${canvasZoom})`;
    canvas.style.transformOrigin = 'top left';
    
    if (zoomLevel) {
        zoomLevel.textContent = Math.round(canvasZoom * 100) + '%';
    }
}

// ===========================================
// 🔄 캔버스 관리
// ===========================================

// 배경 변경 (기존 함수 유지)
function changeBackground(background) {
    removeBackgroundTemplate();
    document.getElementById('canvas').style.background = background;
    if (typeof saveCanvasState === 'function') saveCanvasState();
}

// 배경 템플릿 제거 (기존 함수 유지)
function removeBackgroundTemplate() {
    const canvas = document.getElementById('canvas');
    const bgTemplate = canvas.querySelector('.canvas-background-template');
    if (bgTemplate) {
        bgTemplate.remove();
        console.log('배경 템플릿 제거됨');
        return true;
    }
    return false;
}

// 캔버스 초기화 (기존 함수 유지)
function clearCanvas() {
    if (confirm('캔버스의 모든 요소를 삭제하시겠습니까?')) {
        const canvas = document.getElementById('canvas');
        const elements = canvas.querySelectorAll('.canvas-element');
        elements.forEach(element => element.remove());
        
        selectedElement = null;
        const noSelection = document.getElementById('no-selection');
        const textEditor = document.getElementById('text-editor');
        const imageEditor = document.getElementById('image-editor');
        const selectedTools = document.getElementById('selected-tools');
        
        if (noSelection) noSelection.style.display = 'block';
        if (textEditor) textEditor.style.display = 'none';
        if (imageEditor) imageEditor.style.display = 'none';
        if (selectedTools) selectedTools.style.display = 'none';
        
        // 배경도 초기화
        canvas.style.background = '#333';
        
        if (typeof saveCanvasState === 'function') saveCanvasState();
        console.log('캔버스 초기화 완료');
    }
}

// 캔버스 리셋 (줌 포함)
function resetCanvas() {
    if (confirm('캔버스를 완전히 초기화하시겠습니까? (줌, 배경 등 모든 설정 포함)')) {
        clearCanvas();
        
        // 줌 리셋
        canvasZoom = 1.0;
        applyZoom();
        
        // 배경 리셋
        const canvas = document.getElementById('canvas');
        canvas.style.background = '#333';
        canvas.style.transform = '';
        
        console.log('캔버스 완전 리셋 완료');
    }
}

// ===========================================
// 🛠️ 유틸리티 함수들
// ===========================================

// 요소 타입 확인
function getElementType(element) {
    if (element.classList.contains('canvas-text')) return 'text';
    if (element.classList.contains('canvas-image')) return 'image';
    if (element.classList.contains('canvas-shape')) return 'shape';
    if (element.classList.contains('canvas-background-template')) return 'background-template';
    return 'unknown';
}

// ===========================================
// 🚀 초기화
// ===========================================

document.addEventListener('DOMContentLoaded', function() {
    // 전역 드래그 이벤트 설정
    setupGlobalDragEvents();
    
    // 캔버스 클릭시 선택 해제
    const canvas = document.getElementById('canvas');
    if (canvas) {
        canvas.addEventListener('click', function(e) {
            if (e.target === canvas) {
                deselectAllElements();
            }
        });
    }
    
    console.log('✅ Canvas.js 완전판 로드 완료 - 드래그, 정렬, 레이어 모든 기능 활성화');
});