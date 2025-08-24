// init.js - 초기화 및 이벤트 리스너 설정

// 전역 변수들
let selectedElement = null;
let elementCounter = 0;

// 초기화
document.addEventListener('DOMContentLoaded', function() {
    // 캔버스 바깥 클릭시 선택 해제
    document.getElementById('canvas-area').onclick = function(event) {
        if (event.target === this || event.target === document.getElementById('canvas')) {
            if (selectedElement) {
                selectedElement.classList.remove('selected');
                selectedElement = null;
                
                document.getElementById('no-selection').style.display = 'block';
                document.getElementById('text-editor').style.display = 'none';
                document.getElementById('image-editor').style.display = 'none';
            }
        }
    };

    // 드래그 이벤트 전역 설정
    document.querySelectorAll('.source-item[draggable]').forEach(item => {
        item.addEventListener('dragend', dragEnd);
    });
});