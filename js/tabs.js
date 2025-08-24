// tabs.js - 탭 전환 및 소스 패널 관리 (완전판)

// 전역 변수
let currentActiveTab = 'media';
let tabHistory = [];
let tabPreferences = {};
let isTabTransitioning = false;

// 탭 설정 저장 키
const TAB_PREFERENCES_KEY = 'user_tab_preferences';
const TAB_HISTORY_KEY = 'tab_usage_history';

// ===========================================
// 🔄 기본 탭 전환 기능
// ===========================================

// 탭 전환 (기존 함수 개선)
function switchTab(tabName, skipHistory = false) {
    if (isTabTransitioning || currentActiveTab === tabName) {
        return;
    }
    
    console.log(`📂 탭 전환: ${currentActiveTab} → ${tabName}`);
    
    try {
        isTabTransitioning = true;
        
        // 이전 탭 상태 저장
        saveTabState(currentActiveTab);
        
        // 모든 탭 및 섹션 비활성화
        deactivateAllTabs();
        
        // 선택된 탭 활성화
        activateTab(tabName);
        
        // 히스토리 추가 (뒤로가기용)
        if (!skipHistory) {
            addToTabHistory(currentActiveTab);
        }
        
        // 현재 탭 업데이트
        currentActiveTab = tabName;
        
        // 탭 전환 후 처리
        onTabSwitched(tabName);
        
        // 사용자 선호도 저장
        updateTabPreferences(tabName);
        
        console.log(`✅ 탭 전환 완료: ${tabName}`);
        
    } catch (error) {
        console.error('❌ 탭 전환 오류:', error);
    } finally {
        isTabTransitioning = false;
    }
}

// 모든 탭 비활성화
function deactivateAllTabs() {
    // 탭 버튼들 비활성화
    const tabButtons = document.querySelectorAll('.source-tab');
    tabButtons.forEach(tab => {
        tab.classList.remove('active');
        tab.style.backgroundColor = '';
        tab.style.color = '';
    });
    
    // 섹션들 비활성화
    const sections = document.querySelectorAll('.source-section');
    sections.forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
        section.style.opacity = '0';
    });
}

// 특정 탭 활성화
function activateTab(tabName) {
    // 탭 버튼 활성화
    const targetTabButton = document.querySelector(`button[onclick*="${tabName}"]`);
    if (targetTabButton) {
        targetTabButton.classList.add('active');
        targetTabButton.style.backgroundColor = '#667eea';
        targetTabButton.style.color = 'white';
        
        // 탭 전환 애니메이션
        targetTabButton.style.transform = 'scale(1.05)';
        setTimeout(() => {
            targetTabButton.style.transform = '';
        }, 150);
    }
    
    // 해당 섹션 활성화
    const targetSection = document.getElementById(tabName + '-sources');
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block';
        
        // 페이드인 애니메이션
        setTimeout(() => {
            targetSection.style.opacity = '1';
        }, 50);
        
        // 섹션별 특별 처리
        initializeTabSection(tabName);
    }
}

// ===========================================
// 🎯 탭별 특별 처리
// ===========================================

// 탭 전환 후 초기화 처리
function initializeTabSection(tabName) {
    switch(tabName) {
        case 'media':
            initializeMediaTab();
            break;
        case 'text':
            initializeTextTab();
            break;
        case 'audio':
            initializeAudioTab();
            break;
        case 'template':
            initializeTemplateTab();
            break;
    }
}

// 미디어 탭 초기화
function initializeMediaTab() {
    // 업로드된 파일 수 표시
    if (window.uploadedFiles && window.uploadedFiles.length > 0) {
        updateTabBadge('media', window.uploadedFiles.length);
    }
    
    // 드래그앤드롭 영역 활성화
    enableMediaDragDrop();
    
    console.log('📷 미디어 탭 초기화 완료');
}

// 텍스트 탭 초기화  
function initializeTextTab() {
    // AI 설정 상태 확인
    checkAIConfiguration();
    
    // 저장된 프롬프트 수 표시
    if (typeof getSavedPrompts === 'function') {
        const savedPrompts = getSavedPrompts();
        if (savedPrompts.length > 0) {
            updateTabBadge('text', savedPrompts.length);
        }
    }
    
    console.log('📝 텍스트 탭 초기화 완료');
}

