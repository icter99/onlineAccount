<template>
    <div class="chart-container">
        <h2>收支统计</h2>
        <canvas ref="chartCanvas"></canvas>
    </div>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue';
import { Chart, registerables } from 'chart.js';
import { useAccountStore } from '@/stores/accountStore';

const accountStore = useAccountStore();
const chartCanvas = ref(null);
let chartInstance = null;

// 注册 Chart.js 模块
Chart.register(...registerables);

// 初始化图表
const initChart = () => {
    if (chartInstance) chartInstance.destroy();

    const ctx = chartCanvas.value.getContext('2d');
    const categories = [...new Set(accountStore.records.map(r => r.category))];

    // 计算分类支出总额
    const data = categories.map(cat =>
        accountStore.records
            .filter(r => r.type === '支出' && r.category === cat)
            .reduce((sum, r) => sum + r.amount, 0)
    );

    chartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: categories,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                    '#9966FF', '#FF9F40', '#E7E9ED'
                ],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.label}: ¥${ctx.raw.toFixed(2)}`
                    }
                }
            }
        }
    });
};

// 组件挂载时初始化
onMounted(() => {
    if (accountStore.records.length > 0) initChart();
});

// 监听数据变化更新图表
watch(() => accountStore.records, () => {
    initChart();
}, { deep: true });

// 组件卸载前销毁图表
onBeforeUnmount(() => {
    if (chartInstance) chartInstance.destroy();
});
</script>

<style scoped>
.chart-container {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    margin-top: 20px;
}

canvas {
    max-width: 600px;
    margin: 0 auto;
}
</style>