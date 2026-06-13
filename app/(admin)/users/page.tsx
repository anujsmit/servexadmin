'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Input,
  Button,
  Space,
  Tag,
  Avatar,
  Modal,
  Form,
  Select,
  Switch,
  message,
  Popconfirm,
  Typography,
  Row,
  Col,
  Statistic,
  Tooltip,
  Badge,
  Dropdown,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  StopOutlined,
  CheckOutlined,
  PhoneOutlined,
  MailOutlined,
  MoreOutlined,
  UserAddOutlined,
  FilterOutlined,
  ExportOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { api } from '../../../_lib/api';
import styles from './users.module.css';

const { Title, Text } = Typography;
const { Option } = Select;

interface User {
  id: string;
  fullName: string;
  phoneNumber: string;
  role: 'user' | 'mistri' | 'admin';
  isActive: boolean;
  isOnboarded: boolean;
  createdAt: string;
  updatedAt: string;
  avatarUrl?: string;
  defaultLocation?: string;
}

interface UsersResponse {
  success: boolean;
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

interface UserFormData {
  fullName: string;
  phoneNumber: string;
  role: 'user' | 'mistri' | 'admin';
  isActive: boolean;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [form] = Form.useForm();

  // Fetch users
  const fetchUsers = async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
      });
      if (searchText) params.append('search', searchText);
      if (roleFilter !== 'all') params.append('role', roleFilter);
      
      const response = await api.get<UsersResponse>(`/admin/users?${params}`);
      
      if (response.success) {
        setUsers(response.users);
        setPagination({
          current: page,
          pageSize,
          total: response.pagination.total,
        });
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      message.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchText, roleFilter]);

  const handleTableChange = (newPagination: any) => {
    fetchUsers(newPagination.current, newPagination.pageSize);
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    form.resetFields();
    form.setFieldsValue({ role: 'user', isActive: true });
    setModalVisible(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      role: user.role,
      isActive: user.isActive,
    });
    setModalVisible(true);
  };

  const handleSaveUser = async (values: UserFormData) => {
    try {
      if (editingUser) {
        await api.patch(`/admin/users/${editingUser.id}`, values);
        message.success('User updated successfully');
      } else {
        await api.post('/admin/users', values);
        message.success('User created successfully');
      }
      setModalVisible(false);
      fetchUsers(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('Failed to save user:', error);
      message.error('Failed to save user');
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await api.patch(`/admin/users/${user.id}/toggle-active`);
      message.success(`${user.fullName} has been ${user.isActive ? 'deactivated' : 'activated'}`);
      fetchUsers(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('Failed to toggle user status:', error);
      message.error('Failed to update user status');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await api.del(`/admin/users/${userId}`);
      message.success('User deleted successfully');
      fetchUsers(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('Failed to delete user:', error);
      message.error('Failed to delete user');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'red';
      case 'mistri': return 'green';
      default: return 'blue';
    }
  };

  const columns: ColumnsType<User> = [
    {
      title: 'User',
      key: 'user',
      width: 250,
      render: (_, record) => (
        <Space>
          <Avatar 
            src={record.avatarUrl} 
            icon={<UserAddOutlined />}
            style={{ backgroundColor: getRoleColor(record.role) }}
          />
          <div>
            <Text strong>{record.fullName}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.phoneNumber}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role: string) => (
        <Tag color={getRoleColor(role)} style={{ textTransform: 'capitalize' }}>
          {role}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'status',
      width: 100,
      render: (isActive: boolean) => (
        <Badge 
          status={isActive ? 'success' : 'error'} 
          text={isActive ? 'Active' : 'Inactive'} 
        />
      ),
    },
    {
      title: 'Onboarded',
      dataIndex: 'isOnboarded',
      key: 'onboarded',
      width: 100,
      render: (isOnboarded: boolean) => (
        <Tag icon={isOnboarded ? <CheckOutlined /> : <StopOutlined />} color={isOnboarded ? 'success' : 'default'}>
          {isOnboarded ? 'Yes' : 'No'}
        </Tag>
      ),
    },
    {
      title: 'Joined',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => dayjs(date).format('DD MMM YYYY, HH:mm'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit User">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => handleEditUser(record)}
            />
          </Tooltip>
          <Tooltip title={record.isActive ? 'Deactivate' : 'Activate'}>
            <Button 
              type="text" 
              icon={record.isActive ? <StopOutlined /> : <CheckOutlined />}
              onClick={() => handleToggleStatus(record)}
              danger={record.isActive}
            />
          </Tooltip>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'view-details',
                  label: 'View Details',
                  icon: <UserAddOutlined />,
                  onClick: () => window.location.href = `/admin/users/${record.id}`,
                },
                {
                  key: 'send-message',
                  label: 'Send Message',
                  icon: <MailOutlined />,
                  onClick: () => message.info('Coming soon'),
                },
                {
                  type: 'divider',
                },
                {
                  key: 'delete',
                  label: 'Delete User',
                  icon: <DeleteOutlined />,
                  danger: true,
                  onClick: () => handleDeleteUser(record.id),
                },
              ],
            }}
            trigger={['click']}
          >
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ];

  // Calculate statistics
  const stats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    inactive: users.filter(u => !u.isActive).length,
    admins: users.filter(u => u.role === 'admin').length,
    mistris: users.filter(u => u.role === 'mistri').length,
    customers: users.filter(u => u.role === 'user').length,
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <Title level={2}>User Management</Title>
        <Text type="secondary">Manage all users, their roles, and account status</Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={16} className={styles.statsRow}>
        <Col xs={24} sm={12} lg={4}>
          <Card className={styles.statCard}>
            <Statistic title="Total Users" value={pagination.total} prefix={<UserAddOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card className={styles.statCard}>
            <Statistic title="Active" value={stats.active} valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card className={styles.statCard}>
            <Statistic title="Inactive" value={stats.inactive} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card className={styles.statCard}>
            <Statistic title="Mistris" value={stats.mistris} prefix={<Badge status="success" />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card className={styles.statCard}>
            <Statistic title="Customers" value={stats.customers} prefix={<Badge status="processing" />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card className={styles.statCard}>
            <Statistic title="Admins" value={stats.admins} prefix={<Badge status="error" />} />
          </Card>
        </Col>
      </Row>

      {/* Filters and Actions */}
      <Card className={styles.filterCard}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Search by name or phone"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              style={{ width: '100%' }}
              value={roleFilter}
              onChange={setRoleFilter}
              placeholder="Filter by role"
            >
              <Option value="all">All Roles</Option>
              <Option value="user">Customers</Option>
              <Option value="mistri">Mistris</Option>
              <Option value="admin">Admins</Option>
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              style={{ width: '100%' }}
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="Filter by status"
            >
              <Option value="all">All Status</Option>
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Space wrap>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={() => fetchUsers()}
              >
                Refresh
              </Button>
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={handleCreateUser}
              >
                Add User
              </Button>
              <Button icon={<ExportOutlined />}>Export</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Users Table */}
      <Card className={styles.tableCard}>
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Total ${total} users`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* Create/Edit User Modal */}
      <Modal
        title={editingUser ? 'Edit User' : 'Add New User'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveUser}
        >
          <Form.Item
            name="fullName"
            label="Full Name"
            rules={[{ required: true, message: 'Please enter full name' }]}
          >
            <Input placeholder="Enter full name" size="large" />
          </Form.Item>

          <Form.Item
            name="phoneNumber"
            label="Phone Number"
            rules={[
              { required: true, message: 'Please enter phone number' },
              { pattern: /^[6-9]\d{9}$/, message: 'Enter a valid 10-digit phone number' },
            ]}
          >
            <Input 
              placeholder="98XXXXXXXX" 
              size="large" 
              prefix={<PhoneOutlined />}
              disabled={!!editingUser}
            />
          </Form.Item>

          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: 'Please select role' }]}
          >
            <Select size="large">
              <Option value="user">Customer</Option>
              <Option value="mistri">Mistri (Service Provider)</Option>
              <Option value="admin">Administrator</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Status"
            valuePropName="checked"
          >
            <Switch 
              checkedChildren="Active" 
              unCheckedChildren="Inactive" 
              defaultChecked
            />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                {editingUser ? 'Update' : 'Create'} User
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}