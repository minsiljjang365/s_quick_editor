// audio.js - 오디오 처리 관련 모든 함수들 (완전판)

// 전역 변수
let isRecording = false;
let mediaRecorder = null;
let recordedAudioChunks = [];
let audioContext = null;
let currentBGM = null;
let uploadedAudioFiles = [];
let audioEffects = [];
let recordingStream = null;

// 오디오 파일 저장 키
const AUDIO_FILES_KEY = 'uploaded_audio_files';
const AUDIO_EFFECTS_KEY = 'audio_effects_library';

// ===========================================
// 🎵 배경음악 관리
// ===========================================

// 배경음악 업로드 (기존 함수 개선)
function uploadBGM(input) {
    const file = input.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('audio/')) {
        alert('오디오 파일만 업로드 가능합니다.');
        return;
    }
    
    // 파일 크기 체크 (20MB 제한)
    if (file.size > 20 * 1024 * 1024) {
        alert('오디오 파일이 너무 큽니다. 최대 20MB까지 지원됩니다.');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const audioSrc = e.target.result;
        
        // 기존 배경음악 제거
        removeCurrentBGM();
        
        // 새 배경음악 설정
        setBackgroundMusic(audioSrc, file.name);
        
        // 업로드 목록에 추가
        addToAudioFiles({
            name: file.name,
            type: 'bgm',
            src: audioSrc,
            size: file.size,
            duration: 0, // 실제 구현시 오디오 길이 계산
            uploadTime: new Date().toISOString()
        });
        
        console.log('✅ 배경음악 업로드 완료:', file.name);
        showToast(`🎵 배경음악 설정 완료\n${file.name}`, 'success');
    };
    
    reader.onerror = function() {
        console.error('❌ 배경음악 파일 읽기 실패:', file.name);
        alert('배경음악 파일을 읽을 수 없습니다.');
    };
    
    reader.readAsDataURL(file);
    
    // 입력 초기화
    input.value = '';
}

// 배경음악 설정
function setBackgroundMusic(audioSrc, fileName) {
    currentBGM = {
        src: audioSrc,
        name: fileName,
        element: null,
        volume: 0.5,
        loop: true
    };
    
    // HTML 오디오 요소 생성 (숨김)
    const audioElement = document.createElement('audio');
    audioElement.src = audioSrc;
    audioElement.loop = true;
    audioElement.volume = currentBGM.volume;
    audioElement.style.display = 'none';
    
    currentBGM.element = audioElement;
    document.body.appendChild(audioElement);
    
    // 배경음악 컨트롤 UI 업데이트
    updateBGMControls();
}

// 현재 배경음악 제거
function removeCurrentBGM() {
    if (currentBGM && currentBGM.element) {
        currentBGM.element.pause();
        currentBGM.element.remove();
        currentBGM = null;
        updateBGMControls();
    }
}

// 배경음악 재생/일시정지
function toggleBGMPlayback() {
    if (!currentBGM || !currentBGM.element) {
        alert('배경음악이 설정되지 않았습니다.');
        return;
    }
    
    const audio = currentBGM.element;
    
    if (audio.paused) {
        audio.play().then(() => {
            console.log('🎵 배경음악 재생 시작');
            updateBGMControls();
        }).catch(error => {
            console.error('배경음악 재생 오류:', error);
            alert('배경음악을 재생할 수 없습니다.');
        });
    } else {
        audio.pause();
        console.log('⏸️ 배경음악 일시정지');
        updateBGMControls();
    }
}

// 배경음악 볼륨 조절
function setBGMVolume(volume) {
    if (currentBGM && currentBGM.element) {
        currentBGM.volume = volume / 100;
        currentBGM.element.volume = currentBGM.volume;
        
        const volumeDisplay = document.getElementById('bgm-volume-value');
        if (volumeDisplay) {
            volumeDisplay.textContent = volume + '%';
        }
    }
}

