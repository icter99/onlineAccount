<template>
    <div class="record-list">
        <h2>记账记录</h2>

        <div v-if="filteredRecords.length === 0" class="empty-tip">
            暂无记录，快去添加一条吧！
        </div>
        <div v-else>
            <div class="record-item header">
                <span>类型</span>
                <span>金额</span>
                <span>分类</span>
                <span>日期</span>
                <span>备注</span>
                <span>操作</span>
            </div>
            <div v-for="record in paginatedRecords" :key="record.id" class="record-item" :class="record.type">
                <span>{{ record.type }}</span>
                <span :class="record.type">¥{{ record.amount.toFixed(2) }}</span>
                <span>{{ record.category }}</span>
                <span>{{ record.date }}</span>
                <span>{{ record.note || '-' }}</span>
                <div class="action-buttons">
                    <button @click="startEdit(record)" class="edit-btn">编辑</button>
                    <button @click="confirmDelete(record)" class="delete-btn">删除</button>
                </div>
            </div>
        </div>

        <!-- 分页控制 -->
        <div v-if="totalPages > 1" class="pagination">
            <button @click="currentPage = 1" :disabled="currentPage === 1" class="page-btn">首页</button>
            <button @click="currentPage--" :disabled="currentPage === 1" class="page-btn">上一页</button>
            <span class="page-info">第 {{ currentPage }} 页，共 {{ totalPages }} 页</span>
            <button @click="currentPage++" :disabled="currentPage === totalPages" class="page-btn">下一页</button>
            <button @click="currentPage = totalPages" :disabled="currentPage === totalPages"
                class="page-btn">末页</button>
        </div>

        <!-- 编辑模态框 -->
        <div v-if="showEditModal" class="modal-overlay" @click="cancelEdit">
            <div class="modal-content" @click.stop>
                <h3>编辑记录</h3>
                <form @submit.prevent="saveEdit">
                    <div class="form-group">
                        <label>类型</label>
                        <select v-model="editingRecord.type">
                            <option value="支出">支出</option>
                            <option value="收入">收入</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>金额</label>
                        <input v-model.number="editingRecord.amount" type="number" step="0.01" required>
                    </div>

                    <div class="form-group">
                        <label>分类</label>
                        <select v-model="editingRecord.category">
                            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>日期</label>
                        <input v-model="editingRecord.date" type="date" required>
                    </div>

                    <div class="form-group">
                        <label>备注</label>
                        <input v-model="editingRecord.note" type="text" placeholder="备注信息">
                    </div>

                    <div class="modal-actions">
                        <button type="button" @click="cancelEdit" class="cancel-btn">取消</button>
                        <button type="submit" class="save-btn">保存</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAccountStore } from '@/stores/accountStore';

const props = defineProps({
    filteredRecords: {
        type: Array,
        default: () => []
    }
});

// 定义emit事件，用于通知父组件重新筛选
const emit = defineEmits(['refresh-filter']);

const accountStore = useAccountStore();

// 分页相关
const currentPage = ref(1);
const pageSize = ref(10);

// 编辑相关
const showEditModal = ref(false);
const editingRecord = ref({});
const originalRecord = ref({});

// 分类选项
const categories = ['餐饮', '交通', '购物', '娱乐', '工资', '医疗', '教育', '住房', '通讯', '服装', '日用品', '奖金', '投资', '兼职', '礼金', '退款', '其他'];

// 分页计算
const totalPages = computed(() => Math.ceil(props.filteredRecords.length / pageSize.value));

const paginatedRecords = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    const end = start + pageSize.value;
    return props.filteredRecords.slice(start, end);
});

// 开始编辑
const startEdit = (record) => {
    originalRecord.value = { ...record };
    editingRecord.value = { ...record };
    showEditModal.value = true;
};

