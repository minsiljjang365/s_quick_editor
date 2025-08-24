// navigation.js - 네비게이션 및 프로젝트 관리 (완전판)

// 전역 변수
let currentProjectData = null;
let autoSaveInterval = null;
let projectHistory = [];
let maxHistorySize = 10;
let isAutoSaving = false;

// 프로젝트 저장 키
const PROJECT_STORAGE_KEY = 'current_project_data';
const PROJECT_LIST_KEY = 'saved_projects_list';
const PROJECT_HISTORY_KEY = 'project_history';

// ===========================================
// 🏠 네비게이션 기본 기능들
// ===========================================

// 홈으로 이동
function goHome() {
    if (confirm('현재 작업 중인 내용이 저장되지 않을 수 있습니다. 홈으로 이동하시겠습니까?')) {
        // 마지막 저장 시도
        saveProject();
        
        // 홈 페이지로 이동
        window.location.href = 'index.html';
    }
}

// 관리자 페이지 열기
function openAdmin() {
    // 관리자 페이지를 새 창에서 열기
    const adminWindow = window.open('admin.html', '_blank', 'width=1000,height=700,scrollbars=yes,resizable=yes');
    
    if (!adminWindow) {
        alert('팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.');
        // 팝업이 막힌 경우 현재 창에서 이동
        if (confirm('팝업이 차단되었습니다. 현재 창에서 관리자 페이지로 이동하시겠습니까?')) {
            saveProject(); // 현재 작업 저장
            window.location.href = 'admin.html';
        }
    } else {
        console.log('✅ 관리자 페이지 열림');
    }
}

// ===========================================
// 💾 프로젝트 저장 기능
// ===========================================

// 프로젝트 저장 (메인 함수)
function saveProject() {
    try {
        console.log('💾 프로젝트 저장 시작...');
        
        const projectData = collectProjectData();
        if (!projectData) {
            console.error('❌ 프로젝트 데이터 수집 실패');
            return false;
        }
        
        // 로컬스토리지에 저장
        const saveResult = saveProjectToStorage(projectData);
        
        if (saveResult) {
            // 프로젝트 목록 업데이트
            updateProjectsList(projectData);
            
            // 히스토리에 추가
            addToProjectHistory(projectData);
            
            // 성공 메시지
            showSaveSuccessMessage(projectData);
            
            currentProjectData = projectData;
            console.log('✅ 프로젝트 저장 완료');
            return true;
        } else {
            throw new Error('저장 실패');
        }
        
    } catch (error) {
        console.error('❌ 프로젝트 저장 오류:', error);
        alert(`프로젝트 저장에 실패했습니다.\n오류: ${error.message}`);
        return false;
    }
}

// 프로젝트 데이터 수집
function collectProjectData() {
    try {
        const canvas = document.getElementById('canvas');
        const projectTitle = document.getElementById('project-title');
        
        if (!canvas) {
            throw new Error('캔버스를 찾을 수 없습니다');
        }
        
        const projectData = {
            id: Date.now().toString(),
            name: projectTitle ? projectTitle.textContent : '무제 프로젝트',
            elements: [],
            canvasBackground: canvas.style.background || '#333',
            zoom: window.canvasZoom || 1.0,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };
        
        // 모든 캔버스 요소 수집
        const elements = canvas.querySelectorAll('.canvas-element');
        elements.forEach((element, index) => {
            try {
                const elementData = {
                    id: element.id || `element-${index}`,
                    type: getElementType(element),
                    content: getElementContent(element),
                    styles: collectElementStyles(element),
                    attributes: collectElementAttributes(element),
                    zIndex: parseInt(element.style.zIndex) || index,
                    order: index
                };
                
                projectData.elements.push(elementData);
            } catch (elementError) {
                console.warn('요소 처리 중 오류:', elementError, element);
            }
        });
        
        console.log(`📊 프로젝트 데이터 수집 완료: ${projectData.elements.length}개 요소`);
        return projectData;
        
    } catch (error) {
        console.error('프로젝트 데이터 수집 오류:', error);
        return null;
    }
}

// 요소 타입 확인
function getElementType(element) {
    if (element.classList.contains('canvas-text')) return 'text';
    if (element.classList.contains('canvas-image')) return 'image';
    if (element.classList.contains('canvas-shape')) return 'shape';
    if (element.classList.contains('canvas-background-template')) return 'background-template';
    return 'unknown';
}

// 요소 내용 가져오기
function getElementContent(element) {
    const type = getElementType(element);
    switch(type) {
        case 'text':
            return element.textContent || '';
        case 'image':
        case 'background-template':
            return element.src || '';
        case 'shape':
            return element.innerHTML || '';
        default:
            return element.textContent || element.innerHTML || '';
    }
}

