// app/admin/pending-requests/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Button,
  Modal,
  Select,
  InputNumber,
  Input,
  message,
  Space,
  Tag,
  Typography,
  Descriptions,
  Tabs,
  Empty,
  Spin,
  Alert,
  Row,
  Col,
  Statistic,
  Badge,
  Avatar,
  Divider,
  Tooltip,
  theme,
  App,
  Collapse,
  Checkbox,
  Form,
  List,
  Radio,
  Progress,
} from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  ReloadOutlined,
  DollarOutlined,
  UserOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  StarOutlined,
  CalendarOutlined,
  CarOutlined,
  EyeOutlined,
  UnorderedListOutlined,
  ToolOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  PlusOutlined,
  MinusOutlined,
  ExclamationCircleOutlined,
  SaveOutlined,
  AppstoreOutlined,
  ProfileOutlined,
  ThunderboltOutlined,
  CrownOutlined,
} from '@ant-design/icons';
import { api, ApiError } from '../../../_lib/api';

const { TextArea } = Input;
const { Title, Text } = Typography;
const { useToken } = theme;
const { Panel } = Collapse;

// ============================================
// TYPES
// ============================================

interface PendingRequest {
  id: string;
  type: string;
  address: string;
  lat: string;
  lng: string;
  customerNotes: string;
  createdAt: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  status?: string;
  assignedMistriId?: string;
  mistriName?: string;
  paymentAmount?: string;
}

interface PlatformService {
  id: string;
  name: string;
  price: string;
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
  currentJobs?: number;
  skills?: string[];
  distance?: number;
}

interface AssignedRequest {
  id: string;
  type: string;
  address: string;
  status: string;
  paymentAmount: string | null;
  createdAt: string;
  assignedAt: string | null;
  completedAt: string | null;
  customerName: string;
  customerPhone: string;
  assignedMistriId?: string;
  mistriName: string | null;
  mistriPhone?: string;
  mistriRating?: string;
  mistriJobs?: number;
}

interface RequestDetails extends PendingRequest {
  platformServices?: PlatformService[];
}

interface WorkerStats {
  totalWorkers: number;
  availableWorkers: number;
  busyWorkers: number;
  totalIncompleteJobs: number;
  workersByService: Record<string, number>;
}

interface AssignedMistriDetails {
  id: string;
  fullName: string;
  phoneNumber: string;
  averageRating: string | null;
  jobsCompleted: number | null;
  profilePhotoUrl: string | null;
}

// Service ID mapping
const SERVICE_NAME_TO_ID: Record<string, number> = {
  'plumber': 1,
  'electrician': 2,
  'painter': 3,
  'cleaning': 4,
  'carpenter': 5,
  'ac_repair': 6,
};

const SERVICE_ID_TO_NAME: Record<number, string> = {
  1: 'Plumber',
  2: 'Electrician',
  3: 'Painter',
  4: 'Cleaner',
  5: 'Carpenter',
  6: 'AC Repair',
};

const SERVICE_DISPLAY_NAMES: Record<string, string> = {
  'plumber': 'Plumbing',
  'electrician': 'Electrical',
  'painter': 'Painting',
  'cleaning': 'Cleaning',
  'carpenter': 'Carpentry',
  'ac_repair': 'AC Repair',
};

// Category Colors
const CATEGORY_COLORS: Record<string, string> = {
  'Plumber': '#e67e22',
  'Plumbing': '#e67e22',
  'Electrician': '#f1c40f',
  'Electrical': '#f1c40f',
  'Painter': '#3498db',
  'Painting': '#3498db',
  'Carpenter': '#2ecc71',
  'Carpentry': '#2ecc71',
  'Cleaner': '#1abc9c',
  'Cleaning': '#1abc9c',
  'AC Repair': '#9b59b6',
  'General': '#95a5a6',
};