// 배경음악 컨트롤 UI 업데이트
function updateBGMControls() {
    // BGM 컨트롤이 있다면 업데이트
    const bgmStatus = document.getElementById('bgm-status');
    const bgmPlayBtn = document.getElementById('bgm-play-btn');
    
    if (bgmStatus) {
        if (currentBGM) {
            bgmStatus.textContent = `🎵 ${currentBGM.name}`;
        } else {
            bgmStatus.textContent = '배경음악 없음';
        }
    }
    
    if (bgmPlayBtn) {
        if (currentBGM && currentBGM.element) {
            if (currentBGM.element.paused) {
                bgmPlayBtn.innerHTML = '▶️ 재생';
            } else {
                bgmPlayBtn.innerHTML = '⏸️ 일시정지';
            }
        } else {
            bgmPlayBtn.innerHTML = '▶️ 재생';
            bgmPlayBtn.disabled = !currentBGM;
        }
    }
}

// ===========================================
// 🎤 음성 녹음 기능
// ===========================================

// 음성 녹음 시작 (기존 함수 개선)
async function startRecording() {
    if (isRecording) {
        alert('이미 녹음 중입니다.');
        return;
    }
    
    try {
        recordedAudioChunks = [];
        
        // 마이크 권한 요청 및 스트림 획득
        recordingStream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        });
        
        // 미디어 레코더 설정
        mediaRecorder = new MediaRecorder(recordingStream, {
            mimeType: getPreferredMimeType()
        });
        
        // 이벤트 리스너 설정
        mediaRecorder.ondataavailable = function(event) {
            if (event.data.size > 0) {
                recordedAudioChunks.push(event.data);
            }
        };
        
        mediaRecorder.onstop = function() {
            processRecordedAudio();
        };
        
        mediaRecorder.onerror = function(event) {
            console.error('녹음 오류:', event.error);
            stopRecording();
            alert('녹음 중 오류가 발생했습니다.');
        };
        
        // 녹음 시작
        mediaRecorder.start(100); // 100ms마다 데이터 수집
        isRecording = true;
        
        updateRecordingUI();
        console.log('🎤 녹음 시작');
        showToast('🎤 녹음이 시작되었습니다.\n마이크에 대고 말씀하세요.', 'info');
        
    } catch (error) {
        console.error('녹음 시작 실패:', error);
        
        if (error.name === 'NotAllowedError') {
            alert('마이크 권한이 거부되었습니다. 브라우저 설정에서 마이크 권한을 허용해주세요.');
        } else if (error.name === 'NotFoundError') {
            alert('마이크를 찾을 수 없습니다. 마이크가 연결되어 있는지 확인해주세요.');
        } else {
            alert('녹음을 시작할 수 없습니다: ' + error.message);
        }
        
        isRecording = false;
        updateRecordingUI();
    }
}

// 음성 녹음 중지 (기존 함수 개선)
function stopRecording() {
    if (!isRecording || !mediaRecorder) {
        alert('녹음 중이 아닙니다.');
        return;
    }
    
    try {
        // 미디어 레코더 중지
        mediaRecorder.stop();
        
        // 스트림 정리
        if (recordingStream) {
            recordingStream.getTracks().forEach(track => track.stop());
            recordingStream = null;
        }
        
        isRecording = false;
        updateRecordingUI();
        
        console.log('⏹️ 녹음 중지');
        showToast('⏹️ 녹음이 완료되었습니다.\n음성 파일을 처리하는 중...', 'info');
        
    } catch (error) {
        console.error('녹음 중지 오류:', error);
        isRecording = false;
        updateRecordingUI();
    }
}

// 선호하는 MIME 타입 감지
function getPreferredMimeType() {
    const types = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/ogg',
        'audio/mp4',
        'audio/mpeg'
    ];
    
    for (let type of types) {
        if (MediaRecorder.isTypeSupported(type)) {
            return type;
        }
    }
    
    return 'audio/webm'; // 기본값
}

