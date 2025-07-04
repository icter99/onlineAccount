<template>
    <div class="enhanced-chart">
        <div class="chart-header">
            <h2>数据统计</h2>
            <div class="data-info">
                <span class="data-count">{{ filteredRecords.length }} 条记录</span>
                <span v-if="isFiltered" class="filter-indicator">已筛选</span>
            </div>
        </div>

        <!-- 图表类型切换 -->
        <div class="chart-tabs">
            <button v-for="tab in chartTabs" :key="tab.key" @click="activeChart = tab.key"
                :class="{ active: activeChart === tab.key }" class="tab-btn">
                {{ tab.label }}
            </button>
        </div>

        <!-- 图表内容 -->
        <div class="chart-content">
            <!-- 支出分类饼图 -->
            <div v-show="activeChart === 'pie'" class="chart-section">
                <div class="pie-controls">
                    <h3>分类占比</h3>
                    <div class="pie-type-switch">
                        <button @click="pieType = 'expense'" :class="{ active: pieType === 'expense' }"
                            class="switch-btn">
                            支出分类
                        </button>
                        <button @click="pieType = 'income'" :class="{ active: pieType === 'income' }"
                            class="switch-btn">
                            收入分类
                        </button>
                    </div>
                </div>
                <canvas ref="pieCanvas" width="400" height="300"></canvas>
                <div v-if="currentPieData.length === 0" class="no-data">
                    暂无{{ pieType === 'expense' ? '支出' : '收入' }}数据
                </div>
            </div>

            <!-- 收支对比柱状图 -->
            <div v-show="activeChart === 'bar'" class="chart-section">
                <h3>月度收支对比</h3>
                <canvas ref="barCanvas" width="400" height="300"></canvas>
                <div v-if="monthlyData.length === 0" class="no-data">暂无数据</div>
            </div>

            <!-- 趋势线图 -->
            <div v-show="activeChart === 'line'" class="chart-section">
                <h3>余额变化趋势</h3>
                <canvas ref="lineCanvas" width="400" height="300"></canvas>
                <div v-if="filteredRecords.length === 0" class="no-data">暂无数据</div>
            </div>

            <!-- 统计摘要 -->
            <div v-show="activeChart === 'summary'" class="chart-section">
                <h3>详细统计</h3>
                <div class="summary-grid">
                    <!-- 分类统计 -->
                    <div class="summary-card">
                        <h4>分类支出排行</h4>
                        <div class="category-list">
                            <div v-for="item in categoryStats" :key="item.category" class="category-item">
                                <span class="category-name">{{ item.category }}</span>
                                <span class="category-amount">¥{{ item.amount.toFixed(2) }}</span>
                                <span class="category-count">{{ item.count }}笔</span>
                            </div>
                        </div>
                    </div>

                    <!-- 月度统计 -->
                    <div class="summary-card">
                        <h4>月度收支统计</h4>
                        <div class="monthly-list">
                            <div v-for="item in monthlyStats" :key="item.month" class="monthly-item">
                                <span class="month-name">{{ item.month }}</span>
                                <span class="income">收入: ¥{{ item.income.toFixed(2) }}</span>
                                <span class="expense">支出: ¥{{ item.expense.toFixed(2) }}</span>
                                <span class="balance" :class="{ negative: item.balance < 0 }">
                                    余额: ¥{{ item.balance.toFixed(2) }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { Chart, registerables } from 'chart.js';
import { useAccountStore } from '@/stores/accountStore';

Chart.register(...registerables);

const props = defineProps({
    filteredRecords: {
        type: Array,
        default: () => []
    }
});

const accountStore = useAccountStore();

// 图表引用
const pieCanvas = ref(null);
const barCanvas = ref(null);
const lineCanvas = ref(null);

// 图表实例
let pieChart = null;
let barChart = null;
let lineChart = null;

// 当前激活的图表
const activeChart = ref('pie');

// 图表标签页
const chartTabs = [
    { key: 'pie', label: '分类饼图' },
    { key: 'bar', label: '收支对比' },
    { key: 'line', label: '趋势图' },
    { key: 'summary', label: '详细统计' }
];

// 添加饼图类型状态
const pieType = ref('expense');

// 判断是否处于筛选状态
const isFiltered = computed(() => {
    return props.filteredRecords.length !== accountStore.records.length;
});

// 支出分类数据（基于筛选后的数据）
const expenseCategories = computed(() => {
    const categories = {};
    props.filteredRecords
        .filter(r => r.type === '支出')
        .forEach(r => {
            categories[r.category] = (categories[r.category] || 0) + r.amount;
        });
    return Object.entries(categories).map(([category, amount]) => ({ category, amount }));
});

// 添加收入分类数据计算属性
const incomeCategories = computed(() => {
    const categories = {};
    props.filteredRecords
        .filter(r => r.type === '收入')
        .forEach(r => {
            categories[r.category] = (categories[r.category] || 0) + r.amount;
        });
    return Object.entries(categories).map(([category, amount]) => ({ category, amount }));
});

// 当前饼图数据
const currentPieData = computed(() => {
    return pieType.value === 'expense' ? expenseCategories.value : incomeCategories.value;
});

// 月度数据（基于筛选后的数据）
const monthlyData = computed(() => {
    const monthly = {};
    props.filteredRecords.forEach(r => {
        // 确保日期是字符串格式
        const dateStr = typeof r.date === 'string' ? r.date : new Date(r.date).toISOString().split('T')[0];
        const month = dateStr.substring(0, 7); // YYYY-MM
        if (!monthly[month]) {
            monthly[month] = { income: 0, expense: 0 };
        }
        if (r.type === '收入') {
            monthly[month].income += r.amount;
        } else {
            monthly[month].expense += r.amount;
        }
    });
    return Object.entries(monthly)
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => a.month.localeCompare(b.month));
});

