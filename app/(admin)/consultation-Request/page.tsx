// app/(admin)/consultation-request/page.tsx
// Note: Use lowercase 'request' in the folder name

'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Button,
  Modal,
  Select,
  Input,
  message,
  Space,
  Tag,
  Typography,
  Descriptions,
  Alert,
  Row,
  Col,
  Statistic,
  Badge,
  Avatar,
  Tooltip,
  theme,
  App,
  Tabs,
} from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  ReloadOutlined,
  UserOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
  EyeOutlined,
  UnorderedListOutlined,
  ToolOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { api } from '../../../_lib/api';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Title, Text } = Typography;
const { useToken } = theme;

// ============================================
// TYPES
// ============================================

interface Consultation {
  id: string;
  userId: string | null;
  categoryId: number;
  categoryName: string;
  location: string;
  latitude: string | null;
  longitude: string | null;
  details: string | null;
  preferredDate: string | null;
  preferredTime: string | null;
  urgency: 'normal' | 'urgent' | 'emergency';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo: string | null;
  notes: string | null;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  customerName: string | null;
  customerPhone: string | null;
  assignedMistriName: string | null;
  assignedMistriPhone: string | null;
}

interface Mistri {
  id: string;
  fullName: string;
  phoneNumber: string;
  serviceId: number | null;
  serviceName?: string;
  profilePhotoUrl: string | null;
  isAvailable: boolean;
  availabilityStatus: string;
  averageRating: string | null;
  jobsCompleted: number | null;
}

interface Stats {
  total: number;
  pending: number;
  assigned: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  byCategory: { categoryName: string; count: number }[];
  byUrgency: { urgency: string; count: number }[];
  trend: { date: string; count: number }[];
}

// ============================================
// CONFIGURATIONS
// ============================================

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: {
    label: 'Pending',
    color: 'orange',
    icon: <ClockCircleOutlined />,
  },
  assigned: {
    label: 'Assigned',
    color: 'blue',
    icon: <TeamOutlined />,
  },
  in_progress: {
    label: 'In Progress',
    color: 'purple',
    icon: <ToolOutlined />,
  },
  completed: {
    label: 'Completed',
    color: 'green',
    icon: <CheckCircleOutlined />,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'red',
    icon: <CloseOutlined />,
  },
};

const URGENCY_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  normal: { label: 'Normal', color: 'default', icon: <CheckCircleOutlined /> },
  urgent: { label: 'Urgent', color: 'orange', icon: <ExclamationCircleOutlined /> },
  emergency: { label: 'Emergency', color: 'red', icon: <WarningOutlined /> },
};

const CATEGORY_COLORS: Record<string, string> = {
  Plumber: '#e67e22',
  Plumbing: '#e67e22',
  Electrician: '#f1c40f',
  Electrical: '#f1c40f',
  Painter: '#3498db',
  Painting: '#3498db',
  Carpenter: '#2ecc71',
  Carpentry: '#2ecc71',
  Cleaner: '#1abc9c',
  Cleaning: '#1abc9c',
  'AC Repair': '#9b59b6',
  General: '#95a5a6',
};

// ============================================
// MAIN COMPONENT
// ============================================

