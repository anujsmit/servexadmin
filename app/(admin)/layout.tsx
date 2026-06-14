'use client';

import { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Typography, Spin, App as AntdApp } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  AppstoreOutlined,
  PictureOutlined,
  StarOutlined,
  PlusOutlined,
  FileTextOutlined,
  AuditOutlined,
  LogoutOutlined,
  ToolOutlined,
  MessageOutlined,
  SettingOutlined,
  DollarOutlined,
  PieChartOutlined,
  ClockCircleOutlined,
  SendOutlined,
  NotificationOutlined,
} from '@ant-design/icons';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { getCurrentAdmin, adminLogout } from '../../_lib/auth';
import { api } from '../../_lib/api';
import styles from './layout.module.css';

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

// Menu configuration
const MENU_ITEMS = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard', path: '/dashboard' },
  { key: '/pending-requests', icon: <ClockCircleOutlined />, label: 'Pending Requests', path: '/pending-requests' },
  { key: '/manual-assign', icon: <PlusOutlined />, label: 'Manual Assign', path: '/manual-assign' },
  { key: '/users', icon: <UserOutlined />, label: 'Users', path: '/users' },
  { key: '/servex', icon: <TeamOutlined />, label: 'ServeX (Mistris)', path: '/servex' },
  { key: '/service-categories', icon: <AppstoreOutlined />, label: 'Service Categories', path: '/service-categories' },
  { key: '/platform-services', icon: <ToolOutlined />, label: 'Platform Services', path: '/platform-services' },
  { key: '/hero-banners', icon: <PictureOutlined />, label: 'Hero Banners', path: '/hero-banners' },
  { key: '/ratings', icon: <StarOutlined />, label: 'Ratings', path: '/ratings' },
  { key: '/service-requests', icon: <FileTextOutlined />, label: 'Service Requests', path: '/service-requests' },
  { key: '/expenses', icon: <DollarOutlined />, label: 'Expenses', path: '/expenses' },
  { key: '/payouts', icon: <DollarOutlined />, label: 'Payouts', path: '/payouts' },
  { key: '/analytics', icon: <PieChartOutlined />, label: 'Analytics', path: '/analytics' },
  { key: '/broadcast', icon: <SendOutlined />, label: 'Broadcast', path: '/broadcast' },
  { key: '/audit-logs', icon: <AuditOutlined />, label: 'Audit Logs', path: '/audit-logs' },
  { key: '/sms-logs', icon: <MessageOutlined />, label: 'SMS Logs', path: '/sms-logs' },
  { key: '/employees', icon: <TeamOutlined />, label: 'Employees', path: '/employees' },
  { key: '/settings', icon: <SettingOutlined />, label: 'Settings', path: '/settings' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Get current path without /admin prefix
  const currentPath = '/' + (pathname.replace('/admin', '').split('/')[1] || 'dashboard');
  const currentKey = '/' + (currentPath.split('/')[1] || 'dashboard');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const loadAdmin = async () => {
      try {
        const result = await getCurrentAdmin();
        if (!result?.me && !result?.user) {
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
  }, [mounted, router]);

  const handleMenuClick = ({ key }: { key: string }) => {
    const menuItem = MENU_ITEMS.find(item => item.key === key);
    if (menuItem) {
      router.push(menuItem.path);
    }
  };

  const handleLogout = async () => {
    try {
      await adminLogout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
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
        onClick: () => router.push('/profile'),
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

  // Don't render anything on server-side
  if (!mounted) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f0f2f5'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f0f2f5'
      }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!adminUser) {
    return null;
  }

  return (
    <AntdApp>
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
            selectedKeys={[currentKey]}
            defaultSelectedKeys={['/dashboard']}
            items={MENU_ITEMS}
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
              <Text className={styles.pageTitle}>
                {MENU_ITEMS.find(item => item.key === currentKey)?.label || 'Dashboard'}
              </Text>
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
    </AntdApp>
  );
}