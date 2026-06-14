// app/admin/components/PendingRequests.tsx
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
  Spin,
  Empty,
  Tabs,
} from 'antd';
import { CheckOutlined, CloseOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import { api } from '../_lib/api';

const { TextArea } = Input;
const { Title, Text } = Typography;

interface PendingRequest {
  id: string;
  type: string;
  address: string;
  customerNotes: string;
  createdAt: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
}

interface Mistri {
  id: string;
  fullName: string;
  phoneNumber: string;
  isAvailable: boolean;
  averageRating: string;
  jobsCompleted: number;
}

interface AssignedRequest {
  id: string;
  type: string;
  address: string;
  status: string;
  paymentAmount: string;
  createdAt: string;
  assignedAt: string;
  completedAt: string | null;
  customerName: string;
  customerPhone: string;
  mistriName: string;
}

export default function PendingRequests() {
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [allRequests, setAllRequests] = useState<AssignedRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PendingRequest | null>(null);
  const [mistris, setMistris] = useState<Mistri[]>([]);
  const [selectedMistri, setSelectedMistri] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [adminNotes, setAdminNotes] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [pagination, setPagination] = useState({ page: 1, total: 0, limit: 20 });

  useEffect(() => {
    loadPendingRequests();
  }, []);

  useEffect(() => {
    if (activeTab === 'all') {
      loadAllRequests();
    }
  }, [activeTab, pagination.page]);

  const loadPendingRequests = async () => {
    setLoading(true);
    try {
      const response = await api.getPendingRequests();
      if (response.success) {
        setPendingRequests(response.requests);
      }
    } catch (error) {
      message.error('Failed to load pending requests');
    } finally {
      setLoading(false);
    }
  };

  const loadAllRequests = async () => {
    setLoading(true);
    try {
      const response = await api.getAllRequests({ 
        page: pagination.page, 
        limit: pagination.limit 
      });
      if (response.success) {
        setAllRequests(response.requests);
        setPagination({ ...pagination, total: response.pagination.total });
      }
    } catch (error) {
      message.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableMistris = async () => {
    try {
      const response = await api.getAvailableMistris();
      if (response.success) {
        setMistris(response.mistris);
      }
    } catch (error) {
      message.error('Failed to load mistris');
    }
  };

  const handleAssign = async (request: PendingRequest) => {
    setSelectedRequest(request);
    await loadAvailableMistris();
    setSelectedMistri('');
    setPaymentAmount(0);
    setAdminNotes('');
    setAssignModalVisible(true);
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
      const response = await api.assignMistri(selectedRequest!.id, {
        mistriId: selectedMistri,
        paymentAmount,
        adminNotes,
      });

      if (response.success) {
        message.success('Request assigned successfully');
        setAssignModalVisible(false);
        loadPendingRequests();
        if (activeTab === 'all') {
          loadAllRequests();
        }
      }
    } catch (error) {
      message.error('Failed to assign request');
    } finally {
      setAssigning(false);
    }
  };

  const confirmReject = async () => {
    setAssigning(true);
    try {
      const response = await api.rejectRequest(selectedRequest!.id, rejectReason);

      if (response.success) {
        message.success('Request rejected');
        setRejectModalVisible(false);
        loadPendingRequests();
        if (activeTab === 'all') {
          loadAllRequests();
        }
      }
    } catch (error) {
      message.error('Failed to reject request');
    } finally {
      setAssigning(false);
    }
  };

  const pendingColumns = [
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customerName',
      render: (name: string, record: PendingRequest) => (
        <div>
          <div><strong>{name}</strong></div>
          <small style={{ color: '#666' }}>{record.customerPhone}</small>
        </div>
      ),
    },
    {
      title: 'Service Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
      render: (address: string) => (
        <span title={address}>
          {address.length > 50 ? address.substring(0, 50) + '...' : address}
        </span>
      ),
    },
    {
      title: 'Customer Notes',
      dataIndex: 'customerNotes',
      key: 'customerNotes',
      ellipsis: true,
      render: (notes: string) => notes || '—',
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
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
      render: (name: string, record: AssignedRequest) => (
        <div>
          <div>{name}</div>
          <small style={{ color: '#666' }}>{record.customerPhone}</small>
        </div>
      ),
    },
    {
      title: 'Service',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: 'Mistri',
      dataIndex: 'mistriName',
      key: 'mistriName',
      render: (name: string) => name || 'Not assigned',
    },
    {
      title: 'Payment',
      dataIndex: 'paymentAmount',
      key: 'paymentAmount',
      render: (amount: string) => amount ? `NPR ${parseFloat(amount).toLocaleString()}` : '—',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = {
          pending_approval: 'orange',
          assigned: 'blue',
          completed: 'green',
          canceled: 'red',
        };
        const labels = {
          pending_approval: 'Pending Approval',
          assigned: 'Assigned',
          completed: 'Completed',
          canceled: 'Canceled',
        };
        return <Tag color={colors[status as keyof typeof colors] || 'default'}>
          {labels[status as keyof typeof labels] || status}
        </Tag>;
      },
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
  ];

  const tabItems = [
    {
      key: 'pending',
      label: `Pending Approval (${pendingRequests.length})`,
      children: (
        <Table
          columns={pendingColumns}
          dataSource={pendingRequests}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
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
            onChange: (page) => setPagination({ ...pagination, page }),
          }}
        />
      ),
    },
  ];

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4}>Service Request Management</Title>
        <Button icon={<ReloadOutlined />} onClick={loadPendingRequests}>
          Refresh
        </Button>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      {/* Assign Modal */}
      <Modal
        title="Assign Service Request"
        open={assignModalVisible}
        onOk={confirmAssign}
        onCancel={() => setAssignModalVisible(false)}
        confirmLoading={assigning}
        width={700}
      >
        {selectedRequest && (
          <>
            <Descriptions column={1} size="small" style={{ marginBottom: 24 }}>
              <Descriptions.Item label="Customer">
                <strong>{selectedRequest.customerName}</strong> ({selectedRequest.customerPhone})
              </Descriptions.Item>
              <Descriptions.Item label="Service Type">
                <Tag color="blue">{selectedRequest.type}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Address">
                {selectedRequest.address}
              </Descriptions.Item>
              <Descriptions.Item label="Customer Notes">
                {selectedRequest.customerNotes || 'No notes provided'}
              </Descriptions.Item>
              <Descriptions.Item label="Requested At">
                {new Date(selectedRequest.createdAt).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginBottom: 16 }}>
              <Text strong>Select Mistri:</Text>
              <Select
                placeholder="Choose a mistri to assign"
                style={{ width: '100%', marginTop: 8 }}
                value={selectedMistri}
                onChange={setSelectedMistri}
                showSearch
                optionFilterProp="children"
              >
                {mistris.map(mistri => (
                  <Select.Option key={mistri.id} value={mistri.id}>
                    {mistri.fullName} - {mistri.phoneNumber}
                    {!mistri.isAvailable && ' (Busy)'}
                    {mistri.averageRating && ` ⭐ ${mistri.averageRating}`}
                    {mistri.jobsCompleted > 0 && ` (${mistri.jobsCompleted} jobs)`}
                  </Select.Option>
                ))}
              </Select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text strong>Set Payment Amount (NPR):</Text>
              <InputNumber
                style={{ width: '100%', marginTop: 8 }}
                value={paymentAmount}
                onChange={(value) => setPaymentAmount(value || 0)}
                min={0}
                step={100}
                formatter={value => `NPR ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value!.replace(/NPR\s?|(,*)/g, '') as unknown as number}
                placeholder="Enter payment amount"
              />
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
          </>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        title="Reject Service Request"
        open={rejectModalVisible}
        onOk={confirmReject}
        onCancel={() => setRejectModalVisible(false)}
        confirmLoading={assigning}
      >
        <Text strong>Reason for rejection (optional):</Text>
        <TextArea
          rows={3}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Provide a reason to inform the customer"
          style={{ marginTop: 8 }}
        />
      </Modal>
    </Card>
  );
}