function ConsultationRequestContent() {
  const { token } = useToken();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [availableMistris, setAvailableMistris] = useState<Mistri[]>([]);
  const [selectedMistri, setSelectedMistri] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [pagination, setPagination] = useState({ page: 1, total: 0, limit: 20 });
  const [stats, setStats] = useState<Stats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewDetailsModalVisible, setViewDetailsModalVisible] = useState(false);
  const [selectedConsultationDetails, setSelectedConsultationDetails] = useState<Consultation | null>(null);

  useEffect(() => {
    loadConsultations();
    loadStats();
  }, [activeTab, pagination.page, statusFilter]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery !== undefined) {
        setPagination({ ...pagination, page: 1 });
        loadConsultations();
      }
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const loadConsultations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
      });

      if (activeTab !== 'all') {
        params.append('status', activeTab);
      }
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await api.get(`/consultations?${params.toString()}`);
      console.log('📦 Consultations response:', response);

      if (response.success) {
        setConsultations(response.consultations || []);
        setPagination({ ...pagination, total: response.pagination?.total || 0 });
      } else {
        console.warn('⚠️ Failed to load consultations:', response.message);
        setConsultations([]);
      }
    } catch (error: any) {
      console.error('❌ Failed to load consultations:', error);
      setConsultations([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/consultations/stats');
      if (response.success) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadAvailableMistris = async () => {
    try {
      const response = await api.get('/admin/available-mistris');
      if (response.success) {
        const mistris = response.mistris || [];
        setAvailableMistris(mistris);
      }
    } catch (error: any) {
      console.error('Failed to load mistris:', error);
      message.error(error?.message || 'Failed to load mistris');
    }
  };

  const handleAssign = async () => {
    if (!selectedMistri) {
      message.error('Please select a professional');
      return;
    }

    if (!selectedConsultation) {
      message.error('No consultation selected');
      return;
    }

    setAssigning(true);
    try {
      const response = await api.put(`/consultations/${selectedConsultation.id}/assign`, {
        mistriId: selectedMistri,
        notes: adminNotes,
      });

      if (response.success) {
        message.success('Consultation assigned successfully');
        setAssignModalVisible(false);
        setSelectedConsultation(null);
        setSelectedMistri('');
        setAdminNotes('');
        loadConsultations();
        loadStats();
      } else {
        message.error(response.message || 'Failed to assign consultation');
      }
    } catch (error: any) {
      console.error('Failed to assign:', error);
      message.error(error?.message || 'Failed to assign');
    } finally {
      setAssigning(false);
    }
  };

  const handleUpdateStatus = async (consultationId: string, status: string) => {
    try {
      const response = await api.put(`/consultations/${consultationId}/status`, { status });
      if (response.success) {
        message.success(`Consultation ${status} successfully`);
        loadConsultations();
        loadStats();
        if (viewDetailsModalVisible) {
          setViewDetailsModalVisible(false);
        }
      } else {
        message.error(response.message || 'Failed to update status');
      }
    } catch (error: any) {
      console.error('Failed to update status:', error);
      message.error(error?.message || 'Failed to update status');
    }
  };

  const openAssignModal = (consultation: Consultation) => {
    setSelectedConsultation(consultation);
    setSelectedMistri('');
    setAdminNotes(consultation.adminNotes || '');
    setAssignModalVisible(true);
    loadAvailableMistris();
  };

  const openViewDetailsModal = (consultation: Consultation) => {
    setSelectedConsultationDetails(consultation);
    setViewDetailsModalVisible(true);
  };

  const getStatusColor = (status: string) => {
    return STATUS_CONFIG[status]?.color || 'default';
  };

  const getStatusLabel = (status: string) => {
    return STATUS_CONFIG[status]?.label || status;
  };

  const getUrgencyColor = (urgency: string) => {
    return URGENCY_CONFIG[urgency]?.color || 'default';
  };

  const getUrgencyLabel = (urgency: string) => {
    return URGENCY_CONFIG[urgency]?.label || urgency;
  };

  const getCategoryColor = (categoryName: string) => {
    return CATEGORY_COLORS[categoryName] || CATEGORY_COLORS['General'];
  };

  // Stats Cards Component
  const StatsCards = () => {
    if (!stats) return null;

    const cards = [
      {
        label: 'Total',
        value: stats.total,
        color: token.colorPrimary,
        icon: <UnorderedListOutlined />,
      },
      {
        label: 'Pending',
        value: stats.pending,
        color: '#faad14',
        icon: <ClockCircleOutlined />,
      },
      {
        label: 'Assigned',
        value: stats.assigned,
        color: '#1890ff',
        icon: <TeamOutlined />,
      },
      {
        label: 'In Progress',
        value: stats.inProgress,
        color: '#722ed1',
        icon: <ToolOutlined />,
      },
      {
        label: 'Completed',
        value: stats.completed,
        color: '#52c41a',
        icon: <CheckCircleOutlined />,
      },
      {
        label: 'Cancelled',
        value: stats.cancelled,
        color: '#ff4d4f',
        icon: <CloseOutlined />,
      },
    ];

    return (
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {cards.map((card) => (
          <Col xs={12} sm={4} key={card.label}>
            <Card style={{ borderRadius: 12, textAlign: 'center' }}>
              <Statistic
                title={card.label}
                value={card.value}
                prefix={card.icon}
                valueStyle={{ color: card.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>
    );
  };

  // Table Columns
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (id: string) => <Text code style={{ fontSize: 12 }}>{id.slice(0, 8).toUpperCase()}</Text>,
    },
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 160,
      render: (name: string, record: Consultation) => (
        <div>
          <div style={{ fontWeight: 500 }}>{name || 'Anonymous'}</div>
          {record.customerPhone && (
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>
              <PhoneOutlined style={{ marginRight: 4 }} />
              {record.customerPhone}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'categoryName',
      key: 'categoryName',
      width: 140,
      render: (category: string) => {
        const color = getCategoryColor(category);
        return (
          <Tag color={color} style={{ fontWeight: 'bold' }}>
            <ToolOutlined style={{ marginRight: 4 }} />
            {category}
          </Tag>
        );
      },
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      ellipsis: true,
      render: (location: string) => (
        <Tooltip title={location}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <EnvironmentOutlined style={{ color: token.colorTextSecondary }} />
            <span style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {location}
            </span>
          </div>
        </Tooltip>
      ),
    },
    {
      title: 'Urgency',
      dataIndex: 'urgency',
      key: 'urgency',
      width: 100,
      render: (urgency: string) => {
        const config = URGENCY_CONFIG[urgency];
        return (
          <Tag color={config.color} icon={config.icon} style={{ borderRadius: 12 }}>
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const config = STATUS_CONFIG[status];
        return (
          <Tag color={config.color} icon={config.icon} style={{ borderRadius: 16 }}>
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: 'Assigned To',
      dataIndex: 'assignedMistriName',
      key: 'assignedMistriName',
      width: 150,
      render: (name: string) =>
        name ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar size="small" style={{ backgroundColor: '#52c41a' }}>
              {name.charAt(0).toUpperCase()}
            </Avatar>
            <span>{name}</span>
          </div>
        ) : (
          <Tag color="default">Not assigned</Tag>
        ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (date: string) => (
        <div>
          <div>{dayjs(date).format('MMM DD, YYYY')}</div>
          <div style={{ fontSize: 11, color: '#8c8c8c' }}>{dayjs(date).format('h:mm A')}</div>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 220,
      render: (_: any, record: Consultation) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Tooltip title="View Details">
            <Button icon={<EyeOutlined />} onClick={() => openViewDetailsModal(record)} size="middle" />
          </Tooltip>
          {record.status === 'pending' && (
            <Tooltip title="Assign Professional">
              <Button type="primary" icon={<TeamOutlined />} onClick={() => openAssignModal(record)} size="middle">
                Assign
              </Button>
            </Tooltip>
          )}
          {(record.status === 'assigned' || record.status === 'in_progress') && (
            <Tooltip title="Mark Complete">
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => {
                  Modal.confirm({
                    title: 'Complete Consultation',
                    content: 'Mark this consultation as completed?',
                    onOk: () => handleUpdateStatus(record.id, 'completed'),
                  });
                }}
                size="middle"
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
              />
            </Tooltip>
          )}
          {record.status === 'pending' && (
            <Tooltip title="Cancel">
              <Button
                danger
                icon={<CloseOutlined />}
                onClick={() => {
                  Modal.confirm({
                    title: 'Cancel Consultation',
                    content: 'Are you sure you want to cancel this consultation?',
                    onOk: () => handleUpdateStatus(record.id, 'cancelled'),
                  });
                }}
                size="middle"
              />
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  // Tab items
  const tabItems = [
    {
      key: 'pending',
      label: (
        <span>
          <ClockCircleOutlined style={{ marginRight: 8 }} />
          Pending
          <Badge count={stats?.pending || 0} style={{ marginLeft: 8, backgroundColor: '#faad14' }} />
        </span>
      ),
    },
    {
      key: 'assigned',
      label: (
        <span>
          <TeamOutlined style={{ marginRight: 8 }} />
          Assigned
          <Badge count={stats?.assigned || 0} style={{ marginLeft: 8, backgroundColor: '#1890ff' }} />
        </span>
      ),
    },
    {
      key: 'in_progress',
      label: (
        <span>
          <ToolOutlined style={{ marginRight: 8 }} />
          In Progress
          <Badge count={stats?.inProgress || 0} style={{ marginLeft: 8, backgroundColor: '#722ed1' }} />
        </span>
      ),
    },
    {
      key: 'completed',
      label: (
        <span>
          <CheckCircleOutlined style={{ marginRight: 8 }} />
          Completed
          <Badge count={stats?.completed || 0} style={{ marginLeft: 8, backgroundColor: '#52c41a' }} />
        </span>
      ),
    },
    {
      key: 'cancelled',
      label: (
        <span>
          <CloseOutlined style={{ marginRight: 8 }} />
          Cancelled
          <Badge count={stats?.cancelled || 0} style={{ marginLeft: 8, backgroundColor: '#ff4d4f' }} />
        </span>
      ),
    },
    {
      key: 'all',
      label: (
        <span>
          <UnorderedListOutlined style={{ marginRight: 8 }} />
          All
        </span>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, minHeight: '100vh', background: '#f0f2f5' }}>
      <Card style={{ borderRadius: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              Consultation Management
            </Title>
            <div style={{ color: '#8c8c8c' }}>Review and manage consultation requests</div>
          </div>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              loadConsultations();
              loadStats();
            }}
          >
            Refresh
          </Button>
        </div>

        <Alert
          message="Consultation Workflow"
          description="Pending consultations need to be assigned to available professionals. Once assigned, they can be marked as in progress and then completed."
          type="info"
          showIcon
          style={{ marginBottom: 20, borderRadius: 12 }}
        />

        <StatsCards />

        {/* Filters */}
        <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Input.Search
            placeholder="Search by customer, category, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onSearch={() => {
              setPagination({ ...pagination, page: 1 });
              loadConsultations();
            }}
            style={{ width: 300 }}
            allowClear
          />
          <Select
            placeholder="Filter by status"
            style={{ width: 150 }}
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value);
              setPagination({ ...pagination, page: 1 });
            }}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'pending', label: 'Pending' },
              { value: 'assigned', label: 'Assigned' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
          />
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key);
            setPagination({ ...pagination, page: 1 });
            if (key === 'all') {
              setStatusFilter('all');
            }
          }}
          items={tabItems}
          type="card"
        />

        <Table
          columns={columns}
          dataSource={consultations}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showTotal: (total) => `Total ${total} consultations`,
            onChange: (page) => setPagination({ ...pagination, page }),
          }}
          scroll={{ x: 1200 }}
          locale={{ emptyText: 'No consultations found' }}
        />
      </Card>

      {/* Assign Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TeamOutlined style={{ color: token.colorPrimary }} />
            <span>Assign Consultation</span>
          </div>
        }
        open={assignModalVisible}
        onCancel={() => {
          setAssignModalVisible(false);
          setSelectedConsultation(null);
          setSelectedMistri('');
          setAdminNotes('');
        }}
        okText="Assign"
        cancelText="Cancel"
        onOk={handleAssign}
        confirmLoading={assigning}
        width={700}
      >
        {selectedConsultation && (
          <>
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  background: token.colorPrimaryBg,
                  padding: '12px 16px',
                  borderRadius: 12,
                  marginBottom: 16,
                }}
              >
                <div style={{ fontWeight: 500 }}>Consultation Details</div>
                <div style={{ fontSize: 12, marginTop: 4, color: '#8c8c8c' }}>
                  #{selectedConsultation.id.slice(0, 8).toUpperCase()} • {selectedConsultation.categoryName}
                </div>
              </div>

              <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
                <Descriptions.Item
                  label={
                    <span>
                      <UserOutlined /> Customer
                    </span>
                  }
                >
                  <div style={{ fontWeight: 500 }}>{selectedConsultation.customerName || 'Anonymous'}</div>
                  {selectedConsultation.customerPhone && (
                    <div style={{ color: '#8c8c8c' }}>{selectedConsultation.customerPhone}</div>
                  )}
                </Descriptions.Item>
                <Descriptions.Item
                  label={
                    <span>
                      <EnvironmentOutlined /> Location
                    </span>
                  }
                >
                  {selectedConsultation.location}
                </Descriptions.Item>
                <Descriptions.Item
                  label={
                    <span>
                      <FileTextOutlined /> Details
                    </span>
                  }
                >
                  {selectedConsultation.details || <span style={{ color: '#8c8c8c' }}>No details provided</span>}
                </Descriptions.Item>
                <Descriptions.Item label="Urgency">
                  <Tag color={getUrgencyColor(selectedConsultation.urgency)}>
                    {getUrgencyLabel(selectedConsultation.urgency)}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Created At">
                  <CalendarOutlined style={{ marginRight: 8 }} />
                  {dayjs(selectedConsultation.createdAt).format('MMM DD, YYYY h:mm A')}
                </Descriptions.Item>
              </Descriptions>
            </div>

            <div>
              <div
                style={{
                  background: token.colorPrimaryBg,
                  padding: '12px 16px',
                  borderRadius: 12,
                  marginBottom: 16,
                }}
              >
                <div style={{ fontWeight: 500 }}>Assignment Details</div>
                <div style={{ fontSize: 12, marginTop: 4, color: '#8c8c8c' }}>
                  Select a professional to assign this consultation
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 500 }}>Select Professional</div>
                <Select
                  placeholder="Choose a professional to assign"
                  style={{ width: '100%', marginTop: 8 }}
                  value={selectedMistri}
                  onChange={setSelectedMistri}
                  showSearch
                  size="large"
                  filterOption={(input, option) =>
                    (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
                  }
                  notFoundContent={availableMistris.length === 0 ? 'No professionals available' : 'No professionals found'}
                >
                  {availableMistris.map((mistri) => (
                    <Select.Option key={mistri.id} value={mistri.id}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar size="small" style={{ backgroundColor: token.colorPrimary }}>
                          {mistri.fullName.charAt(0).toUpperCase()}
                        </Avatar>
                        <span style={{ fontWeight: 500 }}>{mistri.fullName}</span>
                        <Tag color={mistri.isAvailable ? 'success' : 'warning'} style={{ borderRadius: 12 }}>
                          {mistri.isAvailable ? '🟢 Available' : '🔴 Busy'}
                        </Tag>
                        {mistri.averageRating && parseFloat(mistri.averageRating) > 0 && (
                          <Tag color="gold" style={{ borderRadius: 12 }}>
                            ⭐ {mistri.averageRating}
                          </Tag>
                        )}
                        {mistri.jobsCompleted && mistri.jobsCompleted > 0 && (
                          <Tag color="blue" style={{ borderRadius: 12 }}>
                            {mistri.jobsCompleted} jobs
                          </Tag>
                        )}
                      </div>
                    </Select.Option>
                  ))}
                </Select>
              </div>

              <div>
                <div style={{ fontWeight: 500 }}>Admin Notes (Optional)</div>
                <TextArea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add any instructions for the professional"
                  style={{ marginTop: 8, borderRadius: 12 }}
                />
              </div>
            </div>
          </>
        )}
      </Modal>

      {/* View Details Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EyeOutlined style={{ color: token.colorPrimary }} />
            <span>Consultation Details</span>
          </div>
        }
        open={viewDetailsModalVisible}
        onCancel={() => {
          setViewDetailsModalVisible(false);
          setSelectedConsultationDetails(null);
        }}
        footer={[<Button key="close">Close</Button>]}
        width={800}
      >
        {selectedConsultationDetails && (
          <>
            <div
              style={{
                background: token.colorPrimaryBg,
                padding: '12px 16px',
                borderRadius: 12,
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Tag color={getStatusColor(selectedConsultationDetails.status)}>
                  {getStatusLabel(selectedConsultationDetails.status)}
                </Tag>
                <Tag color={getUrgencyColor(selectedConsultationDetails.urgency)}>
                  {getUrgencyLabel(selectedConsultationDetails.urgency)}
                </Tag>
                <Tag color={getCategoryColor(selectedConsultationDetails.categoryName)}>
                  {selectedConsultationDetails.categoryName}
                </Tag>
              </div>
            </div>

            <Descriptions column={2} bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="ID">
                <Text code>{selectedConsultationDetails.id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Created At">
                {dayjs(selectedConsultationDetails.createdAt).format('MMM DD, YYYY h:mm A')}
              </Descriptions.Item>
              <Descriptions.Item
                label={
                  <span>
                    <UserOutlined /> Customer
                  </span>
                }
                span={2}
              >
                <div style={{ fontWeight: 500 }}>{selectedConsultationDetails.customerName || 'Anonymous'}</div>
                {selectedConsultationDetails.customerPhone && (
                  <div style={{ color: '#8c8c8c' }}>{selectedConsultationDetails.customerPhone}</div>
                )}
              </Descriptions.Item>
              <Descriptions.Item
                label={
                  <span>
                    <EnvironmentOutlined /> Location
                  </span>
                }
                span={2}
              >
                {selectedConsultationDetails.location}
              </Descriptions.Item>
              <Descriptions.Item
                label={
                  <span>
                    <FileTextOutlined /> Details
                  </span>
                }
                span={2}
              >
                {selectedConsultationDetails.details || <span style={{ color: '#8c8c8c' }}>No details provided</span>}
              </Descriptions.Item>
              {selectedConsultationDetails.preferredDate && (
                <Descriptions.Item label="Preferred Date">
                  {dayjs(selectedConsultationDetails.preferredDate).format('MMM DD, YYYY')}
                </Descriptions.Item>
              )}
              {selectedConsultationDetails.preferredTime && (
                <Descriptions.Item label="Preferred Time">{selectedConsultationDetails.preferredTime}</Descriptions.Item>
              )}
              <Descriptions.Item label="Assigned To" span={2}>
                {selectedConsultationDetails.assignedMistriName ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar size="small" style={{ backgroundColor: '#52c41a' }}>
                      {selectedConsultationDetails.assignedMistriName.charAt(0).toUpperCase()}
                    </Avatar>
                    <span style={{ fontWeight: 500 }}>{selectedConsultationDetails.assignedMistriName}</span>
                    {selectedConsultationDetails.assignedMistriPhone && (
                      <span style={{ color: '#8c8c8c' }}>({selectedConsultationDetails.assignedMistriPhone})</span>
                    )}
                  </div>
                ) : (
                  <Tag color="default">Not assigned</Tag>
                )}
              </Descriptions.Item>
              {selectedConsultationDetails.completedAt && (
                <Descriptions.Item label="Completed At" span={2}>
                  {dayjs(selectedConsultationDetails.completedAt).format('MMM DD, YYYY h:mm A')}
                </Descriptions.Item>
              )}
              {selectedConsultationDetails.adminNotes && (
                <Descriptions.Item label="Admin Notes" span={2}>
                  {selectedConsultationDetails.adminNotes}
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
              {selectedConsultationDetails.status === 'pending' && (
                <Button
                  type="primary"
                  icon={<TeamOutlined />}
                  onClick={() => {
                    setViewDetailsModalVisible(false);
                    openAssignModal(selectedConsultationDetails);
                  }}
                >
                  Assign Professional
                </Button>
              )}
              {(selectedConsultationDetails.status === 'assigned' ||
                selectedConsultationDetails.status === 'in_progress') && (
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => {
                    Modal.confirm({
                      title: 'Complete Consultation',
                      content: 'Mark this consultation as completed?',
                      onOk: () => handleUpdateStatus(selectedConsultationDetails.id, 'completed'),
                    });
                  }}
                  style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                >
                  Mark Complete
                </Button>
              )}
              {selectedConsultationDetails.status === 'pending' && (
                <Button
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => {
                    Modal.confirm({
                      title: 'Cancel Consultation',
                      content: 'Are you sure you want to cancel this consultation?',
                      onOk: () => handleUpdateStatus(selectedConsultationDetails.id, 'cancelled'),
                    });
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

export default function ConsultationRequestPage() {
  return (
    <App>
      <ConsultationRequestContent />
    </App>
  );
}