// editor.js - PPT 편집기 관련 모든 함수들 (완전판)

// 전역 변수
let aspectRatioLocked = false;
let originalImageRatio = 1;

// ===========================================
// 🎨 PPT 편집기 업데이트 (기존 함수 개선)
// ===========================================

function updatePPTEditor(element) {
    // 모든 편집기 숨김
    const noSelection = document.getElementById('no-selection');
    const textEditor = document.getElementById('text-editor');
    const imageEditor = document.getElementById('image-editor');
    const selectedTools = document.getElementById('selected-tools');
    
    if (noSelection) noSelection.style.display = 'none';
    if (textEditor) textEditor.style.display = 'none';
    if (imageEditor) imageEditor.style.display = 'none';
    if (selectedTools) selectedTools.style.display = 'block';
    
    if (element.classList.contains('canvas-text')) {
        // 텍스트 편집은 text.js에서 처리
        if (typeof selectTextElement === 'function') {
            selectTextElement(element);
        }
        
    } else if (element.classList.contains('canvas-image')) {
        // 이미지 편집기 표시
        if (imageEditor) imageEditor.style.display = 'block';
        
        // 현재 값 설정
        updateImageEditorValues(element);
        
        // 이벤트 리스너 설정
        setupImageEditor(element);
        
    } else if (element.classList.contains('canvas-shape')) {
        // 도형은 기본 선택 도구만 표시
        if (selectedTools) selectedTools.style.display = 'block';
    }
}

// ===========================================
// 🖼️ 이미지 편집기 설정 및 업데이트
// ===========================================

function updateImageEditorValues(element) {
    const imageWidth = document.getElementById('image-width');
    const imageHeight = document.getElementById('image-height');
    const imageWidthValue = document.getElementById('image-width-value');
    const imageHeightValue = document.getElementById('image-height-value');
    const imageX = document.getElementById('image-x');
    const imageY = document.getElementById('image-y');
    const imageOpacity = document.getElementById('image-opacity');
    const imageOpacityValue = document.getElementById('image-opacity-value');
    const imageRotation = document.getElementById('image-rotation');
    const imageRotationValue = document.getElementById('image-rotation-value');
    
    const currentWidth = parseInt(element.style.width) || 150;
    const currentHeight = parseInt(element.style.height) || 150;
    const currentOpacity = parseFloat(element.style.opacity) || 1;
    const currentRotation = getCurrentRotation(element);
    
    if (imageWidth) {
        imageWidth.value = currentWidth;
        imageWidth.max = Math.min(500, document.getElementById('canvas').offsetWidth - 20);
    }
    if (imageHeight) {
        imageHeight.value = currentHeight;
        imageHeight.max = Math.min(600, document.getElementById('canvas').offsetHeight - 20);
    }
    if (imageWidthValue) imageWidthValue.textContent = currentWidth + 'px';
    if (imageHeightValue) imageHeightValue.textContent = currentHeight + 'px';
    if (imageX) imageX.value = parseInt(element.style.left) || 0;
    if (imageY) imageY.value = parseInt(element.style.top) || 0;
    if (imageOpacity) imageOpacity.value = Math.round(currentOpacity * 100);
    if (imageOpacityValue) imageOpacityValue.textContent = Math.round(currentOpacity * 100) + '%';
    if (imageRotation) imageRotation.value = currentRotation;
    if (imageRotationValue) imageRotationValue.textContent = currentRotation + '°';
    
    // 비율 계산
    originalImageRatio = currentWidth / currentHeight;
}

