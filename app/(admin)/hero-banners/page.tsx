'use client';

import useSWR from 'swr';
import { useState } from 'react';
import {
  Button, Switch, Modal, Form, Input, App, Typography, Image,
  Popconfirm, Tag, Card,
} from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { api } from '../../../_lib/api';
import ImageUpload from '../../../components/ImageUpload';
import styles from './hero-banners.module.css';

const { Title, Text } = Typography;

interface Banner {
  id: string;
  title: string | null;
  subtitle: string | null;
  imageUrl: string;
  linkUrl: string | null;
  displayOrder: number;
  isActive: boolean;
}

export default function HeroBannersPage() {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form] = Form.useForm();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const { message } = App.useApp();

  const { data, isLoading, mutate } = useSWR<{ success: boolean; banners: Banner[] }>(
    '/api/admin/hero-banners',
    api.get
  );

  const banners = data?.banners ?? [];

  const openCreate = () => {
    form.resetFields();
    setImageUrl(null);
    setCreating(true);
  };

  const openEdit = (banner: Banner) => {
    setEditing(banner);
    setImageUrl(banner.imageUrl);
    form.setFieldsValue({
      title: banner.title,
      subtitle: banner.subtitle,
      linkUrl: banner.linkUrl,
      isActive: banner.isActive,
    });
  };

  const handleCreate = async (values: any) => {
    if (!imageUrl) {
      message.error('Please upload a banner image');
      return;
    }
    try {
      await api.post('/api/admin/hero-banners', {
        ...values,
        imageUrl,
        displayOrder: banners.length,
      });
      message.success('Banner created');
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
      await api.patch(`/api/admin/hero-banners/${editing.id}`, {
        ...values,
        ...(imageUrl ? { imageUrl } : {}),
      });
      message.success('Banner updated');
      setEditing(null);
      setImageUrl(null);
      mutate();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleToggleActive = async (banner: Banner) => {
    try {
      await api.patch(`/api/admin/hero-banners/${banner.id}`, { isActive: !banner.isActive });
      mutate();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/admin/hero-banners/${id}`);
      message.success('Banner deleted');
      mutate();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const reordered = [...banners];
    [reordered[index - 1], reordered[index]] = [reordered[index], reordered[index - 1]];
    const order = reordered.map((b, i) => ({ id: b.id, displayOrder: i }));
    try {
      await api.patch('/api/admin/hero-banners/reorder', { order });
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
      await api.patch('/api/admin/hero-banners/reorder', { order });
      mutate();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Failed to reorder');
    }
  };

  const BannerForm = ({ onFinish }: { onFinish: (v: any) => void }) => (
    <Form form={form} layout="vertical" onFinish={onFinish} style={{ marginTop: 16 }}>
      <Form.Item label="Banner Image (CDN)" required>
        <ImageUpload
          value={imageUrl}
          onChange={setImageUrl}
          folder="banners"
          hint="Recommended: 1200×400px, JPG/PNG"
        />
      </Form.Item>
      <Form.Item label="Title" name="title">
        <Input placeholder="Optional overlay title" />
      </Form.Item>
      <Form.Item label="Subtitle" name="subtitle">
        <Input placeholder="Optional subtitle" />
      </Form.Item>
      <Form.Item label="Link URL" name="linkUrl">
        <Input placeholder="https://... (optional)" />
      </Form.Item>
      <Form.Item label="Active" name="isActive" valuePropName="checked" initialValue={true}>
        <Switch />
      </Form.Item>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button onClick={() => { setCreating(false); setEditing(null); setImageUrl(null); }}>Cancel</Button>
        <Button type="primary" htmlType="submit">Save</Button>
      </div>
    </Form>
  );

  return (
    <div>
      <div className={styles.header}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Hero Banners</Title>
          <Text type="secondary">Manage the sliding banners on the customer home screen</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Add Banner
        </Button>
      </div>

      {isLoading ? (
        <div className={styles.loading}>Loading...</div>
      ) : banners.length === 0 ? (
        <div className={styles.empty}>
          <Text type="secondary">No banners yet. Add your first banner above.</Text>
        </div>
      ) : (
        <div className={styles.bannerList}>
          {banners.map((banner, index) => (
            <Card key={banner.id} className={styles.bannerCard} variant="borderless">
              <div className={styles.bannerRow}>
                <div className={styles.orderControls}>
                  <Button
                    size="small"
                    disabled={index === 0}
                    onClick={() => handleMoveUp(index)}
                  >↑</Button>
                  <span className={styles.orderNum}>{index + 1}</span>
                  <Button
                    size="small"
                    disabled={index === banners.length - 1}
                    onClick={() => handleMoveDown(index)}
                  >↓</Button>
                </div>

                <div className={styles.bannerThumb}>
                  <Image
                    src={banner.imageUrl}
                    alt={banner.title ?? 'banner'}
                    width={200}
                    height={70}
                    style={{ objectFit: 'cover', borderRadius: 6 }}
                    preview={false}
                  />
                </div>

                <div className={styles.bannerInfo}>
                  <Text strong>{banner.title ?? <Text type="secondary">No title</Text>}</Text>
                  {banner.subtitle && <Text type="secondary" style={{ fontSize: 12 }}>{banner.subtitle}</Text>}
                  {banner.linkUrl && (
                    <Text type="secondary" style={{ fontSize: 11 }} ellipsis>
                      🔗 {banner.linkUrl}
                    </Text>
                  )}
                </div>

                <div className={styles.bannerActions}>
                  <Switch
                    checked={banner.isActive}
                    size="small"
                    onChange={() => handleToggleActive(banner)}
                  />
                  <Tag color={banner.isActive ? 'green' : 'default'}>
                    {banner.isActive ? 'Active' : 'Inactive'}
                  </Tag>
                  <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(banner)} />
                  <Popconfirm
                    title="Delete this banner?"
                    onConfirm={() => handleDelete(banner.id)}
                    okText="Delete"
                    okButtonProps={{ danger: true }}
                  >
                    <Button icon={<DeleteOutlined />} size="small" danger />
                  </Popconfirm>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal title="Add Banner" open={creating} onCancel={() => { setCreating(false); setImageUrl(null); }} footer={null} destroyOnHidden width={520}>
        <BannerForm onFinish={handleCreate} />
      </Modal>

      <Modal title="Edit Banner" open={!!editing} onCancel={() => { setEditing(null); setImageUrl(null); }} footer={null} destroyOnHidden width={520}>
        <BannerForm onFinish={handleEdit} />
      </Modal>
    </div>
  );
}