// 分类统计（基于筛选后的数据）
const categoryStats = computed(() => {
    const stats = {};
    props.filteredRecords
        .filter(r => r.type === '支出')
        .forEach(r => {
            if (!stats[r.category]) {
                stats[r.category] = { amount: 0, count: 0 };
            }
            stats[r.category].amount += r.amount;
            stats[r.category].count += 1;
        });

    return Object.entries(stats)
        .map(([category, data]) => ({ category, ...data }))
        .sort((a, b) => b.amount - a.amount);
});

// 月度统计
const monthlyStats = computed(() => {
    return monthlyData.value.map(item => ({
        ...item,
        balance: item.income - item.expense
    }));
});

// 初始化饼图
const initPieChart = async () => {
    if (!pieCanvas.value || currentPieData.value.length === 0) return;

    if (pieChart) pieChart.destroy();

    await nextTick();
    const ctx = pieCanvas.value.getContext('2d');

    // 支出饼图使用暖色调，体现消费特点
    const expenseColors = [
        '#FF6B6B', // 明亮的红色
        '#FF9F43', // 温暖的橙色
        '#FFD93D', // 明亮的黄色
        '#6C5CE7', // 优雅的紫色
        '#A29BFE', // 柔和的紫色
        '#FF8B94', // 柔和的粉色
        '#FFB8B8', // 浅粉色
        '#FFD3B6', // 温暖的橙色
        '#FFE5D4', // 浅橙色
        '#FFA07A'  // 浅珊瑚色
    ];

    // 收入饼图使用冷色调，体现稳健特点
    const incomeColors = [
        '#2ECC71', // 翠绿色
        '#27AE60', // 深绿色
        '#3498DB', // 天蓝色
        '#2980B9', // 深蓝色
        '#1ABC9C', // 青绿色
        '#16A085', // 深青绿色
        '#4ECDC4', // 薄荷绿
        '#45B7AF', // 深薄荷绿
        '#7FDBFF', // 浅蓝色
        '#39CCCC'  // 青色
    ];

    const colors = pieType.value === 'expense' ? expenseColors : incomeColors;

    pieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: currentPieData.value.map(item => item.category),
            datasets: [{
                data: currentPieData.value.map(item => item.amount),
                backgroundColor: colors,
                borderColor: '#ffffff',
                borderWidth: 2,
                hoverOffset: 8,
                hoverBorderWidth: 3
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (ctx) => {
                            const total = currentPieData.value.reduce((sum, item) => sum + item.amount, 0);
                            const percentage = ((ctx.raw / total) * 100).toFixed(1);
                            return `${ctx.label}: ¥${ctx.raw.toFixed(2)} (${percentage}%)`;
                        }
                    },
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    titleColor: '#333',
                    bodyColor: '#666',
                    borderColor: '#ddd',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 6,
                    displayColors: true,
                    usePointStyle: true
                }
            }
        }
    });
};

