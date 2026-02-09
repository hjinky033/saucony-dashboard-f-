// 데이터 로드
async function loadData() {
    try {
        console.log('📦 데이터 로딩 중...');
        
        // 캐시 방지를 위한 타임스탬프
        const timestamp = new Date().getTime();
        
        // 데이터 및 이미지 로드
        const [dataResponse, imagesResponse] = await Promise.all([
            fetch(`./data.json?t=${timestamp}`),
            fetch(`./images.json?t=${timestamp}`)
        ]);
        
        if (!dataResponse.ok || !imagesResponse.ok) {
            throw new Error('데이터 로딩 실패');
        }
        
        const rawDataArray = await dataResponse.json();
        const base64ImagesData = await imagesResponse.json();
        
        // 데이터 변환 (엑셀 컬럼명 → 영문 컬럼명)
        const processedData = rawDataArray.map(row => ({
            date: row['날짜'] || '',
            channel: row['채널'] || '',
            campaign: row['캠페인 명'] || '',
            adGroup: row['광고그룹 명'] || '',
            creative: row['소재명'] || '',
            impressions: parseFloat(row['노출수']) || 0,
            clicks: parseFloat(row['클릭수']) || 0,
            ctr: parseFloat(row['CTR']) || 0,
            cpc: parseFloat(row['CPC']) || 0,
            cost: parseFloat(row['총비용']) || 0,
            conversions: parseFloat(row['전환수']) || 0,
            cvr: parseFloat(row['CVR']) || 0,
            revenue: parseFloat(row['매출']) || 0,
            cpa: parseFloat(row['CPA']) || 0,
            roas: parseFloat(row['ROAS']) || 0,
            '광고그룹 명': row['광고그룹 명'] || ''
        }));
        
        console.log(`✅ 데이터 로드 완료: ${processedData.length}개 레코드`);
        console.log(`✅ 이미지 로드 완료: ${Object.keys(base64ImagesData).length}개`);
        
        return {
            rawData: processedData,
            base64Images: base64ImagesData
        };
    } catch (error) {
        console.error('❌ 데이터 로드 실패:', error);
        throw error;
    }
}

// 전역 변수
let rawData = [];
let base64Images = {};
let filteredData = [];
let currentSort = {column: 'revenue', order: 'desc'};

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 대시보드 초기화 중...');
    await initDashboard();
});

// 대시보드 초기화
async function initDashboard() {
    try {
        const data = await loadData();
        rawData = data.rawData;
        base64Images = data.base64Images;
        filteredData = [...rawData];
        
        initFilters();
        updateDashboard();
        updateLastUpdateTime();
        
        // 로딩 화면 숨기기
        document.getElementById('loading').classList.add('hidden');
        
        console.log('✅ 대시보드 초기화 완료');
    } catch (error) {
        console.error('❌ 초기화 실패:', error);
        document.getElementById('loading').querySelector('.loading-text').textContent = 
            '데이터 로딩 실패. 페이지를 새로고침해주세요.';
    }
}

// 새로고침
async function refreshData() {
    console.log('🔄 데이터 새로고침 중...');
    document.getElementById('loading').classList.remove('hidden');
    
    try {
        const data = await loadData();
        rawData = data.rawData;
        base64Images = data.base64Images;
        filteredData = [...rawData];
        
        // 필터 초기화 후 재적용
        initFilters();
        updateDashboard();
        updateLastUpdateTime();
        
        document.getElementById('loading').classList.add('hidden');
        console.log('✅ 새로고침 완료');
        
        // 사용자 알림
        showNotification('데이터가 업데이트되었습니다!');
    } catch (error) {
        console.error('❌ 새로고침 실패:', error);
        document.getElementById('loading').classList.add('hidden');
        alert('데이터 새로고침에 실패했습니다.');
    }
}

// 알림 표시
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #EEFF33;
        color: #000;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        font-weight: 600;
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// 마지막 업데이트 시간 표시
function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleString('ko-KR', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
    document.getElementById('lastUpdate').textContent = `업데이트: ${timeString}`;
}

// 유틸리티 함수
function numberFormat(num) {
    return new Intl.NumberFormat('ko-KR').format(num);
}

function percentFormat(num) {
    return (num * 100).toFixed(2) + '%';
}

