<template>
    <div class="summary-container">
        <h2>收支总览</h2>
        <div class="summary-cards">
            <div class="card income">
                <div class="label">总收入</div>
                <div class="amount">¥{{ totalIncome.toFixed(2) }}</div>
            </div>
            <div class="card expense">
                <div class="label">总支出</div>
                <div class="amount">¥{{ totalExpense.toFixed(2) }}</div>
            </div>
            <div class="card balance">
                <div class="label">余额</div>
                <div class="amount" :class="{ 'negative': balance < 0 }">¥{{ balance.toFixed(2) }}</div>
            </div>
        </div>

        <div class="quick-stats">
            <div class="stat-item">
                <span class="stat-label">记录总数:</span>
                <span class="stat-value">{{ filteredRecords.length }}条</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">最近记录:</span>
                <span class="stat-value">{{ lastRecordDate || '暂无' }}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">筛选状态:</span>
                <span class="stat-value" :class="{ 'filtered': isFiltered }">
                    {{ isFiltered ? '已筛选' : '全部数据' }}
                </span>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { useAccountStore } from '@/stores/accountStore';

const props = defineProps({
    filteredRecords: {
        type: Array,
        default: () => []
    }
});

const accountStore = useAccountStore();

// 计算总收入（基于筛选后的数据）
const totalIncome = computed(() => {
    return props.filteredRecords
        .filter(record => record.type === '收入')
        .reduce((sum, record) => sum + record.amount, 0);
});

// 计算总支出（基于筛选后的数据）
const totalExpense = computed(() => {
    return props.filteredRecords
        .filter(record => record.type === '支出')
        .reduce((sum, record) => sum + record.amount, 0);
});

// 计算余额
const balance = computed(() => totalIncome.value - totalExpense.value);

// 最近记录日期（基于筛选后的数据）
const lastRecordDate = computed(() => {
    if (props.filteredRecords.length === 0) return null;
    const sortedRecords = [...props.filteredRecords].sort((a, b) => new Date(b.date) - new Date(a.date));
    return sortedRecords[0].date;
});

// 判断是否处于筛选状态
const isFiltered = computed(() => {
    return props.filteredRecords.length !== accountStore.records.length;
});
</script>

<style scoped>
.summary-container {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
}

.summary-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 15px;
    margin-bottom: 20px;
}

.card {
    padding: 15px;
    border-radius: 8px;
    text-align: center;
    border: 2px solid transparent;
    transition: all 0.3s ease;
}

.card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.card.income {
    background: linear-gradient(135deg, #42b883, #369970);
    color: white;
}

.card.expense {
    background: linear-gradient(135deg, #ff4757, #ff3838);
    color: white;
}

.card.balance {
    background: linear-gradient(135deg, #3742fa, #2f3542);
    color: white;
}

.label {
    font-size: 14px;
    margin-bottom: 8px;
    opacity: 0.9;
}

.amount {
    font-size: 24px;
    font-weight: bold;
}

.amount.negative {
    color: #ff6b81 !important;
}

.quick-stats {
    display: flex;
    justify-content: space-between;
    padding-top: 15px;
    border-top: 1px solid #eee;
}

.stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.stat-label {
    font-size: 12px;
    color: #666;
    margin-bottom: 5px;
}

.stat-value {
    font-weight: bold;
    color: #333;
}

.stat-value.filtered {
    color: #007bff;
}

@media (max-width: 600px) {
    .summary-cards {
        grid-template-columns: 1fr;
    }

    .quick-stats {
        flex-direction: column;
        gap: 10px;
    }
}
</style>