<template>
    <div class="record-list">
        <div class="list-header">
            <h3>记账记录</h3>
            <div class="list-actions">
                <button v-if="!isBatchMode" @click="enterBatchMode" class="batch-btn">
                    批量删除
                </button>
                <template v-else>
                    <button @click="selectAll" class="select-all-btn">
                        {{ isAllSelected ? '取消全选' : '全选' }}
                    </button>
                    <button @click="deleteSelected" class="delete-btn" :disabled="!hasSelected">
                        删除选中
                    </button>
                    <button @click="exitBatchMode" class="cancel-btn">
                        取消
                    </button>
                </template>
            </div>
        </div>

        <div class="records-container">
            <div v-if="filteredRecords.length === 0" class="no-records">
                暂无记录
            </div>
            <div v-else class="records">
                <div v-for="record in paginatedRecords" :key="record.id" class="record-item"
                    :class="{ 'selected': isBatchMode && selectedRecords.includes(record.id) }">
                    <div class="record-content" @click="isBatchMode && toggleSelect(record.id)">
                        <div class="record-type" :class="record.type">
                            {{ record.type }}
                        </div>
                        <div class="record-info">
                            <div class="record-main">
                                <span class="record-category">{{ record.category }}</span>
                                <span class="record-amount" :class="record.type">
                                    {{ record.type === '收入' ? '+' : '-' }}¥{{ record.amount.toFixed(2) }}
                                </span>
                            </div>
                            <div class="record-sub">
                                <span class="record-date">{{ record.date }}</span>
                                <span class="record-note">{{ record.note }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="record-actions" v-if="!isBatchMode">
                        <button @click="editRecord(record)" class="edit-btn">编辑</button>
                        <button @click="deleteRecord(record.id)" class="delete-btn">删除</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- 分页控件 -->
        <div class="pagination" v-if="totalPages > 1">
            <button @click="currentPage--" :disabled="currentPage === 1" class="page-btn">
                上一页
            </button>
            <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
            <button @click="currentPage++" :disabled="currentPage === totalPages" class="page-btn">
                下一页
            </button>
        </div>

        <!-- 编辑对话框 -->
        <div v-if="showEditDialog" class="edit-dialog">
            <div class="dialog-content">
                <h3>编辑记录</h3>
                <form @submit.prevent="saveEdit">
                    <div class="form-group">
                        <label>类型</label>
                        <select v-model="editingRecord.type">
                            <option value="收入">收入</option>
                            <option value="支出">支出</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>金额</label>
                        <input type="number" v-model.number="editingRecord.amount" step="0.01" required>
                    </div>
                    <div class="form-group">
                        <label>分类</label>
                        <select v-model="editingRecord.category">
                            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>日期</label>
                        <input type="date" v-model="editingRecord.date" required>
                    </div>
                    <div class="form-group">
                        <label>备注</label>
                        <input type="text" v-model="editingRecord.note">
                    </div>
                    <div class="dialog-actions">
                        <button type="button" @click="showEditDialog = false" class="cancel-btn">取消</button>
                        <button type="submit" class="save-btn">保存</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useAccountStore } from '@/stores/accountStore';

const props = defineProps({
    filteredRecords: {
        type: Array,
        default: () => []
    }
});

const emit = defineEmits(['refresh-filter']);

const accountStore = useAccountStore();

// 分页相关
const currentPage = ref(1);
const pageSize = 10;

// 编辑相关
const showEditDialog = ref(false);
const editingRecord = ref(null);

// 批量删除相关
const isBatchMode = ref(false);
const selectedRecords = ref([]);

// 分类选项
const categories = ['餐饮', '交通', '购物', '娱乐', '工资', '医疗', '教育', '住房', '通讯', '服装', '日用品', '奖金', '投资', '兼职', '礼金', '退款', '其他'];

// 计算总页数
const totalPages = computed(() => Math.ceil(props.filteredRecords.length / pageSize));

// 计算当前页的记录
const paginatedRecords = computed(() => {
    const start = (currentPage.value - 1) * pageSize;
    const end = start + pageSize;
    return props.filteredRecords.slice(start, end);
});

// 监听筛选结果变化，重置分页
watch(() => props.filteredRecords, () => {
    currentPage.value = 1;
});

// 编辑记录
const editRecord = (record) => {
    editingRecord.value = { ...record };
    showEditDialog.value = true;
};

// 保存编辑
const saveEdit = () => {
    accountStore.updateRecord(editingRecord.value);
    showEditDialog.value = false;
    emit('refresh-filter');
};

// 删除单条记录
const deleteRecord = (id) => {
    if (confirm('确定要删除这条记录吗？')) {
        accountStore.deleteRecord(id);
        emit('refresh-filter');
    }
};