function setupImageEditor(element) {
    const imageWidth = document.getElementById('image-width');
    const imageHeight = document.getElementById('image-height');
    const imageWidthValue = document.getElementById('image-width-value');
    const imageHeightValue = document.getElementById('image-height-value');
    const imageX = document.getElementById('image-x');
    const imageY = document.getElementById('image-y');
    const imageOpacity = document.getElementById('image-opacity');
    const imageOpacityValue = document.getElementById('image-opacity-value');
    const imageRotation = document.getElementById('image-rotation');
    const imageRotationValue = document.getElementById('image-rotation-value');
    
    if (imageWidth) {
        imageWidth.oninput = function() {
            element.style.width = this.value + 'px';
            if (imageWidthValue) imageWidthValue.textContent = this.value + 'px';
            
            // 비율 고정 처리
            if (aspectRatioLocked && imageHeight && imageHeightValue) {
                const newHeight = Math.round(this.value / originalImageRatio);
                imageHeight.value = newHeight;
                imageHeightValue.textContent = newHeight + 'px';
                element.style.height = newHeight + 'px';
            }
            
            if (typeof saveCanvasState === 'function') saveCanvasState();
        };
    }
    
    if (imageHeight) {
        imageHeight.oninput = function() {
            element.style.height = this.value + 'px';
            if (imageHeightValue) imageHeightValue.textContent = this.value + 'px';
            
            // 비율 고정 처리
            if (aspectRatioLocked && imageWidth && imageWidthValue) {
                const newWidth = Math.round(this.value * originalImageRatio);
                imageWidth.value = newWidth;
                imageWidthValue.textContent = newWidth + 'px';
                element.style.width = newWidth + 'px';
            }
            
            if (typeof saveCanvasState === 'function') saveCanvasState();
        };
    }
    
    if (imageX) {
        imageX.onchange = function() {
            element.style.left = this.value + 'px';
            if (typeof saveCanvasState === 'function') saveCanvasState();
        };
    }
    
    if (imageY) {
        imageY.onchange = function() {
            element.style.top = this.value + 'px';
            if (typeof saveCanvasState === 'function') saveCanvasState();
        };
    }
    
    if (imageOpacity) {
        imageOpacity.oninput = function() {
            const opacity = this.value / 100;
            element.style.opacity = opacity;
            if (imageOpacityValue) imageOpacityValue.textContent = this.value + '%';
            if (typeof saveCanvasState === 'function') saveCanvasState();
        };
    }
    
    if (imageRotation) {
        imageRotation.oninput = function() {
            const rotation = this.value;
            setElementRotation(element, rotation);
            if (imageRotationValue) imageRotationValue.textContent = rotation + '°';
            if (typeof saveCanvasState === 'function') saveCanvasState();
        };
    }
}

// ===========================================
// 🔧 이미지 편집 기능들
// ===========================================

// 비율 고정 토글
function toggleAspectRatio() {
    if (!window.selectedElement || !window.selectedElement.classList.contains('canvas-image')) {
        alert('이미지를 먼저 선택해주세요.');
        return;
    }
    
    aspectRatioLocked = !aspectRatioLocked;
    const lockBtn = document.getElementById('lock-ratio-btn');
    
    if (aspectRatioLocked) {
        // 현재 비율 저장
        const element = window.selectedElement;
        const currentWidth = parseInt(element.style.width) || 150;
        const currentHeight = parseInt(element.style.height) || 150;
        originalImageRatio = currentWidth / currentHeight;
        
        if (lockBtn) {
            lockBtn.style.backgroundColor = '#667eea';
            lockBtn.innerHTML = '🔒 비율고정 ON';
        }
        console.log('비율 고정 활성화:', originalImageRatio);
    } else {
        if (lockBtn) {
            lockBtn.style.backgroundColor = '#555';
            lockBtn.innerHTML = '🔓 비율고정';
        }
        console.log('비율 고정 해제');
    }
}

// 이미지 원래 크기로 복원
function resetImageSize() {
    if (!window.selectedElement || !window.selectedElement.classList.contains('canvas-image')) {
        alert('이미지를 먼저 선택해주세요.');
        return;
    }
    
    const element = window.selectedElement;
    element.style.width = '150px';
    element.style.height = '150px';
    element.style.transform = 'rotate(0deg)';
    element.style.opacity = '1';
    
    // 편집기 값들 업데이트
    updateImageEditorValues(element);
    
    if (typeof saveCanvasState === 'function') saveCanvasState();
    console.log('이미지 크기 및 효과 초기화');
}

