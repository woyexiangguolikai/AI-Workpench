import type {
  DocumentDraft,
  InboxItem,
  KnowledgeCandidate,
  Project,
  ReconciliationRow,
  Requirement,
  Task,
} from './types';

export const projects: Project[] = [
  {
    id: 'P001',
    name: '北城医科大学食堂平台',
    status: '售前推进',
    source: '商务王经理',
    owner: '产品经理',
    summary: '高校食堂线上订餐、分账与支付接入，当前需要方案、功能清单和报价。',
    ddl: '2026-08-08',
    folder: 'D:\\客户资料\\北城医科大学',
    documents: ['售前方案', '功能清单', '测试用例'],
    openTasks: 5,
    risk: '支付分账口径待确认',
  },
  {
    id: 'P002',
    name: '华东国企园区收银升级',
    status: '二开实施',
    source: '商务刘经理',
    owner: '产品经理',
    summary: '基于标准版收银系统增加园区一卡通个性化改造，需确认模块影响。',
    ddl: '2026-08-20',
    folder: 'D:\\客户资料\\华东国企园区',
    documents: ['PRD', '模块影响', '原型'],
    openTasks: 8,
    risk: '标准版升级后存在回归风险',
  },
  {
    id: 'P003',
    name: '同济医院营养餐项目',
    status: '实施交付',
    source: '商务赵经理',
    owner: '项目经理',
    summary: '营养餐结算、科室配送和医院专属台账，当前进入测试和上线准备。',
    ddl: '2026-08-28',
    folder: 'D:\\客户资料\\同济医院',
    documents: ['测试用例', '缺陷清单', '培训材料'],
    openTasks: 11,
    risk: '医院网络环境限制未确认',
  },
];

export const requirements: Requirement[] = [
  {
    id: 'R001',
    projectId: 'P001',
    title: '高校食堂线上订餐支持多门店分账',
    type: '个性化开发',
    owner: '产品经理',
    priority: '高',
    planStart: '2026-08-03',
    planEnd: '2026-08-07',
    status: '执行中',
    description: '学校与平台分账、平台与商户分账规则按门店配置。',
  },
  {
    id: 'R002',
    projectId: 'P002',
    title: '园区一卡通余额同步',
    type: '个性化开发',
    owner: '开发',
    priority: '紧急',
    planStart: '2026-08-04',
    planEnd: '2026-08-11',
    status: '待开始',
    description: '收银系统与园区一卡通余额实时同步，失败时自动补偿。',
  },
  {
    id: 'R003',
    projectId: 'P003',
    title: '营养餐结算台账导出',
    type: '标准版配置',
    owner: '测试',
    priority: '中',
    planStart: '2026-08-12',
    planEnd: '2026-08-14',
    status: '待审核',
    description: '按科室、日期、餐次汇总结算台账，支持 Excel 导出。',
  },
];

export const tasks: Task[] = [
  {
    id: 'T001',
    requirementId: 'R001',
    title: '确认分账规则与账户口径',
    assignee: '产品经理',
    planStart: '2026-08-03',
    planEnd: '2026-08-04',
    status: '执行中',
    dependsOn: [],
  },
  {
    id: 'T002',
    requirementId: 'R001',
    title: '生成功能清单与方案初稿',
    assignee: 'AI 工作台',
    planStart: '2026-08-04',
    planEnd: '2026-08-06',
    status: '待开始',
    dependsOn: ['T001'],
  },
  {
    id: 'T003',
    requirementId: 'R002',
    title: '读取源码确认一卡通模块影响',
    assignee: 'AI 工作台',
    planStart: '2026-08-04',
    planEnd: '2026-08-06',
    status: '待开始',
    dependsOn: [],
  },
];

export const inboxItems: InboxItem[] = [
  {
    id: 'I001',
    source: '微信',
    text: '北城医院那个食堂项目，客户希望增加营养餐台账，需要按科室汇总，月底要上线。',
    receivedAt: '2026-08-02 09:12',
    category: '售前需求',
    confidence: 0.92,
    status: '已识别',
  },
  {
    id: 'I002',
    source: '微信',
    text: '华东园区那边说一卡通余额不对，怀疑是同步失败，帮忙看下。',
    receivedAt: '2026-08-02 10:40',
    category: '缺陷反馈',
    confidence: 0.87,
    status: '已识别',
  },
];

export const knowledgeCandidates: KnowledgeCandidate[] = [
  {
    id: 'K001',
    title: '医院食堂项目通常需要独立的营养餐结算台账',
    category: '客户事实',
    confidence: 0.91,
    source: '历史方案样本',
    status: '待审核',
  },
  {
    id: 'K002',
    title: '园区一卡通项目必须校验余额同步补偿机制',
    category: '产品规则',
    confidence: 0.84,
    source: '缺陷记录',
    status: '待审核',
  },
];

export const documentDrafts: DocumentDraft[] = [
  {
    id: 'D001',
    project: '北城医科大学食堂平台',
    type: 'Word',
    name: '售前方案-2026-08-02.docx',
    status: '待生成',
    path: 'D:\\客户资料\\北城医科大学\\交付物',
    updatedAt: '2026-08-02',
  },
  {
    id: 'D002',
    project: '华东国企园区收银升级',
    type: 'Excel',
    name: '功能清单-2026-08-02.xlsx',
    status: '已生成',
    path: 'D:\\客户资料\\华东国企园区\\交付物',
    updatedAt: '2026-08-02',
  },
];

export const reconciliationRows: ReconciliationRow[] = [
  {
    date: '2026-07-01',
    systemAmount: 12800.5,
    providerAmount: 12800.5,
    difference: 0,
    status: '一致',
  },
  {
    date: '2026-07-02',
    systemAmount: 14320.0,
    providerAmount: 14290.0,
    difference: -30,
    status: '差异',
  },
];
