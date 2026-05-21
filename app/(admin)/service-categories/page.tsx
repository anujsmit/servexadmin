'use client';

import useSWR from 'swr';
import { useState } from 'react';
import {
  Table, Button, Tag, Modal, Form, Input, Switch, App, Typography, ColorPicker,
} from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { api } from '../../../_lib/api';
import styles from './service-categories.module.css';

const { Title, Text } = Typography;

interface ServiceCategory {
  id: number;
  serviceName: string;
  description: string | null;
  mapIconColor: string | null;
  isActive: boolean;
}

export default function ServiceCategoriesPage() {
  const [editing, setEditing] = useState<ServiceCategory | null>(null);
  const [creating, setCreating] = useState(false);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const { data, isLoading, mutate } = useSWR<{ success: boolean; categories: ServiceCategory[] }>(
    '/api/admin/service-categories',
    api.get
  );

  const openCreate = () => {
    form.resetFields();
    setCreating(true);
  };

  const openEdit = (cat: ServiceCategory) => {
    setEditing(cat);
    form.setFieldsValue({
      serviceName: cat.serviceName,
      description: cat.description,
      mapIconColor: cat.mapIconColor,
      isActive: cat.isActive,
    });
  };

  const handleCreate = async (values: any) => {
    try {
      await api.post('/api/admin/service-categories', values);
      message.success('Category created');
      setCreating(false);
      mutate();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleEdit = async (values: any) => {
    if (!editing) return;
    try {
      await api.patch(`/api/admin/service-categories/${editing.id}`, values);
      message.success('Category updated');
      setEditing(null);
      mutate();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  const columns: ColumnsType<ServiceCategory> = [
    {
      title: 'Name',
      dataIndex: 'serviceName',
      key: 'serviceName',
      render: (name: string, row: ServiceCategory) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {row.mapIconColor && (
            <div style={{
              width: 16, height: 16, borderRadius: '50%',
              backgroundColor: row.mapIconColor, flexShrink: 0,
            }} />
          )}
          <Text strong>{name}</Text>
        </div>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (d: string | null) => d ?? <Text type="secondary">—</Text>,
    },
    {
      title: 'Map Color',
      dataIndex: 'mapIconColor',
      key: 'mapIconColor',
      render: (c: string | null) => c ?? <Text type="secondary">—</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? 'Active' : 'Inactive'}</Tag>,
    },
    {
      title: '',
      key: 'actions',
      width: 60,
      render: (_: unknown, row: ServiceCategory) => (
        <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(row)} />
      ),
    },
  ];

  const CategoryForm = ({ onFinish }: { onFinish: (v: any) => void }) => (
    <Form form={form} layout="vertical" onFinish={onFinish} style={{ marginTop: 16 }}>
      <Form.Item label="Service Name" name="serviceName" rules={[{ required: true }]}>
        <Input placeholder="e.g., Carpenter" />
      </Form.Item>
      <Form.Item label="Description" name="description">
        <Input.TextArea rows={2} />
      </Form.Item>
      <Form.Item label="Map Icon Color (hex)" name="mapIconColor">
        <Input placeholder="#2563eb" maxLength={7} />
      </Form.Item>
      <Form.Item label="Active" name="isActive" valuePropName="checked" initialValue={true}>
        <Switch />
      </Form.Item>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button onClick={() => { setEditing(null); setCreating(false); }}>Cancel</Button>
        <Button type="primary" htmlType="submit">Save</Button>
      </div>
    </Form>
  );

  return (
    <div>
      <div className={styles.header}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Service Categories</Title>
          <Text type="secondary">Manage service types (plumber, electrician, etc.)</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Add Category
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={data?.categories ?? []}
        loading={isLoading}
        rowKey="id"
        pagination={false}
        className={styles.table}
      />

      <Modal title="Create Category" open={creating} onCancel={() => setCreating(false)} footer={null} destroyOnHidden>
        <CategoryForm onFinish={handleCreate} />
      </Modal>

      <Modal title="Edit Category" open={!!editing} onCancel={() => setEditing(null)} footer={null} destroyOnHidden>
        <CategoryForm onFinish={handleEdit} />
      </Modal>
    </div>
  );
}