// 保存编辑
const saveEdit = () => {
    if (editingRecord.value.amount <= 0) {
        alert('金额必须大于 0');
        return;
    }

    accountStore.updateRecord(editingRecord.value);
    showEditModal.value = false;

    // 通知父组件重新筛选
    emit('refresh-filter');
};

// 取消编辑
const cancelEdit = () => {
    showEditModal.value = false;
    editingRecord.value = {};
    originalRecord.value = {};
};

// 确认删除
const confirmDelete = (record) => {
    if (confirm(`确定要删除这条记录吗？\n${record.type} - ¥${record.amount.toFixed(2)} - ${record.category}`)) {
        accountStore.deleteRecord(record.id);

        // 通知父组件重新筛选
        emit('refresh-filter');
    }
};
</script>

<style scoped>
.record-list {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    margin-bottom: 20px;
}

.record-list h2 {
    margin: 0;
    padding: 20px 20px 15px;
    background: #f8f9fa;
    border-bottom: 1px solid #eee;
    color: #333;
}

.empty-tip {
    text-align: center;
    color: #666;
    padding: 40px 20px;
}

.record-item {
    display: grid;
    grid-template-columns: 60px 80px 70px 100px 1fr 100px;
    align-items: center;
    padding: 12px 20px;
    border-bottom: 1px solid #eee;
    font-size: 14px;
}

.record-item.header {
    font-weight: bold;
    background: #f8f9fa;
    border-bottom: 2px solid #ddd;
    font-size: 12px;
    text-transform: uppercase;
    color: #666;
}

.收入 {
    color: #42b883;
}

.支出 {
    color: #ff4757;
}

.action-buttons {
    display: flex;
    gap: 4px;
}

.edit-btn,
.delete-btn {
    padding: 3px 6px;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    font-size: 11px;
    transition: background 0.3s;
}

.edit-btn {
    background: #3742fa;
    color: white;
}

.edit-btn:hover {
    background: #2f3542;
}

.delete-btn {
    background: #ff4757;
    color: white;
}

.delete-btn:hover {
    background: #ff6b81;
}

/* 分页样式 */
.pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    padding: 15px 20px;
    background: #f8f9fa;
    border-top: 1px solid #eee;
}

.page-btn {
    padding: 6px 10px;
    border: 1px solid #ddd;
    background: white;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s;
    font-size: 12px;
}

.page-btn:hover:not(:disabled) {
    background: #f8f9fa;
    border-color: #007bff;
}

.page-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.page-info {
    color: #666;
    font-size: 12px;
}

/* 模态框样式 */
.modal-overlay {
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

.modal-content {
    background: white;
    padding: 30px;
    border-radius: 8px;
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
}

.modal-content h3 {
    margin-bottom: 20px;
    color: #333;
}

.form-group {
    margin-bottom: 15px;
}

.form-group label {
    display: block;
    margin-bottom: 5px;
    color: #333;
    font-weight: 500;
}

.form-group input,
.form-group select {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 20px;
}

.cancel-btn,
.save-btn {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.3s;
}

.cancel-btn {
    background: #6c757d;
    color: white;
}

.cancel-btn:hover {
    background: #5a6268;
}

.save-btn {
    background: #42b883;
    color: white;
}

.save-btn:hover {
    background: #369970;
}

@media (max-width: 768px) {
    .record-item {
        grid-template-columns: 1fr;
        gap: 5px;
        text-align: left;
        padding: 15px 20px;
    }

    .record-item.header {
        display: none;
    }

    .record-item:not(.header) {
        border: none;
        border-bottom: 1px solid #eee;
    }

    .record-item span {
        display: block;
        margin-bottom: 5px;
    }

    .record-item span:before {
        content: attr(data-label) ': ';
        font-weight: bold;
        color: #666;
    }

    .action-buttons {
        margin-top: 10px;
        justify-content: flex-end;
    }

    .pagination {
        flex-wrap: wrap;
        gap: 5px;
    }
}
</style>