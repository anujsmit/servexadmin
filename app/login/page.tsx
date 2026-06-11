'use client';

import { useState, useEffect } from 'react';
import { Form, Input, Button, App, Steps, Alert, Spin } from 'antd';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { adminLoginWithPassword, checkAdminTwoFactorStatus } from '../../_lib/auth';
import styles from './login.module.css';

const DynamicInputOTP = dynamic(
  () => import('antd').then((mod) => mod.Input.OTP),
  { ssr: false, loading: () => <Input placeholder="Enter OTP" /> }
);

type LoginStep = 'credentials' | 'twoFactor';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState<LoginStep>('credentials');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const router = useRouter();
  const { message } = App.useApp();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCredentialsLogin = async (values: { phone: string; password: string }) => {
    try {
      setLoading(true);
      
      // Check if 2FA is enabled for this admin
      setCheckingStatus(true);
      const status = await checkAdminTwoFactorStatus(values.phone);
      setTwoFactorEnabled(status.twoFactorEnabled);
      setCheckingStatus(false);
      
      // Attempt login
      const response = await adminLoginWithPassword(values.phone, values.password);
      
      if (response.requiresTwoFactor) {
        setPhoneNumber(values.phone);
        setCurrentStep('twoFactor');
        message.info('Please enter your 2FA code');
      } else if (response.success) {
        message.success(`Welcome, ${response.user?.fullName || 'Admin'}`);
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
      setCheckingStatus(false);
    }
  };

  const handleTwoFactorLogin = async (values: { twoFactorToken?: string; backupCode?: string }) => {
    try {
      setLoading(true);
      const response = await adminLoginWithPassword(
        phoneNumber,
        undefined,
        values.twoFactorToken,
        values.backupCode
      );
      
      if (response.success) {
        message.success('2FA verified successfully');
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Invalid 2FA code');
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

        {currentStep === 'twoFactor' && (
          <Steps
            current={1}
            items={[
              { title: 'Credentials' },
              { title: '2FA Verification' },
            ]}
            style={{ marginBottom: 32 }}
          />
        )}

        {currentStep === 'credentials' ? (
          <Form
            layout="vertical"
            requiredMark={false}
            onFinish={handleCredentialsLogin}
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
              loading={loading || checkingStatus}
              block
              className={styles.submitBtn}
            >
              Sign In
            </Button>
          </Form>
        ) : (
          <Form
            layout="vertical"
            requiredMark={false}
            onFinish={handleTwoFactorLogin}
          >
            <Alert
              message="Two-Factor Authentication"
              description="Enter the 6-digit code from your authenticator app or use a backup code"
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />

            <Form.Item
              label="Authenticator Code"
              name="twoFactorToken"
              rules={[
                { len: 6, message: 'Code must be 6 digits' },
                { pattern: /^\d{6}$/, message: 'Enter a valid 6-digit code' }
              ]}
            >
              <DynamicInputOTP size="large" length={6} />
            </Form.Item>

            <div style={{ textAlign: 'center', margin: '12px 0' }}>
              <span style={{ color: '#999' }}>or</span>
            </div>

            <Form.Item
              label="Backup Code"
              name="backupCode"
              tooltip="Use one of your backup codes if you lost access to your authenticator"
            >
              <Input size="large" placeholder="XXXX-XXXX" />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              block
              className={styles.submitBtn}
            >
              Verify & Login
            </Button>

            <Button
              type="link"
              size="large"
              block
              onClick={() => {
                setCurrentStep('credentials');
                setTwoFactorEnabled(false);
              }}
              style={{ marginTop: 12 }}
            >
              ← Back to login
            </Button>
          </Form>
        )}
      </div>
    </div>
  );
}