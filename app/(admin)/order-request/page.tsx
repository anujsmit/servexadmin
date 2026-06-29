// app/admin/order-request/page.tsx
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
  EyeOutlined,
  UnorderedListOutlined,
  ToolOutlined,
  ShoppingCartOutlined,
  SaveOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { api, ApiError } from '../../../_lib/api';

const { TextArea } = Input;
const { Title, Text } = Typography;
const { useToken } = theme;
const { Panel } = Collapse;

// ============================================
// TYPES
// ============================================

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
}

interface SubOrderItem {
  id: string;
  subOrderId: string;
  orderItemId: string;
  serviceItemId: string;
  name: string;
  description: string | null;
  price: number;
  quantity: number;
  subtotal: number;
  durationMinutes: number | null;
  imageUrl: string | null;
}

interface SubOrder {
  id: string;
  orderId: string;
  categoryId: number;
  categoryName: string;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  assignedMistriId: string | null;
  mistriName: string | null;
  mistriPhone?: string | null;
  assignedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  adminNotes: string | null;
  items: SubOrderItem[];
  itemCount: number;
}

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
  imageUrl?: string;
  categoryId?: number;
  categoryName?: string;
}

interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  address: string;
  city: string | null;
  zipCode: string | null;
  status: string;
  paymentStatus: string;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  discount: number;
  total: number;
  items: OrderItem[];
  subOrders: SubOrder[];
  itemCount: number;
  subOrderCount: number;
  customerNotes: string | null;
  adminNotes: string | null;
  paymentMethod: string;
  assignedMistriId: string | null;
  mistriName: string | null;
  createdAt: string;
  assignedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
}

interface PendingOrder extends Order { }

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