// 음성 탭 초기화
function initializeAudioTab() {
    // 현재 배경음악 상태 표시
    if (window.currentBGM) {
        showCurrentBGMStatus();
    }
    
    // 녹음 권한 상태 확인
    checkMicrophonePermission();
    
    // 업로드된 오디오 파일 수 표시
    if (window.uploadedAudioFiles && window.uploadedAudioFiles.length > 0) {
        updateTabBadge('audio', window.uploadedAudioFiles.length);
    }
    
    console.log('🎵 음성 탭 초기화 완료');
}

// 템플릿 탭 초기화
function initializeTemplateTab() {
    // 템플릿 로딩 확인
    loadTemplateContent();
    
    console.log('🎨 템플릿 탭 초기화 완료');
}

// ===========================================
// 🔧 탭 상태 관리
// ===========================================

// 탭 상태 저장
function saveTabState(tabName) {
    const tabState = {
        scrollPosition: 0,
        selectedItems: [],
        searchQuery: '',
        filters: {}
    };
    
    const section = document.getElementById(tabName + '-sources');
    if (section) {
        // 스크롤 위치 저장
        tabState.scrollPosition = section.scrollTop || 0;
        
        // 검색어 저장
        const searchInput = section.querySelector('input[type="text"]');
        if (searchInput) {
            tabState.searchQuery = searchInput.value || '';
        }
    }
    
    // 세션 스토리지에 저장
    try {
        sessionStorage.setItem(`tab_state_${tabName}`, JSON.stringify(tabState));
    } catch (e) {
        console.warn(`탭 상태 저장 실패: ${tabName}`);
    }
}

// 탭 상태 복원
function restoreTabState(tabName) {
    try {
        const stored = sessionStorage.getItem(`tab_state_${tabName}`);
        if (!stored) return;
        
        const tabState = JSON.parse(stored);
        const section = document.getElementById(tabName + '-sources');
        
        if (section && tabState.scrollPosition > 0) {
            setTimeout(() => {
                section.scrollTop = tabState.scrollPosition;
            }, 100);
        }
        
        // 검색어 복원
        if (tabState.searchQuery) {
            const searchInput = section.querySelector('input[type="text"]');
            if (searchInput) {
                searchInput.value = tabState.searchQuery;
            }
        }
        
    } catch (e) {
        console.warn(`탭 상태 복원 실패: ${tabName}`);
    }
}

// 탭 전환 완료 후 처리
function onTabSwitched(tabName) {
    // 상태 복원
    restoreTabState(tabName);
    
    // 사용자 이벤트 발생
    dispatchTabChangeEvent(tabName);
    
    // 탭별 특별 작업
    performTabSpecificActions(tabName);
    
    // 접근성 업데이트
    updateAccessibility(tabName);
}

// 탭 변경 이벤트 발생
function dispatchTabChangeEvent(tabName) {
    const event = new CustomEvent('tabChanged', {
        detail: {
            newTab: tabName,
            previousTab: tabHistory[tabHistory.length - 1] || null,
            timestamp: new Date().toISOString()
        }
    });
    
    document.dispatchEvent(event);
}

// ===========================================
// 🎨 탭 UI 고급 기능
// ===========================================

// 탭 배지 업데이트 (개수 표시)
function updateTabBadge(tabName, count) {
    const tabButton = document.querySelector(`button[onclick*="${tabName}"]`);
    if (!tabButton) return;
    
    // 기존 배지 제거
    const existingBadge = tabButton.querySelector('.tab-badge');
    if (existingBadge) {
        existingBadge.remove();
    }
    
    // 새 배지 추가
    if (count > 0) {
        const badge = document.createElement('span');
        badge.className = 'tab-badge';
        badge.style.cssText = `
            position: absolute;
            top: 5px;
            right: 5px;
            background: #e74c3c;
            color: white;
            border-radius: 50%;
            width: 18px;
            height: 18px;
            font-size: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
        `;
        badge.textContent = count > 99 ? '99+' : count.toString();
        
        tabButton.style.position = 'relative';
        tabButton.appendChild(badge);
    }
}

