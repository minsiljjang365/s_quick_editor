// template.js - 템플릿 처리 관련 함수들 (수정됨)

const TEMPLATE_STORAGE_KEY = 'user_templates';

// 템플릿 업로드 (수정됨 - 에러 처리 강화)
function uploadTemplate(input) {
    console.log('🔄 uploadTemplate 호출됨');
    
    const file = input.files[0];
    if (!file || !file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드할 수 있습니다.');
        return;
    }

    console.log('📁 파일 선택됨:', file.name);
    
    const reader = new FileReader();
    reader.onload = function(e) {
        console.log('📷 파일 읽기 완료');
        
        const templateData = {
            id: Date.now().toString(),
            name: file.name.split('.')[0],
            data: e.target.result,
            uploadDate: new Date().toISOString()
        };

        console.log('💾 템플릿 데이터 생성:', templateData.name);
        
        // 저장 시도
        const saved = saveTemplateToStorage(templateData);
        if (saved) {
            updateTemplateList();
            alert('✅ 템플릿이 업로드되었습니다: ' + file.name);
            console.log('✅ 템플릿 업로드 성공');
        } else {
            alert('❌ 템플릿 저장에 실패했습니다.');
            console.log('❌ 템플릿 저장 실패');
        }
        
        // 입력 필드 초기화
        input.value = '';
    };
    
    reader.onerror = function() {
        alert('파일 읽기에 실패했습니다.');
        console.log('❌ 파일 읽기 실패');
    };
    
    reader.readAsDataURL(file);
}

// localStorage에 템플릿 저장 (수정됨 - 에러 처리)
function saveTemplateToStorage(templateData) {
    try {
        console.log('💾 localStorage 저장 시도');
        let templates = getStoredTemplates();
        templates.push(templateData);
        localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(templates));
        
        // 저장 확인
        const saved = localStorage.getItem(TEMPLATE_STORAGE_KEY);
        if (saved) {
            console.log('✅ localStorage 저장 성공');
            return true;
        } else {
            console.log('❌ localStorage 저장 실패');
            return false;
        }
    } catch (error) {
        console.error('❌ 저장 오류:', error);
        return false;
    }
}

// localStorage에서 템플릿 목록 가져오기 (수정됨)
function getStoredTemplates() {
    try {
        const stored = localStorage.getItem(TEMPLATE_STORAGE_KEY);
        const templates = stored ? JSON.parse(stored) : [];
        console.log('📂 저장된 템플릿 수:', templates.length);
        return templates;
    } catch (error) {
        console.error('❌ 템플릿 로딩 오류:', error);
        return [];
    }
}

// 템플릿 목록 업데이트 (수정됨 - 안전한 DOM 접근)
function updateTemplateList() {
    console.log('🔄 updateTemplateList 호출됨');
    
    const select = document.getElementById('my-templates');
    if (!select) {
        console.log('⚠️ my-templates 요소를 찾을 수 없습니다');
        return false;
    }
    
    const templates = getStoredTemplates();
    console.log('📋 템플릿 목록 업데이트:', templates.length + '개');
    
    // 기존 옵션 제거 (첫 번째 옵션 제외)
    while (select.children.length > 1) {
        select.removeChild(select.lastChild);
    }
    
    // 새 템플릿들 추가
    templates.forEach(template => {
        const option = document.createElement('option');
        option.value = template.id;
        option.textContent = `${template.name} (${new Date(template.uploadDate).toLocaleDateString()})`;
        select.appendChild(option);
    });
    
    console.log('✅ 템플릿 목록 업데이트 완료');
    return true;
}

// 템플릿 선택 시 미리보기 (수정됨)
function loadMyTemplate() {
    console.log('🔄 loadMyTemplate 호출됨');
    
    const select = document.getElementById('my-templates');
    const selectedId = select ? select.value : '';
    
    if (!selectedId) {
        clearTemplatePreview();
        return;
    }

    const templates = getStoredTemplates();
    const template = templates.find(t => t.id === selectedId);
    
    if (template) {
        console.log('🖼️ 템플릿 미리보기:', template.name);
        showTemplatePreview(template);
    } else {
        console.log('❌ 선택된 템플릿을 찾을 수 없음:', selectedId);
    }
}

// 템플릿 미리보기 표시 (수정됨)
function showTemplatePreview(template) {
    const preview = document.getElementById('template-preview');
    if (!preview) {
        console.log('❌ template-preview 요소를 찾을 수 없습니다');
        return;
    }
    
    preview.innerHTML = `
        <img src="${template.data}" 
             style="max-width: 100%; max-height: 100%; object-fit: contain;" 
             alt="${template.name}">
    `;
    
    // 적용 버튼 추가
    const applyButton = document.createElement('button');
    applyButton.textContent = '캔버스에 적용';
    applyButton.className = 'apply-template-btn';
    applyButton.style.cssText = `
        position: absolute;
        bottom: 5px;
        right: 5px;
        background: #667eea;
        color: white;
        border: none;
        padding: 5px 10px;
        border-radius: 3px;
        cursor: pointer;
        font-size: 10px;
    `;
    applyButton.onclick = () => applyTemplateToCanvas(template);
    
    preview.style.position = 'relative';
    preview.appendChild(applyButton);
    
    console.log('✅ 템플릿 미리보기 표시 완료');
}

