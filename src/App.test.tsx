import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders today view and all main navigation entries', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: '今日工作' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '统一收件箱' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '客户/项目' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '需求与任务' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '文档' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '知识库审核' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '对账' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '设置' })).toBeInTheDocument();
  });

  it('switches to settings', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '设置' }));

    expect(screen.getByRole('heading', { name: '数据与模型' })).toBeInTheDocument();
    expect(screen.getByText('DeepSeek 已配置')).toBeInTheDocument();
  });

  it('shows the selected directory immediately', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '选择目录' }));

    expect(screen.getByText('D:\\客户资料\\演示目录')).toBeInTheDocument();
    expect(screen.getByText(/已扫描 28 个文件/)).toBeInTheDocument();
  });

  it('creates a work card from a one-line inbox requirement', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '统一收件箱' }));
    await user.type(
      screen.getByLabelText('粘贴微信、飞书或一句话需求'),
      '月底前确认医院营养餐台账并按科室导出',
    );
    await user.click(screen.getByRole('button', { name: 'AI 识别并生成工作卡' }));

    expect(screen.getAllByText(/月底前确认医院营养餐台账/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('北城医科大学食堂平台 · 产品经理').length).toBeGreaterThan(0);
  });

  it('approves a candidate knowledge item', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '知识库审核' }));
    const approveButtons = screen.getAllByRole('button', { name: /采纳/ });
    await user.click(approveButtons[0]);

    expect(screen.getByText('已采纳')).toBeInTheDocument();
  });

  it('renders reconciliation rows and can import the sample', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '对账' }));
    expect(screen.getByRole('heading', { name: '月度对账' })).toBeInTheDocument();
    expect(screen.getByText('¥-30.00')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /导入本月 Excel/ }));
    expect(screen.getByText(/已导入本月对账 Excel 示例/)).toBeInTheDocument();
  });
});
