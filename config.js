// 대시보드 설정
const DASHBOARD_CONFIG = {
    version: 'v15.0-web',
    title: '써코니 소재 마케팅 대시보드',
    brandColor: '#EEFF33',
    autoRefreshInterval: 300000, // 5분마다 자동 새로고침 (밀리초)
    enableAutoRefresh: false, // 자동 새로고침 비활성화 (필요시 true로 변경)
    dataUrl: './data.json',
    imagesUrl: './images.json'
};

// 캐시 방지 헬퍼
function getCacheBreaker() {
    return '?_=' + Date.now();
}

// 데이터 로드
async function loadData() {
    try {
        console.log('📥 데이터 로딩 중...');
        
        const [dataResponse, imagesResponse] = await Promise.all([
            fetch(DASHBOARD_CONFIG.dataUrl + getCacheBreaker()),
            fetch(DASHBOARD_CONFIG.imagesUrl + getCacheBreaker())
        ]);
        
        const rawData = await dataResponse.json();
        const base64Images = await imagesResponse.json();
        
        console.log(`✅ 데이터: ${rawData.length}개 행`);
        console.log(`✅ 이미지: ${Object.keys(base64Images).length}개`);
        
        return { rawData, base64Images };
    } catch (error) {
        console.error('❌ 데이터 로딩 실패:', error);
        alert('데이터를 불러오는데 실패했습니다. 페이지를 새로고침해주세요.');
        throw error;
    }
}
