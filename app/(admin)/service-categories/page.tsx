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
  Tooltip,
  InputNumber,
  Breadcrumb,
  Empty,
  App,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  DeleteOutlined as DeleteIcon,
  WarningOutlined,
  ArrowLeftOutlined,
  FolderOutlined,
  FileOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  FolderOpenOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { api } from '../../../_lib/api';
import styles from './service-categories.module.css';

const { Title, Text } = Typography;

// Level 1: Service Category (Main Folder)
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

// Level 2: Sub-Category (Sub-Folder)
interface SubCategory {
  id: string;
  serviceId: number;
  name: string;
  description: string;
  price: string;
  imageUrl: string | null;
  isActive: boolean;
  isPopular: boolean;
  duration_minutes: number | null;
  category: string | null;
  createdAt: string;
  updatedAt: string;
  serviceItemsCount?: number; // ✅ Added this field
}

// Level 3: Service Item (File)
interface ServiceItem {
  id: string;
  platformServiceId: string;
  name: string;
  description: string;
  price: string;
  durationMinutes: number | null;
  isActive: boolean;
  isPopular: boolean;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

// Navigation state (like file explorer)
interface NavigationState {
  categoryId: number | null;
  categoryName: string | null;
  subCategoryId: string | null;
  subCategoryName: string | null;
}

export default function ServiceCategoriesPage() {
  const { message } = App.useApp();

  // Level 1: Category state
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [categoryForm] = Form.useForm();
  const [previewColor, setPreviewColor] = useState('#1890ff');
  const [uploading, setUploading] = useState(false);
  const [customIconUrl, setCustomIconUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  // Level 2: Sub-Category state
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [subCategoryLoading, setSubCategoryLoading] = useState(false);
  const [subCategoryModalVisible, setSubCategoryModalVisible] = useState(false);
  const [editingSubCategory, setEditingSubCategory] = useState<SubCategory | null>(null);
  const [subCategoryForm] = Form.useForm();
  const [subCategoryImageUrl, setSubCategoryImageUrl] = useState<string | null>(null);
  const [subCategoryImageError, setSubCategoryImageError] = useState(false);
  const [subCategoryUploading, setSubCategoryUploading] = useState(false);

  // Level 3: Service Item state
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const [serviceItemLoading, setServiceItemLoading] = useState(false);
  const [serviceItemModalVisible, setServiceItemModalVisible] = useState(false);
  const [editingServiceItem, setEditingServiceItem] = useState<ServiceItem | null>(null);
  const [serviceItemForm] = Form.useForm();
  const [serviceItemImageUrl, setServiceItemImageUrl] = useState<string | null>(null);
  const [serviceItemImageError, setServiceItemImageError] = useState(false);
  const [serviceItemUploading, setServiceItemUploading] = useState(false);

  // Navigation state
  const [navigation, setNavigation] = useState<NavigationState>({
    categoryId: null,
    categoryName: null,
    subCategoryId: null,
    subCategoryName: null,
  });

  // ============================================
  // FETCH FUNCTIONS
  // ============================================

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

  const fetchSubCategories = async (serviceId: number) => {
    setSubCategoryLoading(true);
    try {
      const response = await api.get(`/admin/platform-services?serviceId=${serviceId}`);
      // ✅ The backend now returns serviceItemsCount
      setSubCategories(response.platformServices || []);
    } catch (error) {
      console.error('Failed to fetch sub-categories:', error);
      message.error('Failed to load sub-categories');
    } finally {
      setSubCategoryLoading(false);
    }
  };

  const fetchServiceItems = async (platformServiceId: string) => {
    setServiceItemLoading(true);
    try {
      const response = await api.get(`/admin/service-items?platformServiceId=${platformServiceId}`);
      setServiceItems(response.serviceItems || []);
    } catch (error) {
      console.error('Failed to fetch service items:', error);
      message.error('Failed to load service items');
    } finally {
      setServiceItemLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (navigation.categoryId) {
      fetchSubCategories(navigation.categoryId);
    }
  }, [navigation.categoryId]);

  useEffect(() => {
    if (navigation.subCategoryId) {
      fetchServiceItems(navigation.subCategoryId);
    }
  }, [navigation.subCategoryId]);

  // ============================================
  // LEVEL 1: CATEGORY HANDLERS
  // ============================================

  const handleCategoryIconUpload = async (file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          setUploading(true);
          setImageError(false);
          
          const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
          if (!validTypes.includes(file.type)) {
            message.error('Please upload PNG, JPG, SVG, or WebP format');
            setUploading(false);
            reject(new Error('Invalid file type'));
            return;
          }

          if (file.size > 2 * 1024 * 1024) {
            message.error('File must be 2MB or smaller');
            setUploading(false);
            reject(new Error('File too large'));
            return;
          }

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

  const handleSaveCategory = async (values: any) => {
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
        const response = await api.post('/admin/service-categories', payload);
        if (response.category?.id) {
          setNavigation({
            categoryId: response.category.id,
            categoryName: response.category.serviceName,
            subCategoryId: null,
            subCategoryName: null,
          });
        }
        message.success('Category created successfully');
      }
      setCategoryModalVisible(false);
      categoryForm.resetFields();
      setCustomIconUrl(null);
      setImageError(false);
      fetchCategories();
    } catch (error) {
      console.error('Failed to save category:', error);
      message.error('Failed to save category');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      await api.del(`/admin/service-categories/${id}`);
      message.success('Category deleted successfully');
      if (navigation.categoryId === id) {
        setNavigation({
          categoryId: null,
          categoryName: null,
          subCategoryId: null,
          subCategoryName: null,
        });
        setSubCategories([]);
        setServiceItems([]);
      }
      fetchCategories();
    } catch (error) {
      console.error('Failed to delete category:', error);
      message.error('Failed to delete category');
    }
  };

  // ============================================
  // LEVEL 2: SUB-CATEGORY HANDLERS
  // ============================================

  const handleSubCategoryImageUpload = async (file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          setSubCategoryUploading(true);
          setSubCategoryImageError(false);
          
          const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
          if (!validTypes.includes(file.type)) {
            message.error('Please upload PNG, JPG, or WebP format');
            setSubCategoryUploading(false);
            reject(new Error('Invalid file type'));
            return;
          }

          if (file.size > 2 * 1024 * 1024) {
            message.error('File must be 2MB or smaller');
            setSubCategoryUploading(false);
            reject(new Error('File too large'));
            return;
          }

          let base64 = (reader.result as string).split(',')[1];
          base64 = await compressImage(base64, file.type);
          
          const response = await api.post('/admin/upload', {
            fileBase64: base64,
            folder: 'platform-services',
            fileName: file.name,
          });
          
          setSubCategoryImageUrl(response.cdnUrl);
          setSubCategoryImageError(false);
          message.success('Image uploaded successfully');
          resolve(response.cdnUrl);
        } catch (error) {
          message.error('Failed to upload image');
          reject(error);
        } finally {
          setSubCategoryUploading(false);
        }
      };
      reader.onerror = reject;
    });
  };

  const handleSaveSubCategory = async (values: any) => {
    if (!navigation.categoryId) {
      message.error('Please select a category first');
      return;
    }

    try {
      const payload = {
        serviceId: navigation.categoryId,
        name: values.name.trim(),
        description: values.description?.trim() || null,
        price: 0,
        imageUrl: subCategoryImageUrl || null,
        isActive: values.isActive ?? true,
        isPopular: values.isPopular || false,
        duration_minutes: null,
        category: null,
        thumbnail_url: null,
        is_featured: false,
      };

      console.log('Sub-category payload:', payload);

      if (editingSubCategory) {
        await api.patch(`/admin/platform-services/${editingSubCategory.id}`, payload);
        message.success('Sub-category updated successfully');
      } else {
        await api.post('/admin/platform-services', payload);
        message.success('Sub-category created successfully');
      }
      
      setSubCategoryModalVisible(false);
      subCategoryForm.resetFields();
      setSubCategoryImageUrl(null);
      setSubCategoryImageError(false);
      
      if (navigation.categoryId) {
        fetchSubCategories(navigation.categoryId);
      }
    } catch (error) {
      console.error('Failed to save sub-category:', error);
      if (error instanceof Error) {
        message.error(`Failed to save: ${error.message}`);
      } else {
        message.error('Failed to save sub-category');
      }
    }
  };

  const handleDeleteSubCategory = async (id: string) => {
    try {
      await api.del(`/admin/platform-services/${id}`);
      message.success('Sub-category deleted successfully');
      if (navigation.subCategoryId === id) {
        setNavigation(prev => ({
          ...prev,
          subCategoryId: null,
          subCategoryName: null,
        }));
        setServiceItems([]);
      }
      if (navigation.categoryId) {
        fetchSubCategories(navigation.categoryId);
      }
    } catch (error) {
      console.error('Failed to delete sub-category:', error);
      message.error('Failed to delete sub-category');
    }
  };

  // ============================================
  // LEVEL 3: SERVICE ITEM HANDLERS
  // ============================================

  const handleServiceItemImageUpload = async (file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          setServiceItemUploading(true);
          setServiceItemImageError(false);
          
          const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
          if (!validTypes.includes(file.type)) {
            message.error('Please upload PNG, JPG, or WebP format');
            setServiceItemUploading(false);
            reject(new Error('Invalid file type'));
            return;
          }

          if (file.size > 2 * 1024 * 1024) {
            message.error('File must be 2MB or smaller');
            setServiceItemUploading(false);
            reject(new Error('File too large'));
            return;
          }

          let base64 = (reader.result as string).split(',')[1];
          base64 = await compressImage(base64, file.type);
          
          const response = await api.post('/admin/upload', {
            fileBase64: base64,
            folder: 'service-items',
            fileName: file.name,
          });
          
          setServiceItemImageUrl(response.cdnUrl);
          setServiceItemImageError(false);
          message.success('Image uploaded successfully');
          resolve(response.cdnUrl);
        } catch (error) {
          message.error('Failed to upload image');
          reject(error);
        } finally {
          setServiceItemUploading(false);
        }
      };
      reader.onerror = reject;
    });
  };

  const handleSaveServiceItem = async (values: any) => {
    if (!navigation.subCategoryId) {
      message.error('Please select a sub-category first');
      return;
    }

    try {
      const payload = {
        platformServiceId: navigation.subCategoryId,
        name: values.name.trim(),
        description: values.description?.trim() || null,
        price: values.price,
        durationMinutes: values.durationMinutes ? parseInt(values.durationMinutes) : null,
        isActive: values.isActive ?? true,
        isPopular: values.isPopular || false,
        imageUrl: serviceItemImageUrl || null,
      };

      console.log('Service item payload:', payload);

      if (editingServiceItem) {
        await api.patch(`/admin/service-items/${editingServiceItem.id}`, payload);
        message.success('Service item updated successfully');
      } else {
        await api.post('/admin/service-items', payload);
        message.success('Service item created successfully');
      }
      
      setServiceItemModalVisible(false);
      serviceItemForm.resetFields();
      setServiceItemImageUrl(null);
      setServiceItemImageError(false);
      
      if (navigation.subCategoryId) {
        fetchServiceItems(navigation.subCategoryId);
        // Also refresh sub-categories to update the item count
        if (navigation.categoryId) {
          fetchSubCategories(navigation.categoryId);
        }
      }
    } catch (error) {
      console.error('Failed to save service item:', error);
      if (error instanceof Error) {
        message.error(`Failed to save: ${error.message}`);
      } else {
        message.error('Failed to save service item');
      }
    }
  };

  const handleDeleteServiceItem = async (id: string) => {
    try {
      await api.del(`/admin/service-items/${id}`);
      message.success('Service item deleted successfully');
      if (navigation.subCategoryId) {
        fetchServiceItems(navigation.subCategoryId);
        // Also refresh sub-categories to update the item count
        if (navigation.categoryId) {
          fetchSubCategories(navigation.categoryId);
        }
      }
    } catch (error) {
      console.error('Failed to delete service item:', error);
      message.error('Failed to delete service item');
    }
  };

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

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

  // ============================================
  // TABLE COLUMNS
  // ============================================

  // Level 1: Category columns
  const categoryColumns: ColumnsType<ServiceCategory> = [
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
      title: 'Category Name', 
      dataIndex: 'serviceName', 
      key: 'name', 
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
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="Open Sub-Categories">
            <Button 
              type="primary"
              icon={<FolderOpenOutlined />} 
              onClick={() => {
                setNavigation({
                  categoryId: record.id,
                  categoryName: record.serviceName,
                  subCategoryId: null,
                  subCategoryName: null,
                });
                setServiceItems([]);
              }}
            >
              Open
            </Button>
          </Tooltip>
          <Tooltip title="Edit Category">
            <Button 
              icon={<EditOutlined />} 
              onClick={() => {
                setEditingCategory(record);
                setCustomIconUrl(record.customIconUrl);
                setImageError(false);
                categoryForm.setFieldsValue({
                  serviceName: record.serviceName,
                  description: record.description,
                  mapIconColor: record.iconColor || '#1890ff',
                  isActive: record.isActive,
                });
                setPreviewColor(record.iconColor || '#1890ff');
                setCategoryModalVisible(true);
              }} 
            />
          </Tooltip>
          <Tooltip title="Delete Category">
            <Popconfirm 
              title="Delete Category" 
              description={`Are you sure you want to delete "${record.serviceName}"? This will also delete all sub-categories and service items.`}
              onConfirm={() => handleDeleteCategory(record.id)}
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

  // Level 2: Sub-Category columns
  const subCategoryColumns: ColumnsType<SubCategory> = [
    {
      title: '',
      key: 'folder',
      width: 50,
      render: () => <FolderOutlined style={{ fontSize: 20, color: '#faad14' }} />,
    },
    { 
      title: 'Sub-Category Name', 
      dataIndex: 'name', 
      key: 'name',
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
      title: 'Popular',
      dataIndex: 'isPopular',
      key: 'popular',
      width: 100,
      render: (popular: boolean) => (
        <Tag color={popular ? 'orange' : 'default'}>
          {popular ? '🔥 Popular' : '-'}
        </Tag>
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
      title: 'Items',
      key: 'itemsCount',
      width: 80,
      render: (_, record) => (
        <Tag color="blue">
          {record.serviceItemsCount || 0}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="Open Service Items">
            <Button 
              type="primary"
              icon={<FileTextOutlined />} 
              onClick={() => {
                setNavigation(prev => ({
                  ...prev,
                  subCategoryId: record.id,
                  subCategoryName: record.name,
                }));
              }}
            >
              Open
            </Button>
          </Tooltip>
          <Tooltip title="Edit Sub-Category">
            <Button 
              icon={<EditOutlined />} 
              onClick={() => {
                setEditingSubCategory(record);
                setSubCategoryImageUrl(record.imageUrl);
                setSubCategoryImageError(false);
                subCategoryForm.setFieldsValue({
                  name: record.name,
                  description: record.description,
                  isActive: record.isActive,
                  isPopular: record.isPopular,
                });
                setSubCategoryModalVisible(true);
              }} 
            />
          </Tooltip>
          <Tooltip title="Delete Sub-Category">
            <Popconfirm 
              title="Delete Sub-Category" 
              description={`Are you sure you want to delete "${record.name}"? This will also delete all service items inside it.`}
              onConfirm={() => handleDeleteSubCategory(record.id)}
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

  // Level 3: Service Item columns
  const serviceItemColumns: ColumnsType<ServiceItem> = [
    {
      title: '',
      key: 'file',
      width: 50,
      render: () => <FileOutlined style={{ fontSize: 20, color: '#1890ff' }} />,
    },
    { 
      title: 'Service Name', 
      dataIndex: 'name', 
      key: 'name',
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
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      render: (price: string) => (
        <Text strong style={{ color: '#e67e22' }}>
          रु {parseFloat(price || '0').toLocaleString()}
        </Text>
      ),
    },
    {
      title: 'Duration',
      dataIndex: 'durationMinutes',
      key: 'duration',
      width: 100,
      render: (minutes: number) => (
        <Text type="secondary">
          {minutes ? `${minutes} min` : '-'}
        </Text>
      ),
    },
    {
      title: 'Popular',
      dataIndex: 'isPopular',
      key: 'popular',
      width: 100,
      render: (popular: boolean) => (
        <Tag color={popular ? 'orange' : 'default'}>
          {popular ? '🔥' : '-'}
        </Tag>
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
          <Tooltip title="Edit Item">
            <Button 
              icon={<EditOutlined />} 
              onClick={() => {
                setEditingServiceItem(record);
                setServiceItemImageUrl(record.imageUrl);
                setServiceItemImageError(false);
                serviceItemForm.setFieldsValue({
                  name: record.name,
                  description: record.description,
                  price: parseFloat(record.price || '0'),
                  durationMinutes: record.durationMinutes,
                  isActive: record.isActive,
                  isPopular: record.isPopular,
                });
                setServiceItemModalVisible(true);
              }} 
            />
          </Tooltip>
          <Tooltip title="Delete Item">
            <Popconfirm 
              title="Delete Service Item" 
              description={`Are you sure you want to delete "${record.name}"?`}
              onConfirm={() => handleDeleteServiceItem(record.id)}
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

  // ============================================
  // RENDER FUNCTIONS
  // ============================================

  const renderBreadcrumb = () => {
    const items = [
      { title: '📁 Categories', onClick: () => setNavigation({ categoryId: null, categoryName: null, subCategoryId: null, subCategoryName: null }) },
    ];

    if (navigation.categoryName) {
      items.push({ 
        title: `📂 ${navigation.categoryName}`,
        onClick: () => setNavigation(prev => ({ ...prev, subCategoryId: null, subCategoryName: null }))
      });
    }

    if (navigation.subCategoryName) {
      items.push({ title: `📂 ${navigation.subCategoryName}` });
    }

    return (
      <Breadcrumb style={{ marginBottom: 16, fontSize: 16 }}>
        {items.map((item, index) => (
          <Breadcrumb.Item key={index}>
            {item.onClick ? (
              <a onClick={item.onClick} style={{ cursor: 'pointer' }}>
                {item.title}
              </a>
            ) : (
              <span>{item.title}</span>
            )}
          </Breadcrumb.Item>
        ))}
      </Breadcrumb>
    );
  };

  const renderCategoryView = () => (
    <>
      <div className={styles.header}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            <FolderOpenOutlined style={{ marginRight: 8, color: '#faad14' }} />
            Categories
          </Title>
          <Text type="secondary">Main service categories (folders)</Text>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => {
            setEditingCategory(null);
            setCustomIconUrl(null);
            setImageError(false);
            categoryForm.resetFields();
            categoryForm.setFieldsValue({ 
              isActive: true, 
              mapIconColor: '#1890ff'
            });
            setPreviewColor('#1890ff');
            setCategoryModalVisible(true);
          }}
        >
          Add Category
        </Button>
      </div>

      <Card className={styles.tableCard} bordered={false}>
        <Table
          columns={categoryColumns}
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
    </>
  );

  const renderSubCategoryView = () => (
    <>
      <div className={styles.header}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => {
                setNavigation({
                  categoryId: null,
                  categoryName: null,
                  subCategoryId: null,
                  subCategoryName: null,
                });
                setSubCategories([]);
                setServiceItems([]);
              }}
            >
              Back
            </Button>
            <div>
              <Title level={4} style={{ margin: 0 }}>
                <FolderOutlined style={{ marginRight: 8, color: '#faad14' }} />
                {navigation.categoryName}
              </Title>
              <Text type="secondary">Sub-categories (sub-folders)</Text>
            </div>
          </div>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => {
            setEditingSubCategory(null);
            setSubCategoryImageUrl(null);
            setSubCategoryImageError(false);
            subCategoryForm.resetFields();
            subCategoryForm.setFieldsValue({ 
              isActive: true,
              isPopular: false,
            });
            setSubCategoryModalVisible(true);
          }}
        >
          Add Sub-Category
        </Button>
      </div>

      <Card className={styles.tableCard} bordered={false}>
        <Table
          columns={subCategoryColumns}
          dataSource={subCategories}
          rowKey="id"
          loading={subCategoryLoading}
          pagination={{ 
            pageSize: 10, 
            showSizeChanger: true, 
            showTotal: (total) => `Total ${total} sub-categories` 
          }}
        />
      </Card>
    </>
  );

  const renderServiceItemsView = () => (
    <>
      <div className={styles.header}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => {
                setNavigation(prev => ({
                  ...prev,
                  subCategoryId: null,
                  subCategoryName: null,
                }));
                setServiceItems([]);
              }}
            >
              Back
            </Button>
            <div>
              <Title level={4} style={{ margin: 0 }}>
                <FileOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                {navigation.subCategoryName}
              </Title>
              <Text type="secondary">Service items (files)</Text>
            </div>
          </div>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => {
            setEditingServiceItem(null);
            setServiceItemImageUrl(null);
            setServiceItemImageError(false);
            serviceItemForm.resetFields();
            serviceItemForm.setFieldsValue({ 
              isActive: true,
              isPopular: false,
            });
            setServiceItemModalVisible(true);
          }}
        >
          Add Service Item
        </Button>
      </div>

      <Card className={styles.tableCard} bordered={false}>
        <Table
          columns={serviceItemColumns}
          dataSource={serviceItems}
          rowKey="id"
          loading={serviceItemLoading}
          pagination={{ 
            pageSize: 10, 
            showSizeChanger: true, 
            showTotal: (total) => `Total ${total} service items` 
          }}
        />
      </Card>
    </>
  );

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <div className={styles.container}>
      {renderBreadcrumb()}

      {!navigation.categoryId && renderCategoryView()}
      {navigation.categoryId && !navigation.subCategoryId && renderSubCategoryView()}
      {navigation.subCategoryId && renderServiceItemsView()}

      {/* ========================================== */}
      {/* LEVEL 1: CATEGORY MODAL */}
      {/* ========================================== */}

      <Modal
        title={editingCategory ? 'Edit Category' : 'Create New Category'}
        open={categoryModalVisible}
        onCancel={() => {
          setCategoryModalVisible(false);
          setCustomIconUrl(null);
          setImageError(false);
          categoryForm.resetFields();
        }}
        footer={null}
        width={700}
        destroyOnClose
      >
        <Form 
          form={categoryForm} 
          layout="vertical" 
          onFinish={handleSaveCategory} 
          initialValues={{ isActive: true, mapIconColor: '#1890ff' }}
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item 
                name="serviceName" 
                label="Category Name" 
                rules={[{ required: true, message: 'Please enter category name' }]}
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
                      categoryForm.setFieldsValue({ mapIconColor: color });
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
                      categoryForm.setFieldsValue({ mapIconColor: color });
                    }}
                    placeholder="#000000"
                    style={{ width: 120 }}
                  />
                </div>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Brief description of this service category" />
          </Form.Item>

          <Form.Item label="Category Icon">
            <Upload.Dragger
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              showUploadList={false}
              customRequest={({ file, onSuccess }) => {
                handleCategoryIconUpload(file as File).then(onSuccess);
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

          <div className={styles.previewSection}>
            <Text strong>Live Preview</Text>
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
                    {categoryForm.getFieldValue('serviceName')?.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
              )}
              <div>
                <Text strong style={{ fontSize: 16 }}>
                  {categoryForm.getFieldValue('serviceName') || 'Category Name'}
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {categoryForm.getFieldValue('description') || 'How it appears on the app'}
                </Text>
              </div>
            </div>
          </div>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setCategoryModalVisible(false);
                setCustomIconUrl(null);
                setImageError(false);
                categoryForm.resetFields();
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

      {/* ========================================== */}
      {/* LEVEL 2: SUB-CATEGORY MODAL (Simplified) */}
      {/* ========================================== */}

      <Modal
        title={
          <Space>
            <FolderOutlined style={{ color: '#faad14' }} />
            {editingSubCategory ? 'Edit Sub-Category' : 'Create New Sub-Category'}
          </Space>
        }
        open={subCategoryModalVisible}
        onCancel={() => {
          setSubCategoryModalVisible(false);
          setSubCategoryImageUrl(null);
          setSubCategoryImageError(false);
          subCategoryForm.resetFields();
        }}
        footer={null}
        width={500}
        destroyOnClose
      >
        <Form 
          form={subCategoryForm} 
          layout="vertical" 
          onFinish={handleSaveSubCategory} 
          initialValues={{ 
            isActive: true,
            isPopular: false,
          }}
        >
          <Form.Item 
            name="name" 
            label="Sub-Category Name" 
            rules={[
              { required: true, message: 'Please enter sub-category name' },
              { min: 2, message: 'Name must be at least 2 characters' },
              { max: 50, message: 'Name must be less than 50 characters' }
            ]}
          >
            <Input 
              placeholder="e.g., Tap, Pipe, Fittings" 
              size="large"
              prefix={<FolderOutlined style={{ color: '#bfbfbf' }} />}
              autoFocus
            />
          </Form.Item>

          <Form.Item name="description" label="Description (Optional)">
            <Input.TextArea 
              rows={2} 
              placeholder="Brief description of this sub-category (optional)" 
            />
          </Form.Item>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="isActive" label="Status" valuePropName="checked">
                <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="isPopular" label="Popular" valuePropName="checked">
                <Switch checkedChildren="Popular" unCheckedChildren="Regular" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setSubCategoryModalVisible(false);
                setSubCategoryImageUrl(null);
                setSubCategoryImageError(false);
                subCategoryForm.resetFields();
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={subCategoryUploading}>
                {editingSubCategory ? 'Update' : 'Create'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* ========================================== */}
      {/* LEVEL 3: SERVICE ITEM MODAL */}
      {/* ========================================== */}

      <Modal
        title={editingServiceItem ? 'Edit Service Item' : 'Create New Service Item'}
        open={serviceItemModalVisible}
        onCancel={() => {
          setServiceItemModalVisible(false);
          setServiceItemImageUrl(null);
          setServiceItemImageError(false);
          serviceItemForm.resetFields();
        }}
        footer={null}
        width={700}
        destroyOnClose
      >
        <Form 
          form={serviceItemForm} 
          layout="vertical" 
          onFinish={handleSaveServiceItem} 
          initialValues={{ 
            isActive: true,
            isPopular: false,
          }}
        >
          <Form.Item 
            name="name" 
            label="Service Name" 
            rules={[{ required: true, message: 'Please enter service name' }]}
          >
            <Input placeholder="e.g., Tap Repair, Tap Replace" size="large" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Detailed description of this service" />
          </Form.Item>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item 
                name="price" 
                label="Price (रु)"
                rules={[{ required: true, message: 'Please enter price' }]}
              >
                <InputNumber 
                  style={{ width: '100%' }} 
                  placeholder="e.g., 500"
                  min={0}
                  prefix={<DollarOutlined />}
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                name="durationMinutes" 
                label="Duration (minutes)"
              >
                <InputNumber 
                  style={{ width: '100%' }} 
                  placeholder="e.g., 30"
                  min={0}
                  prefix={<ClockCircleOutlined />}
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Service Image">
            <Upload.Dragger
              accept="image/png,image/jpeg,image/webp"
              showUploadList={false}
              customRequest={({ file, onSuccess }) => {
                handleServiceItemImageUpload(file as File).then(onSuccess);
              }}
              style={{ borderRadius: 12 }}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined style={{ color: '#e67e22' }} />
              </p>
              <p className="ant-upload-text">Click or drag file to upload</p>
              <p className="ant-upload-hint">
                Support for PNG, JPG, WebP. Max size: 2MB
              </p>
            </Upload.Dragger>
            
            {serviceItemImageUrl && (
              <div className={styles.customIconPreview}>
                <div className={styles.customIconPreviewInner}>
                  <div style={{ position: 'relative' }}>
                    <img 
                      src={serviceItemImageUrl} 
                      alt="Service item" 
                      style={{ 
                        width: 80, 
                        height: 80, 
                        objectFit: 'cover',
                        borderRadius: 8,
                        border: '1px solid #e8edf2',
                        padding: 4,
                        background: '#ffffff',
                      }}
                      onError={handleImageError}
                    />
                    {serviceItemImageError && (
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
                      {serviceItemImageError ? 'Please re-upload a valid image' : 'Image uploaded successfully'}
                    </Text>
                    <Button 
                      danger 
                      icon={<DeleteIcon />} 
                      size="small" 
                      onClick={() => {
                        setServiceItemImageUrl(null);
                        setServiceItemImageError(false);
                      }}
                    >
                      Remove Image
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Form.Item>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="isActive" label="Active Status" valuePropName="checked">
                <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="isPopular" label="Popular" valuePropName="checked">
                <Switch checkedChildren="Popular" unCheckedChildren="Regular" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setServiceItemModalVisible(false);
                setServiceItemImageUrl(null);
                setServiceItemImageError(false);
                serviceItemForm.resetFields();
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={serviceItemUploading}>
                {editingServiceItem ? 'Update Service Item' : 'Create Service Item'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}