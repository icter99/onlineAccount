<template>
    <div class="filter-panel">
        <h3>筛选条件</h3>
        <div class="filters">
            <!-- 类型筛选 -->
            <div class="filter-group">
                <label>类型</label>
                <select v-model="filters.type" @change="applyFilters">
                    <option value="">全部</option>
                    <option value="收入">收入</option>
                    <option value="支出">支出</option>
                </select>
            </div>

            <!-- 日期范围筛选 -->
            <div class="filter-group">
                <label>开始日期</label>
                <input v-model="filters.startDate" type="date" @change="applyFilters">
            </div>

            <!-- 金额范围筛选 -->
            <div class="filter-group">
                <label>最小金额</label>
                <input v-model.number="filters.minAmount" type="number" step="0.01" placeholder="0"
                    @input="applyFilters">
            </div>
            <!-- 分类筛选 -->
            <div class="filter-group">
                <label>分类</label>
                <select v-model="filters.category" @change="applyFilters">
                    <option value="">全部</option>
                    <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
                </select>
            </div>

            <div class="filter-group">
                <label>结束日期</label>
                <input v-model="filters.endDate" type="date" @change="applyFilters">
            </div>

            <div class="filter-group">
                <label>最大金额</label>
                <input v-model.number="filters.maxAmount" type="number" step="0.01" placeholder="无限制"
                    @input="applyFilters">
            </div>
        </div>

        <div class="filter-actions">
            <button @click="resetFilters" class="reset-btn">重置筛选</button>
            <button @click="toggleAdvanced" class="toggle-btn">
                {{ showAdvanced ? '隐藏高级筛选' : '显示高级筛选' }}
            </button>
        </div>

        <!-- 高级筛选 -->
        <div v-if="showAdvanced" class="advanced-filters">
            <div class="filter-group">
                <label>关键词搜索</label>
                <div class="search-group">
                    <input v-model="filters.keyword" type="text" placeholder="搜索备注内容" @input="handleKeywordInput"
                        @blur="applyFilters">
                    <button @click="applyFilters" class="search-btn">搜索</button>
                </div>
            </div>

            <div class="filter-group">
                <label>排序方式</label>
                <select v-model="filters.sortBy" @change="applyFilters">
                    <option value="date-desc">日期（新到旧）</option>
                    <option value="date-asc">日期（旧到新）</option>
                    <option value="amount-desc">金额（高到低）</option>
                    <option value="amount-asc">金额（低到高）</option>
                </select>
            </div>
        </div>

        <div class="filter-summary">
            共找到 <strong>{{ filteredCount }}</strong> 条记录
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useAccountStore } from '@/stores/accountStore';

const accountStore = useAccountStore();

// 分类选项
const categories = ['餐饮', '交通', '购物', '娱乐', '工资', '医疗', '教育', '住房', '通讯', '服装', '日用品', '奖金', '投资', '兼职', '礼金', '退款', '其他'];

// 筛选条件
const filters = ref({
    type: '',
    category: '',
    startDate: '',
    endDate: '',
    minAmount: null,
    maxAmount: null,
    keyword: '',
    sortBy: 'date-desc'
});

const showAdvanced = ref(false);
let keywordTimeout = null;

// 定义emit事件
const emit = defineEmits(['filtered']);

// 处理关键词输入
const handleKeywordInput = () => {
    // 清除之前的定时器
    if (keywordTimeout) {
        clearTimeout(keywordTimeout);
    }
    // 设置新的定时器，500ms 后执行筛选
    keywordTimeout = setTimeout(() => {
        applyFilters();
    }, 500);
};

// 应用筛选
const applyFilters = () => {
    let filtered = [...accountStore.records];

    // 类型筛选
    if (filters.value.type) {
        filtered = filtered.filter(record => record.type === filters.value.type);
    }

    // 分类筛选
    if (filters.value.category) {
        filtered = filtered.filter(record => record.category === filters.value.category);
    }

    // 日期范围筛选
    if (filters.value.startDate) {
        filtered = filtered.filter(record => record.date >= filters.value.startDate);
    }
    if (filters.value.endDate) {
        filtered = filtered.filter(record => record.date <= filters.value.endDate);
    }

    // 金额范围筛选
    if (filters.value.minAmount !== null && filters.value.minAmount !== '') {
        filtered = filtered.filter(record => record.amount >= filters.value.minAmount);
    }
    if (filters.value.maxAmount !== null && filters.value.maxAmount !== '') {
        filtered = filtered.filter(record => record.amount <= filters.value.maxAmount);
    }

    // 关键词搜索
    if (filters.value.keyword) {
        const keyword = filters.value.keyword.toLowerCase();
        filtered = filtered.filter(record =>
            record.note.toLowerCase().includes(keyword) ||
            record.category.toLowerCase().includes(keyword)
        );
    }

    // 排序
    switch (filters.value.sortBy) {
        case 'date-desc':
            filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
        case 'date-asc':
            filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
            break;
        case 'amount-desc':
            filtered.sort((a, b) => b.amount - a.amount);
            break;
        case 'amount-asc':
            filtered.sort((a, b) => a.amount - b.amount);
            break;
    }

    // 更新筛选计数
    filteredCount.value = filtered.length;

    emit('filtered', filtered);
};

// 重置筛选
const resetFilters = () => {
    filters.value = {
        type: '',
        category: '',
        startDate: '',
        endDate: '',
        minAmount: null,
        maxAmount: null,
        keyword: '',
        sortBy: 'date-desc'
    };
    applyFilters();
};

// 切换高级筛选显示
const toggleAdvanced = () => {
    showAdvanced.value = !showAdvanced.value;
};

// 计算筛选后的记录数
const filteredCount = ref(accountStore.records.length);

// 监听筛选结果更新计数
watch(() => accountStore.records, () => {
    applyFilters();
}, { immediate: true });

// 初始化时应用筛选
applyFilters();

// 暴露给父组件的方法
defineExpose({
    applyFilters,
    resetFilters
});
</script>

<style scoped>
.filter-panel {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
}

.filters {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin-bottom: 15px;
}

.advanced-filters {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 15px;
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid #ddd;
}

.filter-group {
    display: flex;
    flex-direction: column;
}

.filter-group label {
    margin-bottom: 5px;
    font-weight: 500;
    color: #333;
    font-size: 14px;
}

.filter-group input,
.filter-group select {
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
}

.search-group {
    display: flex;
    gap: 8px;
}

.search-group input {
    flex: 1;
}

.search-btn {
    background: #42b883;
    color: white;
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s;
    font-size: 14px;
}

.search-btn:hover {
    background: #359268;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.filter-actions {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
}

.reset-btn,
.toggle-btn {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s;
    font-size: 14px;
}

.reset-btn {
    background: #f8f9fa;
    color: #666;
    border: 1px solid #ddd;
}

.reset-btn:hover {
    background: #e9ecef;
}

.toggle-btn {
    background: #42b883;
    color: white;
}

.toggle-btn:hover {
    background: #359268;
}

.filter-summary {
    text-align: center;
    padding: 10px;
    background: white;
    border-radius: 4px;
    color: #333;
    font-size: 14px;
}

@media (max-width: 768px) {
    .filters {
        grid-template-columns: 1fr;
    }

    .advanced-filters {
        grid-template-columns: 1fr;
    }

    .filter-actions {
        flex-direction: column;
    }

    .reset-btn,
    .toggle-btn {
        width: 100%;
    }
}
</style>