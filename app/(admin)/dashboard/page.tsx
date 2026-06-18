'use client';

import useSWR from 'swr';
import { Card, Row, Col, Statistic, Typography, Skeleton, Alert, Button } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  StarOutlined,
  DollarOutlined,
  MessageOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { api } from '../../../_lib/api';
import styles from './dashboard.module.css';

const { Title, Text } = Typography;

interface Stats {
  totalUsers: number;
  totalMistris: number;
  totalCustomers: number;
  pendingRequests: number;
  pendingRatings: number;
  totalRevenue: number;
  totalSmsSent: number;
}

const STAT_CARDS = [
  {
    key: 'totalCustomers' as keyof Stats,
    label: 'Customers',
    icon: <UserOutlined />,
    color: '#2563eb',
    bg: '#dbeafe',
  },
  {
    key: 'totalMistris' as keyof Stats,
    label: 'ServeX (Mistris)',
    icon: <TeamOutlined />,
    color: '#059669',
    bg: '#d1fae5',
  },
  {
    key: 'pendingRequests' as keyof Stats,
    label: 'Pending Requests',
    icon: <ClockCircleOutlined />,
    color: '#d97706',
    bg: '#fef3c7',
  },
  {
    key: 'pendingRatings' as keyof Stats,
    label: 'Pending Ratings',
    icon: <StarOutlined />,
    color: '#7c3aed',
    bg: '#ede9fe',
  },
  {
    key: 'totalRevenue' as keyof Stats,
    label: 'Total Revenue',
    icon: <DollarOutlined />,
    color: '#0891b2',
    bg: '#cffafe',
    prefix: 'NPR ',
    isMoney: true,
  },
  {
    key: 'totalSmsSent' as keyof Stats,
    label: 'SMS Sent',
    icon: <MessageOutlined />,
    color: '#be185d',
    bg: '#fce7f3',
  },
];