function OrderRequestContent() {
  const { token } = useToken();
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PendingOrder | null>(null);
  const [selectedSubOrder, setSelectedSubOrder] = useState<SubOrder | null>(null);
  const [allMistris, setAllMistris] = useState<Mistri[]>([]);
  const [filteredMistris, setFilteredMistris] = useState<Mistri[]>([]);
  const [selectedMistri, setSelectedMistri] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [adminNotes, setAdminNotes] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [pagination, setPagination] = useState({ page: 1, total: 0, limit: 20 });
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [viewDetailsModalVisible, setViewDetailsModalVisible] = useState(false);
  const [selectedAssignedOrder, setSelectedAssignedOrder] = useState<Order | null>(null);
  const [assignedMistriDetails, setAssignedMistriDetails] = useState<AssignedMistriDetails | null>(null);
  const [loadingMistriDetails, setLoadingMistriDetails] = useState(false);
  const [workerStats, setWorkerStats] = useState<WorkerStats>({
    totalWorkers: 0,
    availableWorkers: 0,
    busyWorkers: 0,
    totalIncompleteJobs: 0,
    workersByService: {},
  });
  const [viewType, setViewType] = useState<'order' | 'sub_order'>('order');
  const [orderSubOrders, setOrderSubOrders] = useState<SubOrder[]>([]);
  const [loadingSubOrders, setLoadingSubOrders] = useState(false);

  // Category-wise assignment states
  const [categoryAssignments, setCategoryAssignments] = useState<Record<string, string>>({});
  const [categoryNotes, setCategoryNotes] = useState<Record<string, string>>({});
  const [categoryMistris, setCategoryMistris] = useState<Record<string, Mistri[]>>({});

  // Batch Assignment States
  const [batchAssignModalVisible, setBatchAssignModalVisible] = useState(false);
  const [batchAssignments, setBatchAssignments] = useState<Record<string, string>>({});
  const [batchAssignLoading, setBatchAssignLoading] = useState(false);
  const [batchOrder, setBatchOrder] = useState<Order | null>(null);

  useEffect(() => {
    loadPendingOrders();
    loadWorkerStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'all') {
      loadAllOrders();
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

  const loadPendingOrders = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/orders?status=pending&limit=100');
      console.log('📦 Pending orders response:', response);

      if (response.success) {
        const orders = response.orders || [];
        const pending = orders.filter((order: any) => order.status === 'pending');
        setPendingOrders(pending);
        console.log('✅ Loaded pending orders:', pending.length);
      } else {
        console.warn('⚠️ Failed to load pending orders:', response.message);
        setPendingOrders([]);
      }
    } catch (error: any) {
      console.error('❌ Failed to load pending orders:', error);
      setPendingOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAllOrders = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/orders?page=${pagination.page}&limit=${pagination.limit}`);
      console.log('📦 All orders response:', response);

      if (response.success) {
        setAllOrders(response.orders || []);
        setPagination({ ...pagination, total: response.pagination.total });
        console.log('✅ Loaded all orders:', response.orders?.length || 0);
      } else {
        console.warn('⚠️ Failed to load all orders:', response.message);
        setAllOrders([]);
      }
    } catch (error: any) {
      console.error('❌ Failed to load all orders:', error);
      setAllOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSubOrders = async (orderId: string) => {
    setLoadingSubOrders(true);
    try {
      const response = await api.get(`/admin/orders/${orderId}/sub-orders`);
      console.log('📦 Sub-orders response:', response);

      if (response.success) {
        setOrderSubOrders(response.subOrders || []);
        console.log('✅ Loaded sub-orders:', response.subOrders?.length || 0);
      } else {
        setOrderSubOrders([]);
      }
    } catch (error: any) {
      console.error('❌ Failed to load sub-orders:', error);
      setOrderSubOrders([]);
    } finally {
      setLoadingSubOrders(false);
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

        // If we have a selected order with sub-orders, organize mistris by category
        if (selectedOrder && selectedOrder.subOrders && selectedOrder.subOrders.length > 0) {
          const categoryMap: Record<string, Mistri[]> = {};

          selectedOrder.subOrders.forEach(subOrder => {
            const categoryName = subOrder.categoryName;
            const mistrisForCategory = mistrisWithJobs.filter(mistri => {
              const mistriService = mistri.serviceName?.toLowerCase() || '';
              const categoryLower = categoryName.toLowerCase();
              return mistriService.includes(categoryLower) ||
                categoryLower.includes(mistriService) ||
                (mistri.serviceId !== null &&
                  SERVICE_ID_TO_NAME[mistri.serviceId]?.toLowerCase() === categoryLower);
            });

            // Sort by availability and rating
            mistrisForCategory.sort((a, b) => {
              if (a.isAvailable && !b.isAvailable) return -1;
              if (!a.isAvailable && b.isAvailable) return 1;
              return (parseFloat(b.averageRating || '0') - parseFloat(a.averageRating || '0'));
            });

            categoryMap[categoryName] = mistrisForCategory;
          });

          setCategoryMistris(categoryMap);
        }

        // Filter based on current selection
        if (selectedSubOrder) {
          filterMistrisByCategory(mistrisWithJobs, selectedSubOrder.categoryName);
        } else if (selectedOrder) {
          // For orders, show all mistris
          setFilteredMistris(mistrisWithJobs);
        }
      }
    } catch (error: any) {
      console.error('Failed to load mistris:', error);
      message.error(error?.message || 'Failed to load mistris');
    }
  };

  const filterMistrisByCategory = (mistris: Mistri[], categoryName: string) => {
    const categoryLower = categoryName.toLowerCase();
    const filtered = mistris.filter(mistri => {
      const mistriService = mistri.serviceName?.toLowerCase() || '';
      return mistriService.includes(categoryLower) ||
        categoryLower.includes(mistriService) ||
        (mistri.serviceId !== null &&
          SERVICE_ID_TO_NAME[mistri.serviceId]?.toLowerCase() === categoryLower);
    });
    setFilteredMistris(filtered);
  };

  const loadOrderDetails = async (orderId: string) => {
    setLoadingDetails(true);
    try {
      const response = await api.get(`/admin/orders/${orderId}`);
      if (response.success) {
        const order = response.order;
        setSelectedOrder(order);
        setPaymentAmount(Math.round(order.total || 0));
        setAdminNotes(order.adminNotes || '');
        // Load sub-orders
        await loadSubOrders(orderId);

        // Initialize category assignments
        if (order.subOrders && order.subOrders.length > 0) {
          const initialAssignments: Record<string, string> = {};
          const initialNotes: Record<string, string> = {};
          order.subOrders.forEach(so => {
            if (so.assignedMistriId) {
              initialAssignments[so.id] = so.assignedMistriId;
            }
            if (so.adminNotes) {
              initialNotes[so.id] = so.adminNotes;
            }
          });
          setCategoryAssignments(initialAssignments);
          setCategoryNotes(initialNotes);
        }
      }
    } catch (error: any) {
      console.error('Failed to load order details:', error);
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

  const handleViewOrderDetails = async (order: Order) => {
    setSelectedAssignedOrder(order);
    setViewType('order');
    // Load sub-orders for this order
    await loadSubOrders(order.id);
    if (order.assignedMistriId) {
      await loadAssignedMistriDetails(order.assignedMistriId);
    } else {
      setAssignedMistriDetails(null);
    }
    setViewDetailsModalVisible(true);
  };

  const openAssignOrderModal = async (order: PendingOrder) => {
    setSelectedOrder(order);
    setSelectedSubOrder(null);
    setSelectedMistri('');
    setAdminNotes(order.adminNotes || '');
    setPaymentAmount(Math.round(order.total || 0));
    setViewType('order');
    setCategoryAssignments({});
    setCategoryNotes({});
    setCategoryMistris({});
    setAssignModalVisible(true);

    await loadAvailableMistris();
    await loadOrderDetails(order.id);
    // Load sub-orders for filtering
    await loadSubOrders(order.id);
  };

  const openAssignSubOrderModal = async (subOrder: SubOrder, order: Order) => {
    setSelectedSubOrder(subOrder);
    setSelectedOrder(order);
    setSelectedMistri('');
    setAdminNotes('');
    setPaymentAmount(Math.round(subOrder.total || 0));
    setViewType('sub_order');
    setAssignModalVisible(true);

    // Load mistris first
    await loadAvailableMistris();

    // Then filter based on sub-order category
    if (allMistris.length > 0) {
      filterMistrisByCategory(allMistris, subOrder.categoryName);
    }
  };

  // Batch Assignment Functions
  const openBatchAssignModal = (order: Order) => {
    setBatchOrder(order);
    // Initialize assignments for all pending sub-orders
    const initialAssignments: Record<string, string> = {};
    order.subOrders
      .filter(so => so.status === 'pending' || so.status === 'confirmed')
      .forEach(so => {
        initialAssignments[so.id] = '';
      });
    setBatchAssignments(initialAssignments);
    setBatchAssignModalVisible(true);
    // Load mistris for batch assignment
    loadAvailableMistris();
  };

  const handleBatchAssign = async () => {
    if (!batchOrder) return;

    const assignments = Object.entries(batchAssignments)
      .filter(([_, mistriId]) => mistriId)
      .map(([subOrderId, mistriId]) => ({
        subOrderId,
        mistriId,
        note: `Batch assigned by admin`
      }));

    if (assignments.length === 0) {
      message.warning('Please select at least one mistri assignment');
      return;
    }

    setBatchAssignLoading(true);
    try {
      const response = await api.post(`/admin/orders/${batchOrder.id}/batch-assign`, {
        orderId: batchOrder.id,
        assignments
      });

      if (response.success) {
        message.success(response.message || 'Batch assignment completed');
        setBatchAssignModalVisible(false);
        setBatchAssignments({});
        // Refresh data
        await loadPendingOrders();
        await loadAllOrders();
        if (selectedOrder) {
          await loadSubOrders(selectedOrder.id);
        }
        loadWorkerStats();
      } else {
        message.error(response.message || 'Batch assignment failed');
      }
    } catch (error: any) {
      console.error('Batch assignment error:', error);
      message.error(error?.message || 'Failed to batch assign');
    } finally {
      setBatchAssignLoading(false);
    }
  };

  // Category-wise assignment handlers
  const handleCategoryAssign = async (subOrderId: string, mistriId: string) => {
    if (!mistriId) return;

    setAssigning(true);
    try {
      const response = await api.patch(`/admin/orders/sub-order/${subOrderId}/assign`, {
        mistriId: mistriId,
        note: categoryNotes[subOrderId] || `Assigned to category`,
      });

      if (response.success) {
        message.success('Sub-order assigned successfully');
        // Update local state
        setCategoryAssignments(prev => ({
          ...prev,
          [subOrderId]: mistriId
        }));
        // Refresh data
        await loadPendingOrders();
        await loadAllOrders();
        if (selectedOrder) {
          await loadSubOrders(selectedOrder.id);
        }
        loadWorkerStats();
      } else {
        message.error(response.message || 'Failed to assign sub-order');
      }
    } catch (error: any) {
      console.error('Failed to assign sub-order:', error);
      message.error(error?.message || 'Failed to assign');
    } finally {
      setAssigning(false);
    }
  };

  useEffect(() => {
    if (selectedSubOrder && allMistris.length > 0) {
      filterMistrisByCategory(allMistris, selectedSubOrder.categoryName);
    }
  }, [allMistris, selectedSubOrder]);

  const handleAssignOrder = (order: PendingOrder) => openAssignOrderModal(order);
  const handleAssignSubOrder = (subOrder: SubOrder, order: Order) => openAssignSubOrderModal(subOrder, order);

  const confirmAssign = async () => {
    if (!selectedMistri) {
      message.error('Please select a mistri');
      return;
    }

    setAssigning(true);
    try {
      let response;

      if (viewType === 'sub_order' && selectedSubOrder) {
        // Assign to specific sub-order
        response = await api.patch(`/admin/orders/sub-order/${selectedSubOrder.id}/assign`, {
          mistriId: selectedMistri,
          note: adminNotes || `Assigned ${selectedSubOrder.categoryName} work`,
        });

        if (response.success) {
          message.success(`${selectedSubOrder.categoryName} sub-order assigned successfully`);
          setAssignModalVisible(false);
          setSelectedSubOrder(null);
          // Refresh data
          await loadPendingOrders();
          await loadAllOrders();
          if (selectedOrder) {
            await loadSubOrders(selectedOrder.id);
          }
          loadWorkerStats();
        } else {
          message.error(response.message || 'Failed to assign sub-order');
        }
      } else if (viewType === 'order' && selectedOrder) {
        // Assign entire order (all sub-orders) to same mistri
        response = await api.patch(`/admin/orders/${selectedOrder.id}/assign`, {
          mistriId: selectedMistri,
          note: adminNotes,
        });

        if (response.success) {
          message.success('Order assigned successfully');
          setAssignModalVisible(false);
          await loadPendingOrders();
          await loadAllOrders();
          loadWorkerStats();
        } else {
          message.error(response.message || 'Failed to assign order');
        }
      }
    } catch (error: any) {
      console.error('Failed to assign:', error);
      message.error(error?.message || 'Failed to assign');
    } finally {
      setAssigning(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'orange',
      'confirmed': 'blue',
      'assigned': 'blue',
      'in_progress': 'purple',
      'completed': 'green',
      'cancelled': 'red',
      'rejected': 'red',
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'pending': 'Pending',
      'confirmed': 'Confirmed',
      'assigned': 'Assigned',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
      'rejected': 'Rejected',
    };
    return labels[status] || status;
  };

  const getCategoryColor = (categoryName: string) => {
    return CATEGORY_COLORS[categoryName] || CATEGORY_COLORS['General'];
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

  // Render Category-Wise Assignment
  const renderCategoryAssignment = () => {
    if (!selectedOrder || !selectedOrder.subOrders || selectedOrder.subOrders.length === 0) {
      return null;
    }

    const pendingSubOrders = selectedOrder.subOrders.filter(
      so => so.status === 'pending' || so.status === 'confirmed'
    );

    if (pendingSubOrders.length === 0) {
      return (
        <Alert
          message="All sub-orders are already assigned"
          type="success"
          showIcon
          style={{ marginTop: 16 }}
        />
      );
    }

    return (
      <div style={{ marginTop: 16 }}>
        <Divider orientation="left">
          <Space>
            <AppstoreOutlined />
            <Text strong>Assign by Category</Text>
            <Badge count={pendingSubOrders.length} style={{ backgroundColor: token.colorPrimary }} />
          </Space>
        </Divider>

        <Row gutter={[16, 16]}>
          {pendingSubOrders.map((subOrder) => {
            const categoryColor = getCategoryColor(subOrder.categoryName);
            const mistrisForCategory = categoryMistris[subOrder.categoryName] || [];
            const isAssigned = !!categoryAssignments[subOrder.id];
            const assignedMistriId = categoryAssignments[subOrder.id];

            return (
              <Col xs={24} lg={12} key={subOrder.id}>
                <Card
                  style={{
                    borderLeft: `4px solid ${categoryColor}`,
                    borderRadius: 12,
                    height: '100%',
                  }}
                  title={
                    <Space>
                      <div style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: categoryColor,
                        display: 'inline-block',
                      }} />
                      <Text strong style={{ color: categoryColor }}>
                        {subOrder.categoryName}
                      </Text>
                      <Tag color="orange">Pending</Tag>
                    </Space>
                  }
                  extra={
                    <Text strong>
                      रु {parseFloat(subOrder.total).toLocaleString()}
                    </Text>
                  }
                >
                  {/* Items in this category */}
                  <div style={{ marginBottom: 12 }}>
                    {subOrder.items.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '2px 0' }}>
                        <Text>{item.name} × {item.quantity}</Text>
                        <Text type="secondary">रु {item.subtotal.toLocaleString()}</Text>
                      </div>
                    ))}
                  </div>

                  {/* Mistri Selection */}
                  <div style={{ marginTop: 8 }}>
                    <Select
                      placeholder={`Select ${subOrder.categoryName} professional`}
                      style={{ width: '100%' }}
                      value={assignedMistriId || undefined}
                      onChange={(value) => {
                        setCategoryAssignments(prev => ({
                          ...prev,
                          [subOrder.id]: value
                        }));
                      }}
                      showSearch
                      size="middle"
                      notFoundContent={`No ${subOrder.categoryName} professionals available`}
                      disabled={isAssigned && !!assignedMistriId}
                    >
                      {mistrisForCategory.map((mistri) => (
                        <Select.Option key={mistri.id} value={mistri.id}>
                          <Space direction="vertical" size={0} style={{ width: '100%' }}>
                            <Space>
                              <Avatar size="small" style={{ backgroundColor: categoryColor }}>
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
                              {mistri.jobsCompleted && mistri.jobsCompleted > 0 && (
                                <Tag color="blue" style={{ borderRadius: 12 }}>
                                  {mistri.jobsCompleted} jobs
                                </Tag>
                              )}
                            </Space>
                          </Space>
                        </Select.Option>
                      ))}
                    </Select>

                    {assignedMistriId && (
                      <div style={{ marginTop: 8 }}>
                        <TextArea
                          placeholder="Add notes for this category"
                          rows={2}
                          value={categoryNotes[subOrder.id] || ''}
                          onChange={(e) => {
                            setCategoryNotes(prev => ({
                              ...prev,
                              [subOrder.id]: e.target.value
                            }));
                          }}
                          style={{ borderRadius: 8 }}
                        />
                      </div>
                    )}

                    <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
                      {assignedMistriId ? (
                        <Space>
                          <Tag color="green" icon={<CheckCircleOutlined />}>
                            Assigned
                          </Tag>
                          <Button
                            size="small"
                            onClick={() => {
                              setCategoryAssignments(prev => {
                                const newAssignments = { ...prev };
                                delete newAssignments[subOrder.id];
                                return newAssignments;
                              });
                              setCategoryNotes(prev => {
                                const newNotes = { ...prev };
                                delete newNotes[subOrder.id];
                                return newNotes;
                              });
                            }}
                          >
                            Reassign
                          </Button>
                        </Space>
                      ) : (
                        <Button
                          type="primary"
                          size="small"
                          icon={<CheckOutlined />}
                          onClick={() => {
                            const mistriId = categoryAssignments[subOrder.id];
                            if (mistriId) {
                              handleCategoryAssign(subOrder.id, mistriId);
                            } else {
                              message.warning('Please select a professional');
                            }
                          }}
                          disabled={!categoryAssignments[subOrder.id]}
                        >
                          Assign Now
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>

        {/* Progress Section */}
        <div style={{ marginTop: 16, padding: 16, background: token.colorPrimaryBg, borderRadius: 12 }}>
          <Row gutter={[16, 16]} align="middle">
            <Col flex="auto">
              <Space>
                <Text strong>Assignment Progress:</Text>
                <Progress
                  percent={Math.round(
                    (selectedOrder.subOrders.filter(so =>
                      so.status === 'assigned' || so.status === 'in_progress' || so.status === 'completed'
                    ).length / selectedOrder.subOrders.length) * 100
                  )}
                  status="active"
                  style={{ width: 200 }}
                />
                <Text type="secondary">
                  {selectedOrder.subOrders.filter(so =>
                    so.status === 'assigned' || so.status === 'in_progress' || so.status === 'completed'
                  ).length} / {selectedOrder.subOrders.length} assigned
                </Text>
              </Space>
            </Col>
            <Col>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={() => {
                  // Assign all pending sub-orders that have a mistri selected
                  const pendingWithMistri = Object.entries(categoryAssignments)
                    .filter(([subOrderId, mistriId]) => {
                      const subOrder = selectedOrder.subOrders.find(so => so.id === subOrderId);
                      return subOrder && (subOrder.status === 'pending' || subOrder.status === 'confirmed') && mistriId;
                    });

                  if (pendingWithMistri.length === 0) {
                    message.warning('No pending sub-orders with selected mistris');
                    return;
                  }

                  // Show confirmation
                  Modal.confirm({
                    title: 'Assign All Selected',
                    content: `This will assign ${pendingWithMistri.length} sub-orders. Continue?`,
                    onOk: async () => {
                      for (const [subOrderId, mistriId] of pendingWithMistri) {
                        await handleCategoryAssign(subOrderId, mistriId);
                      }
                    },
                  });
                }}
              >
                Assign All Selected
              </Button>
            </Col>
          </Row>
        </div>
      </div>
    );
  };

  // Render Sub-Orders with Category Grouping
  const renderSubOrders = (subOrders: SubOrder[], order: Order) => {
    if (!subOrders || subOrders.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: 20 }}>
          <Text type="secondary">No sub-orders found for this order</Text>
        </div>
      );
    }

    const hasPendingSubOrders = subOrders.some(so => so.status === 'pending' || so.status === 'confirmed');

    return (
      <div style={{ marginTop: 16 }}>
        <Divider orientation="left">
          <Space>
            <AppstoreOutlined />
            <Text strong>Service Categories ({subOrders.length})</Text>
            {hasPendingSubOrders && (
              <Button
                type="primary"
                size="small"
                icon={<SaveOutlined />}
                onClick={() => openBatchAssignModal(order)}
              >
                Batch Assign All
              </Button>
            )}
          </Space>
        </Divider>

        {/* Summary Cards */}
        <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
          <Col>
            <Card size="small" style={{ background: '#f6ffed', borderColor: '#b7eb8f' }}>
              <Text type="secondary">Total: <Text strong>{subOrders.length}</Text></Text>
            </Card>
          </Col>
          <Col>
            <Card size="small" style={{ background: '#fff7e6', borderColor: '#ffd591' }}>
              <Text type="secondary">Pending: <Text strong>{subOrders.filter(so => so.status === 'pending' || so.status === 'confirmed').length}</Text></Text>
            </Card>
          </Col>
          <Col>
            <Card size="small" style={{ background: '#e6f7ff', borderColor: '#91d5ff' }}>
              <Text type="secondary">Assigned: <Text strong>{subOrders.filter(so => so.status === 'assigned' || so.status === 'in_progress').length}</Text></Text>
            </Card>
          </Col>
          <Col>
            <Card size="small" style={{ background: '#f6ffed', borderColor: '#b7eb8f' }}>
              <Text type="secondary">Completed: <Text strong>{subOrders.filter(so => so.status === 'completed').length}</Text></Text>
            </Card>
          </Col>
        </Row>

        <Collapse defaultActiveKey={subOrders.filter(so => so.status === 'pending' || so.status === 'confirmed').map(so => so.id)}>
          {subOrders.map((subOrder, index) => {
            const categoryColor = getCategoryColor(subOrder.categoryName);
            const isPending = subOrder.status === 'pending' || subOrder.status === 'confirmed';

            return (
              <Panel
                key={subOrder.id}
                header={
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Space>
                      <div style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: categoryColor,
                        display: 'inline-block',
                      }} />
                      <Tag color={categoryColor} style={{ fontWeight: 'bold' }}>
                        {subOrder.categoryName}
                      </Tag>
                      <Text type="secondary">Sub-Order #{index + 1}</Text>
                      <Tag color={getStatusColor(subOrder.status)}>
                        {getStatusLabel(subOrder.status)}
                      </Tag>
                    </Space>
                    <Space>
                      {subOrder.mistriName && (
                        <Tag color="green" icon={<UserOutlined />}>
                          {subOrder.mistriName}
                        </Tag>
                      )}
                      <Text strong>Total: रु {parseFloat(subOrder.total).toLocaleString()}</Text>
                    </Space>
                  </Space>
                }
                extra={
                  <Space>
                    {isPending && (
                      <Button
                        type="primary"
                        size="small"
                        icon={<CheckOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAssignSubOrder(subOrder, order);
                        }}
                      >
                        Assign Mistri
                      </Button>
                    )}
                  </Space>
                }
              >
                {/* Category Info */}
                <div style={{
                  background: `linear-gradient(90deg, ${categoryColor}22, transparent)`,
                  padding: '8px 12px',
                  borderRadius: 8,
                  marginBottom: 12,
                }}>
                  <Space>
                    <ToolOutlined style={{ color: categoryColor }} />
                    <Text strong style={{ color: categoryColor }}>
                      {subOrder.categoryName} Services
                    </Text>
                    <Text type="secondary">• {subOrder.items.length} items</Text>
                    {subOrder.mistriName && (
                      <Tag color="green" icon={<CheckCircleOutlined />}>
                        Assigned to {subOrder.mistriName}
                      </Tag>
                    )}
                  </Space>
                </div>

                {/* Sub-Order Items Table */}
                <div style={{ marginBottom: 12 }}>
                  <Table
                    dataSource={subOrder.items}
                    rowKey="id"
                    pagination={false}
                    size="small"
                    columns={[
                      {
                        title: 'Item',
                        dataIndex: 'name',
                        key: 'name',
                        render: (name: string) => <Text strong>{name}</Text>,
                      },
                      {
                        title: 'Description',
                        dataIndex: 'description',
                        key: 'description',
                        render: (desc: string) => desc || <Text type="secondary">—</Text>,
                      },
                      {
                        title: 'Qty',
                        dataIndex: 'quantity',
                        key: 'quantity',
                        width: 60,
                        align: 'center',
                      },
                      {
                        title: 'Price',
                        dataIndex: 'price',
                        key: 'price',
                        width: 100,
                        align: 'right',
                        render: (price: number) => `रु ${price.toLocaleString()}`,
                      },
                      {
                        title: 'Subtotal',
                        dataIndex: 'subtotal',
                        key: 'subtotal',
                        width: 100,
                        align: 'right',
                        render: (subtotal: number) => `रु ${subtotal.toLocaleString()}`,
                      },
                    ]}
                    summary={() => (
                      <Table.Summary>
                        <Table.Summary.Row>
                          <Table.Summary.Cell index={0} colSpan={4}>
                            <Text strong>Category Total</Text>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={4} align="right">
                            <Text strong style={{ color: categoryColor, fontSize: 16 }}>
                              रु {parseFloat(subOrder.total).toLocaleString()}
                            </Text>
                          </Table.Summary.Cell>
                        </Table.Summary.Row>
                      </Table.Summary>
                    )}
                  />
                </div>

                {/* Sub-Order Details */}
                <Descriptions size="small" column={2} bordered>
                  <Descriptions.Item label="Assigned Mistri">
                    {subOrder.mistriName ? (
                      <Space>
                        <UserOutlined />
                        <Text strong>{subOrder.mistriName}</Text>
                        {subOrder.mistriPhone && (
                          <Text type="secondary">({subOrder.mistriPhone})</Text>
                        )}
                      </Space>
                    ) : (
                      <Text type="secondary">Not assigned</Text>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Created At">
                    {new Date(subOrder.createdAt).toLocaleString()}
                  </Descriptions.Item>
                  {subOrder.assignedAt && (
                    <Descriptions.Item label="Assigned At">
                      {new Date(subOrder.assignedAt).toLocaleString()}
                    </Descriptions.Item>
                  )}
                  {subOrder.completedAt && (
                    <Descriptions.Item label="Completed At">
                      {new Date(subOrder.completedAt).toLocaleString()}
                    </Descriptions.Item>
                  )}
                  {subOrder.adminNotes && (
                    <Descriptions.Item label="Notes" span={2}>
                      {subOrder.adminNotes}
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Panel>
            );
          })}
        </Collapse>
      </div>
    );
  };

  // Pending Orders Columns
  const pendingOrderColumns = [
    {
      title: 'Order ID',
      dataIndex: 'id',
      key: 'id',
      width: 150,
      render: (id: string) => (
        <Text code style={{ fontSize: 12 }}>{id.slice(0, 8).toUpperCase()}</Text>
      ),
    },
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 180,
      render: (name: string, record: Order) => (
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
      title: 'Categories',
      dataIndex: 'subOrderCount',
      key: 'subOrderCount',
      width: 120,
      render: (count: number, record: Order) => (
        <Space>
          <Tag icon={<AppstoreOutlined />} color="purple">
            {count} categories
          </Tag>
          <Tag icon={<ShoppingCartOutlined />} color="blue">
            {record.itemCount} items
          </Tag>
        </Space>
      ),
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      width: 120,
      render: (total: number) => (
        <Tag color="green" style={{ borderRadius: 16, fontWeight: 'bold' }}>
          रु {total.toLocaleString()}
        </Tag>
      ),
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
      render: (address: string) => (
        <Tooltip title={address}>
          <Space>
            <EnvironmentOutlined style={{ color: token.colorTextSecondary }} />
            <Text style={{ maxWidth: 180 }} ellipsis>
              {address}
            </Text>
          </Space>
        </Tooltip>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={getStatusColor(status)} style={{ borderRadius: 16 }}>
          {getStatusLabel(status)}
        </Tag>
      ),
    },
    {
      title: 'Created',
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
      width: 140,
      render: (_: any, record: PendingOrder) => (
        <Space>
          <Tooltip title="Assign Mistri">
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={() => handleAssignOrder(record)}
              size="middle"
            >
              Assign
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const allOrderColumns = [
    {
      title: 'Order ID',
      dataIndex: 'id',
      key: 'id',
      width: 150,
      render: (id: string) => (
        <Text code style={{ fontSize: 12 }}>{id.slice(0, 8).toUpperCase()}</Text>
      ),
    },
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
      title: 'Categories',
      dataIndex: 'subOrderCount',
      key: 'subOrderCount',
      width: 120,
      render: (count: number) => (
        <Tag icon={<AppstoreOutlined />} color="purple">
          {count} categories
        </Tag>
      ),
    },
    {
      title: 'Mistri',
      dataIndex: 'mistriName',
      key: 'mistriName',
      width: 140,
      render: (name: string, record: any) => {
        if (record.subOrderCount > 1) {
          const assignedCount = record.subOrders?.filter((so: SubOrder) => so.mistriName).length || 0;
          return (
            <Space>
              <TeamOutlined />
              <Text>{assignedCount}/{record.subOrderCount} assigned</Text>
            </Space>
          );
        }
        return name ? (
          <Space>
            <Avatar size="small" style={{ backgroundColor: '#e67e22' }}>
              {name.charAt(0).toUpperCase()}
            </Avatar>
            <Text>{name}</Text>
          </Space>
        ) : <Tag color="default">Not assigned</Tag>;
      },
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      width: 120,
      render: (total: number) => (
        <Tag color="green" style={{ borderRadius: 16 }}>रु {total.toLocaleString()}</Tag>
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
            onClick={() => handleViewOrderDetails(record)}
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
          Pending Orders
          <Badge count={pendingOrders.length} style={{ marginLeft: 8, backgroundColor: '#faad14' }} />
        </span>
      ),
      children: (
        <Table
          columns={pendingOrderColumns}
          dataSource={pendingOrders}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showTotal: (total) => `Total ${total} orders` }}
          scroll={{ x: 1200 }}
          locale={{ emptyText: 'No pending orders' }}
        />
      ),
    },
    {
      key: 'all',
      label: (
        <span>
          <UnorderedListOutlined style={{ marginRight: 8 }} />
          All Orders
        </span>
      ),
      children: (
        <Table
          columns={allOrderColumns}
          dataSource={allOrders}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showTotal: (total) => `Total ${total} orders`,
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
            <Title level={3} style={{ margin: 0 }}>Order & Assignment Management</Title>
            <Text type="secondary">Review and assign orders to available mistris</Text>
          </div>
          <Button icon={<ReloadOutlined />} onClick={() => {
            if (activeTab === 'pending') {
              loadPendingOrders();
            } else {
              loadAllOrders();
            }
            loadWorkerStats();
          }}>
            Refresh
          </Button>
        </div>

        <StatsCards />

        <Alert
          message="Multi-Category Order Assignment"
          description="Orders with items from multiple categories are split into sub-orders. Each sub-order can be assigned to a different mistri based on their expertise. Use the 'Batch Assign All' button to assign all pending sub-orders at once."
          type="info"
          showIcon
          style={{ marginBottom: 20, borderRadius: 12 }}
        />

        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} type="card" />
      </Card>

      {/* Assign Modal - Category-Wise Design */}
      <Modal
        title={
          <Space>
            <CheckCircleOutlined style={{ color: token.colorPrimary }} />
            <span>
              {viewType === 'sub_order' && selectedSubOrder
                ? `Assign ${selectedSubOrder.categoryName} Sub-Order`
                : viewType === 'order' && selectedOrder && selectedOrder.subOrderCount > 1
                  ? 'Assign Order - Category Wise'
                  : viewType === 'order'
                    ? 'Assign Order'
                    : 'Assign Sub-Order'
              }
            </span>
          </Space>
        }
        open={assignModalVisible}
        onCancel={() => {
          setAssignModalVisible(false);
          setSelectedSubOrder(null);
          setCategoryAssignments({});
          setCategoryNotes({});
        }}
        width={900}
        okText={viewType === 'order' && selectedOrder?.subOrderCount > 1 ? 'Done' : 'Assign'}
        cancelText="Cancel"
        onOk={() => {
          if (viewType === 'order' && selectedOrder?.subOrderCount > 1 && selectedOrder?.subOrders) {
            const pendingSubOrders = selectedOrder.subOrders.filter(
              (so: SubOrder) => so.status === 'pending' || so.status === 'confirmed'
            );
            if (pendingSubOrders.length > 0) {
              const assignedCount = Object.keys(categoryAssignments).filter(
                id => categoryAssignments[id]
              ).length;
              if (assignedCount < pendingSubOrders.length) {
                Modal.confirm({
                  title: 'Not All Sub-Orders Assigned',
                  content: `Only ${assignedCount} of ${pendingSubOrders.length} pending sub-orders have been assigned. Continue?`,
                  onOk: () => setAssignModalVisible(false),
                });
                return;
              }
            }
            setAssignModalVisible(false);
          } else {
            confirmAssign();
          }
        }}
        confirmLoading={assigning}
        footer={(_, { OkBtn, CancelBtn }) => (
          <>
            <CancelBtn />
            <OkBtn />
          </>
        )}
      >
        {selectedOrder || selectedSubOrder ? (
          <>
            <div style={{ marginBottom: 24 }}>
              <div style={{ background: token.colorPrimaryBg, padding: '12px 16px', borderRadius: 12, marginBottom: 16 }}>
                <Text strong>
                  {viewType === 'sub_order' && selectedSubOrder
                    ? 'Sub-Order Details'
                    : viewType === 'order' && selectedOrder && selectedOrder.subOrderCount > 1
                      ? 'Order Details - Multi-Category'
                      : viewType === 'order'
                        ? 'Order Details'
                        : 'Sub-Order Details'
                  }
                </Text>
                {(viewType === 'order' || viewType === 'sub_order') && selectedOrder && (
                  <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                    Order #{selectedOrder.id.slice(0, 8).toUpperCase()} • {selectedOrder.itemCount} items • {selectedOrder.subOrderCount} categories
                  </Text>
                )}
                {viewType === 'sub_order' && selectedSubOrder && (
                  <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                    Category: {selectedSubOrder.categoryName} • {selectedSubOrder.items.length} items
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
                      <Text strong>{selectedOrder?.customerName}</Text>
                      <br />
                      <Text type="secondary">{selectedOrder?.customerPhone}</Text>
                    </Descriptions.Item>
                    {(viewType === 'order' || viewType === 'sub_order') && selectedOrder && (
                      <>
                        <Descriptions.Item label="Address">
                          <EnvironmentOutlined style={{ marginRight: 8 }} />
                          {selectedOrder.address}
                          {selectedOrder.city && `, ${selectedOrder.city}`}
                          {selectedOrder.zipCode && ` (${selectedOrder.zipCode})`}
                        </Descriptions.Item>
                        <Descriptions.Item label="Payment Method">
                          {selectedOrder.paymentMethod?.toUpperCase() || 'Cash'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Customer Notes">
                          {selectedOrder.customerNotes || <Text type="secondary">No notes provided</Text>}
                        </Descriptions.Item>
                        <Descriptions.Item label="Total Amount">
                          <Text strong style={{ color: token.colorPrimary, fontSize: 18 }}>
                            रु {selectedOrder.total.toLocaleString()}
                          </Text>
                        </Descriptions.Item>
                      </>
                    )}
                    {viewType === 'sub_order' && selectedSubOrder && (
                      <Descriptions.Item label="Category">
                        <Tag color={getCategoryColor(selectedSubOrder.categoryName)}>
                          {selectedSubOrder.categoryName}
                        </Tag>
                      </Descriptions.Item>
                    )}
                    <Descriptions.Item label="Created At">
                      <CalendarOutlined style={{ marginRight: 8 }} />
                      {new Date((selectedOrder || selectedSubOrder)?.createdAt || '').toLocaleString()}
                    </Descriptions.Item>
                  </Descriptions>

                  {/* Category-Wise Assignment Section for Multi-Category Orders */}
                  {viewType === 'order' && selectedOrder && selectedOrder.subOrderCount > 1 && selectedOrder.subOrders && (
                    renderCategoryAssignment()
                  )}
                </>
              )}
            </div>

            {/* Single Mistri Assignment (for single category orders or sub-orders) */}
            {(viewType === 'sub_order' ||
              (viewType === 'order' && selectedOrder && selectedOrder.subOrderCount === 1)) && (
                <div>
                  <div style={{ background: token.colorPrimaryBg, padding: '12px 16px', borderRadius: 12, marginBottom: 16 }}>
                    <Text strong>Assignment Details</Text>
                    <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                      {viewType === 'sub_order' && selectedSubOrder
                        ? `Showing only ${selectedSubOrder.categoryName} professionals (${filteredMistris.length} available)`
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
                              <Avatar size="small" style={{ backgroundColor: categoryColor || token.colorPrimary }}>
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
                              {mistri.currentJobs && mistri.currentJobs > 0 && (
                                <Tag color="blue" style={{ borderRadius: 12 }}>
                                  {mistri.currentJobs} active
                                </Tag>
                              )}
                            </Space>
                            <Text type="secondary" style={{ fontSize: 12, marginLeft: 36 }}>
                              {/* ✅ Show the actual service name instead of "General" */}
                              <Tag color={getCategoryColor(mistri.serviceName || 'General')} style={{ fontSize: 12 }}>
                                {mistri.serviceName || 'General'}
                              </Tag>
                              {mistri.jobsCompleted !== null && ` • ${mistri.jobsCompleted} jobs completed`}
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
              )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin />
          </div>
        )}
      </Modal>

      {/* Batch Assign Modal */}
      <Modal
        title={
          <Space>
            <SaveOutlined style={{ color: token.colorPrimary }} />
            <span>Batch Assign Sub-Orders</span>
          </Space>
        }
        open={batchAssignModalVisible}
        onOk={handleBatchAssign}
        onCancel={() => {
          setBatchAssignModalVisible(false);
          setBatchAssignments({});
          setBatchOrder(null);
        }}
        confirmLoading={batchAssignLoading}
        width={900}
        okText="Assign All"
        cancelText="Cancel"
      >
        {batchOrder && (
          <>
            <Alert
              message={`Order #${batchOrder.id.slice(0, 8).toUpperCase()}`}
              description={`Assign each sub-order to the appropriate professional. ${Object.keys(batchAssignments).length} sub-orders need assignment.`}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <div style={{ maxHeight: 500, overflow: 'auto' }}>
              {Object.entries(batchAssignments).map(([subOrderId, selectedMistriId]) => {
                const subOrder = batchOrder.subOrders.find(so => so.id === subOrderId);
                if (!subOrder) return null;

                const categoryColor = getCategoryColor(subOrder.categoryName);

                // Filter mistris for this sub-order's category
                const categoryMistris = allMistris.filter(mistri => {
                  const mistriService = mistri.serviceName?.toLowerCase() || '';
                  const categoryLower = subOrder.categoryName.toLowerCase();
                  return mistriService.includes(categoryLower) ||
                    categoryLower.includes(mistriService) ||
                    (mistri.serviceId !== null &&
                      SERVICE_ID_TO_NAME[mistri.serviceId]?.toLowerCase() === categoryLower);
                });

                return (
                  <Card
                    key={subOrderId}
                    size="small"
                    style={{
                      marginBottom: 12,
                      borderLeft: `4px solid ${categoryColor}`,
                    }}
                    title={
                      <Space>
                        <div style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: categoryColor,
                          display: 'inline-block',
                        }} />
                        <Tag color={categoryColor}>{subOrder.categoryName}</Tag>
                        <Text type="secondary">• {subOrder.items.length} items</Text>
                        <Tag color="orange">Pending</Tag>
                      </Space>
                    }
                    extra={
                      <Text strong style={{ color: categoryColor }}>
                        रु {parseFloat(subOrder.total).toLocaleString()}
                      </Text>
                    }
                  >
                    {/* Show items in this sub-order */}
                    <div style={{ marginBottom: 8 }}>
                      {subOrder.items.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                          <Text>{item.name} × {item.quantity}</Text>
                          <Text type="secondary">रु {item.subtotal.toLocaleString()}</Text>
                        </div>
                      ))}
                    </div>

                    <Select
                      placeholder={`Select ${subOrder.categoryName} professional`}
                      style={{ width: '100%' }}
                      value={selectedMistriId || undefined}
                      onChange={(value) => {
                        setBatchAssignments(prev => ({
                          ...prev,
                          [subOrderId]: value
                        }));
                      }}
                      showSearch
                      notFoundContent={`No ${subOrder.categoryName} professionals available`}
                    >
                      {categoryMistris.map(mistri => (
                        <Select.Option key={mistri.id} value={mistri.id}>
                          <Space>
                            <Avatar size="small" style={{ backgroundColor: token.colorPrimary }}>
                              {mistri.fullName.charAt(0).toUpperCase()}
                            </Avatar>
                            <span>{mistri.fullName}</span>
                            <Tag color={mistri.isAvailable ? 'success' : 'warning'} style={{ borderRadius: 12 }}>
                              {mistri.isAvailable ? 'Available' : 'Busy'}
                            </Tag>
                            {mistri.averageRating && parseFloat(mistri.averageRating) > 0 && (
                              <Tag color="gold" style={{ borderRadius: 12 }}>
                                ⭐ {mistri.averageRating}
                              </Tag>
                            )}
                          </Space>
                        </Select.Option>
                      ))}
                    </Select>
                  </Card>
                );
              })}
            </div>

            <div style={{ marginTop: 16, padding: 12, background: token.colorPrimaryBg, borderRadius: 8 }}>
              <Space>
                <Text type="secondary">
                  Total: {Object.values(batchAssignments).filter(id => id).length} of {Object.keys(batchAssignments).length} sub-orders will be assigned.
                </Text>
                {Object.values(batchAssignments).filter(id => !id).length > 0 && (
                  <Tag color="warning">
                    {Object.values(batchAssignments).filter(id => !id).length} unassigned
                  </Tag>
                )}
              </Space>
            </div>
          </>
        )}
      </Modal>

      {/* View Details Modal */}
      <Modal
        title={
          <Space>
            <EyeOutlined style={{ color: token.colorPrimary }} />
            <span>Order Details</span>
          </Space>
        }
        open={viewDetailsModalVisible}
        onCancel={() => {
          setViewDetailsModalVisible(false);
          setSelectedAssignedOrder(null);
          setAssignedMistriDetails(null);
          setOrderSubOrders([]);
        }}
        footer={[
          <Button key="close" onClick={() => setViewDetailsModalVisible(false)}>
            Close
          </Button>
        ]}
        width={900}
      >
        {selectedAssignedOrder && (
          <>
            <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Order ID">
                <Text code>{selectedAssignedOrder.id.slice(0, 8).toUpperCase()}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={<><UserOutlined /> Customer</>}>
                <Text strong>{selectedAssignedOrder.customerName}</Text>
                <br />
                <Text type="secondary">{selectedAssignedOrder.customerPhone}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Categories">
                <Tag icon={<AppstoreOutlined />} color="purple">
                  {selectedAssignedOrder.subOrderCount} categories
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Total Items">
                <Tag color="blue">{selectedAssignedOrder.itemCount} items</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Total Amount">
                <Tag color="green" style={{ fontSize: 16, fontWeight: 'bold' }}>
                  रु {selectedAssignedOrder.total.toLocaleString()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Address">
                <EnvironmentOutlined style={{ marginRight: 8 }} />
                {selectedAssignedOrder.address}
                {selectedAssignedOrder.city && `, ${selectedAssignedOrder.city}`}
                {selectedAssignedOrder.zipCode && ` (${selectedAssignedOrder.zipCode})`}
              </Descriptions.Item>
              <Descriptions.Item label="Payment Method">
                {selectedAssignedOrder.paymentMethod?.toUpperCase() || 'Cash'}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={getStatusColor(selectedAssignedOrder.status)}>
                  {getStatusLabel(selectedAssignedOrder.status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Created At">
                <CalendarOutlined style={{ marginRight: 8 }} />
                {new Date(selectedAssignedOrder.createdAt).toLocaleString()}
              </Descriptions.Item>
              {selectedAssignedOrder.assignedAt && (
                <Descriptions.Item label="Assigned At">
                  <ClockCircleOutlined style={{ marginRight: 8 }} />
                  {new Date(selectedAssignedOrder.assignedAt).toLocaleString()}
                </Descriptions.Item>
              )}
              {selectedAssignedOrder.completedAt && (
                <Descriptions.Item label="Completed At">
                  <CheckCircleOutlined style={{ marginRight: 8 }} />
                  {new Date(selectedAssignedOrder.completedAt).toLocaleString()}
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* Render Sub-Orders with Category Grouping */}
            {loadingSubOrders ? (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <Spin />
              </div>
            ) : (
              renderSubOrders(orderSubOrders, selectedAssignedOrder)
            )}
          </>
        )}
      </Modal>
    </div>
  );
}

export default function OrderRequestPage() {
  return (
    <App>
      <OrderRequestContent />
    </App>
  );
}