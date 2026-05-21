'use client';

import useSWR from 'swr';
import { useState } from 'react';
import {
  Table, Button, Tag, Rate, Select, Modal, Form, Input, App, Typography,
  Space, Avatar,
} from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { api } from '../../../_lib/api';
import styles from './ratings.module.css';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface Rating {
  id: string;
  rating: number;
  review: string | null;
  isApproved: boolean;
  rejectionReason: string | null;
  createdAt: string;
  customerName: string;
  mistriName: string;
  mistriId: string;
  customerId: string;
  serviceRequestId: string;
}

export default function RatingsPage() {
  const [filter, setFilter] = useState<'pending' | 'approved' | 'all'>('pending');
  const [rejectModal, setRejectModal] = useState<{ id: string } | null>(null);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const { data, isLoading, mutate } = useSWR<{ success: boolean; ratings: Rating[]; count: number }>(
    `/api/admin/ratings?filter=${filter}`,
    api.get
  );

  const handleApprove = async (id: string) => {
    try {
      await api.post(`/api/admin/ratings/${id}/approve`);
      message.success('Rating approved');
      mutate();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleReject = async ({ reason }: { reason?: string }) => {
    if (!rejectModal) return;
    try {
      await api.post(`/api/admin/ratings/${rejectModal.id}/reject`, { reason });
      message.success('Rating rejected and removed');
      setRejectModal(null);
      mutate();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Failed');
    }
  };

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
      render: (r: string | null) =>
        r ? <Text style={{ fontSize: 13 }}>{r}</Text> : <Text type="secondary">No review</Text>,
    },
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customer',
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: 'ServeX',
      dataIndex: 'mistriName',
      key: 'mistri',
      render: (name: string) => <Text>{name}</Text>,
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'date',
      render: (d: string) => new Date(d).toLocaleDateString(),
    },
    {
      title: 'Status',
      dataIndex: 'isApproved',
      key: 'status',
      render: (v: boolean) => <Tag color={v ? 'green' : 'orange'}>{v ? 'Approved' : 'Pending'}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: unknown, row: Rating) =>
        !row.isApproved ? (
          <Space size="small">
            <Button
              type="primary"
              icon={<CheckOutlined />}
              size="small"
              onClick={() => handleApprove(row.id)}
            >
              Approve
            </Button>
            <Button
              danger
              icon={<CloseOutlined />}
              size="small"
              onClick={() => { form.resetFields(); setRejectModal({ id: row.id }); }}
            >
              Reject
            </Button>
          </Space>
        ) : (
          <Tag color="green">Approved</Tag>
        ),
    },
  ];

  return (
    <div>
      <div className={styles.header}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Ratings</Title>
          <Text type="secondary">Approve or reject customer reviews</Text>
        </div>
        <Select
          value={filter}
          onChange={setFilter}
          style={{ width: 140 }}
        >
          <Option value="pending">Pending</Option>
          <Option value="approved">Approved</Option>
          <Option value="all">All</Option>
        </Select>
      </div>

      {filter === 'pending' && (data?.count ?? 0) > 0 && (
        <div className={styles.pendingAlert}>
          <Tag color="orange">{data?.count} pending rating{data?.count !== 1 ? 's' : ''} need review</Tag>
        </div>
      )}

      <Table
        columns={columns}
        dataSource={data?.ratings ?? []}
        loading={isLoading}
        rowKey="id"
        pagination={{ pageSize: 20, showTotal: (t) => `${t} ratings` }}
        className={styles.table}
        size="middle"
      />

      <Modal
        title="Reject Rating"
        open={!!rejectModal}
        onCancel={() => setRejectModal(null)}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleReject} style={{ marginTop: 16 }}>
          <Paragraph type="secondary">
            Optionally explain why this rating is being rejected. The rating will be permanently deleted.
          </Paragraph>
          <Form.Item label="Rejection Reason (optional)" name="reason">
            <TextArea rows={3} placeholder="e.g., Inappropriate content, spam, etc." />
          </Form.Item>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button onClick={() => setRejectModal(null)}>Cancel</Button>
            <Button type="primary" danger htmlType="submit">
              Reject & Delete
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