// 进入批量删除模式
const enterBatchMode = () => {
    isBatchMode.value = true;
    selectedRecords.value = [];
};

// 退出批量删除模式
const exitBatchMode = () => {
    isBatchMode.value = false;
    selectedRecords.value = [];
};

// 切换选中状态
const toggleSelect = (id) => {
    const index = selectedRecords.value.indexOf(id);
    if (index === -1) {
        selectedRecords.value.push(id);
    } else {
        selectedRecords.value.splice(index, 1);
    }
};

// 全选/取消全选
const isAllSelected = computed(() => {
    return paginatedRecords.value.length > 0 &&
        selectedRecords.value.length === paginatedRecords.value.length;
});

const selectAll = () => {
    if (isAllSelected.value) {
        selectedRecords.value = [];
    } else {
        selectedRecords.value = paginatedRecords.value.map(record => record.id);
    }
};

// 是否有选中的记录
const hasSelected = computed(() => selectedRecords.value.length > 0);

// 删除选中的记录
const deleteSelected = () => {
    if (selectedRecords.value.length === 0) return;

    if (confirm(`确定要删除选中的 ${selectedRecords.value.length} 条记录吗？`)) {
        selectedRecords.value.forEach(id => {
            accountStore.deleteRecord(id);
        });
        emit('refresh-filter');
        exitBatchMode();
    }
};
</script>

<style scoped>
.record-list {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}

.list-actions {
    display: flex;
    gap: 10px;
}

.batch-btn,
.select-all-btn,
.delete-btn,
.cancel-btn {
    padding: 6px 12px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.3s;
}

.batch-btn {
    background: #f8f9fa;
    color: #666;
    border: 1px solid #ddd;
}

.batch-btn:hover {
    background: #e9ecef;
}

.select-all-btn {
    background: #42b883;
    color: white;
}

.select-all-btn:hover {
    background: #359268;
}

.delete-btn {
    background: #ff4757;
    color: white;
}

.delete-btn:hover {
    background: #ff6b81;
}

.delete-btn:disabled {
    background: #ffa5b1;
    cursor: not-allowed;
}

.cancel-btn {
    background: #f8f9fa;
    color: #666;
    border: 1px solid #ddd;
}

.cancel-btn:hover {
    background: #e9ecef;
}

.records-container {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
}

.records {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.record-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    transition: all 0.3s;
}

.record-item.selected {
    background: #e8f5e9;
    border: 1px solid #42b883;
}

.record-content {
    flex: 1;
    display: flex;
    gap: 12px;
    cursor: pointer;
}

.record-type {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
}

.record-type.收入 {
    background: #e8f5e9;
    color: #42b883;
}

.record-type.支出 {
    background: #ffebee;
    color: #ff4757;
}

.record-info {
    flex: 1;
}

.record-main {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;
}

.record-category {
    font-weight: 500;
    color: #333;
}

.record-amount {
    font-weight: 500;
}

.record-amount.收入 {
    color: #42b883;
}

.record-amount.支出 {
    color: #ff4757;
}

.record-sub {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #666;
}

.record-actions {
    display: flex;
    gap: 8px;
}

.edit-btn,
.delete-btn {
    padding: 4px 8px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.3s;
}

.edit-btn {
    background: #e3f2fd;
    color: #1976d2;
}

.edit-btn:hover {
    background: #bbdefb;
}

.pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 15px;
    margin-top: 20px;
    padding: 10px 0;
}

.page-btn {
    padding: 6px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: #fff;
    cursor: pointer;
    transition: all 0.3s;
}

.page-btn:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
}

.page-info {
    color: #666;
}

.edit-dialog {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.dialog-content {
    background: #fff;
    padding: 20px;
    border-radius: 8px;
    width: 90%;
    max-width: 500px;
}

.dialog-content h3 {
    margin-bottom: 20px;
    color: #333;
}

.form-group {
    margin-bottom: 15px;
}

.form-group label {
    display: block;
    margin-bottom: 5px;
    color: #666;
}

.form-group input,
.form-group select {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
}

.dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 20px;
}

.save-btn {
    background: #42b883;
    color: white;
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.save-btn:hover {
    background: #359268;
}

.no-records {
    text-align: center;
    color: #666;
    padding: 20px;
}

@media (max-width: 768px) {
    .list-header {
        flex-direction: column;
        gap: 10px;
        align-items: flex-start;
    }

    .list-actions {
        width: 100%;
    }

    .batch-btn,
    .select-all-btn,
    .delete-btn,
    .cancel-btn {
        flex: 1;
    }

    .record-item {
        flex-direction: column;
        gap: 10px;
    }

    .record-actions {
        width: 100%;
        justify-content: flex-end;
    }
}
</style>