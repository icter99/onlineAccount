<template>
  <div class="header-section">
    <header>
      <h1>在线记账本</h1>
    </header>
    <main>
      <AddRecordForm @record-added="handleRecordAdded" />
      <div class="divider">
        <div class="divider-line"></div>
        <div class="divider-icon">📊</div>
        <div class="divider-line"></div>
      </div>
      <div class="flex-container">
        <div class="left-panel">
          <SummaryCard :filtered-records="filteredRecords" />
          <EnhancedChart :filtered-records="filteredRecords" />
        </div>
        <div class="right-panel">
          <FilterPanel @filtered="handleFiltered" ref="filterPanel" />
          <RecordList :filtered-records="filteredRecords" @refresh-filter="refreshFilter" />
          <ExportData :filtered-records="filteredRecords" />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useAccountStore } from '@/stores/accountStore';
import AddRecordForm from './components/AddRecordForm.vue';
import RecordList from './components/RecordList.vue';
import SummaryCard from './components/SummaryCard.vue';
import EnhancedChart from './components/EnhancedChart.vue';
import ExportData from './components/ExportData.vue';
import FilterPanel from './components/FilterPanel.vue';

const accountStore = useAccountStore();
const filterPanel = ref(null);

// 筛选后的记录
const filteredRecords = ref([...accountStore.records]);

// 处理筛选结果
const handleFiltered = (filtered) => {
  filteredRecords.value = filtered;
};

// 处理添加新记录
const handleRecordAdded = () => {
  // 当添加新记录时，重新应用筛选
  refreshFilter();
};

// 刷新筛选（当编辑或删除记录时调用）
const refreshFilter = () => {
  if (filterPanel.value) {
    filterPanel.value.applyFilters();
  } else {
    // 如果filterPanel还没有初始化，直接显示所有记录
    filteredRecords.value = [...accountStore.records];
  }
};

// 监听accountStore的records变化，自动刷新筛选
watch(() => accountStore.records, () => {
  refreshFilter();
}, { deep: true });

// 初始化时显示所有记录
onMounted(() => {
  filteredRecords.value = [...accountStore.records];
});
</script>

<style>
/* 重置默认边距 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  background-color: #f8f9fa;
}

main {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f8f9fa;
}

/* 移除数字输入框的微调按钮 */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}

form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 25px;
  background-color: #ffffff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

header {
  background: linear-gradient(135deg, #42b883, #33a06f);
  color: white;
  text-align: center;
  padding: 35px 0;
  margin: 0;
  width: 100%;
  box-shadow: 0 4px 20px rgba(66, 184, 131, 0.2);
  position: relative;
  overflow: hidden;
}

header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg,
      rgba(255, 255, 255, 0.1) 25%,
      transparent 25%,
      transparent 50%,
      rgba(255, 255, 255, 0.1) 50%,
      rgba(255, 255, 255, 0.1) 75%,
      transparent 75%,
      transparent);
  background-size: 100px 100px;
  opacity: 0.1;
  animation: moveBackground 20s linear infinite;
}

@keyframes moveBackground {
  0% {
    background-position: 0 0;
  }

  100% {
    background-position: 100px 100px;
  }
}

header h1 {
  margin: 0;
  font-size: 2.8rem;
  font-weight: 900;
  font-family: "SimHei", "黑体", sans-serif;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.15);
  letter-spacing: 2px;
  position: relative;
}

header h1::after {
  content: '';
  display: block;
  width: 60px;
  height: 4px;
  background: rgba(255, 255, 255, 0.8);
  margin: 15px auto 0;
  border-radius: 2px;
}

/* 添加淡绿色背景区域 */
.header-section {
  background: linear-gradient(to bottom,
      #42b883,
      #e8f5e9 30%,
      #f1f8e9 60%,
      #f8f9fa);
  padding-bottom: 40px;
  margin-bottom: 0;
  position: relative;
}

.header-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 200px;
  background: linear-gradient(180deg,
      rgba(255, 255, 255, 0.1) 0%,
      rgba(255, 255, 255, 0) 100%);
  pointer-events: none;
}

.divider {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 30px 0;
  position: relative;
}

.divider-line {
  flex: 1;
  height: 2px;
  background: linear-gradient(to right,
      transparent,
      rgba(66, 184, 131, 0.2),
      rgba(66, 184, 131, 0.4),
      rgba(66, 184, 131, 0.2),
      transparent);
}

.divider-icon {
  margin: 0 15px;
  font-size: 24px;
  color: #42b883;
  background: #f8f9fa;
  padding: 8px 15px;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(66, 184, 131, 0.2);
  transition: transform 0.3s ease;
}

.divider-icon:hover {
  transform: scale(1.1);
}

/* 修改余额卡片背景色 */
:deep(.balance-card) {
  background: linear-gradient(135deg, #e3f2fd, #bbdefb) !important;
  color: #1976d2 !important;
}

:deep(.balance-card .amount) {
  color: #1976d2 !important;
}

@media (max-width: 768px) {
  header {
    padding: 25px 0;
  }

  header h1 {
    font-size: 2rem;
  }

  header h1::after {
    width: 40px;
    height: 3px;
    margin-top: 10px;
  }
}
</style>

<style scoped>
.flex-container {
  display: flex;
  flex-direction: row;
  gap: 30px;
  max-width: 1400px;
  margin: 20px auto 0;
  padding: 0;
  min-height: 600px;
}

.left-panel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.left-panel>* {
  background-color: #ffffff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.right-panel {
  flex: 1;
  min-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.right-panel>* {
  background-color: #ffffff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* 调整记录列表样式 */
.right-panel> :nth-child(2) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.right-panel> :nth-child(2)>div {
  flex: 1;
  overflow: auto;
}

@media (max-width: 1200px) {
  .flex-container {
    flex-direction: column;
    gap: 20px;
  }

  .left-panel,
  .right-panel {
    flex: 1;
    min-width: auto;
  }

  .right-panel {
    gap: 20px;
  }
}

@media (max-width: 768px) {
  main {
    padding: 10px;
  }

  header h1 {
    font-size: 2rem;
  }

  .flex-container {
    gap: 15px;
    margin-top: 15px;
  }

  .left-panel,
  .right-panel>* {
    padding: 15px;
  }
}
</style>