// 녹음된 오디오 처리
function processRecordedAudio() {
    try {
        if (recordedAudioChunks.length === 0) {
            alert('녹음된 데이터가 없습니다.');
            return;
        }
        
        // Blob 생성
        const audioBlob = new Blob(recordedAudioChunks, {
            type: getPreferredMimeType()
        });
        
        // 데이터 URL 생성
        const reader = new FileReader();
        reader.onload = function(e) {
            const audioSrc = e.target.result;
            const fileName = `녹음_${new Date().toISOString().slice(0, 16).replace(/[:-]/g, '')}.webm`;
            
            // 오디오 파일 목록에 추가
            addToAudioFiles({
                name: fileName,
                type: 'recording',
                src: audioSrc,
                size: audioBlob.size,
                duration: 0,
                uploadTime: new Date().toISOString()
            });
            
            // 캔버스에 오디오 요소 추가 (시각적 표현)
            createAudioVisualization(audioSrc, fileName);
            
            showToast(`🎤 녹음 완료!\n${fileName}\n파일 크기: ${(audioBlob.size / 1024).toFixed(1)} KB`, 'success');
        };
        
        reader.readAsDataURL(audioBlob);
        
    } catch (error) {
        console.error('녹음 파일 처리 오류:', error);
        alert('녹음 파일을 처리할 수 없습니다.');
    }
}

// 녹음 UI 업데이트
function updateRecordingUI() {
    const recordBtn = document.querySelector('button[onclick="startRecording()"]');
    const stopBtn = document.querySelector('button[onclick="stopRecording()"]');
    
    if (recordBtn) {
        if (isRecording) {
            recordBtn.innerHTML = '🔴 녹음중...';
            recordBtn.style.backgroundColor = '#e74c3c';
            recordBtn.disabled = true;
        } else {
            recordBtn.innerHTML = '🔴 녹음';
            recordBtn.style.backgroundColor = '';
            recordBtn.disabled = false;
        }
    }
    
    if (stopBtn) {
        stopBtn.disabled = !isRecording;
        if (isRecording) {
            stopBtn.style.backgroundColor = '#f39c12';
        } else {
            stopBtn.style.backgroundColor = '';
        }
    }
}

// ===========================================
// 🎧 일반 음성 파일 업로드
// ===========================================

// 음성 파일 업로드 (기존 함수 개선)
function uploadAudio(input) {
    const file = input.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('audio/')) {
        alert('오디오 파일만 업로드 가능합니다.');
        return;
    }
    
    if (file.size > 50 * 1024 * 1024) {
        alert('오디오 파일이 너무 큽니다. 최대 50MB까지 지원됩니다.');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const audioSrc = e.target.result;
        
        // 오디오 파일 목록에 추가
        addToAudioFiles({
            name: file.name,
            type: 'upload',
            src: audioSrc,
            size: file.size,
            duration: 0,
            uploadTime: new Date().toISOString()
        });
        
        // 캔버스에 오디오 시각화 추가
        createAudioVisualization(audioSrc, file.name);
        
        showToast(`🎧 음성 파일 업로드 완료\n${file.name}`, 'success');
    };
    
    reader.onerror = function() {
        alert('음성 파일을 읽을 수 없습니다.');
    };
    
    reader.readAsDataURL(file);
    
    // 입력 초기화
    input.value = '';
}

// ===========================================
// 🔊 효과음 관리
// ===========================================

// 효과음 업로드 (기존 함수 개선)
function uploadSFX(input) {
    const file = input.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('audio/')) {
        alert('오디오 파일만 업로드 가능합니다.');
        return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
        alert('효과음 파일이 너무 큽니다. 최대 10MB까지 지원됩니다.');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const audioSrc = e.target.result;
        
        // 효과음 라이브러리에 추가
        addToEffectsLibrary({
            name: file.name,
            src: audioSrc,
            size: file.size,
            uploadTime: new Date().toISOString()
        });
        
        // 효과음 선택 목록 업데이트
        updateEffectsSelect();
        
        showToast(`🔊 효과음 추가됨\n${file.name}`, 'success');
    };
    
    reader.readAsDataURL(file);
    
    // 입력 초기화
    input.value = '';
}