// 탭 로딩 상태 표시
function setTabLoading(tabName, isLoading) {
    const tabButton = document.querySelector(`button[onclick*="${tabName}"]`);
    if (!tabButton) return;
    
    if (isLoading) {
        tabButton.style.opacity = '0.6';
        tabButton.style.pointerEvents = 'none';
        
        // 로딩 스피너 추가
        if (!tabButton.querySelector('.tab-spinner')) {
            const spinner = document.createElement('div');
            spinner.className = 'tab-spinner';
            spinner.style.cssText = `
                position: absolute;
                top: 50%;
                right: 5px;
                transform: translateY(-50%);
                width: 12px;
                height: 12px;
                border: 2px solid transparent;
                border-top: 2px solid white;
                border-radius: 50%;
                animation: tab-spin 1s linear infinite;
            `;
            tabButton.appendChild(spinner);
            
            // CSS 애니메이션 추가
            if (!document.getElementById('tab-spinner-style')) {
                const style = document.createElement('style');
                style.id = 'tab-spinner-style';
                style.textContent = `
                    @keyframes tab-spin {
                        0% { transform: translateY(-50%) rotate(0deg); }
                        100% { transform: translateY(-50%) rotate(360deg); }
                    }
                `;
                document.head.appendChild(style);
            }
        }
    } else {
        tabButton.style.opacity = '';
        tabButton.style.pointerEvents = '';
        
        const spinner = tabButton.querySelector('.tab-spinner');
        if (spinner) {
            spinner.remove();
        }
    }
}

// 탭 비활성화/활성화
function setTabDisabled(tabName, disabled) {
    const tabButton = document.querySelector(`button[onclick*="${tabName}"]`);
    if (!tabButton) return;
    
    if (disabled) {
        tabButton.disabled = true;
        tabButton.style.opacity = '0.5';
        tabButton.style.cursor = 'not-allowed';
        tabButton.title = '현재 사용할 수 없는 기능입니다';
    } else {
        tabButton.disabled = false;
        tabButton.style.opacity = '';
        tabButton.style.cursor = '';
        tabButton.title = '';
    }
}

// ===========================================
// 📊 탭 사용 분석 및 선호도
// ===========================================

// 탭 히스토리 추가
function addToTabHistory(tabName) {
    if (!tabName || tabName === currentActiveTab) return;
    
    tabHistory.push({
        tab: tabName,
        timestamp: new Date().toISOString(),
        duration: Date.now() - (tabHistory[tabHistory.length - 1]?.startTime || Date.now())
    });
    
    // 히스토리 크기 제한 (최대 50개)
    if (tabHistory.length > 50) {
        tabHistory = tabHistory.slice(-50);
    }
    
    // 로컬 스토리지에 저장
    try {
        localStorage.setItem(TAB_HISTORY_KEY, JSON.stringify(tabHistory));
    } catch (e) {
        console.warn('탭 히스토리 저장 실패');
    }
}

// 탭 선호도 업데이트
function updateTabPreferences(tabName) {
    if (!tabPreferences[tabName]) {
        tabPreferences[tabName] = {
            count: 0,
            lastUsed: null,
            totalTime: 0
        };
    }
    
    tabPreferences[tabName].count++;
    tabPreferences[tabName].lastUsed = new Date().toISOString();
    
    // 로컬 스토리지에 저장
    try {
        localStorage.setItem(TAB_PREFERENCES_KEY, JSON.stringify(tabPreferences));
    } catch (e) {
        console.warn('탭 선호도 저장 실패');
    }
}

// 가장 많이 사용한 탭 가져오기
function getMostUsedTab() {
    let mostUsedTab = 'media'; // 기본값
    let maxCount = 0;
    
    Object.keys(tabPreferences).forEach(tabName => {
        if (tabPreferences[tabName].count > maxCount) {
            maxCount = tabPreferences[tabName].count;
            mostUsedTab = tabName;
        }
    });
    
    return mostUsedTab;
}

// ===========================================
// 🔍 탭 검색 및 필터링
// ===========================================

// 전체 탭에서 검색
function searchAllTabs(searchQuery) {
    if (!searchQuery || !searchQuery.trim()) return;
    
    const query = searchQuery.toLowerCase().trim();
    const results = {};
    
    // 각 탭 섹션에서 검색
    ['media', 'text', 'audio', 'template'].forEach(tabName => {
        const section = document.getElementById(tabName + '-sources');
        if (section) {
            const items = section.querySelectorAll('.source-item');
            const matches = [];
            
            items.forEach(item => {
                const title = item.querySelector('.source-item-title')?.textContent.toLowerCase() || '';
                const desc = item.querySelector('.source-item-desc')?.textContent.toLowerCase() || '';
                
                if (title.includes(query) || desc.includes(query)) {
                    matches.push({
                        title: item.querySelector('.source-item-title')?.textContent || '',
                        description: item.querySelector('.source-item-desc')?.textContent || '',
                        element: item
                    });
                }
            });
            
            if (matches.length > 0) {
                results[tabName] = matches;
            }
        }
    });
    
    return results;
}

