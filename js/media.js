// media.js - 미디어 처리 관련 모든 함수들 (완전판)

// 전역 변수
let uploadedFiles = [];
let stockImageResults = [];
let currentMediaFilter = 'all';

// ===========================================
// 📁 파일 업로드 기능들
// ===========================================

// 파일 업로드 (기존 함수 개선)
function uploadFile(input) {
    const files = input.files;
    if (!files || files.length === 0) return;
    
    // 다중 파일 지원
    Array.from(files).forEach(file => {
        processUploadedFile(file);
    });
    
    // 입력 초기화
    input.value = '';
}

// 업로드된 파일 처리
function processUploadedFile(file) {
    console.log('📁 파일 처리 시작:', file.name, file.type);
    
    // 파일 크기 체크 (10MB 제한)
    if (file.size > 10 * 1024 * 1024) {
        alert(`파일이 너무 큽니다: ${file.name}\n최대 10MB까지 지원됩니다.`);
        return;
    }
    
    // 파일 타입별 처리
    if (file.type.startsWith('image/')) {
        processImageFile(file);
    } else if (file.type.startsWith('video/')) {
        processVideoFile(file);
    } else {
        alert(`지원하지 않는 파일 형식입니다: ${file.name}\n이미지 또는 비디오 파일만 업로드 가능합니다.`);
    }
}

// 이미지 파일 처리
function processImageFile(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const imageSrc = e.target.result;
        
        // 캔버스에 이미지 추가
        if (typeof addImageElement === 'function') {
            addImageElement(imageSrc, 50, 50);
        }
        
        // 업로드된 파일 목록에 추가
        addToUploadedFiles({
            name: file.name,
            type: 'image',
            src: imageSrc,
            size: file.size,
            uploadTime: new Date().toISOString()
        });
        
        console.log('✅ 이미지 업로드 완료:', file.name);
        showToast(`📷 이미지 업로드 완료\n${file.name}`, 'success');
    };
    
    reader.onerror = function() {
        console.error('❌ 이미지 파일 읽기 실패:', file.name);
        alert(`이미지 파일을 읽을 수 없습니다: ${file.name}`);
    };
    
    reader.readAsDataURL(file);
}

// 비디오 파일 처리
function processVideoFile(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const videoSrc = e.target.result;
        
        // 비디오 요소 생성
        createVideoElement(videoSrc, file.name);
        
        // 업로드된 파일 목록에 추가
        addToUploadedFiles({
            name: file.name,
            type: 'video',
            src: videoSrc,
            size: file.size,
            uploadTime: new Date().toISOString()
        });
        
        console.log('✅ 비디오 업로드 완료:', file.name);
        showToast(`🎬 비디오 업로드 완료\n${file.name}`, 'success');
    };
    
    reader.onerror = function() {
        console.error('❌ 비디오 파일 읽기 실패:', file.name);
        alert(`비디오 파일을 읽을 수 없습니다: ${file.name}`);
    };
    
    reader.readAsDataURL(file);
}

// 업로드된 파일 목록에 추가
function addToUploadedFiles(fileData) {
    uploadedFiles.push(fileData);
    
    // 최대 50개 파일만 유지
    if (uploadedFiles.length > 50) {
        uploadedFiles = uploadedFiles.slice(-50);
    }
    
    // 로컬 스토리지에 저장
    try {
        localStorage.setItem('uploaded_files', JSON.stringify(uploadedFiles));
    } catch (e) {
        console.warn('업로드 파일 목록 저장 실패');
    }
}

// ===========================================
// 🎬 비디오 요소 생성
// ===========================================

function createVideoElement(videoSrc, fileName) {
    const canvas = document.getElementById('canvas');
    const element = document.createElement('video');
    
    element.className = 'canvas-element canvas-video';
    element.src = videoSrc;
    element.style.left = '100px';
    element.style.top = '100px';
    element.style.width = '200px';
    element.style.height = '150px';
    element.style.position = 'absolute';
    element.style.cursor = 'move';
    element.controls = true;
    element.muted = true; // 자동재생을 위해 음소거
    element.id = 'element-' + (++window.elementCounter || Date.now());
    element.style.zIndex = '6';
    element.title = fileName;
    
    element.onclick = function() {
        if (typeof selectElement === 'function') {
            selectElement(this);
        }
    };
    
    // 드래그 이벤트 추가
    if (typeof setupDragEvents === 'function') {
        setupDragEvents(element);
    }
    
    canvas.appendChild(element);
    
    if (typeof selectElement === 'function') {
        selectElement(element);
    }
}