// 좌우 뒤집기
function flipImageH() {
    if (!window.selectedElement || !window.selectedElement.classList.contains('canvas-image')) {
        alert('이미지를 먼저 선택해주세요.');
        return;
    }
    
    const element = window.selectedElement;
    const currentTransform = element.style.transform || '';
    
    if (currentTransform.includes('scaleX(-1)')) {
        element.style.transform = currentTransform.replace('scaleX(-1)', 'scaleX(1)');
    } else {
        element.style.transform = currentTransform + ' scaleX(-1)';
    }
    
    if (typeof saveCanvasState === 'function') saveCanvasState();
    console.log('이미지 좌우 뒤집기');
}

// 상하 뒤집기
function flipImageV() {
    if (!window.selectedElement || !window.selectedElement.classList.contains('canvas-image')) {
        alert('이미지를 먼저 선택해주세요.');
        return;
    }
    
    const element = window.selectedElement;
    const currentTransform = element.style.transform || '';
    
    if (currentTransform.includes('scaleY(-1)')) {
        element.style.transform = currentTransform.replace('scaleY(-1)', 'scaleY(1)');
    } else {
        element.style.transform = currentTransform + ' scaleY(-1)';
    }
    
    if (typeof saveCanvasState === 'function') saveCanvasState();
    console.log('이미지 상하 뒤집기');
}

// 이미지 회전
function rotateImage(angle) {
    if (!window.selectedElement || !window.selectedElement.classList.contains('canvas-image')) {
        alert('이미지를 먼저 선택해주세요.');
        return;
    }
    
    const element = window.selectedElement;
    const currentRotation = getCurrentRotation(element);
    const newRotation = (currentRotation + angle) % 360;
    
    setElementRotation(element, newRotation);
    
    // 회전 슬라이더 업데이트
    const rotationSlider = document.getElementById('image-rotation');
    const rotationValue = document.getElementById('image-rotation-value');
    if (rotationSlider) rotationSlider.value = newRotation;
    if (rotationValue) rotationValue.textContent = newRotation + '°';
    
    if (typeof saveCanvasState === 'function') saveCanvasState();
    console.log(`이미지 ${angle}도 회전 -> 총 ${newRotation}도`);
}

// 현재 회전값 가져오기
function getCurrentRotation(element) {
    const transform = element.style.transform || '';
    const rotateMatch = transform.match(/rotate\((-?\d+(?:\.\d+)?)deg\)/);
    return rotateMatch ? parseFloat(rotateMatch[1]) : 0;
}

// 요소 회전 설정
function setElementRotation(element, rotation) {
    const currentTransform = element.style.transform || '';
    const withoutRotate = currentTransform.replace(/rotate\([^)]*\)/g, '').trim();
    element.style.transform = withoutRotate + ` rotate(${rotation}deg)`;
}

// 이미지 필터 적용
function applyImageFilter(filterType) {
    if (!window.selectedElement || !window.selectedElement.classList.contains('canvas-image')) {
        alert('이미지를 먼저 선택해주세요.');
        return;
    }
    
    const element = window.selectedElement;
    
    switch(filterType) {
        case 'none':
            element.style.filter = 'none';
            break;
        case 'grayscale':
            element.style.filter = 'grayscale(100%)';
            break;
        case 'sepia':
            element.style.filter = 'sepia(100%)';
            break;
        case 'blur':
            element.style.filter = 'blur(2px)';
            break;
        case 'brightness':
            element.style.filter = 'brightness(150%)';
            break;
        case 'contrast':
            element.style.filter = 'contrast(150%)';
            break;
        case 'saturate':
            element.style.filter = 'saturate(200%)';
            break;
        default:
            element.style.filter = 'none';
    }
    
    if (typeof saveCanvasState === 'function') saveCanvasState();
    console.log(`이미지 필터 적용: ${filterType}`);
}

// ===========================================
// 🎨 추가 편집 기능들
// ===========================================

// 이미지 경계선 추가
function addImageBorder() {
    if (!window.selectedElement || !window.selectedElement.classList.contains('canvas-image')) {
        alert('이미지를 먼저 선택해주세요.');
        return;
    }
    
    const element = window.selectedElement;
    const currentBorder = element.style.border;
    
    if (currentBorder && currentBorder.includes('solid')) {
        element.style.border = 'none';
    } else {
        element.style.border = '3px solid #667eea';
        element.style.borderRadius = '8px';
    }
    
    if (typeof saveCanvasState === 'function') saveCanvasState();
}