// 탭별 필터 적용
function applyTabFilter(tabName, filterType, filterValue) {
    const section = document.getElementById(tabName + '-sources');
    if (!section) return;
    
    const items = section.querySelectorAll('.source-item');
    
    items.forEach(item => {
        let shouldShow = true;
        
        switch(filterType) {
            case 'type':
                const dataType = item.getAttribute('data-type');
                shouldShow = !filterValue || dataType === filterValue;
                break;
            case 'size':
                // 파일 크기 필터링 로직
                break;
            case 'date':
                // 날짜 필터링 로직
                break;
        }
        
        item.style.display = shouldShow ? 'block' : 'none';
    });
}

// ===========================================
// 🛠️ 특별 기능들
// ===========================================

// 미디어 드래그앤드롭 영역 활성화
function enableMediaDragDrop() {
    const mediaSection = document.getElementById('media-sources');
    if (!mediaSection) return;
    
    // 전체 섹션에 드롭 존 효과 추가
    mediaSection.addEventListener('dragenter', function(e) {
        e.preventDefault();
        this.style.backgroundColor = 'rgba(102, 126, 234, 0.1)';
        this.style.border = '2px dashed #667eea';
    });
    
    mediaSection.addEventListener('dragleave', function(e) {
        // 자식 요소로의 이동이 아닌 실제 떠날 때만
        if (!this.contains(e.relatedTarget)) {
            this.style.backgroundColor = '';
            this.style.border = '';
        }
    });
    
    mediaSection.addEventListener('drop', function(e) {
        e.preventDefault();
        this.style.backgroundColor = '';
        this.style.border = '';
        
        // 파일 드롭 처리
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            Array.from(files).forEach(file => {
                if (typeof processUploadedFile === 'function') {
                    processUploadedFile(file);
                }
            });
        }
    });
}

// AI 설정 상태 확인
function checkAIConfiguration() {
    if (typeof getAPISettings === 'function') {
        const apiSettings = getAPISettings();
        if (!apiSettings || !apiSettings.apiKey) {
            // AI 기능 제한 알림
            showTabWarning('text', 'AI 기능을 사용하려면 API 키를 설정해주세요.');
        }
    }
}

// 마이크 권한 상태 확인
async function checkMicrophonePermission() {
    try {
        const permission = await navigator.permissions.query({ name: 'microphone' });
        
        if (permission.state === 'denied') {
            showTabWarning('audio', '마이크 권한이 거부되어 녹음 기능을 사용할 수 없습니다.');
        }
    } catch (e) {
        console.warn('마이크 권한 확인 실패');
    }
}

// 현재 배경음악 상태 표시
function showCurrentBGMStatus() {
    const audioSection = document.getElementById('audio-sources');
    if (!audioSection || !window.currentBGM) return;
    
    // BGM 상태 표시 요소 추가
    let bgmStatus = audioSection.querySelector('.bgm-status');
    if (!bgmStatus) {
        bgmStatus = document.createElement('div');
        bgmStatus.className = 'bgm-status source-item';
        bgmStatus.style.background = '#2c3e50';
        bgmStatus.style.borderLeft = '4px solid #3498db';
        audioSection.insertBefore(bgmStatus, audioSection.firstChild);
    }
    
    bgmStatus.innerHTML = `
        <div class="source-item-title">🎵 현재 배경음악</div>
        <div class="source-item-desc">${window.currentBGM.name}</div>
        <button onclick="toggleBGMPlayback()" style="margin-top: 5px; padding: 5px 10px; background: #3498db; color: white; border: none; border-radius: 3px; cursor: pointer;">
            ${window.currentBGM.element && !window.currentBGM.element.paused ? '⏸️ 일시정지' : '▶️ 재생'}
        </button>
    `;
}

// 템플릿 콘텐츠 로딩
function loadTemplateContent() {
    const templateSection = document.getElementById('template-sources');
    if (!templateSection) return;
    
    // 템플릿이 로드되지 않았다면 로딩 상태 표시
    if (templateSection.children.length === 0) {
        setTabLoading('template', true);
        
        // 템플릿 로딩 시뮬레이션
        setTimeout(() => {
            setTabLoading('template', false);
            
            if (templateSection.children.length === 0) {
                templateSection.innerHTML = `
                    <div class="source-item">
                        <div class="source-item-title">🎨 템플릿 로딩 중...</div>
                        <div class="source-item-desc">잠시만 기다려주세요</div>
                    </div>
                `;
            }
        }, 1000);
    }
}

