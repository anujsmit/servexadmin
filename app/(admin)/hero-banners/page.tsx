'use client';

import useSWR from 'swr';
import { useState } from 'react';
import {
  Button, Switch, Modal, Form, Input, App, Typography, Image,
  Popconfirm, Tag, Card, Space, Spin, Row, Col, Radio,
} from 'antd';
import { 
  PlusOutlined, DeleteOutlined, EditOutlined, 
  ArrowUpOutlined, ArrowDownOutlined, PictureOutlined,
  VideoCameraOutlined, PictureFilled, CheckOutlined,
} from '@ant-design/icons';
import { api } from '../../../_lib/api';
import ImageUpload from '../../../components/ImageUpload';
import styles from './hero-banners.module.css';

const { Title, Text } = Typography;

interface Banner {
  id: string;
  title: string | null;
  subtitle: string | null;
  imageUrl: string;
  videoUrl: string | null;
  linkUrl: string | null;
  displayOrder: number;
  isActive: boolean;
  adType: 'ad1' | 'ad2' | 'both';
}

export default function HeroBannersPage() {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form] = Form.useForm();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedAdType, setSelectedAdType] = useState<'ad1' | 'ad2' | 'both'>('both');
  const { message } = App.useApp();

  const { data, isLoading, mutate } = useSWR<{ success: boolean; banners: Banner[] }>(
    '/admin/hero-banners',
    (url) => api.get(url, true)
  );

  const banners = data?.banners ?? [];

  const openCreate = () => {
    form.resetFields();
    setImageUrl(null);
    setVideoUrl(null);
    setSelectedAdType('both');
    setCreating(true);
  };

  const openEdit = (banner: Banner) => {
    setEditing(banner);
    setImageUrl(banner.imageUrl);
    setVideoUrl(banner.videoUrl || null);
    setSelectedAdType(banner.adType || 'both');
    form.setFieldsValue({
      title: banner.title,
      subtitle: banner.subtitle,
      linkUrl: banner.linkUrl,
      isActive: banner.isActive,
      adType: banner.adType || 'both',
      videoUrl: banner.videoUrl,
    });
  };

  const handleCreate = async (values: any) => {
    // Validate based on ad type
    if (values.adType === 'ad1' && !imageUrl) {
      message.error('Please upload an image for Ad 1 banner');
      return;
    }
    if (values.adType === 'ad2' && !videoUrl && !imageUrl) {
      message.error('Please provide either a video URL or image for Ad 2 banner');
      return;
    }
    
    try {
      const payload: any = {
        title: values.title || null,
        subtitle: values.subtitle || null,
        linkUrl: values.linkUrl || null,
        isActive: values.isActive ?? true,
        adType: values.adType || 'both',
        displayOrder: banners.length,
      };
      
      if (values.adType === 'ad1' || values.adType === 'both') {
        payload.imageUrl = imageUrl;
      }
      if ((values.adType === 'ad2' || values.adType === 'both') && videoUrl) {
        payload.videoUrl = videoUrl;
      }
      if ((values.adType === 'ad2' || values.adType === 'both') && !videoUrl && imageUrl) {
        payload.imageUrl = imageUrl;
      }
      
      await api.post('/admin/hero-banners', payload);
      message.success('Banner created successfully');
      setCreating(false);
      setImageUrl(null);
      setVideoUrl(null);
      form.resetFields();
      mutate();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Failed to create banner');
    }
  };

  const handleEdit = async (values: any) => {
    if (!editing) return;
    
    try {
      const payload: any = {
        title: values.title || null,
        subtitle: values.subtitle || null,
        linkUrl: values.linkUrl || null,
        isActive: values.isActive ?? true,
        adType: values.adType || 'both',
      };
      
      if (imageUrl !== editing.imageUrl) {
        payload.imageUrl = imageUrl;
      }
      if (videoUrl !== editing.videoUrl) {
        payload.videoUrl = videoUrl;
      }
      
      await api.patch(`/admin/hero-banners/${editing.id}`, payload);
      message.success('Banner updated successfully');
      setEditing(null);
      setImageUrl(null);
      setVideoUrl(null);
      form.resetFields();
      mutate();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Failed to update banner');
    }
  };

  const handleToggleActive = async (banner: Banner) => {
    try {
      await api.patch(`/admin/hero-banners/${banner.id}`, { isActive: !banner.isActive });
      message.success(`Banner ${!banner.isActive ? 'activated' : 'deactivated'}`);
      mutate();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.del(`/admin/hero-banners/${id}`);
      message.success('Banner deleted successfully');
      mutate();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Failed to delete banner');
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const reordered = [...banners];
    [reordered[index - 1], reordered[index]] = [reordered[index], reordered[index - 1]];
    const order = reordered.map((b, i) => ({ id: b.id, displayOrder: i }));
    try {
      await api.patch('/admin/hero-banners/reorder', { order });
      message.success('Banner order updated');
      mutate();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Failed to reorder');
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === banners.length - 1) return;
    const reordered = [...banners];
    [reordered[index], reordered[index + 1]] = [reordered[index + 1], reordered[index]];
    const order = reordered.map((b, i) => ({ id: b.id, displayOrder: i }));
    try {
      await api.patch('/admin/hero-banners/reorder', { order });
      message.success('Banner order updated');
      mutate();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Failed to reorder');
    }
  };

  const getAdTypeTag = (adType: string) => {
    switch (adType) {
      case 'ad1':
        return <Tag color="blue" icon={<PictureFilled />}>Ad 1 - Top Banner</Tag>;
      case 'ad2':
        return <Tag color="purple" icon={<VideoCameraOutlined />}>Ad 2 - Video Banner</Tag>;
      default:
        return <Tag color="green" icon={<CheckOutlined />}>Both Locations</Tag>;
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" tip="Loading banners..." />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Hero Banners</Title>
          <Text type="secondary">Manage banners for Ad 1 (Top Hero) and Ad 2 (Video/Image) sections</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Add Banner
        </Button>
      </div>

      {banners.length === 0 ? (
        <div className={styles.empty}>
          <PictureOutlined style={{ fontSize: 48, color: '#bfbfbf', marginBottom: 16 }} />
          <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
            No banners yet
          </Text>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Create Your First Banner
          </Button>
        </div>
      ) : (
        <div className={styles.bannerList}>
          {banners.map((banner, index) => (
            <Card key={banner.id} className={styles.bannerCard} variant="borderless">
              <Row gutter={16} align="middle">
                <Col xs={24} sm={4} md={3}>
                  <div className={styles.orderControls}>
                    <Space direction="vertical" size={4}>
                      <Button
                        size="small"
                        icon={<ArrowUpOutlined />}
                        disabled={index === 0}
                        onClick={() => handleMoveUp(index)}
                      />
                      <span className={styles.orderNum}>{index + 1}</span>
                      <Button
                        size="small"
                        icon={<ArrowDownOutlined />}
                        disabled={index === banners.length - 1}
                        onClick={() => handleMoveDown(index)}
                      />
                    </Space>
                  </div>
                </Col>

                <Col xs={24} sm={6} md={4}>
                  {banner.videoUrl ? (
                    <div className={styles.videoThumbnail}>
                      <VideoCameraOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                      <Text type="secondary" style={{ fontSize: 11 }}>Video Ad</Text>
                    </div>
                  ) : (
                    <Image
                      src={banner.imageUrl}
                      alt={banner.title ?? 'banner'}
                      width="100%"
                      height={80}
                      style={{ objectFit: 'cover', borderRadius: 8 }}
                      preview
                      fallback="https://placehold.co/200x80?text=No+Image"
                    />
                  )}
                </Col>

                <Col xs={24} sm={8} md={9}>
                  <div>
                    <Text strong>{banner.title || 'Untitled Banner'}</Text>
                    {banner.subtitle && (
                      <div><Text type="secondary" style={{ fontSize: 12 }}>{banner.subtitle}</Text></div>
                    )}
                    {banner.linkUrl && (
                      <div><Text type="secondary" style={{ fontSize: 11 }} ellipsis>🔗 {banner.linkUrl}</Text></div>
                    )}
                    {banner.videoUrl && (
                      <div><Text type="secondary" style={{ fontSize: 11 }}>🎬 {banner.videoUrl}</Text></div>
                    )}
                  </div>
                </Col>

                <Col xs={12} sm={3} md={4}>
                  {getAdTypeTag(banner.adType || 'both')}
                </Col>

                <Col xs={12} sm={3} md={4}>
                  <Space>
                    <Switch checked={banner.isActive} onChange={() => handleToggleActive(banner)} />
                    <Tag color={banner.isActive ? 'green' : 'default'}>{banner.isActive ? 'Active' : 'Inactive'}</Tag>
                    <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(banner)} />
                    <Popconfirm title="Delete?" onConfirm={() => handleDelete(banner.id)}>
                      <Button icon={<DeleteOutlined />} size="small" danger />
                    </Popconfirm>
                  </Space>
                </Col>
              </Row>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        title="Add New Banner"
        open={creating}
        onCancel={() => { setCreating(false); setImageUrl(null); setVideoUrl(null); form.resetFields(); }}
        footer={null}
        width={700}
        destroyOnClose
      >
        <Form 
          form={form} 
          layout="vertical" 
          onFinish={handleCreate} 
          initialValues={{ isActive: true, adType: 'both' }}
        >
          <Form.Item 
            label="Advertisement Location" 
            name="adType" 
            rules={[{ required: true, message: 'Please select ad location' }]}
          >
            <Radio.Group 
              size="large" 
              className={styles.radioGroup}
              onChange={(e) => setSelectedAdType(e.target.value)}
            >
              <Radio value="ad1" className={styles.radioOption}>
                <div className={styles.radioContent}>
                  <PictureFilled style={{ fontSize: 20, color: '#1890ff' }} />
                  <div>
                    <Text strong>Ad 1 - Top Hero Banner</Text>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                      Displayed at the top of the home screen as a hero banner
                    </Text>
                  </div>
                </div>
              </Radio>
              
              <Radio value="ad2" className={styles.radioOption}>
                <div className={styles.radioContent}>
                  <VideoCameraOutlined style={{ fontSize: 20, color: '#722ed1' }} />
                  <div>
                    <Text strong>Ad 2 - Video/Image Banner</Text>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                      Displayed as a video or image banner in the middle section
                    </Text>
                  </div>
                </div>
              </Radio>
              
              <Radio value="both" className={styles.radioOption}>
                <div className={styles.radioContent}>
                  <CheckOutlined style={{ fontSize: 20, color: '#52c41a' }} />
                  <div>
                    <Text strong>Both Locations</Text>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                      This banner will appear in both Ad 1 and Ad 2 positions
                    </Text>
                  </div>
                </div>
              </Radio>
            </Radio.Group>
          </Form.Item>

          {(selectedAdType === 'ad1' || selectedAdType === 'both') && (
            <Form.Item label="Banner Image" required={selectedAdType === 'ad1'}>
              <ImageUpload
                value={imageUrl}
                onChange={setImageUrl}
                onUploadStart={() => setUploading(true)}
                onUploadEnd={() => setUploading(false)}
                folder="banners"
                hint="Recommended: 1200×400px, JPG/PNG, max 2MB"
              />
            </Form.Item>
          )}

          {(selectedAdType === 'ad2' || selectedAdType === 'both') && (
            <>
              <Form.Item label="Video URL (YouTube)" name="videoUrl" tooltip="For video ads, paste YouTube embed URL">
                <Input 
                  placeholder="https://www.youtube.com/embed/VIDEO_ID" 
                  size="large"
                  onChange={(e) => setVideoUrl(e.target.value)}
                  prefix={<VideoCameraOutlined />}
                />
              </Form.Item>
              <Form.Item label="OR Upload Image" tooltip="If no video URL, an image will be shown">
                <ImageUpload
                  value={imageUrl}
                  onChange={setImageUrl}
                  onUploadStart={() => setUploading(true)}
                  onUploadEnd={() => setUploading(false)}
                  folder="banners"
                  hint="Fallback image if no video URL provided"
                />
              </Form.Item>
            </>
          )}

          <Form.Item label="Title" name="title">
            <Input placeholder="Summer Sale!" size="large" />
          </Form.Item>

          <Form.Item label="Subtitle" name="subtitle">
            <Input placeholder="Get 20% off on all services" size="large" />
          </Form.Item>

          <Form.Item label="Link URL" name="linkUrl">
            <Input placeholder="https://example.com/promo" size="large" />
          </Form.Item>

          <Form.Item label="Status" name="isActive" valuePropName="checked">
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setCreating(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={uploading}>Create Banner</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        title="Edit Banner"
        open={!!editing}
        onCancel={() => { setEditing(null); setImageUrl(null); setVideoUrl(null); form.resetFields(); }}
        footer={null}
        width={700}
        destroyOnClose
      >
        <Form 
          form={form} 
          layout="vertical" 
          onFinish={handleEdit}
        >
          <Form.Item 
            label="Advertisement Location" 
            name="adType" 
            rules={[{ required: true, message: 'Please select ad location' }]}
          >
            <Radio.Group 
              size="large" 
              className={styles.radioGroup}
              onChange={(e) => setSelectedAdType(e.target.value)}
            >
              <Radio value="ad1" className={styles.radioOption}>
                <div className={styles.radioContent}>
                  <PictureFilled style={{ fontSize: 20, color: '#1890ff' }} />
                  <div>
                    <Text strong>Ad 1 - Top Hero Banner</Text>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                      Displayed at the top of the home screen as a hero banner
                    </Text>
                  </div>
                </div>
              </Radio>
              
              <Radio value="ad2" className={styles.radioOption}>
                <div className={styles.radioContent}>
                  <VideoCameraOutlined style={{ fontSize: 20, color: '#722ed1' }} />
                  <div>
                    <Text strong>Ad 2 - Video/Image Banner</Text>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                      Displayed as a video or image banner in the middle section
                    </Text>
                  </div>
                </div>
              </Radio>
              
              <Radio value="both" className={styles.radioOption}>
                <div className={styles.radioContent}>
                  <CheckOutlined style={{ fontSize: 20, color: '#52c41a' }} />
                  <div>
                    <Text strong>Both Locations</Text>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                      This banner will appear in both Ad 1 and Ad 2 positions
                    </Text>
                  </div>
                </div>
              </Radio>
            </Radio.Group>
          </Form.Item>

          {(selectedAdType === 'ad1' || selectedAdType === 'both') && (
            <Form.Item label="Banner Image">
              <ImageUpload
                value={imageUrl}
                onChange={setImageUrl}
                onUploadStart={() => setUploading(true)}
                onUploadEnd={() => setUploading(false)}
                folder="banners"
              />
            </Form.Item>
          )}

          {(selectedAdType === 'ad2' || selectedAdType === 'both') && (
            <>
              <Form.Item label="Video URL (YouTube)" name="videoUrl">
                <Input 
                  placeholder="https://www.youtube.com/embed/VIDEO_ID" 
                  size="large"
                  onChange={(e) => setVideoUrl(e.target.value)}
                  prefix={<VideoCameraOutlined />}
                />
              </Form.Item>
              <Form.Item label="OR Upload Image">
                <ImageUpload
                  value={imageUrl}
                  onChange={setImageUrl}
                  onUploadStart={() => setUploading(true)}
                  onUploadEnd={() => setUploading(false)}
                  folder="banners"
                />
              </Form.Item>
            </>
          )}

          <Form.Item label="Title" name="title">
            <Input size="large" />
          </Form.Item>

          <Form.Item label="Subtitle" name="subtitle">
            <Input size="large" />
          </Form.Item>

          <Form.Item label="Link URL" name="linkUrl">
            <Input size="large" />
          </Form.Item>

          <Form.Item label="Status" name="isActive" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setEditing(null)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={uploading}>Save Changes</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}