function parseDate(dateStr) {
    if (!dateStr) return null;
    
    // 공백 제거 및 끝의 점이나 하이픈 제거
    dateStr = dateStr.trim().replace(/[.-]+$/, '');
    
    // 빈 문자열 체크
    if (!dateStr || dateStr.length < 8) return null;
    
    let year, month, day;
    
    // 하이픈 구분 (2026-02-05)
    if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            year = parseInt(parts[0]);
            month = parseInt(parts[1]);
            day = parseInt(parts[2]);
        }
    }
    // 점 구분 (2026.02.05)
    else if (dateStr.includes('.')) {
        const parts = dateStr.split('.');
        if (parts.length >= 3) {
            year = parseInt(parts[0]);
            month = parseInt(parts[1]);
            day = parseInt(parts[2]);
        }
    }
    // 구분자 없음 (20260205)
    else if (dateStr.length === 8) {
        year = parseInt(dateStr.substring(0, 4));
        month = parseInt(dateStr.substring(4, 6));
        day = parseInt(dateStr.substring(6, 8));
    }
    
    // 유효성 검증
    if (!year || !month || !day) return null;
    if (year < 1900 || year > 2100) return null;  // 0000 같은 잘못된 년도
    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 31) return null;
    
    // Date 객체 생성
    const date = new Date(year, month - 1, day);
    
    // Date 객체가 유효한지 확인 (ex: 2026-02-31 같은 잘못된 날짜)
    if (isNaN(date.getTime())) return null;
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        return null;
    }
    
    return date;
}

// Date 객체를 YYYY-MM-DD 형식으로 변환
function formatDateToYYYYMMDD(date) {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        return '';
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

function adjustKPIFontSize() {
    document.querySelectorAll('.kpi-value').forEach(element => {
        const text = element.textContent;
        element.classList.remove('long', 'very-long');
        
        if (text.length > 12) {
            element.classList.add('very-long');
        } else if (text.length > 8) {
            element.classList.add('long');
        }
    });
}

// 필터링
function applyFilters() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const channelFilter = document.getElementById('channelFilter').value;
    const campaignFilter = document.getElementById('campaignFilter').value;
    const adGroupFilter = document.getElementById('adGroupFilter').value;
    const creativeSelect = document.getElementById('creativeFilter');
    const selectedCreatives = Array.from(creativeSelect.selectedOptions).map(option => option.value);
    
    filteredData = rawData.filter(row => {
        // 날짜 필터 처리 (startDate와 endDate가 모두 있을 때만 적용)
        if (startDate && endDate) {
            const rowDate = parseDate(row.date);
            if (!rowDate) {
                // 날짜 파싱 실패 시 해당 행 제외
                console.warn(`날짜 파싱 실패: ${row.date}`);
                return false;
            }
            
            // 시간을 00:00:00으로 정규화
            rowDate.setHours(0, 0, 0, 0);
            
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            
            const end = new Date(endDate);
            end.setHours(0, 0, 0, 0);
            
            // 날짜 범위 체크
            if (rowDate < start || rowDate > end) return false;
        }
        
        if (channelFilter !== 'all' && row.channel !== channelFilter) return false;
        if (campaignFilter !== 'all' && row.campaign !== campaignFilter) return false;
        if (adGroupFilter !== 'all' && row['광고그룹 명'] !== adGroupFilter) return false;
        
        if (!selectedCreatives.includes('all') && selectedCreatives.length > 0) {
            if (!selectedCreatives.includes(row.creative)) return false;
        }
        
        return true;
    });
    
    updateDashboard();
    updateFilterStatus();
    updateCascadingFilters();  // 🆕 종속 필터 업데이트
}



// 종속 필터 업데이트
function updateCascadingFilters() {
    const channelFilter = document.getElementById('channelFilter').value;
    const campaignFilter = document.getElementById('campaignFilter').value;
    const adGroupFilter = document.getElementById('adGroupFilter').value;
    
    // 현재 필터 조건에 맞는 데이터 필터링
    let filteredForCascade = rawData;
    
    // 채널 필터 적용 시 캠페인/광고그룹/소재 옵션 업데이트
    if (channelFilter !== 'all') {
        filteredForCascade = filteredForCascade.filter(row => row.channel === channelFilter);
    }
    
    // 캠페인 필터 업데이트
    const availableCampaigns = [...new Set(filteredForCascade.map(row => row.campaign))].sort();
    updateFilterOptions('campaignFilter', availableCampaigns, campaignFilter);
    
    // 캠페인 필터 적용 시 광고그룹/소재 옵션 업데이트
    if (campaignFilter !== 'all') {
        filteredForCascade = filteredForCascade.filter(row => row.campaign === campaignFilter);
    }
    
    // 광고그룹 필터 업데이트
    const availableAdGroups = [...new Set(filteredForCascade.map(row => row['광고그룹 명']))].sort();
    updateFilterOptions('adGroupFilter', availableAdGroups, adGroupFilter);
    
    // 광고그룹 필터 적용 시 소재 옵션 업데이트
    if (adGroupFilter !== 'all') {
        filteredForCascade = filteredForCascade.filter(row => row['광고그룹 명'] === adGroupFilter);
    }
    
    // 소재 필터 업데이트
    const availableCreatives = [...new Set(filteredForCascade.map(row => row.creative))].sort();
    updateCreativeFilterOptions(availableCreatives);
}