// 이미지 그림자 효과
function addImageShadow() {
    if (!window.selectedElement || !window.selectedElement.classList.contains('canvas-image')) {
        alert('이미지를 먼저 선택해주세요.');
        return;
    }
    
    const element = window.selectedElement;
    const currentShadow = element.style.boxShadow;
    
    if (currentShadow && currentShadow !== 'none') {
        element.style.boxShadow = 'none';
    } else {
        element.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
    }
    
    if (typeof saveCanvasState === 'function') saveCanvasState();
}

// ===========================================
// 🎯 선택된 요소 고급 도구들
// ===========================================

// 요소 복제 (위치 조정)
function smartDuplicateElement() {
    if (!window.selectedElement) {
        alert('요소를 먼저 선택해주세요.');
        return;
    }
    
    // canvas.js의 duplicateElement 호출
    if (typeof duplicateElement === 'function') {
        duplicateElement();
    } else {
        console.error('duplicateElement 함수를 찾을 수 없습니다.');
    }
}

// 요소 스타일 복사
function copyElementStyle() {
    if (!window.selectedElement) {
        alert('요소를 먼저 선택해주세요.');
        return;
    }
    
    window.copiedStyle = {
        cssText: window.selectedElement.style.cssText,
        className: window.selectedElement.className
    };
    
    console.log('스타일 복사됨');
    
    // 시각적 피드백
    const element = window.selectedElement;
    const originalTransform = element.style.transform;
    element.style.transform = (originalTransform || '') + ' scale(1.05)';
    setTimeout(() => {
        if (window.selectedElement === element) {
            element.style.transform = originalTransform;
        }
    }, 200);
}

// 요소 스타일 붙여넣기
function pasteElementStyle() {
    if (!window.selectedElement) {
        alert('요소를 먼저 선택해주세요.');
        return;
    }
    
    if (!window.copiedStyle) {
        alert('복사된 스타일이 없습니다.');
        return;
    }
    
    // 위치는 유지하고 나머지 스타일만 적용
    const currentLeft = window.selectedElement.style.left;
    const currentTop = window.selectedElement.style.top;
    const currentId = window.selectedElement.id;
    
    window.selectedElement.style.cssText = window.copiedStyle.cssText;
    window.selectedElement.style.left = currentLeft;
    window.selectedElement.style.top = currentTop;
    window.selectedElement.id = currentId;
    
    // 편집기 값들 업데이트
    if (window.selectedElement.classList.contains('canvas-image')) {
        updateImageEditorValues(window.selectedElement);
    }
    
    if (typeof saveCanvasState === 'function') saveCanvasState();
    console.log('스타일 붙여넣기 완료');
}

// ===========================================
// 🔗 이벤트 리스너 및 초기화
// ===========================================

document.addEventListener('DOMContentLoaded', function() {
    // 비율 고정 버튼 초기 상태 설정
    const lockBtn = document.getElementById('lock-ratio-btn');
    if (lockBtn) {
        lockBtn.style.backgroundColor = '#555';
    }
    
    // 키보드 단축키 설정
    document.addEventListener('keydown', function(e) {
        if (!window.selectedElement) return;
        
        // Ctrl/Cmd + D: 복제
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            smartDuplicateElement();
        }
        
        // Ctrl/Cmd + Shift + C: 스타일 복사
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
            e.preventDefault();
            copyElementStyle();
        }
        
        // Ctrl/Cmd + Shift + V: 스타일 붙여넣기
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'V') {
            e.preventDefault();
            pasteElementStyle();
        }
        
        // R키: 90도 회전
        if (e.key === 'r' || e.key === 'R') {
            if (window.selectedElement && window.selectedElement.classList.contains('canvas-image')) {
                e.preventDefault();
                rotateImage(90);
            }
        }
        
        // F키: 좌우 뒤집기
        if (e.key === 'f' || e.key === 'F') {
            if (window.selectedElement && window.selectedElement.classList.contains('canvas-image')) {
                e.preventDefault();
                flipImageH();
            }
        }
    });
    
    console.log('✅ Editor.js 완전판 로드 완료 - 이미지 편집 모든 기능 + 키보드 단축키 활성화');
});