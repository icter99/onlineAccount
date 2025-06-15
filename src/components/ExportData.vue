<template>
    <div class="export-panel">
        <div class="export-header">
            <h3>数据导出</h3>
            <div class="current-data-info">
                <span class="current-count">当前筛选：{{ filteredRecords.length }} 条记录</span>
                <span v-if="isFiltered" class="filter-status">已筛选</span>
            </div>
        </div>

        <div class="export-options">
            <div class="option-group">
                <label>导出格式:</label>
                <select v-model="exportFormat">
                    <option value="csv">CSV格式</option>
                    <option value="json">JSON格式</option>
                </select>
            </div>

            <div class="option-group">
                <label>导出范围:</label>
                <select v-model="exportScope">
                    <option value="current">当前筛选结果</option>
                    <option value="all">全部记录</option>
                    <option value="custom">自定义筛选</option>
                </select>
            </div>

            <!-- 自定义筛选选项 -->
            <div v-if="exportScope === 'custom'" class="custom-filters">
                <div class="option-group">
                    <label>时间范围:</label>
                    <select v-model="timeRange">
                        <option value="all">全部记录</option>
                        <option value="thisMonth">本月</option>
                        <option value="lastMonth">上月</option>
                        <option value="thisYear">今年</option>
                        <option value="dateRange">指定日期</option>
                    </select>
                </div>

                <div v-if="timeRange === 'dateRange'" class="date-range">
                    <div class="option-group">
                        <label>开始日期:</label>
                        <input v-model="customStartDate" type="date">
                    </div>
                    <div class="option-group">
                        <label>结束日期:</label>
                        <input v-model="customEndDate" type="date">
                    </div>
                </div>

                <div class="option-group">
                    <label>记录类型:</label>
                    <select v-model="recordType">
                        <option value="all">全部</option>
                        <option value="收入">仅收入</option>
                        <option value="支出">仅支出</option>
                    </select>
                </div>
            </div>
        </div>

        <div class="export-info">
            <p>将导出 <strong>{{ finalExportRecords.length }}</strong> 条记录</p>
        </div>

        <div class="export-actions">
            <button @click="exportData" class="export-btn" :disabled="finalExportRecords.length === 0">
                <span class="icon">📄</span>
                导出数据
            </button>
            <button @click="importData" class="import-btn">
                <span class="icon">📁</span>
                导入数据
            </button>
        </div>

        <!-- 隐藏的文件输入 -->
        <input ref="fileInput" type="file" accept=".json,.csv" @change="handleFileImport" style="display: none">
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAccountStore } from '@/stores/accountStore';

const props = defineProps({
    filteredRecords: {
        type: Array,
        default: () => []
    }
});

const accountStore = useAccountStore();

// 导出选项
const exportFormat = ref('csv');
const exportScope = ref('current');
const timeRange = ref('all');
const recordType = ref('all');
const customStartDate = ref('');
const customEndDate = ref('');

// 文件输入引用
const fileInput = ref(null);

// 判断是否处于筛选状态
const isFiltered = computed(() => {
    return props.filteredRecords.length !== accountStore.records.length;
});

// 根据导出范围获取基础记录
const baseRecords = computed(() => {
    switch (exportScope.value) {
        case 'current':
            return props.filteredRecords;
        case 'all':
            return accountStore.records;
        case 'custom':
            return accountStore.records;
        default:
            return props.filteredRecords;
    }
});

// 自定义筛选记录（仅在exportScope为custom时生效）
const customFilteredRecords = computed(() => {
    if (exportScope.value !== 'custom') {
        return baseRecords.value;
    }

    let records = [...accountStore.records];

    // 类型筛选
    if (recordType.value !== 'all') {
        records = records.filter(r => r.type === recordType.value);
    }

    // 时间范围筛选
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    switch (timeRange.value) {
        case 'thisMonth':
            const thisMonthStart = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
            const thisMonthEnd = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];
            records = records.filter(r => r.date >= thisMonthStart && r.date <= thisMonthEnd);
            break;

        case 'lastMonth':
            const lastMonthStart = new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0];
            const lastMonthEnd = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];
            records = records.filter(r => r.date >= lastMonthStart && r.date <= lastMonthEnd);
            break;

        case 'thisYear':
            const yearStart = `${currentYear}-01-01`;
            const yearEnd = `${currentYear}-12-31`;
            records = records.filter(r => r.date >= yearStart && r.date <= yearEnd);
            break;

        case 'dateRange':
            if (customStartDate.value) {
                records = records.filter(r => r.date >= customStartDate.value);
            }
            if (customEndDate.value) {
                records = records.filter(r => r.date <= customEndDate.value);
            }
            break;
    }

    return records.sort((a, b) => new Date(a.date) - new Date(b.date));
});

// 最终导出的记录
const finalExportRecords = computed(() => {
    return customFilteredRecords.value;
});

// 导出为CSV
const exportToCSV = (records) => {
    const headers = ['ID', '类型', '金额', '分类', '日期', '备注'];
    const csvContent = [
        headers.join(','),
        ...records.map(record => [
            record.id,
            record.type,
            record.amount,
            record.category,
            record.date,
            `"${record.note || ''}"`
        ].join(','))
    ].join('\n');

    // 添加BOM以支持中文
    const BOM = '\uFEFF';
    return BOM + csvContent;
};

