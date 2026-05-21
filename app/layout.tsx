'use client';

import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider, App } from 'antd';
import './globals.css';

const theme = {
  token: {
    colorPrimary: '#2563eb',
    colorSuccess: '#059669',
    colorWarning: '#d97706',
    colorError: '#dc2626',
    colorBgBase: '#ffffff',
    colorTextBase: '#111827',
    borderRadius: 8,
    fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: 14,
    colorBgLayout: '#f5f6fa',
    colorBorderSecondary: '#e5e7eb',
  },
  components: {
    Layout: {
      siderBg: '#0f1623',
      headerBg: '#ffffff',
      triggerBg: '#1a2332',
    },
    Menu: {
      darkItemBg: '#0f1623',
      darkSubMenuItemBg: '#0f1623',
      darkItemSelectedBg: '#2563eb',
      darkItemHoverBg: 'rgba(37, 99, 235, 0.12)',
      darkItemColor: '#94a3b8',
      darkItemSelectedColor: '#ffffff',
      itemBorderRadius: 8,
    },
    Table: {
      borderRadius: 10,
    },
    Card: {
      borderRadius: 10,
    },
    Button: {
      borderRadius: 8,
    },
    Input: {
      borderRadius: 8,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>ServeX Admin</title>
        <meta name="description" content="ServeX platform admin panel" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AntdRegistry>
          <ConfigProvider theme={theme}>
            <App>{children}</App>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