// 요소 스타일 수집
function collectElementStyles(element) {
    return {
        left: element.style.left || '0px',
        top: element.style.top || '0px',
        width: element.style.width || 'auto',
        height: element.style.height || 'auto',
        fontSize: element.style.fontSize || '16px',
        fontFamily: element.style.fontFamily || 'Arial',
        fontWeight: element.style.fontWeight || 'normal',
        fontStyle: element.style.fontStyle || 'normal',
        textDecoration: element.style.textDecoration || 'none',
        textAlign: element.style.textAlign || 'left',
        color: element.style.color || '#ffffff',
        backgroundColor: element.style.backgroundColor || 'transparent',
        border: element.style.border || 'none',
        borderRadius: element.style.borderRadius || '0',
        padding: element.style.padding || '0',
        margin: element.style.margin || '0',
        opacity: element.style.opacity || '1',
        transform: element.style.transform || 'none',
        filter: element.style.filter || 'none',
        boxShadow: element.style.boxShadow || 'none',
        zIndex: element.style.zIndex || '1',
        cursor: element.style.cursor || 'default',
        position: element.style.position || 'absolute',
        pointerEvents: element.style.pointerEvents || 'auto',
        objectFit: element.style.objectFit || 'initial'
    };
}

// 요소 속성 수집
function collectElementAttributes(element) {
    const attributes = {};
    
    // 주요 속성들 수집
    if (element.getAttribute('data-text-type')) {
        attributes['data-text-type'] = element.getAttribute('data-text-type');
    }
    if (element.alt) attributes.alt = element.alt;
    if (element.title) attributes.title = element.title;
    
    return attributes;
}

// 스토리지에 프로젝트 저장
function saveProjectToStorage(projectData) {
    try {
        const jsonData = JSON.stringify(projectData);
        const dataSize = new Blob([jsonData]).size;
        
        console.log(`💾 저장 데이터 크기: ${(dataSize / 1024).toFixed(2)} KB`);
        
        // 용량 체크 (5MB 제한)
        if (dataSize > 5 * 1024 * 1024) {
            throw new Error('프로젝트 크기가 너무 큽니다. (최대 5MB)');
        }
        
        localStorage.setItem(PROJECT_STORAGE_KEY, jsonData);
        return true;
        
    } catch (error) {
        if (error.name === 'QuotaExceededError') {
            // 저장 공간 부족 시 이전 프로젝트 삭제
            if (clearOldProjects()) {
                return saveProjectToStorage(projectData); // 재시도
            } else {
                throw new Error('브라우저 저장 공간이 부족합니다.');
            }
        } else {
            throw error;
        }
    }
}

// 프로젝트 목록 업데이트
function updateProjectsList(projectData) {
    try {
        let projectsList = [];
        
        try {
            const stored = localStorage.getItem(PROJECT_LIST_KEY);
            projectsList = stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.warn('프로젝트 목록 파싱 오류, 새로 생성');
            projectsList = [];
        }
        
        // 기존 프로젝트 업데이트 또는 새 프로젝트 추가
        const existingIndex = projectsList.findIndex(p => p.id === projectData.id);
        const projectSummary = {
            id: projectData.id,
            name: projectData.name,
            timestamp: projectData.timestamp,
            elementsCount: projectData.elements.length,
            lastModified: new Date().toISOString()
        };
        
        if (existingIndex >= 0) {
            projectsList[existingIndex] = projectSummary;
        } else {
            projectsList.unshift(projectSummary); // 맨 앞에 추가
        }
        
        // 최대 50개 프로젝트만 유지
        if (projectsList.length > 50) {
            projectsList = projectsList.slice(0, 50);
        }
        
        localStorage.setItem(PROJECT_LIST_KEY, JSON.stringify(projectsList));
        console.log('📋 프로젝트 목록 업데이트 완료');
        
    } catch (error) {
        console.error('프로젝트 목록 업데이트 오류:', error);
    }
}

// 저장 성공 메시지
function showSaveSuccessMessage(projectData) {
    const timestamp = new Date().toLocaleString();
    const elementsCount = projectData.elements.length;
    
    // 간단한 토스트 메시지
    showToast(`✅ 저장 완료!\n${timestamp}\n${elementsCount}개 요소`, 'success');
}

// ===========================================
// 📂 프로젝트 불러오기 기능
// ===========================================

