// app/admin/manual-service-request/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Select,
  Space,
  Steps,
  message,
  Spin,
  Divider,
  Row,
  Col,
  Typography,
  Alert,
  Tabs,
  Table,
  Modal,
  Tag,
  Switch,
  InputNumber,
  Radio,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  CopyOutlined,
  EnvironmentOutlined,
  UserOutlined,
  ToolOutlined,
  DollarOutlined,
  SendOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  createManualServiceRequest,
  createBulkManualServiceRequests,
  getCustomers,
  getServiceTypes,
  getPlatformServicesByType,
  getAvailableMistris,
  Customer,
  ServiceType,
  PlatformService,
  Mistri,
} from '../../../_lib/manualService';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Step } = Steps;
const { TextArea } = Input;
const { TabPane } = Tabs;

// Google Maps autocomplete component (simplified - you can implement full version)
const LocationInput = ({ value, onChange }: { value?: any; onChange?: (value: any) => void }) => {
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAddress = e.target.value;
    setAddress(newAddress);
    
    // Simulate geocoding (replace with actual Google Maps API)
    if (onChange && newAddress) {
      onChange({
        address: newAddress,
        coords: { lat: 27.7172, lng: 85.324 }, // Default Kathmandu coordinates
      });
    }
  };

  return (
    <div>
      <Input
        placeholder="Enter full address"
        value={address}
        onChange={handleAddressChange}
        prefix={<EnvironmentOutlined />}
      />
      {coordinates && (
        <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
          Lat: {coordinates.lat}, Lng: {coordinates.lng}
        </Text>
      )}
    </div>
  );
};

