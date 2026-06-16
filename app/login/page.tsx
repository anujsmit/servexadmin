'use client';

import { useState, useEffect } from 'react';
import { Form, Input, Button, App, Spin } from 'antd';
import { useRouter } from 'next/navigation';
import { adminLoginWithPassword } from '../../_lib/auth';
import styles from './login.module.css';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const router = useRouter();
  const { message } = App.useApp();

  useEffect(() => {
    setMounted(true);
    
    // Check if already logged in
    const token = localStorage.getItem('admin_token');
    if (token) {
      router.replace('/dashboard');
    }
  }, [router]);

  const handleLogin = async (values: { phone: string; password: string }) => {
    try {
      setLoading(true);
      
      const response = await adminLoginWithPassword(values.phone, values.password);
      
      if (response.success) {
        // Store token and user data
        if (response.token) {
          localStorage.setItem('admin_token', response.token);
        }
        if (response.user) {
          localStorage.setItem('admin_user', JSON.stringify(response.user));
        }
        message.success(`Welcome, ${response.user?.fullName || 'Admin'}`);
        router.push('/dashboard');
      } else {
        message.error('Invalid credentials');
      }
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.card}>
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <div className={styles.logo}>S</div>
          <h1 className={styles.title}>ServeX Admin</h1>
          <p className={styles.subtitle}>Platform management console</p>
        </div>

        <Form
          layout="vertical"
          requiredMark={false}
          onFinish={handleLogin}
          initialValues={{ phone: '9825995421' }}
        >
          <Form.Item
            label="Phone Number"
            name="phone"
            rules={[
              { required: true, message: 'Phone number is required' },
              { pattern: /^[6-9]\d{9}$/, message: 'Enter a valid 10-digit phone number' },
            ]}
          >
            <Input
              size="large"
              placeholder="9825995421"
              prefix={<span style={{ color: 'var(--color-text-muted)' }}>🇳🇵</span>}
            />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Password is required' }]}
          >
            <Input.Password size="large" placeholder="Enter your password" />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={loading}
            block
            className={styles.submitBtn}
          >
            Sign In
          </Button>
        </Form>
      </div>
    </div>
  );
}