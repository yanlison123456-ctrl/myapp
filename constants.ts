
import { Notice } from './types';

export const INITIAL_NOTICES: Notice[] = [
  {
    id: '1',
    title: '关于开展全警年度健康体检的通知',
    content: '为切实保障民辅警身体健康，分局决定于本月起分批次开展年度体检。请各单位按计划表组织人员前往指定医院。',
    category: '健康关爱',
    createdAt: Date.now() - 86400000 * 1,
    author: '政治处'
  },
  {
    id: '2',
    title: '民警之家心理咨询预约通道开启',
    content: '近期基层勤务较重，为缓解同志们心理压力，心理健康中心现开放一对一在线预约服务，保护隐私，竭诚服务。',
    category: '心理疏导',
    createdAt: Date.now() - 3600000 * 8,
    author: '心理中心'
  },
  {
    id: '3',
    title: '惠警购：专属生活优待政策更新',
    content: '本季度新增3家签约合作商超，全体在职及离退休民辅警持有效证件可享受专属团购价格，详情点击查看清单。',
    category: '生活福利',
    createdAt: Date.now() - 1000000,
    author: '后勤保障部'
  }
];

export const DEFAULT_CATEGORIES = ['健康关爱', '心理疏导', '生活福利', '荣誉激励', '家属优待'];
export const STORAGE_KEY = 'hjnj_app_data';
export const AUTH_KEY = 'hjnj_auth_state';
