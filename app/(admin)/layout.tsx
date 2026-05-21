'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { Layout, Menu, Avatar, Dropdown, Badge, Typography } from 'antd';
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
} from '@ant-design/icons';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { clearSession } from '../../_lib/auth';
import { api } from '../../_lib/api';
import { MISTRIS_COUNTS_GLOBAL_KEY, type MistriCountsPayload } from '../../_lib/mistris-counts';
import styles from './layout.module.css';

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

/** Plain titles for header (menu labels may be React nodes). */
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
];

function headerTitle(pathname: string): string {
  const hit = HEADER_TITLE_BY_PREFIX.find((h) => pathname.startsWith(h.prefix));
  return hit?.title ?? 'Admin';
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const { data: mistriCounts } = useSWR<MistriCountsPayload>(MISTRIS_COUNTS_GLOBAL_KEY, api.get, {
    refreshInterval: 60_000,
    dedupingInterval: 5_000,
  });
  const pendingMistris = mistriCounts?.counts?.pending ?? 0;

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
        label: 'ServeX',
      },
      { key: '/service-categories', icon: <AppstoreOutlined />, label: 'Service Categories' },
      { key: '/platform-services', icon: <ToolOutlined />, label: 'Platform Services' },
      { key: '/hero-banners', icon: <PictureOutlined />, label: 'Hero Banners' },
      { key: '/ratings', icon: <StarOutlined />, label: 'Ratings' },
      { key: '/service-requests', icon: <FileTextOutlined />, label: 'Service Requests' },
      { key: '/audit-logs', icon: <AuditOutlined />, label: 'Audit Logs' },
      { key: '/sms-logs', icon: <MessageOutlined />, label: 'SMS Logs' },
    ],
    [pendingMistris]
  );

  const handleMenuClick = ({ key }: { key: string }) => {
    router.push(key);
  };

  const handleLogout = async () => {
    try {
      await clearSession();
    } finally {
      router.push('/login');
    }
  };

  const userMenu = {
    items: [
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'Sign out',
        danger: true,
        onClick: handleLogout,
      },
    ],
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={240}
        className={styles.sider}
      >
        <div className={styles.siderLogo}>
          <div className={styles.logoIcon}>
            <Image src="/icon.png" alt="ServeX" width={32} height={32} priority />
          </div>
          {!collapsed && <span className={styles.logoText}>ServeX Admin</span>}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname]}
          items={navItems}
          onClick={handleMenuClick}
          className={styles.menu}
        />
      </Sider>

      <Layout>
        <Header className={styles.header}>
          <div className={styles.headerLeft}>
            <Text className={styles.pageTitle}>{headerTitle(pathname)}</Text>
          </div>
          <div className={styles.headerRight}>
            <Dropdown menu={userMenu} trigger={['click']} placement="bottomRight">
              <Avatar
                icon={<UserOutlined />}
                style={{ backgroundColor: '#2563eb', cursor: 'pointer' }}
              />
            </Dropdown>
          </div>
        </Header>

        <Content className={styles.content}>{children}</Content>
      </Layout>
    </Layout>
  );
}
