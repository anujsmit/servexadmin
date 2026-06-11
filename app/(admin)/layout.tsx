'use client';

import { useMemo, useState, useEffect } from 'react';
import useSWR from 'swr';
import { Layout, Menu, Avatar, Dropdown, Badge, Typography, Spin, message } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  AppstoreOutlined,
  PictureOutlined,
  StarOutlined,
  FileTextOutlined,
  AuditOutlined,
  LogoutOutlined,
  ToolOutlined,
  MessageOutlined,
  SettingOutlined,
  DollarOutlined,
  PieChartOutlined,
} from '@ant-design/icons';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { getCurrentAdmin, adminLogout } from '../../_lib/auth';
import { api } from '../../_lib/api';
import { MISTRIS_COUNTS_GLOBAL_KEY, type MistriCountsPayload } from '../../_lib/mistris-counts';
import styles from './layout.module.css';

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

/** Plain titles for header */
const HEADER_TITLE_BY_PREFIX: { prefix: string; title: string }[] = [
  { prefix: '/dashboard', title: 'Dashboard' },
  { prefix: '/users', title: 'Users' },
  { prefix: '/servex', title: 'ServeX' },
  { prefix: '/service-categories', title: 'Service Categories' },
  { prefix: '/platform-services', title: 'Platform Services' },
  { prefix: '/hero-banners', title: 'Hero Banners' },
  { prefix: '/ratings', title: 'Ratings' },
  { prefix: '/service-requests', title: 'Service Requests' },
  { prefix: '/audit-logs', title: 'Audit Logs' },
  { prefix: '/sms-logs', title: 'SMS Logs' },
  { prefix: '/expenses', title: 'Expenses' },
  { prefix: '/payouts', title: 'Payouts' },
  { prefix: '/analytics', title: 'Analytics' },
  { prefix: '/broadcast', title: 'Broadcast' },
  { prefix: '/employees', title: 'Employees' },
  { prefix: '/settings', title: 'Settings' },
];

function headerTitle(pathname: string): string {
  const hit = HEADER_TITLE_BY_PREFIX.find((h) => pathname.startsWith(h.prefix));
  return hit?.title ?? 'Admin';
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Remove /admin prefix for matching
  const currentPath = pathname.replace('/admin', '') || '/dashboard';

  const { data: mistriCounts } = useSWR<MistriCountsPayload>(MISTRIS_COUNTS_GLOBAL_KEY, api.get, {
    refreshInterval: 60_000,
    dedupingInterval: 5_000,
  });
  const pendingMistris = mistriCounts?.counts?.pending ?? 0;

  // Load admin user on mount
  useEffect(() => {
    const loadAdmin = async () => {
      try {
        const result = await getCurrentAdmin();
        if (!result?.me && !result?.user) {
          // No user found, redirect to login
          message.error('Session expired. Please login again.');
          router.push('/login');
          return;
        }
        const userData = result?.me || result?.user;
        setAdminUser(userData);
      } catch (error) {
        console.error('Failed to load admin:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    loadAdmin();
  }, [router]);

  const navItems = useMemo(
    () => [
      { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
      { key: '/users', icon: <UserOutlined />, label: 'Users' },
      {
        key: '/servex',
        icon: (
          <Badge count={pendingMistris} size="small" offset={[-2, 2]} overflowCount={99}>
            <TeamOutlined style={{ fontSize: 16 }} />
          </Badge>
        ),
        label: 'ServeX (Mistris)',
      },
      { key: '/service-categories', icon: <AppstoreOutlined />, label: 'Service Categories' },
      { key: '/platform-services', icon: <ToolOutlined />, label: 'Platform Services' },
      { key: '/hero-banners', icon: <PictureOutlined />, label: 'Hero Banners' },
      { key: '/ratings', icon: <StarOutlined />, label: 'Ratings' },
      { key: '/service-requests', icon: <FileTextOutlined />, label: 'Service Requests' },
      { key: '/expenses', icon: <DollarOutlined />, label: 'Expenses' },
      { key: '/payouts', icon: <DollarOutlined />, label: 'Payouts' },
      { key: '/analytics', icon: <PieChartOutlined />, label: 'Analytics' },
      { key: '/broadcast', icon: <MessageOutlined />, label: 'Broadcast' },
      { key: '/audit-logs', icon: <AuditOutlined />, label: 'Audit Logs' },
      { key: '/sms-logs', icon: <MessageOutlined />, label: 'SMS Logs' },
      { key: '/employees', icon: <TeamOutlined />, label: 'Employees' },
      { key: '/settings', icon: <SettingOutlined />, label: 'Settings' },
    ],
    [pendingMistris]
  );

  const handleMenuClick = ({ key }: { key: string }) => {
    router.push(`/admin${key}`);
  };

  const handleLogout = async () => {
    try {
      await adminLogout();
      message.success('Logged out successfully');
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      message.error('Failed to logout');
    }
  };

  const userMenu = {
    items: [
      {
        key: 'user-info',
        label: (
          <div style={{ padding: '4px 0' }}>
            <Text strong>{adminUser?.fullName || 'Admin User'}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {adminUser?.staffRole || adminUser?.role || 'Admin'}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: 11 }}>
              {adminUser?.phoneNumber}
            </Text>
          </div>
        ),
        disabled: true,
      },
      { type: 'divider' },
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: 'My Profile',
        onClick: () => router.push('/admin/profile'),
      },
      {
        key: 'security',
        icon: <SettingOutlined />,
        label: 'Security Settings',
        onClick: () => router.push('/admin/security'),
      },
      { type: 'divider' },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'Sign Out',
        danger: true,
        onClick: handleLogout,
      },
    ],
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f0f2f5'
      }}>
        <Spin size="large" tip="Loading dashboard..." />
      </div>
    );
  }

  if (!adminUser) {
    return null; // Will redirect in useEffect
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={260}
        theme="dark"
        className={styles.sider}
      >
        <div className={styles.siderLogo}>
          <div className={styles.logoIcon}>
            <Image src="/icon.png" alt="ServeX" width={36} height={36} priority />
          </div>
          {!collapsed && <span className={styles.logoText}>ServeX Admin</span>}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[currentPath]}
          defaultSelectedKeys={['/dashboard']}
          items={navItems}
          onClick={handleMenuClick}
          className={styles.menu}
        />
      </Sider>

      <Layout>
        <Header className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.collapseTrigger} onClick={() => setCollapsed(!collapsed)}>
              {collapsed ? '☰' : '◀'}
            </div>
            <Text className={styles.pageTitle}>{headerTitle(currentPath)}</Text>
          </div>
          <div className={styles.headerRight}>
            <Dropdown menu={userMenu} trigger={['click']} placement="bottomRight">
              <div className={styles.userInfo}>
                <Avatar
                  icon={<UserOutlined />}
                  style={{ backgroundColor: '#2563eb', cursor: 'pointer' }}
                />
                <span className={styles.userName}>
                  {adminUser.fullName?.split(' ')[0] || 'Admin'}
                </span>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content className={styles.content}>{children}</Content>
      </Layout>
    </Layout>
  );
}