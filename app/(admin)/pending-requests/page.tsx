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
  List,
  Divider,
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
  EyeOutlined,
  TeamOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { api } from '../../../_lib/api';

const { TextArea } = Input;
const { Title, Text } = Typography;

// Types
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
}

interface Mistri {
  id: string;
  fullName: string;
  phoneNumber: string;
  serviceId: number | null;
  profilePhotoUrl: string | null;
  isAvailable: boolean;
  availabilityStatus: string;
  averageRating: string | null;
  jobsCompleted: number | null;
  currentJobs?: number;
  serviceName?: string;
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
  mistriName: string | null;
}

interface RequestDetails extends PendingRequest {
  platformServices?: Array<{
    id: string;
    name: string;
    price: string;
  }>;
}

interface WorkerStats {
  totalWorkers: number;
  availableWorkers: number;
  busyWorkers: number;
  totalIncompleteJobs: number;
  workersWithJobs: Array<{
    id: string;
    name: string;
    phone: string;
    activeJobs: number;
    rating: string;
  }>;
}

export default function PendingRequestsPage() {
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [allRequests, setAllRequests] = useState<AssignedRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PendingRequest | null>(null);
  const [requestDetails, setRequestDetails] = useState<RequestDetails | null>(null);
  const [mistris, setMistris] = useState<Mistri[]>([]);
  const [selectedMistri, setSelectedMistri] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [adminNotes, setAdminNotes] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [pagination, setPagination] = useState({ page: 1, total: 0, limit: 20 });
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [workerStats, setWorkerStats] = useState<WorkerStats>({
    totalWorkers: 0,
    availableWorkers: 0,
    busyWorkers: 0,
    totalIncompleteJobs: 0,
    workersWithJobs: [],
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

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
        const allMistris = mistrisResponse.mistris || [];
        
        const workersWithJobsData = [];
        let totalIncomplete = 0;
        
        for (const mistri of allMistris) {
          try {
            const jobsResponse = await api.get(`/admin/mistri-jobs/${mistri.id}?status=assigned`);
            const activeJobs = jobsResponse.success ? (jobsResponse.count || 0) : 0;
            totalIncomplete += activeJobs;
            
            if (activeJobs > 0) {
              workersWithJobsData.push({
                id: mistri.id,
                name: mistri.fullName,
                phone: mistri.phoneNumber,
                activeJobs: activeJobs,
                rating: mistri.averageRating || 'N/A',
              });
            }
          } catch (error) {
            console.error(`Failed to get jobs for mistri ${mistri.id}:`, error);
          }
        }
        
        setWorkerStats({
          totalWorkers: allMistris.length,
          availableWorkers: allMistris.filter((m: Mistri) => m.isAvailable).length,
          busyWorkers: allMistris.filter((m: Mistri) => !m.isAvailable).length,
          totalIncompleteJobs: totalIncomplete,
          workersWithJobs: workersWithJobsData.sort((a, b) => b.activeJobs - a.activeJobs),
        });
      }
    } catch (error) {
      console.error('Failed to load worker stats:', error);
    }
  };

  const loadPendingRequests = async () => {
    setLoading(true);
    try {
      let response;
      try {
        response = await api.get('/admin/pending-requests');
      } catch (error) {
        response = await api.get('/admin/all-requests?status=pending');
      }
      
      if (response.success) {
        const pending = (response.requests || []).filter(
          (req: any) => req.status === 'pending_approval' || req.status === 'pending'
        );
        setPendingRequests(pending);
      }
    } catch (error: any) {
      console.error('Failed to load pending requests:', error);
      message.error(error?.message || 'Failed to load pending requests');
      try {
        const allResponse = await api.get('/admin/all-requests');
        if (allResponse.success) {
          const pending = (allResponse.requests || []).filter(
            (req: any) => req.status === 'pending_approval' || req.status === 'pending'
          );
          setPendingRequests(pending);
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
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
        setMistris(mistrisWithJobs);
      }
    } catch (error: any) {
      console.error('Failed to load mistris:', error);
      message.error(error?.message || 'Failed to load mistris');
    }
  };

  const loadRequestDetails = async (requestId: string) => {
    setLoadingDetails(true);
    try {
      const response = await api.get(`/admin/pending-requests/${requestId}`);
      if (response.success) {
        setRequestDetails(response.request);
        if (response.platformServices && response.platformServices.length > 0) {
          const suggestedPrice = response.platformServices.reduce(
            (sum: number, service: any) => sum + parseFloat(service.price || '0'), 
            0
          );
          if (suggestedPrice > 0) {
            setPaymentAmount(suggestedPrice);
          }
        }
      }
    } catch (error: any) {
      console.error('Failed to load request details:', error);
      message.error(error?.message || 'Failed to load request details');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Function to open assign modal for a specific request
  const openAssignModal = async (request: PendingRequest) => {
    setSelectedRequest(request);
    setSelectedMistri('');
    setPaymentAmount(0);
    setAdminNotes('');
    setRequestDetails(null);
    setAssignModalVisible(true);
    await loadAvailableMistris();
    await loadRequestDetails(request.id);
  };

  const handleAssign = (request: PendingRequest) => {
    openAssignModal(request);
  };

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
    if (!paymentAmount || paymentAmount <= 0) {
      message.error('Please enter a valid payment amount');
      return;
    }

    setAssigning(true);
    try {
      const response = await api.post(`/admin/pending-requests/${selectedRequest!.id}/assign`, {
        mistriId: selectedMistri,
        paymentAmount,
        adminNotes,
      });

      if (response.success) {
        message.success('Request assigned successfully');
        setAssignModalVisible(false);
        loadPendingRequests();
        loadWorkerStats();
        if (activeTab === 'all') {
          loadAllRequests();
        }
      } else {
        message.error(response.message || 'Failed to assign request');
      }
    } catch (error: any) {
      console.error('Failed to assign request:', error);
      message.error(error?.response?.data?.message || error?.message || 'Failed to assign request');
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
        if (activeTab === 'all') {
          loadAllRequests();
        }
      } else {
        message.error(response.message || 'Failed to reject request');
      }
    } catch (error: any) {
      console.error('Failed to reject request:', error);
      message.error(error?.response?.data?.message || error?.message || 'Failed to reject request');
    } finally {
      setAssigning(false);
    }
  };

  const pendingColumns = [
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 180,
      render: (name: string, record: PendingRequest) => (
        <div>
          <div><strong>{name}</strong></div>
          <small style={{ color: '#666' }}>
            <PhoneOutlined style={{ marginRight: 4 }} />
            {record.customerPhone}
          </small>
        </div>
      ),
    },
    {
      title: 'Service Type',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
      render: (address: string) => (
        <span title={address}>
          <EnvironmentOutlined style={{ marginRight: 4, color: '#666' }} />
          {address.length > 60 ? address.substring(0, 60) + '...' : address}
        </span>
      ),
    },
    {
      title: 'Customer Notes',
      dataIndex: 'customerNotes',
      key: 'customerNotes',
      width: 200,
      ellipsis: true,
      render: (notes: string) => notes || <Text type="secondary">—</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => {
        if (status === 'pending_approval' || status === 'pending') {
          return <Tag color="orange">Pending Approval</Tag>;
        }
        return <Tag color="default">{status}</Tag>;
      },
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => (
        <span>
          <ClockCircleOutlined style={{ marginRight: 4, color: '#666' }} />
          {new Date(date).toLocaleString()}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: PendingRequest) => (
        <Space>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => handleAssign(record)}
            size="small"
          >
            Assign
          </Button>
          <Button
            danger
            icon={<CloseOutlined />}
            onClick={() => handleReject(record)}
            size="small"
          >
            Reject
          </Button>
        </Space>
      ),
    },
  ];

  const allColumns = [
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 180,
      render: (name: string, record: AssignedRequest) => (
        <div>
          <div><strong>{name}</strong></div>
          <small style={{ color: '#666' }}>{record.customerPhone}</small>
        </div>
      ),
    },
    {
      title: 'Service',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: 'Mistri',
      dataIndex: 'mistriName',
      key: 'mistriName',
      width: 150,
      render: (name: string) => name || <Text type="secondary">Not assigned</Text>,
    },
    {
      title: 'Payment',
      dataIndex: 'paymentAmount',
      key: 'paymentAmount',
      width: 120,
      render: (amount: string) => 
        amount ? <Tag color="green">NPR {parseFloat(amount).toLocaleString()}</Tag> : <Text type="secondary">—</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => {
        const config: Record<string, { color: string; label: string }> = {
          pending_approval: { color: 'orange', label: 'Pending Approval' },
          pending: { color: 'orange', label: 'Pending' },
          assigned: { color: 'blue', label: 'Assigned' },
          completed: { color: 'green', label: 'Completed' },
          canceled: { color: 'red', label: 'Canceled' },
        };
        const { color, label } = config[status] || { color: 'default', label: status };
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 110,
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
  ];

  const tabItems = [
    {
      key: 'pending',
      label: `Pending Approval (${pendingRequests.length})`,
      children: (
        <>
          {/* Add a "Bulk Assign" button if multiple requests selected */}
          {selectedRowKeys.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <Button 
                type="primary" 
                icon={<CheckOutlined />}
                onClick={() => {
                  message.info(`Bulk assign for ${selectedRowKeys.length} requests coming soon`);
                }}
              >
                Assign Selected ({selectedRowKeys.length})
              </Button>
            </div>
          )}
          <Table
            columns={pendingColumns}
            dataSource={pendingRequests}
            rowKey="id"
            loading={loading}
            rowSelection={{
              selectedRowKeys,
              onChange: (selectedKeys) => setSelectedRowKeys(selectedKeys),
            }}
            pagination={{ pageSize: 10, showTotal: (total) => `Total ${total} requests` }}
            scroll={{ x: 1000 }}
          />
        </>
      ),
    },
    {
      key: 'all',
      label: 'All Requests',
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
          scroll={{ x: 900 }}
        />
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', minHeight: '100vh', background: '#f0f2f5' }}>
      <Row gutter={24}>
        {/* Left Column - Main Content */}
        <Col xs={24} lg={18}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Title level={3} style={{ margin: 0 }}>
                Service Request Management
              </Title>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={() => {
                  if (activeTab === 'pending') {
                    loadPendingRequests();
                  } else {
                    loadAllRequests();
                  }
                  loadWorkerStats();
                }}
              >
                Refresh
              </Button>
            </div>

            <Alert
              message="How it works"
              description="Click the 'Assign' button next to any request to open the assignment modal. Select a mistri, set the payment amount, and confirm."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Tabs 
              activeKey={activeTab} 
              onChange={setActiveTab} 
              items={tabItems}
              type="card"
            />
          </Card>
        </Col>

        {/* Right Column - Worker Stats Sidebar */}
        <Col xs={24} lg={6}>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <TeamOutlined style={{ fontSize: 32, color: '#e67e22' }} />
              <Title level={4} style={{ marginTop: 8, marginBottom: 0 }}>
                Worker Overview
              </Title>
            </div>
            
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Total Workers"
                  value={workerStats.totalWorkers}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Available"
                  value={workerStats.availableWorkers}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
            </Row>
            
            <Divider style={{ margin: '12px 0' }} />
            
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Busy"
                  value={workerStats.busyWorkers}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Incomplete Jobs"
                  value={workerStats.totalIncompleteJobs}
                  prefix={<WarningOutlined />}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Col>
            </Row>
          </Card>

          <Card title="Workers with Active Jobs">
            {workerStats.workersWithJobs.length === 0 ? (
              <Empty 
                description="No active jobs" 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <List
                dataSource={workerStats.workersWithJobs}
                renderItem={(worker) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Avatar style={{ backgroundColor: '#e67e22' }}>
                          {worker.name.charAt(0).toUpperCase()}
                        </Avatar>
                      }
                      title={
                        <Space>
                          <Text strong>{worker.name}</Text>
                          <Badge 
                            count={worker.activeJobs} 
                            style={{ backgroundColor: '#faad14' }}
                          />
                        </Space>
                      }
                      description={
                        <>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            <PhoneOutlined /> {worker.phone}
                          </Text>
                          {worker.rating !== 'N/A' && (
                            <div>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                ⭐ Rating: {worker.rating}
                              </Text>
                            </div>
                          )}
                        </>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Assign Modal - This opens when you click the Assign button */}
      <Modal
        title="Assign Service Request"
        open={assignModalVisible}
        onOk={confirmAssign}
        onCancel={() => setAssignModalVisible(false)}
        confirmLoading={assigning}
        width={750}
        okText="Assign Request"
        cancelText="Cancel"
      >
        {selectedRequest ? (
          <>
            {/* Request Details Section */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ 
                background: '#f5f5f5', 
                padding: '12px 16px', 
                borderRadius: 8,
                marginBottom: 16 
              }}>
                <Text strong style={{ fontSize: 16 }}>Request Details</Text>
              </div>
              
              {loadingDetails ? (
                <div style={{ textAlign: 'center', padding: 20 }}>
                  <Spin />
                </div>
              ) : (
                <>
                  <Descriptions column={1} size="small" style={{ marginBottom: 8 }}>
                    <Descriptions.Item label={
                      <span><UserOutlined /> Customer</span>
                    }>
                      <strong>{selectedRequest.customerName}</strong> ({selectedRequest.customerPhone})
                    </Descriptions.Item>
                    <Descriptions.Item label="Service Type">
                      <Tag color="blue">{selectedRequest.type}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Address">
                      <EnvironmentOutlined /> {selectedRequest.address}
                    </Descriptions.Item>
                    <Descriptions.Item label="Customer Notes">
                      {selectedRequest.customerNotes || <Text type="secondary">No notes provided</Text>}
                    </Descriptions.Item>
                    <Descriptions.Item label="Requested At">
                      {new Date(selectedRequest.createdAt).toLocaleString()}
                    </Descriptions.Item>
                  </Descriptions>

                  {requestDetails?.platformServices && requestDetails.platformServices.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <Text strong>Selected Services:</Text>
                      <div style={{ marginTop: 8 }}>
                        {requestDetails.platformServices.map((service) => (
                          <Tag key={service.id} color="green" style={{ marginBottom: 4 }}>
                            {service.name} - NPR {parseFloat(service.price).toLocaleString()}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Assignment Section */}
            <div>
              <div style={{ 
                background: '#f5f5f5', 
                padding: '12px 16px', 
                borderRadius: 8,
                marginBottom: 16 
              }}>
                <Text strong style={{ fontSize: 16 }}>Assignment Details</Text>
              </div>

              <div style={{ marginBottom: 16 }}>
                <Text strong>Select Mistri:</Text>
                <Select
                  placeholder="Choose a mistri to assign"
                  style={{ width: '100%', marginTop: 8 }}
                  value={selectedMistri}
                  onChange={setSelectedMistri}
                  showSearch
                  optionFilterProp="children"
                  size="large"
                >
                  {mistris.map(mistri => (
                    <Select.Option key={mistri.id} value={mistri.id}>
                      <Space direction="vertical" size={0}>
                        <Text strong>{mistri.fullName}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {mistri.phoneNumber}
                          {!mistri.isAvailable && ' 🔴 Busy'}
                          {mistri.isAvailable && ' 🟢 Available'}
                          {mistri.currentJobs !== undefined && mistri.currentJobs > 0 && 
                            ` | ${mistri.currentJobs} active job(s)`
                          }
                          {mistri.averageRating && ` | ⭐ ${mistri.averageRating}`}
                        </Text>
                      </Space>
                    </Select.Option>
                  ))}
                </Select>
                {mistris.filter(m => m.isAvailable).length === 0 && (
                  <Text type="warning" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                    ⚠️ No available mistris at the moment. You can still assign busy mistris.
                  </Text>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <Text strong>Set Payment Amount:</Text>
                <InputNumber
                  style={{ width: '100%', marginTop: 8 }}
                  value={paymentAmount}
                  onChange={(value) => setPaymentAmount(value || 0)}
                  min={0}
                  step={100}
                  size="large"
                  prefix={<DollarOutlined />}
                  formatter={value => `NPR ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value!.replace(/NPR\s?|(,*)/g, '') as unknown as number}
                  placeholder="Enter payment amount"
                />
                <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                  This amount will be shown to the customer as the total cost.
                </Text>
              </div>

              <div>
                <Text strong>Admin Notes (Optional):</Text>
                <TextArea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add any instructions for the mistri or notes about this assignment"
                  style={{ marginTop: 8 }}
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
        title="Reject Service Request"
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
          style={{ marginBottom: 16 }}
        />
        
        <Text strong>Reason for rejection (optional):</Text>
        <TextArea
          rows={3}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Provide a reason to inform the customer"
          style={{ marginTop: 8 }}
        />
      </Modal>
    </div>
  );
}