'use client';

import useSWR from 'swr';
import { useState } from 'react';
import {
  Table, Button, Tag, Modal, Form, Input, InputNumber, Select, Switch,
  App, Typography, Popconfirm, Avatar,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, PictureOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { api } from '../../../_lib/api';
import ImageUpload from '../../../components/ImageUpload';
import styles from './platform-services.module.css';

const { Title, Text } = Typography;
const { Option } = Select;

interface PlatformService {
  id: string;
  serviceId: number;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  isActive: boolean;
  categoryName: string;
}

export default function PlatformServicesPage() {
  const [editing, setEditing] = useState<PlatformService | null>(null);
  const [creating, setCreating] = useState(false);
  const [form] = Form.useForm();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const { message } = App.useApp();

  const { data, isLoading, mutate } = useSWR<{ success: boolean; services: PlatformService[] }>(
    '/api/admin/platform-services',
    api.get
  );

  const { data: categories } = useSWR<{ success: boolean; categories: { id: number; serviceName: string }[] }>(
    '/api/admin/service-categories',
    api.get
  );

  const openCreate = () => {
    form.resetFields();
    setImageUrl(null);
    setCreating(true);
  };

  const openEdit = (svc: PlatformService) => {
    setEditing(svc);
    setImageUrl(svc.imageUrl ?? null);
    form.setFieldsValue({
      serviceId: svc.serviceId,
      name: svc.name,
      description: svc.description,
      price: parseFloat(svc.price),
      isActive: svc.isActive,
    });
  };

  const handleCreate = async (values: any) => {
    try {
      await api.post('/api/admin/platform-services', {
        ...values,
        imageUrl: imageUrl ?? undefined,
      });
      message.success('Service created');
      setCreating(false);
      setImageUrl(null);
      mutate();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleEdit = async (values: any) => {
    if (!editing) return;
    try {
      await api.patch(`/api/admin/platform-services/${editing.id}`, {
        ...values,
        imageUrl: imageUrl ?? undefined,
      });
      message.success('Service updated');
      setEditing(null);
      setImageUrl(null);
      mutate();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/admin/platform-services/${id}`);
      message.success('Service deactivated');
      mutate();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  const columns: ColumnsType<PlatformService> = [
    {
      title: '',
      dataIndex: 'imageUrl',
      key: 'image',
      width: 52,
      render: (url: string | null, row: PlatformService) =>
        url ? (
          <Avatar
            src={url}
            shape="square"
            size={36}
            style={{ borderRadius: 6 }}
          />
        ) : (
          <Avatar
            shape="square"
            size={36}
            icon={<PictureOutlined />}
            style={{ borderRadius: 6, background: 'var(--color-bg-subtle, #f5f5f5)', color: '#aaa' }}
          />
        ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: 'Category',
      dataIndex: 'categoryName',
      key: 'categoryName',
      render: (c: string, row: PlatformService) => (
        <Tag color={row.serviceId === 1 ? 'blue' : 'green'}>{c}</Tag>
      ),
    },
    {
      title: 'Price (NPR)',
      dataIndex: 'price',
      key: 'price',
      render: (p: string) => (
        <Text strong style={{ color: 'var(--color-primary)' }}>
          NPR {parseFloat(p).toLocaleString()}
        </Text>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (d: string | null) => d ?? <Text type="secondary">—</Text>,
      ellipsis: true,
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
      width: 90,
      render: (_: unknown, row: PlatformService) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(row)} />
          <Popconfirm
            title="Deactivate this service?"
            onConfirm={() => handleDelete(row.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </div>
      ),
    },
  ];

  const ServiceForm = ({ onFinish }: { onFinish: (v: any) => void }) => (
    <Form form={form} layout="vertical" onFinish={onFinish} style={{ marginTop: 16 }}>
      <Form.Item label="Category" name="serviceId" rules={[{ required: true }]}>
        <Select placeholder="Select category">
          {categories?.categories.map((c) => (
            <Option key={c.id} value={c.id}>{c.serviceName}</Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item label="Service Name" name="name" rules={[{ required: true }]}>
        <Input placeholder="e.g., Bathroom tap repair" />
      </Form.Item>
      <Form.Item label="Description" name="description">
        <Input.TextArea rows={2} />
      </Form.Item>
      <Form.Item label="Price (NPR)" name="price" rules={[{ required: true }]}>
        <InputNumber min={0} style={{ width: '100%' }} prefix="NPR" />
      </Form.Item>
      <Form.Item label="Service Image (CDN)">
        <ImageUpload
          value={imageUrl}
          onChange={setImageUrl}
          folder="services"
          hint="Optional icon/image for this service"
        />
      </Form.Item>
      <Form.Item label="Active" name="isActive" valuePropName="checked" initialValue={true}>
        <Switch />
      </Form.Item>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button onClick={() => { setEditing(null); setCreating(false); setImageUrl(null); }}>Cancel</Button>
        <Button type="primary" htmlType="submit">Save</Button>
      </div>
    </Form>
  );

  return (
    <div>
      <div className={styles.header}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Platform Services</Title>
          <Text type="secondary">Manage service catalog and pricing</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Add Service
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={data?.services ?? []}
        loading={isLoading}
        rowKey="id"
        pagination={{ pageSize: 25, showTotal: (t) => `${t} services` }}
        className={styles.table}
        size="middle"
      />

      <Modal title="Add Service" open={creating} onCancel={() => { setCreating(false); setImageUrl(null); }} footer={null} destroyOnHidden>
        <ServiceForm onFinish={handleCreate} />
      </Modal>

      <Modal title="Edit Service" open={!!editing} onCancel={() => { setEditing(null); setImageUrl(null); }} footer={null} destroyOnHidden>
        <ServiceForm onFinish={handleEdit} />
      </Modal>
    </div>
  );
}
