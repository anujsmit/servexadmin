'use client';

import { useState } from 'react';
import { Form, Input, Button, App } from 'antd';
import { useRouter } from 'next/navigation';
import { sendOtp, verifyOtp } from '../../_lib/auth';
import styles from './login.module.css';

type Step = 'phone' | 'otp';

export default function LoginPage() {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { message } = App.useApp();

  const handleSendOtp = async (values: { phone: string }) => {
    setLoading(true);
    try {
      await sendOtp(values.phone);
      setPhone(values.phone);
      setStep('otp');
      message.success('OTP sent successfully');
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (values: { otp: string }) => {
    setLoading(true);
    try {
      const data = await verifyOtp(phone, values.otp);
      message.success(`Welcome, ${data.user.fullName}`);
      router.push('/dashboard');
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <div className={styles.logo}>S</div>
          <h1 className={styles.title}>ServeX Admin</h1>
          <p className={styles.subtitle}>Platform management console</p>
        </div>

        {step === 'phone' ? (
          <Form onFinish={handleSendOtp} layout="vertical" requiredMark={false}>
            <Form.Item
              label="Phone Number"
              name="phone"
              rules={[
                { required: true, message: 'Phone number is required' },
                { pattern: /^\+?[0-9]{10,15}$/, message: 'Enter a valid phone number' },
              ]}
            >
              <Input
                size="large"
                placeholder="e.g. 9800000000"
                prefix={<span style={{ color: 'var(--color-text-muted)' }}>🇳🇵</span>}
              />
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              block
              className={styles.submitBtn}
            >
              Send OTP
            </Button>
          </Form>
        ) : (
          <>
            <div className={styles.otpInfo}>
              <span>OTP sent to </span>
              <strong>{phone}</strong>
              <button
                className={styles.changeBtn}
                onClick={() => setStep('phone')}
              >
                Change
              </button>
            </div>
            <Form onFinish={handleVerifyOtp} layout="vertical" requiredMark={false}>
              <Form.Item
                label="Enter OTP"
                name="otp"
                rules={[
                  { required: true, message: 'OTP is required' },
                  { len: 6, message: 'OTP must be 6 digits' },
                ]}
              >
                <Input
                  size="large"
                  placeholder="6-digit code"
                  maxLength={6}
                  style={{ letterSpacing: '0.3em', fontSize: 20, textAlign: 'center' }}
                />
              </Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
                block
                className={styles.submitBtn}
              >
                Verify & Sign In
              </Button>
            </Form>
          </>
        )}
      </div>
    </div>
  );
}