// 탭 경고 메시지 표시
function showTabWarning(tabName, message) {
    const tabButton = document.querySelector(`button[onclick*="${tabName}"]`);
    if (!tabButton) return;
    
    // 경고 아이콘 추가
    if (!tabButton.querySelector('.tab-warning')) {
        const warning = document.createElement('span');
        warning.className = 'tab-warning';
        warning.style.cssText = `
            position: absolute;
            top: 2px;
            right: 2px;
            color: #f39c12;
            font-size: 12px;
        `;
        warning.innerHTML = '⚠️';
        warning.title = message;
        
        tabButton.style.position = 'relative';
        tabButton.appendChild(warning);
    }
}

// 접근성 업데이트
function updateAccessibility(tabName) {
    const tabButton = document.querySelector(`button[onclick*="${tabName}"]`);
    if (tabButton) {
        tabButton.setAttribute('aria-selected', 'true');
        tabButton.setAttribute('aria-expanded', 'true');
    }
    
    // 다른 탭들 접근성 업데이트
    const allTabs = document.querySelectorAll('.source-tab');
    allTabs.forEach(tab => {
        if (tab !== tabButton) {
            tab.setAttribute('aria-selected', 'false');
            tab.setAttribute('aria-expanded', 'false');
        }
    });
}

// ===========================================
// 🚀 초기화 및 이벤트 설정
// ===========================================

// 저장된 탭 데이터 로드
function loadTabData() {
    try {
        // 탭 선호도 로드
        const storedPreferences = localStorage.getItem(TAB_PREFERENCES_KEY);
        if (storedPreferences) {
            tabPreferences = JSON.parse(storedPreferences);
        }
        
        // 탭 히스토리 로드
        const storedHistory = localStorage.getItem(TAB_HISTORY_KEY);
        if (storedHistory) {
            tabHistory = JSON.parse(storedHistory);
        }
        
        console.log('📊 탭 데이터 로드 완료');
    } catch (e) {
        console.warn('탭 데이터 로드 실패');
    }
}

// 키보드 단축키 설정
function setupTabKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + 숫자키로 탭 전환
        if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '4') {
            e.preventDefault();
            const tabNames = ['media', 'text', 'audio', 'template'];
            const tabIndex = parseInt(e.key) - 1;
            if (tabNames[tabIndex]) {
                switchTab(tabNames[tabIndex]);
            }
        }
        
        // Ctrl/Cmd + Tab으로 다음 탭
        if ((e.ctrlKey || e.metaKey) && e.key === 'Tab') {
            e.preventDefault();
            switchToNextTab();
        }
    });
}

// 다음 탭으로 전환
function switchToNextTab() {
    const tabNames = ['media', 'text', 'audio', 'template'];
    const currentIndex = tabNames.indexOf(currentActiveTab);
    const nextIndex = (currentIndex + 1) % tabNames.length;
    switchTab(tabNames[nextIndex]);
}

// 탭 전환 이벤트 리스너 설정
function setupTabEventListeners() {
    // 커스텀 탭 변경 이벤트 리스너
    document.addEventListener('tabChanged', function(e) {
        console.log(`📋 탭 변경됨: ${e.detail.newTab} (이전: ${e.detail.previousTab})`);
    });
    
    // 페이지 가시성 변경시 탭 상태 저장
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'hidden') {
            saveTabState(currentActiveTab);
        }
    });
}

// 초기화
document.addEventListener('DOMContentLoaded', function() {
    // 탭 데이터 로드
    loadTabData();
    
    // 키보드 단축키 설정
    setupTabKeyboardShortcuts();
    
    // 이벤트 리스너 설정
    setupTabEventListeners();
    
    // 초기 탭 설정 (사용자 선호도 기반)
    setTimeout(() => {
        const preferredTab = getMostUsedTab();
        if (preferredTab !== currentActiveTab) {
            switchTab(preferredTab, true); // 히스토리에 추가하지 않음
        } else {
            // 현재 탭 초기화
            initializeTabSection(currentActiveTab);
        }
    }, 500);
    
    console.log('✅ Tabs.js 완전판 로드 완료 - 고급 탭 관리, 상태 저장, 키보드 단축키 활성화');
});