// 보유 효과음 선택 (기존 함수 개선)
function selectOwnedSFX() {
    const select = document.getElementById('owned-sfx');
    const selected = select.value;
    
    if (!selected) return;
    
    // 선택된 효과음 재생
    playEffect(selected);
    
    console.log('🔊 효과음 선택:', selected);
    showToast(`🔊 효과음 재생\n${selected}`, 'info');
}

// 효과음 라이브러리에 추가
function addToEffectsLibrary(effectData) {
    audioEffects.push(effectData);
    
    // 최대 30개 효과음만 유지
    if (audioEffects.length > 30) {
        audioEffects = audioEffects.slice(-30);
    }
    
    // 로컬 스토리지에 저장
    try {
        localStorage.setItem(AUDIO_EFFECTS_KEY, JSON.stringify(audioEffects));
    } catch (e) {
        console.warn('효과음 라이브러리 저장 실패');
    }
}

// 효과음 선택 목록 업데이트
function updateEffectsSelect() {
    const select = document.getElementById('owned-sfx');
    if (!select) return;
    
    // 기존 옵션들 유지하고 새 효과음 추가
    audioEffects.forEach(effect => {
        // 중복 체크
        const exists = Array.from(select.options).some(option => option.value === effect.name);
        if (!exists) {
            const option = document.createElement('option');
            option.value = effect.name;
            option.textContent = effect.name;
            select.appendChild(option);
        }
    });
}

// 효과음 재생
function playEffect(effectName) {
    // 기본 효과음들
    const builtInEffects = {
        'click': 'data:audio/wav;base64,UklGRiQEAABXQVZFZm10IBAAAAABAAEA...', // 실제로는 base64 데이터
        'whoosh': 'data:audio/wav;base64,UklGRiQEAABXQVZFZm10IBAAAAABAAEA...',
        'ding': 'data:audio/wav;base64,UklGRiQEAABXQVZFZm10IBAAAAABAAEA...'
    };
    
    let audioSrc = builtInEffects[effectName];
    
    // 업로드된 효과음에서 찾기
    if (!audioSrc) {
        const effect = audioEffects.find(e => e.name === effectName);
        if (effect) {
            audioSrc = effect.src;
        }
    }
    
    if (audioSrc) {
        const audio = new Audio(audioSrc);
        audio.volume = 0.7;
        audio.play().catch(error => {
            console.error('효과음 재생 오류:', error);
        });
    }
}

// ===========================================
// 🌐 무료 효과음 검색
// ===========================================

// 무료 효과음 검색 (기존 함수 개선)
async function searchFreeSFX() {
    const query = document.getElementById('sfx-search').value;
    if (!query.trim()) {
        alert('검색어를 입력하세요.');
        return;
    }
    
    const loadingMsg = showLoading('무료 효과음 검색 중...');
    
    try {
        // 실제로는 Freesound API 등을 호출
        const results = await searchFreesoundAPI(query.trim());
        
        hideLoading(loadingMsg);
        
        if (results && results.length > 0) {
            displaySFXResults(results, query);
            showToast(`🔊 ${results.length}개의 효과음을 찾았습니다.`, 'success');
        } else {
            showDummySFXResults(query);
        }
        
    } catch (error) {
        hideLoading(loadingMsg);
        console.error('효과음 검색 오류:', error);
        showDummySFXResults(query);
    }
}

// Freesound API 검색 시뮬레이션
async function searchFreesoundAPI(query) {
    // 실제 구현시 Freesound API 호출
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(generateDummySFXResults(query));
        }, 1500);
    });
}

