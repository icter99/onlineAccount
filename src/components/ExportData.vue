<template>
    <div class="export-panel">
        <h3>数据导出</h3>
        <div class="export-options">
            <div class="export-group">
                <label>导出格式</label>
                <select v-model="exportFormat">
                    <option value="csv">CSV格式</option>
                    <option value="json">JSON格式</option>
                    <option value="excel">Excel格式</option>
                </select>
            </div>
            <div class="export-group">
                <label>导出范围</label>
                <select v-model="exportScope">
                    <option value="current">当前筛选结果</option>
                    <option value="all">所有记录</option>
                </select>
            </div>
        </div>
        <div class="export-actions">
            <button @click="handleExport" class="export-btn">导出数据</button>
            <div class="export-info">
                <span class="record-count">共 {{ exportData.length }} 条记录</span>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAccountStore } from '@/stores/accountStore';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const props = defineProps({
    filteredRecords: {
        type: Array,
        required: true
    }
});

const accountStore = useAccountStore();
const exportFormat = ref('excel');
const exportScope = ref('current');

// 获取要导出的数据
const exportData = computed(() => {
    return exportScope.value === 'current' ? props.filteredRecords : accountStore.records;
});

// 导出为CSV
const exportToCSV = (data) => {
    const headers = ['类型', '金额', '分类', '日期', '备注'];
    const rows = data.map(record => [
        record.type,
        record.amount,
        record.category,
        record.date,
        record.note || ''
    ]);
    return [headers, ...rows].map(row => row.join(',')).join('\n');
};

// 导出为JSON
const exportToJSON = (data) => {
    return JSON.stringify(data, null, 2);
};

// 导出为Excel
const exportToExcel = (data) => {
    // 准备数据
    const exportData = data.map(record => ({
        '类型': record.type,
        '金额': record.amount,
        '分类': record.category,
        '日期': record.date,
        '备注': record.note || ''
    }));

    // 创建工作簿
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // 设置列宽
    const colWidths = [
        { wch: 10 }, // 类型
        { wch: 12 }, // 金额
        { wch: 12 }, // 分类
        { wch: 12 }, // 日期
        { wch: 20 }  // 备注
    ];
    ws['!cols'] = colWidths;

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(wb, ws, '记账数据');

    // 导出文件
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, `记账数据_${new Date().toLocaleDateString()}.xlsx`);
};

// 下载文件
const downloadFile = (content, fileName, type) => {
    const blob = new Blob([content], { type });
    saveAs(blob, fileName);
};

// 处理导出
const handleExport = () => {
    const dateStr = new Date().toLocaleDateString();
    const scopeStr = exportScope.value === 'current' ? '筛选' : '全部';

    if (exportFormat.value === 'csv') {
        const csvContent = exportToCSV(exportData.value);
        downloadFile(csvContent, `记账数据_${scopeStr}_${dateStr}.csv`, 'text/csv;charset=utf-8');
    } else if (exportFormat.value === 'json') {
        const jsonContent = exportToJSON(exportData.value);
        downloadFile(jsonContent, `记账数据_${scopeStr}_${dateStr}.json`, 'application/json');
    } else if (exportFormat.value === 'excel') {
        exportToExcel(exportData.value);
    }
};
</script>

<style scoped>
.export-panel {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.export-panel h3 {
    margin: 0 0 15px 0;
    color: #2c3e50;
}

.export-options {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
    margin-bottom: 20px;
}

.export-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.export-group label {
    font-weight: 500;
    color: #2c3e50;
    font-size: 0.95rem;
}

.export-group select {
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background-color: white;
    font-size: 0.95rem;
}

.export-actions {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
}

.export-info {
    color: #666;
    font-size: 0.95rem;
}

.record-count {
    font-weight: 500;
}

.export-btn {
    background: #42b883;
    color: white;
    padding: 8px 24px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s;
    font-size: 0.95rem;
    min-width: 120px;
}

.export-btn:hover {
    background: #359268;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.export-btn:active {
    transform: translateY(0);
}

@media (max-width: 768px) {
    .export-options {
        grid-template-columns: 1fr;
    }

    .export-actions {
        flex-direction: column;
        gap: 10px;
    }

    .export-info {
        text-align: center;
    }
}
</style>