'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  message,
  Typography,
  Popconfirm,
  Switch,
  Row,
  Col,
  Upload,
  Image,
  Tooltip,
  Spin,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  DeleteOutlined as DeleteIcon,
  WarningOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { api } from '../../../_lib/api';
import styles from './service-categories.module.css';

const { Title, Text } = Typography;

interface ServiceCategory {
  id: number;
  serviceName: string;
  description: string;
  mapIconColor: string;
  isActive: boolean;
  iconType: 'custom';
  iconName: string | null;
  customIconUrl: string | null;
  iconColor: string;
}

export default function ServiceCategoriesPage() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [form] = Form.useForm();
  const [previewColor, setPreviewColor] = useState('#1890ff');
  const [uploading, setUploading] = useState(false);
  const [customIconUrl, setCustomIconUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/service-categories');
      setCategories(response.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      message.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCustomIconUpload = async (file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          setUploading(true);
          setImageError(false);
          
          // Validate file type
          const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
          if (!validTypes.includes(file.type)) {
            message.error('Please upload PNG, JPG, SVG, or WebP format');
            setUploading(false);
            reject(new Error('Invalid file type'));
            return;
          }

          // Validate file size (2MB max)
          if (file.size > 2 * 1024 * 1024) {
            message.error('File must be 2MB or smaller');
            setUploading(false);
            reject(new Error('File too large'));
            return;
          }

          // Compress image if it's not SVG
          let base64 = (reader.result as string).split(',')[1];
          if (file.type !== 'image/svg+xml') {
            base64 = await compressImage(base64, file.type);
          }
          
          const response = await api.post('/admin/upload', {
            fileBase64: base64,
            folder: 'service-icons',
            fileName: file.name,
          });
          
          setCustomIconUrl(response.cdnUrl);
          setImageError(false);
          message.success('Icon uploaded successfully');
          resolve(response.cdnUrl);
        } catch (error) {
          message.error('Failed to upload icon');
          reject(error);
        } finally {
          setUploading(false);
        }
      };
      reader.onerror = reject;
    });
  };

  // ✅ FIX: Use window.Image instead of antd Image
  const compressImage = (base64: string, type: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxSize = 200;
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > maxSize) {
              height = (maxSize / width) * height;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (maxSize / height) * width;
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);
          }
          resolve(canvas.toDataURL(type, 0.8).split(',')[1]);
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = () => {
        reject(new Error('Failed to load image for compression'));
      };
      img.src = `data:${type};base64,${base64}`;
    });
  };

  const handleImageError = () => {
    setImageError(true);
    message.warning('Image could not be loaded. Please upload a valid image.');
  };

  const handleSave = async (values: any) => {
    try {
      const payload = {
        serviceName: values.serviceName,
        description: values.description,
        mapIconColor: values.mapIconColor,
        isActive: values.isActive,
        iconType: 'custom',
        iconName: null,
        customIconUrl: customIconUrl,
        iconColor: values.mapIconColor,
      };
      
      if (editingCategory) {
        await api.patch(`/admin/service-categories/${editingCategory.id}`, payload);
        message.success('Category updated successfully');
      } else {
        await api.post('/admin/service-categories', payload);
        message.success('Category created successfully');
      }
      setModalVisible(false);
      form.resetFields();
      setCustomIconUrl(null);
      setImageError(false);
      fetchCategories();
    } catch (error) {
      console.error('Failed to save category:', error);
      message.error('Failed to save category');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.del(`/admin/service-categories/${id}`);
      message.success('Category deleted successfully');
      fetchCategories();
    } catch (error) {
      console.error('Failed to delete category:', error);
      message.error('Failed to delete category');
    }
  };

  const columns: ColumnsType<ServiceCategory> = [
    {
      title: 'Icon',
      key: 'icon',
      width: 80,
      render: (_, record) => (
        <div className={styles.iconCell}>
          {record.customIconUrl ? (
            <img 
              src={record.customIconUrl} 
              alt={record.serviceName}
              style={{ width: 44, height: 44, objectFit: 'contain' }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                // Show fallback on error
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  const fallback = document.createElement('div');
                  fallback.className = styles.iconPlaceholder;
                  fallback.style.backgroundColor = `${record.iconColor || '#1890ff'}20`;
                  fallback.innerHTML = `<span style="color: ${record.iconColor || '#1890ff'}; font-size: 20px;">${record.serviceName?.charAt(0).toUpperCase()}</span>`;
                  parent.appendChild(fallback);
                }
              }}
            />
          ) : (
            <div 
              className={styles.iconPlaceholder}
              style={{ backgroundColor: `${record.iconColor || '#1890ff'}20` }}
            >
              <span style={{ color: record.iconColor || '#1890ff', fontSize: 20 }}>
                {record.serviceName?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
      ),
    },
    { 
      title: 'Service Name', 
      dataIndex: 'serviceName', 
      key: 'name', 
      width: 200,
      render: (name: string) => <Text strong>{name}</Text>
    },
    { 
      title: 'Description', 
      dataIndex: 'description', 
      key: 'description', 
      ellipsis: true,
      render: (desc: string) => desc || <Text type="secondary">No description</Text>
    },
    {
      title: 'Color',
      dataIndex: 'iconColor',
      key: 'color',
      width: 120,
      render: (color: string) => (
        <div className={styles.colorCell}>
          <div className={styles.colorDot} style={{ backgroundColor: color }} />
          <Text code style={{ fontSize: 12 }}>{color}</Text>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'status',
      width: 100,
      render: (active: boolean) => (
        <Tag color={active ? 'success' : 'default'}>
          {active ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit Category">
            <Button 
              icon={<EditOutlined />} 
              onClick={() => {
                setEditingCategory(record);
                setCustomIconUrl(record.customIconUrl);
                setImageError(false);
                form.setFieldsValue({
                  serviceName: record.serviceName,
                  description: record.description,
                  mapIconColor: record.iconColor || '#1890ff',
                  isActive: record.isActive,
                });
                setPreviewColor(record.iconColor || '#1890ff');
                setModalVisible(true);
              }} 
            />
          </Tooltip>
          <Tooltip title="Delete Category">
            <Popconfirm 
              title="Delete Category" 
              description={`Are you sure you want to delete "${record.serviceName}"?`}
              onConfirm={() => handleDelete(record.id)}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Button danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Service Categories</Title>
          <Text type="secondary">Manage service categories with custom icons for mobile app</Text>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => {
            setEditingCategory(null);
            setCustomIconUrl(null);
            setImageError(false);
            form.resetFields();
            form.setFieldsValue({ 
              isActive: true, 
              mapIconColor: '#1890ff'
            });
            setPreviewColor('#1890ff');
            setModalVisible(true);
          }}
        >
          Add Category
        </Button>
      </div>

      <Card className={styles.tableCard} bordered={false}>
        <Table
          columns={columns}
          dataSource={categories}
          rowKey="id"
          loading={loading}
          pagination={{ 
            pageSize: 10, 
            showSizeChanger: true, 
            showTotal: (total) => `Total ${total} categories` 
          }}
        />
      </Card>

      <Modal
        title={editingCategory ? 'Edit Category' : 'Create New Category'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setCustomIconUrl(null);
          setImageError(false);
          form.resetFields();
        }}
        footer={null}
        width={700}
        destroyOnClose
      >
        <Form 
          form={form} 
          layout="vertical" 
          onFinish={handleSave} 
          initialValues={{ isActive: true, mapIconColor: '#1890ff' }}
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item 
                name="serviceName" 
                label="Service Name" 
                rules={[{ required: true, message: 'Please enter service name' }]}
              >
                <Input placeholder="e.g., Plumber, Electrician" size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                name="mapIconColor" 
                label="Icon Color"
                rules={[{ required: true, message: 'Please select icon color' }]}
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <input 
                    type="color" 
                    value={previewColor}
                    onChange={(e) => {
                      const color = e.target.value;
                      setPreviewColor(color);
                      form.setFieldsValue({ mapIconColor: color });
                    }}
                    style={{ 
                      width: 60, 
                      height: 40, 
                      borderRadius: 8, 
                      cursor: 'pointer',
                      border: '1px solid #e2e8f0',
                      padding: 2,
                    }}
                  />
                  <Input 
                    value={previewColor}
                    onChange={(e) => {
                      const color = e.target.value;
                      setPreviewColor(color);
                      form.setFieldsValue({ mapIconColor: color });
                    }}
                    placeholder="#000000"
                    style={{ width: 120 }}
                  />
                </div>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Brief description of this service" />
          </Form.Item>

          <Form.Item label="Category Icon" required>
            <Upload.Dragger
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              showUploadList={false}
              customRequest={({ file, onSuccess }) => {
                handleCustomIconUpload(file as File).then(onSuccess);
              }}
              style={{ borderRadius: 12 }}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined style={{ color: '#e67e22' }} />
              </p>
              <p className="ant-upload-text">Click or drag file to upload</p>
              <p className="ant-upload-hint">
                Support for PNG, JPG, SVG, WebP. Max size: 2MB
              </p>
            </Upload.Dragger>
            
            {customIconUrl && (
              <div className={styles.customIconPreview}>
                <div className={styles.customIconPreviewInner}>
                  <div style={{ position: 'relative' }}>
                    <img 
                      src={customIconUrl} 
                      alt="Category icon" 
                      style={{ 
                        width: 80, 
                        height: 80, 
                        objectFit: 'contain',
                        borderRadius: 8,
                        border: '1px solid #e8edf2',
                        padding: 8,
                        background: '#ffffff',
                      }}
                      onError={handleImageError}
                    />
                    {imageError && (
                      <div style={{
                        position: 'absolute',
                        bottom: -8,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: '#ff4d4f',
                        color: '#fff',
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 10,
                        whiteSpace: 'nowrap',
                      }}>
                        <WarningOutlined /> Invalid format
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {imageError ? 'Please re-upload a valid image' : 'Icon uploaded successfully'}
                    </Text>
                    <Button 
                      danger 
                      icon={<DeleteIcon />} 
                      size="small" 
                      onClick={() => {
                        setCustomIconUrl(null);
                        setImageError(false);
                      }}
                    >
                      Remove Icon
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Form.Item>
          
          <Form.Item name="isActive" label="Active Status" valuePropName="checked">
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>

          {/* Live Preview */}
          <div className={styles.previewSection}>
            <Text strong>Live Preview (How it appears on mobile app)</Text>
            <div className={styles.previewCard}>
              {customIconUrl && !imageError ? (
                <img 
                  src={customIconUrl} 
                  alt="preview"
                  style={{ width: 48, height: 48, objectFit: 'contain' }}
                  onError={handleImageError}
                />
              ) : (
                <div 
                  className={styles.previewIconPlaceholder}
                  style={{ backgroundColor: `${previewColor}20` }}
                >
                  <span style={{ color: previewColor, fontSize: 24 }}>
                    {form.getFieldValue('serviceName')?.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
              )}
              <div>
                <Text strong style={{ fontSize: 16 }}>
                  {form.getFieldValue('serviceName') || 'Service Name'}
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {form.getFieldValue('description') || 'This is how it will appear on the customer app'}
                </Text>
              </div>
            </div>
          </div>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setModalVisible(false);
                setCustomIconUrl(null);
                setImageError(false);
                form.resetFields();
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={uploading}>
                {editingCategory ? 'Update Category' : 'Create Category'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}