// 필터 옵션 업데이트 (select)
function updateFilterOptions(filterId, availableOptions, currentValue) {
    const select = document.getElementById(filterId);
    const currentSelection = currentValue || select.value;
    
    // 기존 옵션 저장 (all 제외)
    const allOption = select.querySelector('option[value="all"]');
    
    // 옵션 재구성
    select.innerHTML = '';
    select.appendChild(allOption);
    
    availableOptions.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option;
        opt.textContent = option;
        select.appendChild(opt);
    });
    
    // 이전 선택값이 여전히 유효하면 복원, 아니면 'all'로 리셋
    if (currentSelection !== 'all' && availableOptions.includes(currentSelection)) {
        select.value = currentSelection;
    } else {
        select.value = 'all';
    }
}

// 소재 필터 옵션 업데이트 (multiple select)
function updateCreativeFilterOptions(availableCreatives) {
    const select = document.getElementById('creativeFilter');
    const currentSelections = Array.from(select.selectedOptions).map(opt => opt.value);
    
    // 기존 'all' 옵션 저장
    const allOption = select.querySelector('option[value="all"]');
    
    // 옵션 재구성
    select.innerHTML = '';
    select.appendChild(allOption);
    
    availableCreatives.forEach(creative => {
        const opt = document.createElement('option');
        opt.value = creative;
        opt.textContent = creative;
        select.appendChild(opt);
    });
    
    // 이전 선택값 복원 (유효한 것만)
    const validSelections = currentSelections.filter(sel => 
        sel === 'all' || availableCreatives.includes(sel)
    );
    
    if (validSelections.length === 0 || validSelections.includes('all')) {
        allOption.selected = true;
    } else {
        validSelections.forEach(sel => {
            const option = select.querySelector(`option[value="${sel}"]`);
            if (option) option.selected = true;
        });
    }
}

function resetFilters() {
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    document.getElementById('channelFilter').value = 'all';
    document.getElementById('campaignFilter').value = 'all';
    document.getElementById('adGroupFilter').value = 'all';
    
    const creativeSelect = document.getElementById('creativeFilter');
    Array.from(creativeSelect.options).forEach(option => {
        option.selected = option.value === 'all';
    });
    
    filteredData = [...rawData];
    updateDashboard();
    updateFilterStatus();
    updateCascadingFilters();  // 🆕 종속 필터 업데이트
}

function updateFilterStatus() {
    const statusDiv = document.getElementById('filterStatus');
    const tagsDiv = document.getElementById('filterTags');
    const filters = [];
    
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const channel = document.getElementById('channelFilter').value;
    const campaign = document.getElementById('campaignFilter').value;
    const adGroup = document.getElementById('adGroupFilter').value;
    const creativeSelect = document.getElementById('creativeFilter');
    const selectedCreatives = Array.from(creativeSelect.selectedOptions).map(option => option.textContent);
    
    if (startDate) filters.push(`시작: ${startDate}`);
    if (endDate) filters.push(`종료: ${endDate}`);
    if (channel !== 'all') filters.push(`채널: ${channel}`);
    if (campaign !== 'all') filters.push(`캠페인: ${campaign}`);
    if (adGroup !== 'all') filters.push(`광고그룹: ${adGroup}`);
    if (!selectedCreatives.includes('전체')) {
        filters.push(`소재: ${selectedCreatives.join(', ')}`);
    }
    
    if (filters.length > 0) {
        statusDiv.classList.add('active');
        tagsDiv.innerHTML = filters.map(f => `
            <div class="filter-tag">
                ${f}
                <span class="remove" onclick="resetFilters()">✕</span>
            </div>
        `).join('');
    } else {
        statusDiv.classList.remove('active');
    }
}

// 대시보드 업데이트
function updateDashboard() {
    updateKPIs();
    updateCostChart();
    updateRevenueChart();
    updateGalleries();
    updateChannelTop5();
    updateTable();
    adjustKPIFontSize();
}

