'use client';

import { useRef, useState } from 'react';
import { Button, Spin, Typography, App, Image, Space } from 'antd';
import { PlusOutlined, LoadingOutlined, DeleteOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons';
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
  aspectRatio?: '16:9' | '4:3' | '1:1' | '21:9' | 'free';
  maxHeight?: number;
  previewWidth?: string | number;
}

export default function ImageUpload({
  value,
  onChange,
  folder = 'misc',
  disabled = false,
  hint = 'Recommended: 1200×400px, JPG/PNG, max 2MB',
  onUploadStart,
  onUploadEnd,
  aspectRatio = '16:9',
  maxHeight = 300,
  previewWidth = '100%',
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { message } = App.useApp();

  const getAspectRatioStyles = () => {
    switch (aspectRatio) {
      case '16:9':
        return { paddingBottom: '56.25%' };
      case '4:3':
        return { paddingBottom: '75%' };
      case '1:1':
        return { paddingBottom: '100%' };
      case '21:9':
        return { paddingBottom: '42.85%' };
      default:
        return { paddingBottom: '56.25%' };
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      message.error('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      message.error('File must be 5MB or smaller');
      return;
    }

    // Show preview immediately with compression
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setUploadProgress(0);

    setLoading(true);
    onUploadStart?.();
    
    try {
      // Compress image before upload
      const compressedBase64 = await compressImage(file, 1200, 80);
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const result = await api.post<UploadResponse>('/admin/upload', {
        fileBase64: compressedBase64,
        folder,
        fileName: file.name,
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Return the CDN URL
      onChange?.(result.cdnUrl);
      message.success('Image uploaded successfully');
      
      // Clean up preview after a delay
      setTimeout(() => {
        URL.revokeObjectURL(localPreview);
        setPreviewUrl(null);
        setUploadProgress(0);
      }, 500);
      
    } catch (err) {
      console.error('Upload error:', err);
      message.error(err instanceof Error ? err.message : 'Upload failed');
      setPreviewUrl(null);
      setUploadProgress(0);
    } finally {
      setLoading(false);
      onUploadEnd?.();
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const compressImage = (file: File, maxWidth: number = 1200, quality: number = 80): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Calculate new dimensions maintaining aspect ratio
          if (width > maxWidth) {
            const ratio = maxWidth / width;
            width = maxWidth;
            height = height * ratio;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          
          // Enable image smoothing for better quality
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          // Draw image
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to base64 with quality
          const base64 = canvas.toDataURL('image/jpeg', quality / 100);
          const base64Data = base64.split(',')[1];
          resolve(base64Data);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleClear = () => {
    onChange?.(null);
    setPreviewUrl(null);
    setUploadProgress(0);
  };

  const handleRetry = () => {
    fileInputRef.current?.click();
  };

  const displayImage = previewUrl || value;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        disabled={disabled || loading}
      />

      {displayImage ? (
        <div style={{ 
          position: 'relative', 
          width: previewWidth,
          borderRadius: 12,
          overflow: 'hidden',
          border: '1px solid #e8edf2',
          background: '#f8fafc',
        }}>
          <div style={{ 
            position: 'relative', 
            width: '100%',
            ...(aspectRatio !== 'free' ? getAspectRatioStyles() : {})
          }}>
            <Image
              src={displayImage}
              alt="Uploaded image"
              style={{
                position: aspectRatio !== 'free' ? 'absolute' : 'relative',
                top: 0,
                left: 0,
                width: '100%',
                height: aspectRatio !== 'free' ? '100%' : 'auto',
                maxHeight: aspectRatio !== 'free' ? 'none' : maxHeight,
                objectFit: 'cover',
                borderRadius: 0,
              }}
              preview={{
                mask: (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'rgba(0,0,0,0.6)',
                    padding: '8px 16px',
                    borderRadius: 20,
                  }}>
                    <EyeOutlined style={{ fontSize: 16 }} />
                    <span style={{ fontSize: 14 }}>Preview</span>
                  </div>
                ),
              }}
              fallback="https://placehold.co/600x400/f1f5f9/94a3b8?text=Image+Load+Error"
            />
            
            {/* Progress Overlay */}
            {loading && uploadProgress < 100 && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.6)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                backdropFilter: 'blur(4px)',
              }}>
                <Spin indicator={<LoadingOutlined style={{ fontSize: 32, color: '#fff' }} spin />} />
                <div style={{ 
                  width: '60%', 
                  background: 'rgba(255,255,255,0.2)', 
                  borderRadius: 10,
                  overflow: 'hidden',
                  height: 6,
                }}>
                  <div style={{
                    width: `${uploadProgress}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #e67e22, #f39c12)',
                    borderRadius: 10,
                    transition: 'width 0.3s ease',
                  }} />
                </div>
                <Text style={{ color: '#fff', fontSize: 13 }}>
                  Uploading... {uploadProgress}%
                </Text>
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          {!disabled && !loading && (
            <div style={{
              position: 'absolute',
              top: 12,
              right: 12,
              display: 'flex',
              gap: 8,
              zIndex: 10,
            }}>
              <Button 
                size="small" 
                onClick={() => fileInputRef.current?.click()}
                icon={<ReloadOutlined />}
                style={{
                  background: 'rgba(255,255,255,0.95)',
                  border: 'none',
                  borderRadius: 8,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              >
                Change
              </Button>
              <Button 
                size="small" 
                danger 
                icon={<DeleteOutlined />} 
                onClick={handleClear}
                style={{
                  background: 'rgba(255,255,255,0.95)',
                  border: 'none',
                  borderRadius: 8,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              />
            </div>
          )}
          
          {/* Image Info */}
          {value && !loading && (
            <div style={{
              position: 'absolute',
              bottom: 12,
              left: 12,
              background: 'rgba(0,0,0,0.7)',
              padding: '4px 12px',
              borderRadius: 6,
              backdropFilter: 'blur(4px)',
            }}>
              <Text style={{ color: '#fff', fontSize: 11 }}>
                Image uploaded
              </Text>
            </div>
          )}
        </div>
      ) : (
        // Upload Area
        <div
          onClick={() => !disabled && !loading && fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${loading ? '#e67e22' : '#d9d9d9'}`,
            borderRadius: 12,
            padding: '40px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            cursor: disabled || loading ? 'not-allowed' : 'pointer',
            background: loading ? '#fef9f4' : '#fafafa',
            transition: 'all 0.3s ease',
            minHeight: 200,
            position: 'relative',
          }}
        >
          {loading ? (
            <>
              <Spin indicator={<LoadingOutlined style={{ fontSize: 40, color: '#e67e22' }} spin />} />
              <div style={{ textAlign: 'center', width: '100%', maxWidth: 300 }}>
                <div style={{ 
                  width: '100%', 
                  background: '#f0f0f0', 
                  borderRadius: 10,
                  overflow: 'hidden',
                  height: 6,
                  marginTop: 8,
                }}>
                  <div style={{
                    width: `${uploadProgress}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #e67e22, #f39c12)',
                    borderRadius: 10,
                    transition: 'width 0.3s ease',
                  }} />
                </div>
                <Text type="secondary" style={{ fontSize: 13, marginTop: 8 }}>
                  Uploading... {uploadProgress}%
                </Text>
              </div>
            </>
          ) : (
            <>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #e67e2215, #f39c1215)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <PlusOutlined style={{ fontSize: 28, color: '#e67e22' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <Text strong style={{ display: 'block', marginBottom: 4, fontSize: 16 }}>
                  Click to upload image
                </Text>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  {hint}
                </Text>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                  Supports JPG, PNG, WebP
                </Text>
              </div>
            </>
          )}
        </div>
      )}
      
      {/* Image Requirements */}
      {!displayImage && !loading && (
        <div style={{
          display: 'flex',
          gap: 16,
          padding: '8px 12px',
          background: '#f8fafc',
          borderRadius: 8,
          flexWrap: 'wrap',
        }}>
          <Space size={4}>
            <Text type="secondary" style={{ fontSize: 12 }}>📏 Max size: 5MB</Text>
          </Space>
          <Space size={4}>
            <Text type="secondary" style={{ fontSize: 12 }}>📐 Recommended: {aspectRatio === '16:9' ? '1200×675' : aspectRatio === '4:3' ? '1200×900' : '1200×1200'}px</Text>
          </Space>
          <Space size={4}>
            <Text type="secondary" style={{ fontSize: 12 }}>📁 Format: JPG, PNG, WebP</Text>
          </Space>
        </div>
      )}
    </div>
  );
}