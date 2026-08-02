import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

/** 创建一个最小可用的 Electron desktop mock */
function mockDesktop(overrides: Record<string, unknown> = {}) {
  const mock = {
    selectDirectory: async () => 'D:\\项目\\测试目录',
    addAllowedDir: async () => ({ allowedDirs: ['D:\\项目\\测试目录'] }),
    directory: {
      scan: async () => ({
        folder: 'D:\\项目\\测试目录',
        fileCount: 12,
        notes: 3,
        documents: 4,
        spreadsheets: 2,
        pdfs: 2,
        images: 1,
        other: 0,
        sampleFiles: ['test.md'],
      }),
      listFiles: async () => [
        { name: '方案.docx', path: 'D:\\项目\\测试目录\\方案.docx', extension: 'docx', size: 1024, modifiedAt: '2026-08-01T10:00:00Z' },
        { name: '数据.xlsx', path: 'D:\\项目\\测试目录\\数据.xlsx', extension: 'xlsx', size: 2048, modifiedAt: '2026-08-02T10:00:00Z' },
      ],
    },
    ...overrides,
  } as unknown as typeof window.desktop;

  // overrides.directory 需要嵌套合并，而非顶层覆盖
  if (overrides.directory) {
    delete (mock as unknown as Record<string, unknown>).directory;
    (mock as unknown as Record<string, unknown>).directory = {
      scan: async () => ({
        folder: 'D:\\项目\\测试目录',
        fileCount: 12,
        notes: 3,
        documents: 4,
        spreadsheets: 2,
        pdfs: 2,
        images: 1,
        other: 0,
        sampleFiles: ['test.md'],
      }),
      listFiles: async () => [
        { name: '方案.docx', path: 'D:\\项目\\测试目录\\方案.docx', extension: 'docx', size: 1024, modifiedAt: '2026-08-01T10:00:00Z' },
        { name: '数据.xlsx', path: 'D:\\项目\\测试目录\\数据.xlsx', extension: 'xlsx', size: 2048, modifiedAt: '2026-08-02T10:00:00Z' },
      ],
      ...(overrides.directory as Record<string, unknown> || {}),
    };
  }

  (window as unknown as Record<string, unknown>).desktop = mock;
  return mock;
}

