// app/admin/layout.tsx
'use client';

import { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Typography, Spin, App as AntdApp, Button } from 'antd';
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
  { key: '/users', icon: <UserOutlined />, label: 'Users', path: '/users' },
  { key: '/servex', icon: <TeamOutlined />, label: 'ServeX (Mistris)', path: '/servex' },
  { key: '/service-categories', icon: <AppstoreOutlined />, label: 'Service Categories', path: '/service-categories' },
  { key: '/platform-services', icon: <ToolOutlined />, label: 'Platform Services', path: '/platform-services' },
  { key: '/hero-banners', icon: <PictureOutlined />, label: 'Hero Banners', path: '/hero-banners' },
  { key: '/ratings', icon: <StarOutlined />, label: 'Ratings', path: '/ratings' },
  { key: '/service-requests', icon: <FileTextOutlined />, label: 'Service Requests', path: '/service-requests' },
  { key: '/audit-logs', icon: <AuditOutlined />, label: 'Audit Logs', path: '/audit-logs' },
  { key: '/sms-logs', icon: <MessageOutlined />, label: 'SMS Logs', path: '/sms-logs' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [fetchingPending, setFetchingPending] = useState(false);
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
        
        // Fetch pending count after admin is loaded
        await fetchPendingCount();
      } catch (error) {
        console.error('Failed to load admin:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    loadAdmin();
  }, [mounted, router]);

  // Fetch pending requests count periodically
  const fetchPendingCount = async () => {
    if (fetchingPending) return;
    
    try {
      setFetchingPending(true);
      const response = await api.get('/admin/all-requests?limit=100');
      
      if (response.success) {
        const pending = (response.requests || []).filter((req: any) => {
          const isPendingStatus = req.status === 'pending';
          const noMistri = !req.assignedMistriId && !req.mistriName;
          const notAssigned = req.status !== 'assigned' && req.status !== 'completed' && req.status !== 'canceled';
          return isPendingStatus && (noMistri || notAssigned);
        });
        setPendingCount(pending.length);
      }
    } catch (error) {
      console.error('Failed to fetch pending count:', error);
    } finally {
      setFetchingPending(false);
    }
  };

  // Poll for pending count every 30 seconds
  useEffect(() => {
    if (!mounted || !adminUser) return;
    
    const interval = setInterval(fetchPendingCount, 30000);
    return () => clearInterval(interval);
  }, [mounted, adminUser]);

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

  // Create menu items with badges
  const menuItemsWithBadges = MENU_ITEMS.map(item => {
    if (item.key === '/pending-requests' && pendingCount > 0) {
      return {
        ...item,
        label: (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <span>{item.label}</span>
            <Badge 
              count={pendingCount} 
              style={{ 
                backgroundColor: '#faad14',
                color: '#fff',
                fontSize: 11,
                fontWeight: 'bold',
                boxShadow: '0 2px 8px rgba(250, 173, 20, 0.4)',
              }} 
            />
          </div>
        ),
      };
    }
    return item;
  });

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
            items={menuItemsWithBadges}
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
              {/* Pending Requests Notification Icon */}
              <Badge 
                count={pendingCount} 
                offset={[-4, 4]}
                style={{ 
                  backgroundColor: '#faad14',
                  color: '#fff',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 8px rgba(250, 173, 20, 0.4)',
                }}
              >
                <Button
                  type="text" 
                  icon={<ClockCircleOutlined style={{ fontSize: 18, color: '#666' }} />}
                  onClick={() => router.push('/pending-requests')}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    padding: '0 8px',
                    height: 40,
                  }}
                />
              </Badge>
              
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