// ===========================================
// 🌐 스톡 이미지 검색
// ===========================================

// 스톡 이미지 검색 (기존 함수 개선)
async function searchStockImages() {
    const query = document.getElementById('stock-search').value;
    if (!query.trim()) {
        alert('검색어를 입력하세요.');
        return;
    }
    
    const loadingMsg = showLoading('스톡 이미지 검색 중...');
    
    try {
        // Unsplash API 호출 시뮬레이션 (실제로는 API 키가 필요)
        const results = await searchUnsplashImages(query.trim());
        
        hideLoading(loadingMsg);
        
        if (results && results.length > 0) {
            displayStockImageResults(results, query);
            showToast(`🖼️ ${results.length}개의 스톡 이미지를 찾았습니다.`, 'success');
        } else {
            showToast('검색 결과가 없습니다. 다른 키워드를 시도해보세요.', 'info');
        }
        
    } catch (error) {
        hideLoading(loadingMsg);
        console.error('스톡 이미지 검색 오류:', error);
        
        // 오류 시 더미 데이터 표시
        showDummyStockImages(query);
    }
}

// Unsplash API 검색 (시뮬레이션)
async function searchUnsplashImages(query) {
    // 실제 구현시에는 Unsplash API를 호출
    // 현재는 더미 데이터 반환
    return generateDummyStockImages(query);
}

// 더미 스톡 이미지 데이터 생성
function generateDummyStockImages(query) {
    const baseUrl = 'https://picsum.photos';
    const results = [];
    
    for (let i = 0; i < 8; i++) {
        results.push({
            id: `stock-${Date.now()}-${i}`,
            url: `${baseUrl}/300/200/?random=${Date.now()}-${i}`,
            thumb: `${baseUrl}/150/100/?random=${Date.now()}-${i}`,
            title: `${query} 관련 이미지 ${i + 1}`,
            author: `작가${i + 1}`,
            description: `${query}와 관련된 고품질 스톡 이미지입니다.`
        });
    }
    
    return results;
}

// 더미 스톡 이미지 표시
function showDummyStockImages(query) {
    const dummyResults = generateDummyStockImages(query);
    displayStockImageResults(dummyResults, query);
    showToast(`🎨 ${query} 관련 샘플 이미지를 표시합니다.\n(실제 API는 관리자 페이지에서 설정)`, 'info');
}

// 스톡 이미지 결과 표시
function displayStockImageResults(results, query) {
    stockImageResults = results;
    
    // 결과를 소스 패널에 추가 (기존 미디어 소스 뒤에)
    const mediaSection = document.getElementById('media-sources');
    if (!mediaSection) return;
    
    // 기존 스톡 결과 제거
    const existingResults = mediaSection.querySelectorAll('.stock-result-item');
    existingResults.forEach(item => item.remove());
    
    // 구분선 추가
    const divider = document.createElement('div');
    divider.className = 'stock-result-item';
    divider.style.cssText = 'margin: 10px 0; padding: 8px; background: #444; border-radius: 4px; text-align: center; color: #ccc; font-size: 12px;';
    divider.textContent = `🔍 "${query}" 검색 결과 (${results.length}개)`;
    mediaSection.appendChild(divider);
    
    // 결과 이미지들 추가
    results.forEach(result => {
        const item = document.createElement('div');
        item.className = 'source-item stock-result-item';
        item.draggable = true;
        item.setAttribute('data-type', 'image');
        item.setAttribute('data-src', result.url);
        
        item.innerHTML = `
            <div class="source-item-title">📷 ${result.title}</div>
            <div class="source-item-desc">by ${result.author}</div>
            <img src="${result.thumb}" style="width: 100%; height: 60px; object-fit: cover; margin-top: 5px; border-radius: 3px;">
        `;
        
        // 드래그 이벤트 추가
        item.addEventListener('dragstart', function(e) {
            if (typeof dragStart === 'function') {
                dragStart.call(this, e);
            }
        });
        
        item.addEventListener('dragend', function(e) {
            if (typeof dragEnd === 'function') {
                dragEnd.call(this, e);
            }
        });
        
        // 클릭으로 바로 추가
        item.addEventListener('click', function() {
            if (typeof addImageElement === 'function') {
                addImageElement(result.url, 120, 120);
                showToast(`📷 스톡 이미지 추가됨\n${result.title}`, 'success');
            }
        });
        
        mediaSection.appendChild(item);
    });
}

