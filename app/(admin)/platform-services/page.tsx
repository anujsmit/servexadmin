'use client';

import useSWR from 'swr';
import { useState } from 'react';
import {
  Table, Button, Tag, Modal, Form, Input, InputNumber, Select, Switch,
  App, Typography, Popconfirm, Avatar, Card, Space, Spin,
  Tooltip, message as antdMessage,
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, PictureOutlined, 
  ReloadOutlined, DeleteRowOutlined, ExclamationCircleOutlined 
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { api } from '../../../_lib/api';
import ImageUpload from '../../../components/ImageUpload';
import styles from './platform-services.module.css';

const { Title, Text } = Typography;
const { confirm } = Modal;
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

interface Category {
  id: number;
  serviceName: string;
}

export default function PlatformServicesPage() {
  const [editing, setEditing] = useState<PlatformService | null>(null);
  const [creating, setCreating] = useState(false);
  const [form] = Form.useForm();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const { message } = App.useApp();

  // Fetch platform services
  const { data, isLoading, mutate } = useSWR<{ success: boolean; services: PlatformService[] }>(
    '/admin/platform-services',
    (url) => api.get(url, true),
    {
      onError: (error) => {
        console.error('Failed to fetch services:', error);
        message.error('Failed to load services');
      }
    }
  );

  // Fetch categories for dropdown
  const { data: categoriesData, isLoading: categoriesLoading } = useSWR<{ success: boolean; categories: Category[] }>(
    '/admin/service-categories',
    (url) => api.get(url, true),
    {
      onError: (error) => {
        console.error('Failed to fetch categories:', error);
        message.error('Failed to load categories');
      }
    }
  );

  const categories = categoriesData?.categories ?? [];
  const services = data?.services ?? [];

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
    if (submitting) return;
    
    try {
      setSubmitting(true);
      const payload = {
        serviceId: values.serviceId,
        name: values.name,
        description: values.description || null,
        price: values.price,
        imageUrl: imageUrl || null,
        isActive: values.isActive !== undefined ? values.isActive : true,
        duration_minutes: values.duration_minutes || null,
      };
      
      console.log('Creating service with payload:', payload);
      const response = await api.post('/admin/platform-services', payload);
      console.log('Create response:', response);
      
      message.success('Service created successfully');
      setCreating(false);
      setImageUrl(null);
      form.resetFields();
      mutate();
    } catch (err: unknown) {
      console.error('Create error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create service';
      message.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (values: any) => {
    if (!editing || submitting) return;
    
    try {
      setSubmitting(true);
      const payload: any = {
        serviceId: values.serviceId,
        name: values.name,
        description: values.description || null,
        price: values.price,
        isActive: values.isActive !== undefined ? values.isActive : true,
      };
      
      if (imageUrl !== editing.imageUrl) {
        payload.imageUrl = imageUrl || null;
      }
      
      if (values.duration_minutes !== undefined) {
        payload.duration_minutes = values.duration_minutes;
      }
      
      console.log('Updating service with payload:', payload);
      const response = await api.patch(`/admin/platform-services/${editing.id}`, payload);
      console.log('Update response:', response);
      
      message.success('Service updated successfully');
      setEditing(null);
      setImageUrl(null);
      form.resetFields();
      mutate();
    } catch (err: unknown) {
      console.error('Update error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update service';
      message.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // PERMANENT DELETE - Single service
  const handleDelete = async (id: string, name: string) => {
    setDeleteLoading(id);
    try {
      console.log(`Attempting to delete service with ID: ${id}`);
      const response = await api.del(`/admin/platform-services/${id}`);
      console.log('Delete response:', response);
      
      message.success(`Service "${name}" permanently deleted`);
      mutate();
    } catch (err: unknown) {
      console.error('Delete error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete service';
      message.error(errorMessage);
      
      // Log more details if available
      if (err && typeof err === 'object' && 'response' in err) {
        const error = err as any;
        console.error('Error response:', error.response?.data);
        message.error(error.response?.data?.message || errorMessage);
      }
    } finally {
      setDeleteLoading(null);
    }
  };

  // BULK DELETE - Multiple services at once
  const handleBulkDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Please select services to delete');
      return;
    }

    const selectedServices = services.filter(s => selectedRowKeys.includes(s.id));
    const serviceNames = selectedServices.map(s => s.name).join(', ');
    
    confirm({
      title: 'Permanently Delete Services',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>Are you sure you want to permanently delete the following services?</p>
          <p style={{ color: '#ff4d4f', fontWeight: 'bold', marginTop: 8 }}>
            {serviceNames.length > 100 ? `${serviceNames.substring(0, 100)}...` : serviceNames}
          </p>
          <p style={{ marginTop: 8, color: '#faad14' }}>
            ⚠️ This action cannot be undone. All service data will be permanently removed.
          </p>
        </div>
      ),
      okText: 'Yes, Delete All',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setBulkDeleting(true);
          console.log(`Bulk deleting ${selectedRowKeys.length} services:`, selectedRowKeys);
          
          const response = await api.post('/admin/platform-services/bulk-delete', { ids: selectedRowKeys });
          console.log('Bulk delete response:', response);
          
          message.success(`${selectedRowKeys.length} service(s) permanently deleted`);
          setSelectedRowKeys([]);
          mutate();
        } catch (err: unknown) {
          console.error('Bulk delete error:', err);
          const errorMessage = err instanceof Error ? err.message : 'Failed to delete services';
          message.error(errorMessage);
          
          if (err && typeof err === 'object' && 'response' in err) {
            const error = err as any;
            console.error('Error response:', error.response?.data);
            message.error(error.response?.data?.message || errorMessage);
          }
        } finally {
          setBulkDeleting(false);
        }
      },
    });
  };

  // Row selection configuration
  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
  };

  const columns: ColumnsType<PlatformService> = [
    {
      title: 'Image',
      dataIndex: 'imageUrl',
      key: 'image',
      width: 80,
      render: (url: string | null) => (
        url ? (
          <Avatar
            src={url}
            shape="square"
            size={48}
            style={{ borderRadius: 8, objectFit: 'cover' }}
          />
        ) : (
          <Avatar
            shape="square"
            size={48}
            icon={<PictureOutlined />}
            style={{ borderRadius: 8, background: '#f5f5f5', color: '#aaa' }}
          />
        )
      ),
    },
    {
      title: 'Service Name',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: 'Category',
      dataIndex: 'categoryName',
      key: 'categoryName',
      width: 150,
      render: (categoryName: string, record: PlatformService) => (
        <Tag color={record.serviceId === 1 ? 'blue' : 'geekblue'}>{categoryName}</Tag>
      ),
    },
    {
      title: 'Price (NPR)',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      render: (price: string) => (
        <Text strong style={{ color: '#e67e22' }}>
          रु {parseFloat(price).toLocaleString()}
        </Text>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (description: string | null) => description ?? <Text type="secondary">—</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'default'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit Service">
            <Button 
              icon={<EditOutlined />} 
              size="small" 
              onClick={() => openEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Permanently Delete">
            <Popconfirm
              title="Delete Service"
              description={`Are you sure you want to permanently delete "${record.name}"? This action cannot be undone.`}
              onConfirm={() => handleDelete(record.id, record.name)}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true, loading: deleteLoading === record.id }}
            >
              <Button 
                icon={<DeleteOutlined />} 
                size="small" 
                danger 
                loading={deleteLoading === record.id}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const ServiceForm = ({ onFinish, isEditing = false }: { onFinish: (v: any) => void; isEditing?: boolean }) => (
    <Form form={form} layout="vertical" onFinish={onFinish} style={{ marginTop: 16 }}>
      <Form.Item 
        label="Category" 
        name="serviceId" 
        rules={[{ required: true, message: 'Please select a category' }]}
      >
        <Select 
          placeholder="Select category" 
          size="large"
          loading={categoriesLoading}
          disabled={submitting}
          showSearch
          optionFilterProp="children"
        >
          {categories.map((category) => (
            <Option key={category.id} value={category.id}>
              {category.serviceName}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item 
        label="Service Name" 
        name="name" 
        rules={[{ required: true, message: 'Please enter service name' }]}
      >
        <Input 
          placeholder="e.g., Bathroom tap repair" 
          size="large" 
          disabled={submitting}
        />
      </Form.Item>

      <Form.Item 
        label="Description" 
        name="description"
        tooltip="Detailed description of the service"
      >
        <Input.TextArea 
          rows={3} 
          placeholder="Detailed description of the service" 
          disabled={submitting}
        />
      </Form.Item>

      <Form.Item 
        label="Price (NPR)" 
        name="price" 
        rules={[{ required: true, message: 'Please enter price' }]}
      >
        <InputNumber 
          min={0} 
          step={100}
          style={{ width: '100%' }} 
          prefix="रु"
          size="large"
          placeholder="Enter price in NPR"
          disabled={submitting}
        />
      </Form.Item>

      <Form.Item 
        label="Duration (minutes)" 
        name="duration_minutes"
        tooltip="Estimated time to complete the service (optional)"
      >
        <InputNumber 
          min={15}
          step={15}
          style={{ width: '100%' }} 
          size="large"
          placeholder="Enter duration in minutes"
          disabled={submitting}
        />
      </Form.Item>

      <Form.Item 
        label="Service Image" 
        name="imageUrl"
        tooltip="Optional image for this service"
      >
        <ImageUpload
          value={imageUrl}
          onChange={setImageUrl}
          onUploadStart={() => setUploading(true)}
          onUploadEnd={() => setUploading(false)}
          folder="platform-services"
          hint="Recommended: 200x200px, JPG/PNG"
        />
      </Form.Item>

      <Form.Item 
        label="Status" 
        name="isActive" 
        valuePropName="checked" 
        initialValue={true}
        tooltip="Active services will be visible to customers"
      >
        <Switch 
          checkedChildren="Active" 
          unCheckedChildren="Inactive" 
          disabled={submitting}
        />
      </Form.Item>

      <Form.Item>
        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button 
            onClick={() => { 
              setEditing(null); 
              setCreating(false); 
              setImageUrl(null); 
              form.resetFields();
            }}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={submitting || uploading}
          >
            {isEditing ? 'Update Service' : 'Create Service'}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );

  if (isLoading && !data) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" tip="Loading services..." />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Platform Services</Title>
          <Text type="secondary">Manage service catalog and pricing for customer app</Text>
        </div>
        <Space>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={() => mutate()}
            disabled={isLoading}
          >
            Refresh
          </Button>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={openCreate}
          >
            Add Service
          </Button>
        </Space>
      </div>

      <Card className={styles.tableCard} bordered={false}>
        {selectedRowKeys.length > 0 && (
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text type="secondary">
              {selectedRowKeys.length} service(s) selected
            </Text>
            <Space>
              <Button 
                danger
                icon={<DeleteRowOutlined />}
                onClick={handleBulkDelete}
                loading={bulkDeleting}
              >
                Delete Selected ({selectedRowKeys.length})
              </Button>
            </Space>
          </div>
        )}
        
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={services}
          loading={isLoading}
          rowKey="id"
          scroll={{ x: 1000 }}
          pagination={{ 
            pageSize: 20, 
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} services`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          className={styles.table}
          size="middle"
        />
      </Card>

      <Modal
        title="Add New Service"
        open={creating}
        onCancel={() => { 
          setCreating(false); 
          setImageUrl(null); 
          form.resetFields();
        }}
        footer={null}
        width={600}
        destroyOnClose
      >
        <ServiceForm onFinish={handleCreate} isEditing={false} />
      </Modal>

      <Modal
        title="Edit Service"
        open={!!editing}
        onCancel={() => { 
          setEditing(null); 
          setImageUrl(null); 
          form.resetFields();
        }}
        footer={null}
        width={600}
        destroyOnClose
      >
        <ServiceForm onFinish={handleEdit} isEditing={true} />
      </Modal>
    </div>
  );
}