function updateKPIs() {
    const totalImpressions = filteredData.reduce((sum, row) => sum + (row.impressions || 0), 0);
    const totalClicks = filteredData.reduce((sum, row) => sum + (row.clicks || 0), 0);
    const totalCost = filteredData.reduce((sum, row) => sum + (row.cost || 0), 0);
    const totalConversions = filteredData.reduce((sum, row) => sum + (row.conversions || 0), 0);
    const totalRevenue = filteredData.reduce((sum, row) => sum + (row.revenue || 0), 0);
    
    const avgCTR = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
    const avgCPC = totalClicks > 0 ? totalCost / totalClicks : 0;
    const avgCVR = totalClicks > 0 ? totalConversions / totalClicks : 0;
    const avgROAS = totalCost > 0 ? (totalRevenue / totalCost) * 100 : 0;
    
    document.getElementById('kpi-impressions').textContent = numberFormat(totalImpressions);
    document.getElementById('kpi-clicks').textContent = numberFormat(totalClicks);
    document.getElementById('kpi-ctr').textContent = percentFormat(avgCTR);
    document.getElementById('kpi-cpc').textContent = '₩' + numberFormat(Math.round(avgCPC));
    document.getElementById('kpi-cost').textContent = '₩' + numberFormat(totalCost);
    document.getElementById('kpi-conversions').textContent = numberFormat(totalConversions);
    document.getElementById('kpi-cvr').textContent = percentFormat(avgCVR);
    document.getElementById('kpi-revenue').textContent = '₩' + numberFormat(totalRevenue);
    document.getElementById('kpi-roas').textContent = avgROAS.toFixed(2) + '%';
}

function updateCostChart() {
    const costByChannel = {};
    filteredData.forEach(row => {
        const channel = row.channel || 'Unknown';
        const cost = row.cost || 0;
        costByChannel[channel] = (costByChannel[channel] || 0) + cost;
    });
    
    const channels = Object.keys(costByChannel);
    const costs = Object.values(costByChannel);
    const total = costs.reduce((a, b) => a + b, 0);
    
    const colorMap = {
        'GFA': '#EEFF33',
        '메타': '#1877F2',
        '구글': '#8B5CF6',
        '기타': '#999'
    };
    const colors = channels.map(ch => colorMap[ch] || '#999');
    
    const canvas = document.getElementById('costChart');
    const ctx = canvas.getContext('2d');
    if (window.costChartInstance) {
        window.costChartInstance.destroy();
    }
    
    window.costChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: channels,
            datasets: [{
                data: costs,
                backgroundColor: colors,
                borderWidth: 3,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const percent = ((value / total) * 100).toFixed(1);
                            return `${label}: ₩${numberFormat(value)} (${percent}%)`;
                        }
                    }
                }
            }
        }
    });
}

function updateRevenueChart() {
    const revenueByChannel = {};
    filteredData.forEach(row => {
        const channel = row.channel || 'Unknown';
        const revenue = row.revenue || 0;
        revenueByChannel[channel] = (revenueByChannel[channel] || 0) + revenue;
    });
    
    const channels = Object.keys(revenueByChannel);
    const revenues = Object.values(revenueByChannel);
    const total = revenues.reduce((a, b) => a + b, 0);
    
    const colorMap = {
        'GFA': '#EEFF33',
        '메타': '#1877F2',
        '구글': '#8B5CF6',
        '기타': '#999'
    };
    const colors = channels.map(ch => colorMap[ch] || '#999');
    
    const canvas = document.getElementById('revenueChart');
    const ctx = canvas.getContext('2d');
    if (window.revenueChartInstance) {
        window.revenueChartInstance.destroy();
    }
    
    window.revenueChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: channels,
            datasets: [{
                data: revenues,
                backgroundColor: colors,
                borderWidth: 3,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const percent = ((value / total) * 100).toFixed(1);
                            return `${label}: ₩${numberFormat(value)} (${percent}%)`;
                        }
                    }
                }
            }
        }
    });
}

function updateGalleries() {
    updateRevenueGallery();
    updateCTRGallery();
    updateCVRGallery();
}

