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
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useAccountStore } from '@/stores/accountStore';

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
</script>

<style scoped>
.form-container {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.form-group {
    margin-bottom: 15px;
}

label {
    display: block;
    margin-bottom: 5px;
    color: #333;
    font-weight: 500;
}

input,
select {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
}

.submit-btn {
    background: #42b883;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.3s;
}

.submit-btn:hover {
    background: #359268;
}
</style>