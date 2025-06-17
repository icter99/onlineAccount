<template>
  <header>
    <h1>在线记账本</h1>
  </header>
  <main>
    <AddRecordForm @record-added="handleRecordAdded" />
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
  background: linear-gradient(135deg, #a8c0ff 0%, #3f2b96 100%);
  color: white;
  text-align: center;
  padding: 25px 0;
  margin-bottom: 30px;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);
}

header h1 {
  margin: 0;
  font-size: 2.5rem;
  font-weight: 300;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
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