// 导出为JSON
const exportToJSON = (records) => {
    const exportData = {
        exportDate: new Date().toISOString(),
        exportScope: exportScope.value,
        totalRecords: records.length,
        records: records
    };
    return JSON.stringify(exportData, null, 2);
};

// 下载文件
const downloadFile = (content, filename, contentType) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

// 导出数据
const exportData = () => {
    if (finalExportRecords.value.length === 0) {
        alert('没有可导出的记录');
        return;
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const scopeStr = exportScope.value === 'current' ? '筛选' :
        exportScope.value === 'all' ? '全部' : '自定义';

    if (exportFormat.value === 'csv') {
        const csvContent = exportToCSV(finalExportRecords.value);
        downloadFile(csvContent, `记账数据_${scopeStr}_${dateStr}.csv`, 'text/csv;charset=utf-8');
    } else {
        const jsonContent = exportToJSON(finalExportRecords.value);
        downloadFile(jsonContent, `记账数据_${scopeStr}_${dateStr}.json`, 'application/json');
    }

    alert(`成功导出 ${finalExportRecords.value.length} 条记录！`);
};

// 导入数据
const importData = () => {
    fileInput.value.click();
};

// 处理文件导入
const handleFileImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const text = await file.text();
        let importedRecords = [];

        if (file.name.endsWith('.json')) {
            const data = JSON.parse(text);
            importedRecords = data.records || data;
        } else if (file.name.endsWith('.csv')) {
            const lines = text.split('\n');
            const headers = lines[0].split(',');

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                const values = line.split(',');
                if (values.length >= 5) {
                    importedRecords.push({
                        id: parseInt(values[0]) || Date.now() + i,
                        type: values[1].trim(),
                        amount: parseFloat(values[2]) || 0,
                        category: values[3].trim(),
                        date: values[4].trim(),
                        note: values[5] ? values[5].replace(/"/g, '').trim() : ''
                    });
                }
            }
        }

        if (importedRecords.length === 0) {
            alert('文件中没有找到有效的记录数据');
            return;
        }

        // 确认导入
        const confirmImport = confirm(`找到 ${importedRecords.length} 条记录，确定要导入吗？\n注意：这将添加到现有数据中，不会覆盖现有记录。`);

        if (confirmImport) {
            // 确保ID唯一性
            const existingIds = new Set(accountStore.records.map(r => r.id));
            importedRecords.forEach(record => {
                if (existingIds.has(record.id)) {
                    record.id = Date.now() + Math.random();
                }
                accountStore.addRecord(record);
            });

            alert(`成功导入 ${importedRecords.length} 条记录！`);
        }

    } catch (error) {
        console.error('导入失败:', error);
        alert('文件格式错误，导入失败！请检查文件格式。');
    }

    // 清空文件输入
    event.target.value = '';
};
</script>

<style scoped>
.export-panel {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
}

.export-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.export-header h3 {
    margin: 0;
    color: #333;
    border-bottom: 2px solid #007bff;
    padding-bottom: 8px;
}

.current-data-info {
    display: flex;
    gap: 10px;
    align-items: center;
}

.current-count {
    color: #666;
    font-size: 14px;
}

.filter-status {
    background: #007bff;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
}

.export-options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin-bottom: 20px;
}

.custom-filters {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    padding: 15px;
    background: white;
    border-radius: 4px;
    border: 1px solid #e9ecef;
}

.option-group {
    display: flex;
    flex-direction: column;
}

.option-group label {
    margin-bottom: 5px;
    font-weight: 500;
    color: #333;
    font-size: 14px;
}

.option-group select,
.option-group input {
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
}

.date-range {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
}

.export-info {
    background: white;
    padding: 15px;
    border-radius: 4px;
    margin-bottom: 20px;
    text-align: center;
    border: 1px solid #e9ecef;
}

.export-info p {
    margin: 0;
    color: #666;
}

.export-actions {
    display: flex;
    gap: 15px;
    justify-content: center;
}

.export-btn,
.import-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 16px;
    font-weight: 500;
    transition: all 0.3s ease;
}

.export-btn {
    background: linear-gradient(135deg, #28a745, #20c997);
    color: white;
}

.export-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #218838, #1ac88a);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
}

.export-btn:disabled {
    background: #6c757d;
    cursor: not-allowed;
    transform: none;
}

.import-btn {
    background: linear-gradient(135deg, #007bff, #0056b3);
    color: white;
}

.import-btn:hover {
    background: linear-gradient(135deg, #0056b3, #004085);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
}

.icon {
    font-size: 18px;
}

@media (max-width: 768px) {
    .export-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
    }

    .export-options {
        grid-template-columns: 1fr;
    }

    .custom-filters {
        grid-template-columns: 1fr;
    }

    .date-range {
        grid-template-columns: 1fr;
    }

    .export-actions {
        flex-direction: column;
    }

    .export-btn,
    .import-btn {
        width: 100%;
        justify-content: center;
    }
}
</style>