<template>
    <div>
      <el-form ref="formRef" :model="form" label-width="120px">
        <el-form-item label="公告标题">
          <el-input v-model="form.title"></el-input>
        </el-form-item>
        <el-form-item label="公告内容">
          <el-input type="textarea" v-model="form.content"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submitForm">提交</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
      <el-table :data="announcements" style="width: 100%">
        <el-table-column prop="title" label="标题" width="180"></el-table-column>
        <el-table-column prop="content" label="内容"></el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="scope">
            <el-button size="mini" @click="editAnnouncement(scope.row)">编辑</el-button>
            <el-button size="mini" type="danger" @click="deleteAnnouncement(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, reactive, ref, toRefs } from 'vue';
  import { ElForm } from 'element-plus';
  
  interface Announcement {
    id: number;
    title: string;
    content: string;
  }
  
  export default defineComponent({
    setup() {
      const announcements = reactive<Announcement[]>([]);
      const form = reactive({
        id: 0,
        title: '',
        content: '',
      });
  
      const formRef = ref<typeof ElForm | null>(null);
  
      const submitForm = () => {
        if (form.title && form.content) {
          if (form.id === 0) {
            // 添加新公告
            announcements.push({
              id: Math.max(0, ...announcements.map(a => a.id)) + 1,
              title: form.title,
              content: form.content,
            });
          } else {
            // 更新现有公告
            const index = announcements.findIndex(a => a.id === form.id);
            if (index !== -1) {
              announcements[index] = { ...form };
            }
          }
          resetForm();
        } else {
          alert('请填写标题和内容！');
        }
      };
  
      const resetForm = () => {
        if (formRef.value) {
          formRef.value.resetFields();
        }
        form.id = 0;
        form.title = '';
        form.content = '';
      };
  
      const editAnnouncement = (announcement: Announcement) => {
        form.id = announcement.id;
        form.title = announcement.title;
        form.content = announcement.content;
      };
  
      const deleteAnnouncement = (announcement: Announcement) => {
        const index = announcements.findIndex(a => a.id === announcement.id);
        if (index !== -1) {
          announcements.splice(index, 1);
        }
      };
  
      return {
        ...toRefs({ announcements, form }),
        formRef,
        submitForm,
        resetForm,
        editAnnouncement,
        deleteAnnouncement,
      };
    },
  });
  </script>
  
  <style>
  /* 可以在这里加入一些 CSS 样式 */
  </style>
  