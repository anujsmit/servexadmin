'use client';

import useSWR from 'swr';
import { Card, Row, Col, Statistic, Typography, Skeleton, Alert } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  StarOutlined,
  DollarOutlined,
  MessageOutlined,
} from '@ant-design/icons';
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
    label: 'ServeX',
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
    label: 'Total Revenue (NPR)',
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
  const { data, error, isLoading } = useSWR<{ success: boolean; stats: Stats }>(
    '/api/admin/stats',
    api.get
  );

  const stats = data?.stats;

  return (
    <div>
      <div className={styles.header}>
        <Title level={4} style={{ margin: 0 }}>Dashboard</Title>
        <Text type="secondary">Platform overview</Text>
      </div>

      {error && (
        <Alert
          type="error"
          message="Failed to load stats"
          description={error.message}
          style={{ marginBottom: 24 }}
        />
      )}

      <Row gutter={[16, 16]}>
        {STAT_CARDS.map((card) => (
          <Col xs={24} sm={12} lg={8} xl={6} key={card.key}>
            <Card className={styles.statCard} variant="borderless">
              <div className={styles.statInner}>
                <div className={styles.statIcon} style={{ backgroundColor: card.bg, color: card.color }}>
                  {card.icon}
                </div>
                {isLoading ? (
                  <Skeleton active paragraph={false} title={{ width: 80 }} />
                ) : (
                  <div className={styles.statValues}>
                    <span className={styles.statValue}>
                      {card.isMoney
                        ? `NPR ${(stats?.[card.key] ?? 0).toLocaleString()}`
                        : (stats?.[card.key] ?? 0).toLocaleString()}
                    </span>
                    <span className={styles.statLabel}>{card.label}</span>
                  </div>
                )}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} md={12}>
          <Card title="Quick Actions" variant="borderless" className={styles.quickCard}>
            <div className={styles.quickActions}>
              <a href="/ratings" className={styles.quickLink} style={{ '--accent': '#7c3aed' } as any}>
                <StarOutlined />
                <span>Review Pending Ratings</span>
                {!isLoading && (stats?.pendingRatings ?? 0) > 0 && (
                  <span className={styles.badge}>{stats!.pendingRatings}</span>
                )}
              </a>
              <a href="/users" className={styles.quickLink} style={{ '--accent': '#2563eb' } as any}>
                <UserOutlined />
                <span>Manage Users</span>
              </a>
              <a href="/hero-banners" className={styles.quickLink} style={{ '--accent': '#059669' } as any}>
                <span>🖼</span>
                <span>Edit Hero Banners</span>
              </a>
              <a href="/platform-services" className={styles.quickLink} style={{ '--accent': '#0891b2' } as any}>
                <span>🔧</span>
                <span>Manage Service Pricing</span>
              </a>
              <a href="/sms-logs" className={styles.quickLink} style={{ '--accent': '#be185d' } as any}>
                <MessageOutlined />
                <span>SMS Logs</span>
              </a>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Platform Summary" variant="borderless" className={styles.quickCard}>
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
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