export default function DashboardPage() {
  const router = useRouter();
  
  // Fix: Use the correct endpoint (without /api prefix since api.get already includes it)
  const { data, error, isLoading, mutate } = useSWR<{ success: boolean; stats: Stats }>(
    '/admin/stats',
    api.get,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  const stats = data?.stats;

  const handleRetry = () => {
    mutate();
  };

  // Handle loading state
  if (isLoading && !data) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Title level={4} style={{ margin: 0 }}>Dashboard</Title>
          <Text type="secondary">Platform overview</Text>
        </div>
        <Row gutter={[16, 16]}>
          {STAT_CARDS.map((card) => (
            <Col xs={24} sm={12} lg={8} xl={6} key={card.key}>
              <Card className={styles.statCard} variant="borderless">
                <div className={styles.statInner}>
                  <div className={styles.statIcon} style={{ backgroundColor: card.bg, color: card.color }}>
                    {card.icon}
                  </div>
                  <div className={styles.statValues}>
                    <Skeleton active paragraph={false} title={{ width: 80 }} />
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Title level={4} style={{ margin: 0 }}>Dashboard</Title>
          <Text type="secondary">Platform overview</Text>
        </div>
        <Alert
          type="error"
          message="Failed to load stats"
          description={error.message || 'Unable to fetch dashboard statistics. Please check your connection.'}
          style={{ marginBottom: 24 }}
          action={
            <Button size="small" type="primary" onClick={handleRetry} icon={<ReloadOutlined />}>
              Retry
            </Button>
          }
        />
        <Row gutter={[16, 16]}>
          {STAT_CARDS.map((card) => (
            <Col xs={24} sm={12} lg={8} xl={6} key={card.key}>
              <Card className={styles.statCard} variant="borderless">
                <div className={styles.statInner}>
                  <div className={styles.statIcon} style={{ backgroundColor: card.bg, color: card.color }}>
                    {card.icon}
                  </div>
                  <div className={styles.statValues}>
                    <span className={styles.statValue}>--</span>
                    <span className={styles.statLabel}>{card.label}</span>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Dashboard</Title>
          <Text type="secondary">Platform overview</Text>
        </div>
        <Button 
          icon={<ReloadOutlined />} 
          onClick={handleRetry} 
          loading={isLoading}
        >
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]}>
        {STAT_CARDS.map((card) => {
          const value = stats?.[card.key] ?? 0;
          let displayValue: string | number = value;
          
          if (card.isMoney) {
            displayValue = value.toLocaleString();
          } else {
            displayValue = value.toLocaleString();
          }

          return (
            <Col xs={24} sm={12} lg={8} xl={6} key={card.key}>
              <Card 
                className={styles.statCard} 
                variant="borderless"
                hoverable
                onClick={() => {
                  // Navigate to relevant page on click
                  if (card.key === 'totalCustomers') router.push('/users?role=user');
                  if (card.key === 'totalMistris') router.push('/servex');
                  if (card.key === 'pendingRequests') router.push('/pending-requests');
                  if (card.key === 'pendingRatings') router.push('/ratings?filter=pending');
                  if (card.key === 'totalRevenue') router.push('/analytics');
                  if (card.key === 'totalSmsSent') router.push('/sms-logs');
                }}
              >
                <div className={styles.statInner}>
                  <div className={styles.statIcon} style={{ backgroundColor: card.bg, color: card.color }}>
                    {card.icon}
                  </div>
                  <div className={styles.statValues}>
                    <span className={styles.statValue}>
                      {card.isMoney ? `NPR ${displayValue}` : displayValue}
                    </span>
                    <span className={styles.statLabel}>{card.label}</span>
                  </div>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Quick Actions & Platform Summary */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} md={12}>
          <Card 
            title="Quick Actions" 
            variant="borderless" 
            className={styles.quickCard}
          >
            <div className={styles.quickActions}>
              <div 
                className={styles.quickLink} 
                onClick={() => router.push('/ratings?filter=pending')}
                style={{ '--accent': '#7c3aed' } as any}
              >
                <StarOutlined />
                <span>Review Pending Ratings</span>
                {!isLoading && (stats?.pendingRatings ?? 0) > 0 && (
                  <span className={styles.badge}>{stats!.pendingRatings}</span>
                )}
              </div>
              <div 
                className={styles.quickLink} 
                onClick={() => router.push('/users')}
                style={{ '--accent': '#2563eb' } as any}
              >
                <UserOutlined />
                <span>Manage Users</span>
              </div>
              <div 
                className={styles.quickLink} 
                onClick={() => router.push('/hero-banners')}
                style={{ '--accent': '#059669' } as any}
              >
                <span>🖼</span>
                <span>Edit Hero Banners</span>
              </div>
              <div 
                className={styles.quickLink} 
                onClick={() => router.push('/platform-services')}
                style={{ '--accent': '#0891b2' } as any}
              >
                <span>🔧</span>
                <span>Manage Service Pricing</span>
              </div>
              <div 
                className={styles.quickLink} 
                onClick={() => router.push('/sms-logs')}
                style={{ '--accent': '#be185d' } as any}
              >
                <MessageOutlined />
                <span>SMS Logs</span>
              </div>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} md={12}>
          <Card 
            title="Platform Summary" 
            variant="borderless" 
            className={styles.quickCard}
          >
            {isLoading ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : (
              <div className={styles.summary}>
                <div className={styles.summaryRow}>
                  <span>Total Users</span>
                  <strong>{(stats?.totalUsers ?? 0).toLocaleString()}</strong>
                </div>
                <div className={styles.summaryRow}>
                  <span>Active ServeX</span>
                  <strong>{(stats?.totalMistris ?? 0).toLocaleString()}</strong>
                </div>
                <div className={styles.summaryRow}>
                  <span>Customers</span>
                  <strong>{(stats?.totalCustomers ?? 0).toLocaleString()}</strong>
                </div>
                <div className={styles.summaryRow}>
                  <span>Completed Revenue</span>
                  <strong>NPR {(stats?.totalRevenue ?? 0).toLocaleString()}</strong>
                </div>
                <div className={styles.summaryRow}>
                  <span>SMS Credits Used</span>
                  <strong>{(stats?.totalSmsSent ?? 0).toLocaleString()}</strong>
                </div>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}