// Single Request Form Component
const SingleRequestForm = ({ onSuccess, onCancel }: { onSuccess?: () => void; onCancel?: () => void }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [platformServices, setPlatformServices] = useState<PlatformService[]>([]);
  const [mistris, setMistris] = useState<Mistri[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingMistris, setLoadingMistris] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState<string>('');
  const [customerType, setCustomerType] = useState<'existing' | 'new'>('existing');

  // Load service types on mount
  useEffect(() => {
    loadServiceTypes();
  }, []);

  // Load platform services when service type changes
  useEffect(() => {
    if (selectedServiceType) {
      loadPlatformServices(selectedServiceType);
      loadMistris(selectedServiceType);
    }
  }, [selectedServiceType]);

  const loadServiceTypes = async () => {
    try {
      const response = await getServiceTypes();
      if (response.success) {
        setServiceTypes(response.serviceTypes);
      }
    } catch (error) {
      message.error('Failed to load service types');
    }
  };

  const loadPlatformServices = async (serviceType: string) => {
    try {
      const response = await getPlatformServicesByType(serviceType);
      if (response.success) {
        setPlatformServices(response.services || []);
      }
    } catch (error) {
      console.error('Failed to load platform services:', error);
    }
  };

  const loadMistris = async (serviceType: string) => {
    setLoadingMistris(true);
    try {
      const response = await getAvailableMistris(serviceType);
      if (response.success) {
        setMistris(response.mistris || []);
      }
    } catch (error) {
      console.error('Failed to load mistris:', error);
    } finally {
      setLoadingMistris(false);
    }
  };

  const handleSearchCustomers = async (search: string) => {
    setCustomerSearch(search);
    if (search.length >= 2) {
      setLoadingCustomers(true);
      try {
        const response = await getCustomers(search);
        if (response.success) {
          setCustomers(response.customers);
        }
      } catch (error) {
        console.error('Failed to load customers:', error);
      } finally {
        setLoadingCustomers(false);
      }
    }
  };

  const handleServiceTypeChange = (value: string) => {
    setSelectedServiceType(value);
    form.setFieldValue('platformServiceIds', []);
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const requestData = {
        ...values,
        coords: values.location?.coords || { lat: 27.7172, lng: 85.324 },
        address: values.location?.address,
        status: values.status || 'pending',
      };
      
      const response = await createManualServiceRequest(requestData);
      
      if (response.success) {
        message.success(`Service request created successfully! ID: ${response.requestId}`);
        form.resetFields();
        onSuccess?.();
      } else {
        message.error(response.message || 'Failed to create request');
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Failed to create service request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{ status: 'pending', isPaid: false }}
    >
      {/* Customer Section */}
      <Card title="Customer Information" size="small" style={{ marginBottom: 16 }}>
        <Radio.Group
          value={customerType}
          onChange={(e) => setCustomerType(e.target.value)}
          style={{ marginBottom: 16 }}
        >
          <Radio value="existing">Existing Customer</Radio>
          <Radio value="new">New Customer</Radio>
        </Radio.Group>

        {customerType === 'existing' ? (
          <Form.Item
            name="customerId"
            label="Select Customer"
            rules={[{ required: true, message: 'Please select a customer' }]}
          >
            <Select
              showSearch
              placeholder="Search by name or phone number"
              filterOption={false}
              onSearch={handleSearchCustomers}
              loading={loadingCustomers}
              notFoundContent={customerSearch.length < 2 ? 'Type at least 2 characters to search' : 'No customers found'}
            >
              {customers.map(customer => (
                <Option key={customer.id} value={customer.id}>
                  {customer.fullName} - {customer.phoneNumber}
                </Option>
              ))}
            </Select>
          </Form.Item>
        ) : (
          <>
            <Form.Item
              name="customerPhone"
              label="Phone Number"
              rules={[
                { required: true, message: 'Phone number is required' },
                { pattern: /^\d{10}$/, message: 'Please enter a valid 10-digit phone number' },
              ]}
            >
              <Input placeholder="e.g., 9876543210" />
            </Form.Item>
            <Form.Item
              name="customerName"
              label="Full Name (Optional)"
              tooltip="If not provided, a default name will be generated"
            >
              <Input placeholder="Customer full name" />
            </Form.Item>
          </>
        )}
      </Card>

      {/* Service Details */}
      <Card title="Service Details" size="small" style={{ marginBottom: 16 }}>
        <Form.Item
          name="type"
          label="Service Type"
          rules={[{ required: true, message: 'Please select a service type' }]}
        >
          <Select placeholder="Select service type" onChange={handleServiceTypeChange}>
            {serviceTypes.map(type => (
              <Option key={type.id} value={type.name}>
                {type.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {platformServices.length > 0 && (
          <Form.Item name="platformServiceIds" label="Sub-Services (Optional)">
            <Select mode="multiple" placeholder="Select sub-services">
              {platformServices.map(service => (
                <Option key={service.id} value={service.id}>
                  {service.name} - NPR {parseFloat(service.price).toLocaleString()}
                  {service.duration_minutes && ` (${service.duration_minutes} mins)`}
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}

        <Form.Item
          name="location"
          label="Service Location"
          rules={[{ required: true, message: 'Please enter the service address' }]}
        >
          <LocationInput />
        </Form.Item>

        <Form.Item name="customerNotes" label="Customer Notes">
          <TextArea rows={3} placeholder="Any special instructions or notes from the customer" />
        </Form.Item>
      </Card>

      {/* Assignment & Payment */}
      <Card title="Assignment & Payment" size="small" style={{ marginBottom: 16 }}>
        <Form.Item
          name="selectedMistriId"
          label="Assign to Mistri (Optional)"
          tooltip="Leave empty to auto-dispatch to nearest available mistri"
        >
          <Select
            placeholder="Select a mistri to assign directly"
            loading={loadingMistris}
            allowClear
            showSearch
            filterOption={(input, option) =>
              (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
            }
          >
            {mistris.map(mistri => (
              <Option key={mistri.id} value={mistri.id}>
                {mistri.fullName} - {mistri.phoneNumber}
                {mistri.isAvailable ? ' (Available)' : ' (Busy)'}
                {mistri.averageRating && ` ⭐ ${mistri.averageRating}`}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="paymentAmount" label="Payment Amount (NPR)">
          <InputNumber
            style={{ width: '100%' }}
            placeholder="Leave empty for default pricing"
            min={0}
            step={100}
            formatter={value => `NPR ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={value => value!.replace(/NPR\s?|(,*)/g, '') as unknown as number}
          />
        </Form.Item>

        <Form.Item name="isPaid" label="Payment Status" valuePropName="checked">
          <Switch checkedChildren="Paid" unCheckedChildren="Unpaid" />
        </Form.Item>

        <Form.Item name="status" label="Initial Status">
          <Select>
            <Option value="pending">Pending (Awaiting assignment)</Option>
            <Option value="assigned">Assigned (Already assigned to mistri)</Option>
          </Select>
        </Form.Item>
      </Card>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading} icon={<SendOutlined />}>
            Create Service Request
          </Button>
          <Button onClick={onCancel}>Cancel</Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

// Bulk Request Form Component
const BulkRequestForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const [requests, setRequests] = useState<any[]>([{}]);
  const [loading, setLoading] = useState(false);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);

  useEffect(() => {
    loadServiceTypes();
  }, []);

  const loadServiceTypes = async () => {
    try {
      const response = await getServiceTypes();
      if (response.success) {
        setServiceTypes(response.serviceTypes);
      }
    } catch (error) {
      message.error('Failed to load service types');
    }
  };

  const addRequest = () => {
    setRequests([...requests, {}]);
  };

  const removeRequest = (index: number) => {
    const newRequests = requests.filter((_, i) => i !== index);
    setRequests(newRequests);
  };

  const updateRequest = (index: number, field: string, value: any) => {
    const newRequests = [...requests];
    newRequests[index] = { ...newRequests[index], [field]: value };
    setRequests(newRequests);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const validRequests = requests.filter(r => r.customerPhone && r.type && r.address);
      
      if (validRequests.length === 0) {
        message.error('Please fill in at least one complete request');
        return;
      }

      const formattedRequests = validRequests.map(req => ({
        customerPhone: req.customerPhone,
        type: req.type,
        address: req.address,
        coords: { lat: 27.7172, lng: 85.324 },
        customerNotes: req.customerNotes,
        selectedMistriId: req.selectedMistriId,
        paymentAmount: req.paymentAmount,
        isPaid: req.isPaid || false,
      }));

      const response = await createBulkManualServiceRequests(formattedRequests);
      
      if (response.success) {
        message.success(`Created ${response.successful} requests, ${response.failed} failed`);
        setRequests([{}]);
        onSuccess?.();
      } else {
        message.error(response.message || 'Failed to create requests');
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Failed to create bulk requests');
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<any> = [
    {
      title: 'Phone',
      key: 'customerPhone',
      render: (_, record, index) => (
        <Input
          placeholder="Customer phone"
          value={record.customerPhone}
          onChange={(e) => updateRequest(index, 'customerPhone', e.target.value)}
          style={{ width: 120 }}
        />
      ),
    },
    {
      title: 'Service Type',
      key: 'type',
      render: (_, record, index) => (
        <Select
          placeholder="Select"
          value={record.type}
          onChange={(value) => updateRequest(index, 'type', value)}
          style={{ width: 120 }}
        >
          {serviceTypes.map(type => (
            <Option key={type.id} value={type.name}>{type.name}</Option>
          ))}
        </Select>
      ),
    },
    {
      title: 'Address',
      key: 'address',
      render: (_, record, index) => (
        <Input
          placeholder="Service address"
          value={record.address}
          onChange={(e) => updateRequest(index, 'address', e.target.value)}
        />
      ),
    },
    {
      title: 'Notes',
      key: 'notes',
      render: (_, record, index) => (
        <Input
          placeholder="Optional"
          value={record.customerNotes}
          onChange={(e) => updateRequest(index, 'customerNotes', e.target.value)}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, __, index) => (
        <Button danger icon={<DeleteOutlined />} onClick={() => removeRequest(index)} size="small" />
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="dashed" onClick={addRequest} icon={<PlusOutlined />}>
          Add Another Request
        </Button>
        <Text type="secondary" style={{ marginLeft: 16 }}>
          Total: {requests.length} request(s)
        </Text>
      </div>

      <Table
        columns={columns}
        dataSource={requests.map((r, i) => ({ ...r, key: i }))}
        pagination={false}
        size="small"
        scroll={{ x: true }}
      />

      <Divider />

      <Button type="primary" onClick={handleSubmit} loading={loading} icon={<SendOutlined />} size="large">
        Create {requests.length} Request(s)
      </Button>
    </div>
  );
};

// Main Page Component
export default function ManualServiceRequestPage() {
  const [activeTab, setActiveTab] = useState('single');
  const [lastCreated, setLastCreated] = useState<any>(null);

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      <Title level={2}>Manual Service Request</Title>
      <Paragraph type="secondary">
        Create service requests manually for customers. You can either create a single request with full details,
        or create multiple requests in bulk using the bulk mode.
      </Paragraph>

      <Alert
        message="Note"
        description="Manual service requests allow you to create jobs for customers directly from the admin panel. 
        You can assign a specific mistri or let the system auto-dispatch. All notifications (SMS and push) will be sent automatically."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Tabs activeKey={activeTab} onChange={setActiveTab} type="card">
        <TabPane tab="Single Request" key="single">
          <Card>
            <SingleRequestForm onSuccess={() => setActiveTab('single')} />
          </Card>
        </TabPane>

        <TabPane tab="Bulk Requests" key="bulk">
          <Card>
            <BulkRequestForm onSuccess={() => setActiveTab('bulk')} />
          </Card>
        </TabPane>
      </Tabs>

      {lastCreated && (
        <Card title="Last Created Request" style={{ marginTop: 24 }}>
          <pre>{JSON.stringify(lastCreated, null, 2)}</pre>
        </Card>
      )}
    </div>
  );
}