function updateRevenueGallery() {
    const creativeData = {};
    filteredData.forEach(row => {
        const creative = row.creative;
        if (!base64Images[creative]) return;
        
        if (!creativeData[creative]) {
            creativeData[creative] = {
                revenue: 0,
                ctr: 0,
                cvr: 0,
                clicks: 0,
                impressions: 0,
                conversions: 0
            };
        }
        
        creativeData[creative].revenue += (row.revenue || 0);
        creativeData[creative].clicks += (row.clicks || 0);
        creativeData[creative].impressions += (row.impressions || 0);
        creativeData[creative].conversions += (row.conversions || 0);
    });
    
    Object.keys(creativeData).forEach(creative => {
        const data = creativeData[creative];
        data.ctr = data.impressions > 0 ? data.clicks / data.impressions : 0;
        data.cvr = data.clicks > 0 ? data.conversions / data.clicks : 0;
    });
    
    const top5 = Object.entries(creativeData)
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .slice(0, 5);
    
    const galleryHtml = top5.map(([creative, data]) => `
        <div class="gallery-item">
            <img class="gallery-image" src="${base64Images[creative]}" alt="${creative}">
            <div class="gallery-info">
                <div class="gallery-title">${creative}</div>
                <div class="gallery-stats">
                    <div class="stat">
                        <div class="stat-label">CTR</div>
                        <div class="stat-value">${percentFormat(data.ctr)}</div>
                    </div>
                    <div class="stat">
                        <div class="stat-label">CVR</div>
                        <div class="stat-value">${percentFormat(data.cvr)}</div>
                    </div>
                    <div class="stat">
                        <div class="stat-label">매출</div>
                        <div class="stat-value">₩${numberFormat(data.revenue)}</div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    document.getElementById('topRevenue').innerHTML = galleryHtml || '<p>데이터가 없습니다.</p>';
}

function updateCTRGallery() {
    const creativeData = {};
    filteredData.forEach(row => {
        const creative = row.creative;
        if (!base64Images[creative]) return;
        
        if (!creativeData[creative]) {
            creativeData[creative] = {
                revenue: 0,
                ctr: 0,
                cvr: 0,
                clicks: 0,
                impressions: 0,
                conversions: 0
            };
        }
        
        creativeData[creative].revenue += (row.revenue || 0);
        creativeData[creative].clicks += (row.clicks || 0);
        creativeData[creative].impressions += (row.impressions || 0);
        creativeData[creative].conversions += (row.conversions || 0);
    });
    
    Object.keys(creativeData).forEach(creative => {
        const data = creativeData[creative];
        data.ctr = data.impressions > 0 ? data.clicks / data.impressions : 0;
        data.cvr = data.clicks > 0 ? data.conversions / data.clicks : 0;
    });
    
    const top5 = Object.entries(creativeData)
        .sort((a, b) => b[1].ctr - a[1].ctr)
        .slice(0, 5);
    
    const galleryHtml = top5.map(([creative, data]) => `
        <div class="gallery-item">
            <img class="gallery-image" src="${base64Images[creative]}" alt="${creative}">
            <div class="gallery-info">
                <div class="gallery-title">${creative}</div>
                <div class="gallery-stats">
                    <div class="stat">
                        <div class="stat-label">CTR</div>
                        <div class="stat-value">${percentFormat(data.ctr)}</div>
                    </div>
                    <div class="stat">
                        <div class="stat-label">CVR</div>
                        <div class="stat-value">${percentFormat(data.cvr)}</div>
                    </div>
                    <div class="stat">
                        <div class="stat-label">매출</div>
                        <div class="stat-value">₩${numberFormat(data.revenue)}</div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    document.getElementById('topCTR').innerHTML = galleryHtml || '<p>데이터가 없습니다.</p>';
}

function updateCVRGallery() {
    const creativeData = {};
    filteredData.forEach(row => {
        const creative = row.creative;
        if (!base64Images[creative]) return;
        
        if (!creativeData[creative]) {
            creativeData[creative] = {
                revenue: 0,
                ctr: 0,
                cvr: 0,
                clicks: 0,
                impressions: 0,
                conversions: 0
            };
        }
        
        creativeData[creative].revenue += (row.revenue || 0);
        creativeData[creative].clicks += (row.clicks || 0);
        creativeData[creative].impressions += (row.impressions || 0);
        creativeData[creative].conversions += (row.conversions || 0);
    });
    
    Object.keys(creativeData).forEach(creative => {
        const data = creativeData[creative];
        data.ctr = data.impressions > 0 ? data.clicks / data.impressions : 0;
        data.cvr = data.clicks > 0 ? data.conversions / data.clicks : 0;
    });
    
    const top5 = Object.entries(creativeData)
        .sort((a, b) => b[1].cvr - a[1].cvr)
        .slice(0, 5);
    
    const galleryHtml = top5.map(([creative, data]) => `
        <div class="gallery-item">
            <img class="gallery-image" src="${base64Images[creative]}" alt="${creative}">
            <div class="gallery-info">
                <div class="gallery-title">${creative}</div>
                <div class="gallery-stats">
                    <div class="stat">
                        <div class="stat-label">CTR</div>
                        <div class="stat-value">${percentFormat(data.ctr)}</div>
                    </div>
                    <div class="stat">
                        <div class="stat-label">CVR</div>
                        <div class="stat-value">${percentFormat(data.cvr)}</div>
                    </div>
                    <div class="stat">
                        <div class="stat-label">매출</div>
                        <div class="stat-value">₩${numberFormat(data.revenue)}</div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    document.getElementById('topCVR').innerHTML = galleryHtml || '<p>데이터가 없습니다.</p>';
}

function updateTable() {
    const aggregated = {};
    
    filteredData.forEach(row => {
        const key = `${row.creative}|${row.channel}|${row.campaign}|${row['광고그룹 명']}`;
        
        if (!aggregated[key]) {
            aggregated[key] = {
                creative: row.creative,
                channel: row.channel,
                campaign: row.campaign,
                adGroup: row['광고그룹 명'],
                impressions: 0,
                clicks: 0,
                cost: 0,
                conversions: 0,
                revenue: 0
            };
        }
        
        aggregated[key].impressions += (row.impressions || 0);
        aggregated[key].clicks += (row.clicks || 0);
        aggregated[key].cost += (row.cost || 0);
        aggregated[key].conversions += (row.conversions || 0);
        aggregated[key].revenue += (row.revenue || 0);
    });
    
    let tableData = Object.values(aggregated).map(item => {
        const ctr = item.impressions > 0 ? item.clicks / item.impressions : 0;
        const cpc = item.clicks > 0 ? item.cost / item.clicks : 0;
        const cvr = item.clicks > 0 ? item.conversions / item.clicks : 0;
        const roas = item.cost > 0 ? (item.revenue / item.cost) * 100 : 0;
        
        return {
            ...item,
            ctr: ctr,
            cpc: cpc,
            cvr: cvr,
            roas: roas
        };
    });
    
    const searchTerm = document.getElementById('tableSearchInput').value.toLowerCase();
    if (searchTerm) {
        tableData = tableData.filter(item => 
            item.creative.toLowerCase().includes(searchTerm) ||
            item.channel.toLowerCase().includes(searchTerm) ||
            item.campaign.toLowerCase().includes(searchTerm) ||
            item.adGroup.toLowerCase().includes(searchTerm)
        );
    }
    
    tableData = sortTableData(tableData, currentSort.column, currentSort.order);
    
    tableData.forEach((item, index) => {
        item.rank = index + 1;
    });
    
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = tableData.map(item => {
        const roasClass = item.roas > 100 ? 'roas-high' : (item.roas === 0 ? 'roas-low' : 'roas-medium');
        
        let channelClass = '';
        if (item.channel === 'GFA') channelClass = 'badge-GFA';
        else if (item.channel === '메타') channelClass = 'badge-메타';
        else if (item.channel === '구글') channelClass = 'badge-구글';
        
        const imgSrc = base64Images[item.creative] || '';
        
        return `
            <tr>
                <td class="number">${item.rank}</td>
                <td>${imgSrc ? `<img class="thumbnail" src="${imgSrc}" alt="${item.creative}">` : ''}</td>
                <td>${item.creative}</td>
                <td><span class="channel-badge ${channelClass}">${item.channel}</span></td>
                <td>${item.campaign}</td>
                <td>${item.adGroup}</td>
                <td class="number">${numberFormat(item.impressions)}</td>
                <td class="number">${numberFormat(item.clicks)}</td>
                <td class="number">${percentFormat(item.ctr)}</td>
                <td class="number">₩${numberFormat(Math.round(item.cpc))}</td>
                <td class="number">₩${numberFormat(item.cost)}</td>
                <td class="number">${numberFormat(item.conversions)}</td>
                <td class="number">${percentFormat(item.cvr)}</td>
                <td class="number">₩${numberFormat(item.revenue)}</td>
                <td class="number ${roasClass}">${item.roas.toFixed(2)}%</td>
            </tr>
        `;
    }).join('');
    
    document.getElementById('tableCount').textContent = numberFormat(tableData.length);
}

// 정렬
function sortTable(column) {
    if (currentSort.column === column) {
        if (currentSort.order === 'desc') {
            currentSort.order = 'asc';
        } else if (currentSort.order === 'asc') {
            currentSort.column = 'revenue';
            currentSort.order = 'desc';
        } else {
            currentSort.order = 'desc';
        }
    } else {
        currentSort.column = column;
        currentSort.order = 'desc';
    }
    
    updateTable();
    updateSortIndicators();
}

function sortTableData(data, column, order) {
    const sorted = [...data];
    
    sorted.sort((a, b) => {
        let aVal = a[column];
        let bVal = b[column];
        
        if (typeof aVal === 'string') {
            return order === 'desc' ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
        }
        
        return order === 'desc' ? bVal - aVal : aVal - bVal;
    });
    
    return sorted;
}

function updateSortIndicators() {
    document.querySelectorAll('th').forEach(th => {
        th.classList.remove('sorted');
        const icon = th.querySelector('.sort-icon');
        if (icon) {
            icon.textContent = '▼';
            icon.style.opacity = '0.5';
        }
    });
    
    const columnMap = {
        'rank': 0,
        'creative': 2,
        'channel': 3,
        'campaign': 4,
        'adGroup': 5,
        'impressions': 6,
        'clicks': 7,
        'ctr': 8,
        'cpc': 9,
        'cost': 10,
        'conversions': 11,
        'cvr': 12,
        'revenue': 13,
        'roas': 14
    };
    
    const thIndex = columnMap[currentSort.column];
    if (thIndex !== undefined) {
        const ths = document.querySelectorAll('th');
        const th = ths[thIndex];
        if (th) {
            th.classList.add('sorted');
            const icon = th.querySelector('.sort-icon');
            if (icon) {
                icon.textContent = currentSort.order === 'desc' ? '▼' : '▲';
                icon.style.opacity = '1';
            }
        }
    }
}

// 테이블 검색
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('tableSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', updateTable);
    }
});

// 필터 초기화
function initFilters() {
    // 날짜 필터 초기화 (데이터의 최소/최대 날짜로 설정)
    const validDates = rawData
        .map(r => ({ dateStr: r.date, dateObj: parseDate(r.date) }))
        .filter(d => d.dateObj !== null);  // 유효한 날짜만 필터링
    
    if (validDates.length > 0) {
        // 날짜 객체로 비교하여 최소/최대 찾기
        const minDateObj = validDates.reduce((a, b) => a.dateObj < b.dateObj ? a : b);
        const maxDateObj = validDates.reduce((a, b) => a.dateObj > b.dateObj ? a : b);
        
        // YYYY-MM-DD 형식으로 변환
        const minDateStr = formatDateToYYYYMMDD(minDateObj.dateObj);
        const maxDateStr = formatDateToYYYYMMDD(maxDateObj.dateObj);
        
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');
        
        if (startDateInput) startDateInput.value = minDateStr;
        if (endDateInput) endDateInput.value = maxDateStr;
        
        console.log(`📅 날짜 필터 초기화: ${minDateStr} ~ ${maxDateStr}`);
        console.log(`   유효한 날짜: ${validDates.length}/${rawData.length}개`);
    } else {
        console.warn('⚠️ 유효한 날짜 데이터가 없습니다');
    }
    
    const channels = [...new Set(rawData.map(r => r.channel))].sort();
    const channelSelect = document.getElementById('channelFilter');
    channelSelect.innerHTML = '<option value="all">전체</option>';
    channels.forEach(channel => {
        const option = document.createElement('option');
        option.value = channel;
        option.textContent = channel;
        channelSelect.appendChild(option);
    });
    
    const campaigns = [...new Set(rawData.map(r => r.campaign))].sort();
    const campaignSelect = document.getElementById('campaignFilter');
    campaignSelect.innerHTML = '<option value="all">전체</option>';
    campaigns.forEach(campaign => {
        const option = document.createElement('option');
        option.value = campaign;
        option.textContent = campaign;
        campaignSelect.appendChild(option);
    });
    
    const adGroups = [...new Set(rawData.map(r => r['광고그룹 명']))].sort();
    const adGroupSelect = document.getElementById('adGroupFilter');
    adGroupSelect.innerHTML = '<option value="all">전체</option>';
    adGroups.forEach(adGroup => {
        const option = document.createElement('option');
        option.value = adGroup;
        option.textContent = adGroup;
        adGroupSelect.appendChild(option);
    });
    
    const creatives = [...new Set(rawData.map(r => r.creative))].sort();
    const creativeSelect = document.getElementById('creativeFilter');
    creativeSelect.innerHTML = '<option value="all" selected>전체</option>';
    creatives.forEach(creative => {
        const option = document.createElement('option');
        option.value = creative;
        option.textContent = creative;
        creativeSelect.appendChild(option);
    });
}



// ============================================================
// 채널별 Top 5 기능 추가 (v15.4)
// ============================================================

// 채널별 Top 5 데이터 계산
function calculateChannelTop5(data, channel = null) {
    // 채널 필터링
    const channelData = channel && channel !== '전체' 
        ? data.filter(item => item.channel === channel)
        : data;
    
    if (channelData.length === 0) {
        return {
            byRevenue: [],
            byCTR: [],
            byCVR: []
        };
    }
    
    // 소재별 집계
    const aggregated = {};
    channelData.forEach(item => {
        const key = item.creative;
        if (!aggregated[key]) {
            aggregated[key] = {
                creative: key,
                channel: item.channel,
                impressions: 0,
                clicks: 0,
                cost: 0,
                conversions: 0,
                revenue: 0
            };
        }
        aggregated[key].impressions += item.impressions;
        aggregated[key].clicks += item.clicks;
        aggregated[key].cost += item.cost;
        aggregated[key].conversions += item.conversions;
        aggregated[key].revenue += item.revenue;
    });
    
    // 계산된 지표 추가
    const calculated = Object.values(aggregated).map(item => ({
        ...item,
        ctr: item.impressions > 0 ? (item.clicks / item.impressions) * 100 : 0,
        cvr: item.clicks > 0 ? (item.conversions / item.clicks) * 100 : 0,
        roas: item.cost > 0 ? (item.revenue / item.cost) * 100 : 0
    }));
    
    // Top 5 추출
    const byRevenue = [...calculated]
        .filter(item => item.revenue > 0)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
    
    const byCTR = [...calculated]
        .filter(item => item.ctr > 0)
        .sort((a, b) => b.ctr - a.ctr)
        .slice(0, 5);
    
    const byCVR = [...calculated]
        .filter(item => item.cvr > 0)
        .sort((a, b) => b.cvr - a.cvr)
        .slice(0, 5);
    
    return { byRevenue, byCTR, byCVR };
}

// Top 5 갤러리 업데이트 함수
function updateTop5Galleries(top5Data) {
    const sections = [
        { id: 'topRevenueGallery', data: top5Data.byRevenue, metric: 'revenue', label: '매출' },
        { id: 'topCTRGallery', data: top5Data.byCTR, metric: 'ctr', label: 'CTR' },
        { id: 'topCVRGallery', data: top5Data.byCVR, metric: 'cvr', label: 'CVR' }
    ];
    
    sections.forEach(section => {
        const container = document.getElementById(section.id);
        if (!container) return;
        
        container.innerHTML = '';
        
        if (section.data.length === 0) {
            container.innerHTML = '<p class="no-data">데이터가 없습니다</p>';
            return;
        }
        
        section.data.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'top-item';
            
            const rank = document.createElement('div');
            rank.className = 'rank';
            rank.textContent = `#${index + 1}`;
            
            const thumbnail = document.createElement('div');
            thumbnail.className = 'thumbnail';
            const imageData = base64Images[item.creative];
            if (imageData) {
                const img = document.createElement('img');
                img.src = imageData;
                img.alt = item.creative;
                thumbnail.appendChild(img);
            } else {
                thumbnail.innerHTML = '<div class="no-image">이미지 없음</div>';
            }
            
            const info = document.createElement('div');
            info.className = 'info';
            
            const creativeName = document.createElement('div');
            creativeName.className = 'creative-name';
            creativeName.textContent = item.creative;
            creativeName.title = item.creative;
            
            const metricValue = document.createElement('div');
            metricValue.className = 'metric-value';
            
            let displayValue = '';
            if (section.metric === 'revenue') {
                displayValue = `₩${item.revenue.toLocaleString()}`;
            } else if (section.metric === 'ctr') {
                displayValue = `${item.ctr.toFixed(2)}%`;
            } else if (section.metric === 'cvr') {
                displayValue = `${item.cvr.toFixed(2)}%`;
            }
            metricValue.textContent = displayValue;
            
            info.appendChild(creativeName);
            info.appendChild(metricValue);
            
            card.appendChild(rank);
            card.appendChild(thumbnail);
            card.appendChild(info);
            
            container.appendChild(card);
        });
    });
}



// 채널 필터 변경 시 Top 5 업데이트
function updateChannelTop5() {
    const selectedChannel = document.getElementById('channelFilter')?.value;
    const channel = selectedChannel === 'all' ? null : selectedChannel;
    const top5Data = calculateChannelTop5(filteredData, channel);
    updateTop5Galleries(top5Data);
}
