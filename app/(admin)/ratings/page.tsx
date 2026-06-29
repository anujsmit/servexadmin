// app/admin/ratings/page.tsx
'use client';

import useSWR from 'swr';
import { useState, useCallback, useEffect } from 'react';
import {
  Table, Button, Tag, Rate, Select, Modal, Form, Input, App, Typography,
  Space, Avatar, Card, Empty, Spin, Tooltip, Divider,
} from 'antd';
import { 
  CheckOutlined, 
  CloseOutlined, 
  StarOutlined, 
  UserOutlined, 
  ShopOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { api, ApiError } from '../../../_lib/api';
import styles from './ratings.module.css';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// ============================================
// TYPES
// ============================================

interface Rating {
  id: string;
  rating: number;
  review: string | null;
  isApproved: boolean;
  rejectionReason: string | null;
  createdAt: string;
  approvedAt: string | null;
  customerName: string;
  mistriName: string;
  mistriId: string;
  customerId: string;
  serviceRequestId: string;
}

interface RatingsResponse {
  success: boolean;
  ratings: Rating[];
  count: number;
}

// ============================================
// FETCHER FUNCTION
// ============================================

const fetcher = async (url: string) => {
  try {
    console.log(`[Ratings] Fetching: ${url}`);
    const data = await api.get<RatingsResponse>(url);
    console.log(`[Ratings] Received: ${data?.ratings?.length || 0} ratings`);
    return data;
  } catch (error) {
    console.error('[Ratings] Fetch error:', error);
    if (error instanceof ApiError) {
      throw new Error(error.message);
    }
    throw error;
  }
};

// ============================================
// AUTO-APPROVAL LOGIC
// ============================================

const shouldAutoApprove = (rating: Rating): { 
  autoApprove: boolean; 
  reason: string;
} => {
  // Auto-approve 4-5 star ratings with review
  if (rating.rating >= 4 && rating.review && rating.review.length >= 10) {
    return { 
      autoApprove: true, 
      reason: 'High rating with detailed review' 
    };
  }

  // Auto-approve 5-star ratings (even without review)
  if (rating.rating === 5) {
    return { 
      autoApprove: true, 
      reason: 'Perfect 5-star rating' 
    };
  }

  // Flag for review: Low ratings (1-2 stars)
  if (rating.rating <= 2) {
    return { 
      autoApprove: false, 
      reason: 'Low rating needs review' 
    };
  }

  // Flag for review: Very short review
  if (rating.review && rating.review.length < 5) {
    return { 
      autoApprove: false, 
      reason: 'Review too short' 
    };
  }

  // Flag for review: No review for 3-star rating
  if (rating.rating === 3 && !rating.review) {
    return { 
      autoApprove: false, 
      reason: '3-star rating without review' 
    };
  }

  // Default: Auto-approve
  return { 
    autoApprove: true, 
    reason: 'Standard approval' 
  };
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function RatingsPage() {
  const [filter, setFilter] = useState<'pending' | 'approved' | 'all'>('pending');
  const [rejectModal, setRejectModal] = useState<{ id: string } | null>(null);
  const [selectedRating, setSelectedRating] = useState<Rating | null>(null);
  const [detailModal, setDetailModal] = useState(false);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  // ✅ Check for admin token on mount
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    console.log('[Ratings] Admin token present:', !!token);
    if (!token) {
      message.warning('Please login as admin to view ratings');
    }
  }, [message]);

  // ✅ Fetch ratings with SWR
  const { data, isLoading, error, mutate } = useSWR<RatingsResponse>(
    `/admin/ratings?filter=${filter}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      errorRetryCount: 3,
      onError: (err) => {
        console.error('[Ratings] SWR Error:', err);
        message.error('Failed to load ratings');
      },
    }
  );

  // ✅ Handle Approve
  const handleApprove = useCallback(async (id: string) => {
    try {
      await api.post(`/admin/ratings/${id}/approve`);
      message.success({
        content: 'Rating approved successfully',
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      });
      mutate();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve rating';
      message.error(errorMessage);
      console.error('Approve error:', err);
    }
  }, [message, mutate]);

  // ✅ Handle Auto-Approve All
  const handleAutoApproveAll = useCallback(async () => {
    const pendingRatings = data?.ratings?.filter(r => !r.isApproved) || [];
    
    if (pendingRatings.length === 0) {
      message.info('No pending ratings to approve');
      return;
    }

    Modal.confirm({
      title: 'Auto-Approval',
      content: (
        <div>
          <Text>This will approve {pendingRatings.length} rating(s) based on auto-approval rules.</Text>
          <ul style={{ marginTop: 8, paddingLeft: 20 }}>
            {pendingRatings.slice(0, 5).map(r => (
              <li key={r.id}>
                {r.customerName} → {r.mistriName} ({r.rating}★)
                {r.review && <Text type="secondary"> - "{r.review.slice(0, 30)}..."</Text>}
              </li>
            ))}
            {pendingRatings.length > 5 && (
              <li>... and {pendingRatings.length - 5} more</li>
            )}
          </ul>
        </div>
      ),
      okText: 'Auto-Approve',
      cancelText: 'Cancel',
      onOk: async () => {
        let approved = 0;
        let failed = 0;

        for (const rating of pendingRatings) {
          const { autoApprove } = shouldAutoApprove(rating);
          if (autoApprove) {
            try {
              await api.post(`/admin/ratings/${rating.id}/approve`);
              approved++;
            } catch {
              failed++;
            }
          }
        }

        message.success(
          `Auto-approved ${approved} ratings${failed > 0 ? `, ${failed} failed` : ''}`
        );
        mutate();
      },
    });
  }, [data, message, mutate]);

  // ✅ Handle Reject
  const handleReject = useCallback(async ({ reason }: { reason?: string }) => {
    if (!rejectModal) return;
    
    try {
      await api.post(`/admin/ratings/${rejectModal.id}/reject`, { reason });
      message.success({
        content: 'Rating rejected and removed',
        icon: <CloseOutlined style={{ color: '#ff4d4f' }} />,
      });
      setRejectModal(null);
      form.resetFields();
      mutate();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reject rating';
      message.error(errorMessage);
      console.error('Reject error:', err);
    }
  }, [rejectModal, form, message, mutate]);

  // ✅ Handle View Details
  const handleViewDetails = useCallback((rating: Rating) => {
    setSelectedRating(rating);
    setDetailModal(true);
  }, []);

  // ✅ Get auto-approval status
  const getAutoApprovalStatus = (rating: Rating) => {
    const { autoApprove, reason } = shouldAutoApprove(rating);
    return { autoApprove, reason };
  };

  // ✅ Get data
  const ratings = data?.ratings ?? [];
  const totalCount = data?.count ?? 0;
  const pendingCount = ratings.filter(r => !r.isApproved).length;
  const autoApprovableCount = ratings.filter(r => {
    if (r.isApproved) return false;
    const { autoApprove } = shouldAutoApprove(r);
    return autoApprove;
  }).length;

  // ✅ Columns
  const columns: ColumnsType<Rating> = [
    {
      title: 'Rating',
      key: 'rating',
      width: 130,
      render: (_: unknown, row: Rating) => (
        <div>
          <Rate disabled value={row.rating} style={{ fontSize: 14 }} />
          <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
            {row.rating}/5
          </Text>
        </div>
      ),
    },
    {
      title: 'Review',
      dataIndex: 'review',
      key: 'review',
      width: 200,
      render: (r: string | null) =>
        r ? (
          <Text 
            style={{ fontSize: 13, cursor: 'pointer' }} 
            ellipsis={{ tooltip: r }}
            onClick={() => {
              const rating = ratings.find(rt => rt.review === r);
              if (rating) handleViewDetails(rating);
            }}
          >
            {r}
          </Text>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>No review</Text>
        ),
    },
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customer',
      render: (name: string) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <Text strong>{name || 'Unknown'}</Text>
        </Space>
      ),
    },
    {
      title: 'Mistri',
      dataIndex: 'mistriName',
      key: 'mistri',
      render: (name: string) => (
        <Space>
          <Avatar size="small" style={{ backgroundColor: '#87d068' }}>
            {name?.charAt(0)?.toUpperCase() || 'M'}
          </Avatar>
          <Text>{name || 'Unknown'}</Text>
        </Space>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'date',
      render: (d: string) => (
        <Tooltip title={new Date(d).toLocaleString()}>
          <span>{new Date(d).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isApproved',
      key: 'status',
      render: (v: boolean, row: Rating) => {
        if (v) {
          return <Tag color="success" icon={<CheckCircleOutlined />}>Approved</Tag>;
        }
        const { autoApprove, reason } = getAutoApprovalStatus(row);
        return (
          <Tooltip title={reason}>
            <Tag color={autoApprove ? 'blue' : 'orange'}>
              {autoApprove ? 'Auto-Approval' : 'Needs Review'}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_: unknown, row: Rating) =>
        !row.isApproved ? (
          <Space size="small">
            <Button
              type="primary"
              icon={<CheckOutlined />}
              size="small"
              onClick={() => handleApprove(row.id)}
              style={{ minWidth: 70 }}
            >
              Approve
            </Button>
            <Button
              danger
              icon={<CloseOutlined />}
              size="small"
              onClick={() => { 
                form.resetFields(); 
                setRejectModal({ id: row.id }); 
              }}
              style={{ minWidth: 60 }}
            >
              Reject
            </Button>
            <Button
              size="small"
              onClick={() => handleViewDetails(row)}
            >
              Details
            </Button>
          </Space>
        ) : (
          <Button
            size="small"
            onClick={() => handleViewDetails(row)}
          >
            View
          </Button>
        ),
    },
  ];

  // ✅ Error state
  if (error) {
    return (
      <div className={styles.container}>
        <Card>
          <div style={{ textAlign: 'center', padding: 40 }}>
            <ExclamationCircleOutlined style={{ fontSize: 48, color: '#ff4d4f', marginBottom: 16 }} />
            <Title level={4}>Failed to Load Ratings</Title>
            <Text type="secondary">{(error as Error).message || 'Please try again later'}</Text>
            <Button 
              type="primary" 
              onClick={() => mutate()} 
              style={{ marginTop: 16 }}
              icon={<ReloadOutlined />}
            >
              Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            <StarOutlined style={{ marginRight: 8, color: '#faad14' }} />
            Ratings Management
          </Title>
          <Text type="secondary">Approve or reject customer reviews</Text>
        </div>
        <div className={styles.headerActions}>
          <Select
            value={filter}
            onChange={setFilter}
            style={{ width: 140 }}
          >
            <Option value="pending">
              Pending ({pendingCount})
            </Option>
            <Option value="approved">Approved</Option>
            <Option value="all">All ({totalCount})</Option>
          </Select>
        </div>
      </div>

      {/* Stats Bar */}
      <div className={styles.statsBar}>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{totalCount}</span>
          <span className={styles.statLabel}>Total</span>
        </div>
        <Divider type="vertical" />
        <div className={styles.statItem}>
          <span className={styles.statValue} style={{ color: '#faad14' }}>{pendingCount}</span>
          <span className={styles.statLabel}>Pending</span>
        </div>
        <Divider type="vertical" />
        <div className={styles.statItem}>
          <span className={styles.statValue} style={{ color: '#52c41a' }}>{totalCount - pendingCount}</span>
          <span className={styles.statLabel}>Approved</span>
        </div>
        <Divider type="vertical" />
        <div className={styles.statItem}>
          <span className={styles.statValue} style={{ color: '#1890ff' }}>{autoApprovableCount}</span>
          <span className={styles.statLabel}>Auto-Approvable</span>
        </div>
      </div>

      {/* Pending Alert with Auto-Approve Button */}
      {filter === 'pending' && pendingCount > 0 && (
        <div className={styles.pendingAlert}>
          <Space>
            <Tag color="orange" style={{ fontSize: 14, padding: '6px 12px' }}>
              {pendingCount} pending rating{pendingCount !== 1 ? 's' : ''} need review
            </Tag>
            {autoApprovableCount > 0 && (
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                onClick={handleAutoApproveAll}
                style={{ background: '#52c41a', borderColor: '#52c41a' }}
              >
                Auto-Approve {autoApprovableCount} rating{autoApprovableCount !== 1 ? 's' : ''}
              </Button>
            )}
          </Space>
        </div>
      )}

      {/* Table */}
      <Table
        columns={columns}
        dataSource={ratings}
        loading={isLoading}
        rowKey="id"
        pagination={{ 
          pageSize: 20, 
          showTotal: (total) => `${total} ratings`,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
        className={styles.table}
        size="middle"
        rowClassName={(record) => !record.isApproved ? styles.pendingRow : ''}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div>
                  <Text strong>No ratings found</Text>
                  <br />
                  <Text type="secondary">
                    {filter === 'pending' 
                      ? 'All ratings have been reviewed' 
                      : 'No ratings available'}
                  </Text>
                </div>
              }
            />
          ),
        }}
      />

      {/* Reject Modal */}
      <Modal
        title={
          <span>
            <CloseOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
            Reject Rating
          </span>
        }
        open={!!rejectModal}
        onCancel={() => {
          setRejectModal(null);
          form.resetFields();
        }}
        footer={null}
        destroyOnClose
        width={480}
      >
        <Form form={form} layout="vertical" onFinish={handleReject} style={{ marginTop: 8 }}>
          <Paragraph type="secondary" style={{ marginBottom: 16 }}>
            Optionally explain why this rating is being rejected. 
            The rating will be permanently deleted.
          </Paragraph>
          <Form.Item 
            label="Rejection Reason (optional)" 
            name="reason"
          >
            <TextArea 
              rows={3} 
              placeholder="e.g., Inappropriate content, spam, etc." 
              maxLength={500}
              showCount
            />
          </Form.Item>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <Button onClick={() => {
              setRejectModal(null);
              form.resetFields();
            }}>
              Cancel
            </Button>
            <Button type="primary" danger htmlType="submit" icon={<CloseOutlined />}>
              Reject & Delete
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        title={
          <Space>
            <StarOutlined style={{ color: '#faad14' }} />
            <span>Rating Details</span>
          </Space>
        }
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModal(false)}>
            Close
          </Button>,
          !selectedRating?.isApproved && (
            <Button 
              key="approve" 
              type="primary" 
              icon={<CheckOutlined />}
              onClick={() => {
                if (selectedRating) {
                  handleApprove(selectedRating.id);
                  setDetailModal(false);
                }
              }}
            >
              Approve
            </Button>
          ),
        ]}
        width={600}
      >
        {selectedRating && (
          <div className={styles.detailContent}>
            <div className={styles.detailRow}>
              <Text strong>Rating:</Text>
              <Rate disabled value={selectedRating.rating} style={{ fontSize: 16 }} />
              <Text type="secondary">({selectedRating.rating}/5)</Text>
            </div>
            
            {selectedRating.review && (
              <div className={styles.detailRow}>
                <Text strong>Review:</Text>
                <Paragraph style={{ marginTop: 4, whiteSpace: 'pre-wrap' }}>
                  {selectedRating.review}
                </Paragraph>
              </div>
            )}

            <div className={styles.detailRow}>
              <Text strong>Customer:</Text>
              <Text>{selectedRating.customerName}</Text>
            </div>

            <div className={styles.detailRow}>
              <Text strong>Mistri:</Text>
              <Text>{selectedRating.mistriName}</Text>
            </div>

            <div className={styles.detailRow}>
              <Text strong>Date:</Text>
              <Text>{new Date(selectedRating.createdAt).toLocaleString()}</Text>
            </div>

            <div className={styles.detailRow}>
              <Text strong>Status:</Text>
              <Tag color={selectedRating.isApproved ? 'green' : 'orange'}>
                {selectedRating.isApproved ? 'Approved' : 'Pending'}
              </Tag>
              {!selectedRating.isApproved && (
                <Tooltip title={getAutoApprovalStatus(selectedRating).reason}>
                  <Tag color="blue">Auto-Approval: {getAutoApprovalStatus(selectedRating).autoApprove ? 'Yes' : 'No'}</Tag>
                </Tooltip>
              )}
            </div>

            {selectedRating.isApproved && selectedRating.approvedAt && (
              <div className={styles.detailRow}>
                <Text strong>Approved At:</Text>
                <Text>{new Date(selectedRating.approvedAt).toLocaleString()}</Text>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}