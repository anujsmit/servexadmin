'use client';

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import {
  Table, Input, Select, Button, Tag, Switch, Space, App, Tooltip,
  Typography, Modal, Form, Row, Col,
} from 'antd';
import { SearchOutlined, EditOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { api } from '../../../_lib/api';
import styles from './users.module.css';

const { Title, Text } = Typography;
const { Option } = Select;

interface User {
  id: string;
  fullName: string;
  phoneNumber: string;
  role: 'user' | 'mistri' | 'admin' | null;
  isActive: boolean;
  isOnboarded: boolean;
  createdAt: string;
}

interface UsersResponse {
  success: boolean;
  users: User[];
  pagination: { page: number; limit: number; total: number };
}

const ROLE_COLOR: Record<string, string> = {
  user: 'blue',
  mistri: 'green',
  admin: 'red',
};

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<string>('');
  const [page, setPage] = useState(1);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const buildKey = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (role) params.set('role', role);
    params.set('page', String(page));
    params.set('limit', '20');
    return `/api/admin/users?${params.toString()}`;
  }, [search, role, page]);

  const { data, error, isLoading, mutate } = useSWR<UsersResponse>(buildKey(), api.get);

  const handleToggleActive = async (user: User) => {
    try {
      await api.patch(`/api/admin/users/${user.id}/toggle-active`);
      message.success(`User ${user.isActive ? 'deactivated' : 'activated'}`);
      mutate();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  const openEdit = (user: User) => {
    setEditUser(user);
    form.setFieldsValue({ fullName: user.fullName, role: user.role });
  };

  const handleSave = async (values: { fullName: string; role: string }) => {
    if (!editUser) return;
    try {
      await api.patch(`/api/admin/users/${editUser.id}`, values);
      message.success('User updated');
      setEditUser(null);
      mutate();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  const columns: ColumnsType<User> = [
    {
      title: 'Name',
      dataIndex: 'fullName',
      key: 'fullName',
      render: (name: string, row) => (
        <div>
          <Text strong>{name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>{row.phoneNumber}</Text>
        </div>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (r: string) =>
        r ? <Tag color={ROLE_COLOR[r] ?? 'default'}>{r.toUpperCase()}</Tag> : <Text type="secondary">—</Text>,
    },
    {
      title: 'Onboarded',
      dataIndex: 'isOnboarded',
      key: 'isOnboarded',
      render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? 'Yes' : 'No'}</Tag>,
    },
    {
      title: 'Active',
      key: 'isActive',
      render: (_: unknown, row: User) => (
        <Switch
          checked={row.isActive}
          size="small"
          onChange={() => handleToggleActive(row)}
        />
      ),
    },
    {
      title: 'Joined',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (d: string) => new Date(d).toLocaleDateString(),
    },
    {
      title: '',
      key: 'actions',
      width: 60,
      render: (_: unknown, row: User) => (
        <Tooltip title="Edit">
          <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(row)} />
        </Tooltip>
      ),
    },
  ];

  return (
    <div>
      <div className={styles.header}>
        <Title level={4} style={{ margin: 0 }}>Users</Title>
        <Text type="secondary">Manage all platform users</Text>
      </div>

      <div className={styles.filters}>
        <Input
          placeholder="Search by name or phone..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ width: 280 }}
          allowClear
        />
        <Select
          placeholder="Filter by role"
          value={role || undefined}
          onChange={(v) => { setRole(v ?? ''); setPage(1); }}
          style={{ width: 160 }}
          allowClear
        >
          <Option value="user">Customer</Option>
          <Option value="mistri">ServeX</Option>
          <Option value="admin">Admin</Option>
        </Select>
      </div>

      <Table
        columns={columns}
        dataSource={data?.users ?? []}
        loading={isLoading}
        rowKey="id"
        pagination={{
          current: page,
          pageSize: 20,
          total: data?.pagination.total ?? 0,
          onChange: setPage,
          showTotal: (t) => `${t} users`,
        }}
        className={styles.table}
        size="middle"
      />

      <Modal
        title="Edit User"
        open={!!editUser}
        onCancel={() => setEditUser(null)}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSave} style={{ marginTop: 16 }}>
          <Form.Item label="Full Name" name="fullName" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Role" name="role">
            <Select>
              <Option value="user">Customer</Option>
              <Option value="mistri">ServeX</Option>
              <Option value="admin">Admin</Option>
            </Select>
          </Form.Item>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button onClick={() => setEditUser(null)}>Cancel</Button>
            <Button type="primary" htmlType="submit">Save</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