function clearDesktop() {
  delete (window as unknown as Record<string, unknown>).desktop;
}

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    clearDesktop();
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

  // ─── 浏览器预览模式 ───

  it('shows the selected directory immediately in browser preview mode', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '选择目录' }));

    expect(screen.getByText('D:\\客户资料\\演示目录')).toBeInTheDocument();
    expect(screen.getByText(/已扫描 28 个文件/)).toBeInTheDocument();
    expect(screen.getByText(/Markdown 9/)).toBeInTheDocument();
  });

  // ─── Electron 模式：成功 ───

  it('updates directory path and shows scan summary in Electron mode', async () => {
    mockDesktop();
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '选择目录' }));

    // 目录路径立即更新
    expect(screen.getByText('D:\\项目\\测试目录')).toBeInTheDocument();
    // 扫描结果展示
    expect(screen.getByText(/已扫描 12 个文件/)).toBeInTheDocument();
    expect(screen.getByText(/Markdown 3/)).toBeInTheDocument();
    expect(screen.getByText(/Word 4/)).toBeInTheDocument();
    expect(screen.getByText(/Excel 2/)).toBeInTheDocument();
    // Toast 提示
    expect(screen.getByText(/已选择 D:\\项目\\测试目录，发现 12 个文件/)).toBeInTheDocument();
  });

  // ─── Electron 模式：取消选择 ───

  it('keeps existing directory when user cancels the dialog', async () => {
    mockDesktop({
      selectDirectory: async () => null, // 取消
    });
    const user = userEvent.setup();
    render(<App />);

    // 默认目录仍然显示
    expect(screen.getByText('D:\\客户资料\\北城医科大学')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '选择目录' }));

    // 取消后目录不变
    expect(screen.getByText('D:\\客户资料\\北城医科大学')).toBeInTheDocument();
    // 不会出现扫描结果
    expect(screen.queryByText(/已扫描/)).toBeNull();
    // 不会出现错误提示
    expect(screen.queryByRole('alert')).toBeNull();
  });

  // ─── Electron 模式：扫描失败 ───

  it('shows persistent error when scan fails', async () => {
    mockDesktop({
      directory: {
        scan: async () => {
          throw new Error('权限不足：无法读取目录内容');
        },
      },
    });
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '选择目录' }));

    // 目录路径仍然更新
    expect(screen.getByText('D:\\项目\\测试目录')).toBeInTheDocument();
    // 持久化错误 banner 出现
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent('扫描失败：权限不足：无法读取目录内容');
    // Toast 也提示
    expect(screen.getByText(/目录已选择，但扫描失败/)).toBeInTheDocument();
  });

  // ─── Electron 模式：错误可关闭 ───

  it('allows dismissing the error banner', async () => {
    mockDesktop({
      directory: {
        scan: async () => {
          throw new Error('超时');
        },
      },
    });
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '选择目录' }));

    // 错误显示
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // 点击关闭按钮
    await user.click(screen.getByRole('button', { name: '关闭错误提示' }));

    // 错误消失
    expect(screen.queryByRole('alert')).toBeNull();
  });

  // ─── 设置页也显示目录信息 ───

  it('shows directory summary in settings view', async () => {
    mockDesktop();
    const user = userEvent.setup();
    render(<App />);

    // 先选择目录获取扫描结果
    await user.click(screen.getByRole('button', { name: '选择目录' }));
    // 切换到设置
    await user.click(screen.getByRole('button', { name: '设置' }));

    // 设置页显示目录和扫描结果
    expect(screen.getAllByText('D:\\项目\\测试目录').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/已扫描 12 个文件/).length).toBeGreaterThanOrEqual(1);
  });

  // ─── Electron 模式：空目录不显示演示内容 ───

  it('does not show demo projects or knowledge in Electron mode even with empty dir', async () => {
    mockDesktop({
      directory: {
        listFiles: async () => [], // 空目录
      },
    });
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '选择目录' }));

    // 目录路径更新了
    expect(screen.getByText('D:\\项目\\测试目录')).toBeInTheDocument();
    // 不出现演示项目名称
    expect(screen.queryByText('北城医科大学食堂平台')).toBeNull();
    expect(screen.queryByText('华东国企园区收银升级')).toBeNull();
    expect(screen.queryByText('同济医院营养餐项目')).toBeNull();

    // 知识库页面显示空状态，不出现演示知识
    await user.click(screen.getByRole('button', { name: '知识库审核' }));
    expect(screen.queryByText('医院食堂项目通常需要独立的营养餐结算台账')).toBeNull();
    expect(screen.getByText(/选择一个包含文档的目录/)).toBeInTheDocument();

    // 需求与任务页不出现演示需求
    await user.click(screen.getByRole('button', { name: '需求与任务' }));
    expect(screen.queryByText('高校食堂线上订餐支持多门店分账')).toBeNull();
    expect(screen.queryByText('园区一卡通余额同步')).toBeNull();
    expect(screen.queryByText('营养餐结算台账导出')).toBeNull();
    expect(screen.getByText(/选择一个包含文件的目录/)).toBeInTheDocument();

    // 文档页不出现硬编码 HTML 原型名称
    await user.click(screen.getByRole('button', { name: '文档' }));
    expect(screen.queryByText('北城医大·食堂订餐首页原型')).toBeNull();
    expect(screen.queryByText('华东园区·收银升级交互原型')).toBeNull();
    expect(screen.getByText(/选择一个包含文件的目录/)).toBeInTheDocument();

    // 收件箱显示空状态
    await user.click(screen.getByRole('button', { name: '统一收件箱' }));
    expect(screen.getByText(/选择一个包含文件的目录/)).toBeInTheDocument();
  });

  // ─── 原有业务逻辑测试 ───

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