// 프로젝트 불러오기 (메인 함수)
function loadProject() {
    try {
        console.log('📂 프로젝트 불러오기 시작...');
        
        const stored = localStorage.getItem(PROJECT_STORAGE_KEY);
        if (!stored) {
            console.log('💭 저장된 프로젝트가 없습니다');
            return false;
        }
        
        const projectData = JSON.parse(stored);
        const success = restoreProjectData(projectData);
        
        if (success) {
            currentProjectData = projectData;
            showLoadSuccessMessage(projectData);
            console.log('✅ 프로젝트 불러오기 완료');
            return true;
        } else {
            throw new Error('프로젝트 복원 실패');
        }
        
    } catch (error) {
        console.error('❌ 프로젝트 불러오기 오류:', error);
        alert(`프로젝트 불러오기에 실패했습니다.\n오류: ${error.message}`);
        return false;
    }
}

// 프로젝트 데이터 복원
function restoreProjectData(projectData) {
    try {
        const canvas = document.getElementById('canvas');
        const projectTitle = document.getElementById('project-title');
        
        if (!canvas) {
            throw new Error('캔버스를 찾을 수 없습니다');
        }
        
        // 기존 요소들 제거
        canvas.querySelectorAll('.canvas-element').forEach(element => {
            element.remove();
        });
        
        // 프로젝트 제목 복원
        if (projectTitle && projectData.name) {
            projectTitle.textContent = projectData.name;
        }
        
        // 캔버스 배경 복원
        canvas.style.background = projectData.canvasBackground || '#333';
        
        // 줌 복원
        if (projectData.zoom && typeof applyZoom === 'function') {
            window.canvasZoom = projectData.zoom;
            applyZoom();
        }
        
        // 요소들 복원 (z-index 순서대로)
        const sortedElements = projectData.elements.sort((a, b) => 
            (a.zIndex || 0) - (b.zIndex || 0)
        );
        
        sortedElements.forEach(elementData => {
            try {
                restoreElement(elementData);
            } catch (elementError) {
                console.warn('요소 복원 중 오류:', elementError, elementData);
            }
        });
        
        // 선택 해제
        if (typeof deselectAllElements === 'function') {
            deselectAllElements();
        }
        
        console.log(`📊 프로젝트 복원 완료: ${projectData.elements.length}개 요소`);
        return true;
        
    } catch (error) {
        console.error('프로젝트 데이터 복원 오류:', error);
        return false;
    }
}

// 개별 요소 복원
function restoreElement(elementData) {
    const canvas = document.getElementById('canvas');
    const type = elementData.type;
    let element;
    
    // 요소 타입별 생성
    switch(type) {
        case 'text':
            element = document.createElement('div');
            element.textContent = elementData.content;
            element.onclick = function() {
                if (typeof selectTextElement === 'function') {
                    selectTextElement(this);
                } else if (typeof selectElement === 'function') {
                    selectElement(this);
                }
            };
            break;
            
        case 'image':
            element = document.createElement('img');
            element.src = elementData.content;
            element.onclick = function() {
                if (typeof selectElement === 'function') {
                    selectElement(this);
                }
            };
            break;
            
        case 'shape':
            element = document.createElement('div');
            element.innerHTML = elementData.content;
            element.onclick = function() {
                if (typeof selectElement === 'function') {
                    selectElement(this);
                }
            };
            break;
            
        case 'background-template':
            element = document.createElement('img');
            element.src = elementData.content;
            break;
            
        default:
            console.warn('알 수 없는 요소 타입:', type);
            return;
    }
    
    // 기본 속성 설정
    element.id = elementData.id;
    element.className = getElementClassName(type);
    
    // 스타일 적용
    applyElementStyles(element, elementData.styles);
    
    // 속성 적용
    applyElementAttributes(element, elementData.attributes);
    
    // 드래그 이벤트 설정
    if (type !== 'background-template' && typeof setupDragEvents === 'function') {
        setupDragEvents(element);
    }
    
    // 캔버스에 추가
    if (type === 'background-template') {
        canvas.insertBefore(element, canvas.firstChild);
    } else {
        canvas.appendChild(element);
    }
}

// 요소 클래스명 생성
function getElementClassName(type) {
    const baseClass = 'canvas-element';
    switch(type) {
        case 'text': return `${baseClass} canvas-text`;
        case 'image': return `${baseClass} canvas-image`;
        case 'shape': return `${baseClass} canvas-shape`;
        case 'background-template': return `${baseClass} canvas-background-template`;
        default: return baseClass;
    }
}

// 요소 스타일 적용
function applyElementStyles(element, styles) {
    if (!styles) return;
    
    Object.keys(styles).forEach(styleName => {
        if (styles[styleName] !== undefined && styles[styleName] !== null) {
            try {
                element.style[styleName] = styles[styleName];
            } catch (e) {
                console.warn(`스타일 적용 오류 ${styleName}:`, e);
            }
        }
    });
}

// 요소 속성 적용
function applyElementAttributes(element, attributes) {
    if (!attributes) return;
    
    Object.keys(attributes).forEach(attrName => {
        try {
            element.setAttribute(attrName, attributes[attrName]);
        } catch (e) {
            console.warn(`속성 적용 오류 ${attrName}:`, e);
        }
    });
}

