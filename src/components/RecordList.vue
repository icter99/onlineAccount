<template>
    <div class="record-list">
        <div class="list-header">
            <h3>记账记录</h3>
            <div class="list-actions">
                <button v-if="!isBatchMode" @click="isBatchMode = true" class="batch-btn">
                    批量删除
                </button>
                <template v-else>
                    <button @click="toggleCurrentPageSelect" class="select-btn"
                        :class="{ 'selected': isCurrentPageAllSelected }">
                        {{ isCurrentPageAllSelected ? '取消本页全选' : '本页全选' }}
                    </button>
                    <button @click="toggleAllSelect" class="select-btn" :class="{ 'selected': isAllSelected }">
                        {{ isAllSelected ? '取消全选' : '全选' }}
                    </button>
                    <button @click="deleteSelectedRecords" class="delete-btn" :disabled="selectedRecords.length === 0">
                        删除选中({{ selectedRecords.length }})
                    </button>
                    <button @click="cancelBatchMode" class="cancel-btn">
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
                <div v-for="record in paginatedRecords" :key="record.id" class="record-item" :class="{
                    'selected': isBatchMode && selectedRecords.includes(record.id),
                    'empty-row': record.isEmpty
                }">
                    <template v-if="!record.isEmpty">
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
                    </template>
                    <template v-else>
                        <div class="empty-content"></div>
                    </template>
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
const pageSize = 7; // 固定每页显示7条记录

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
    const records = props.filteredRecords.slice(start, end);

    // 如果记录数不足7条，添加空行占位
    while (records.length < pageSize) {
        records.push({
            id: `empty-${records.length}`,
            isEmpty: true,
            type: '',
            category: '',
            amount: 0,
            date: '',
            note: ''
        });
    }

    return records;
});

// 计算当前页的所有记录ID（排除空行）
const currentPageRecordIds = computed(() => {
    return paginatedRecords.value
        .filter(record => !record.isEmpty)
        .map(record => record.id);
});

// 计算是否当前页全选
const isCurrentPageAllSelected = computed(() => {
    const validRecords = currentPageRecordIds.value;
    return validRecords.length > 0 &&
        validRecords.every(id => selectedRecords.value.includes(id));
});

// 计算是否全部记录已选中
const isAllSelected = computed(() => {
    const validRecords = props.filteredRecords;
    return validRecords.length > 0 &&
        validRecords.every(record => selectedRecords.value.includes(record.id));
});

// 切换选择状态
const toggleSelect = (recordId) => {
    if (recordId.startsWith('empty-')) return; // 忽略空行的点击

    const index = selectedRecords.value.indexOf(recordId);
    if (index === -1) {
        selectedRecords.value.push(recordId);
    } else {
        selectedRecords.value.splice(index, 1);
    }
};

// 切换当前页全选
const toggleCurrentPageSelect = () => {
    const validRecords = currentPageRecordIds.value;
    if (isCurrentPageAllSelected.value) {
        // 取消当前页所有选中
        selectedRecords.value = selectedRecords.value.filter(
            id => !validRecords.includes(id)
        );
    } else {
        // 选中当前页所有记录
        validRecords.forEach(id => {
            if (!selectedRecords.value.includes(id)) {
                selectedRecords.value.push(id);
            }
        });
    }
};

// 切换全选
const toggleAllSelect = () => {
    const validRecords = props.filteredRecords;
    if (isAllSelected.value) {
        // 取消所有选中
        selectedRecords.value = [];
    } else {
        // 选中所有记录
        selectedRecords.value = validRecords.map(record => record.id);
    }
};

// 取消批量模式
const cancelBatchMode = () => {
    isBatchMode.value = false;
    selectedRecords.value = [];
};

// 删除选中的记录
const deleteSelectedRecords = () => {
    if (selectedRecords.value.length === 0) {
        alert('请选择要删除的记录');
        return;
    }

    if (confirm(`确定要删除选中的 ${selectedRecords.value.length} 条记录吗？`)) {
        selectedRecords.value.forEach(id => {
            accountStore.deleteRecord(id);
        });
        selectedRecords.value = [];
        isBatchMode.value = false;
    }
};

// 监听筛选结果变化，重置分页
watch(() => props.filteredRecords, () => {
    currentPage.value = 1;
    // 不要在这里清空选中状态
    // selectedRecords.value = [];
}, { deep: true });

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
.select-btn,
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

.select-btn {
    padding: 4px 8px;
    font-size: 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: #fff;
    color: #666;
    cursor: pointer;
    transition: all 0.3s;
}

.select-btn:hover {
    background: #f5f5f5;
}

.select-btn.selected {
    background: #e6f7ff;
    border-color: #1890ff;
    color: #1890ff;
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
    height: calc(5 * (50px + 8px));
    /* 调整行高和间距 */
}

.records {
    display: flex;
    flex-direction: column;
    gap: 8px;
    /* 减小行间距 */
}

.record-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    /* 减小上下内边距 */
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    transition: all 0.3s;
    height: 50px;
    /* 减小行高 */
}

.empty-row {
    background: #f8f9fa;
    box-shadow: none;
    border: 1px dashed #ddd;
}

.empty-content {
    width: 100%;
    height: 100%;
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
    /* 减小类型标签的内边距 */
    border-radius: 4px;
    font-size: 12px;
    /* 稍微减小字体 */
    font-weight: 500;
    min-width: 45px;
    text-align: center;
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
    align-items: center;
    margin-bottom: 2px;
    /* 减小间距 */
}

.record-category {
    font-size: 14px;
    /* 稍微减小字体 */
    font-weight: 500;
    color: #333;
}

.record-amount {
    font-size: 14px;
    /* 稍微减小字体 */
    font-weight: 600;
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
    align-items: center;
    font-size: 12px;
    /* 稍微减小字体 */
    color: #666;
}

.record-actions {
    display: flex;
    gap: 8px;
    /* 减小按钮间距 */
}

.edit-btn,
.delete-btn {
    padding: 4px 8px;
    /* 减小按钮内边距 */
    font-size: 12px;
    /* 减小按钮字体 */
    border: none;
    border-radius: 4px;
    cursor: pointer;
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
    .select-btn,
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

    .batch-actions {
        width: 100%;
        flex-wrap: wrap;
    }

    .batch-actions button {
        flex: 1;
        min-width: 0;
    }
}
</style>