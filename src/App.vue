<template>
  <header>
    <h1>在线记账本</h1>
  </header>
  <main>
    <AddRecordForm @record-added="handleRecordAdded" />
    <FilterPanel @filtered="handleFiltered" ref="filterPanel" />
    <div class="flex-container">
      <div class="left-panel">
        <EnhancedChart :filtered-records="filteredRecords" />
      </div>
      <div class="right-panel">
        <SummaryCard :filtered-records="filteredRecords" />
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
}

form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
  margin-bottom: 20px;
}

header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
  padding: 20px 0;
  margin-bottom: 30px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

header h1 {
  margin: 0;
  font-size: 2.5rem;
  font-weight: 300;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
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
}

.left-panel {
  flex: 3;
  min-width: 0;
  /* 防止flex项目溢出 */
}

.right-panel {
  flex: 2;
  min-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 0;
  /* 移除gap，让组件自己控制间距 */
}

/* 确保右侧组件之间有适当的间距 */
.right-panel>*:not(:last-child) {
  margin-bottom: 0;
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
    gap: 0;
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
}
</style>