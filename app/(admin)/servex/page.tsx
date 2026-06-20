// app/admin/servex/page.tsx (or mistris/page.tsx)
'use client';

import { useState, useCallback, useMemo } from 'react';
import useSWR, { mutate as globalMutate } from 'swr';
import {
  Table, Input, Switch, Tag, Button, Avatar, Tooltip, App, Typography,
  Modal, Select, Form, Space, Segmented, Image, Badge,
} from 'antd';
import {
  SearchOutlined, StarFilled, EditOutlined,
  CheckCircleOutlined, CloseCircleOutlined, IdcardOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { api } from '../../../_lib/api';
import {
  mistriCountsKey,
  mistriCountsMatcher,
  type MistriCountsPayload,
} from '../../../_lib/mistris-counts';
import styles from './mistris.module.css';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

type ApprovalStatus = 'pending' | 'approved' | 'rejected';

interface Mistri {
  id: string;
  fullName: string;
  phoneNumber: string;
  isActive: boolean;
  serviceId: number | null;
  profilePhotoUrl: string | null;
  isAvailable: boolean;
  availabilityStatus: string;
  isFeatured: boolean;
  averageRating: string | null;
  jobsCompleted: number;
  createdAt: string;
  approvalStatus: ApprovalStatus | null;
  approvalRejectionReason: string | null;
  govtIdFrontUrl: string | null;
  govtIdBackUrl: string | null;
  experienceLevel: string | null;
  govtIdType: string | null;
}

interface MistrisResponse {
  success: boolean;
  mistris: Mistri[];
  pagination: { page: number; limit: number; total: number };
}

const AVAILABILITY_COLOR: Record<string, string> = {
  available: 'green',
  unavailable: 'red',
  on_work_available: 'orange',
};

const AVAILABILITY_LABEL: Record<string, string> = {
  available: 'Available',
  unavailable: 'Unavailable',
  on_work_available: 'On Work',
};

const APPROVAL_COLOR: Record<ApprovalStatus, string> = {
  pending: 'orange',
  approved: 'green',
  rejected: 'red',
};

const APPROVAL_LABEL: Record<ApprovalStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

const EXPERIENCE_LABEL: Record<string, string> = {
  less_than_1: '< 1 year',
  '1_to_3': '1–3 years',
  '3_plus': '3+ years',
};

const GOVT_ID_LABEL: Record<string, string> = {
  citizenship: 'Citizenship',
  passport: 'Passport',
  pan: 'PAN Card',
  driving_license: 'Driving License',
};

export default function MistrisPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [approvalFilter, setApprovalFilter] = useState<string>('all');
  const [editMistri, setEditMistri] = useState<Mistri | null>(null);
  const [rejectMistri, setRejectMistri] = useState<Mistri | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [viewIdMistri, setViewIdMistri] = useState<Mistri | null>(null);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const listKey = useCallback(() => {
    const p = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) p.set('search', search);
    if (approvalFilter !== 'all') p.set('approvalStatus', approvalFilter);
    return `/admin/mistris?${p.toString()}`;
  }, [search, page, approvalFilter]);

  const { data, isLoading, mutate } = useSWR<MistrisResponse>(listKey, (url) => api.get(url, true));

  const countsSwrKey = useMemo(() => mistriCountsKey(search), [search]);
  const { data: countsData } = useSWR<MistriCountsPayload>(countsSwrKey, (url) => api.get(url, true), {
    dedupingInterval: 3_000,
  });

  const refreshListAndCounts = useCallback(async () => {
    await Promise.all([mutate(), globalMutate(mistriCountsMatcher)]);
  }, [mutate]);

  const toggleFeatured = async (mistri: Mistri) => {
    try {
      await api.patch(`/admin/mistris/${mistri.id}/toggle-featured`);
      message.success(mistri.isFeatured ? 'Removed from featured' : 'Marked as featured');
      await refreshListAndCounts();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Failed to toggle featured status');
    }
  };

  const handleApprove = async (mistri: Mistri) => {
    try {
      await api.patch(`/admin/mistris/${mistri.id}/approve`);
      message.success(`${mistri.fullName} approved successfully`);
      await refreshListAndCounts();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Failed to approve');
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectMistri) return;
    try {
      await api.patch(`/admin/mistris/${rejectMistri.id}/reject`, { reason: rejectReason });
      message.success(`${rejectMistri.fullName} rejected`);
      setRejectMistri(null);
      setRejectReason('');
      await refreshListAndCounts();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Failed to reject');
    }
  };

  const openEdit = (m: Mistri) => {
    setEditMistri(m);
    form.setFieldsValue({ serviceId: m.serviceId });
  };

  const handleServiceUpdate = async (values: { serviceId: number }) => {
    if (!editMistri) return;
    try {
      await api.patch(`/admin/mistris/${editMistri.id}/update-service`, values);
      message.success('Service category updated successfully');
      setEditMistri(null);
      await refreshListAndCounts();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Failed to update service');
    }
  };

  const c = countsData?.counts;
  const segmentedOptions = useMemo(
    () => [
      {
        value: 'all',
        label: (
          <span className={styles.tabLabel}>
            All
            <Badge count={c?.all ?? 0} showZero color="#475569" className={styles.tabBadge} />
          </span>
        ),
      },
      {
        value: 'pending',
        label: (
          <span className={styles.tabLabel}>
            Pending
            <Badge count={c?.pending ?? 0} showZero color="#fa8c16" className={styles.tabBadge} />
          </span>
        ),
      },
      {
        value: 'approved',
        label: (
          <span className={styles.tabLabel}>
            Approved
            <Badge count={c?.approved ?? 0} showZero color="#16a34a" className={styles.tabBadge} />
          </span>
        ),
      },
      {
        value: 'rejected',
        label: (
          <span className={styles.tabLabel}>
            Rejected
            <Badge count={c?.rejected ?? 0} showZero color="#dc2626" className={styles.tabBadge} />
          </span>
        ),
      },
    ],
    [c?.all, c?.pending, c?.approved, c?.rejected]
  );

  const columns: ColumnsType<Mistri> = [
    {
      title: 'ServeX',
      key: 'name',
      render: (_: unknown, row: Mistri) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar src={row.profilePhotoUrl ?? undefined} size={40}>
            {row.fullName?.[0]?.toUpperCase()}
          </Avatar>
          <div>
            <Text strong style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {row.fullName}
              {row.isFeatured && <StarFilled style={{ color: '#f59e0b', fontSize: 13 }} />}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>{row.phoneNumber}</Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Service',
      dataIndex: 'serviceId',
      key: 'serviceId',
      render: (id: number | null) =>
        id === 1 ? <Tag color="blue">Plumber</Tag>
          : id === 2 ? <Tag color="green">Electrician</Tag>
          : id === 3 ? <Tag color="purple">Painter</Tag>
          : id === 4 ? <Tag color="cyan">Cleaner</Tag>
          : id === 5 ? <Tag color="orange">Carpenter</Tag>
          : id === 6 ? <Tag color="red">AC Repair</Tag>
          : <Text type="secondary">—</Text>,
    },
    {
      title: 'Experience',
      dataIndex: 'experienceLevel',
      key: 'experienceLevel',
      render: (val: string | null) => (
        <Text type="secondary" style={{ fontSize: 13 }}>
          {val ? (EXPERIENCE_LABEL[val] ?? val) : '—'}
        </Text>
      ),
    },
    {
      title: 'Approval',
      dataIndex: 'approvalStatus',
      key: 'approvalStatus',
      render: (s: ApprovalStatus | null) => s
        ? <Tag color={APPROVAL_COLOR[s]}>{APPROVAL_LABEL[s]}</Tag>
        : <Text type="secondary">—</Text>,
    },
    {
      title: 'Availability',
      dataIndex: 'availabilityStatus',
      key: 'status',
      render: (s: string) => (
        <Tag color={AVAILABILITY_COLOR[s] ?? 'default'}>{AVAILABILITY_LABEL[s] ?? s}</Tag>
      ),
    },
    {
      title: 'Rating',
      dataIndex: 'averageRating',
      key: 'rating',
      render: (r: string | null, row: Mistri) => (
        <div>
          <Text strong>{r ? parseFloat(r).toFixed(1) : '—'}</Text>
          <Text type="secondary" style={{ fontSize: 12, marginLeft: 4 }}>
            ({row.jobsCompleted} jobs)
          </Text>
        </div>
      ),
    },
    {
      title: 'Featured',
      key: 'featured',
      render: (_: unknown, row: Mistri) => (
        <Switch
          checked={row.isFeatured}
          size="small"
          checkedChildren={<StarFilled />}
          unCheckedChildren=""
          onChange={() => toggleFeatured(row)}
        />
      ),
    },
    {
      title: 'Active',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? 'Active' : 'Inactive'}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 220,
      render: (_: unknown, row: Mistri) => (
        <Space size={4}>
          {/* View ID */}
          {(row.govtIdFrontUrl || row.govtIdBackUrl) && (
            <Tooltip title="View ID documents">
              <Button
                icon={<IdcardOutlined />}
                size="small"
                onClick={() => setViewIdMistri(row)}
              />
            </Tooltip>
          )}

          {/* Approve */}
          {row.approvalStatus !== 'approved' && (
            <Tooltip title="Approve">
              <Button
                icon={<CheckCircleOutlined />}
                size="small"
                type="primary"
                style={{ backgroundColor: '#16a34a', borderColor: '#16a34a' }}
                onClick={() => handleApprove(row)}
              />
            </Tooltip>
          )}

          {/* Reject */}
          {row.approvalStatus !== 'rejected' && (
            <Tooltip title="Reject">
              <Button
                icon={<CloseCircleOutlined />}
                size="small"
                danger
                onClick={() => { setRejectMistri(row); setRejectReason(''); }}
              />
            </Tooltip>
          )}

          {/* Change service */}
          <Tooltip title="Change service">
            <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(row)} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Title level={4} style={{ margin: 0 }}>ServeX Providers</Title>
        <Text type="secondary">Manage and approve service providers</Text>
      </div>

      <div className={styles.filters}>
        <Input
          placeholder="Search by name or phone..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ width: 280 }}
          allowClear
        />
        <Segmented
          options={segmentedOptions}
          value={approvalFilter}
          onChange={(val) => { setApprovalFilter(val as string); setPage(1); }}
        />
      </div>

      <Table
        columns={columns}
        dataSource={data?.mistris ?? []}
        loading={isLoading}
        rowKey="id"
        pagination={{
          current: page,
          pageSize: 20,
          total: data?.pagination.total ?? 0,
          onChange: setPage,
          showTotal: (total) => `Total ${total} providers`,
        }}
        className={styles.table}
        size="middle"
      />

      {/* Change Service Modal */}
      <Modal
        title="Change Service Category"
        open={!!editMistri}
        onCancel={() => setEditMistri(null)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleServiceUpdate} style={{ marginTop: 16 }}>
          <Form.Item 
            label="Service Category" 
            name="serviceId" 
            rules={[{ required: true, message: 'Please select a service category' }]}
          >
            <Select placeholder="Select service category">
              <Option value={1}>Plumbing</Option>
              <Option value={2}>Electrical</Option>
              <Option value={3}>Painting</Option>
              <Option value={4}>Cleaning</Option>
              <Option value={5}>Carpentry</Option>
              <Option value={6}>AC Repair</Option>
            </Select>
          </Form.Item>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button onClick={() => setEditMistri(null)}>Cancel</Button>
            <Button type="primary" htmlType="submit">Save</Button>
          </div>
        </Form>
      </Modal>

      {/* Reject Modal */}
      <Modal
        title={`Reject: ${rejectMistri?.fullName}`}
        open={!!rejectMistri}
        onCancel={() => setRejectMistri(null)}
        onOk={handleRejectSubmit}
        okText="Reject"
        okButtonProps={{ danger: true }}
        destroyOnClose
      >
        <div style={{ marginTop: 12 }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 10 }}>
            Optionally provide a reason. The provider will see this message.
          </Text>
          <TextArea
            rows={3}
            placeholder="e.g. ID documents are unclear, please resubmit..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </div>
      </Modal>

      {/* View ID Modal */}
      <Modal
        title={
          <span>
            ID Documents —&nbsp;
            <Text strong>{viewIdMistri?.fullName}</Text>
            {viewIdMistri?.govtIdType && (
              <Tag style={{ marginLeft: 8 }} color="blue">
                {GOVT_ID_LABEL[viewIdMistri.govtIdType] ?? viewIdMistri.govtIdType}
              </Tag>
            )}
          </span>
        }
        open={!!viewIdMistri}
        onCancel={() => setViewIdMistri(null)}
        footer={null}
        width={640}
        destroyOnClose
      >
        <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
          {viewIdMistri?.govtIdFrontUrl && (
            <div style={{ flex: 1, minWidth: 260 }}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>Front Side</Text>
              <Image
                src={viewIdMistri.govtIdFrontUrl}
                alt="ID Front"
                style={{ width: '100%', borderRadius: 8, border: '1px solid #e5e7eb' }}
                fallback="https://placehold.co/400x300/f3f4f6/9ca3af?text=No+Image"
              />
            </div>
          )}
          {viewIdMistri?.govtIdBackUrl && (
            <div style={{ flex: 1, minWidth: 260 }}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>Back Side</Text>
              <Image
                src={viewIdMistri.govtIdBackUrl}
                alt="ID Back"
                style={{ width: '100%', borderRadius: 8, border: '1px solid #e5e7eb' }}
                fallback="https://placehold.co/400x300/f3f4f6/9ca3af?text=No+Image"
              />
            </div>
          )}
        </div>

        {/* Approve/Reject actions within the modal */}
        {viewIdMistri && viewIdMistri.approvalStatus !== 'approved' && (
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20, paddingTop: 16, borderTop: '1px solid #f3f4f6' }}>
            <Button
              danger
              onClick={() => {
                setViewIdMistri(null);
                setRejectMistri(viewIdMistri);
                setRejectReason('');
              }}
            >
              Reject
            </Button>
            <Button
              type="primary"
              style={{ backgroundColor: '#16a34a', borderColor: '#16a34a' }}
              onClick={async () => {
                await handleApprove(viewIdMistri);
                setViewIdMistri(null);
              }}
            >
              Approve
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}