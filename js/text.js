// text.js - 텍스트 처리 관련 모든 함수들

// 전역 변수
let currentTextElement = null;

// 프롬프트 저장 관련 상수
const PROMPT_STORAGE_KEY = 'ai_prompts_history';

// 빠른 텍스트 추가
function addQuickText() {
    addTextElement('텍스트를 입력하세요', 50, 50);
}

// 텍스트 요소 추가 (canvas.js에서 이동)
function addTextElement(content, x, y) {
    const canvas = document.getElementById('canvas');
    const element = document.createElement('div');
    
    element.className = 'canvas-element canvas-text';
    element.textContent = content;
    element.style.left = x + 'px';
    element.style.top = y + 'px';
    element.style.fontSize = '16px';
    element.style.color = '#ffffff';
    element.style.fontFamily = 'Arial';
    element.style.position = 'absolute';
    element.style.cursor = 'pointer';
    element.style.padding = '8px';
    element.style.minWidth = '50px';
    element.style.minHeight = '20px';
    element.style.border = '1px solid transparent';
    element.id = 'element-' + (++window.elementCounter || 1);
    element.style.zIndex = '10';
    
    element.onclick = function() {
        selectTextElement(this);
    };
    
    canvas.appendChild(element);
    selectTextElement(element);
    return element;
}

// 텍스트 요소 선택
function selectTextElement(element) {
    // 이전 선택 해제
    if (window.selectedElement) {
        window.selectedElement.classList.remove('selected');
    }
    
    // 새 요소 선택
    window.selectedElement = element;
    currentTextElement = element;
    element.classList.add('selected');
    element.style.border = '2px solid #667eea';
    
    // 텍스트 편집기 표시
    showTextEditor(element);
}

// 텍스트 편집기 표시 및 설정 (editor.js에서 이동)
function showTextEditor(element) {
    // 다른 편집기들 숨김
    const imageEditor = document.getElementById('image-editor');
    const selectedTools = document.getElementById('selected-tools');
    if (imageEditor) imageEditor.style.display = 'none';
    if (selectedTools) selectedTools.style.display = 'none';
    
    // 텍스트 편집기 표시
    const textEditor = document.getElementById('text-editor');
    if (textEditor) {
        textEditor.style.display = 'block';
        
        // 현재 값들로 설정
        updateTextEditorValues(element);
        
        // 이벤트 리스너 설정
        setupTextEditorEvents(element);
    }
}