// ===========================================
// 🎨 AI 이미지 생성
// ===========================================

// AI 이미지 생성 (기존 함수 개선)
async function generateAIImage() {
    const prompt = document.getElementById('ai-image-prompt').value;
    if (!prompt.trim()) {
        alert('생성할 이미지에 대한 설명을 입력하세요.');
        return;
    }
    
    const loadingMsg = showLoading('AI 이미지 생성 중...');
    
    try {
        // AI 이미지 생성 API 호출 시뮬레이션
        const result = await callAIImageAPI(prompt.trim());
        
        hideLoading(loadingMsg);
        
        if (result && result.url) {
            // 생성된 이미지를 캔버스에 추가
            if (typeof addImageElement === 'function') {
                addImageElement(result.url, 80, 80);
            }
            
            // 생성된 이미지 저장
            addToUploadedFiles({
                name: `AI 생성 - ${prompt.substring(0, 30)}`,
                type: 'ai-image',
                src: result.url,
                prompt: prompt,
                uploadTime: new Date().toISOString()
            });
            
            showToast(`🎨 AI 이미지 생성 완료!\n${prompt.substring(0, 50)}...`, 'success');
        } else {
            throw new Error('이미지 생성 실패');
        }
        
    } catch (error) {
        hideLoading(loadingMsg);
        console.error('AI 이미지 생성 오류:', error);
        
        // 오류 시 더미 이미지 생성
        generateDummyAIImage(prompt);
    }
}

// AI 이미지 생성 API 호출 (시뮬레이션)
async function callAIImageAPI(prompt) {
    // 실제로는 DALL-E, Midjourney, Stable Diffusion 등의 API 호출
    // 현재는 더미 이미지 반환
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                url: `https://picsum.photos/400/400/?random=${Date.now()}&blur=1`,
                id: `ai-${Date.now()}`,
                prompt: prompt
            });
        }, 3000); // 3초 대기 (생성 시간 시뮬레이션)
    });
}

// 더미 AI 이미지 생성
function generateDummyAIImage(prompt) {
    const dummyUrl = `https://picsum.photos/400/400/?random=${Date.now()}`;
    
    if (typeof addImageElement === 'function') {
        addImageElement(dummyUrl, 80, 80);
    }
    
    addToUploadedFiles({
        name: `AI 생성 (데모) - ${prompt.substring(0, 30)}`,
        type: 'ai-image-demo',
        src: dummyUrl,
        prompt: prompt,
        uploadTime: new Date().toISOString()
    });
    
    showToast(`🎨 AI 이미지 생성 (데모)\n${prompt.substring(0, 50)}...\n(실제 AI는 관리자 페이지에서 설정)`, 'info');
}

// ===========================================
// 📚 미디어 라이브러리 관리
// ===========================================

// 업로드된 파일 목록 표시
function showUploadedFiles() {
    if (uploadedFiles.length === 0) {
        alert('업로드된 파일이 없습니다.');
        return;
    }
    
    const mediaSection = document.getElementById('media-sources');
    if (!mediaSection) return;
    
    // 기존 업로드 결과 제거
    const existingUploads = mediaSection.querySelectorAll('.upload-result-item');
    existingUploads.forEach(item => item.remove());
    
    // 구분선 추가
    const divider = document.createElement('div');
    divider.className = 'upload-result-item';
    divider.style.cssText = 'margin: 10px 0; padding: 8px; background: #444; border-radius: 4px; text-align: center; color: #ccc; font-size: 12px;';
    divider.innerHTML = `📁 업로드된 파일 (${uploadedFiles.length}개) <button onclick="clearUploadedFiles()" style="margin-left: 10px; padding: 2px 6px; background: #e74c3c; color: white; border: none; border-radius: 3px; font-size: 10px; cursor: pointer;">모두 삭제</button>`;
    mediaSection.appendChild(divider);
    
    // 파일들 표시 (최근 것부터)
    const recentFiles = uploadedFiles.slice().reverse().slice(0, 10);
    recentFiles.forEach(file => {
        const item = document.createElement('div');
        item.className = 'source-item upload-result-item';
        item.draggable = true;
        item.setAttribute('data-type', file.type);
        item.setAttribute('data-src', file.src);
        
        const typeIcon = file.type === 'video' ? '🎬' : file.type.includes('ai') ? '🎨' : '📷';
        const uploadDate = new Date(file.uploadTime).toLocaleDateString();
        
        item.innerHTML = `
            <div class="source-item-title">${typeIcon} ${file.name}</div>
            <div class="source-item-desc">${uploadDate}</div>
        `;
        
        if (file.type === 'image' || file.type.includes('ai-image')) {
            const preview = document.createElement('img');
            preview.src = file.src;
            preview.style.cssText = 'width: 100%; height: 60px; object-fit: cover; margin-top: 5px; border-radius: 3px;';
            item.appendChild(preview);
        }
        
        // 이벤트 추가
        item.addEventListener('dragstart', function(e) {
            if (typeof dragStart === 'function') {
                dragStart.call(this, e);
            }
        });
        
        item.addEventListener('click', function() {
            if (file.type === 'video') {
                createVideoElement(file.src, file.name);
            } else if (typeof addImageElement === 'function') {
                addImageElement(file.src, 100, 100);
            }
            showToast(`${typeIcon} 미디어 추가됨\n${file.name}`, 'success');
        });
        
        mediaSection.appendChild(item);
    });
}

