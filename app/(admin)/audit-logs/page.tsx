'use client';

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { Table, Select, Tag, Typography, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { api } from '../../../_lib/api';
import styles from './audit-logs.module.css';

const { Title, Text } = Typography;
const { Option } = Select;

interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  performedByRole: string;
  performedByName: string | null;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

const ENTITY_COLOR: Record<string, string> = {
  user: 'blue',
  rating: 'purple',
  service_request: 'green',
  mistri_profile: 'cyan',
  platform_service: 'orange',
  hero_banner: 'magenta',
};

const ACTION_COLOR: Record<string, string> = {
  approve: 'green',
  reject: 'red',
  deactivate: 'orange',
  activate: 'cyan',
  update: 'blue',
  delete: 'red',
  toggle_featured: 'purple',
};

export default function AuditLogsPage() {
  const [entityType, setEntityType] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useSWR<{
    success: boolean;
    logs: AuditLog[];
    pagination: { page: number; limit: number; total: number };
  }>(
    useCallback(() => {
      const p = new URLSearchParams({ page: String(page), limit: '50' });
      if (entityType) p.set('entityType', entityType);
      return `/api/admin/audit-logs?${p.toString()}`;
    }, [entityType, page]),
    api.get
  );

  const columns: ColumnsType<AuditLog> = [
    {
      title: 'When',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (d: string) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {new Date(d).toLocaleString()}
        </Text>
      ),
    },
    {
      title: 'Entity',
      dataIndex: 'entityType',
      key: 'entityType',
      render: (t: string) => (
        <Tag color={ENTITY_COLOR[t] ?? 'default'}>{t.replace('_', ' ')}</Tag>
      ),
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (a: string) => (
        <Tag color={ACTION_COLOR[a] ?? 'default'}>{a.replace('_', ' ')}</Tag>
      ),
    },
    {
      title: 'Performed By',
      key: 'performer',
      render: (_: unknown, row: AuditLog) => (
        <div>
          <Text>{row.performedByName ?? 'Unknown'}</Text>
          <br />
          <Tag color="default" style={{ fontSize: 10 }}>{row.performedByRole}</Tag>
        </div>
      ),
    },
    {
      title: 'Entity ID',
      dataIndex: 'entityId',
      key: 'entityId',
      render: (id: string) => (
        <Tooltip title={id}>
          <Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace' }}>
            {id.substring(0, 8)}…
          </Text>
        </Tooltip>
      ),
    },
    {
      title: 'Changes',
      key: 'changes',
      render: (_: unknown, row: AuditLog) => {
        if (!row.oldValue && !row.newValue) return <Text type="secondary">—</Text>;
        return (
          <Tooltip
            title={
              <pre style={{ fontSize: 11, margin: 0 }}>
                {JSON.stringify({ from: row.oldValue, to: row.newValue }, null, 2)}
              </pre>
            }
          >
            <Text type="secondary" style={{ fontSize: 11, cursor: 'pointer', textDecoration: 'underline dotted' }}>
              View diff
            </Text>
          </Tooltip>
        );
      },
    },
  ];

  return (
    <div>
      <div className={styles.header}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Audit Logs</Title>
          <Text type="secondary">All admin and system actions</Text>
        </div>
        <Select
          placeholder="Filter by entity"
          value={entityType || undefined}
          onChange={(v) => { setEntityType(v ?? ''); setPage(1); }}
          style={{ width: 180 }}
          allowClear
        >
          <Option value="user">User</Option>
          <Option value="rating">Rating</Option>
          <Option value="service_request">Service Request</Option>
          <Option value="mistri_profile">ServeX Profile</Option>
          <Option value="platform_service">Platform Service</Option>
          <Option value="hero_banner">Hero Banner</Option>
        </Select>
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
          showTotal: (t) => `${t} log entries`,
        }}
        className={styles.table}
        size="small"
      />
    </div>
  );
}
