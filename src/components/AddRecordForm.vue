<template>
    <div class="form-container">
        <h2>添加新记录</h2>
        <form @submit.prevent="handleSubmit">
            <!-- 类型选择 -->
            <div class="form-group">
                <label>类型</label>
                <select v-model="newRecord.type">
                    <option value="支出">支出</option>
                    <option value="收入">收入</option>
                </select>
            </div>

            <!-- 金额输入 -->
            <div class="form-group">
                <label>金额</label>
                <input v-model.number="newRecord.amount" type="number" step="0.01" placeholder="请输入金额" required>
            </div>

            <!-- 分类选择 -->
            <div class="form-group">
                <label>分类</label>
                <select v-model="newRecord.category">
                    <option v-for="cat in currentCategories" :key="cat" :value="cat">{{ cat }}</option>
                </select>
            </div>

            <!-- 日期选择 -->
            <div class="form-group">
                <label>日期</label>
                <input v-model="newRecord.date" type="date" :max="new Date().toISOString().split('T')[0]">
            </div>

            <!-- 备注输入 -->
            <div class="form-group">
                <label>备注</label>
                <input v-model="newRecord.note" type="text" placeholder="备注信息">
            </div>

            <button type="submit" class="submit-btn">提交</button>
        </form>

        <!-- 导入功能 -->
        <div class="import-section">
            <div class="import-actions">
                <input type="file" ref="fileInput" accept=".xlsx,.xls" @change="handleFileImport" style="display: none">
                <button @click="triggerFileInput" class="import-btn">导入数据</button>
                <button @click="downloadTemplate" class="template-btn">下载模板</button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useAccountStore } from '@/stores/accountStore';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// 定义emit事件
const emit = defineEmits(['record-added']);

const accountStore = useAccountStore();

// 扩展分类选项
const categories = {
    '支出': ['餐饮', '交通', '购物', '娱乐', '医疗', '教育', '住房', '通讯', '服装', '日用品', '其他'],
    '收入': ['工资', '奖金', '投资', '兼职', '礼金', '退款', '其他']
};

const newRecord = ref({
    type: '支出',
    amount: null,
    category: '餐饮',
    date: new Date().toISOString().split('T')[0],
    note: ''
});

// 获取当前类型对应的分类选项
const currentCategories = computed(() => {
    return categories[newRecord.value.type] || categories['支出'];
});

// 监听类型变化，自动切换默认分类
watch(() => newRecord.value.type, (newType) => {
    const availableCategories = categories[newType] || categories['支出'];
    newRecord.value.category = availableCategories[0];
});

const handleSubmit = () => {
    if (newRecord.value.amount <= 0) {
        alert('金额必须大于 0');
        return;
    }
    accountStore.addRecord(newRecord.value);

    // 显示成功提示
    const typeText = newRecord.value.type;
    const amountText = newRecord.value.amount.toFixed(2);
    alert(`✅ ${typeText}记录添加成功！金额：¥${amountText}`);

    // 触发事件通知父组件
    emit('record-added');

    // 重置表单，但保留日期
    const currentDate = newRecord.value.date;
    newRecord.value = {
        type: '支出',
        amount: null,
        category: '餐饮',
        date: currentDate,
        note: ''
    };
};

const fileInput = ref(null);

// 触发文件选择
const triggerFileInput = () => {
    fileInput.value.click();
};

