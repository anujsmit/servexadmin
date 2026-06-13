'use client';

import { useRef, useState } from 'react';
import { Button, Spin, Typography, App, Image } from 'antd';
import { PlusOutlined, LoadingOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { api } from '../_lib/api';

const { Text } = Typography;

interface UploadResponse {
  success: boolean;
  cdnUrl: string;
}

interface ImageUploadProps {
  value?: string | null;
  onChange?: (url: string | null) => void;
  folder?: string;
  disabled?: boolean;
  hint?: string;
  onUploadStart?: () => void;
  onUploadEnd?: () => void;
}

export default function ImageUpload({
  value,
  onChange,
  folder = 'misc',
  disabled = false,
  hint = 'Recommended: 1200×400px, JPG/PNG, max 2MB',
  onUploadStart,
  onUploadEnd,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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

    // Show preview immediately
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    setLoading(true);
    onUploadStart?.();
    
    try {
      const base64 = await readFileAsBase64(file);
      
      const result = await api.post<UploadResponse>('/admin/upload', {
        fileBase64: base64,
        folder,
        fileName: file.name,
      });
      
      // Return the CDN URL
      onChange?.(result.cdnUrl);
      message.success('Image uploaded successfully');
      
      // Clean up preview
      URL.revokeObjectURL(localPreview);
      setPreviewUrl(null);
    } catch (err) {
      console.error('Upload error:', err);
      message.error(err instanceof Error ? err.message : 'Upload failed');
      setPreviewUrl(null);
    } finally {
      setLoading(false);
      onUploadEnd?.();
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleClear = () => {
    onChange?.(null);
    setPreviewUrl(null);
  };

  const displayImage = previewUrl || value;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        disabled={disabled || loading}
      />

      {displayImage ? (
        <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
          <div style={{ position: 'relative' }}>
            <Image
              src={displayImage}
              alt="uploaded banner"
              style={{
                width: '100%',
                maxHeight: 200,
                objectFit: 'cover',
                borderRadius: 8,
                border: '1px solid #e5e7eb',
              }}
              preview={{ mask: <EyeOutlined /> }}
              fallback="https://placehold.co/600x200?text=Image+Load+Error"
            />
            {loading && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
              }}>
                <Spin indicator={<LoadingOutlined style={{ fontSize: 24, color: '#fff' }} spin />} />
              </div>
            )}
          </div>
          {!disabled && (
            <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 8 }}>
              <Button size="small" onClick={() => fileInputRef.current?.click()} disabled={loading}>
                Change
              </Button>
              <Button size="small" danger icon={<DeleteOutlined />} onClick={handleClear} disabled={loading} />
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => !disabled && !loading && fileInputRef.current?.click()}
          style={{
            border: '2px dashed #d9d9d9',
            borderRadius: 12,
            padding: '32px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            cursor: disabled || loading ? 'not-allowed' : 'pointer',
            background: '#fafafa',
            transition: 'all 0.3s ease',
          }}
        >
          {loading ? (
            <Spin indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />} />
          ) : (
            <PlusOutlined style={{ fontSize: 32, color: '#bfbfbf' }} />
          )}
          <div style={{ textAlign: 'center' }}>
            <Text strong style={{ display: 'block', marginBottom: 4 }}>
              {loading ? 'Uploading to CDN...' : 'Click to upload image'}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>{hint}</Text>
          </div>
        </div>
      )}
    </div>
  );
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      // Return only the base64 part (remove data:image/xxx;base64,)
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}