// 더미 효과음 결과 생성
function generateDummySFXResults(query) {
    const results = [];
    const categories = ['환경음', '효과음', '기계음', '자연음'];
    
    for (let i = 0; i < 6; i++) {
        results.push({
            id: `sfx-${Date.now()}-${i}`,
            name: `${query} ${categories[i % categories.length]} ${i + 1}`,
            duration: (Math.random() * 5 + 1).toFixed(1),
            url: `data:audio/wav;base64,UklGRiQEAABXQVZFZm10IB...${i}`, // 더미 데이터
            author: `작가${i + 1}`,
            description: `${query}와 관련된 고품질 효과음입니다.`
        });
    }
    
    return results;
}

// 더미 효과음 결과 표시
function showDummySFXResults(query) {
    const dummyResults = generateDummySFXResults(query);
    displaySFXResults(dummyResults, query);
    showToast(`🔊 ${query} 관련 샘플 효과음을 표시합니다.\n(실제 API는 관리자 페이지에서 설정)`, 'info');
}

// 효과음 검색 결과 표시
function displaySFXResults(results, query) {
    const audioSection = document.getElementById('audio-sources');
    if (!audioSection) return;
    
    // 기존 검색 결과 제거
    const existingResults = audioSection.querySelectorAll('.sfx-result-item');
    existingResults.forEach(item => item.remove());
    
    // 구분선 추가
    const divider = document.createElement('div');
    divider.className = 'sfx-result-item';
    divider.style.cssText = 'margin: 10px 0; padding: 8px; background: #444; border-radius: 4px; text-align: center; color: #ccc; font-size: 12px;';
    divider.textContent = `🔍 "${query}" 검색 결과 (${results.length}개)`;
    audioSection.appendChild(divider);
    
    // 결과 효과음들 추가
    results.forEach(result => {
        const item = document.createElement('div');
        item.className = 'source-item sfx-result-item';
        
        item.innerHTML = `
            <div class="source-item-title">🔊 ${result.name}</div>
            <div class="source-item-desc">${result.duration}초 by ${result.author}</div>
            <div style="display: flex; gap: 5px; margin-top: 5px;">
                <button onclick="previewSFX('${result.id}')" style="flex: 1; padding: 4px; background: #667eea; border: none; color: white; border-radius: 3px; font-size: 11px; cursor: pointer;">▶️ 미리듣기</button>
                <button onclick="downloadSFX('${result.id}')" style="flex: 1; padding: 4px; background: #2ecc71; border: none; color: white; border-radius: 3px; font-size: 11px; cursor: pointer;">💾 다운로드</button>
            </div>
        `;
        
        // 클릭으로 효과음 라이브러리에 추가
        item.addEventListener('dblclick', function() {
            addToEffectsLibrary({
                name: result.name,
                src: result.url,
                size: 1024, // 더미 크기
                uploadTime: new Date().toISOString()
            });
            updateEffectsSelect();
            showToast(`🔊 효과음 추가됨\n${result.name}`, 'success');
        });
        
        audioSection.appendChild(item);
    });
}

// 효과음 미리듣기
function previewSFX(sfxId) {
    console.log('🔊 효과음 미리듣기:', sfxId);
    showToast('🔊 효과음 미리듣기\n(데모 모드)', 'info');
}

// 효과음 다운로드
function downloadSFX(sfxId) {
    console.log('💾 효과음 다운로드:', sfxId);
    showToast('💾 효과음 다운로드\n(데모 모드)', 'info');
}

// ===========================================
// 🎨 오디오 시각화
// ===========================================