// 불러오기 성공 메시지
function showLoadSuccessMessage(projectData) {
    const timestamp = new Date(projectData.timestamp).toLocaleString();
    const elementsCount = projectData.elements.length;
    
    showToast(`📂 불러오기 완료!\n${projectData.name}\n${timestamp}\n${elementsCount}개 요소`, 'info');
}

// ===========================================
// 🔄 실시간 저장 및 히스토리
// ===========================================

// 자동 저장 시작
function startAutoSave() {
    // 기존 자동 저장 정지
    stopAutoSave();
    
    // 30초마다 자동 저장
    autoSaveInterval = setInterval(() => {
        if (!isAutoSaving) {
            autoSaveProject();
        }
    }, 30000);
    
    console.log('🔄 자동 저장 활성화 (30초 간격)');
}

// 자동 저장 정지
function stopAutoSave() {
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
        autoSaveInterval = null;
        console.log('⏸️ 자동 저장 정지');
    }
}

// 자동 저장 실행
function autoSaveProject() {
    isAutoSaving = true;
    
    try {
        const projectData = collectProjectData();
        if (projectData && hasProjectChanged(projectData)) {
            saveProjectToStorage(projectData);
            currentProjectData = projectData;
            
            // 조용한 저장 (알림 없음)
            console.log('💾 자동 저장 완료:', new Date().toLocaleString());
        }
    } catch (error) {
        console.error('자동 저장 오류:', error);
    } finally {
        isAutoSaving = false;
    }
}

// 프로젝트 변경 여부 확인
function hasProjectChanged(newData) {
    if (!currentProjectData) return true;
    
    try {
        const oldStr = JSON.stringify(currentProjectData.elements);
        const newStr = JSON.stringify(newData.elements);
        return oldStr !== newStr;
    } catch (error) {
        return true; // 오류 시 저장
    }
}

// 프로젝트 히스토리에 추가
function addToProjectHistory(projectData) {
    try {
        let history = [];
        
        try {
            const stored = localStorage.getItem(PROJECT_HISTORY_KEY);
            history = stored ? JSON.parse(stored) : [];
        } catch (e) {
            history = [];
        }
        
        // 히스토리 항목 생성
        const historyItem = {
            timestamp: new Date().toISOString(),
            name: projectData.name,
            elementsCount: projectData.elements.length,
            data: projectData // 전체 데이터 저장
        };
        
        history.unshift(historyItem);
        
        // 최대 개수 제한
        if (history.length > maxHistorySize) {
            history = history.slice(0, maxHistorySize);
        }
        
        localStorage.setItem(PROJECT_HISTORY_KEY, JSON.stringify(history));
        
    } catch (error) {
        console.error('히스토리 저장 오류:', error);
    }
}

// ===========================================
// 🗑️ 정리 및 유틸리티
// ===========================================

// 오래된 프로젝트 정리
function clearOldProjects() {
    try {
        // 히스토리에서 오래된 항목 삭제
        localStorage.removeItem(PROJECT_HISTORY_KEY);
        
        // 프로젝트 목록에서 오래된 항목 삭제
        const projectsList = JSON.parse(localStorage.getItem(PROJECT_LIST_KEY) || '[]');
        const recentProjects = projectsList.slice(0, 20); // 최근 20개만 유지
        localStorage.setItem(PROJECT_LIST_KEY, JSON.stringify(recentProjects));
        
        console.log('🗑️ 오래된 프로젝트 정리 완료');
        return true;
    } catch (error) {
        console.error('프로젝트 정리 오류:', error);
        return false;
    }
}

// 토스트 메시지 표시
function showToast(message, type = 'info') {
    // 기존 토스트 제거
    const existingToast = document.getElementById('toast-message');
    if (existingToast) {
        existingToast.remove();
    }
    
    // 새 토스트 생성
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
    
    // 3초 후 제거
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 3000);
}

// ===========================================
// 🚀 초기화
// ===========================================

document.addEventListener('DOMContentLoaded', function() {
    // 페이지 로드시 자동으로 저장된 프로젝트 불러오기
    setTimeout(() => {
        loadProject();
    }, 1000);
    
    // 자동 저장 시작
    setTimeout(() => {
        startAutoSave();
    }, 2000);
    
    // 페이지 떠날 때 저장
    window.addEventListener('beforeunload', function(e) {
        if (currentProjectData) {
            saveProject();
        }
    });
    
    // Ctrl+S로 수동 저장
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveProject();
        }
    });
    
    console.log('✅ Navigation.js 완전판 로드 완료 - 저장/불러오기, 자동 저장, 히스토리 활성화');
});