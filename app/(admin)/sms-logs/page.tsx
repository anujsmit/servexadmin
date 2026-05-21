'use client';

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { Table, Select, Tag, Typography, Card, Row, Col, Statistic, DatePicker } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  MessageOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { api } from '../../../_lib/api';
import styles from './sms-logs.module.css';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface SmsLog {
  id: string;
  to: string;
  type: string;
  status: string;
  createdAt: string;
}

interface SmsStats {
  total: number;
  today: number;
  thisMonth: number;
  failed: number;
  byType: Record<string, number>;
}

const TYPE_LABEL: Record<string, string> = {
  otp_login: 'OTP Login',
  otp_phone_change: 'OTP Phone Change',
  otp_account_deletion: 'OTP Account Deletion',
  otp_admin: 'OTP Admin',
  service_accepted: 'Service Accepted',
  service_completed: 'Service Completed',
  mistri_approved: 'ServeX Approved',
};

const TYPE_COLOR: Record<string, string> = {
  otp_login: 'blue',
  otp_phone_change: 'orange',
  otp_account_deletion: 'red',
  otp_admin: 'purple',
  service_accepted: 'green',
  service_completed: 'cyan',
  mistri_approved: 'geekblue',
};

export default function SmsLogsPage() {
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [page, setPage] = useState(1);

  const { data: statsData, isLoading: statsLoading } = useSWR<{
    success: boolean;
    stats: SmsStats;
  }>('/api/admin/sms-stats', api.get);

  const { data, isLoading } = useSWR<{
    success: boolean;
    logs: SmsLog[];
    pagination: { page: number; limit: number; total: number };
  }>(
    useCallback(() => {
      const p = new URLSearchParams({ page: String(page), limit: '50' });
      if (typeFilter) p.set('type', typeFilter);
      if (statusFilter) p.set('status', statusFilter);
      if (dateRange) {
        p.set('from', dateRange[0]);
        p.set('to', dateRange[1]);
      }
      return `/api/admin/sms-logs?${p.toString()}`;
    }, [typeFilter, statusFilter, dateRange, page]),
    api.get
  );

  const stats = statsData?.stats;

  const columns: ColumnsType<SmsLog> = [
    {
      title: 'When',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (d: string) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {new Date(d).toLocaleString()}
        </Text>
      ),
    },
    {
      title: 'Recipient',
      dataIndex: 'to',
      key: 'to',
      render: (phone: string) => (
        <Text style={{ fontFamily: 'monospace' }}>{phone}</Text>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (t: string) => (
        <Tag color={TYPE_COLOR[t] ?? 'default'}>{TYPE_LABEL[t] ?? t}</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: string) =>
        s === 'success' ? (
          <Tag icon={<CheckCircleOutlined />} color="success">Sent</Tag>
        ) : (
          <Tag icon={<CloseCircleOutlined />} color="error">Failed</Tag>
        ),
    },
  ];

  return (
    <div>
      <div className={styles.header}>
        <div>
          <Title level={4} style={{ margin: 0 }}>SMS Logs</Title>
          <Text type="secondary">Track all outbound SMS messages</Text>
        </div>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card variant="borderless" className={styles.statCard}>
            <Statistic
              title="Total Sent"
              value={stats?.total ?? 0}
              prefix={<MessageOutlined />}
              loading={statsLoading}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card variant="borderless" className={styles.statCard}>
            <Statistic
              title="Today"
              value={stats?.today ?? 0}
              prefix={<CalendarOutlined />}
              styles={{ content: { color: '#059669' } }}
              loading={statsLoading}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card variant="borderless" className={styles.statCard}>
            <Statistic
              title="This Month"
              value={stats?.thisMonth ?? 0}
              prefix={<CalendarOutlined />}
              styles={{ content: { color: '#2563eb' } }}
              loading={statsLoading}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card variant="borderless" className={styles.statCard}>
            <Statistic
              title="Failed"
              value={stats?.failed ?? 0}
              prefix={<CloseCircleOutlined />}
              styles={{ content: { color: '#dc2626' } }}
              loading={statsLoading}
            />
          </Card>
        </Col>
      </Row>

      {stats && (
        <Card variant="borderless" style={{ marginBottom: 24 }} title="Breakdown by Type">
          <Row gutter={[12, 12]}>
            {Object.entries(TYPE_LABEL).map(([key, label]) => (
              <Col xs={12} sm={8} md={4} key={key}>
                <div className={styles.typeBreakdown}>
                  <Tag color={TYPE_COLOR[key]}>{label}</Tag>
                  <span className={styles.typeCount}>{(stats.byType[key] ?? 0).toLocaleString()}</span>
                </div>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      <Card variant="borderless">
        <div className={styles.filters}>
          <Select
            placeholder="Filter by type"
            value={typeFilter || undefined}
            onChange={(v) => { setTypeFilter(v ?? ''); setPage(1); }}
            style={{ width: 200 }}
            allowClear
          >
            {Object.entries(TYPE_LABEL).map(([key, label]) => (
              <Option key={key} value={key}>{label}</Option>
            ))}
          </Select>

          <Select
            placeholder="Filter by status"
            value={statusFilter || undefined}
            onChange={(v) => { setStatusFilter(v ?? ''); setPage(1); }}
            style={{ width: 150 }}
            allowClear
          >
            <Option value="success">Sent</Option>
            <Option value="failed">Failed</Option>
          </Select>

          <RangePicker
            onChange={(_, strings) => {
              if (strings[0] && strings[1]) {
                setDateRange([strings[0], strings[1]]);
              } else {
                setDateRange(null);
              }
              setPage(1);
            }}
            style={{ width: 260 }}
          />
        </div>

        <Table
          columns={columns}
          dataSource={data?.logs ?? []}
          loading={isLoading}
          rowKey="id"
          pagination={{
            current: page,
            pageSize: 50,
            total: data?.pagination.total ?? 0,
            onChange: setPage,
            showTotal: (t) => `${t} SMS records`,
          }}
          size="small"
          style={{ marginTop: 16 }}
        />
      </Card>
    </div>
  );
}