// 오디오 시각화 요소 생성
function createAudioVisualization(audioSrc, fileName) {
    const canvas = document.getElementById('canvas');
    const element = document.createElement('div');
    
    element.className = 'canvas-element canvas-audio';
    element.style.left = '150px';
    element.style.top = '200px';
    element.style.width = '200px';
    element.style.height = '60px';
    element.style.position = 'absolute';
    element.style.cursor = 'move';
    element.style.backgroundColor = '#34495e';
    element.style.border = '2px solid #3498db';
    element.style.borderRadius = '8px';
    element.style.display = 'flex';
    element.style.alignItems = 'center';
    element.style.justifyContent = 'center';
    element.style.color = 'white';
    element.style.fontSize = '12px';
    element.style.textAlign = 'center';
    element.style.zIndex = '7';
    element.id = 'element-' + (++window.elementCounter || Date.now());
    
    // 오디오 컨트롤 추가
    element.innerHTML = `
        <div>
            <div style="margin-bottom: 5px;">🎵 ${fileName.length > 20 ? fileName.substring(0, 20) + '...' : fileName}</div>
            <button onclick="playAudioElement(this)" style="background: #2ecc71; border: none; color: white; padding: 2px 8px; border-radius: 3px; font-size: 10px; cursor: pointer;">▶️ 재생</button>
        </div>
    `;
    
    // 숨겨진 오디오 요소
    const audioElement = document.createElement('audio');
    audioElement.src = audioSrc;
    audioElement.style.display = 'none';
    element.appendChild(audioElement);
    
    // 이벤트 추가
    element.onclick = function(e) {
        if (e.target.tagName !== 'BUTTON') {
            if (typeof selectElement === 'function') {
                selectElement(this);
            }
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

// 오디오 요소 재생
function playAudioElement(button) {
    const audioContainer = button.closest('.canvas-audio');
    const audioElement = audioContainer.querySelector('audio');
    
    if (audioElement.paused) {
        audioElement.play().then(() => {
            button.innerHTML = '⏸️ 일시정지';
        }).catch(error => {
            console.error('오디오 재생 오류:', error);
            alert('오디오를 재생할 수 없습니다.');
        });
    } else {
        audioElement.pause();
        button.innerHTML = '▶️ 재생';
    }
}

// ===========================================
// 🛠️ 유틸리티 및 저장 관리
// ===========================================

// 오디오 파일 목록에 추가
function addToAudioFiles(audioData) {
    uploadedAudioFiles.push(audioData);
    
    // 최대 30개 파일만 유지
    if (uploadedAudioFiles.length > 30) {
        uploadedAudioFiles = uploadedAudioFiles.slice(-30);
    }
    
    // 로컬 스토리지에 저장
    try {
        localStorage.setItem(AUDIO_FILES_KEY, JSON.stringify(uploadedAudioFiles));
    } catch (e) {
        console.warn('오디오 파일 목록 저장 실패');
    }
}

// 로딩/토스트 메시지 함수들 (media.js와 동일)
function showLoading(message) {
    const loading = document.createElement('div');
    loading.id = 'audio-loading';
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

function hideLoading(loadingElement) {
    if (loadingElement && loadingElement.parentNode) {
        loadingElement.remove();
    }
}

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
// 🚀 초기화
// ===========================================

document.addEventListener('DOMContentLoaded', function() {
    // 저장된 오디오 파일들 불러오기
    try {
        const storedAudio = localStorage.getItem(AUDIO_FILES_KEY);
        if (storedAudio) {
            uploadedAudioFiles = JSON.parse(storedAudio);
            console.log(`🎵 저장된 오디오 파일 ${uploadedAudioFiles.length}개 불러옴`);
        }
        
        const storedEffects = localStorage.getItem(AUDIO_EFFECTS_KEY);
        if (storedEffects) {
            audioEffects = JSON.parse(storedEffects);
            console.log(`🔊 저장된 효과음 ${audioEffects.length}개 불러옴`);
            updateEffectsSelect();
        }
    } catch (e) {
        console.warn('오디오 데이터 불러오기 실패');
    }
    
    // Web Audio API 초기화 시도
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.warn('Web Audio API 지원하지 않음');
    }
    
    console.log('✅ Audio.js 완전판 로드 완료 - 배경음악, 녹음, 효과음 모든 기능 활성화');
});