// 处理文件导入
const handleFileImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // 验证数据格式
        const requiredFields = ['type', 'amount', 'category', 'date', 'note'];
        const isValid = jsonData.every(row => {
            return requiredFields.every(field => field in row);
        });

        if (!isValid) {
            alert('导入的文件格式不正确，请使用正确的模板文件。');
            return;
        }

        // 处理导入的数据
        const processedData = jsonData.map(row => {
            // 处理日期格式
            let dateStr;
            if (typeof row.date === 'number') {
                // Excel 日期是从 1900-01-01 开始的天数
                const excelDate = new Date((row.date - 25569) * 86400 * 1000);
                dateStr = excelDate.toISOString().split('T')[0];
            } else if (typeof row.date === 'string') {
                // 尝试解析日期字符串
                const date = new Date(row.date);
                if (!isNaN(date.getTime())) {
                    dateStr = date.toISOString().split('T')[0];
                } else {
                    // 如果解析失败，使用当前日期
                    dateStr = new Date().toISOString().split('T')[0];
                }
            } else {
                // 如果日期无效，使用当前日期
                dateStr = new Date().toISOString().split('T')[0];
            }

            // 为每条记录生成唯一ID
            const uniqueId = Date.now() + Math.random().toString(36).substr(2, 9);

            return {
                id: uniqueId,
                type: row.type || '支出',
                amount: Number(row.amount) || 0,
                category: row.category || '其他',
                date: dateStr,
                note: row.note || ''
            };
        });

        // 添加记录
        processedData.forEach(record => {
            accountStore.addRecord(record);
        });

        alert(`成功导入 ${processedData.length} 条记录`);
        event.target.value = ''; // 清空文件输入
    } catch (error) {
        console.error('导入失败:', error);
        alert('导入失败，请检查文件格式是否正确。');
    }
};

// 下载模板
const downloadTemplate = () => {
    // 创建示例数据
    const templateData = [
        {
            type: '支出',
            amount: 100.00,
            category: '餐饮',
            date: new Date().toISOString().split('T')[0],
            note: '示例备注'
        },
        {
            type: '收入',
            amount: 5000.00,
            category: '工资',
            date: new Date().toISOString().split('T')[0],
            note: '示例备注'
        }
    ];

    // 创建工作簿
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);

    // 设置列宽
    const colWidths = [
        { wch: 10 }, // type
        { wch: 15 }, // amount
        { wch: 15 }, // category
        { wch: 15 }, // date
        { wch: 30 }  // note
    ];
    ws['!cols'] = colWidths;

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(wb, ws, '记账模板');

    // 下载文件
    XLSX.writeFile(wb, '记账模板.xlsx');
};
</script>

<style scoped>
.form-container {
    background: #f8f9fa;
    padding: 25px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.form-container h2 {
    margin: 0 0 20px 0;
    color: #2c3e50;
    font-size: 1.5rem;
}

form {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 20px;
    align-items: end;
}

.form-group {
    margin-bottom: 0;
    margin-right: 20px;
}

label {
    display: block;
    margin-bottom: 8px;
    color: #2c3e50;
    font-weight: 500;
    font-size: 0.95rem;
}

input,
select {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 0.95rem;
    transition: border-color 0.3s, box-shadow 0.3s;
    background-color: white;
}

input:focus,
select:focus {
    outline: none;
    border-color: #42b883;
    box-shadow: 0 0 0 2px rgba(66, 184, 131, 0.1);
}

input::placeholder {
    color: #999;
}

.submit-btn {
    background: #42b883;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s;
    font-size: 0.95rem;
    font-weight: 500;
    min-width: 100px;
    height: 40px;
    align-self: end;
}

.submit-btn:hover {
    background: #359268;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.submit-btn:active {
    transform: translateY(0);
}

@media (max-width: 768px) {
    .form-container {
        padding: 20px;
    }

    form {
        grid-template-columns: 1fr;
        gap: 15px;
    }

    .submit-btn {
        width: 100%;
        margin-top: 10px;
    }
}

.import-section {
    margin-top: 20px;
    text-align: center;
    padding-top: 20px;
    border-top: 1px solid #eee;
}

.import-actions {
    display: flex;
    justify-content: center;
    gap: 15px;
}

.import-btn,
.template-btn {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s;
    font-size: 0.95rem;
}

.import-btn {
    background: #42b883;
    color: white;
}

.import-btn:hover {
    background: #359268;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.template-btn {
    background: #f8f9fa;
    color: #2c3e50;
    border: 1px solid #ddd;
}

.template-btn:hover {
    background: #e9ecef;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.import-btn:active,
.template-btn:active {
    transform: translateY(0);
}

@media (max-width: 768px) {
    .import-actions {
        flex-direction: column;
        gap: 10px;
    }

    .import-btn,
    .template-btn {
        width: 100%;
    }
}
</style>