function PendingRequestsContent() {
  const { token } = useToken();
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [allRequests, setAllRequests] = useState<AssignedRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PendingRequest | null>(null);
  const [requestDetails, setRequestDetails] = useState<RequestDetails | null>(null);
  const [allMistris, setAllMistris] = useState<Mistri[]>([]);
  const [filteredMistris, setFilteredMistris] = useState<Mistri[]>([]);
  const [selectedMistri, setSelectedMistri] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [adminNotes, setAdminNotes] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [pagination, setPagination] = useState({ page: 1, total: 0, limit: 20 });
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [viewDetailsModalVisible, setViewDetailsModalVisible] = useState(false);
  const [selectedAssignedRequest, setSelectedAssignedRequest] = useState<AssignedRequest | null>(null);
  const [assignedMistriDetails, setAssignedMistriDetails] = useState<AssignedMistriDetails | null>(null);
  const [loadingMistriDetails, setLoadingMistriDetails] = useState(false);
  const [workerStats, setWorkerStats] = useState<WorkerStats>({
    totalWorkers: 0,
    availableWorkers: 0,
    busyWorkers: 0,
    totalIncompleteJobs: 0,
    workersByService: {},
  });
  const [viewType, setViewType] = useState<'service_request'>('service_request');

  useEffect(() => {
    loadPendingRequests();
    loadWorkerStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'all') {
      loadAllRequests();
    }
  }, [activeTab, pagination.page]);

  const loadWorkerStats = async () => {
    try {
      const mistrisResponse = await api.get('/admin/available-mistris?limit=100');
      if (mistrisResponse.success) {
        const allMistrisData = mistrisResponse.mistris || [];
        let totalIncomplete = 0;

        const workersByService: Record<string, number> = {};
        let availableCount = 0;
        let busyCount = 0;

        for (const mistri of allMistrisData) {
          const serviceName = mistri.serviceName || 'Unknown';
          workersByService[serviceName] = (workersByService[serviceName] || 0) + 1;

          if (mistri.isAvailable) {
            availableCount++;
          } else {
            busyCount++;
          }

          try {
            const jobsResponse = await api.get(`/admin/mistri-jobs/${mistri.id}?status=assigned`);
            totalIncomplete += jobsResponse.success ? (jobsResponse.count || 0) : 0;
          } catch (error) {
            console.error(`Failed to get jobs for mistri ${mistri.id}:`, error);
          }
        }

        setWorkerStats({
          totalWorkers: allMistrisData.length,
          availableWorkers: availableCount,
          busyWorkers: busyCount,
          totalIncompleteJobs: totalIncomplete,
          workersByService,
        });
      }
    } catch (error) {
      console.error('Failed to load worker stats:', error);
    }
  };

  const loadPendingRequests = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/all-requests?limit=100');

      if (response.success) {
        const pending = (response.requests || []).filter(
          (req: any) => {
            const isPendingStatus = req.status === 'pending';
            const noMistri = !req.assignedMistriId && !req.mistriName;
            const notAssigned = req.status !== 'assigned' && req.status !== 'completed' && req.status !== 'canceled';
            return isPendingStatus && (noMistri || notAssigned);
          }
        );
        setPendingRequests(pending);
        console.log('Loaded pending requests:', pending.length);
      }
    } catch (error: any) {
      console.error('Failed to load pending requests:', error);
      message.error(error?.message || 'Failed to load pending requests');
    } finally {
      setLoading(false);
    }
  };

  const loadAllRequests = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/all-requests?page=${pagination.page}&limit=${pagination.limit}`);
      if (response.success) {
        setAllRequests(response.requests);
        setPagination({ ...pagination, total: response.pagination.total });
      }
    } catch (error: any) {
      console.error('Failed to load all requests:', error);
      message.error(error?.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableMistris = async () => {
    try {
      const response = await api.get('/admin/available-mistris');
      if (response.success) {
        const mistrisWithJobs = await Promise.all(
          (response.mistris || []).map(async (mistri: Mistri) => {
            try {
              const jobsResponse = await api.get(`/admin/mistri-jobs/${mistri.id}?status=assigned`);
              return {
                ...mistri,
                currentJobs: jobsResponse.success ? (jobsResponse.count || 0) : 0,
              };
            } catch {
              return { ...mistri, currentJobs: 0 };
            }
          })
        );
        setAllMistris(mistrisWithJobs);

        // Filter based on current selection
        if (selectedRequest) {
          filterMistrisByService(mistrisWithJobs, selectedRequest.type);
        }
      }
    } catch (error: any) {
      console.error('Failed to load mistris:', error);
      message.error(error?.message || 'Failed to load mistris');
    }
  };

  const filterMistrisByService = (mistris: Mistri[], serviceType: string) => {
    const requestedServiceId = SERVICE_NAME_TO_ID[serviceType?.toLowerCase()];

    if (!requestedServiceId) {
      console.warn(`No service ID found for type: ${serviceType}`);
      setFilteredMistris(mistris);
      return;
    }

    const filtered = mistris.filter(mistri => {
      if (mistri.serviceId === requestedServiceId) {
        return true;
      }

      if (mistri.serviceName) {
        const serviceName = SERVICE_ID_TO_NAME[requestedServiceId];
        return mistri.serviceName.toLowerCase() === serviceType.toLowerCase() ||
          mistri.serviceName.toLowerCase() === serviceName?.toLowerCase();
      }

      return false;
    });

    setFilteredMistris(filtered);
  };

  const loadRequestDetails = async (requestId: string) => {
    setLoadingDetails(true);
    try {
      console.log('🔍 Loading request details for ID:', requestId);

      const response = await api.get(`/admin/pending-requests/${requestId}`);
      console.log('📦 Response from /admin/pending-requests:', response);

      if (response.success) {
        setRequestDetails(response.request);

        let services = response.platformServices || response.request?.platformServices || [];
        let totalAmount = 0;

        if (services.length > 0) {
          totalAmount = services.reduce(
            (sum: number, service: PlatformService) => sum + parseFloat(service.price || '0'),
            0
          );
          console.log('💰 Total from platform services:', totalAmount);
        }

        const directAmount = response.request?.paymentAmount || response.paymentAmount;
        if (directAmount && !totalAmount) {
          totalAmount = parseFloat(directAmount);
          console.log('💰 Using direct paymentAmount:', totalAmount);
        }

        if (!totalAmount) {
          const defaultAmounts: Record<string, number> = {
            'plumber': 1500,
            'electrician': 2000,
            'painter': 1800,
            'carpenter': 2200,
            'cleaning': 1200,
            'ac_repair': 2500,
          };
          const typeLower = response.request?.type?.toLowerCase() || '';
          totalAmount = defaultAmounts[typeLower] || 1500;
          console.log('💰 Using default amount for type:', typeLower, totalAmount);
        }

        setPaymentAmount(Math.round(totalAmount));
      }
    } catch (error: any) {
      console.error('Failed to load request details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const loadAssignedMistriDetails = async (mistriId: string) => {
    setLoadingMistriDetails(true);
    try {
      const response = await api.get(`/admin/mistris/${mistriId}`);
      if (response.success && response.mistri) {
        setAssignedMistriDetails(response.mistri);
      }
    } catch (error) {
      console.error('Failed to load mistri details:', error);
    } finally {
      setLoadingMistriDetails(false);
    }
  };

  const handleViewDetails = async (record: AssignedRequest) => {
    setSelectedAssignedRequest(record);
    setViewType('service_request');
    if (record.assignedMistriId) {
      await loadAssignedMistriDetails(record.assignedMistriId);
    } else {
      setAssignedMistriDetails(null);
    }
    setViewDetailsModalVisible(true);
  };

  const openAssignModal = async (request: PendingRequest) => {
    setSelectedRequest(request);
    setSelectedMistri('');
    setAdminNotes('');
    setRequestDetails(null);
    setPaymentAmount(0);
    setViewType('service_request');
    setAssignModalVisible(true);

    await loadAvailableMistris();
    await loadRequestDetails(request.id);

    if (request.type && allMistris.length > 0) {
      filterMistrisByService(allMistris, request.type);
    }
  };

  useEffect(() => {
    if (selectedRequest && allMistris.length > 0) {
      filterMistrisByService(allMistris, selectedRequest.type);
    }
  }, [allMistris, selectedRequest]);

  const handleAssign = (request: PendingRequest) => openAssignModal(request);

  const handleReject = (request: PendingRequest) => {
    setSelectedRequest(request);
    setRejectReason('');
    setRejectModalVisible(true);
  };

  const confirmAssign = async () => {
    if (!selectedMistri) {
      message.error('Please select a mistri');
      return;
    }

    setAssigning(true);
    try {
      let response;

      if (viewType === 'service_request' && selectedRequest) {
        // Assign service request
        const requestData = {
          mistriId: selectedMistri,
          paymentAmount: paymentAmount,
          adminNotes: adminNotes,
        };
        response = await api.post(`/admin/pending-requests/${selectedRequest.id}/assign`, requestData);

        if (response.success) {
          message.success('Request assigned successfully');
          setAssignModalVisible(false);
          await loadPendingRequests();
          await loadAllRequests();
          loadWorkerStats();
        } else {
          message.error(response.message || 'Failed to assign request');
        }
      }
    } catch (error: any) {
      console.error('Failed to assign:', error);
      message.error(error?.message || 'Failed to assign');
    } finally {
      setAssigning(false);
    }
  };

  const confirmReject = async () => {
    setAssigning(true);
    try {
      const response = await api.post(`/admin/pending-requests/${selectedRequest!.id}/reject`, {
        reason: rejectReason,
      });
      if (response.success) {
        message.success('Request rejected');
        setRejectModalVisible(false);
        loadPendingRequests();
        if (activeTab === 'all') loadAllRequests();
      } else {
        message.error(response.message || 'Failed to reject request');
      }
    } catch (error: any) {
      console.error('Failed to reject request:', error);
      message.error(error?.message || 'Failed to reject request');
    } finally {
      setAssigning(false);
    }
  };

  const getServiceDisplayName = (serviceType: string) => {
    return SERVICE_DISPLAY_NAMES[serviceType?.toLowerCase()] || serviceType;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'orange',
      'assigned': 'blue',
      'completed': 'green',
      'canceled': 'red',
      'rejected': 'red',
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'pending': 'Pending',
      'assigned': 'Assigned',
      'completed': 'Completed',
      'canceled': 'Cancelled',
      'rejected': 'Rejected',
    };
    return labels[status] || status;
  };

  // Stats Cards Component
  const StatsCards = () => (
    <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
      <Col xs={12} sm={6}>
        <Card style={{ borderRadius: 12, textAlign: 'center' }}>
          <Statistic
            title="Total Workers"
            value={workerStats.totalWorkers}
            prefix={<TeamOutlined />}
            valueStyle={{ color: token.colorPrimary }}
          />
        </Card>
      </Col>
      <Col xs={12} sm={6}>
        <Card style={{ borderRadius: 12, textAlign: 'center' }}>
          <Statistic
            title="Available"
            value={workerStats.availableWorkers}
            prefix={<CheckCircleOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
      </Col>
      <Col xs={12} sm={6}>
        <Card style={{ borderRadius: 12, textAlign: 'center' }}>
          <Statistic
            title="Busy"
            value={workerStats.busyWorkers}
            prefix={<ClockCircleOutlined />}
            valueStyle={{ color: '#faad14' }}
          />
        </Card>
      </Col>
      <Col xs={12} sm={6}>
        <Card style={{ borderRadius: 12, textAlign: 'center' }}>
          <Statistic
            title="Incomplete Jobs"
            value={workerStats.totalIncompleteJobs}
            prefix={<WarningOutlined />}
            valueStyle={{ color: '#ff4d4f' }}
          />
        </Card>
      </Col>
    </Row>
  );

  // Pending Requests Columns
  const pendingColumns = [
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 180,
      render: (name: string, record: PendingRequest) => (
        <Space direction="vertical" size={0}>
          <Text strong>{name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <PhoneOutlined style={{ marginRight: 4 }} />
            {record.customerPhone}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Service',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => (
        <Tag icon={<CarOutlined />} color="blue" style={{ borderRadius: 16, padding: '4px 12px' }}>
          {getServiceDisplayName(type)}
        </Tag>
      ),
    },
    {
      title: 'Location',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
      render: (address: string) => (
        <Tooltip title={address}>
          <Space>
            <EnvironmentOutlined style={{ color: token.colorTextSecondary }} />
            <Text style={{ maxWidth: 200 }} ellipsis>
              {address}
            </Text>
          </Space>
        </Tooltip>
      ),
    },
    {
      title: 'Notes',
      dataIndex: 'customerNotes',
      key: 'customerNotes',
      width: 150,
      ellipsis: true,
      render: (notes: string) => (
        notes ? (
          <Tooltip title={notes}>
            <Text type="secondary">{notes.length > 30 ? notes.substring(0, 30) + '...' : notes}</Text>
          </Tooltip>
        ) : <Text type="secondary">—</Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        if (status === 'pending' || !status) {
          return (
            <Tag color="orange" icon={<ClockCircleOutlined />} style={{ borderRadius: 16, padding: '4px 12px' }}>
              Pending
            </Tag>
          );
        }
        return <Tag color="default">{status || 'Pending'}</Tag>;
      },
    },
    {
      title: 'Requested',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => (
        <Space direction="vertical" size={0}>
          <Text>{new Date(date).toLocaleDateString()}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>{new Date(date).toLocaleTimeString()}</Text>
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 220,
      fixed: 'right' as const,
      render: (_: any, record: PendingRequest) => {
        if (record.status === 'pending' || !record.status) {
          return (
            <Space>
              <Tooltip title="Assign Mistri">
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={() => handleAssign(record)}
                  size="middle"
                >
                  Assign
                </Button>
              </Tooltip>
              <Tooltip title="Reject Request">
                <Button
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => handleReject(record)}
                  size="middle"
                />
              </Tooltip>
            </Space>
          );
        }
        return <Tag color="default">Completed</Tag>;
      },
    },
  ];

  const allColumns = [
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 160,
      render: (name: string, record: any) => (
        <Space direction="vertical" size={0}>
          <Text strong>{name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.customerPhone}</Text>
        </Space>
      ),
    },
    {
      title: 'Service',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => (
        <Tag icon={<CarOutlined />} color="blue">
          {getServiceDisplayName(type)}
        </Tag>
      ),
    },
    {
      title: 'Mistri',
      dataIndex: 'mistriName',
      key: 'mistriName',
      width: 140,
      render: (name: string, record: any) => (
        name ? (
          <Space>
            <Avatar size="small" style={{ backgroundColor: '#e67e22' }}>
              {name.charAt(0).toUpperCase()}
            </Avatar>
            <Text>{name}</Text>
          </Space>
        ) : <Tag color="default">Not assigned</Tag>
      ),
    },
    {
      title: 'Total',
      dataIndex: 'paymentAmount',
      key: 'paymentAmount',
      width: 120,
      render: (amount: string) => (
        amount ? (
          <Tag color="green" style={{ borderRadius: 16 }}>रु {parseFloat(amount).toLocaleString()}</Tag>
        ) : <Text type="secondary">—</Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const color = getStatusColor(status);
        const label = getStatusLabel(status);
        return <Tag color={color} style={{ borderRadius: 16 }}>{label}</Tag>;
      },
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 110,
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_: any, record: any) => (
        <Tooltip title="View Details">
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
            size="small"
          />
        </Tooltip>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'pending',
      label: (
        <span>
          <ClockCircleOutlined style={{ marginRight: 8 }} />
          Pending Approval
          <Badge count={pendingRequests.length} style={{ marginLeft: 8, backgroundColor: '#faad14' }} />
        </span>
      ),
      children: (
        <Table
          columns={pendingColumns}
          dataSource={pendingRequests}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showTotal: (total) => `Total ${total} requests` }}
          scroll={{ x: 1200 }}
          locale={{ emptyText: 'No pending service requests' }}
        />
      ),
    },
    {
      key: 'all',
      label: (
        <span>
          <UnorderedListOutlined style={{ marginRight: 8 }} />
          All Requests
        </span>
      ),
      children: (
        <Table
          columns={allColumns}
          dataSource={allRequests}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showTotal: (total) => `Total ${total} requests`,
            onChange: (page) => setPagination({ ...pagination, page }),
          }}
          scroll={{ x: 1100 }}
        />
      ),
    },
  ];

  return (
    <div style={{ padding: 24, minHeight: '100vh', background: '#f0f2f5' }}>
      <Card style={{ borderRadius: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>Service Request Management</Title>
            <Text type="secondary">Review and assign service requests to available mistris</Text>
          </div>
          <Button icon={<ReloadOutlined />} onClick={() => {
            if (activeTab === 'pending') {
              loadPendingRequests();
            } else {
              loadAllRequests();
            }
            loadWorkerStats();
          }}>
            Refresh
          </Button>
        </div>

        <StatsCards />

        <Alert
          message="Smart Assignment"
          description="When assigning a request, only mistris with matching skills will be shown. A carpenter cannot be assigned to a plumbing job, and vice versa."
          type="info"
          showIcon
          style={{ marginBottom: 20, borderRadius: 12 }}
        />

        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} type="card" />
      </Card>

      {/* Assign Modal */}
      <Modal
        title={
          <Space>
            <CheckCircleOutlined style={{ color: token.colorPrimary }} />
            <span>Assign Service Request</span>
          </Space>
        }
        open={assignModalVisible}
        onOk={confirmAssign}
        onCancel={() => {
          setAssignModalVisible(false);
        }}
        confirmLoading={assigning}
        width={800}
        okText="Assign"
        cancelText="Cancel"
      >
        {selectedRequest ? (
          <>
            <div style={{ marginBottom: 24 }}>
              <div style={{ background: token.colorPrimaryBg, padding: '12px 16px', borderRadius: 12, marginBottom: 16 }}>
                <Text strong>Request Details</Text>
                {selectedRequest && (
                  <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                    Service: {getServiceDisplayName(selectedRequest.type)}
                  </Text>
                )}
              </div>

              {loadingDetails ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <Spin />
                </div>
              ) : (
                <>
                  <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
                    <Descriptions.Item label={<><UserOutlined /> Customer</>}>
                      <Text strong>{selectedRequest.customerName}</Text>
                      <br />
                      <Text type="secondary">{selectedRequest.customerPhone}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Service">
                      <Tag color="blue" style={{ borderRadius: 16, padding: '4px 12px' }}>
                        <ToolOutlined /> {getServiceDisplayName(selectedRequest.type)}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Address">
                      <EnvironmentOutlined style={{ marginRight: 8 }} />
                      {selectedRequest.address}
                    </Descriptions.Item>
                    <Descriptions.Item label="Customer Notes">
                      {selectedRequest.customerNotes || <Text type="secondary">No notes provided</Text>}
                    </Descriptions.Item>
                    <Descriptions.Item label="Requested At">
                      <CalendarOutlined style={{ marginRight: 8 }} />
                      {new Date(selectedRequest.createdAt).toLocaleString()}
                    </Descriptions.Item>
                  </Descriptions>
                </>
              )}
            </div>

            <div>
              <div style={{ background: token.colorPrimaryBg, padding: '12px 16px', borderRadius: 12, marginBottom: 16 }}>
                <Text strong>Assignment Details</Text>
                <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                  {selectedRequest 
                    ? `Showing only ${getServiceDisplayName(selectedRequest.type)} professionals (${filteredMistris.length} available)`
                    : `Showing available professionals (${filteredMistris.length} available)`
                  }
                </Text>
              </div>

              <div style={{ marginBottom: 16 }}>
                <Text strong>Select Mistri</Text>
                <Select
                  placeholder="Choose a mistri to assign"
                  style={{ width: '100%', marginTop: 8 }}
                  value={selectedMistri}
                  onChange={setSelectedMistri}
                  showSearch
                  size="large"
                  notFoundContent={filteredMistris.length === 0 ? 'No mistris available for this category' : 'No mistris found'}
                >
                  {filteredMistris.map((mistri) => (
                    <Select.Option key={mistri.id} value={mistri.id}>
                      <Space direction="vertical" size={0} style={{ width: '100%' }}>
                        <Space>
                          <Avatar size="small" style={{ backgroundColor: token.colorPrimary }}>
                            {mistri.fullName.charAt(0).toUpperCase()}
                          </Avatar>
                          <span>{mistri.fullName}</span>
                          <Tag color={mistri.isAvailable ? 'success' : 'warning'} style={{ borderRadius: 12 }}>
                            {mistri.isAvailable ? '🟢 Available' : '🔴 Busy'}
                          </Tag>
                          {mistri.averageRating && parseFloat(mistri.averageRating) > 0 && (
                            <Tag color="gold" style={{ borderRadius: 12 }}>
                              ⭐ {mistri.averageRating}
                            </Tag>
                          )}
                          {mistri.currentJobs && mistri.currentJobs > 0 && (
                            <Tag color="blue" style={{ borderRadius: 12 }}>
                              {mistri.currentJobs} active
                            </Tag>
                          )}
                        </Space>
                        <Text type="secondary" style={{ fontSize: 11, marginLeft: 36 }}>
                          {mistri.serviceName || 'General'} •
                          {mistri.jobsCompleted !== null && ` ${mistri.jobsCompleted} jobs completed`}
                        </Text>
                      </Space>
                    </Select.Option>
                  ))}
                </Select>
              </div>

              <div style={{ marginBottom: 16 }}>
                <Text strong>Set Payment Amount (NPR)</Text>
                <InputNumber
                  style={{ width: '100%', marginTop: 8 }}
                  value={paymentAmount}
                  onChange={(value) => setPaymentAmount(value || 0)}
                  min={0}
                  step={100}
                  size="large"
                  prefix={<DollarOutlined />}
                  formatter={value => `रु ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value!.replace(/रु\s?|(,*)/g, '') as unknown as number}
                  placeholder="Enter payment amount"
                />
                <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                  This amount will be shown to the customer
                </Text>
              </div>

              <div>
                <Text strong>Admin Notes (Optional)</Text>
                <TextArea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add any instructions for the mistri"
                  style={{ marginTop: 8, borderRadius: 12 }}
                />
              </div>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin />
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        title={
          <Space>
            <CloseOutlined style={{ color: '#ff4d4f' }} />
            <span>Reject Service Request</span>
          </Space>
        }
        open={rejectModalVisible}
        onOk={confirmReject}
        onCancel={() => setRejectModalVisible(false)}
        confirmLoading={assigning}
        okText="Reject Request"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
      >
        <Alert
          message="Confirm Rejection"
          description="Are you sure you want to reject this service request? The customer will be notified."
          type="warning"
          showIcon
          style={{ marginBottom: 16, borderRadius: 12 }}
        />
        <Text strong>Reason for rejection (optional):</Text>
        <TextArea
          rows={3}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Provide a reason to inform the customer"
          style={{ marginTop: 8, borderRadius: 12 }}
        />
      </Modal>

      {/* View Details Modal */}
      <Modal
        title={
          <Space>
            <EyeOutlined style={{ color: token.colorPrimary }} />
            <span>Service Request Details</span>
          </Space>
        }
        open={viewDetailsModalVisible}
        onCancel={() => {
          setViewDetailsModalVisible(false);
          setSelectedAssignedRequest(null);
          setAssignedMistriDetails(null);
        }}
        footer={[
          <Button key="close" onClick={() => setViewDetailsModalVisible(false)}>
            Close
          </Button>
        ]}
        width={800}
      >
        {selectedAssignedRequest && (
          <>
            <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Request ID">
                <Text code>{selectedAssignedRequest.id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={<><UserOutlined /> Customer</>}>
                <Text strong>{selectedAssignedRequest.customerName}</Text>
                <br />
                <Text type="secondary">{selectedAssignedRequest.customerPhone}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Service Type">
                <Tag color="blue">{getServiceDisplayName(selectedAssignedRequest.type)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Address">
                <EnvironmentOutlined style={{ marginRight: 8 }} />
                {selectedAssignedRequest.address}
              </Descriptions.Item>
              <Descriptions.Item label="Payment Amount">
                {selectedAssignedRequest.paymentAmount ? (
                  <Tag color="green">रु {parseFloat(selectedAssignedRequest.paymentAmount).toLocaleString()}</Tag>
                ) : <Text type="secondary">Not set</Text>}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={getStatusColor(selectedAssignedRequest.status)}>
                  {getStatusLabel(selectedAssignedRequest.status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Created At">
                <CalendarOutlined style={{ marginRight: 8 }} />
                {new Date(selectedAssignedRequest.createdAt).toLocaleString()}
              </Descriptions.Item>
              {selectedAssignedRequest.assignedAt && (
                <Descriptions.Item label="Assigned At">
                  <ClockCircleOutlined style={{ marginRight: 8 }} />
                  {new Date(selectedAssignedRequest.assignedAt).toLocaleString()}
                </Descriptions.Item>
              )}
              {selectedAssignedRequest.completedAt && (
                <Descriptions.Item label="Completed At">
                  <CheckCircleOutlined style={{ marginRight: 8 }} />
                  {new Date(selectedAssignedRequest.completedAt).toLocaleString()}
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* Assigned Mistri Details */}
            {selectedAssignedRequest.mistriName && (
              <div>
                <div style={{ background: token.colorPrimaryBg, padding: '12px 16px', borderRadius: 12, marginBottom: 16 }}>
                  <Text strong><TeamOutlined /> Assigned Professional</Text>
                </div>

                {loadingMistriDetails ? (
                  <div style={{ textAlign: 'center', padding: 20 }}>
                    <Spin />
                  </div>
                ) : assignedMistriDetails ? (
                  <Descriptions column={1} size="small" bordered>
                    <Descriptions.Item label="Name">
                      <Space>
                        <Avatar style={{ backgroundColor: '#e67e22' }}>
                          {assignedMistriDetails.fullName.charAt(0).toUpperCase()}
                        </Avatar>
                        <Text strong>{assignedMistriDetails.fullName}</Text>
                      </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="Phone">
                      <PhoneOutlined style={{ marginRight: 8 }} />
                      {assignedMistriDetails.phoneNumber}
                    </Descriptions.Item>
                    {assignedMistriDetails.averageRating && (
                      <Descriptions.Item label="Rating">
                        <StarOutlined style={{ color: '#faad14', marginRight: 4 }} />
                        {assignedMistriDetails.averageRating} / 5
                      </Descriptions.Item>
                    )}
                    {assignedMistriDetails.jobsCompleted !== null && (
                      <Descriptions.Item label="Jobs Completed">
                        <CheckCircleOutlined style={{ marginRight: 8 }} />
                        {assignedMistriDetails.jobsCompleted} jobs
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                ) : (
                  <Text type="secondary">Professional details not available</Text>
                )}
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}

export default function PendingRequestsPage() {
  return (
    <App>
      <PendingRequestsContent />
    </App>
  );
}