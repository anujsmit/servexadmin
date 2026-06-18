// app/admin/analytics/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Select,
  Typography,
  Space,
  Spin,
  Alert,
  Divider,
  Tag,
  Table,
  Tabs,
  Progress,
  Tooltip,
  Button,
  DatePicker,
  Radio,
} from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  DollarOutlined,
  StarOutlined,
  RiseOutlined,
  FallOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  DownloadOutlined,
  CalendarOutlined,
  ShopOutlined,
  FileTextOutlined,
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
  AreaChartOutlined,
  TableOutlined,
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Scatter,
} from 'recharts';
import dayjs from 'dayjs';
import { api } from '../../../_lib/api';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

// Types based on backend analytics controller
interface AnalyticsData {
  analytics: {
    range: {
      from: string;
      to: string;
      unit: 'day' | 'month';
    };
    kpis: {
      totalRequests: number;
      completed: number;
      canceled: number;
      completionRate: number;
      cancellationRate: number;
      avgAcceptMinutes: number;
      avgJobDurationMinutes: number;
      revenue: number;
      avgJobValue: number;
      newCustomers: number;
      newProviders: number;
      repeatCustomerRate: number;
    };
    funnel: {
      created: number;
      assigned: number;
      completed: number;
    };
    trend: {
      unit: string;
      series: Array<{
        bucket: string;
        created: number;
        completed: number;
      }>;
    };
    byService: Array<{
      type: string;
      requests: number;
      completed: number;
      revenue: number;
    }>;
    hours: Array<{
      hour: number;
      count: number;
    }>;
    weekday: Array<{
      dow: number;
      count: number;
    }>;
    topProviders: Array<{
      mistriId: string;
      name: string;
      serviceId: number | null;
      completed: number;
      revenue: number;
      rating: number | null;
    }>;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ]);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, viewMode]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        from: dateRange[0].toISOString(),
        to: dateRange[1].toISOString(),
      });

      const response = await api.get(`/admin/analytics?${params}`);
      
      if (response.success) {
        setData(response);
      } else {
        setError(response.message || 'Failed to load analytics');
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  const handleDateRangeChange = (dates: any) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([dates[0], dates[1]]);
    }
  };

  const formatCurrency = (value: number) => {
    return `रु ${value.toLocaleString()}`;
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString();
  };

  if (loading) {
    return (
      <div style={{ padding: 40, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Spin size="large" tip="Loading analytics..." />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: 40 }}>
        <Alert
          message="Error Loading Analytics"
          description={error || 'Failed to load analytics data. Please try again.'}
          type="error"
          showIcon
          action={
            <Button type="primary" onClick={handleRefresh}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  const { analytics } = data;
  const { kpis, funnel, trend, byService, hours, weekday, topProviders } = analytics;

  // Prepare data for charts
  const trendData = trend.series.map(item => ({
    ...item,
    created: Number(item.created),
    completed: Number(item.completed),
  }));

  const hourData = hours.map(h => ({
    hour: `${h.hour}:00`,
    count: h.count,
  }));

  const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const weekdayData = weekday.map(w => ({
    day: weekdayNames[w.dow],
    count: w.count,
  }));

  const serviceData = byService.map(s => ({
    ...s,
    revenue: Number(s.revenue),
    completed: Number(s.completed),
    requests: Number(s.requests),
  }));

  const statusDistribution = [
    { name: 'Completed', value: kpis.completed, color: '#52c41a' },
    { name: 'Canceled', value: kpis.canceled, color: '#ff4d4f' },
    { name: 'Pending', value: kpis.totalRequests - kpis.completed - kpis.canceled, color: '#faad14' },
  ].filter(item => item.value > 0);

  return (
    <div style={{ padding: 24, minHeight: '100vh', background: '#f0f2f5' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Analytics Dashboard</Title>
          <Text type="secondary">Monitor your business performance and growth metrics</Text>
        </div>
        <Space>
          <Radio.Group 
            value={viewMode} 
            onChange={(e) => setViewMode(e.target.value)}
            buttonStyle="solid"
          >
            <Radio.Button value="daily">Daily</Radio.Button>
            <Radio.Button value="monthly">Monthly</Radio.Button>
          </Radio.Group>
          <RangePicker 
            value={[dateRange[0], dateRange[1]]} 
            onChange={handleDateRangeChange}
            format="YYYY-MM-DD"
          />
          <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={refreshing}>
            Refresh
          </Button>
          <Button icon={<DownloadOutlined />} type="primary">
            Export
          </Button>
        </Space>
      </div>

      {/* Overview Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Requests"
              value={kpis.totalRequests}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Revenue"
              value={kpis.revenue}
              prefix={<DollarOutlined />}
              formatter={(value) => `रु ${Number(value).toLocaleString()}`}
              valueStyle={{ color: '#e67e22' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Completion Rate"
              value={kpis.completionRate}
              suffix="%"
              precision={1}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Repeat Customer Rate"
              value={kpis.repeatCustomerRate}
              suffix="%"
              precision={1}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Secondary Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8} md={4}>
          <Card size="small">
            <Statistic
              title="Avg. Acceptance"
              value={kpis.avgAcceptMinutes}
              suffix="min"
              precision={1}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8} md={4}>
          <Card size="small">
            <Statistic
              title="Avg. Job Duration"
              value={kpis.avgJobDurationMinutes}
              suffix="min"
              precision={1}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8} md={4}>
          <Card size="small">
            <Statistic
              title="Avg. Job Value"
              value={kpis.avgJobValue}
              formatter={(value) => `रु ${Number(value).toLocaleString()}`}
              valueStyle={{ color: '#e67e22' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8} md={4}>
          <Card size="small">
            <Statistic
              title="New Customers"
              value={kpis.newCustomers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8} md={4}>
          <Card size="small">
            <Statistic
              title="New Providers"
              value={kpis.newProviders}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8} md={4}>
          <Card size="small">
            <Statistic
              title="Cancellation Rate"
              value={kpis.cancellationRate}
              suffix="%"
              precision={1}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Funnel */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card title="Request Funnel">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Card size="small" style={{ textAlign: 'center', background: '#f0f5ff' }}>
                  <Statistic
                    title="Created"
                    value={funnel.created}
                    prefix={<FileTextOutlined />}
                    valueStyle={{ color: '#1890ff', fontSize: 28 }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card size="small" style={{ textAlign: 'center', background: '#f6ffed' }}>
                  <Statistic
                    title="Assigned"
                    value={funnel.assigned}
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ color: '#52c41a', fontSize: 28 }}
                  />
                  <Text type="secondary">
                    {funnel.created > 0 ? Math.round((funnel.assigned / funnel.created) * 100) : 0}% conversion
                  </Text>
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card size="small" style={{ textAlign: 'center', background: '#f6ffed' }}>
                  <Statistic
                    title="Completed"
                    value={funnel.completed}
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ color: '#52c41a', fontSize: 28 }}
                  />
                  <Text type="secondary">
                    {funnel.assigned > 0 ? Math.round((funnel.completed / funnel.assigned) * 100) : 0}% completion
                  </Text>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Requests Trend" extra={<Tag color="blue">Last {trendData.length} periods</Tag>}>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="created" fill="#8884d8" name="Created" />
                <Line type="monotone" dataKey="completed" stroke="#e67e22" name="Completed" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Status Distribution">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="Service Type Performance">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={serviceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#e67e22" />
                <RechartsTooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="requests" fill="#8884d8" name="Requests" />
                <Bar yAxisId="right" dataKey="revenue" fill="#e67e22" name="Revenue (NPR)" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Top Performing Providers">
            <Table
              dataSource={topProviders}
              pagination={false}
              size="small"
              rowKey="mistriId"
              columns={[
                {
                  title: 'Provider',
                  dataIndex: 'name',
                  key: 'name',
                  render: (name) => <Text strong>{name}</Text>,
                },
                {
                  title: 'Completed',
                  dataIndex: 'completed',
                  key: 'completed',
                  align: 'center',
                },
                {
                  title: 'Revenue',
                  dataIndex: 'revenue',
                  key: 'revenue',
                  align: 'right',
                  render: (value) => `रु ${Number(value).toLocaleString()}`,
                },
                {
                  title: 'Rating',
                  dataIndex: 'rating',
                  key: 'rating',
                  align: 'center',
                  render: (rating) => rating ? (
                    <Space>
                      <StarOutlined style={{ color: '#faad14' }} />
                      {rating.toFixed(1)}
                    </Space>
                  ) : '—',
                },
                {
                  title: 'Progress',
                  key: 'progress',
                  render: (_, record) => {
                    const maxCompleted = Math.max(...topProviders.map(p => p.completed));
                    return (
                      <Progress
                        percent={maxCompleted > 0 ? Math.round((record.completed / maxCompleted) * 100) : 0}
                        size="small"
                        showInfo={false}
                        strokeColor="#e67e22"
                      />
                    );
                  },
                },
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="Hourly Activity">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={hourData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="count" fill="#8884d8" radius={[4, 4, 0, 0]} name="Requests" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Weekday Activity">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weekdayData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="count" fill="#82ca9d" radius={[4, 4, 0, 0]} name="Requests" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  );
}