// 미리보기 초기화
function clearTemplatePreview() {
    const preview = document.getElementById('template-preview');
    if (preview) {
        preview.innerHTML = '템플릿을 선택하세요';
        preview.style.position = 'static';
    }
}

// 🔥 캔버스에 템플릿 적용 (자동저장 기능 추가)
function applyTemplateToCanvas(template) {
    console.log('🎨 캔버스에 템플릿 적용:', template.name);
    
    if (typeof addTemplateAsBackground === 'function') {
        try {
            addTemplateAsBackground(template.data, template.name);
            alert('✅ 템플릿이 캔버스에 적용되었습니다!');
            console.log('✅ 템플릿 적용 성공');
            
            // 🔥 템플릿 적용 후 자동저장 추가!
            setTimeout(() => {
                if (typeof saveCanvasState === 'function') {
                    saveCanvasState();
                    console.log('💾 템플릿 적용 후 캔버스 상태 저장됨');
                } else {
                    console.warn('⚠️ saveCanvasState 함수를 찾을 수 없음');
                }
            }, 100); // 0.1초 후 저장 (DOM 업데이트 완료 대기)
            
        } catch (error) {
            console.error('❌ 템플릿 적용 오류:', error);
            alert('❌ 템플릿 적용 중 오류가 발생했습니다.');
        }
    } else {
        console.error('❌ addTemplateAsBackground 함수가 없습니다');
        alert('❌ 캔버스 함수가 준비되지 않았습니다.');
    }
}

// 선택된 템플릿 삭제 (수정됨)
function deleteSelectedTemplate() {
    const select = document.getElementById('my-templates');
    if (!select) {
        alert('템플릿 목록을 찾을 수 없습니다.');
        return;
    }
    
    const selectedId = select.value;
    if (!selectedId) {
        alert('삭제할 템플릿을 선택하세요.');
        return;
    }

    const templates = getStoredTemplates();
    const template = templates.find(t => t.id === selectedId);
    
    if (template && confirm(`"${template.name}" 템플릿을 삭제하시겠습니까?`)) {
        try {
            const filteredTemplates = templates.filter(t => t.id !== selectedId);
            localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(filteredTemplates));
            
            updateTemplateList();
            clearTemplatePreview();
            alert('✅ 템플릿이 삭제되었습니다.');
            console.log('✅ 템플릿 삭제 완료');
        } catch (error) {
            console.error('❌ 템플릿 삭제 오류:', error);
            alert('❌ 템플릿 삭제 중 오류가 발생했습니다.');
        }
    }
}

// 전체 템플릿 삭제 (수정됨)
function clearAllTemplates() {
    const templates = getStoredTemplates();
    
    if (templates.length === 0) {
        alert('삭제할 템플릿이 없습니다.');
        return;
    }

    if (confirm(`모든 템플릿 (${templates.length}개)을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
        try {
            localStorage.removeItem(TEMPLATE_STORAGE_KEY);
            updateTemplateList();
            clearTemplatePreview();
            alert('✅ 모든 템플릿이 삭제되었습니다.');
            console.log('✅ 전체 템플릿 삭제 완료');
        } catch (error) {
            console.error('❌ 전체 템플릿 삭제 오류:', error);
            alert('❌ 템플릿 삭제 중 오류가 발생했습니다.');
        }
    }
}

// 페이지 로드 시 템플릿 목록 초기화 (수정됨 - 강화된 타이밍)
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 DOM 로드됨. 템플릿 초기화 시작...');
    
    // 여러 번 시도하는 함수
    function tryInitializeTemplates(attempt = 1) {
        const maxAttempts = 5;
        
        setTimeout(() => {
            const templateSelect = document.getElementById('my-templates');
            if (templateSelect) {
                console.log(`✅ 템플릿 초기화 성공 (시도 ${attempt}회)`);
                updateTemplateList();
            } else if (attempt < maxAttempts) {
                console.log(`⚠️ 템플릿 요소 없음. 다시 시도... (${attempt}/${maxAttempts})`);
                tryInitializeTemplates(attempt + 1);
            } else {
                console.log('❌ 템플릿 초기화 최종 실패');
            }
        }, attempt * 500); // 0.5초씩 늘려가며 시도
    }
    
    tryInitializeTemplates();
});