// 初始化柱状图
const initBarChart = async () => {
    if (!barCanvas.value || monthlyData.value.length === 0) return;

    if (barChart) barChart.destroy();

    await nextTick();
    const ctx = barCanvas.value.getContext('2d');

    barChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: monthlyData.value.map(item => item.month),
            datasets: [
                {
                    label: '收入',
                    data: monthlyData.value.map(item => item.income),
                    backgroundColor: '#42b883',
                    borderColor: '#369970',
                    borderWidth: 1
                },
                {
                    label: '支出',
                    data: monthlyData.value.map(item => item.expense),
                    backgroundColor: '#ff4757',
                    borderColor: '#ff3838',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.dataset.label}: ¥${ctx.raw.toFixed(2)}`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return '¥' + value.toFixed(0);
                        }
                    }
                }
            }
        }
    });
};

// 初始化趋势图
const initLineChart = async () => {
    if (!lineCanvas.value || props.filteredRecords.length === 0) return;

    if (lineChart) lineChart.destroy();

    await nextTick();

    // 计算累计余额（基于筛选后的数据）
    const sortedRecords = [...props.filteredRecords].sort((a, b) => new Date(a.date) - new Date(b.date));
    let balance = 0;
    const balanceData = sortedRecords.map(record => {
        if (record.type === '收入') {
            balance += record.amount;
        } else {
            balance -= record.amount;
        }
        return {
            date: record.date,
            balance: balance
        };
    });

    const ctx = lineCanvas.value.getContext('2d');

    lineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: balanceData.map(item => item.date),
            datasets: [{
                label: '余额',
                data: balanceData.map(item => item.balance),
                borderColor: '#3742fa',
                backgroundColor: 'rgba(55, 66, 250, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `余额: ¥${ctx.raw.toFixed(2)}`
                    }
                }
            },
            scales: {
                y: {
                    ticks: {
                        callback: function (value) {
                            return '¥' + value.toFixed(0);
                        }
                    }
                }
            }
        }
    });
};

// 初始化所有图表
const initCharts = async () => {
    await nextTick();
    if (activeChart.value === 'pie') await initPieChart();
    if (activeChart.value === 'bar') await initBarChart();
    if (activeChart.value === 'line') await initLineChart();
};

// 监听激活图表变化
watch(activeChart, async () => {
    await nextTick();
    if (activeChart.value === 'pie') await initPieChart();
    if (activeChart.value === 'bar') await initBarChart();
    if (activeChart.value === 'line') await initLineChart();
});

// 监听筛选数据变化
watch(() => props.filteredRecords, initCharts, { deep: true });

// 监听饼图类型变化
watch(pieType, () => {
    initPieChart();
});

// 组件挂载
onMounted(() => {
    initCharts();
});

// 组件卸载
onBeforeUnmount(() => {
    if (pieChart) pieChart.destroy();
    if (barChart) barChart.destroy();
    if (lineChart) lineChart.destroy();
});
</script>

<style scoped>
.enhanced-chart {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    margin-top: 20px;
}

.chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.chart-header h2 {
    margin: 0;
}

.data-info {
    display: flex;
    gap: 10px;
    align-items: center;
}

.data-count {
    color: #666;
    font-size: 14px;
}

.filter-indicator {
    background: #007bff;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
}

.chart-tabs {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    border-bottom: 2px solid #f1f1f1;
}

.tab-btn {
    padding: 10px 20px;
    border: none;
    background: transparent;
    cursor: pointer;
    border-radius: 4px 4px 0 0;
    transition: all 0.3s;
    color: #666;
    font-weight: 500;
}

.tab-btn:hover {
    background: #f8f9fa;
    color: #333;
}

.tab-btn.active {
    background: #007bff;
    color: white;
}

.chart-content {
    min-height: 400px;
}

.chart-section {
    text-align: center;
}

.chart-section h3 {
    margin-bottom: 20px;
    color: #333;
}

.no-data {
    padding: 50px;
    color: #999;
    font-size: 16px;
}

canvas {
    max-width: 100%;
    height: auto;
}

/* 统计摘要样式 */
.summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 20px;
    text-align: left;
}

.summary-card {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
    border: 1px solid #e9ecef;
}

.summary-card h4 {
    margin-bottom: 15px;
    color: #333;
    border-bottom: 2px solid #007bff;
    padding-bottom: 8px;
}

.category-list,
.monthly-list {
    max-height: 300px;
    overflow-y: auto;
}

.category-item,
.monthly-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid #dee2e6;
}

.category-item:last-child,
.monthly-item:last-child {
    border-bottom: none;
}

.category-name,
.month-name {
    font-weight: 500;
    color: #333;
    flex: 1;
}

.category-amount,
.income,
.expense,
.balance {
    font-weight: bold;
    margin-left: 10px;
}

.category-count {
    color: #666;
    font-size: 12px;
    margin-left: 10px;
}

.income {
    color: #42b883;
}

.expense {
    color: #ff4757;
}

.balance {
    color: #3742fa;
}

.balance.negative {
    color: #ff4757;
}

.pie-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.pie-type-switch {
    display: flex;
    gap: 10px;
}

.switch-btn {
    padding: 8px 16px;
    border: 1px solid #007bff;
    background: transparent;
    color: #007bff;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s;
}

.switch-btn:hover {
    background: rgba(0, 123, 255, 0.1);
}

.switch-btn.active {
    background: #007bff;
    color: white;
}

@media (max-width: 768px) {
    .chart-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
    }

    .chart-tabs {
        flex-wrap: wrap;
    }

    .tab-btn {
        flex: 1;
        min-width: 0;
        padding: 8px 12px;
        font-size: 14px;
    }

    .summary-grid {
        grid-template-columns: 1fr;
    }

    .category-item,
    .monthly-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 5px;
    }
}
</style>