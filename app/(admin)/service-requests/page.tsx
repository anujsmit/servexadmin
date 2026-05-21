'use client';

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { Table, Select, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { api } from '../../../_lib/api';
import styles from './service-requests.module.css';

const { Title, Text } = Typography;
const { Option } = Select;

interface ServiceRequest {
  id: string;
  type: string;
  status: 'pending' | 'assigned' | 'canceled' | 'completed';
  address: string;
  paymentAmount: string | null;
  unpaid: boolean;
  createdAt: string;
  completedAt: string | null;
  customerName: string;
}

const STATUS_COLOR: Record<string, string> = {
  pending: 'orange',
  assigned: 'blue',
  canceled: 'red',
  completed: 'green',
};

export default function ServiceRequestsPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useSWR<{
    success: boolean;
    requests: ServiceRequest[];
    pagination: { page: number; limit: number; total: number };
  }>(
    useCallback(() => {
      const p = new URLSearchParams({ page: String(page), limit: '20' });
      if (status) p.set('status', status);
      return `/api/admin/service-requests?${p.toString()}`;
    }, [status, page]),
    api.get
  );

  const columns: ColumnsType<ServiceRequest> = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (t: string) => (
        <Tag color={t === 'electrician' ? 'green' : 'blue'}>
          {t.charAt(0).toUpperCase() + t.slice(1)}
        </Tag>
      ),
    },
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customer',
      render: (n: string) => <Text strong>{n}</Text>,
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
      render: (a: string) => <Text type="secondary">{a}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => <Tag color={STATUS_COLOR[s] ?? 'default'}>{s}</Tag>,
    },
    {
      title: 'Amount (NPR)',
      dataIndex: 'paymentAmount',
      key: 'amount',
      render: (a: string | null, row: ServiceRequest) => (
        <div>
          <Text strong>{a ? `NPR ${parseFloat(a).toLocaleString()}` : '—'}</Text>
          {row.unpaid && <Tag color="orange" style={{ marginLeft: 4, fontSize: 10 }}>Unpaid</Tag>}
        </div>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (d: string) => new Date(d).toLocaleDateString(),
    },
  ];

  return (
    <div>
      <div className={styles.header}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Service Requests</Title>
          <Text type="secondary">Monitor all platform service requests</Text>
        </div>
        <Select
          placeholder="Filter by status"
          value={status || undefined}
          onChange={(v) => { setStatus(v ?? ''); setPage(1); }}
          style={{ width: 160 }}
          allowClear
        >
          <Option value="pending">Pending</Option>
          <Option value="assigned">Assigned</Option>
          <Option value="completed">Completed</Option>
          <Option value="canceled">Canceled</Option>
        </Select>
      </div>

      <Table
        columns={columns}
        dataSource={data?.requests ?? []}
        loading={isLoading}
        rowKey="id"
        pagination={{
          current: page,
          pageSize: 20,
          total: data?.pagination.total ?? 0,
          onChange: setPage,
          showTotal: (t) => `${t} requests`,
        }}
        className={styles.table}
        size="middle"
      />
    </div>
  );
}
