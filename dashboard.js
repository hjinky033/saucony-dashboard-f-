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
    
    // 끝의 점이나 하이픈 제거
    dateStr = dateStr.trim().replace(/[.-]+$/, '');
    
    // 하이픈 구분 (2026-02-05)
    if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        }
    }
    
    // 점 구분 (2026.02.05)
    if (dateStr.includes('.')) {
        const parts = dateStr.split('.');
        if (parts.length >= 3) {
            return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        }
    }
    
    return null;
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
        if (startDate || endDate) {
            const rowDate = parseDate(row.date);
            if (!rowDate) return false;
            
            if (startDate) {
                const start = new Date(startDate);
                if (rowDate < start) return false;
            }
            
            if (endDate) {
                const end = new Date(endDate);
                if (rowDate > end) return false;
            }
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
    updateGalleries();
    updateChannelTop5();
    updateTable();
    adjustKPIFontSize();
}

function updateKPIs() {
    const totalImpressions = filteredData.reduce((sum, row) => sum + (row.impressions || 0), 0);
    const totalClicks = filteredData.reduce((sum, row) => sum + (row.clicks || 0), 0);
    const totalConversions = filteredData.reduce((sum, row) => sum + (row.conversions || 0), 0);
    const totalRevenue = filteredData.reduce((sum, row) => sum + (row.revenue || 0), 0);
    const avgCTR = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
    const avgCVR = totalClicks > 0 ? totalConversions / totalClicks : 0;
    
    document.getElementById('kpi-impressions').textContent = numberFormat(totalImpressions);
    document.getElementById('kpi-clicks').textContent = numberFormat(totalClicks);
    document.getElementById('kpi-ctr').textContent = percentFormat(avgCTR);
    document.getElementById('kpi-conversions').textContent = numberFormat(totalConversions);
    document.getElementById('kpi-cvr').textContent = percentFormat(avgCVR);
    document.getElementById('kpi-revenue').textContent = '₩' + numberFormat(totalRevenue);
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
    
    const colorMap = {
        'GFA': '#EEFF33',
        '네이버': '#03C75A',
        '메타': '#1877F2',
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
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
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
        const cvr = item.clicks > 0 ? item.conversions / item.clicks : 0;
        const roas = item.cost > 0 ? (item.revenue / item.cost) * 100 : 0;
        
        return {
            ...item,
            ctr: ctr,
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
        const channelClass = `badge-${item.channel}`;
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
        'cost': 9,
        'conversions': 10,
        'cvr': 11,
        'revenue': 12,
        'roas': 13
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
