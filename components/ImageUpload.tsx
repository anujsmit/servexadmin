'use client';

import { useRef, useState } from 'react';
import { Button, Spin, Typography, App } from 'antd';
import { PlusOutlined, LoadingOutlined, DeleteOutlined } from '@ant-design/icons';
import { api } from '../_lib/api';

const { Text } = Typography;

interface UploadResponse {
  success: boolean;
  cdnUrl: string;
}

interface ImageUploadProps {
  /** Current CDN URL value */
  value?: string | null;
  /** Called with the new CDN URL after a successful upload, or null when cleared */
  onChange?: (url: string | null) => void;
  /** Folder inside the "assets" Supabase bucket. Defaults to "misc" */
  folder?: string;
  disabled?: boolean;
  /** Placeholder hint text */
  hint?: string;
}

export default function ImageUpload({
  value,
  onChange,
  folder = 'misc',
  disabled = false,
  hint = 'Recommended: 1200×600px, JPG/PNG',
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      message.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      message.error('File must be 5MB or smaller');
      return;
    }

    setLoading(true);
    try {
      const base64 = await readFileAsBase64(file);
      const result = await api.post<UploadResponse>('/api/admin/upload', {
        fileBase64: base64,
        folder,
        fileName: file.name,
      });
      onChange?.(result.cdnUrl);
      message.success('Image uploaded to CDN');
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        disabled={disabled || loading}
      />

      {value ? (
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img
            src={value}
            alt="uploaded"
            style={{
              width: '100%',
              maxHeight: 160,
              objectFit: 'cover',
              borderRadius: 8,
              border: '1px solid var(--color-border, #e5e7eb)',
              display: 'block',
            }}
          />
          {!disabled && (
            <div
              style={{
                position: 'absolute',
                top: 6,
                right: 6,
                display: 'flex',
                gap: 4,
              }}
            >
              <Button
                size="small"
                onClick={() => fileInputRef.current?.click()}
                loading={loading}
              >
                Change
              </Button>
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={handleClear}
              />
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => !disabled && !loading && fileInputRef.current?.click()}
          style={{
            border: '1.5px dashed var(--color-border, #d9d9d9)',
            borderRadius: 8,
            padding: '24px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            cursor: disabled || loading ? 'not-allowed' : 'pointer',
            background: 'var(--color-bg-subtle, #fafafa)',
            opacity: disabled ? 0.6 : 1,
            transition: 'border-color 0.2s',
          }}
        >
          {loading ? (
            <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
          ) : (
            <PlusOutlined style={{ fontSize: 22, color: 'var(--color-text-muted, #9ca3af)' }} />
          )}
          <Text type="secondary" style={{ fontSize: 13 }}>
            {loading ? 'Uploading to CDN…' : 'Click to upload image'}
          </Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {hint}
          </Text>
        </div>
      )}

      {value && (
        <Text
          type="secondary"
          style={{ fontSize: 10, wordBreak: 'break-all', lineHeight: 1.4 }}
        >
          CDN: {value}
        </Text>
      )}
    </div>
  );
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
