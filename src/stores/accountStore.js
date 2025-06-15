import {
  defineStore
} from 'pinia';
import {
  ref,
  watch
} from 'vue';

export const useAccountStore = defineStore('account', () => {
  // 初始化数据（从 LocalStorage 读取或设为空数组）
  const loadRecords = () => {
    const saved = localStorage.getItem('accountRecords');
    return saved ? JSON.parse(saved) : [];
  };

  // 定义响应式数据（结构与你设计的 JSON 格式一致）
  const records = ref(loadRecords());

  // 监听数据变化并同步到 LocalStorage
  watch(
    records,
    (newVal) => {
      localStorage.setItem('accountRecords', JSON.stringify(newVal));
    }, {
      deep: true
    } // 深度监听对象/数组内部变化
  );

  // 添加记录的方法（示例）
  const addRecord = (record) => {
    records.value.push({
      id: Date.now(), // 生成唯一 ID（时间戳）
      type: record.type || '支出',
      amount: Number(record.amount) || 0,
      category: record.category || '其他',
      date: record.date || new Date().toISOString().split('T')[0], // 默认当天
      note: record.note || '',
    });
  };

  // 更新记录的方法
  const updateRecord = (updatedRecord) => {
    const index = records.value.findIndex(record => record.id === updatedRecord.id);
    if (index !== -1) {
      records.value[index] = {
        ...updatedRecord,
        amount: Number(updatedRecord.amount) || 0,
      };
    }
  };

  // 删除记录的方法（示例）
  const deleteRecord = (id) => {
    records.value = records.value.filter((item) => item.id !== id);
  };

  return {
    records,
    addRecord,
    updateRecord,
    deleteRecord
  };
});