// 텍스트 편집기 값 업데이트
function updateTextEditorValues(element) {
    const textContent = document.getElementById('text-content');
    const textSize = document.getElementById('text-size');
    const textSizeValue = document.getElementById('text-size-value');
    const textColor = document.getElementById('text-color');
    const textX = document.getElementById('text-x');
    const textY = document.getElementById('text-y');
    const textFont = document.getElementById('text-font');
    
    if (textContent) textContent.value = element.textContent;
    if (textSize) {
        const fontSize = parseInt(getComputedStyle(element).fontSize);
        textSize.value = fontSize;
        if (textSizeValue) textSizeValue.textContent = fontSize + 'px';
    }
    if (textColor) textColor.value = rgbToHex(getComputedStyle(element).color);
    if (textX) textX.value = parseInt(element.style.left);
    if (textY) textY.value = parseInt(element.style.top);
    if (textFont) textFont.value = getComputedStyle(element).fontFamily.replace(/["']/g, '');
}

// 텍스트 편집기 이벤트 설정 (🔥 실시간 저장 기능 추가)
function setupTextEditorEvents(element) {
    const textContent = document.getElementById('text-content');
    const textSize = document.getElementById('text-size');
    const textSizeValue = document.getElementById('text-size-value');
    const textColor = document.getElementById('text-color');
    const textX = document.getElementById('text-x');
    const textY = document.getElementById('text-y');
    const textFont = document.getElementById('text-font');
    
    if (textContent) {
        textContent.oninput = function() {
            element.textContent = this.value;
            // 🔥 실시간 저장 추가!
            saveCanvasState();
        };
    }
    
    if (textSize) {
        textSize.oninput = function() {
            element.style.fontSize = this.value + 'px';
            if (textSizeValue) textSizeValue.textContent = this.value + 'px';
            // 🔥 실시간 저장 추가!
            saveCanvasState();
        };
    }
    
    if (textColor) {
        textColor.onchange = function() {
            element.style.color = this.value;
            // 🔥 실시간 저장 추가!
            saveCanvasState();
        };
    }
    
    if (textX) {
        textX.onchange = function() {
            element.style.left = this.value + 'px';
            // 🔥 실시간 저장 추가!
            saveCanvasState();
        };
    }
    
    if (textY) {
        textY.onchange = function() {
            element.style.top = this.value + 'px';
            // 🔥 실시간 저장 추가!
            saveCanvasState();
        };
    }
    
    if (textFont) {
        textFont.onchange = function() {
            element.style.fontFamily = this.value;
            // 🔥 실시간 저장 추가!
            saveCanvasState();
        };
    }
}

// 텍스트 스타일 토글 함수들
function toggleTextBold() {
    if (!currentTextElement) return;
    
    const currentWeight = getComputedStyle(currentTextElement).fontWeight;
    const isBold = currentWeight === 'bold' || currentWeight >= 700;
    
    currentTextElement.style.fontWeight = isBold ? 'normal' : 'bold';
    
    const boldBtn = document.getElementById('bold-btn');
    if (boldBtn) {
        boldBtn.style.backgroundColor = isBold ? '#555' : '#667eea';
    }
}

function toggleTextItalic() {
    if (!currentTextElement) return;
    
    const currentStyle = getComputedStyle(currentTextElement).fontStyle;
    const isItalic = currentStyle === 'italic';
    
    currentTextElement.style.fontStyle = isItalic ? 'normal' : 'italic';
    
    const italicBtn = document.getElementById('italic-btn');
    if (italicBtn) {
        italicBtn.style.backgroundColor = isItalic ? '#555' : '#667eea';
    }
}

function toggleTextUnderline() {
    if (!currentTextElement) return;
    
    const currentDecoration = getComputedStyle(currentTextElement).textDecoration;
    const isUnderlined = currentDecoration.includes('underline');
    
    currentTextElement.style.textDecoration = isUnderlined ? 'none' : 'underline';
    
    const underlineBtn = document.getElementById('underline-btn');
    if (underlineBtn) {
        underlineBtn.style.backgroundColor = isUnderlined ? '#555' : '#667eea';
    }
}

// 텍스트 정렬
function setTextAlign(align) {
    if (!currentTextElement) return;
    currentTextElement.style.textAlign = align;
}

// 대본/나레이션 편집
function showScriptEditor(type) {
    if (type === 'manual') {
        const script = prompt('대본을 입력하세요:');
        if (script && script.trim()) {
            const element = addTextElement(script.trim(), 50, 100);
            element.setAttribute('data-text-type', 'script');
        }
    } else if (type === 'ai') {
        showAIMethodSelection('script');
    }
}

function showNarrationEditor(type) {
    if (type === 'manual') {
        const narration = prompt('나레이션을 입력하세요:');
        if (narration && narration.trim()) {
            const element = addTextElement(narration.trim(), 50, 150);
            element.setAttribute('data-text-type', 'narration');
        }
    } else if (type === 'ai') {
        showAIMethodSelection('narration');
    }
}

// AI 생성 방식 선택
function showAIMethodSelection(type) {
    const typeText = type === 'script' ? '대본' : '나레이션';
    
    const choice = window.prompt(
        `🤖 AI ${typeText} 생성 방식을 선택하세요:\n\n` +
        `1. 간단 설정 (질문 답변)\n` +
        `2. 프롬프트 직접 입력\n` +
        `3. 키워드로 생성\n` +
        `4. 웹주소로 생성\n` +
        `5. AI 설정 변경\n\n` +
        `번호를 입력하세요:`
    );
    
    switch(choice) {
        case '1':
            if (type === 'script') {
                showSimpleScriptDialog();
            } else {
                showSimpleNarrationDialog();
            }
            break;
        case '2':
            showAIPromptDialog(type);
            break;
        case '3':
            generateFromKeyword(type);
            break;
        case '4':
            generateFromWebURL(type);
            break;
        case '5':
            showAISettings();
            break;
    }
}

// 간단 설정 대본 생성
function showSimpleScriptDialog() {
    const topic = prompt('어떤 주제의 대본을 만들까요?\n(예: 제품 소개, 브랜드 스토리, 이벤트 홍보 등)');
    if (!topic || !topic.trim()) return;
    
    const duration = prompt('영상 길이는 몇 초 정도인가요?\n(15초, 30초, 60초 등)');
    if (!duration || !duration.trim()) return;
    
    const tone = prompt('어떤 톤으로 작성할까요?\n(친근한, 전문적인, 유머러스한, 감동적인 등)');
    if (!tone || !tone.trim()) return;
    
    generateAIScript(topic.trim(), duration.trim(), tone.trim());
}

// 간단 설정 나레이션 생성
function showSimpleNarrationDialog() {
    const content = prompt('어떤 내용의 나레이션을 만들까요?\n(예: 제품 설명, 사용법 안내, 스토리텔링 등)');
    if (!content || !content.trim()) return;
    
    const style = prompt('나레이션 스타일을 선택하세요:\n(차분한, 밝은, 극적인, 설명적인 등)');
    if (!style || !style.trim()) return;
    
    generateAINarration(content.trim(), style.trim());
}

// AI 설정 관리
function getAISettings() {
    try {
        const settings = localStorage.getItem('user_ai_settings');
        const defaultSettings = {
            provider: 'claude',
            model: 'claude-3-sonnet-20240229',
            maxTokens: 1000,
            temperature: 0.7
        };
        
        if (settings) {
            const parsed = JSON.parse(settings);
            console.log('🔧 AI 설정 로드됨:', parsed.provider);
            return parsed;
        } else {
            console.log('🔧 기본 AI 설정 사용');
            return defaultSettings;
        }
    } catch (error) {
        console.error('❌ AI 설정 로딩 오류:', error);
        return {
            provider: 'claude',
            model: 'claude-3-sonnet-20240229',
            maxTokens: 1000,
            temperature: 0.7
        };
    }
}

function saveAISettings(settings) {
    try {
        localStorage.setItem('user_ai_settings', JSON.stringify(settings));
        console.log('✅ AI 설정 저장됨:', settings.provider);
        return true;
    } catch (error) {
        console.error('❌ AI 설정 저장 오류:', error);
        return false;
    }
}

function showAISettings() {
    const currentSettings = getAISettings();
    
    const provider = window.prompt(
        `AI 제공업체를 선택하세요:\n\n` +
        `1. Claude (Anthropic)\n` +
        `2. OpenAI (ChatGPT)\n\n` +
        `현재 설정: ${currentSettings.provider}\n\n` +
        `번호를 입력하세요 (1 또는 2):`
    );
    
    if (!provider) return;
    
    let newProvider, newModel;
    if (provider === '1') {
        newProvider = 'claude';
        newModel = window.prompt(
            `Claude 모델을 선택하세요:\n\n` +
            `1. claude-3-sonnet-20240229 (기본)\n` +
            `2. claude-3-opus-20240229\n` +
            `3. claude-3-haiku-20240307\n\n` +
            `번호를 입력하세요:`
        );
        const models = {
            '1': 'claude-3-sonnet-20240229',
            '2': 'claude-3-opus-20240229', 
            '3': 'claude-3-haiku-20240307'
        };
        newModel = models[newModel] || 'claude-3-sonnet-20240229';
        
    } else if (provider === '2') {
        newProvider = 'openai';
        newModel = window.prompt(
            `OpenAI 모델을 선택하세요:\n\n` +
            `1. gpt-3.5-turbo (기본)\n` +
            `2. gpt-4\n` +
            `3. gpt-4-turbo\n\n` +
            `번호를 입력하세요:`
        );
        const models = {
            '1': 'gpt-3.5-turbo',
            '2': 'gpt-4',
            '3': 'gpt-4-turbo'
        };
        newModel = models[newModel] || 'gpt-3.5-turbo';
    } else {
        return;
    }
    
    const maxTokens = window.prompt(`최대 토큰 수를 입력하세요 (기본: 1000):`) || '1000';
    const temperature = window.prompt(`창의성 수준을 입력하세요 (0.0-1.0, 기본: 0.7):`) || '0.7';
    
    const newSettings = {
        provider: newProvider,
        model: newModel,
        maxTokens: parseInt(maxTokens),
        temperature: parseFloat(temperature)
    };
    
    saveAISettings(newSettings);
    alert(`✅ AI 설정이 저장되었습니다!\n제공업체: ${newProvider}\n모델: ${newModel}`);
}

// 프롬프트 저장
function savePrompt(promptText, type) {
    try {
        console.log('💾 프롬프트 저장 시도:', type);
        
        let prompts = getSavedPrompts();
        const promptData = {
            id: Date.now().toString(),
            text: promptText,
            type: type,
            timestamp: new Date().toISOString(),
            usage: 1
        };
        
        // 중복 프롬프트 체크
        const existing = prompts.find(p => p.text === promptText && p.type === type);
        if (existing) {
            existing.usage++;
            existing.timestamp = new Date().toISOString();
            console.log('📝 기존 프롬프트 사용횟수 증가:', existing.usage);
        } else {
            prompts.push(promptData);
            console.log('📝 새 프롬프트 추가됨');
        }
        
        // 최근 100개만 유지
        if (prompts.length > 100) {
            prompts = prompts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 100);
        }
        
        localStorage.setItem(PROMPT_STORAGE_KEY, JSON.stringify(prompts));
        console.log('✅ 프롬프트 저장 완료');
        return true;
        
    } catch (error) {
        console.error('❌ 프롬프트 저장 오류:', error);
        return false;
    }
}

// 저장된 프롬프트 가져오기
function getSavedPrompts() {
    try {
        const stored = localStorage.getItem(PROMPT_STORAGE_KEY);
        const prompts = stored ? JSON.parse(stored) : [];
        console.log('📂 저장된 프롬프트 수:', prompts.length);
        return prompts;
    } catch (error) {
        console.error('❌ 프롬프트 로딩 오류:', error);
        return [];
    }
}

// AI 프롬프트 직접 입력 다이얼로그
function showAIPromptDialog(type) {
    const typeText = type === 'script' ? '대본' : '나레이션';
    
    // 저장된 프롬프트 표시 옵션
    const savedPrompts = getSavedPrompts().filter(p => p.type === type);
    let promptMessage = `AI ${typeText} 생성 프롬프트를 입력하세요:\n\n`;
    
    if (savedPrompts.length > 0) {
        promptMessage += `💾 최근 사용한 프롬프트 (${savedPrompts.length}개):\n`;
        savedPrompts.slice(0, 3).forEach((p, i) => {
            const preview = p.text.length > 30 ? p.text.substring(0, 30) + '...' : p.text;
            promptMessage += `${i+1}. ${preview} (${p.usage}회 사용)\n`;
        });
        promptMessage += '\n';
    }
    
    promptMessage += `예시:\n` +
        `"30초 동안 스마트폰 카메라 기능을 소개하는 친근하고 재미있는 ${typeText}을 작성해줘. ` +
        `젊은 층을 타겟으로 하고, 핵심 기능 3가지를 강조해줘."\n\n` +
        `아래에 직접 프롬프트를 입력하세요:`;
    
    const prompt = window.prompt(promptMessage);
    
    if (prompt && prompt.trim()) {
        // 프롬프트 저장
        savePrompt(prompt.trim(), type);
        generateAIFromPrompt(prompt.trim(), type);
    }
}

// 관리자 API 설정 가져오기
function getAPISettings() {
    const settings = localStorage.getItem('ai_api_settings');
    return settings ? JSON.parse(settings) : null;
}

// 프롬프트로 AI 생성 (실제 API 호출)
async function generateAIFromPrompt(promptText, type) {
    const typeText = type === 'script' ? '대본' : '나레이션';
    const yPosition = type === 'script' ? 100 : 150;
    
    // 로딩 표시
    const loadingText = addTextElement(`⏳ AI ${typeText} 생성 중...\n프롬프트: ${promptText.substring(0, 50)}...`, 50, yPosition);
    
    try {
        // 실제 AI API 호출
        const result = await callAIAPI(promptText);
        
        // 로딩 텍스트 제거하고 실제 결과 추가
        loadingText.remove();
        const element = addTextElement(result, 50, yPosition);
        element.setAttribute('data-text-type', `ai-${type}-prompt`);
        element.style.backgroundColor = 'rgba(46, 204, 113, 0.1)';
        element.style.border = '1px dashed #2ecc71';
        
    } catch (error) {
        // 에러 처리
        loadingText.remove();
        const errorElement = addTextElement(`❌ AI ${typeText} 생성 실패\n오류: ${error.message}`, 50, yPosition);
        errorElement.style.backgroundColor = 'rgba(231, 76, 60, 0.1)';
        errorElement.style.border = '1px dashed #e74c3c';
        errorElement.style.color = '#e74c3c';
    }
}

// AI API 호출
async function callAIAPI(promptText) {
    try {
        const userSettings = getAISettings();
        const apiSettings = getAPISettings();
        
        if (!apiSettings || !apiSettings.apiKey) {
            throw new Error('AI API 설정이 필요합니다. 관리자 페이지에서 API 키를 설정해주세요.');
        }
        
        let response;
        
        if (userSettings.provider === 'openai') {
            response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiSettings.openaiKey || apiSettings.apiKey}`
                },
                body: JSON.stringify({
                    model: userSettings.model,
                    messages: [{ role: 'user', content: promptText }],
                    max_tokens: userSettings.maxTokens,
                    temperature: userSettings.temperature
                })
            });
        } else if (userSettings.provider === 'claude') {
            response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiSettings.claudeKey || apiSettings.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: userSettings.model,
                    max_tokens: userSettings.maxTokens,
                    messages: [{ role: 'user', content: promptText }]
                })
            });
        }
        
        if (!response.ok) {
            throw new Error(`API 호출 실패: ${response.status} - ${userSettings.provider} API 키를 확인해주세요.`);
        }
        
        const data = await response.json();
        
        if (userSettings.provider === 'openai') {
            return data.choices[0].message.content;
        } else if (userSettings.provider === 'claude') {
            return data.content[0].text;
        }
        
    } catch (error) {
        console.error('AI API 호출 오류:', error);
        throw error;
    }
}

// 키워드로 AI 대본 생성
function generateFromKeyword(type) {
    const typeText = type === 'script' ? '대본' : '나레이션';
    
    const templates = getPromptTemplates(type);
    if (templates.length === 0) {
        alert(`저장된 ${typeText} 프롬프트 템플릿이 없습니다.\n먼저 AI작성으로 프롬프트를 저장해주세요.`);
        return;
    }
    
    let templateMessage = `📝 ${typeText} 프롬프트 템플릿 선택:\n\n`;
    templates.forEach((template, i) => {
        const preview = template.text.substring(0, 60) + '...';
        templateMessage += `${i+1}. ${preview}\n`;
    });
    templateMessage += '\n템플릿 번호를 선택하세요:';
    
    const templateChoice = window.prompt(templateMessage);
    if (!templateChoice || isNaN(templateChoice)) return;
    
    const selectedTemplate = templates[parseInt(templateChoice) - 1];
    if (!selectedTemplate) return;
    
    const keyword = window.prompt(`키워드를 입력하세요:\n\n예시:\n- "스마트폰 카메라"\n- "여행, 휴가"\n- "건강식품, 다이어트"\n\n키워드:`);
    if (!keyword || !keyword.trim()) return;
    
    const finalPrompt = `${selectedTemplate.text}\n\n키워드: ${keyword.trim()}`;
    generateAIFromPrompt(finalPrompt, type);
}

// 웹주소로 AI 대본 생성
function generateFromWebURL(type) {
    const typeText = type === 'script' ? '대본' : '나레이션';
    
    const templates = getPromptTemplates(type);
    if (templates.length === 0) {
        alert(`저장된 ${typeText} 프롬프트 템플릿이 없습니다.\n먼저 AI작성으로 프롬프트를 저장해주세요.`);
        return;
    }
    
    let templateMessage = `📝 ${typeText} 프롬프트 템플릿 선택:\n\n`;
    templates.forEach((template, i) => {
        const preview = template.text.substring(0, 60) + '...';
        templateMessage += `${i+1}. ${preview}\n`;
    });
    templateMessage += '\n템플릿 번호를 선택하세요:';
    
    const templateChoice = window.prompt(templateMessage);
    if (!templateChoice || isNaN(templateChoice)) return;
    
    const selectedTemplate = templates[parseInt(templateChoice) - 1];
    if (!selectedTemplate) return;
    
    const webURL = window.prompt(`뉴스기사나 웹페이지 주소를 입력하세요:\n\n예시:\n- https://news.naver.com/article/...\n- https://blog.naver.com/...\n- https://www.example.com/...\n\nURL:`);
    if (!webURL || !webURL.trim()) return;
    
    fetchWebContentAndGenerate(selectedTemplate.text, webURL.trim(), type);
}

// 웹페이지 내용 가져와서 AI 생성
async function fetchWebContentAndGenerate(promptTemplate, url, type) {
    const typeText = type === 'script' ? '대본' : '나레이션';
    const yPosition = type === 'script' ? 100 : 150;
    
    const loadingText = addTextElement(`⏳ 웹페이지 내용 가져오는 중...\nURL: ${url}`, 50, yPosition);
    
    try {
        const proxyURL = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyURL);
        
        if (!response.ok) {
            throw new Error('웹페이지를 가져올 수 없습니다.');
        }
        
        const data = await response.json();
        const htmlContent = data.contents;
        
        const textContent = htmlContent.replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .substring(0, 2000);
        
        const finalPrompt = `${promptTemplate}\n\n참고 웹페이지 내용:\n${textContent}`;
        
        loadingText.textContent = `⏳ AI ${typeText} 생성 중...`;
        
        const result = await callAIAPI(finalPrompt);
        
        loadingText.remove();
        const element = addTextElement(result, 50, yPosition);
        element.setAttribute('data-text-type', `ai-${type}-web`);
        element.style.backgroundColor = 'rgba(52, 152, 219, 0.1)';
        element.style.border = '1px dashed #3498db';
        
    } catch (error) {
        loadingText.remove();
        const errorElement = addTextElement(`❌ 웹페이지 ${typeText} 생성 실패\n오류: ${error.message}`, 50, yPosition);
        errorElement.style.backgroundColor = 'rgba(231, 76, 60, 0.1)';
        errorElement.style.border = '1px dashed #e74c3c';
        errorElement.style.color = '#e74c3c';
    }
}

// 프롬프트 템플릿 가져오기
function getPromptTemplates(type) {
    const prompts = getSavedPrompts();
    return prompts.filter(p => p.type === type);
}

// AI 대본 생성 (기존 더미 함수들도 유지)
function generateAIScript(topic, duration, tone) {
    const loadingText = addTextElement('⏳ AI 대본 생성 중...', 50, 100);
    
    setTimeout(() => {
        const scripts = {
            '15초': {
                '친근한': `안녕하세요! 오늘은 ${topic}에 대해 이야기해볼게요. 정말 흥미로운 내용이니까 끝까지 봐주세요!`,
                '전문적인': `${topic}의 핵심 포인트를 소개합니다. 전문적인 분석과 함께 자세히 살펴보겠습니다.`,
                '유머러스한': `${topic}? 들어는 봤나요? ㅋㅋ 재미있게 설명해드릴게요! 웃으면서 배워봅시다~`,
                '감동적인': `${topic}를 통해 우리가 얻을 수 있는 소중한 가치에 대해 함께 생각해보아요.`
            },
            '30초': {
                '친근한': `안녕하세요! 오늘의 주제는 ${topic}입니다. 여러분도 궁금하셨죠? 제가 쉽고 재미있게 설명해드릴게요. 준비되셨나요? 그럼 시작해볼까요!`,
                '전문적인': `${topic}에 대한 전문적인 분석을 시작하겠습니다. 데이터와 사실을 바탕으로 정확한 정보를 전달해드리며, 실용적인 인사이트를 제공하겠습니다.`
            }
        };
        
        const script = scripts[duration]?.[tone] || `${topic}에 대한 ${tone} ${duration} 대본을 준비했습니다.`;
        
        loadingText.remove();
        const element = addTextElement(script, 50, 100);
        element.setAttribute('data-text-type', 'ai-script');
        element.style.backgroundColor = 'rgba(102, 126, 234, 0.1)';
        element.style.border = '1px dashed #667eea';
        
    }, 2000);
}

// AI 나레이션 생성 (기존 더미 함수도 유지)
function generateAINarration(content, style) {
    const loadingText = addTextElement('⏳ AI 나레이션 생성 중...', 50, 150);
    
    setTimeout(() => {
        const narrations = {
            '차분한': `${content}에 대해 차근차근 살펴보겠습니다. 편안한 마음으로 들어보세요.`,
            '밝은': `${content}를 밝고 활기차게 소개해드릴게요! 함께 알아봅시다!`,
            '극적인': `지금부터 ${content}의 놀라운 세계로 여러분을 초대합니다. 준비되셨나요?`,
            '설명적인': `${content}의 구체적인 내용과 방법을 단계별로 자세히 설명해드리겠습니다.`
        };
        
        const narration = narrations[style] || `${content}에 대한 ${style} 나레이션입니다.`;
        
        loadingText.remove();
        const element = addTextElement(narration, 50, 150);
        element.setAttribute('data-text-type', 'ai-narration');
        element.style.backgroundColor = 'rgba(155, 89, 182, 0.1)';
        element.style.border = '1px dashed #9b59b6';
        
    }, 2000);
}

// 유틸리티 함수
function rgbToHex(rgb) {
    if (rgb.startsWith('#')) return rgb;
    const result = rgb.match(/\d+/g);
    if (!result) return '#ffffff';
    return '#' + result.slice(0, 3).map(x => {
        const hex = parseInt(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

// ========================================
// 🔥 캔버스 상태 저장/복원 기능
// ========================================

const CANVAS_STATE_KEY = 'canvas_state';

// 캔버스 상태 저장
function saveCanvasState() {
    try {
        console.log('💾 캔버스 상태 저장 시도');
        
        const canvas = document.getElementById('canvas');
        if (!canvas) return false;
        
        const canvasState = {
            elements: [],
            background: canvas.style.background || '#333',
            lastSaved: new Date().toISOString()
        };
        
        // 모든 캔버스 요소 수집
        canvas.querySelectorAll('.canvas-element').forEach(element => {
            const elementData = {
                id: element.id,
                className: element.className,
                type: getElementType(element),
                content: getElementContent(element),
                styles: getElementStyles(element),
                attributes: getElementAttributes(element)
            };
            canvasState.elements.push(elementData);
        });
        
        localStorage.setItem(CANVAS_STATE_KEY, JSON.stringify(canvasState));
        console.log('✅ 캔버스 상태 저장 완료:', canvasState.elements.length + '개 요소');
        return true;
        
    } catch (error) {
        console.error('❌ 캔버스 저장 오류:', error);
        return false;
    }
}

// 캔버스 상태 복원
function loadCanvasState() {
    try {
        console.log('🔄 캔버스 상태 복원 시도');
        
        const stored = localStorage.getItem(CANVAS_STATE_KEY);
        if (!stored) {
            console.log('📭 저장된 캔버스 상태 없음');
            return false;
        }
        
        const canvasState = JSON.parse(stored);
        const canvas = document.getElementById('canvas');
        if (!canvas) return false;
        
        // 기존 요소들 제거
        canvas.querySelectorAll('.canvas-element').forEach(element => {
            element.remove();
        });
        
        // 배경 복원
        canvas.style.background = canvasState.background;
        
        // 요소들 복원
        canvasState.elements.forEach(elementData => {
            restoreElement(elementData);
        });
        
        console.log('✅ 캔버스 상태 복원 완료:', canvasState.elements.length + '개 요소');
        return true;
        
    } catch (error) {
        console.error('❌ 캔버스 복원 오류:', error);
        return false;
    }
}

// 요소 타입 확인
function getElementType(element) {
    if (element.classList.contains('canvas-text')) return 'text';
    if (element.classList.contains('canvas-image')) return 'image';
    if (element.classList.contains('canvas-background-template')) return 'background-template';
    return 'unknown';
}

// 요소 내용 가져오기
function getElementContent(element) {
    const type = getElementType(element);
    if (type === 'text') return element.textContent;
    if (type === 'image' || type === 'background-template') return element.src;
    return '';
}

// 요소 스타일 가져오기
function getElementStyles(element) {
    return {
        left: element.style.left,
        top: element.style.top,
        fontSize: element.style.fontSize,
        color: element.style.color,
        fontFamily: element.style.fontFamily,
        fontWeight: element.style.fontWeight,
        fontStyle: element.style.fontStyle,
        textDecoration: element.style.textDecoration,
        textAlign: element.style.textAlign,
        width: element.style.width,
        height: element.style.height,
        zIndex: element.style.zIndex,
        backgroundColor: element.style.backgroundColor,
        border: element.style.border,
        padding: element.style.padding,
        objectFit: element.style.objectFit,
        pointerEvents: element.style.pointerEvents
    };
}

// 요소 속성 가져오기
function getElementAttributes(element) {
    const attributes = {};
    if (element.getAttribute('data-text-type')) {
        attributes['data-text-type'] = element.getAttribute('data-text-type');
    }
    if (element.alt) attributes.alt = element.alt;
    return attributes;
}

// 요소 복원
function restoreElement(elementData) {
    const canvas = document.getElementById('canvas');
    const type = elementData.type;
    let element;
    
    if (type === 'text') {
        element = document.createElement('div');
        element.textContent = elementData.content;
        element.onclick = function() {
            selectTextElement(this);
        };
    } else if (type === 'image') {
        element = document.createElement('img');
        element.src = elementData.content;
        element.onclick = function() {
            selectElement(this);
        };
    } else if (type === 'background-template') {
        element = document.createElement('img');
        element.src = elementData.content;
    } else {
        return;
    }
    
    // 기본 속성 설정
    element.id = elementData.id;
    element.className = elementData.className;
    
    // 스타일 적용
    Object.keys(elementData.styles).forEach(styleName => {
        if (elementData.styles[styleName]) {
            element.style[styleName] = elementData.styles[styleName];
        }
    });
    
    // 속성 적용
    Object.keys(elementData.attributes).forEach(attrName => {
        element.setAttribute(attrName, elementData.attributes[attrName]);
    });
    
    // 배경 템플릿은 맨 앞에, 나머지는 맨 뒤에
    if (type === 'background-template') {
        canvas.insertBefore(element, canvas.firstChild);
    } else {
        canvas.appendChild(element);
    }
}

// ========================================
// 초기화
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    // 🔥 페이지 로드 시 캔버스 상태 자동 복원
    setTimeout(() => {
        console.log('🔄 페이지 로드 완료 - 캔버스 상태 복원 시도');
        loadCanvasState();
    }, 500);
    
    // 클릭 이벤트 설정
    setTimeout(() => {
        document.addEventListener('click', function(e) {
            if (!e.target.classList.contains('canvas-text') && 
                !e.target.closest('#text-editor')) {
                const textEditor = document.getElementById('text-editor');
                if (textEditor) textEditor.style.display = 'none';
                currentTextElement = null;
            }
        });
    }, 1000);
});