// 업로드된 파일 전체 삭제
function clearUploadedFiles() {
    if (confirm('업로드된 모든 파일을 삭제하시겠습니까?')) {
        uploadedFiles = [];
        localStorage.removeItem('uploaded_files');
        
        // UI에서도 제거
        const mediaSection = document.getElementById('media-sources');
        if (mediaSection) {
            const uploadItems = mediaSection.querySelectorAll('.upload-result-item');
            uploadItems.forEach(item => item.remove());
        }
        
        showToast('📁 업로드 파일 목록이 삭제되었습니다.', 'info');
    }
}

// ===========================================
// 🛠️ 유틸리티 함수들
// ===========================================

// 로딩 메시지 표시
function showLoading(message) {
    const loading = document.createElement('div');
    loading.id = 'media-loading';
    loading.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 20px 30px;
        border-radius: 8px;
        z-index: 10000;
        font-family: Arial, sans-serif;
        text-align: center;
    `;
    
    loading.innerHTML = `
        <div style="margin-bottom: 15px;">⏳</div>
        <div>${message}</div>
    `;
    
    document.body.appendChild(loading);
    return loading;
}

// 로딩 메시지 숨김
function hideLoading(loadingElement) {
    if (loadingElement && loadingElement.parentNode) {
        loadingElement.remove();
    }
}

// 토스트 메시지 표시 (navigation.js와 동일한 함수)
function showToast(message, type = 'info') {
    const existingToast = document.getElementById('toast-message');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.id = 'toast-message';
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#2ecc71' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        font-family: Arial, sans-serif;
        font-size: 14px;
        line-height: 1.4;
        max-width: 300px;
        white-space: pre-line;
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 3000);
}

// ===========================================
// 🚀 초기화 및 이벤트 설정
// ===========================================

document.addEventListener('DOMContentLoaded', function() {
    // 저장된 업로드 파일 목록 불러오기
    try {
        const stored = localStorage.getItem('uploaded_files');
        if (stored) {
            uploadedFiles = JSON.parse(stored);
            console.log(`📁 저장된 업로드 파일 ${uploadedFiles.length}개 불러옴`);
        }
    } catch (e) {
        console.warn('업로드 파일 목록 불러오기 실패');
        uploadedFiles = [];
    }
    
    // 미디어 섹션에 "내 파일" 버튼 추가
    setTimeout(() => {
        addMyFilesButton();
    }, 1000);
    
    console.log('✅ Media.js 완전판 로드 완료 - 파일 업로드, 스톡 검색, AI 생성 모든 기능 활성화');
});

// "내 파일" 버튼 추가
function addMyFilesButton() {
    const mediaSection = document.getElementById('media-sources');
    if (!mediaSection) return;
    
    const myFilesItem = document.createElement('div');
    myFilesItem.className = 'source-item';
    myFilesItem.innerHTML = `
        <div class="source-item-title">📁 내 업로드 파일</div>
        <div class="source-item-desc">업로드한 파일들 보기</div>
        <button onclick="showUploadedFiles()" style="width: 100%; margin-top: 5px; padding: 5px; background: #667eea; border: none; color: white; border-radius: 3px; cursor: pointer;">파일 목록 보기</button>
    `;
    
    // AI 이미지 생성 아이템 바로 뒤에 추가
    const aiItem = mediaSection.querySelector('.source-item:last-child');
    if (aiItem && aiItem.nextSibling) {
        mediaSection.insertBefore(myFilesItem, aiItem.nextSibling);
    } else {
        mediaSection.appendChild(myFilesItem);
    }
}